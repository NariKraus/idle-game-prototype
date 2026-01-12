// cell_stage_testing.js
// Test script for CELL_STAGE_DATA structure and logic
// Run with: node cell_stage_testing.js

// Import CELL_STAGE_DATA (assumes it's in the same directory and globally defined)
const {TestCase} = require('../assets/js/TestCase.js');
const CELL_STAGE_DATA = require('./01. CELL.js'); // If not a module, see note below

// Tick Scripting:
// Get all active upgrade effects:

// Helper to deep clone
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}

// Simulate upgrades being purchased
const upgrades = Object.values(CELL_STAGE_DATA.upgrades).map((upg) => {
    // upg.purchased = Math.random() < 0.5;
    return upg;
});
const purchasedUpgrades = upgrades.filter((upg) => upg.purchased);

// Collect all buildings affected by upgrades
const effectedBuildings = new Set();
purchasedUpgrades.forEach((upg) => {
    if (upg.effects && upg.effects.targetBuilding) {
        effectedBuildings.add(upg.effects.targetBuilding);
    }
});

const displayCase = {
    effectedBuildings: Array.from(effectedBuildings),
    buildings: {
        before: {},
        after: {},
    },
};

// Helper to stack effects (additive/multiplicative)
function stackEffects(existing, newArr) {
    for (const eff of newArr) {
        const key = eff.resource || eff.building;
        if (!key) continue;
        if (eff.type === 'additive') {
            if (existing[key] === undefined) existing[key] = 0;
            existing[key] += eff.value;
        } else if (eff.type === 'multiplicative') {
            if (existing[key] === undefined) existing[key] = 1;
            existing[key] *= eff.value;
        } else {
            existing[key] = eff.value;
        }
    }
}

// For each affected building, apply all relevant upgrade effects
displayCase.effectedBuildings.forEach((buildingKey) => {
    const buildingData = deepClone(CELL_STAGE_DATA.buildings[buildingKey]);
    displayCase.buildings.before[buildingKey] = deepClone(buildingData);

    // Gather all upgrades for this building
    const upgradesForBuilding = purchasedUpgrades.filter((upg) => upg.effects && upg.effects.targetBuilding === buildingKey);

    // For each effect type (e.g., production, storage, nutrientAbsorption, etc.)
    for (const upg of upgradesForBuilding) {
        for (const [effectType, effectArr] of Object.entries(upg.effects)) {
            if (['targetBuilding', 'type'].includes(effectType)) continue;
            if (!Array.isArray(effectArr)) continue;
            if (!buildingData.effects[effectType]) {
                buildingData.effects[effectType] = {};
            }
            stackEffects(buildingData.effects[effectType], effectArr);
        }
    }

    displayCase.buildings.after[buildingKey] = deepClone(buildingData);
});

// Save to a file for review
const fs = require('fs');
fs.writeFileSync('cell_stage_upgrade_effects_review.json', JSON.stringify(displayCase, null, 4));

// Simulate what would happen if I clicked on the "Gather Nutrients" button. This should return the amount of nutrients gathered per click.
// Use the CELL_STAGE_DATA to determine the base gathering rate and any upgrades that modify it.
// The key effect to look for is 'nutrientAbsorption' in the building effects.

// Disable all upgrades and buildings initially
CELL_STAGE_DATA.upgrades = Object.fromEntries(
    Object.entries(CELL_STAGE_DATA.upgrades).map(([key, upg]) => {
        upg.purchased = false;
        return [key, upg];
    })
);
CELL_STAGE_DATA.buildings = Object.fromEntries(
    Object.entries(CELL_STAGE_DATA.buildings).map(([key, bld]) => {
        bld.count = 0;
        return [key, bld];
    })
);

class Cell {
    constructor(data) {
        this.data = data;
    }

    get nutrientGatherRate() {
        if (!this._nutrientCache || this._cacheInvalid) {
            this._nutrientCache = this.calculateNutrientGathering();
        }
        return this._nutrientCache;
    }

    calculateNutrientGathering() {
        // Get buildings and upgrades
        const buildings = this.data.buildings;
        const upgrades = Object.values(this.data.upgrades).filter((upg) => upg.purchased);

        // Find all "nutrientAbsorption" effects from buildings and upgrades
        let nutrientAbsorptionEffects = [];
        for (const [buildingKey, buildingData] of Object.entries(buildings)) {
            // Base building effects
            if (buildingData.count && buildingData.effects && buildingData.effects.nutrientAbsorption) {
                nutrientAbsorptionEffects = nutrientAbsorptionEffects.concat(buildingData.effects.nutrientAbsorption);
            }
        }
        for (const upg of upgrades) {
            if (upg.purchased && upg.effects && upg.effects.nutrientAbsorption) {
                nutrientAbsorptionEffects = nutrientAbsorptionEffects.concat(upg.effects.nutrientAbsorption);
            }
        }
        // Calculate total nutrient absorption
        let totalNutrientAbsorption = 0;
        // Order of operations: additive -> multiplicative -> set (Set overrides all and should be used sparingly)
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

        totalNutrientAbsorption = Math.max(0, totalNutrientAbsorption); // Ensure non-negative

        return totalNutrientAbsorption;
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

tests.forEach((test) => {
    // Create a fresh copy of CELL_STAGE_DATA
    const data = deepClone(CELL_STAGE_DATA);

    // initialize the Cell
    const cell = new Cell(data);

    // Apply buildings
    for (const [bldKey, bldData] of Object.entries(test.buildings)) {
        cell.buyBuilding(bldKey, bldData.count);
    }
    // Apply upgrades
    for (const [upgKey, upgData] of Object.entries(test.upgrades)) {
        if (upgData.purchased) {
            cell.purchaseUpgrade(upgKey);
        }
    }

    cellTests.test(`${test._id}: ${test.name}`, () => cell.nutrientGatherRate, test.expectedRate, test.shouldFail || false);
    cells.push(cell);
});

// Apply the increasedSurfaceArea upgrade to test id 6 for error demonstration
cells.find((c, idx) => idx === 6).purchaseUpgrade('increasedSurfaceArea');

// Run all tests

cellTests.runAll();
