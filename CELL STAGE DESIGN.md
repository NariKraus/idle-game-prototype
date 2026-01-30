# CELL STAGE DESIGN DOCUMENT

## OVERVIEW

The Cell Stage represents the primordial beginning of life, where players guide a single-celled organism through the challenges of survival, growth, and evolution. Players will gather nutrients from the microscopic environment, build internal organelles to automate resource production, and manage metabolic waste while pursuing one of three distinct evolutionary lineages. This stage establishes the foundation for all future evolution—whether the player chooses to become a predatory animal, a photosynthetic plant-like organism, or a symbiotic fungal entity.

---

## Resources

### Core Resources

| Resource           | Purpose                                                                  | Starting Amount |
| ------------------ | ------------------------------------------------------------------------ | --------------- |
| **ATP**            | Primary energy currency for all actions and purchases                    | 10              |
| **Nutrients**      | Raw material absorbed from the environment, converted to other resources | 5               |
| **Biomass**        | Building material for constructing organelles and structures             | 0               |
| **DNA**            | Research currency for unlocking upgrades and evolution paths             | 0               |
| **Waste**          | Metabolic byproduct that damages Cell Stability                          | 0               |
| **Cell Stability** | Health/integrity of your cell; low values cause production penalties     | 100%            |

### Notes

**Passive Generation:**

- ATP generates passively at **0.1 per second** to prevent complete softlocks
- This represents the cell's baseline metabolism from ambient chemical gradients

**Default Maximum Capacity:**

- ATP: 100
- Nutrients: 100
- Biomass: 100
- DNA: 50
- Waste: **No maximum** (accumulates indefinitely)
- Cell Stability: **100%** (cannot exceed 100%)

**Capacity Increases:**

- ATP capacity can be increased by Mitochondria and Vacuoles
- Nutrients capacity can be increased by Vacuoles
- Biomass capacity can be increased by Vacuoles and the Cytoskeleton
- DNA capacity can be increased by the Nucleus

**Special Resource Behavior:**

- **Waste** has no cap and continuously accumulates from organelle activity
- Waste damages **Cell Stability** over time (see Cell Stability section)
- Higher Waste increases mutation chance, which can be beneficial for DNA generation

- **Cell Stability** regenerates slowly but is damaged by Waste accumulation
- Low Stability causes escalating production penalties
- Stability at 0% triggers "Crisis State" (severe debuffs, but not game over)

**Resource Interactions:**

- Nutrients → ATP (via manual Metabolize action or Mitochondria)
- Nutrients → Biomass (via manual Synthesize action or Ribosomes)
- Mutations → DNA (primary early-game DNA source)
- Nucleus → DNA (late-game passive generation)

---

## Manual Actions

### Absorb

- **Cost:** 1 ATP per click
- **Output:** 3 Nutrients per click
- **Description:** Extend pseudopods to absorb nutrients from the primordial soup. This is your primary method of gathering raw materials early game.

### Metabolize

- **Cost:** 2 Nutrients per click
- **Output:** 5 ATP per click
- **Description:** Break down nutrients through cellular respiration to generate energy. Essential for maintaining ATP supplies before acquiring Mitochondria.

### Synthesize

- **Cost:** 3 Nutrients + 2 ATP per click
- **Output:** 4 Biomass per click
- **Description:** Convert nutrients into structural proteins and lipids. The foundation of all cellular construction.

### Repair

- **Cost:** 5 ATP + 1 Biomass per click
- **Output:** Removes 10 Waste
- **Description:** Actively expel waste products and repair cellular damage. Becomes less efficient as your only waste management tool in mid-game.

---

## Buildings / Organelles

### Cell Membrane

- _Default Cost:_ **FREE** (Starting organelle)
- _Waste Production:_ None
- _Unlock Condition:_ None (always available)
- Provides the baseline structure for your cell. Each Cell Membrane increases **Nutrients absorption efficiency** and **Nutrients capacity by +20**.
- Absorption efficiency bonus uses diminishing returns: `10% × (1 - 0.95^count)` — approaches 200% asymptotically.
- Also provides **+0.5% Stability regeneration per second** per membrane (additive).

