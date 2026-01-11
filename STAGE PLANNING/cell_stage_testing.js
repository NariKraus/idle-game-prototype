// cell_stage_testing.js
// Test script for CELL_STAGE_DATA structure and logic
// Run with: node cell_stage_testing.js

// Import CELL_STAGE_DATA (assumes it's in the same directory and globally defined)
const { TestCase } = require('../assets/js/TestCase.js');
const CELL_STAGE_DATA = require('./01. CELL.js'); // If not a module, see note below

// If 01. CELL.js is not a module, you may need to load it differently, e.g. with fs+eval or by refactoring to export CELL_STAGE_DATA
// For now, let's assume you can access CELL_STAGE_DATA as a global or via require

const test = new TestCase();

// --- Example Tests ---

test.test('ATP resource has correct default max', () => {
    return CELL_STAGE_DATA.resources.atp.max;
}, 100);

test.test('Mitochondrion building has correct biomass cost', () => {
    return CELL_STAGE_DATA.buildings.Mitochondrion.defaultCost.biomass;
}, 25);

test.test('Vacuole increases biomass storage', () => {
    return CELL_STAGE_DATA.buildings.Vacuole.effects.storage.biomass.value;
}, 75);

test.test('Lysosome reduces waste', () => {
    return CELL_STAGE_DATA.buildings.lysosome.wasteProduction < 0;
}, true);

test.test('Reinforced Membrane upgrade doubles ATP storage', () => {
    return CELL_STAGE_DATA.upgrades.reinforcedMembrane.effects.storage.atp.value;
}, 2);

test.test('Gene Duplication upgrade increases DNA storage', () => {
    return CELL_STAGE_DATA.upgrades.geneDuplication.effects.modify.nucleus.storage.dna.value;
}, 50);

// --- Run all tests ---
test.runAll();

/*
How to use:
1. Place this script in the same directory as 01. CELL.js.
2. Make sure 01. CELL.js exports CELL_STAGE_DATA (add: module.exports = CELL_STAGE_DATA; at the end).
3. Run: node cell_stage_testing.js
4. Add more tests as needed using test.test('desc', () => ..., expected)
*/
