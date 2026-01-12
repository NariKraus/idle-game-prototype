/**
 * CELL STAGE - Game Definitions
 * 
 * This file contains all the static definitions for the Cell stage.
 * It defines what resources, buildings, and upgrades exist and their base properties.
 * This is separate from the game state (which tracks current values).
 */

// ===========================
// RESOURCE DEFINITIONS
// ===========================

const RESOURCE_DEFINITIONS = {
    atp: {
        name: 'ATP',
        displayName: 'ATP',
        description: 'Adenosine Triphosphate, the energy currency of the cell.',
        baseMax: 100,
        showBar: true,
        showInUI: true,
        order: 1,
    },
    nutrients: {
        name: 'nutrients',
        displayName: 'Nutrients',
        description: 'Basic nutrients absorbed from the environment to produce biomass.',
        baseMax: 100,
        showBar: true,
        showInUI: true,
        order: 2,
    },
    biomass: {
        name: 'biomass',
        displayName: 'Biomass',
        description: 'The building blocks of the cell, used for constructing organelles and structures.',
        baseMax: 100,
        showBar: true,
        showInUI: true,
        order: 3,
    },
    dna: {
        name: 'dna',
        displayName: 'DNA',
        description: 'Genetic material that encodes the information needed for cellular functions and upgrades.',
        baseMax: 100,
        showBar: true,
        showInUI: true,
        order: 4,
    },
    waste: {
        name: 'waste',
        displayName: 'Waste',
        description: 'Byproducts of cellular processes that need to be managed to maintain cell health.',
        baseMax: 500,
        showBar: true,
        showInUI: true,
        order: 5,
    },
};

// ===========================
// BUILDING DEFINITIONS
// ===========================

const BUILDING_DEFINITIONS = {
    cellMembrane: {
        id: 'cellMembrane',
        name: 'Cell Membrane',
        description: 'The outer layer of the cell that regulates nutrient intake and waste expulsion.',
        category: 'core',
        lineage: null,
        singlePurchase: true,
        
        // Cost is a function so it can scale with count
        getCost: (count) => ({}), // Free first building
        
        // Unlock condition - function that receives the game calculator
        isUnlocked: (calc) => true, // Always available
        
        // Effects this building provides (per count)
        effects: [
            {
                type: 'production',
                resource: 'atp',
                value: 0.05,
                method: 'add', // add, mult, set
            },
        ],
    },
    
    mitochondrion: {
        id: 'mitochondrion',
        name: 'Mitochondrion',
        description: 'The powerhouse of the cell, generating ATP from nutrients.',
        category: 'production',
        lineage: null,
        singlePurchase: false,
        
        getCost: (count) => ({
            biomass: 25 * Math.pow(1.15, count),
        }),
        
        isUnlocked: (calc) => calc.getResource('biomass').amount >= 5,
        
        effects: [
            {type: 'production', resource: 'atp', value: 4, method: 'add'},
            {type: 'production', resource: 'biomass', value: 0.25, method: 'add'},
            {type: 'production', resource: 'nutrients', value: -1, method: 'add'},
            {type: 'production', resource: 'waste', value: 0.1, method: 'add'},
            {type: 'storage', resource: 'atp', value: 50, method: 'add'},
        ],
    },
    
    vacuole: {
        id: 'vacuole',
        name: 'Vacuole',
        description: 'A storage organelle that holds nutrients and biomass for later use.',
        category: 'storage',
        lineage: null,
        singlePurchase: false,
        
        getCost: (count) => ({
            biomass: 50 * Math.pow(1.15, count),
        }),
        
        isUnlocked: (calc) => calc.getResource('biomass').amount >= 30,
        
        effects: [
            {type: 'storage', resource: 'nutrients', value: 50, method: 'add'},
            {type: 'storage', resource: 'biomass', value: 75, method: 'add'},
            {type: 'production', resource: 'waste', value: 0.05, method: 'add'},
        ],
    },
    
    ribosome: {
        id: 'ribosome',
        name: 'Ribosome',
        description: 'The protein factories of the cell, building up the necessary components for growth.',
        category: 'production',
        lineage: null,
        singlePurchase: false,
        
        getCost: (count) => ({
            biomass: 150 * Math.pow(1.15, count),
            atp: 30 * Math.pow(1.15, count),
        }),
        
        isUnlocked: (calc) => {
            return calc.getResource('biomass').amount >= 75 && 
                   calc.getBuilding('mitochondrion').count >= 1;
        },
        
        effects: [
            {type: 'production', resource: 'biomass', value: 2, method: 'add'},
            {type: 'production', resource: 'atp', value: -1, method: 'add'},
            {type: 'production', resource: 'nutrients', value: -1, method: 'add'},
            {type: 'production', resource: 'waste', value: 0.15, method: 'add'},
        ],
    },
    
    lysosome: {
        id: 'lysosome',
        name: 'Lysosome',
        description: 'The waste management system of the cell, breaking down waste products.',
        category: 'utility',
        lineage: null,
        singlePurchase: false,
        
        getCost: (count) => ({
            biomass: 200 * Math.pow(1.15, count),
            atp: 50 * Math.pow(1.15, count),
        }),
        
        isUnlocked: (calc) => {
            return calc.getResource('biomass').amount >= 100 && 
                   calc.getBuilding('mitochondrion').count >= 1;
        },
        
        effects: [
            {type: 'production', resource: 'waste', value: -2, method: 'add'},
        ],
    },
    
    nucleus: {
        id: 'nucleus',
        name: 'Nucleus',
        description: 'The control center of the cell, housing the DNA and regulating cellular activities.',
        category: 'core',
        lineage: null,
        singlePurchase: true,
        
        getCost: (count) => ({
            biomass: 500,
            atp: 100,
            dna: 10,
        }),
        
        isUnlocked: (calc) => {
            return calc.getResource('biomass').amount >= 200 &&
                   calc.getBuilding('ribosome').count >= 1 &&
                   calc.getBuilding('lysosome').count >= 1;
        },
        
        effects: [
            {type: 'production', resource: 'dna', value: 0.1, method: 'add'},
            {type: 'production', resource: 'atp', value: -5, method: 'add'},
            {type: 'production', resource: 'nutrients', value: -5, method: 'add'},
            {type: 'production', resource: 'waste', value: 0.2, method: 'add'},
        ],
    },
    
    // ===========================
    // AUTOTROPHIC LINEAGE
    // ===========================
    
    chloroplast: {
        id: 'chloroplast',
        name: 'Chloroplast',
        description: 'The site of photosynthesis, converting light energy into nutrients.',
        category: 'production',
        lineage: 'autotrophic',
        singlePurchase: false,
        
        getCost: (count) => ({
            biomass: 200 * Math.pow(1.15, count),
            atp: 50 * Math.pow(1.15, count),
            dna: 25 * Math.pow(1.15, count),
        }),
        
        isUnlocked: (calc) => calc.getBuilding('nucleus').count >= 1,
        
        effects: [
            {type: 'production', resource: 'nutrients', value: 0.5, method: 'add'},
            {type: 'production', resource: 'waste', value: 0.1, method: 'add'},
        ],
    },
    
    thylakoidMembrane: {
        id: 'thylakoidMembrane',
        name: 'Thylakoid Membrane',
        description: 'Enhances the efficiency of chloroplasts in nutrient production.',
        category: 'production',
        lineage: 'autotrophic',
        singlePurchase: true,
        
        getCost: (count) => ({
            biomass: 400,
            atp: 100,
            dna: 100,
        }),
        
        isUnlocked: (calc) => calc.getBuilding('chloroplast').count >= 1,
        
        effects: [
            {type: 'production', resource: 'waste', value: 0.05, method: 'add'},
            // This building's modifier effect is defined in UPGRADE_DEFINITIONS for consistency
        ],
    },
};

