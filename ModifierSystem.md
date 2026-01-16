# Centralized Modifier System Design

## Overview
This document outlines a scalable, centralized system for managing and applying modifiers (effects) to resources, buildings, and other entities in a simulation or incremental game.

---

## Key Concepts

### 1. Modifier Interface
```typescript
interface Modifier {
  id: string;
  target: string; // e.g., 'resource.atp', 'building.factory'
  type: 'add' | 'multiply' | 'set';
  value: number;
  source?: string; // e.g., building id
  order: number;   // Lower numbers apply first
}
```

### 2. Modifier Sources
- **Buildings**: Each building instance can have one or more modifiers.
- **Upgrades**: Purchased upgrades can provide modifiers.
- **Other**: Events, research, etc.


### 3. Central Active Modifiers Map
A single class or module maintains a central `activeModifiers` map (object or ES6 Map) of all currently active modifiers, keyed by their unique `id`. This allows:
- Fast lookup, addition, and removal of modifiers (O(1) operations)
- No duplicate modifier effects (each id is unique)
- Easy enabling/disabling as game state changes

When a modifier is activated (e.g., building constructed, upgrade purchased), it is added or updated in `activeModifiers`. When deactivated, it is removed. When applying effects, simply iterate over the values in `activeModifiers`.

#### Efficient Existence Check
To check if a modifier with a given id exists:

**If using a plain object:**
```typescript
if (activeModifiers.hasOwnProperty('atp')) { /* ... */ }
```
**If using a Map:**
```typescript
if (activeModifiers.has('atp')) { /* ... */ }
```
Using a Map is generally preferred for large or dynamic collections.

---

## Example Pseudocode

### Data Structures
```typescript
interface Building {
  id: string;
  count: number;
  modifiers: Modifier[];
}

interface Upgrade {
  id: string;
  purchased: boolean;
  modifiers: Modifier[];
}

interface GameState {
  resources: Record<string, number>;
  buildings: Building[];
  upgrades: Upgrade[];
}
```


### ModifierManager Class (with Active Modifiers Map)
```typescript
class ModifierManager {
  // Use a Map for fast lookup and no duplicates
  private activeModifiers: Map<string, Modifier> = new Map();

  activateModifier(mod: Modifier) {
    this.activeModifiers.set(mod.id, mod);
  }

  deactivateModifier(id: string) {
    this.activeModifiers.delete(id);
  }

  getModifiersForTarget(target: string): Modifier[] {
    return Array.from(this.activeModifiers.values())
      .filter(m => m.target === target)
      .sort((a, b) => a.order - b.order);
  }

  applyModifiers(baseValue: number, target: string, gameState: GameState): number {
    let value = baseValue;
    for (const mod of this.getModifiersForTarget(target)) {
      // If modifier depends on source (e.g., building count), check gameState here
      let effectiveValue = mod.value;
      if (mod.source) {
        // Example: multiply by building count if source is a building
        const building = gameState.buildings.find(b => b.id === mod.source);
        if (building) effectiveValue *= building.count;
      }
      if (mod.type === 'add') value += effectiveValue;
      else if (mod.type === 'multiply') value *= effectiveValue;
      else if (mod.type === 'set') value = effectiveValue;
    }
    return value;
  }
}
```

---

## Usage Example
```typescript
const manager = new ModifierManager(gameState);
const atpProduction = manager.applyModifiers(baseATPProduction, 'resource.atp');
```

---

## Benefits
- **Centralized logic**: All modifier application is handled in one place.
- **Extensible**: Add new sources or types of modifiers easily.
- **Deterministic**: Modifier order is explicit and predictable.

---

## Tips
- Use enums or union types for `type` and `target` for better type safety.
- Store as much as possible in data (JSON, etc.) for flexibility.
- Keep the ModifierManager stateless if possible, or pass in state as needed.

---

## See Also
- Entity-Component-System (ECS) pattern
- Data-driven game design