```javascript
[1, 5, 10, 20].forEach((c) => {
    let efficiencyBonus = 10 * (1 - Math.pow(0.95, c));
    console.log(`Cell Membranes: ${c}, Absorption Efficiency Bonus: ${efficiencyBonus.toFixed(2)}%`);
});
```

### Mitochondria

- _Default Cost:_ 8 Biomass, 5 ATP
- _Waste Production:_ 0.2 per second
- _Unlock Condition:_ None (starting)
- Generates **1 ATP per second** automatically.
- Each Mitochondria also increases ATP capacity by **+10**.
- The powerhouse of the cell—essential for automation.

### Ribosomes

- _Default Cost:_ 20 Biomass, 15 ATP
- _Waste Production:_ 0.15 per second
- _Unlock Condition:_ Own at least 1 Mitochondria
- Converts Nutrients into Biomass automatically at a rate of **0.5 Biomass per second** (consumes 1 Nutrient per second).
- Will pause if Nutrients reach 0.

### Vacuole

- _Default Cost:_ 25 Biomass, 10 ATP
- _Waste Production:_ None
- _Unlock Condition:_ None (starting)
- Increases storage capacity: **+50 Nutrients**, **+30 ATP**, **+25 Biomass**.
- Does not generate resources but essential for scaling.

### Flagellum

- _Default Cost:_ 30 Biomass, 20 ATP
- _Waste Production:_ 0.1 per second
- _Unlock Condition:_ Own at least 2 Cell Membranes
- Increases the output of the **Absorb** manual action by **+1 Nutrient per click**.
- Also provides **+0.3 Nutrients per second** passively (representing more efficient environmental exploration).

### Lysosome

- _Default Cost:_ 40 Biomass, 25 ATP
- _Waste Production:_ **-0.5 per second** (reduces waste)
- _Unlock Condition:_ Total Waste has reached 50 at any point
- Actively breaks down and recycles waste products.
- Each Lysosome reduces Waste by **0.5 per second**.
- Also converts 5% of removed Waste into Nutrients (0.025 Nutrients/sec per Lysosome).

### Cytoskeleton

- _Default Cost:_ 50 Biomass, 30 ATP
- _Waste Production:_ None
- _Unlock Condition:_ Own at least 3 Ribosomes
- Increases **Biomass capacity by +50**.
- Reduces Biomass costs of all organelles with diminishing returns: `1 - (1 / (1 + 0.08 × count))`
    - 1 Cytoskeleton: ~7.4% reduction
    - 5 Cytoskeletons: ~28.6% reduction
    - 10 Cytoskeletons: ~44.4% reduction
    - Approaches 100% asymptotically but never reaches it.

```javascript
[1, 5, 10].forEach((c) => {
    let reduction = 1 - 1 / (1 + 0.08 * c);
    console.log(`Cytoskeletons: ${c}, Cost Reduction: ${(reduction * 100).toFixed(2)}%`);
});
```

### Endoplasmic Reticulum

- _Default Cost:_ 60 Biomass, 40 ATP
- _Waste Production:_ 0.25 per second
- _Unlock Condition:_ Own at least 2 Ribosomes
- Increases Ribosome efficiency by **25%** (each Ribosome produces 0.625 Biomass/sec instead of 0.5).
- Effect stacks additively (+25% per ER owned).

### Nucleus

- _Default Cost:_ 60 Biomass, 40 ATP, 15 DNA
- _Waste Production:_ 0.3 per second
- _Unlock Condition:_ Have accumulated at least 15 DNA from mutations
- **Single purchase only.**
- Generates **0.5 DNA per second** passively.
- Increases DNA capacity to **200**.
- Unlocks Evolution Path organelles for purchase.
- Required for stage progression.

### Peroxisome

- _Default Cost:_ 75 Biomass, 50 ATP
- _Waste Production:_ **-0.3 per second** (reduces waste)
- _Unlock Condition:_ Own Nucleus
- Reduces Waste by **0.3 per second**.
- Additionally reduces the Waste production of all other organelles by **10%** (stacks multiplicatively).

### Chloroplast Precursor

