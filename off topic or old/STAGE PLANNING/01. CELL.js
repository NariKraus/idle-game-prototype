/* 
Old code for reference - do not re-add

CELL_STAGE_DATA = {
    resources: {
        atp: {
            name: 'ATP', // The Display name of the resource
            display: true, // Whether to show this resource in the UI
            description: 'Adenosine Triphosphate, the energy currency of the cell.', // A brief description of the resource
            amount: 0, // Current amount of the resource
            max: 100, // Maximum capacity of the resource
            diff: 0.05, // Change in amount per tick
            delta: 0, // The change in diff per tick
            rate: 1, // Multiplier for production/consumption rates
            bar: true, // Whether to show a progress/storage bar in the UI
        },
        nutrients: {
            name: 'Nutrients',
            display: true,
            description: 'Basic nutrients absorbed from the environment to produce biomass.',
            amount: 0,
            max: 100,
            diff: 0,
            delta: 0,
            rate: 1,
            bar: true,
        },
        biomass: {
            name: 'Biomass',
            display: true,
            description: 'The building blocks of the cell, used for constructing organelles and structures.',
            amount: 0,
            max: 100,
            diff: 0,
            delta: 0,
            rate: 1,
            bar: true,
        },
        dna: {
            name: 'DNA',
            display: true,
            description: 'Genetic material that encodes the information needed for cellular functions and upgrades.',
            amount: 0,
            max: 100,
            diff: 0,
            delta: 0,
            rate: 1,
            bar: true,
        },
        waste: {
            name: 'Waste',
            display: true,
            description: 'Byproducts of cellular processes that need to be managed to maintain cell health.',
            amount: 0,
            max: 500,
            diff: 0,
            delta: 0,
            rate: 1,
            bar: true,
        },
    },
    buildings: {
        cellMembrane: {
            name: 'Cell Membrane',
            description: 'The outer layer of the cell that regulates nutrient intake and waste expulsion.',
            defaultCost: {},
            wasteProduction: 0,
            unlockCondition: null,
            display: true,
            count: 0,
            singlePurchase: true,
            effects: {
                nutrientAbsorption: [{resource: 'nutrientAbsorption', value: 1, type: 'additive'}], // Increases nutrients absorbed per click
            },
        },
        Mitochondrion: {
            name: 'Mitochondrion',
            description: 'The powerhouse of the cell, generating atp from nutrients.',
            defaultCost: {biomass: 25},
            wasteProduction: 0.1,
            unlockCondition: {biomass: 5},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                production: [
                    {resource: 'atp', value: 4, type: 'additive'}, // Generates 4 atp per second
                    {resource: 'biomass', value: 0.25, type: 'additive'}, // Generates 0.25 biomass per second
                    {resource: 'nutrients', value: -1, type: 'additive'}, // Consumes 1 Nutrient per second
                ],
                storage: [
                    {resource: 'atp', value: 50, type: 'additive'}, // Increases atp storage by 50
                ],
            },
        },
        Vacuole: {
            name: 'Vacuole',
            description: 'A storage organelle that holds nutrients and biomass for later use.',
            defaultCost: {biomass: 50},
            wasteProduction: 0.05,
            unlockCondition: {biomass: 30},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                storage: [
                    {resource: 'nutrients', value: 50, type: 'additive'}, // Increases Nutrient storage by 50
                    {resource: 'biomass', value: 75, type: 'additive'}, // Increases biomass storage by 75
                ],
            },
        },
        surfaceFolds: {
            name: 'Surface Folds',
            description: 'Increases the efficiency of nutrient absorption by creating more surface area.',
            defaultCost: {biomass: 100},
            wasteProduction: 0,
            unlockCondition: {biomass: 50},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                nutrientAbsorption: [{resource: 'nutrientAbsorption', value: 1, type: 'additive'}], // Increases nutrients absorbed per click
            },
        },
        ribosome: {
            name: 'Ribosome',
            description: 'The protein factories of the cell, building up the necessary components for growth.',
            defaultCost: {biomass: 150, atp: 30},
            wasteProduction: 0.15,
            unlockCondition: {biomass: 75, mitochondrion: 1},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                production: [
                    {resource: 'biomass', value: 2, type: 'additive'}, // Generates 2 Biomass per second
                    {resource: 'atp', value: -1, type: 'additive'}, // Consumes 1 ATP per second
                    {resource: 'nutrients', value: -1, type: 'additive'}, // Consumes 1 Nutrient per second
                ],
            },
        },
        lysosome: {
            name: 'Lysosome',
            description: 'The waste management system of the cell, breaking down waste products.',
            defaultCost: {biomass: 200, atp: 50},
            wasteProduction: -2, // Reduces waste by 2 per second
            unlockCondition: {biomass: 100, mitochondrion: 1},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {},
        },
        nucleus: {
            name: 'Nucleus',
            description: 'The control center of the cell, housing the DNA and regulating cellular activities.',
            defaultCost: {biomass: 500, atp: 100, dna: 10},
            wasteProduction: 0.2,
            unlockCondition: {biomass: 200, ribosome: 1, lysosome: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                production: [
                    {resource: 'dna', value: 0.1, type: 'additive'}, // Generates 0.1 DNA per second
                    {resource: 'atp', value: -5, type: 'additive'}, // Consumes 5 ATP per second
                    {resource: 'nutrients', value: -5, type: 'additive'}, // Consumes 5 Nutrients per second
                ],
            },
        },
        // Autotrophic Lineage
        chloroplast: {
            name: 'Chloroplast',
            description: 'The site of photosynthesis, converting light energy into nutrients.',
            defaultCost: {biomass: 200, atp: 50, dna: 25},
            wasteProduction: 0.1,
            unlockCondition: {nucleus: 1},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                production: [
                    {resource: 'nutrients', value: 0.5, type: 'additive'}, // Generates 0.5 Nutrients per second
                ],
                lineage: 'autotrophic',
            },
        },
        thylakoidMembrane: {
            name: 'Thylakoid Membrane',
            description: 'Enhances the efficiency of chloroplasts in nutrient production.',
            defaultCost: {biomass: 400, atp: 100, dna: 100},
            wasteProduction: 0.05,
            unlockCondition: {chloroplast: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                production: [
                    {building: 'chloroplast', value: 1.5, type: 'multiplicative'}, // Improves Chloroplast output by 50%
                ],
                lineage: 'autotrophic',
            },
        },
        cellWall: {
            name: 'Cell Wall',
            description: 'A rigid structure that provides protection and support to the cell.',
            defaultCost: {biomass: 800, atp: 200, dna: 500},
            wasteProduction: 0,
            unlockCondition: {thylakoidMembrane: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                stageProgression: 'cellularDifferentiation', // Unlocks progression to the next stage
                lineage: 'autotrophic',
            },
        },
        // Metabolic Lineage
        endoplasmicReticulum: {
            name: 'Endoplasmic Reticulum',
            description: 'A network of membranes that enhances the efficiency of mitochondria in atp production.',
            defaultCost: {biomass: 200, atp: 50, dna: 25},
            wasteProduction: 0.15,
            unlockCondition: {nucleus: 1},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                production: [
                    {building: 'mitochondrion', value: 1.1, type: 'multiplicative'}, // Improves Mitochondrion output by 10%
                ],
                lineage: 'metabolic',
            },
        },
        transportProteins: {
            name: 'Transport Proteins',
            description: 'Specialized proteins that facilitate the movement of nutrients across the cell membrane.',
            defaultCost: {biomass: 400, atp: 100, dna: 100},
            wasteProduction: 0.1,
            unlockCondition: {endoplasmicReticulum: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                nutrientAbsorption: [{resource: 'nutrientAbsorption', value: 2, type: 'multiplicative'}],
                lineage: 'metabolic',
            },
        },
        Flagellum: {
            name: 'Flagellum',
            description: 'A whip-like structure that enables cell movement and interaction with the environment.',
            defaultCost: {biomass: 800, atp: 200, dna: 500},
            wasteProduction: 0,
            unlockCondition: {endoplasmicReticulum: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                stageProgression: 'cellularDifferentiation', // Unlocks progression to the next stage
                lineage: 'metabolic',
            },
        },
        // Saprotrophic Lineage
        extracellularDigestion: {
            name: 'Extracellular Digestion',
            description: 'Allows the cell to break down external organic matter to absorb nutrients.',
            defaultCost: {biomass: 200, atp: 50, dna: 25},
            wasteProduction: 0.15,
            unlockCondition: {nucleus: 1},
            display: false,
            count: 0,
            singlePurchase: false,
            effects: {
                production: [
                    {resource: 'nutrients', value: 1, type: 'additive'}, // Generates 1 Nutrients per second
                    {resource: 'waste', value: -0.5, type: 'additive'}, // Consumes 0.5 Waste per second
                ],
                lineage: 'saprotrophic',
            },
        },
        hyphae: {
            name: 'Hyphae',
            description: 'Filamentous structures that enhance the efficiency of extracellular digestion.',
            defaultCost: {biomass: 400, atp: 100, dna: 100},
            wasteProduction: 0.1,
            unlockCondition: {extracellularDigestion: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                production: [
                    {building: 'extracellularDigestion', value: 1.2, type: 'multiplicative'}, // Improves Extracellular Digestion output by 20%
                ],
                lineage: 'saprotrophic',
            },
        },
        sporeProduction: {
            name: 'Spore Production',
            description: 'Enables the cell to produce spores, facilitating reproduction and stage progression.',
            defaultCost: {biomass: 800, atp: 200, dna: 500},
            wasteProduction: 0,
            unlockCondition: {hyphae: 1},
            display: false,
            count: 0,
            singlePurchase: true,
            effects: {
                stageProgression: 'cellularDifferentiation', // Unlocks progression to the next stage
                lineage: 'saprotrophic',
            },
        },
    },
    upgrades: {
        // Cell Membrane
        reinforcedMembrane: {
            name: 'Reinforced Membrane',
            description: 'Strengthens the cell membrane, improving its durability and function.',
            defaultCost: {biomass: 200, dna: 75},
            unlockCondition: {cellMembrane: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                storage: [
                    {resource: 'atp', value: 2, type: 'multiplicative'}, // Doubles ATP storage capacity
                    {resource: 'nutrients', value: 2, type: 'multiplicative'}, // Doubles Nutrient storage capacity
                    {resource: 'biomass', value: 2, type: 'multiplicative'}, // Doubles Biomass storage capacity
                    {resource: 'dna', value: 2, type: 'multiplicative'}, // Doubles DNA storage capacity
                ],
                targetBuilding: 'cellMembrane', // Specifies which building this upgrade affects
            },
        },
        // Surface Folds
        increasedSurfaceArea: {
            name: 'Increased Surface Area',
            description: 'Enhances the surface folds to maximize nutrient absorption efficiency.',
            defaultCost: {biomass: 150, dna: 10},
            unlockCondition: {surfaceFolds: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                nutrientAbsorption: [{resource: 'nutrientAbsorption', value: 1, type: 'additive'}], // Increases nutrients absorbed per click
                targetBuilding: 'surfaceFolds', // Specifies which building this upgrade affects
            },
        },
        enhancedTransport: {
            name: 'Enhanced Transport',
            description: 'Improves the transportation of nutrients across the cell membrane.',
            defaultCost: {biomass: 300, dna: 75},
            unlockCondition: {transportProteins: 1},
            display: false,
            purchased: false,
            effects: {
                nutrientAbsorption: [{resource: 'nutrientAbsorption', value: 2, type: 'additive'}], // Increases nutrients absorbed per click
                targetBuilding: 'surfaceFolds', // Specifies which building this upgrade affects
            },
        },
        // Ribosome
        proteinFolding: {
            name: 'Protein Folding',
            description: "Enhances the ribosome's ability to fold proteins efficiently.",
            defaultCost: {biomass: 150, dna: 50},
            unlockCondition: {ribosome: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                production: [{resource: 'biomass', value: 1, type: 'additive'}], // Increases Biomass generation by 1 per second
                targetBuilding: 'ribosome', // Specifies which building this upgrade affects
            },
        },
        parallelSynthesis: {
            name: 'Parallel Synthesis',
            description: 'Allows ribosomes to synthesize multiple proteins simultaneously, reducing ATP costs.',
            defaultCost: {biomass: 200, dna: 75},
            unlockCondition: {proteinFolding: 1},
            display: false,
            purchased: false,
            effects: {
                production: [{resource: 'atp', value: 0.5, type: 'additive'}], // Reduces the ATP cost of Biomass generation by 0.5. Positive because it's a cost reduction
                targetBuilding: 'ribosome', // Specifies which building this upgrade affects
            },
        },
        structuralProteins: {
            name: 'Structural Proteins',
            description: 'Increases the structural integrity of the cell by enhancing biomass storage capacity.',
            defaultCost: {biomass: 250, dna: 100},
            unlockCondition: {parallelSynthesis: 1},
            display: false,
            purchased: false,
            effects: {
                storage: [{resource: 'biomass', value: 25, type: 'additive'}], // Each Ribosome increases Biomass storage capacity by 25
                targetBuilding: 'ribosome', // Specifies which building this upgrade affects
            },
        },
        // Lysosome
        autophagy: {
            name: 'Autophagy',
            description: 'Enables lysosomes to recycle excess biomass into ATP.',
            defaultCost: {biomass: 150, dna: 75},
            unlockCondition: {lysosome: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                production: [{resource: 'atp', value: 1, type: 'additive', condition: {type: 'excessBiomass'}}], // Generates 1 ATP per second when biomass is in excess
                targetBuilding: 'lysosome', // Specifies which building this upgrade affects
            },
        },
        selectiveBreakdown: {
            name: 'Selective Breakdown',
            description: 'Allows lysosomes to break down waste without consuming ATP.',
            defaultCost: {biomass: 200, dna: 100},
            unlockCondition: {autophagy: 1},
            display: false,
            purchased: false,
            effects: {
                // Modifies the Lysosome building effects
                wasteProduction: {value: 0, type: 'set'}, // Sets waste production to 0 (no ATP consumption)
                targetBuilding: 'lysosome', // Specifies which building this upgrade affects
            },
        },
        // reclamation: {
        //     name: 'Reclamation',
        //     description: 'Enables lysosomes to convert reduced waste into DNA.',
        //     defaultCost: {biomass: 250, dna: 125},
        //     unlockCondition: {selectiveBreakdown: 1},
        //     display: false,
        //     purchased: false,
        //     effects: {
        //         production: {
        //             dna: {value: 0.02, type: 'additive'}, // Generates 0.02 DNA per second for every 1 Waste reduced
        //             waste: {value: -1, type: 'additive'}, // Condition to trigger DNA generation
        //         },
        //         targetBuilding: 'lysosome', // Specifies which building this upgrade affects
        //     },
        // },
        // Nucleus
        geneDuplication: {
            name: 'Gene Duplication',
            description: 'Duplicates segments of DNA to enhance genetic capacity and production.',
            defaultCost: {biomass: 200, dna: 75},
            unlockCondition: {nucleus: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                storage: [{resource: 'dna', value: 50, type: 'additive'}], // Increases DNA storage capacity by 50
                production: [{resource: 'dna', value: 1, type: 'additive'}], // Increases DNA generation by 1 per second
                targetBuilding: 'nucleus', // Specifies which building this upgrade affects
            },
        },
        epigenetics: {
            name: 'Epigenetics',
            description: 'Modifies gene expression to enhance DNA production based on waste levels.',
            defaultCost: {biomass: 250, dna: 100},
            unlockCondition: {geneDuplication: 1},
            display: false,
            purchased: false,
            effects: {
                production: [{resource: 'dna', value: 0.05, type: 'multiplicative', condition: {type: 'wasteThreshold', threshold: 50}}], // Each 50 Waste increases DNA generation by 5%
                targetBuilding: 'nucleus', // Specifies which building this upgrade affects
            },
        },
        genomeCompression: {
            name: 'Genome Compression',
            description: 'Compacts the genome to reduce the resource costs of cellular functions.',
            defaultCost: {biomass: 300, dna: 150},
            unlockCondition: {epigenetics: 1},
            display: false,
            purchased: false,
            effects: {
                costReduction: [{resource: 'dna', value: 0.2, type: 'multiplicative'}], // Reduces DNA costs by 20%
                targetBuilding: 'nucleus', // Specifies which building this upgrade affects
            },
        },
    },
};

module.exports = CELL_STAGE_DATA;
*/

