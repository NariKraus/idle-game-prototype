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