- _Default Cost:_ 80 Biomass, 60 ATP
- _Waste Production:_ 0.1 per second
- _Unlock Condition:_ Own Nucleus
- Generates **0.8 ATP per second** and **0.2 Nutrients per second** without consuming any resources.
- Represents early photosynthetic capability.
- Synergizes with the Phytozoa evolution path.

---

## Evolution Paths

> **Important:** Only ONE path can be chosen per run. Once the first organelle of any path is purchased, the other two paths become permanently locked. All paths lead to Cellular Differentiation, but provide different bonuses for future stages.

### Path 1 — Animalculus Lineage

**Theme:** Predatory efficiency and aggressive resource consumption. This path favors active gameplay with powerful click bonuses and faster resource cycling.

**Organelles:**

1. **Predatory Cilia**
    - _Cost:_ 100 Biomass, 30 ATP, 15 DNA
    - _Waste Production:_ 0.4 per second
    - All manual actions have their output **doubled**.
    - Clicking "Absorb" now also generates 0.5 ATP.

2. **Digestive Vesicle**
    - _Cost:_ 200 Biomass, 60 ATP, 50 DNA
    - _Waste Production:_ 0.6 per second
    - Unlocks the **"Devour"** manual action: Costs 10 ATP, generates 15 Nutrients + 5 Biomass + 2 DNA.
    - Mitochondria generate **50% more ATP**.

3. **Primitive Nerve Cluster**
    - _Cost:_ 400 Biomass, 120 ATP, 200 DNA
    - _Waste Production:_ 1.0 per second
    - All resource generation increased by **25%**.
    - Unlocks **Cellular Differentiation** → Progress to Animal Stage.
    - Future Bonus: Animals start with +20% movement speed.

---

### Path 2 — Phytozoa Lineage

**Theme:** Sustainable growth through photosynthesis and passive resource generation. This path rewards patience with powerful idle bonuses and reduced waste.

**Organelles:**

1. **Thylakoid Membrane**
    - _Cost:_ 100 Biomass, 30 ATP, 15 DNA
    - _Waste Production:_ None
    - Chloroplast Precursors generate **100% more resources**.
    - Waste production from all sources reduced by **20%**.

2. **Starch Granule**
    - _Cost:_ 200 Biomass, 60 ATP, 50 DNA
    - _Waste Production:_ None
    - All storage capacities increased by **50%**.
    - Gain **0.1 Biomass per second** passively (photosynthetic growth).

3. **Cellulose Wall**
    - _Cost:_ 400 Biomass, 120 ATP, 200 DNA
    - _Waste Production:_ None
    - All passive generation increased by **50%**.
    - Waste production reduced by an additional **30%**.
    - Unlocks **Cellular Differentiation** → Progress to Plant Stage.
    - Future Bonus: Plants start with +50% natural resource capacity.

---

### Path 3 — Mycozoa Lineage

**Theme:** Symbiosis and recycling. This path turns waste from a penalty into a resource, with powerful synergies between organelles.

**Organelles:**

1. **Hyphal Thread**
    - _Cost:_ 100 Biomass, 30 ATP, 15 DNA
    - _Waste Production:_ 0.2 per second
    - **Cell Stability is no longer damaged by Waste** (neutralizes the penalty).
    - Gain passive DNA based on Waste: `0.05 × sqrt(Waste / 100)` DNA per second.
        - At 100 Waste: 0.05 DNA/sec
        - At 400 Waste: 0.1 DNA/sec
        - At 900 Waste: 0.15 DNA/sec

    - ```js
      [100, 400, 900].forEach((w) => {
          let dnaPerSec = 0.05 * Math.sqrt(w / 100);
          console.log(`Waste: ${w}, DNA/sec: ${dnaPerSec.toFixed(3)}`);
      });
      ```

2. **Spore Sac**
    - _Cost:_ 200 Biomass, 60 ATP, 50 DNA
    - _Waste Production:_ 0.3 per second
    - Every 60 seconds, releases spores that grant **50 Nutrients + 20 Biomass + 5 DNA**.
    - Spore release timer reduced by 1 second per 50 Waste (minimum 20 seconds).

