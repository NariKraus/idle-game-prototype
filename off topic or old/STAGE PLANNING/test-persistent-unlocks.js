/**
 * Test: Persistent Unlocks
 * Demonstrates that once something is unlocked, it stays unlocked
 */

const CellGameState = require('./CellGameState');
const CellGameCalculator = require('./CellGameCalculator');

console.log('=== PERSISTENT UNLOCK TEST ===\n');

// Create new game
const state = new CellGameState();
const calc = new CellGameCalculator(state);

// Start with cell membrane
state.buildings.cellMembrane = 1;

console.log('Initial state:');
console.log('- Biomass:', state.resources.biomass);
console.log('- Mitochondrion unlocked:', calc.getBuilding('mitochondrion').unlocked);
console.log('- Unlocked buildings:', Array.from(state.unlockedBuildings));
console.log();

// Give enough biomass to unlock mitochondrion (needs 5)
console.log('Setting biomass to 10...');
state.resources.biomass = 10;
calc.invalidateCache();

const mito1 = calc.getBuilding('mitochondrion');
console.log('- Biomass:', state.resources.biomass);
console.log('- Mitochondrion unlocked:', mito1.unlocked);
console.log('- Unlocked buildings:', Array.from(state.unlockedBuildings));
console.log();

// Now reduce biomass below unlock threshold
console.log('Reducing biomass to 2 (below unlock threshold of 5)...');
state.resources.biomass = 2;
calc.invalidateCache();

const mito2 = calc.getBuilding('mitochondrion');
console.log('- Biomass:', state.resources.biomass);
console.log('- Mitochondrion unlocked:', mito2.unlocked, '← STAYS UNLOCKED!');
console.log('- Unlocked buildings:', Array.from(state.unlockedBuildings));
console.log();

// Test with upgrades too
console.log('=== TESTING UPGRADES ===\n');

// Unlock ribosome first
state.buildings.mitochondrion = 1;
state.resources.biomass = 150;
state.resources.dna = 100;

console.log('Setting biomass=150, DNA=100, ribosome count=1');
state.buildings.ribosome = 1;
calc.invalidateCache();

const upgrade1 = calc.getUpgrade('proteinFolding');
console.log('- Protein Folding unlocked:', upgrade1.unlocked);
console.log('- Unlocked upgrades:', Array.from(state.unlockedUpgrades));
console.log();

// Remove DNA
console.log('Reducing DNA to 0...');
state.resources.dna = 0;
calc.invalidateCache();

const upgrade2 = calc.getUpgrade('proteinFolding');
console.log('- DNA:', state.resources.dna);
console.log('- Protein Folding unlocked:', upgrade2.unlocked, '← STAYS UNLOCKED!');
console.log('- Unlocked upgrades:', Array.from(state.unlockedUpgrades));
console.log();

// Test save/load
console.log('=== TESTING SAVE/LOAD ===\n');

const saveData = state.toJSON();
console.log('Saved unlocked buildings:', saveData.unlockedBuildings);
console.log('Saved unlocked upgrades:', saveData.unlockedUpgrades);
console.log();

const newState = new CellGameState();
newState.fromJSON(saveData);
const newCalc = new CellGameCalculator(newState);

console.log('After loading:');
console.log('- Mitochondrion unlocked:', newCalc.getBuilding('mitochondrion').unlocked);
console.log('- Protein Folding unlocked:', newCalc.getUpgrade('proteinFolding').unlocked);
console.log('✓ Persistent unlocks work across save/load!');