// === === === === === === === === === === === === === === === === === === === === === === === === === === === ===

// GameState has very basic data, referencing an object of class instances defined elsewhere.
// The reference object is a class that updates based on the GameState data, and handles all logic and calculations lazily.
// General sensus, the GameState should be able to be modified and imported/exported cleanly, acting as a save file, whereas the `Currently Unnamed` object handles all the heavy lifting

/** Things to figure out:
 * How to detect when buildings and upgrades are unlocked, purchased, etc.
 * How to handle effects that modify other buildings/upgrades (e.g. Chloroplast increasing nutrient production)
 * How to handle conditional effects (e.g. Autophagy generating ATP only when biomass is in excess)
 * How to handle lineage-specific buildings and upgrades
 * How to keep the data organized and maintainable as more buildings and upgrades are added
 * How to ensure that the code is efficient and not bloated with unnecessary calculations, data, or repetitive structures
 * */

const GAME_STATE = {
    resources: {
        atp: 0,
        biomass: 0,
        dna: 0,
        nutrients: 0,
        waste: 0,
    },
    buildings: {
        cellMembrane: 0,
        mitochondrion: 0,
        vacuole: 0,
        surfaceFolds: 0,
        ribosome: 0,
        lysosome: 0,
        nucleus: 0,
        chloroplast: 0,
        thylakoidMembrane: 0,
        cellWall: 0,
        endoplasmicReticulum: 0,
        transportProteins: 0,
        flagellum: 0,
        extracellularDigestion: 0,
        hyphae: 0,
        sporeProduction: 0,
    },
    upgrades: {
        reinforcedMembrane: false,
        increasedSurfaceArea: false,
        enhancedTransport: false,
        proteinFolding: false,
        parallelSynthesis: false,
        structuralProteins: false,
        autophagy: false,
        selectiveBreakdown: false,
        geneDuplication: false,
        epigenetics: false,
        genomeCompression: false,
    },
};

const modifiersExample = [
    {
        _id: 'upgrade.cell.reinforcedMembrane',
        targets: ['resource.atp', 'resource.biomass', 'resource.dna', 'resource.nutrients'],
        types: ['maxStorage'],
        method: 'mult',
        value: 2,
    },
    {
        _id: 'building.cell.thylakoidMembrane.boostChloroplast',
        targets: ['building.cell.chloroplast'],
        types: ['production.nutrients'],
        method: 'mult',
        value: 1.5,
    },
];

const building = {
    cell: {
        cellMembrane: {
            name: 'Cell Membrane',
            description: 'The outer layer of the cell that regulates nutrient intake and waste expulsion.',
            cost: {},
            unlockCondition: null,
            production: {
                atp: 0.05, // Passive ATP generation to prevent stagnation
            },
            storage: {},
        },
        thylakoidMembrane: {
            name: 'Thylakoid Membrane',
            description: 'Enhances the efficiency of chloroplasts in nutrient production.',
            cost: {biomass: 400, atp: 100, dna: 100},
            unlockCondition: {chloroplast: 1},
            production: {
                waste: 0.05,
            },
            storage: {},
            modifiers: ['building.cell.thylakoidMembrane.boostChloroplast'],
        },
    },
};