3. **Mycelial Network**
    - _Cost:_ 400 Biomass, 120 ATP, 200 DNA
    - _Waste Production:_ 0.5 per second
    - All organelles have their effects increased based on Waste: `100 × (1 - 1/(1 + Waste/200))%`
        - At 100 Waste: +33% effects
        - At 200 Waste: +50% effects
        - At 500 Waste: +71% effects
        - At 1000 Waste: +83% effects (continues scaling infinitely with diminishing returns)
    - Lysosomes and Peroxisomes now generate **0.1 DNA per second** each.
    - Unlocks **Cellular Differentiation** → Progress to Fungal Stage.
    - Future Bonus: Fungi start with the ability to decompose defeated enemies for extra resources.
    - ```js
      [100, 200, 500, 1000].forEach((w) => {
          let effectBonus = 100 * (1 - 1 / (1 + w / 200));
          console.log(`Waste: ${w}, Effect Bonus: ${effectBonus.toFixed(2)}%`);
      });
      ```

---

## Upgrades

### Membrane Upgrades

- **Phospholipid Bilayer:**
    - _Cost:_ 50 Biomass, 25 ATP
    - _Unlock Condition:_ Own 3 Cell Membranes
    - Cell Membranes provide **+30 Nutrients capacity** instead of +20.

- **Selective Permeability:**
    - _Cost:_ 100 Biomass, 50 ATP
    - _Unlock Condition:_ Own Phospholipid Bilayer
    - Absorb action generates **+2 Nutrients per click** (5 total base).

- **Membrane Proteins:**
    - _Cost:_ 150 Biomass, 75 ATP, 10 DNA
    - _Unlock Condition:_ Own Selective Permeability
    - Cell Membranes now also provide **+5 ATP capacity** each.

---

### Mitochondria Upgrades

- **Cristae Formation:**
    - _Cost:_ 75 Biomass, 40 ATP
    - _Unlock Condition:_ Own 3 Mitochondria
    - Mitochondria generate **1.5 ATP per second** instead of 1.

- **Electron Transport Chain:**
    - _Cost:_ 150 Biomass, 80 ATP, 15 DNA
    - _Unlock Condition:_ Own Cristae Formation
    - Mitochondria generate **2 ATP per second** instead of 1.5.

- **ATP Synthase:**
    - _Cost:_ 300 Biomass, 150 ATP, 50 DNA
    - _Unlock Condition:_ Own Electron Transport Chain + Nucleus
    - Mitochondria Waste production reduced by **50%** (0.1/sec instead of 0.2).

---

### Ribosome Upgrades

- **Polyribosome Complex:**
    - _Cost:_ 80 Biomass, 50 ATP
    - _Unlock Condition:_ Own 3 Ribosomes
    - Ribosomes produce **0.75 Biomass per second** instead of 0.5.

- **mRNA Efficiency:**
    - _Cost:_ 120 Biomass, 60 ATP, 10 DNA
    - _Unlock Condition:_ Own Polyribosome Complex
    - Ribosomes consume only **0.75 Nutrients per second** instead of 1.

---

### Storage Upgrades

- **Vacuole Expansion:**
    - _Cost:_ 60 Biomass, 30 ATP
    - _Unlock Condition:_ Own 2 Vacuoles
    - Vacuoles provide **double storage bonuses** (+100 Nutrients, +60 ATP, +50 Biomass).

- **Tonoplast Reinforcement:**
    - _Cost:_ 120 Biomass, 60 ATP
    - _Unlock Condition:_ Own Vacuole Expansion
    - Vacuole cost reduced by **25%**.

---

### Waste Management Upgrades

- **Lysosomal Enzymes:**
    - _Cost:_ 100 Biomass, 50 ATP
    - _Unlock Condition:_ Own 2 Lysosomes
    - Lysosomes remove **0.75 Waste per second** instead of 0.5.

- **Autophagy Protocol:**
    - _Cost:_ 200 Biomass, 100 ATP, 25 DNA
    - _Unlock Condition:_ Own Lysosomal Enzymes + Nucleus
    - Lysosomes now convert **15%** of removed Waste to Nutrients (instead of 5%).

---

### Nucleus Upgrades

- **Histone Packaging:**
    - _Cost:_ 80 Biomass, 50 ATP, 20 DNA
    - _Unlock Condition:_ Own Nucleus
    - DNA capacity increased to **350**.

