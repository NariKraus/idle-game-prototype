# Cell Stage Game Architecture

## Overview

This architecture separates concerns into three main components:

1. **Definitions** (`CellGameDefinitions.js`) - Static game data
2. **State** (`CellGameState.js`) - Player progress (saveable)
3. **Calculator** (`CellGameCalculator.js`) - Dynamic calculations and logic

## Key Design Principles

### 1. Separation of Data and Logic
- **Definitions** contain what *exists* in the game
- **State** contains what the player *has*
- **Calculator** determines what the player *can do* and *what effects are active*

### 2. Lazy Evaluation
The Calculator only computes values when requested, with caching for efficiency:
```javascript
const atp = gameCalc.getResource('atp'); // Calculates on-demand
console.log(atp.production); // Already cached
```

### 3. Immutable Definitions
Game definitions never change during gameplay. All dynamic behavior comes from:
- Current game state (building counts, upgrade purchases)
- Functions that calculate based on state
- Modifiers that transform base values

## Architecture Details

### Resource System

Resources have:
- **Base max** (from definition)
- **Current amount** (from state)
- **Effective max** (calculated: base + modifiers from buildings/upgrades)
- **Production rate** (calculated: sum of all building effects + modifiers)

```javascript
// Definition
RESOURCE_DEFINITIONS.atp = {
    baseMax: 100,
    // ...
};

// State
state.resources.atp = 45; // Current amount

// Calculated
gameCalc.getResource('atp') = {
    amount: 45,
    max: 200, // Base 100 + storage bonuses
    production: 3.5, // Sum of all building production
    percentFull: 0.225
};
```

### Building System

Buildings have:
- **Definition** (what it does when owned)
- **Count** (how many the player has)
- **Cost function** (can scale with count)
- **Unlock condition** (function checking game state)
- **Effects** (applied per building owned)

```javascript
BUILDING_DEFINITIONS.mitochondrion = {
    getCost: (count) => ({
        biomass: 25 * Math.pow(1.15, count) // Exponential scaling
    }),
    
    isUnlocked: (calc) => {
        return calc.getResource('biomass').amount >= 5;
    },
    
    effects: [
        {type: 'production', resource: 'atp', value: 4, method: 'add'},
        {type: 'storage', resource: 'atp', value: 50, method: 'add'},
    ],
};
```

### Modifier System

Modifiers transform base values and come from upgrades:

**Types of modifiers:**
1. **storage** - Modifies resource max capacity
2. **production** - Modifies base resource production
3. **buildingProduction** - Modifies specific building's production
4. **buildingStorage** - Modifies storage from specific buildings
5. **clickPower** - Modifies click resource gain
6. **conditionalProduction** - Applies only when condition is met

**Methods:**
- `add` - Adds to the value
- `mult` - Multiplies the value
- `set` - Sets the value (rarely used)

```javascript
// Example: Storage modifier (additive)
{
    type: 'storage',
    resource: 'atp',
    value: 100,
    method: 'add'
}
// ATP max = baseMax + 100

// Example: Production modifier (multiplicative)
{
    type: 'buildingProduction',
    building: 'chloroplast',
    resource: 'nutrients',
    value: 1.5,
    method: 'mult'
}
// Chloroplast production = base * 1.5

// Example: Conditional modifier
{
    type: 'conditionalProduction',
    building: 'lysosome',
    resource: 'atp',
    value: 1,
    method: 'add',
    condition: {
        type: 'resourceAbove',
        resource: 'biomass',
        threshold: 0.8 // 80% full
    }
}
// Only applies when biomass > 80% of max
```

### Upgrade System

Upgrades are one-time purchases that apply permanent modifiers:

```javascript
UPGRADE_DEFINITIONS.reinforcedMembrane = {
    getCost: () => ({biomass: 200, dna: 75}),
    
    isUnlocked: (calc) => {
        return calc.getBuilding('cellMembrane').count >= 1;
    },
    
    modifiers: [
        {type: 'storage', resource: 'atp', value: 2, method: 'mult'},
        // Doubles ATP storage
    ],
};
```

### Hidden Upgrades / Auto-Applied Effects

Some modifiers are automatically applied when conditions are met:

```javascript
// This "upgrade" is hidden from the player but automatically applies
// when thylakoid membrane is built
UPGRADE_DEFINITIONS.chloroplastBoost = {
    hidden: true,
    
    isUnlocked: (calc) => {
        return calc.getBuilding('thylakoidMembrane').count >= 1;
    },
    
    modifiers: [
        {
            type: 'buildingProduction',
            building: 'chloroplast',
            resource: 'nutrients',
            value: 1.5,
            method: 'mult'
        }
    ],
};
```

