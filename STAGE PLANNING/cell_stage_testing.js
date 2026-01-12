// cell_stage_testing.js
// Test suite for CELL_STAGE_DATA logic
// Run with: node cell_stage_testing.js

const sectionArgs = process.argv.find((arg) => arg.startsWith('--'));
const sections = sectionArgs ? sectionArgs.replace('--', '').split(',') : null;

const {TestCase} = require('../assets/js/TestCase.js');
const CELL_STAGE_DATA = require('./01. CELL.js');

// Utility: Deep clone for test isolation
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

if (!sections || sections.includes('cell')) runCellTests();
if (!sections || sections.includes('deltaTick')) runDeltaTickTests();

function runCellTests() {
    // Cell class for testable nutrient gathering
    class Cell {
        constructor(data) {
            this.data = data;
            this._nutrientCache = null;
            this._cacheInvalid = true;
        }

        get nutrientGatherRate() {
            if (this._cacheInvalid || this._nutrientCache === null) {
                this._nutrientCache = this.calculateNutrientGathering();
                this._cacheInvalid = false;
            }
            return this._nutrientCache;
        }

        calculateNutrientGathering() {
            const buildings = this.data.buildings;
            const upgrades = Object.values(this.data.upgrades).filter((upg) => upg.purchased);
            let nutrientAbsorptionEffects = [];
            for (const [buildingKey, buildingData] of Object.entries(buildings)) {
                if (buildingData.count && buildingData.effects && buildingData.effects.nutrientAbsorption) {
                    nutrientAbsorptionEffects = nutrientAbsorptionEffects.concat(buildingData.effects.nutrientAbsorption);
                }
            }
            for (const upg of upgrades) {
                if (upg.purchased && upg.effects && upg.effects.nutrientAbsorption) {
                    nutrientAbsorptionEffects = nutrientAbsorptionEffects.concat(upg.effects.nutrientAbsorption);
                }
            }
            let totalNutrientAbsorption = 0;
            nutrientAbsorptionEffects
                .sort((a, b) => {
                    const order = {additive: 1, multiplicative: 2, set: 3};
                    return order[a.type] - order[b.type];
                })
                .forEach((effect) => {
                    if (effect.type === 'additive') {
                        totalNutrientAbsorption += effect.value;
                    } else if (effect.type === 'multiplicative') {
                        totalNutrientAbsorption *= effect.value;
                    } else if (effect.type === 'set') {
                        totalNutrientAbsorption = effect.value;
                    }
                });
            return Math.max(0, totalNutrientAbsorption);
        }

        buyBuilding(buildingKey, count = 1) {
            if (this.data.buildings[buildingKey]) {
                this.data.buildings[buildingKey].count += count;
                this._cacheInvalid = true;
            }
        }
        purchaseUpgrade(upgradeKey) {
            if (this.data.upgrades[upgradeKey]) {
                this.data.upgrades[upgradeKey].purchased = true;
                this._cacheInvalid = true;
            }
        }
    }

    // Test cases for nutrient gathering
    const tests = [
        {
            _id: 0,
            name: 'Base Nutrient Gathering',
            buildings: {cellMembrane: {count: 1}},
            upgrades: {},
            expectedRate: 1,
        },
        {
            _id: 1,
            name: 'With Increased Surface Area Upgrade',
            buildings: {cellMembrane: {count: 1}},
            upgrades: {increasedSurfaceArea: {purchased: true}},
            expectedRate: 2,
        },
        {
            _id: 2,
            name: 'With Increased Surface Area and Enhanced Transport Upgrades',
            buildings: {cellMembrane: {count: 1}},
            upgrades: {increasedSurfaceArea: {purchased: true}, enhancedTransport: {purchased: true}},
            expectedRate: 4,
        },
        {
            _id: 3,
            name: 'With Transport Proteins Building',
            buildings: {cellMembrane: {count: 1}, transportProteins: {count: 1}},
            upgrades: {increasedSurfaceArea: {purchased: true}, enhancedTransport: {purchased: true}},
            expectedRate: 8,
        },
        {
            _id: 4,
            name: 'Without Enhanced Transport Upgrade',
            buildings: {cellMembrane: {count: 1}, transportProteins: {count: 1}},
            upgrades: {increasedSurfaceArea: {purchased: true}},
            expectedRate: 4,
        },
        {
            _id: 5,
            name: 'Without Any Upgrades',
            buildings: {cellMembrane: {count: 1}, transportProteins: {count: 1}},
            upgrades: {},
            expectedRate: 2,
        },
        {
            _id: 6,
            name: 'Mismatch Test - Added upgrades',
            buildings: {cellMembrane: {count: 1}},
            upgrades: {},
            expectedRate: 1,
            shouldFail: 'mismatch',
        },
    ];

    const cellTests = new TestCase('Cell Class Nutrient Gathering Tests');
    const cells = [];

    // Build and run each test
    tests.forEach((test) => {
        const data = deepClone(CELL_STAGE_DATA);
        const cell = new Cell(data);
        for (const [bldKey, bldData] of Object.entries(test.buildings)) {
            cell.buyBuilding(bldKey, bldData.count);
        }
        for (const [upgKey, upgData] of Object.entries(test.upgrades)) {
            if (upgData.purchased) cell.purchaseUpgrade(upgKey);
        }
        cellTests.test(`${test._id}: ${test.name}`, () => cell.nutrientGatherRate, test.expectedRate, test.shouldFail || false);
        cells.push(cell);
    });

    // Example: force a mismatch for test 6
    cells[6].purchaseUpgrade('increasedSurfaceArea');

    cellTests.runAll();
}

