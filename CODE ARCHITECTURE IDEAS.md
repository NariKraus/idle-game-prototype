# Code Architecture Ideas

A comprehensive guide to structuring an incremental game with modifiers, resources, and multi-stage saves. This document compares different approaches and provides concrete code examples in both JavaScript and TypeScript.

---

## Table of Contents

1. [Save File Structure](#save-file-structure)
2. [Definitions vs State](#definitions-vs-state)
3. [Building Effects & Conversions](#building-effects--conversions)
4. [Modifier System](#modifier-system)
5. [How Modifiers Get Created](#how-modifiers-get-created)
6. [Game Loop & Delta Time](#game-loop--delta-time)
7. [Offline Progress](#offline-progress)
8. [Architecture Comparisons](#architecture-comparisons)

---

## Save File Structure

### Philosophy

The save file should be **minimal** — only store values that actually change during gameplay. Everything else (costs, base rates, descriptions, formulas) lives in code as "definitions."

**Why?**
- Smaller save files = faster saves/loads
- Easier to update game balance without breaking saves
- Definitions can be versioned separately from save data
- No redundant data that can get out of sync

**What goes in the save:**
- Current resource amounts
- Building counts
- Which upgrades have been purchased (just IDs, not their effects)
- Timestamps (for offline calculation)
- Player choices (lineage, traits)

**What does NOT go in the save:**
- Building costs, effects, descriptions
- Upgrade effects
- Formulas
- UI state (usually)

### Multi-Stage Save Structure

Since your game spans multiple evolution stages, the save needs to accommodate both global metadata (your lineage choice persists forever) and per-stage data (cell stage resources don't matter once you're an animal).

```typescript
// TypeScript
interface GameSave {
  version: number;                    // For save migration when you update the game
  lastSaved: number;                  // Unix timestamp - needed for offline progress
  currentStage: 'cell' | 'animal' | 'plant' | 'fungal' | 'tribal' | '...';
  
  // Global metadata that persists across ALL stages forever
  meta: {
    lineage: 'animalculus' | 'phytozoa' | 'mycozoa' | null;
    traits: string[];                 // Accumulated choices: "warmonger", "pacifist", etc.
    evolutionaryPoints: number;       // Carried forward from previous stages
  };
  
  // Per-stage saves - only the current stage is "live"
  // Previous stages are kept as historical snapshots
  stages: {
    cell?: CellStageSave;
    animal?: AnimalStageSave;
    // ... future stages
  };
}

// Each stage has its own save structure tailored to its mechanics
interface CellStageSave {
  resources: {
    atp: number;
    nutrients: number;
    biomass: number;
    dna: number;
    waste: number;
    stability: number;
  };
  buildings: Record<string, number>;        // { "mitochondria": 5, "ribosome": 3 }
  buildingsEnabled: Record<string, boolean>; // { "mitochondria": true, "ribosome": false }
  upgrades: string[];                        // Just IDs: ["cristae_formation", "phospholipid_bilayer"]
  stats: {
    totalDnaEarned: number;                  // For achievements, unlocks
    maxWasteReached: number;
    mutationsTriggered: number;
  };
}
```

```javascript
// JavaScript equivalent - same structure, just no type annotations
const createDefaultSave = () => ({
  version: 1,
  lastSaved: Date.now(),
  currentStage: 'cell',
  meta: {
    lineage: null,
    traits: [],
    evolutionaryPoints: 0
  },
  stages: {
    cell: {
      resources: { atp: 10, nutrients: 5, biomass: 0, dna: 0, waste: 0, stability: 100 },
      buildings: {},
      buildingsEnabled: {},
      upgrades: [],
      stats: { totalDnaEarned: 0, maxWasteReached: 0, mutationsTriggered: 0 }
    }
  }
});
```

---

## Definitions vs State

### The Core Principle

**Definitions** = Static configuration that never changes during gameplay
**State** = Dynamic values that change as the player plays

These should be kept **completely separate** in your code. Definitions are essentially your "game design" expressed as data. State is the player's progress through that design.

### Why Separate Them?

1. **Balance changes are easy**: Change a cost in definitions, all players get the new cost
2. **Saves stay small**: Don't need to store "Mitochondria costs 8 Biomass" - that's in code
3. **Testing**: You can test definitions independently of game state
4. **Clarity**: Looking at a building definition shows you everything about that building

### Building Definitions

A building definition describes what a building IS and what it DOES at a base level. It doesn't know about upgrades or modifiers - those are applied elsewhere.

```typescript
// definitions/buildings.ts

interface BuildingDef {
  id: string;                                    // Unique identifier, matches key
  name: string;                                  // Display name
  description: string;                           // Tooltip/flavor text
  baseCost: Record<string, number>;              // { biomass: 8, atp: 5 }
  costScaling: number;                           // 1.15 = 15% more expensive each purchase
  wastePerSec: number;                           // How much waste this produces (can be negative)
  unlockCondition?: (state: GameState) => boolean; // When does this become visible/purchasable?
  effects: BuildingEffect[];                     // What this building does (see next section)
  canDisable: boolean;                           // Can player toggle this off?
}

// The actual definitions - this is where your game design lives
const BUILDINGS: Record<string, BuildingDef> = {
  mitochondria: {
    id: 'mitochondria',
    name: 'Mitochondria',
    description: 'The powerhouse of the cell. Generates ATP automatically.',
    baseCost: { biomass: 8, atp: 5 },
    costScaling: 1.15,
    wastePerSec: 0.2,
    unlockCondition: undefined,  // Always available
    effects: [
      { type: 'production', resource: 'atp', value: 1 },
      { type: 'capacity', resource: 'atp', value: 10 }
    ],
    canDisable: true
  },
  
  nucleus: {
    id: 'nucleus',
    name: 'Nucleus',
    description: 'The control center. Generates DNA and unlocks evolution paths.',
    baseCost: { biomass: 60, atp: 40, dna: 15 },
    costScaling: 1,            // No scaling - single purchase
    wastePerSec: 0.3,
    unlockCondition: (state) => state.stats.totalDnaEarned >= 15,
    effects: [
      { type: 'production', resource: 'dna', value: 0.5 },
      { type: 'capacitySet', resource: 'dna', value: 200 }  // Sets capacity to 200
    ],
    canDisable: false          // Core building, always on
  }
};
```

```javascript
// JavaScript version
const BUILDINGS = {
  mitochondria: {
    id: 'mitochondria',
    name: 'Mitochondria',
    description: 'The powerhouse of the cell. Generates ATP automatically.',
    baseCost: { biomass: 8, atp: 5 },
    costScaling: 1.15,
    wastePerSec: 0.2,
    unlockCondition: null,
    effects: [
      { type: 'production', resource: 'atp', value: 1 },
      { type: 'capacity', resource: 'atp', value: 10 }
    ],
    canDisable: true
  },
  
  nucleus: {
    id: 'nucleus',
    name: 'Nucleus',
    description: 'The control center. Generates DNA and unlocks evolution paths.',
    baseCost: { biomass: 60, atp: 40, dna: 15 },
    costScaling: 1,
    wastePerSec: 0.3,
    unlockCondition: (state) => state.stats.totalDnaEarned >= 15,
    effects: [
      { type: 'production', resource: 'dna', value: 0.5 },
      { type: 'capacitySet', resource: 'dna', value: 200 }
    ],
    canDisable: false
  }
};
```

---

## Building Effects & Conversions

### Effect Types

Buildings can have multiple effects. Each effect describes one thing the building does. Here are the main types:

```typescript
// All possible effect types
type BuildingEffect = 
  | ProductionEffect      // Generates a resource from nothing
  | CapacityEffect        // Adds to resource storage cap
  | CapacitySetEffect     // Sets resource cap to a specific value
  | ConversionEffect      // Transforms resources into other resources
  | ModifierEffect;       // Grants a modifier (rare - usually upgrades do this)

interface ProductionEffect {
  type: 'production';
  resource: string;       // Which resource to produce
  value: number;          // Amount per second per building
}

interface CapacityEffect {
  type: 'capacity';
  resource: string;       // Which resource's cap to increase
  value: number;          // Amount to add per building
}

interface CapacitySetEffect {
  type: 'capacitySet';
  resource: string;
  value: number;          // Set cap to this (doesn't stack)
}
```

### Conversions: The Flexible Approach

Conversions are trickier because they can involve:
- One input → one output (Ribosome: Nutrients → Biomass)
- Many inputs → one output (Hypothetical: Nutrients + ATP → Biomass)
- One input → many outputs (Hypothetical: Biomass → ATP + Waste byproduct)
- No inputs → many outputs (Chloroplast: Nothing → ATP + Nutrients)

Here's a flexible structure that handles all cases:

```typescript
interface ConversionEffect {
  type: 'conversion';
  inputs: ConversionIO[];    // What gets consumed (can be empty for pure production)
  outputs: ConversionIO[];   // What gets produced
  requireAll?: boolean;      // If true (default), need ALL inputs to run. If false, runs partially.
}

interface ConversionIO {
  resource: string;
  rate: number;              // Amount per second per building
}
```

### Conversion Examples

```typescript
// Ribosome: 1 Nutrient/sec → 0.5 Biomass/sec
// Simple 1:1 conversion
{
  type: 'conversion',
  inputs: [{ resource: 'nutrients', rate: 1 }],
  outputs: [{ resource: 'biomass', rate: 0.5 }]
}

// Hypothetical "Bio-Reactor": 2 Nutrients + 1 ATP → 3 Biomass
// Multiple inputs, single output
{
  type: 'conversion',
  inputs: [
    { resource: 'nutrients', rate: 2 },
    { resource: 'atp', rate: 1 }
  ],
  outputs: [{ resource: 'biomass', rate: 3 }]
}

// Hypothetical "Decomposer": 1 Biomass → 0.5 ATP + 0.3 Nutrients  
// Single input, multiple outputs
{
  type: 'conversion',
  inputs: [{ resource: 'biomass', rate: 1 }],
  outputs: [
    { resource: 'atp', rate: 0.5 },
    { resource: 'nutrients', rate: 0.3 }
  ]
}

// Chloroplast Precursor: Nothing → 0.8 ATP + 0.2 Nutrients
// Pure production (no inputs consumed)
{
  type: 'conversion',
  inputs: [],  // Empty = produces from nothing (sunlight, ambient chemicals, etc.)
  outputs: [
    { resource: 'atp', rate: 0.8 },
    { resource: 'nutrients', rate: 0.2 }
  ]
}
```

### Processing Conversions in the Game Loop

Here's how you'd actually process these conversions each tick:

```typescript
function processConversions(
  state: GameState, 
  buildings: Record<string, BuildingDef>,
  modifiers: ModifierRegistry,
  delta: number
): void {
  
  // Loop through each building type the player owns
  for (const [buildingId, count] of Object.entries(state.buildings)) {
    if (count <= 0) continue;                              // Skip if player owns none
    if (state.buildingsEnabled[buildingId] === false) continue;  // Skip if disabled
    
    const def = buildings[buildingId];
    const conversions = def.effects.filter(e => e.type === 'conversion') as ConversionEffect[];
    
    for (const conv of conversions) {
      // Step 1: Check if we have enough of ALL required inputs
      let canRun = true;
      if (conv.inputs.length > 0) {
        canRun = conv.inputs.every(input => 
          state.resources[input.resource] >= input.rate * delta * count
        );
      }
      
      if (!canRun && conv.requireAll !== false) {
        continue;  // Not enough inputs, skip this conversion
      }
      
      // Step 2: Calculate effective rate (might be limited by lowest input)
      // This handles partial operation if requireAll is false
      let effectiveRate = 1;
      if (conv.inputs.length > 0) {
        effectiveRate = Math.min(...conv.inputs.map(input => {
          const available = state.resources[input.resource];
          const needed = input.rate * delta * count;
          return needed > 0 ? Math.min(1, available / needed) : 1;
        }));
      }
      
      // Step 3: Consume inputs
      for (const input of conv.inputs) {
        const consumed = input.rate * delta * count * effectiveRate;
        state.resources[input.resource] -= consumed;
      }
      
      // Step 4: Produce outputs (this is where modifiers get applied!)
      for (const output of conv.outputs) {
        const baseOutput = output.rate * count * effectiveRate;
        
        // Apply any modifiers that affect this building's production of this resource
        const modifiedOutput = modifiers.calculate(
          `building.${buildingId}.production.${output.resource}`,
          baseOutput,
          state
        );
        
        state.resources[output.resource] = Math.min(
          state.resources[output.resource] + modifiedOutput * delta,
          getCapacity(state, output.resource)  // Don't exceed cap
        );
      }
    }
  }
}
```

```javascript
// JavaScript version - same logic, no types
function processConversions(state, buildings, modifiers, delta) {
  for (const [buildingId, count] of Object.entries(state.buildings)) {
    if (count <= 0) continue;
    if (state.buildingsEnabled[buildingId] === false) continue;
    
    const def = buildings[buildingId];
    const conversions = def.effects.filter(e => e.type === 'conversion');
    
    for (const conv of conversions) {
      let canRun = true;
      if (conv.inputs.length > 0) {
        canRun = conv.inputs.every(input => 
          state.resources[input.resource] >= input.rate * delta * count
        );
      }
      
      if (!canRun && conv.requireAll !== false) continue;
      
      let effectiveRate = 1;
      if (conv.inputs.length > 0) {
        effectiveRate = Math.min(...conv.inputs.map(input => {
          const available = state.resources[input.resource];
          const needed = input.rate * delta * count;
          return needed > 0 ? Math.min(1, available / needed) : 1;
        }));
      }
      
      for (const input of conv.inputs) {
        state.resources[input.resource] -= input.rate * delta * count * effectiveRate;
      }
      
      for (const output of conv.outputs) {
        const baseOutput = output.rate * count * effectiveRate;
        const modifiedOutput = modifiers.calculate(
          `building.${buildingId}.production.${output.resource}`,
          baseOutput,
          state
        );
        state.resources[output.resource] = Math.min(
          state.resources[output.resource] + modifiedOutput * delta,
          getCapacity(state, output.resource)
        );
      }
    }
  }
}
```

---

## Modifier System

### What Problem Does This Solve?

In an incremental game, everything affects everything else:
- Upgrades boost building output
- Mutations temporarily change production rates
- Evolution paths give permanent bonuses
- Events might halve your efficiency
- Stability penalties reduce all production

Without a system, you end up with spaghetti code like:

```javascript
// BAD - this gets unmaintainable fast
let atpRate = 0.1;
atpRate += mitoCount * 1;
if (hasUpgrade('cristae')) atpRate += mitoCount * 0.5;
if (hasUpgrade('electron_transport')) atpRate += mitoCount * 0.5;
if (activeMutation === 'metabolic_surge') atpRate *= 1.75;
if (hasEvolution('primitive_nerve')) atpRate *= 1.25;
if (stability < 75) atpRate *= 0.75;
// ... 50 more lines of this
```

A modifier system centralizes all these effects into a single, queryable registry.

### The Layered Approach

Modifiers are calculated in layers, applied in a specific order:

```
Final Value = Override OR ((Base + Flat) × (1 + Percent) × Multiplier)
```

| Layer | What It Does | Example | How They Stack |
|-------|--------------|---------|----------------|
| **Flat** | Add/subtract a fixed amount | "+0.5 ATP/sec" | All flats are summed together |
| **Percent** | Percentage increase/decrease | "+50% ATP production" | All percents are summed, then applied once |
| **Multiplier** | Multiply the result | "×1.25 all production" | All multipliers multiply together |
| **Override** | Replace the value entirely | "Set waste damage to 0" | Last override wins |

### Example Calculation

```
Base ATP production: 5/sec (from 5 Mitochondria)

Modifiers present:
- Flat +0.5 (from some upgrade)
- Percent +50% (from Cristae Formation)  
- Percent +75% (from Metabolic Surge mutation)
- Multiplier ×1.25 (from Primitive Nerve Cluster)

Calculation:
1. Start with base: 5
2. Add flats: 5 + 0.5 = 5.5
3. Sum percents: 50% + 75% = 125% = 1.25
4. Apply percent: 5.5 × (1 + 1.25) = 5.5 × 2.25 = 12.375
5. Apply multiplier: 12.375 × 1.25 = 15.47/sec

Final: 15.47 ATP/sec
```

### Modifier Interface

```typescript
type ModifierLayer = 'flat' | 'percent' | 'multiplier' | 'override';

interface Modifier {
  id: string;           // Unique identifier for this modifier instance
  source: string;       // What created it: 'upgrade:cristae' or 'mutation:surge'
  target: string;       // What it affects: 'production.atp' or 'building.mitochondria.production.atp'
  layer: ModifierLayer; // Which calculation layer
  value: number;        // The modifier value (0.5 for +50%, 1.25 for ×1.25)
  expiresAt?: number;   // Unix timestamp when this expires (undefined = permanent)
  condition?: (state: GameState) => boolean;  // Optional: only active when this returns true
}
```

### The Modifier Registry

This is the central class that stores and calculates modifiers:

```typescript
class ModifierRegistry {
  private modifiers: Map<string, Modifier> = new Map();

  // Add a modifier to the registry
  add(mod: Modifier): void {
    this.modifiers.set(mod.id, mod);
  }

  // Remove a modifier by ID
  remove(id: string): void {
    this.modifiers.delete(id);
  }

  // Remove all modifiers from a specific source
  removeBySource(source: string): void {
    for (const [id, mod] of this.modifiers) {
      if (mod.source === source) {
        this.modifiers.delete(id);
      }
    }
  }

  // Called every tick - removes expired modifiers
  tick(currentTime: number): void {
    for (const [id, mod] of this.modifiers) {
      if (mod.expiresAt && currentTime >= mod.expiresAt) {
        this.modifiers.delete(id);
      }
    }
  }

  // Get all modifiers affecting a specific target
  getForTarget(target: string, state: GameState): Modifier[] {
    const result: Modifier[] = [];
    for (const mod of this.modifiers.values()) {
      // Check if modifier applies to this target
      // 'production.atp' matches 'production.atp'
      // 'production' matches 'production.atp' (parent matches children)
      if (mod.target === target || target.startsWith(mod.target + '.')) {
        // Check condition if present
        if (!mod.condition || mod.condition(state)) {
          result.push(mod);
        }
      }
    }
    return result;
  }

  // The main calculation function
  calculate(target: string, baseValue: number, state: GameState): number {
    const mods = this.getForTarget(target, state);
    
    // Check for overrides first - they bypass all other calculation
    const overrides = mods.filter(m => m.layer === 'override');
    if (overrides.length > 0) {
      return overrides[overrides.length - 1].value;  // Last override wins
    }

    // Sum all flat modifiers
    const flatTotal = mods
      .filter(m => m.layer === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    
    // Sum all percent modifiers (they add together before being applied)
    const percentTotal = mods
      .filter(m => m.layer === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    
    // Multiply all multipliers together
    const multiplierTotal = mods
      .filter(m => m.layer === 'multiplier')
      .reduce((product, m) => product * m.value, 1);

    // Apply the formula: (base + flat) × (1 + percent) × multiplier
    return (baseValue + flatTotal) * (1 + percentTotal) * multiplierTotal;
  }
  
  // Debug helper - see all active modifiers
  debug(): void {
    console.log('Active Modifiers:');
    for (const [id, mod] of this.modifiers) {
      console.log(`  ${id}: ${mod.layer} ${mod.value} → ${mod.target}`);
    }
  }
}
```

```javascript
// JavaScript version
class ModifierRegistry {
  constructor() {
    this.modifiers = new Map();
  }

  add(mod) {
    this.modifiers.set(mod.id, mod);
  }

  remove(id) {
    this.modifiers.delete(id);
  }

  removeBySource(source) {
    for (const [id, mod] of this.modifiers) {
      if (mod.source === source) {
        this.modifiers.delete(id);
      }
    }
  }

  tick(currentTime) {
    for (const [id, mod] of this.modifiers) {
      if (mod.expiresAt && currentTime >= mod.expiresAt) {
        this.modifiers.delete(id);
      }
    }
  }

  getForTarget(target, state) {
    const result = [];
    for (const mod of this.modifiers.values()) {
      if (mod.target === target || target.startsWith(mod.target + '.')) {
        if (!mod.condition || mod.condition(state)) {
          result.push(mod);
        }
      }
    }
    return result;
  }

  calculate(target, baseValue, state) {
    const mods = this.getForTarget(target, state);
    
    const overrides = mods.filter(m => m.layer === 'override');
    if (overrides.length > 0) {
      return overrides[overrides.length - 1].value;
    }

    const flatTotal = mods
      .filter(m => m.layer === 'flat')
      .reduce((sum, m) => sum + m.value, 0);
    
    const percentTotal = mods
      .filter(m => m.layer === 'percent')
      .reduce((sum, m) => sum + m.value, 0);
    
    const multiplierTotal = mods
      .filter(m => m.layer === 'multiplier')
      .reduce((product, m) => product * m.value, 1);

    return (baseValue + flatTotal) * (1 + percentTotal) * multiplierTotal;
  }
  
  debug() {
    console.log('Active Modifiers:');
    for (const [id, mod] of this.modifiers) {
      console.log(`  ${id}: ${mod.layer} ${mod.value} → ${mod.target}`);
    }
  }
}
```

---

## How Modifiers Get Created

### Important: You Write Them Manually

**Modifiers are NOT auto-generated.** You write each modifier by hand as part of upgrade, mutation, or evolution definitions. The code then reads these definitions and creates the actual modifier objects at runtime.

This gives you complete control over:
- What each upgrade/mutation affects
- Which layer it uses (flat, percent, multiplier, override)
- The exact value
- Any conditions for when it applies

### The Mental Model

Think of it this way:

| Thing | Role | Creates Modifiers? |
|-------|------|-------------------|
| **Buildings** | Define BASE production values | ❌ No - they ARE the base |
| **Upgrades** | Permanently modify game values | ✅ Yes - you write these |
| **Mutations** | Temporarily modify game values | ✅ Yes - you write these |
| **Evolution Organelles** | Major permanent modifications | ✅ Yes - you write these |
| **Events/Weather** | Temporary world modifications | ✅ Yes - you write these |

### The Data Flow

Here's how it all connects:

```
┌─────────────────────────────────────────────────────────────────────┐
│                     CALCULATING ATP PER SECOND                       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  1. BASE PASSIVE: 0.1 ATP/sec (hardcoded constant)                  │
│                                                                      │
│  2. FROM BUILDINGS: Loop through owned Mitochondria                  │
│     └─ Read base production from BUILDINGS definition: 1 ATP/sec    │
│     └─ Player owns 5 Mitochondria                                   │
│     └─ Base building contribution: 5 × 1 = 5 ATP/sec                │
│                                                                      │
│  3. APPLY BUILDING-SPECIFIC MODIFIERS:                              │
│     └─ Query registry for 'building.mitochondria.production.atp'    │
│     └─ Found: "Cristae Formation" upgrade → +50% (percent layer)    │
│     └─ Modified per-mito rate: 1 × 1.5 = 1.5 ATP/sec                │
│     └─ Building contribution: 5 × 1.5 = 7.5 ATP/sec                 │
│                                                                      │
│  4. APPLY GLOBAL MODIFIERS:                                         │
│     └─ Query registry for 'production.atp'                          │
│     └─ Found: "Metabolic Surge" mutation → +75% (percent layer)     │
│     └─ Subtotal: (0.1 + 7.5) = 7.6                                  │
│     └─ After global mods: 7.6 × 1.75 = 13.3 ATP/sec                 │
│                                                                      │
│  5. APPLY STABILITY PENALTY: (not a modifier, direct calc)          │
│     └─ Stability at 60% → ×0.75 multiplier                          │
│     └─ Final: 13.3 × 0.75 = 9.975 ATP/sec                           │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

### Writing Upgrade Definitions

Each upgrade definition includes the modifiers it creates. **You write these by hand** — the `modifiers` array is where you specify exactly what the upgrade does.

When the player purchases the upgrade, your code reads these modifier definitions and adds them to the registry.

```typescript
// definitions/upgrades.ts

interface UpgradeDef {
  id: string;
  name: string;
  description: string;
  cost: Record<string, number>;
  unlockCondition?: (state: GameState) => boolean;
  
  // THE MODIFIERS THIS UPGRADE CREATES
  // You write these by hand for each upgrade!
  // The 'id' and 'source' fields are auto-filled when registered
  modifiers: Array<{
    target: string;           // What to affect
    layer: ModifierLayer;     // How to affect it
    value: number;            // The amount
    condition?: (state: GameState) => boolean;  // Optional condition
  }>;
}

const UPGRADES: Record<string, UpgradeDef> = {
  cristae_formation: {
    id: 'cristae_formation',
    name: 'Cristae Formation',
    description: 'Internal membrane folds increase Mitochondria efficiency by 50%.',
    cost: { biomass: 75, atp: 40 },
    unlockCondition: (state) => getBuildingCount(state, 'mitochondria') >= 3,
    
    // You manually specify what this upgrade does:
    modifiers: [
      {
        target: 'building.mitochondria.production.atp',  // What to affect
        layer: 'percent',                                 // How to affect it
        value: 0.5                                        // +50%
      }
    ]
  },
  
  electron_transport_chain: {
    id: 'electron_transport_chain',
    name: 'Electron Transport Chain',
    description: 'Further increases Mitochondria output by another 33%.',
    cost: { biomass: 150, atp: 80, dna: 15 },
    unlockCondition: (state) => state.upgrades.includes('cristae_formation'),
    
    modifiers: [
      {
        target: 'building.mitochondria.production.atp',
        layer: 'percent',
        value: 0.33   // +33% (stacks additively with cristae's +50% = +83% total)
      }
    ]
  },
  
  atp_synthase: {
    id: 'atp_synthase',
    name: 'ATP Synthase',
    description: 'Reduces Mitochondria waste output by 50%.',
    cost: { biomass: 300, atp: 150, dna: 50 },
    unlockCondition: (state) => state.upgrades.includes('electron_transport_chain'),
    
    modifiers: [
      {
        target: 'building.mitochondria.waste',
        layer: 'percent',
        value: -0.5   // -50% waste (negative percent = reduction)
      }
    ]
  },
  
  // Example of an upgrade with multiple modifiers
  primitive_nerve_cluster: {
    id: 'primitive_nerve_cluster',
    name: 'Primitive Nerve Cluster',
    description: 'Increases ALL resource generation by 25%.',
    cost: { biomass: 400, atp: 120, dna: 200 },
    unlockCondition: (state) => state.meta.lineage === 'animalculus',
    
    modifiers: [
      // This affects all production globally
      { target: 'production', layer: 'multiplier', value: 1.25 }
    ]
  }
};
```

### The Purchase Function

When the player buys an upgrade, you create actual modifier objects from its definition:

```typescript
function purchaseUpgrade(upgradeId: string, state: GameState, modifiers: ModifierRegistry): boolean {
  const upgrade = UPGRADES[upgradeId];
  if (!upgrade) return false;
  
  // Check if already owned
  if (state.upgrades.includes(upgradeId)) return false;
  
  // Check if can afford
  for (const [resource, cost] of Object.entries(upgrade.cost)) {
    if (state.resources[resource] < cost) return false;
  }
  
  // Check unlock condition
  if (upgrade.unlockCondition && !upgrade.unlockCondition(state)) return false;
  
  // === PURCHASE SUCCESSFUL ===
  
  // Deduct costs
  for (const [resource, cost] of Object.entries(upgrade.cost)) {
    state.resources[resource] -= cost;
  }
  
  // Mark as owned in save
  state.upgrades.push(upgradeId);
  
  // Register its modifiers in the registry
  for (let i = 0; i < upgrade.modifiers.length; i++) {
    const modDef = upgrade.modifiers[i];
    modifiers.add({
      id: `upgrade:${upgradeId}:${i}`,   // Auto-generate unique ID
      source: `upgrade:${upgradeId}`,     // Track where it came from
      target: modDef.target,
      layer: modDef.layer,
      value: modDef.value,
      condition: modDef.condition
      // No expiresAt = permanent modifier
    });
  }
  
  return true;
}
```

### Writing Mutation Definitions

Mutations work similarly, but with duration and instant effects:

```typescript
// definitions/mutations.ts

interface MutationDef {
  id: string;
  name: string;
  description: string;
  isPositive: boolean;
  duration?: number;           // Seconds (undefined = instant effect only)
  baseDnaReward: number;       // DNA granted when this triggers
  
  // Ongoing modifiers (active for duration)
  modifiers: Array<{
    target: string;
    layer: ModifierLayer;
    value: number;
  }>;
  
  // One-time effects (applied immediately)
  instantEffects?: Array<{
    type: 'grant' | 'remove';
    resource: string;
    amount: number;
  }>;
}

const MUTATIONS: Record<string, MutationDef> = {
  metabolic_surge: {
    id: 'metabolic_surge',
    name: 'Metabolic Surge',
    description: 'ATP generation increased by 75% for 30 seconds.',
    isPositive: true,
    duration: 30,
    baseDnaReward: 5,
    
    // This modifier will be active for 30 seconds
    modifiers: [
      {
        target: 'production.atp',    // Affects ALL ATP production globally
        layer: 'percent',
        value: 0.75
      }
    ]
  },
  
  nutrient_bloom: {
    id: 'nutrient_bloom',
    name: 'Nutrient Bloom',
    description: 'Instantly gain 75 Nutrients.',
    isPositive: true,
    duration: undefined,  // No duration - instant only
    baseDnaReward: 5,
    
    modifiers: [],  // No ongoing modifiers
    instantEffects: [
      { type: 'grant', resource: 'nutrients', amount: 75 }
    ]
  },
  
  toxic_buildup: {
    id: 'toxic_buildup',
    name: 'Toxic Buildup',
    description: 'Instantly gain 100 Waste. Grants bonus DNA.',
    isPositive: false,
    duration: undefined,
    baseDnaReward: 10,  // Extra DNA as compensation for the penalty
    
    modifiers: [],
    instantEffects: [
      { type: 'grant', resource: 'waste', amount: 100 }
    ]
  },
  
  metabolic_crash: {
    id: 'metabolic_crash',
    name: 'Metabolic Crash',
    description: 'ATP generation reduced by 50% for 25 seconds.',
    isPositive: false,
    duration: 25,
    baseDnaReward: 7,  // Extra DNA as compensation
    
    modifiers: [
      {
        target: 'production.atp',
        layer: 'percent',
        value: -0.5   // -50% (negative = reduction)
      }
    ]
  }
};
```

### Triggering a Mutation

```typescript
function triggerMutation(mutationId: string, state: GameState, modifiers: ModifierRegistry): void {
  const mutation = MUTATIONS[mutationId];
  if (!mutation) return;
  
  const now = Date.now();
  
  // Award base DNA
  state.resources.dna += mutation.baseDnaReward;
  state.stats.totalDnaEarned += mutation.baseDnaReward;
  state.stats.mutationsTriggered++;
  
  // Apply instant effects immediately
  if (mutation.instantEffects) {
    for (const effect of mutation.instantEffects) {
      if (effect.type === 'grant') {
        state.resources[effect.resource] += effect.amount;
      } else if (effect.type === 'remove') {
        state.resources[effect.resource] = Math.max(0, 
          state.resources[effect.resource] - effect.amount
        );
      }
    }
  }
  
  // Register temporary modifiers (if any)
  if (mutation.duration && mutation.modifiers.length > 0) {
    const expiresAt = now + mutation.duration * 1000;  // Convert to milliseconds
    
    for (let i = 0; i < mutation.modifiers.length; i++) {
      const modDef = mutation.modifiers[i];
      modifiers.add({
        id: `mutation:${mutationId}:${now}:${i}`,  // Unique per trigger instance
        source: `mutation:${mutationId}`,
        target: modDef.target,
        layer: modDef.layer,
        value: modDef.value,
        expiresAt: expiresAt  // Will auto-remove when this timestamp is reached
      });
    }
  }
  
  // Notify UI
  showMutationPopup(mutation);
}
```

### Conditional Modifiers (Evolution Example)

Some modifiers should only be active under certain conditions. For example, the Hyphal Thread should only negate waste damage if the player owns it AND it hasn't been sold:

```typescript
const EVOLUTION_ORGANELLES = {
  hyphal_thread: {
    id: 'hyphal_thread',
    name: 'Hyphal Thread',
    path: 'mycozoa',
    tier: 1,
    cost: { biomass: 100, atp: 30, dna: 15 },
    
    modifiers: [
      {
        target: 'stability.wasteDamage',
        layer: 'override',
        value: 0,  // Set waste damage to 0
        // This modifier only active while player owns the building
        condition: (state) => getBuildingCount(state, 'hyphal_thread') > 0
      }
    ]
  }
};
```

The `condition` function is checked every time the modifier is queried. If it returns `false`, the modifier is ignored for that calculation.

---

## Game Loop & Delta Time

### Why Fixed Timestep?

At 20-24 ticks per second, you want consistent game logic regardless of frame rate. The "fixed timestep with accumulator" pattern ensures:

- Game runs at same speed on fast and slow computers
- Physics/math is deterministic and predictable
- Rendering can happen at any rate (smooth on high refresh monitors)
- No weird behavior from lag spikes

### The Pattern Explained

```typescript
class GameLoop {
  private readonly TICK_RATE = 20;                          // Ticks per second
  private readonly TICK_DURATION = 1000 / this.TICK_RATE;   // 50ms per tick
  
  private lastTime: number = 0;
  private accumulator: number = 0;  // Tracks "leftover" time between ticks
  private running: boolean = false;
  
  constructor(
    private game: Game,           // Your game logic
    private render: () => void    // Your UI update function
  ) {}

  start(): void {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop(): void {
    this.running = false;
  }

  private loop(currentTime: number): void {
    if (!this.running) return;

    // How much real time has passed since last frame?
    const elapsed = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += elapsed;

    // Process as many fixed ticks as we've accumulated time for
    // Example: If 120ms passed, we process 2 ticks (at 50ms each) and keep 20ms for next frame
    while (this.accumulator >= this.TICK_DURATION) {
      this.game.tick(this.TICK_DURATION / 1000);  // Pass delta in SECONDS (0.05)
      this.accumulator -= this.TICK_DURATION;
    }

    // Render every frame for smooth visuals
    // Rendering reads current state but doesn't modify it
    this.render();

    // Schedule next frame
    requestAnimationFrame(this.loop.bind(this));
  }
}
```

```javascript
// JavaScript version
class GameLoop {
  constructor(game, render) {
    this.TICK_RATE = 20;
    this.TICK_DURATION = 1000 / this.TICK_RATE;
    this.lastTime = 0;
    this.accumulator = 0;
    this.running = false;
    this.game = game;
    this.render = render;
  }

  start() {
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame(this.loop.bind(this));
  }

  stop() {
    this.running = false;
  }

  loop(currentTime) {
    if (!this.running) return;

    const elapsed = currentTime - this.lastTime;
    this.lastTime = currentTime;
    this.accumulator += elapsed;

    while (this.accumulator >= this.TICK_DURATION) {
      this.game.tick(this.TICK_DURATION / 1000);
      this.accumulator -= this.TICK_DURATION;
    }

    this.render();
    requestAnimationFrame(this.loop.bind(this));
  }
}
```

### The Tick Method

Each tick processes one "step" of game time. The `delta` parameter is how many seconds this tick represents (0.05 for 20 ticks/sec).

```typescript
class Game {
  tick(delta: number): void {
    // delta is in seconds (0.05 for 20 ticks/sec)
    const state = this.state;
    const now = Date.now();

    // 1. Housekeeping - remove expired modifiers
    this.modifiers.tick(now);

    // 2. Calculate all production rates
    // These methods internally use the modifier registry
    const rates = {
      atp: this.calculateAtpRate(),
      nutrients: this.calculateNutrientRate(),
      biomass: this.calculateBiomassRate(),
      dna: this.calculateDnaRate(),
      waste: this.calculateWasteRate(),
      stability: this.calculateStabilityRate()
    };

    // 3. Apply simple production (capped at capacity)
    state.resources.atp = Math.min(
      state.resources.atp + rates.atp * delta,
      this.getCapacity('atp')
    );
    state.resources.nutrients = Math.min(
      state.resources.nutrients + rates.nutrients * delta,
      this.getCapacity('nutrients')
    );
    // ... similar for other resources with caps

    // 4. Process conversions (consumes inputs, produces outputs)
    // This is separate because it has input/output relationships
    this.processConversions(delta);

    // 5. Update waste (no cap - can grow infinitely)
    state.resources.waste = Math.max(0, state.resources.waste + rates.waste * delta);

    // 6. Update stability (capped 0-100)
    state.resources.stability = Math.max(0, Math.min(100,
      state.resources.stability + rates.stability * delta
    ));

    // 7. Check for random events (mutations)
    this.checkMutations(delta);

    // 8. Update stats for achievements/unlocks
    state.stats.maxWasteReached = Math.max(state.stats.maxWasteReached, state.resources.waste);
  }
  
  private calculateAtpRate(): number {
    // Start with passive base
    let base = 0.1;
    
    // Add production from each enabled mitochondria
    const mitoCount = this.getActiveBuildingCount('mitochondria');
    const mitoBaseProd = BUILDINGS.mitochondria.effects
      .find(e => e.type === 'production')?.value ?? 0;
    
    // Apply building-specific modifiers
    const mitoModified = this.modifiers.calculate(
      'building.mitochondria.production.atp',
      mitoBaseProd,
      this.state
    );
    base += mitoCount * mitoModified;
    
    // Apply global ATP modifiers
    const globalModified = this.modifiers.calculate('production.atp', base, this.state);
    
    // Apply stability penalty (not a modifier, direct calculation)
    return globalModified * this.getStabilityMultiplier();
  }
}
```

---

## Offline Progress

### The Approach

When the player returns after being away, calculate what they would have earned. Using tiered efficiency (like Evolve Idle) prevents abuse while still rewarding players for coming back.

### Efficiency Tiers

The longer you're away, the less efficient your gains. This prevents offline being strictly better than playing.

```typescript
class OfflineCalculator {
  // Maximum time to calculate (prevents extreme gains)
  private readonly MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;  // 24 hours
  
  // Efficiency decreases the longer you're away
  private readonly EFFICIENCY_CURVE = [
    { upTo: 5 * 60 * 1000, rate: 1.0 },      // First 5 min: 100% efficiency
    { upTo: 30 * 60 * 1000, rate: 0.75 },    // 5-30 min: 75% efficiency
    { upTo: 2 * 60 * 60 * 1000, rate: 0.5 }, // 30min-2hr: 50% efficiency
    { upTo: Infinity, rate: 0.25 }            // 2hr+: 25% efficiency
  ];

  calculate(game: Game, lastSaved: number): OfflineReport {
    const now = Date.now();
    const rawOfflineMs = now - lastSaved;
    const offlineMs = Math.min(rawOfflineMs, this.MAX_OFFLINE_MS);
    
    // First, expire any temporary modifiers that would have ended while away
    game.modifiers.tick(now);
    
    // Calculate "effective seconds" accounting for efficiency tiers
    let effectiveSeconds = 0;
    let remainingMs = offlineMs;
    let cursor = 0;
    
    for (const tier of this.EFFICIENCY_CURVE) {
      const tierDuration = Math.min(remainingMs, tier.upTo - cursor);
      if (tierDuration <= 0) break;
      
      effectiveSeconds += (tierDuration / 1000) * tier.rate;
      remainingMs -= tierDuration;
      cursor = tier.upTo;
    }

    // Snapshot current production rates (using state at time of return)
    const rates = {
      atp: game.calculateAtpRate(),
      nutrients: game.calculateNutrientRate(),
      biomass: game.calculateBiomassRate(),
      dna: game.calculateDnaRate(),
      waste: game.calculateWasteRate()
    };

    // Simple linear calculation
    // Note: This doesn't simulate stability changes, mutations, etc.
    // For a short stage like Cell, this is probably fine
    const gains = {
      atp: Math.min(rates.atp * effectiveSeconds, game.getCapacity('atp') - game.state.resources.atp),
      nutrients: Math.min(rates.nutrients * effectiveSeconds, game.getCapacity('nutrients') - game.state.resources.nutrients),
      biomass: Math.min(rates.biomass * effectiveSeconds, game.getCapacity('biomass') - game.state.resources.biomass),
      dna: Math.min(rates.dna * effectiveSeconds, game.getCapacity('dna') - game.state.resources.dna),
      waste: rates.waste * effectiveSeconds  // Waste has no cap
    };

    return {
      rawOfflineMs,
      effectiveSeconds,
      efficiency: effectiveSeconds / (offlineMs / 1000),
      gains
    };
  }
}
```

```javascript
// JavaScript version
class OfflineCalculator {
  constructor() {
    this.MAX_OFFLINE_MS = 24 * 60 * 60 * 1000;
    this.EFFICIENCY_CURVE = [
      { upTo: 5 * 60 * 1000, rate: 1.0 },
      { upTo: 30 * 60 * 1000, rate: 0.75 },
      { upTo: 2 * 60 * 60 * 1000, rate: 0.5 },
      { upTo: Infinity, rate: 0.25 }
    ];
  }

  calculate(game, lastSaved) {
    const now = Date.now();
    const rawOfflineMs = now - lastSaved;
    const offlineMs = Math.min(rawOfflineMs, this.MAX_OFFLINE_MS);
    
    game.modifiers.tick(now);
    
    let effectiveSeconds = 0;
    let remainingMs = offlineMs;
    let cursor = 0;
    
    for (const tier of this.EFFICIENCY_CURVE) {
      const tierDuration = Math.min(remainingMs, tier.upTo - cursor);
      if (tierDuration <= 0) break;
      
      effectiveSeconds += (tierDuration / 1000) * tier.rate;
      remainingMs -= tierDuration;
      cursor = tier.upTo;
    }

    const rates = {
      atp: game.calculateAtpRate(),
      nutrients: game.calculateNutrientRate(),
      biomass: game.calculateBiomassRate(),
      dna: game.calculateDnaRate(),
      waste: game.calculateWasteRate()
    };

    const gains = {
      atp: Math.min(rates.atp * effectiveSeconds, game.getCapacity('atp') - game.state.resources.atp),
      nutrients: Math.min(rates.nutrients * effectiveSeconds, game.getCapacity('nutrients') - game.state.resources.nutrients),
      biomass: Math.min(rates.biomass * effectiveSeconds, game.getCapacity('biomass') - game.state.resources.biomass),
      dna: Math.min(rates.dna * effectiveSeconds, game.getCapacity('dna') - game.state.resources.dna),
      waste: rates.waste * effectiveSeconds
    };

    return { rawOfflineMs, effectiveSeconds, efficiency: effectiveSeconds / (offlineMs / 1000), gains };
  }
}
```

### Using It On Load

```typescript
function loadGame(): void {
  const save = loadSaveFromStorage();
  if (!save) {
    // New game
    startNewGame();
    return;
  }
  
  const game = new Game(save);
  
  // Calculate and apply offline progress
  const offlineCalc = new OfflineCalculator();
  const report = offlineCalc.calculate(game, save.lastSaved);
  
  // Only show popup if meaningfully away
  if (report.effectiveSeconds > 60) {
    game.applyOfflineGains(report.gains);
    showOfflinePopup(report);  // "While you were away, you gained..."
  }
  
  // Update save timestamp
  game.state.lastSaved = Date.now();
  
  // Start the game loop
  const loop = new GameLoop(game, () => renderUI(game));
  loop.start();
}
```

---

## Architecture Comparisons

### Option 1: Class-Based OOP

Best for TypeScript projects with complex state management.

```
src/
├── definitions/           # Static game data (you write these)
│   ├── buildings.ts
│   ├── upgrades.ts
│   ├── mutations.ts
│   └── index.ts          # Re-exports everything
├── core/                  # Game engine (the systems)
│   ├── types.ts          # All interfaces
│   ├── Game.ts           # Main game controller
│   ├── GameLoop.ts       # Fixed timestep loop
│   ├── GameState.ts      # State wrapper with helpers
│   ├── ModifierRegistry.ts
│   └── SaveManager.ts
├── stages/                # Stage-specific logic
│   ├── CellStage.ts
│   └── ...
├── ui/                    # Rendering (DOM manipulation)
│   └── render.ts
└── main.ts               # Entry point
```

**Pros:** Clear ownership, encapsulation, great IDE support, easy to navigate
**Cons:** More boilerplate, can feel over-engineered for simple features

### Option 2: Functional Modules

Better for simpler projects or plain JavaScript.

```
src/
├── definitions/
│   └── index.js          # All definitions in one place
├── state/
│   ├── create.js         # Factory for initial state
│   ├── selectors.js      # getAtpRate(state), etc.
│   └── actions.js        # purchaseBuilding(state, ...), etc.
├── systems/
│   ├── production.js     # tickProduction(state, delta)
│   ├── modifiers.js      # The registry
│   └── mutations.js      # Mutation logic
├── loop.js
└── main.js
```

**Pros:** Simpler, easier to test pure functions, no `this` confusion
**Cons:** State passed as argument everywhere, less obvious where things live

### Option 3: Hybrid (Recommended)

Use classes for **stateful systems** (ModifierRegistry, GameLoop) and pure functions for **calculations**.

```typescript
// Pure function - easy to test, no side effects, predictable
function calculateAtpRate(
  state: GameState,
  modifiers: ModifierRegistry,
  buildings: typeof BUILDINGS
): number {
  let base = 0.1;
  const mitoCount = getActiveBuildingCount(state, 'mitochondria');
  const mitoBase = buildings.mitochondria.effects
    .find(e => e.type === 'production')?.value ?? 0;
  
  const modifiedMitoRate = modifiers.calculate(
    'building.mitochondria.production.atp', 
    mitoBase, 
    state
  );
  base += mitoCount * modifiedMitoRate;
  
  const globalModified = modifiers.calculate('production.atp', base, state);
  return globalModified * getStabilityMultiplier(state);
}

// Class for coordination and state management
class Game {
  constructor(
    private state: GameState,
    private modifiers: ModifierRegistry
  ) {}

  tick(delta: number): void {
    // Use pure functions for calculations
    const atpRate = calculateAtpRate(this.state, this.modifiers, BUILDINGS);
    
    // Mutate state in one place
    this.state.resources.atp += atpRate * delta;
  }
}
```

**Pros:** Best of both worlds - testable calculations, organized state management
**Cons:** Need to be consistent about what's a function vs a method

---

## TypeScript vs JavaScript?

| Factor | TypeScript | JavaScript |
|--------|------------|------------|
| **Modifier targets** | Typos caught at compile time | Runtime errors only |
| **Save structure** | Interface changes = compiler errors | Easy to miss breaking changes |
| **IDE support** | Excellent autocomplete everywhere | Good with JSDoc comments |
| **Build step** | Required (tsc, webpack, etc.) | Optional (can run directly) |
| **Learning curve** | Higher if unfamiliar | Lower |
| **Refactoring safety** | Very safe | Risky on large changes |

### Recommendation

For a project with:
- Complex modifier interactions
- Multiple evolution stages
- Long-term maintenance planned

**TypeScript is worth the extra setup.** The modifier system especially benefits from type checking.

### Making Modifier Targets Safer

The string-based target system (`'building.mitochondria.production.atp'`) is the weak point in both languages. Typos won't be caught until runtime. Consider using constants:

```typescript
// constants/targets.ts
export const TARGETS = {
  PRODUCTION: {
    ATP: 'production.atp',
    NUTRIENTS: 'production.nutrients',
    BIOMASS: 'production.biomass',
    DNA: 'production.dna',
  },
  BUILDING: {
    MITOCHONDRIA: {
      PRODUCTION: { ATP: 'building.mitochondria.production.atp' },
      WASTE: 'building.mitochondria.waste'
    },
    RIBOSOME: {
      PRODUCTION: { BIOMASS: 'building.ribosome.production.biomass' }
    }
  },
  STABILITY: {
    REGEN: 'stability.regen',
    WASTE_DAMAGE: 'stability.wasteDamage'
  }
} as const;

// Usage - IDE autocomplete helps, typos are impossible
modifiers.add({
  id: 'upgrade:cristae',
  source: 'upgrade:cristae',
  target: TARGETS.BUILDING.MITOCHONDRIA.PRODUCTION.ATP,  // Autocompletes!
  layer: 'percent',
  value: 0.5
});
```

---

## Summary

1. **Save files** store only changing values (resources, building counts, upgrade IDs)
2. **Definitions** are static config (costs, base rates, descriptions) that you write
3. **Buildings** define BASE production - they don't create modifiers themselves
4. **Modifiers** are created by upgrades, mutations, events - **you write them manually** in the definitions
5. **The modifier registry** calculates final values using layers: `(base + flat) × (1 + percent) × multiplier`
6. **Game loop** uses fixed timestep (20 ticks/sec) for consistent behavior
7. **Offline progress** uses tiered efficiency to balance rewards vs active play

### The Key Insight

**Buildings say "I produce 1 ATP per second."**
**Modifiers say "ATP production is increased by 50%."**

They're separate concerns. Buildings define what exists. Modifiers define how it's changed. The game loop brings them together at calculation time.