## Calculation Flow

### Resource Production Calculation

```
1. Start with base production = 0
2. For each building owned:
   a. Get building's base production effects
   b. Apply building-specific modifiers from upgrades
   c. Multiply by building count
   d. Add to total production
3. Apply conditional modifiers (if conditions met)
4. Return total production
```

### Resource Max Calculation

```
1. Start with base max from definition
2. For each building owned:
   a. Get building's storage effects
   b. Multiply by building count
   c. Apply to max
3. Apply global storage modifiers from upgrades
4. Apply building-specific storage modifiers
5. Return final max
```

## Common Patterns

### Pattern 1: Scaling Building Costs
```javascript
getCost: (count) => ({
    biomass: 25 * Math.pow(1.15, count)
})
```

### Pattern 2: Multi-Resource Unlock Conditions
```javascript
isUnlocked: (calc) => {
    return calc.getResource('biomass').amount >= 75 && 
           calc.getBuilding('mitochondrion').count >= 1;
}
```

### Pattern 3: Building Synergy
```javascript
// Thylakoid membrane boosts chloroplasts
modifiers: [
    {
        type: 'buildingProduction',
        building: 'chloroplast',
        resource: 'nutrients',
        value: 1.5,
        method: 'mult'
    }
]
```

### Pattern 4: Conditional Effects
```javascript
modifiers: [
    {
        type: 'conditionalProduction',
        building: 'lysosome',
        resource: 'atp',
        value: 1,
        method: 'add',
        condition: {
            type: 'resourceAbove',
            resource: 'biomass',
            threshold: 0.8
        }
    }
]
```

### Pattern 5: Cost Reduction
```javascript
// Negative cost = reduction
effects: [
    {
        type: 'production',
        resource: 'atp',
        value: 0.5, // Ribosome costs -1 ATP, upgrade adds 0.5
        method: 'add' // Result: -0.5 ATP (50% reduction)
    }
]
```

## Game Loop Integration

```javascript
// Initialize
const state = new CellGameState();
const calc = new CellGameCalculator(state);

// Game loop (60 FPS)
setInterval(() => {
    const deltaTime = 1/60; // seconds
    calc.tick(deltaTime);
    
    // Update UI
    updateResourceDisplay(calc.getResource('atp'));
    updateBuildingButtons(calc.getAllBuildings());
}, 1000/60);

// User actions
buyButton.onclick = () => {
    if (calc.purchaseBuilding('mitochondrion')) {
        // Success - UI updates on next frame
    }
};
```

## Save/Load System

```javascript
// Save
const saveData = gameState.toJSON();
localStorage.setItem('save', JSON.stringify(saveData));

// Load
const loadData = JSON.parse(localStorage.getItem('save'));
const state = new CellGameState();
state.fromJSON(loadData);
const calc = new CellGameCalculator(state);
```

## Adding New Content

### Adding a New Resource
1. Add to `RESOURCE_DEFINITIONS`
2. Add to `CellGameState.resources`
3. Done! Calculator handles the rest.

### Adding a New Building
1. Add to `BUILDING_DEFINITIONS` with effects
2. Add to `CellGameState.buildings`
3. No changes to Calculator needed!

### Adding a New Upgrade
1. Add to `UPGRADE_DEFINITIONS` with modifiers
2. Add to `CellGameState.upgrades`
3. Calculator automatically applies modifiers when purchased

## Performance Considerations

1. **Caching**: Expensive calculations cached until state changes
2. **Lazy evaluation**: Only calculate what's needed
3. **Invalidation**: Cache cleared on state changes (purchases, ticks)
4. **Batch operations**: Use `invalidateCache()` once after multiple state changes

## Testing

See `example-usage.js` for comprehensive examples of:
- Resource production
- Building purchases
- Upgrade effects
- Conditional modifiers
- Save/load system

## Future Extensions

This architecture easily supports:
- **Achievements**: Add condition checks in Calculator
- **Prestige**: Reset state, apply prestige multipliers as modifiers
- **Multiple stages**: Create new Definition/State/Calculator sets
- **Events**: Temporary modifiers with expiration
- **Milestones**: Unlock conditions based on achievements
- **Multi-resource costs**: Already supported in cost definitions
- **Complex formulas**: Use functions in effect calculations