function runDeltaTickTests() {
    const gameState = deepClone(CELL_STAGE_DATA);
    gameState.lastTick = 0;

    class CellStage {
        constructor(data) {
            this._buildings = data.buildings;
            this._upgrades = data.upgrades;

            this.buildings = {};
            for (const [bldKey, bldData] of Object.entries(this._buildings)) {
                this.buildings[bldKey] = new Building(bldKey, bldData, this);
            }
        }

        getAllEffectsForBuilding(buildingKey, effectType) {
            let effects = [];

            // 1. Building's own effects
            const building = this._buildings[buildingKey];
            if (building.effects && building.effects[effectType]) {
                effects = effects.concat(building.effects[effectType]);
            }

            // 2. Effects from other buildings that target this building
            for (const [otherKey, otherData] of Object.entries(this._buildings)) {
                if (otherKey === buildingKey) continue;
                if (otherData.count && otherData.effects && otherData.effects[effectType]) {
                    for (const eff of otherData.effects[effectType]) {
                        if (eff.building === buildingKey) {
                            effects.push(eff);
                        }
                    }
                }
            }

            // 3. Effects from upgrades that target this building
            for (const upg of Object.values(this._upgrades)) {
                if (upg.purchased && upg.effects && upg.effects[effectType]) {
                    for (const eff of upg.effects[effectType]) {
                        if (eff.building === buildingKey) {
                            effects.push(eff);
                        }
                    }
                }
            }

            return effects;
        }
    }

    class Building {
        constructor(key, data, cellStage) {
            this.key = key;
            this.data = data;
            this.cellStage = cellStage;
        }

        get resourceChangeRate() {
            let rate = this.productionRate;
            // Add waste production
            rate.waste = (rate.waste || 0) + this.wasteProductionRate;
            return rate;
        }

        get productionRate() {
            if (!this._productionCache || this._productionCacheInvalid) {
                this._productionCache = this.getProduction();
                this._productionCacheInvalid = false;
            }
            return this._productionCache;
        }

        get wasteProductionRate() {
            if (!this._wasteCache || this._wasteCacheInvalid) {
                this._wasteCache = this.getWasteProduction();
                this._wasteCacheInvalid = false;
            }
            return this._wasteCache;
        }

        getProduction() {
            // Query the master for all effects
            const effects = this.cellStage.getAllEffectsForBuilding(this.key, 'production').reduce(
                (acc, val) => {
                    // Group by type
                    if (val.type === 'additive') {
                        acc.additive.push(val);
                    } else if (val.type === 'multiplicative') {
                        acc.multiplicative.push(val);
                    } else if (val.type === 'set') {
                        acc.set.push(val);
                    }
                    return acc;
                },
                {additive: [], multiplicative: [], set: []}
            );

            let totalProduction = {};
            // Apply additive effects
            effects.additive.forEach((eff) => {
                if (!totalProduction[eff.resource]) totalProduction[eff.resource] = 0;
                totalProduction[eff.resource] += eff.value;
            });
            // Apply multiplicative effects
            effects.multiplicative.forEach((eff) => {
                if (!totalProduction[eff.resource]) totalProduction[eff.resource] = 0;
                totalProduction[eff.resource] *= eff.value;
            });
            // Apply set effects
            effects.set.forEach((eff) => {
                totalProduction[eff.resource] = eff.value;
            });

            return totalProduction;
        }

        getWasteProduction() {
            // Query the master for all effects
            const effects = this.cellStage.getAllEffectsForBuilding(this.key, 'wasteProduction').reduce(
                (acc, val) => {
                    // Group by type
                    if (val.type === 'additive') {
                        acc.additive.push(val);
                    } else if (val.type === 'multiplicative') {
                        acc.multiplicative.push(val);
                    } else if (val.type === 'set') {
                        acc.set.push(val);
                    }
                    return acc;
                },
                {additive: [], multiplicative: [], set: []}
            );
            let totalWasteProduction = this.data.wasteProduction || 0;
            // Apply additive effects
            effects.additive.forEach((eff) => {
                totalWasteProduction += eff.value;
            });
            // Apply multiplicative effects
            effects.multiplicative.forEach((eff) => {
                totalWasteProduction *= eff.value;
            });
            // Apply set effects
            effects.set.forEach((eff) => {
                totalWasteProduction = eff.value;
            });
            return totalWasteProduction;
        }
    }

    const cellStage = new CellStage(gameState);

    // Helper: Apply resource change with validation
    function applyResourceChange(resource, change) {
        const newAmount = resource.amount + change;
        // Clamp between 0 and max capacity
        resource.amount = Math.max(0, Math.min(newAmount, resource.max));
        
        // Optional: Return whether we hit a boundary (useful for detecting bottlenecks)
        return {
            capped: newAmount > resource.max,
            depleted: newAmount < 0
        };
    }

    function gameTick() {
        const now = gameState.lastTick + 1000; // Simulate 1 second later
        const deltaTime = (now - gameState.lastTick) / 1000;
        gameState.lastTick = now;

        // Resource generation logic
        for (const [bldKey, bldData] of Object.entries(gameState.buildings)) {
            if (bldData.count) {
                // Use the cellStage's Building instance for effect calculations
                const building = cellStage.buildings[bldKey];
                const rate = building.resourceChangeRate;
                for (const [resKey, resChange] of Object.entries(rate)) {
                    const resource = gameState.resources[resKey];
                    // Only update if resource exists
                    if (resource && typeof resource.amount === 'number') {
                        const totalChange = resChange * bldData.count * deltaTime;
                        applyResourceChange(resource, totalChange);
                    }
                }
            }
        }
    }

    // Set up initial state on gameState, not cellStage
    gameState.buildings.Mitochondrion.count = 1;
    gameState.resources.nutrients.amount = 100;

    gameTick();

    /**
     * Nutrients -> 99
     * ATP -> 4
     * Biomass -> 0.25
     * Waste -> 0.1
     *  */
    // Print the updated resource amounts
    const resourceAmounts = Object.fromEntries(
        Object.entries(gameState.resources).map(([k, v]) => [k, v.amount])
    );
    console.log('Post-tick Resources:', resourceAmounts);
}
