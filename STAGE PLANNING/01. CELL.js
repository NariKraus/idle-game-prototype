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
                nutrientAbsorption: {value: 1, type: 'additive'}, // Increases nutrients absorbed per click
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
                production: {
                    atp: {value: 4, type: 'additive'}, // Generates 4 atp per second
                    biomass: {value: 0.25, type: 'additive'}, // Generates 0.25 biomass per second
                    nutrients: {value: -1, type: 'additive'}, // Consumes 1 Nutrient per second
                },
                storage: {
                    atp: {value: 50, type: 'additive'}, // Increases atp storage by 50
                },
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
                storage: {
                    nutrients: {value: 50, type: 'additive'}, // Increases Nutrient storage by 50
                    biomass: {value: 75, type: 'additive'}, // Increases biomass storage by 75
                },
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
                nutrientAbsorption: {value: 1, type: 'additive'}, // Increases nutrients absorbed per click
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
                production: {
                    biomass: {value: 2, type: 'additive'}, // Generates 2 Biomass per second
                    atp: {value: -1, type: 'additive'}, // Consumes 1 ATP per second
                    nutrients: {value: -1, type: 'additive'}, // Consumes 1 Nutrient per second
                },
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
                production: {
                    dna: {value: 0.1, type: 'additive'}, // Generates 0.1 DNA per second
                    atp: {value: -5, type: 'additive'}, // Consumes 5 ATP per second
                    nutrients: {value: -5, type: 'additive'}, // Consumes 5 Nutrients per second
                },
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
                production: {
                    nutrients: {value: 0.5, type: 'additive'}, // Generates 0.5 Nutrients per second
                },
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
                production: {
                    chloroplast: {value: 1.5, type: 'multiplicative'}, // Improves Chloroplast output by 50%
                },
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
                production: {
                    mitochondrion: {value: 1.1, type: 'multiplicative'}, // Improves Mitochondrion output by 10%
                },
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
                nutrientAbsorption: {value: 2, type: 'multiplicative'},
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
        // -   **Extracellular Digestion:**
        //     -   _Default Cost:_ 200 Biomass, 50 ATP, 25 DNA
        //     -   _Waste Production:_ 0.15 Waste per second
        //     -   _Unlock Condition:_ Requires Nucleus.
        //     -   Generates 1 Nutrients per second by consuming 0.5 Waste.
        // -   **Hyphae:**
        //     -   _Default Cost:_ 400 Biomass, 100 ATP, 100 DNA
        //     -   _Waste Production:_ 0.1 Waste per second
        //     -   _Unlock Condition:_ Requires Extracellular Digestion.
        //     -   Improves the output of Extracellular Digestion by 20%.
        // -   **Spore Production:**
        //     -   _Default Cost:_ 800 Biomass, 200 ATP, 500 DNA
        //     -   _Unlock Condition:_ Requires Hyphae.
        //     -   Unlocks Cellular Differentiation, allowing progression to the next stage.
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
                production: {
                    nutrients: {value: 1, type: 'additive'}, // Generates 1 Nutrients per second
                    waste: {value: -0.5, type: 'additive'}, // Consumes 0.5 Waste per second
                },
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
                production: {
                    extracellularDigestion: {value: 1.2, type: 'multiplicative'}, // Improves Extracellular Digestion output by 20%
                },
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
                storage: {
                    atp: {value: 2, type: 'multiplicative'}, // Doubles ATP storage capacity
                    nutrients: {value: 2, type: 'multiplicative'}, // Doubles Nutrient storage capacity
                    biomass: {value: 2, type: 'multiplicative'}, // Doubles Biomass storage capacity
                    dna: {value: 2, type: 'multiplicative'}, // Doubles DNA storage capacity
                },
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
                nutrientAbsorption: {value: 1, type: 'additive'}, // Increases nutrients absorbed per click
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
                nutrientAbsorption: {value: 2, type: 'additive'}, // Increases nutrients absorbed per click
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
                modify: {
                    ribosome: {
                        // Modifies the Ribosome building effects
                        production: {
                            biomass: {value: 1, type: 'additive'}, // Increases Biomass generation by 1 per second
                        },
                    },
                },
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
                modify: {
                    ribosome: {
                        // Modifies the Ribosome building effects
                        production: {
                            atp: {value: 0.5, type: 'additive'}, // Reduces the ATP cost of Biomass generation by 0.5. Positive because it's a cost reduction
                        },
                    },
                },
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
                modify: {
                    ribosome: {
                        // Modifies the Ribosome building effects
                        storage: {
                            biomass: {value: 25, type: 'additive'}, // Each Ribosome increases Biomass storage capacity by 25
                        },
                    },
                },
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
                production: {
                    atp: {value: 1, type: 'additive', condition: {type: 'excessBiomass'}}, // Generates 1 ATP per second when biomass is in excess
                },
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
                modify: {
                    lysosome: {
                        // Modifies the Lysosome building effects
                        production: {
                            waste: {value: -0.1, type: 'additive'}, // Lysosomes reduce Waste without consuming ATP
                        },
                    },
                },
            },
        },
        reclamation: {
            name: 'Reclamation',
            description: 'Enables lysosomes to convert reduced waste into DNA.',
            defaultCost: {biomass: 250, dna: 125},
            unlockCondition: {selectiveBreakdown: 1},
            display: false,
            purchased: false,
            effects: {
                production: {
                    dna: {value: 0.02, type: 'additive'}, // Generates 0.02 DNA per second for every 1 Waste reduced
                    waste: {value: -1, type: 'additive'}, // Condition to trigger DNA generation
                },
            },
        },
        // Nucleus
        // -   **Gene Duplication:**
        //     -   _Cost:_ 200 Biomass, 75 DNA
        //     -   _Unlock Condition:_ Requires Nucleus and DNA.
        //     -   Increases the maximum DNA capacity by 50.
        //     -   Increases DNA generation by 1 per second.
        // -   **Epigenetics:**
        //     -   _Cost:_ 250 Biomass, 100 DNA
        //     -   _Unlock Condition:_ Requires Gene Duplication.
        //     -   Each 50 Waste increases DNA generation by an additional 5%.
        // -   **Genome Compression:**
        //     -   _Cost:_ 300 Biomass, 150 DNA
        //     -   _Unlock Condition:_ Requires Epigenetics.
        //     -   Reduces DNA costs for all buildings and upgrades by 20%.
        geneDuplication: {
            name: 'Gene Duplication',
            description: 'Duplicates segments of DNA to enhance genetic capacity and production.',
            defaultCost: {biomass: 200, dna: 75},
            unlockCondition: {nucleus: 1, discoveredDna: 1},
            display: false,
            purchased: false,
            effects: {
                modify: {
                    nucleus: {
                        // Modifies the Nucleus building effects
                        storage: {
                            dna: {value: 50, type: 'additive'}, // Increases DNA storage capacity by 50
                        },
                        production: {
                            dna: {value: 1, type: 'additive'}, // Increases DNA generation by 1 per second
                        },
                    },
                },
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
                modify: {
                    nucleus: {
                        // Modifies the Nucleus building effects
                        production: {
                            dna: {value: 0.05, type: 'multiplicative', condition: {type: 'wasteThreshold', threshold: 50}}, // Each 50 Waste increases DNA generation by 5%
                        },
                    },
                },
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
                modify: {
                    nucleus: {
                        // Modifies the Nucleus building effects
                        costReduction: {
                            dna: {value: 0.2, type: 'multiplicative'}, // Reduces DNA costs by 20%
                        },
                    },
                },
            },
        },
    },
};

module.exports = CELL_STAGE_DATA;