- **Transcription Factors:**
    - _Cost:_ 150 Biomass, 100 ATP, 40 DNA
    - _Unlock Condition:_ Own Histone Packaging
    - Nucleus generates **1.0 DNA per second** instead of 0.5.

- **Replication Fork:**
    - _Cost:_ 200 Biomass, 100 ATP, 80 DNA
    - _Unlock Condition:_ Own Transcription Factors
    - All DNA rewards from mutations **doubled**.

---

### General Upgrades

- **Metabolic Optimization:**
    - _Cost:_ 100 Biomass, 75 ATP
    - _Unlock Condition:_ Own Nucleus
    - All organelle costs reduced by **10%**.

- **Cellular Efficiency:**
    - _Cost:_ 200 Biomass, 100 ATP, 50 DNA
    - _Unlock Condition:_ Own Metabolic Optimization
    - Global Waste production reduced by **15%**.

---

## Extra Notes

### Building Toggles

Players can **enable or disable** organelle types to manage resource flow and Waste production.

**Toggle Rules:**
- Toggles work at the **collective level** (per building type, not individual buildings)
- One toggle controls all buildings of that type (e.g., "Mitochondria: ON/OFF")
- Toggling is **instant** with no cost or cooldown

**When Disabled:**
- Building stops all production (resources and Waste)
- Building still counts toward unlock requirements
- Building still contributes to capacity bonuses (storage, etc.)
- Visually grayed out in the UI

**Cannot Be Disabled:**
- **Nucleus** — Core progression building, always active
- **Cell Membrane** — Fundamental structure, always active

**Strategic Uses:**
| Situation | Action |
|-----------|--------|
| Stability crisis | Disable high-Waste producers (Mitochondria, ER) to recover |
| Nutrient shortage | Disable Ribosomes to stop draining Nutrients |
| Mycozoa Waste farming | Disable Lysosomes/Peroxisomes to let Waste climb |
| ATP capped | Disable Mitochondria to reduce unnecessary Waste |
| Mutation hunting | Enable everything, ride high Waste for DNA |

---

### Waste & Cell Stability

**Waste Generation:**

- Each organelle has a listed Waste Production rate (per second)
- Total Waste/sec = Sum of all organelle Waste Production values
- Lysosomes and Peroxisomes have negative values (reduce Waste)

**Cell Stability Mechanics:**

Cell Stability represents the overall health and integrity of your cell. It naturally regenerates but is damaged by accumulated Waste.

```
Stability Regeneration = 1.5% per second (base) + bonuses from Cell Membranes
Stability Damage = sqrt(Waste) × 0.1% per second
```

| Waste | Stability Damage/sec | Net Change (base regen) |
| ----- | -------------------- | ----------------------- |
| 0     | 0%                   | +1.5%/sec               |
| 100   | 1.0%                 | +0.5%/sec               |
| 225   | 1.5%                 | ±0%/sec (breakeven)     |
| 400   | 2.0%                 | -0.5%/sec               |
| 625   | 2.5%                 | -1.0%/sec               |
| 900   | 3.0%                 | -1.5%/sec               |

**Stability Thresholds:**

| Stability  | Effect                                                                  |
| ---------- | ----------------------------------------------------------------------- |
| 100% - 75% | No penalty — cell is healthy                                            |
| 74% - 50%  | **Strained** — All production reduced by 25%                            |
| 49% - 25%  | **Critical** — All production reduced by 50%, mutations always negative |
| 24% - 1%   | **Failing** — All production reduced by 75%, organelles randomly pause  |
| 0%         | **Crisis State** — Production stops, must manually click to recover     |

**Crisis State (0% Stability):**

- All passive generation stops completely
- Manual actions still work (at 50% efficiency)
- Waste continues to accumulate but Stability cannot go below 0%
- Recovery: Use Repair action or wait for Lysosomes to reduce Waste
- Once Waste drops enough for positive net regeneration, Stability begins recovering
- **Not a game over** — but a severe setback that requires active recovery

**Waste Benefits:**

- Higher Waste increases mutation chance (see Mutation Events)
- Mycozoa path converts Waste damage into bonuses
- Strategic Waste management creates meaningful risk/reward decisions

