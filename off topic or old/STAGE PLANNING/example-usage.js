/**
 * USAGE EXAMPLE
 * 
 * This demonstrates how to use the Cell stage game system.
 */

const CellGameState = require('./CellGameState');
const CellGameCalculator = require('./CellGameCalculator');

// ===========================
// Initialize Game
// ===========================

const gameState = new CellGameState();
const gameCalc = new CellGameCalculator(gameState);

// Start with cell membrane
gameState.buildings.cellMembrane = 1;

console.log('=== INITIAL STATE ===');
console.log('ATP:', gameCalc.getResource('atp'));
console.log('');

// ===========================
// Player Clicks for Nutrients
// ===========================

console.log('=== CLICKING FOR NUTRIENTS ===');
gameCalc.clickResource('nutrients');
gameCalc.clickResource('nutrients');
gameCalc.clickResource('nutrients');
console.log('Nutrients:', gameCalc.getResource('nutrients'));
console.log('');

// ===========================
// Simulate Game Ticks
// ===========================

console.log('=== SIMULATING 10 SECONDS ===');
// Give some nutrients to work with
gameState.resources.nutrients = 50;
gameState.resources.biomass = 30;

gameCalc.tick(10); // 10 seconds

console.log('After 10 seconds:');
console.log('ATP:', gameCalc.getResource('atp').amount.toFixed(2), '/', gameCalc.getResource('atp').max);
console.log('Production:', gameCalc.getResource('atp').production.toFixed(3), '/s');
console.log('');

// ===========================
// Purchase Building
// ===========================

console.log('=== PURCHASING MITOCHONDRION ===');
// Give resources for purchase
gameState.resources.biomass = 50;

const mito = gameCalc.getBuilding('mitochondrion');
console.log('Mitochondrion unlocked:', mito.unlocked);
console.log('Mitochondrion affordable:', mito.affordable);
console.log('Cost:', mito.cost);

if (gameCalc.purchaseBuilding('mitochondrion')) {
    console.log('✓ Purchased!');
    console.log('Mitochondrion count:', gameState.buildings.mitochondrion);
    console.log('ATP production:', gameCalc.getResource('atp').production.toFixed(3), '/s');
} else {
    console.log('✗ Cannot purchase');
}
console.log('');

// ===========================
// Check All Visible Buildings
// ===========================

console.log('=== VISIBLE BUILDINGS ===');
const buildings = gameCalc.getAllBuildings();
buildings.forEach(b => {
    console.log(`${b.name} (${b.count})`);
    console.log(`  Unlocked: ${b.unlocked}, Affordable: ${b.affordable}`);
    console.log(`  Cost:`, b.cost);
});
console.log('');

// ===========================
// Purchase Upgrade
// ===========================

console.log('=== PURCHASING UPGRADE ===');
// Give enough DNA
gameState.resources.dna = 100;
gameState.resources.biomass = 300;

const upgrade = gameCalc.getUpgrade('reinforcedMembrane');
console.log('Reinforced Membrane:');
console.log('  Unlocked:', upgrade.unlocked);
console.log('  Affordable:', upgrade.affordable);

const atpMaxBefore = gameCalc.getResource('atp').max;
console.log('ATP max before upgrade:', atpMaxBefore);

if (gameCalc.purchaseUpgrade('reinforcedMembrane')) {
    console.log('✓ Upgrade purchased!');
    const atpMaxAfter = gameCalc.getResource('atp').max;
    console.log('ATP max after upgrade:', atpMaxAfter);
    console.log('Increase:', atpMaxAfter - atpMaxBefore);
} else {
    console.log('✗ Cannot purchase upgrade');
}
console.log('');

// ===========================
// Test Modifier Effects
// ===========================

console.log('=== TESTING MODIFIERS ===');
gameState.buildings.ribosome = 1;
gameState.resources.biomass = 300;
gameState.resources.dna = 100;

console.log('Biomass production without upgrade:', gameCalc.getResource('biomass').production.toFixed(3));

gameCalc.purchaseUpgrade('proteinFolding');
console.log('Purchased Protein Folding upgrade');
console.log('Biomass production with upgrade:', gameCalc.getResource('biomass').production.toFixed(3));
console.log('');

// ===========================
// Save/Load System
// ===========================

console.log('=== SAVE/LOAD ===');
const savedData = gameState.toJSON();
console.log('Saved data:', JSON.stringify(savedData, null, 2));

const newGameState = new CellGameState();
newGameState.fromJSON(savedData);
const newGameCalc = new CellGameCalculator(newGameState);
console.log('Loaded - ATP production:', newGameCalc.getResource('atp').production.toFixed(3));
console.log('');

// ===========================
// Conditional Effects Test
// ===========================

console.log('=== CONDITIONAL EFFECTS (AUTOPHAGY) ===');
// Start fresh for this test
const testState = new CellGameState();
const testCalc = new CellGameCalculator(testState);
testState.buildings.cellMembrane = 1;
testState.buildings.lysosome = 1;

console.log('Lysosome count:', testState.buildings.lysosome);
console.log('ATP production without autophagy:', testCalc.getResource('atp').production.toFixed(3));

// Purchase the upgrade (set biomass/DNA high enough to afford it)
testState.resources.biomass = 200;
testState.resources.dna = 100;
testCalc.purchaseUpgrade('autophagy');
console.log('Purchased Autophagy upgrade');
console.log('Autophagy purchased:', testState.upgrades.autophagy);

// Fill biomass to trigger condition
const bioResource = testCalc.getResource('biomass');
testState.resources.biomass = bioResource.max * 0.85; // 85% full
testCalc.invalidateCache(); // Important! Tell calculator to recalculate

console.log('\nBiomass:', testState.resources.biomass.toFixed(1), '/', bioResource.max, `(${(testState.resources.biomass / bioResource.max * 100).toFixed(0)}%)`);
console.log('Condition should be true:', testState.resources.biomass / bioResource.max >= 0.8);
console.log('ATP production with autophagy (biomass > 80%):', testCalc.getResource('atp').production.toFixed(3));

// Lower biomass below threshold
testState.resources.biomass = bioResource.max * 0.5; // 50% full
testCalc.invalidateCache(); // Important! Tell calculator to recalculate
console.log('\nBiomass:', testState.resources.biomass.toFixed(1), '/', bioResource.max, `(${(testState.resources.biomass / bioResource.max * 100).toFixed(0)}%)`);
console.log('Condition should be false:', testState.resources.biomass / bioResource.max >= 0.8);
console.log('ATP production with autophagy (biomass < 80%):', testCalc.getResource('atp').production.toFixed(3));
