/**
 * CELL STAGE - Game State
 * 
 * This represents the player's current progress and state in the game.
 * This is what gets saved/loaded.
 */

class CellGameState {
    constructor() {
        // Resource amounts
        this.resources = {
            atp: 0,
            nutrients: 0,
            biomass: 0,
            dna: 0,
            waste: 0,
        };
        
        // Building counts
        this.buildings = {
            cellMembrane: 0,
            mitochondrion: 0,
            vacuole: 0,
            ribosome: 0,
            lysosome: 0,
            nucleus: 0,
            chloroplast: 0,
            thylakoidMembrane: 0,
        };
        
        // Upgrade purchase states
        this.upgrades = {
            reinforcedMembrane: false,
            increasedSurfaceArea: false,
            proteinFolding: false,
            parallelSynthesis: false,
            structuralProteins: false,
            autophagy: false,
            selectiveBreakdown: false,
            geneDuplication: false,
        };
        
        // Persistent unlock tracking (once unlocked, stays unlocked)
        this.unlockedBuildings = new Set(['cellMembrane']); // Cell membrane starts unlocked
        this.unlockedUpgrades = new Set();
        
        // Additional state
        this.lineage = null; // 'autotrophic', 'metabolic', 'saprotrophic', or null
        this.stage = 'cell';
        this.lastTick = Date.now();
    }
    
    // Serialization for save/load
    toJSON() {
        return {
            resources: {...this.resources},
            buildings: {...this.buildings},
            upgrades: {...this.upgrades},
            unlockedBuildings: Array.from(this.unlockedBuildings),
            unlockedUpgrades: Array.from(this.unlockedUpgrades),
            lineage: this.lineage,
            stage: this.stage,
            lastTick: this.lastTick,
        };
    }
    
    // Load from saved data
    fromJSON(data) {
        if (data.resources) this.resources = {...data.resources};
        if (data.buildings) this.buildings = {...data.buildings};
        if (data.upgrades) this.upgrades = {...data.upgrades};
        if (data.unlockedBuildings) this.unlockedBuildings = new Set(data.unlockedBuildings);
        if (data.unlockedUpgrades) this.unlockedUpgrades = new Set(data.unlockedUpgrades);
        if (data.lineage) this.lineage = data.lineage;
        if (data.stage) this.stage = data.stage;
        if (data.lastTick) this.lastTick = data.lastTick;
    }
}

module.exports = CellGameState;