**Management Strategies:**

1. **Early Game:** Use manual Repair action sparingly; stay under 100 Waste to maintain positive Stability
2. **Mid Game:** Build Lysosomes to reduce Waste faster than it accumulates
3. **Late Game:** Peroxisomes reduce generation rate; stack Cell Membranes for extra regen
4. **Mycozoa Strategy:** Ignore Stability damage entirely and embrace high Waste for bonuses

---

### Mutation Events

**Trigger Conditions:**

```
Mutation Chance per Second = max(1, Waste / 100)%
```

- At 0 Waste: 1% per second (~1 mutation per 100 seconds)
- At 100 Waste: 1% per second (breakeven point)
- At 200 Waste: 2% per second (~1 mutation per 50 seconds)
- At 400 Waste: 4% per second (~1 mutation per 25 seconds)

**Grace Period:** No mutations occur in the first **30 seconds** of gameplay.

**Event Resolution:**

- When a mutation triggers, roll for positive (55%) or negative (45%)
- All mutations grant a base reward of **5 DNA**
- Some mutations grant additional DNA as part of their effect

**Positive Mutations (55% chance):**

| Mutation           | Effect                                              | Duration | Bonus DNA |
| ------------------ | --------------------------------------------------- | -------- | --------- |
| Metabolic Surge    | +75% ATP generation                                 | 30 sec   | —         |
| Nutrient Bloom     | Instantly gain 75 Nutrients                         | Instant  | —         |
| Growth Spurt       | +50% Biomass generation                             | 30 sec   | —         |
| Efficient Membrane | -50% Absorb ATP cost                                | 45 sec   | —         |
| Genetic Windfall   | Gain 10 bonus DNA                                   | Instant  | +10       |
| Waste Purge        | Remove 50 Waste instantly                           | Instant  | —         |
| Hypermetabolism    | All generation +25%                                 | 20 sec   | —         |
| Lucky Division     | Duplicate one random non-Nucleus organelle for free | Instant  | —         |

**Negative Mutations (45% chance):**

| Mutation            | Effect                             | Duration | Bonus DNA |
| ------------------- | ---------------------------------- | -------- | --------- |
| Metabolic Crash     | -50% ATP generation                | 25 sec   | +2        |
| Nutrient Drought    | Absorb generates -50% Nutrients    | 30 sec   | +2        |
| Protein Misfolding  | -50% Biomass generation            | 25 sec   | +2        |
| Membrane Leak       | Lose 3 Nutrients per second        | 20 sec   | +3        |
| Toxic Buildup       | +100 Waste instantly               | Instant  | +5        |
| Organelle Fatigue   | One random organelle stops working | 30 sec   | +4        |
| Energy Crisis       | ATP drains at 2/sec                | 15 sec   | +3        |
| Genetic Instability | -25% DNA generation                | 45 sec   | +5        |

**Purpose:**
Mutations serve as the **primary source of DNA** before acquiring the Nucleus. Players should aim to accumulate 25 DNA from mutations to purchase the Nucleus, which then provides stable DNA generation. The mutation system creates tension between wanting Waste for DNA and avoiding excessive cost penalties.

---

### Cellular Differentiation

**Unlock Requirement:** Purchase the final (third) organelle of any Evolution Path.

**What Happens:**

1. A "Cellular Differentiation" button appears
2. Clicking it shows a summary of your chosen lineage and accumulated bonuses
3. Confirming triggers the stage transition

**Transition Effects:**

- Your cell divides and begins forming a multicellular organism
- Resources are converted:
    - 10% of current ATP/Nutrients/Biomass carries forward as starting resources
    - All accumulated DNA converts to "Evolutionary Points" for the next stage
- Evolution Path bonuses are applied to the new stage
- A brief cutscene shows your cell multiplying and beginning differentiation

**New Stage Preview:**

- **Animalculus → Animal Stage:** Focus on predation, mobility, and combat
- **Phytozoa → Plant Stage:** Focus on territory control, passive growth, and defense
- **Mycozoa → Fungal Stage:** Focus on resource manipulation, symbiosis, and area control

---

### Cost Scaling

**Base Formula:**

```
Scaled Cost = Base Cost × (1.15 ^ Number Owned)
```