// ===========================
// UPGRADE DEFINITIONS
// ===========================

const UPGRADE_DEFINITIONS = {
    reinforcedMembrane: {
        id: 'reinforcedMembrane',
        name: 'Reinforced Membrane',
        description: 'Strengthens the cell membrane, improving its durability and function.',
        category: 'core',
        lineage: null,
        targetBuilding: 'cellMembrane',
        
        getCost: () => ({
            biomass: 200,
            dna: 75,
        }),
        
        isUnlocked: (calc) => {
            return calc.getBuilding('cellMembrane').count >= 1 &&
                   calc.getResource('dna').amount >= 1; // Discovered DNA
        },
        
        // Modifiers that this upgrade applies
        modifiers: [
            {type: 'storage', resource: 'atp', value: 2, method: 'mult'},
            {type: 'storage', resource: 'nutrients', value: 2, method: 'mult'},
            {type: 'storage', resource: 'biomass', value: 2, method: 'mult'},
            {type: 'storage', resource: 'dna', value: 2, method: 'mult'},
        ],
    },
    
    increasedSurfaceArea: {
        id: 'increasedSurfaceArea',
        name: 'Increased Surface Area',
        description: 'Enhances the surface folds to maximize nutrient absorption efficiency.',
        category: 'utility',
        lineage: null,
        targetBuilding: 'cellMembrane',
        
        getCost: () => ({
            biomass: 150,
            dna: 10,
        }),
        
        isUnlocked: (calc) => {
            return calc.getBuilding('cellMembrane').count >= 1 &&
                   calc.getResource('dna').amount >= 1;
        },
        
        modifiers: [
            {type: 'clickPower', resource: 'nutrients', value: 1, method: 'add'},
        ],
    },
    
    proteinFolding: {
        id: 'proteinFolding',
        name: 'Protein Folding',
        description: "Enhances the ribosome's ability to fold proteins efficiently.",
        category: 'production',
        lineage: null,
        targetBuilding: 'ribosome',
        
        getCost: () => ({
            biomass: 150,
            dna: 50,
        }),
        
        isUnlocked: (calc) => {
            return calc.getBuilding('ribosome').count >= 1 &&
                   calc.getResource('dna').amount >= 1;
        },
        
        modifiers: [
            {
                type: 'buildingProduction',
                building: 'ribosome',
                resource: 'biomass',
                value: 1,
                method: 'add',
            },
        ],
    },
    
    parallelSynthesis: {
        id: 'parallelSynthesis',
        name: 'Parallel Synthesis',
        description: 'Allows ribosomes to synthesize multiple proteins simultaneously, reducing ATP costs.',
        category: 'production',
        lineage: null,
        targetBuilding: 'ribosome',
        
        getCost: () => ({
            biomass: 200,
            dna: 75,
        }),
        
        isUnlocked: (calc) => calc.getUpgrade('proteinFolding').purchased,
        
        modifiers: [
            {
                type: 'buildingProduction',
                building: 'ribosome',
                resource: 'atp',
                value: 0.5,
                method: 'add', // Adds 0.5 to -1, making it -0.5 (reduces cost)
            },
        ],
    },
    
    structuralProteins: {
        id: 'structuralProteins',
        name: 'Structural Proteins',
        description: 'Increases the structural integrity of the cell by enhancing biomass storage capacity.',
        category: 'storage',
        lineage: null,
        targetBuilding: 'ribosome',
        
        getCost: () => ({
            biomass: 250,
            dna: 100,
        }),
        
        isUnlocked: (calc) => calc.getUpgrade('parallelSynthesis').purchased,
        
        modifiers: [
            {
                type: 'buildingStorage',
                building: 'ribosome',
                resource: 'biomass',
                value: 25,
                method: 'add',
            },
        ],
    },
    
    autophagy: {
        id: 'autophagy',
        name: 'Autophagy',
        description: 'Enables lysosomes to recycle excess biomass into ATP.',
        category: 'production',
        lineage: null,
        targetBuilding: 'lysosome',
        
        getCost: () => ({
            biomass: 150,
            dna: 75,
        }),
        
        isUnlocked: (calc) => {
            return calc.getBuilding('lysosome').count >= 1 &&
                   calc.getResource('dna').amount >= 1;
        },
        
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
                    threshold: 0.8, // 80% of max
                },
            },
        ],
    },
    
    selectiveBreakdown: {
        id: 'selectiveBreakdown',
        name: 'Selective Breakdown',
        description: 'Allows lysosomes to break down waste more efficiently.',
        category: 'utility',
        lineage: null,
        targetBuilding: 'lysosome',
        
        getCost: () => ({
            biomass: 200,
            dna: 100,
        }),
        
        isUnlocked: (calc) => calc.getUpgrade('autophagy').purchased,
        
        modifiers: [
            {
                type: 'buildingProduction',
                building: 'lysosome',
                resource: 'waste',
                value: -1,
                method: 'add', // Makes it -3 instead of -2
            },
        ],
    },
    
    geneDuplication: {
        id: 'geneDuplication',
        name: 'Gene Duplication',
        description: 'Duplicates segments of DNA to enhance genetic capacity and production.',
        category: 'production',
        lineage: null,
        targetBuilding: 'nucleus',
        
        getCost: () => ({
            biomass: 200,
            dna: 75,
        }),
        
        isUnlocked: (calc) => calc.getBuilding('nucleus').count >= 1,
        
        modifiers: [
            {type: 'storage', resource: 'dna', value: 50, method: 'add'},
            {
                type: 'buildingProduction',
                building: 'nucleus',
                resource: 'dna',
                value: 1,
                method: 'add',
            },
        ],
    },
    
    // Thylakoid membrane modifier
    chloroplastBoost: {
        id: 'chloroplastBoost',
        name: 'Chloroplast Synergy',
        description: 'Thylakoid membranes enhance chloroplast efficiency.',
        category: 'production',
        lineage: 'autotrophic',
        targetBuilding: 'chloroplast',
        hidden: true, // Not shown as purchasable, automatically applied
        
        getCost: () => ({}),
        
        isUnlocked: (calc) => calc.getBuilding('thylakoidMembrane').count >= 1,
        
        modifiers: [
            {
                type: 'buildingProduction',
                building: 'chloroplast',
                resource: 'nutrients',
                value: 1.5,
                method: 'mult',
            },
        ],
    },
};

// ===========================
// SPECIAL MECHANICS
// ===========================

const SPECIAL_MECHANICS = {
    // Click mechanics
    nutrientClick: {
        id: 'nutrientClick',
        resource: 'nutrients',
        baseValue: 1,
        // This can be modified by upgrades with type 'clickPower'
    },
};

module.exports = {
    RESOURCE_DEFINITIONS,
    BUILDING_DEFINITIONS,
    UPGRADE_DEFINITIONS,
    SPECIAL_MECHANICS,
};
