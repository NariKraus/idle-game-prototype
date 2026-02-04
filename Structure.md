# Game Architecture Overview

## 1. Definitions (Static Data)

- **BuildingDef**: Describes each building’s base properties and effects.
- **UpgradeDef**: Describes each upgrade, including what modifiers it creates.
- **MutationDef**: Describes each mutation, including temporary/permanent modifiers and instant effects.
- **EvolutionOrganelleDef**: Describes special organelles and their modifiers.
- **Effects**: (Production, Capacity, Conversion, etc.)—used by buildings.

> **Note:** Definitions are static and referenced by the game logic to know what exists and what each thing does.

---

## 2. GameState (Dynamic Data)

- **resources**: Current amounts of ATP, nutrients, biomass, DNA, waste, stability, etc.
- **buildings**: How many of each building the player owns.
- **buildingsEnabled**: Which buildings are currently enabled/disabled.
- **upgrades**: List of purchased upgrade IDs.
- **stats**: Achievement and unlock progress.
- **meta**: Lineage, traits, evolutionary points, etc.

> **Note:** GameState is the “live” data that changes as the player plays.

---

## 3. GameLoop (System)

- **tick(delta)**: Advances the game by a fixed timestep.
- **processConversions()**: Handles resource conversions for each building.
- **Other methods**: Calculate production, check for mutations, update stats, etc.

> **Note:** GameLoop reads and updates GameState, references Definitions, queries ModifierRegistry, and triggers Calculations.

---

## 4. ModifierRegistry (System)

- **modifiers**: A map of all active modifiers (from upgrades, mutations, organelles, events).
- **calculate(target, base, state)**: Computes the final value for a given target (e.g., ATP production), applying all relevant modifiers in the correct order (flat, percent, multiplier, override).

> **Note:** Modifiers are created by upgrades, mutations, organelles, and events.

---

## 5. Calculations (Functions)

- **production**: How much of each resource is generated per tick.
- **conversion**: How much of each resource is converted by buildings.
- **final rates**: The actual values after all modifiers are applied.

---

## 6. SaveFile (Persistence)

- **serializes GameState**: Only the dynamic GameState is saved (not Definitions or ModifierRegistry).
- **loaded from disk**: On load, GameState is restored and the game resumes.

---

## 7. Offline Calculator (Optional System)

- **calculate(game, lastSaved)**: Computes what the player would have earned while away, using tiered efficiency.

---

## 8. UI / Render

- Reads GameState to display current resources, buildings, upgrades, etc.
- Updates every frame or on state change.

---

## How They Connect

- **Definitions → GameState**: Referenced by (to know what’s possible)
- **GameState → GameLoop**: Read/write (GameLoop updates state)
- **GameLoop → ModifierRegistry**: Queries for active modifiers
- **ModifierRegistry → Calculations**: Used for (modifies all calculations)
- **GameLoop → Calculations**: Triggers calculations each tick
- **UpgradeDef/MutationDef/EvolutionOrganelleDef → ModifierRegistry**: Create modifiers when acquired/triggered
- **GameState → SaveFile**: Serialized to disk
- **SaveFile → GameState**: Loaded from disk
- **GameLoop → UI**: UI reads GameState to display info
- **Offline Calculator → GameState/ModifierRegistry**: Uses both to compute offline gains

---

## Example Flow

1. **Player buys an upgrade** → UpgradeDef creates a Modifier → ModifierRegistry stores it.
2. **GameLoop ticks** → Reads GameState, references Definitions, queries ModifierRegistry for current effects.
3. **Calculations** (production, conversion) are performed using base values from Definitions, modified by ModifierRegistry.
4. **GameState** is updated with new resource values.
5. **UI** displays updated GameState.
6. **GameState** is periodically saved to SaveFile.