**Example — Mitochondria (Base: 8 Biomass, 5 ATP):**

| # Owned | Scaled Biomass | Scaled ATP |
| ------- | -------------- | ---------- |
| 0       | 8              | 5          |
| 1       | 9.2            | 5.75       |
| 2       | 10.58          | 6.61       |
| 3       | 12.17          | 7.60       |
| 5       | 16.09          | 10.06      |
| 10      | 32.36          | 20.23      |

**Cost Reduction Modifiers:**

- Cytoskeleton reduces Biomass costs with diminishing returns (see Cytoskeleton)
- Metabolic Optimization upgrade reduces all costs by 10%
- These reductions apply multiplicatively to the Scaled Cost

**Final Formula with Reductions:**

```
Final Cost = Scaled Cost × Cost Reduction Multiplier
```

> **Note:** Waste no longer affects costs directly. Instead, high Waste damages Cell Stability, which reduces production rates. This creates pressure to manage Waste without making purchases feel artificially inflated.

---

## Design Principles Summary

### Early Game (0-5 minutes)

- **Gameplay:** Manual clicking dominates; Absorb → Metabolize → Synthesize loop
- **Goals:** Purchase first Mitochondria and Ribosome for basic automation
- **Milestone:** Reach stable positive ATP generation

### Mid Game (5-15 minutes)

- **Gameplay:** Balance building production vs. storage vs. waste management
- **Goals:** Build up infrastructure, manage Waste with Lysosomes, accumulate DNA from mutations
- **Milestone:** Purchase Nucleus (requires 25 DNA from mutations)

### Late Game (15-30 minutes)

- **Gameplay:** DNA generation becomes steady, choose Evolution Path
- **Goals:** Purchase all three path organelles, prepare for stage transition
- **Milestone:** Unlock Cellular Differentiation and transition to next stage

### Balance Targets

- First automation (Mitochondria): ~30 seconds
- Nucleus unlock: ~5-6 minutes
- First Evolution organelle: ~8 minutes
- Stage completion: ~15-20 minutes

### Strategic Depth

- **Aggressive builds:** More organelles = more production but harder to maintain Stability
- **Conservative builds:** Fewer organelles = stable Stability but slower progress
- **Mutation farming:** Intentionally let Waste rise for more DNA, accept Stability risk
- **Stability dancing:** Push Waste high, ride the Strained/Critical thresholds, purge before Crisis
- **Path synergies:** Each evolution path rewards different playstyles
    - Animalculus: High throughput offsets Stability penalties
    - Phytozoa: Reduced Waste generation keeps Stability healthy
    - Mycozoa: Ignores Stability damage, freely scales Waste for bonuses

---

## Appendix: Quick Reference

### Starting State

- ATP: 10/100
- Nutrients: 5/100
- Biomass: 0/100
- DNA: 0/50
- Waste: 0
- Cell Stability: 100%
- Passive: +0.1 ATP/sec, +1.5% Stability/sec

### Key Unlocks

| Unlock                   | Requirement                   |
| ------------------------ | ----------------------------- |
| Ribosomes                | Own 1 Mitochondria            |
| Flagellum                | Own 2 Cell Membranes          |
| Lysosome                 | Waste has reached 50          |
| Cytoskeleton             | Own 3 Ribosomes               |
| Endoplasmic Reticulum    | Own 2 Ribosomes               |
| Nucleus                  | Accumulated 15 DNA            |
| Evolution Paths          | Own Nucleus                   |
| Cellular Differentiation | Own final Evolution organelle |

### Resource Conversions

| Action/Building    | Input               | Output          |
| ------------------ | ------------------- | --------------- |
| Absorb (click)     | 1 ATP               | 3 Nutrients     |
| Metabolize (click) | 2 Nutrients         | 5 ATP           |
| Synthesize (click) | 3 Nutrients + 2 ATP | 4 Biomass       |
| Repair (click)     | 5 ATP + 1 Biomass   | -10 Waste       |
| Mitochondria       | —                   | 1 ATP/sec       |
| Ribosomes          | 1 Nutrient/sec      | 0.5 Biomass/sec |
| Nucleus            | —                   | 0.5 DNA/sec     |
