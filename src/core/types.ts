// ================================================================================================
// SAVE STRUCTURES
// ================================================================================================

/**
 * The main save file structure for the entire game.
 * Contains version info for save migration, timestamps for offline progress,
 * global metadata that persists across all stages, and per-stage save data.
 */
interface GameSave {
    /** For save migration when you update the game */
    version: number;
    /** Unix timestamp - needed for offline progress calculation */
    lastSaved: number;
    /** The currently active evolution stage */
    currentStage: StageType;
    /** Global metadata that persists across ALL stages forever */
    meta: GameMeta;
    /** Per-stage saves - only the current stage is "live", previous stages are historical snapshots */
    stages: StagesSave;
}

/** All possible evolution stages in the game */
type StageType = 'cell' | 'biotic' | 'sapient' | 'civil' | 'ascendant';
// Descriptions: 
// 'cell' - The initial stage where the player controls a single-celled organism.
// 'biotic' - The stage where multicellular life forms evolve and ecosystems develop.
// 'sapient' - The stage where intelligent life emerges, leading to complex behaviors.
// 'civil' - The stage where civilizations rise, focusing on culture and technology.
// 'ascendant' - The final stage where life transcends physical limitations and explores higher dimensions.

/** Global metadata that persists across ALL stages forever */
interface GameMeta {
    /** The chosen evolutionary lineage path */
    lineage: LineageType | null;
    /** Accumulated choices throughout the game: "warmonger", "pacifist", etc. */
    traits: string[];
    /** Evolutionary points carried forward from previous stages */
    evolutionaryPoints: number;
}

/** Available lineage types the player can choose */
type LineageType = 'animalculus' | 'phytozoa' | 'mycozoa';

/** Container for all per-stage save data */
interface StagesSave {
    cell?: CellStageSave;
    biotic?: BioticStageSave;
    sapient?: SapientStageSave;
    civil?: CivilStageSave;
    ascendant?: AscendantStageSave;
}

/**
 * Save structure for the Cell stage.
 * Each stage has its own save structure tailored to its mechanics.
 */
interface CellStageSave {
    /** Current resource amounts */
    resources: CellResources;
    /** Building counts by ID, e.g. { "mitochondria": 5, "ribosome": 3 } */
    buildings: Record<string, number>;
    /** Which buildings are enabled/disabled, e.g. { "mitochondria": true, "ribosome": false } */
    buildingsEnabled: Record<string, boolean>;
    /** Purchased upgrade IDs, e.g. ["cristae_formation", "phospholipid_bilayer"] */
    upgrades: string[];
    /** Statistics for achievements and unlocks */
    stats: CellStats;
}

/** Resource amounts for the Cell stage */
interface CellResources {
    atp: number;
    nutrients: number;
    biomass: number;
    dna: number;
    waste: number;
    stability: number;
}

/** Statistics tracked during the Cell stage */
interface CellStats {
    /** Total DNA earned across all time - for achievements and unlocks */
    totalDnaEarned: number;
    /** Maximum waste level ever reached */
    maxWasteReached: number;
    /** Total number of mutations triggered */
    mutationsTriggered: number;
}

// @@ TODO Placeholder interfaces for other stages
interface BioticStageSave {
    // @@ TODO Define properties for the Biotic stage save
}

interface SapientStageSave {
    // @@ TODO Define properties for the Sapient stage save
}

interface CivilStageSave {
    // @@ TODO Define properties for the Civil stage save
}

interface AscendantStageSave {
    // @@ TODO Define properties for the Ascendant stage save
}

// ================================================================================================
// BUILDINGS
// ================================================================================================

/**
 * Definition for a building type.
 * Describes what a building IS and what it DOES at a base level.
 * Does not include modifier effects - those are applied separately.
 */
interface BuildingDef {
    /** Unique identifier, should match the key in the buildings record */
    id: string;
    /** Display name shown in the UI */
    name: string;
    /** Tooltip/flavor text describing the building */
    description: string;
    /** Base cost to purchase, e.g. { biomass: 8, atp: 5 } */
    baseCost: Record<string, number>;
    /** Cost scaling factor per purchase (1.15 = 15% more expensive each time) */
    costScaling: number;
    /** How much waste this building produces per second (can be negative for waste reducers) */
    wastePerSec: number;
    /** Function that determines when this building becomes visible/purchasable */
    unlockCondition?: (state: GameState) => boolean;
    /** Array of effects this building provides */
    effects: BuildingEffect[];
    /** Whether the player can toggle this building on/off */
    canDisable: boolean;
    /** What stage this building belongs to */
    stage: StageType;
}

// ================================================================================================
// EFFECTS
// ================================================================================================

/**
 * Union type of all possible building effects.
 * Buildings can have multiple effects of different types.
 */
type BuildingEffect = ProductionEffect | CapacityEffect | CapacitySetEffect | ConversionEffect | ModifierEffect;

/** Generates a resource from nothing (e.g., passive ATP generation) */
interface ProductionEffect {
    type: 'production';
    /** Which resource to produce */
    resource: string;
    /** Amount per second per building */
    value: number;
}

/** Adds to a resource's storage capacity */
interface CapacityEffect {
    type: 'capacity';
    /** Which resource's cap to increase */
    resource: string;
    /** Amount to add per building */
    value: number;
}

/** Sets a resource's capacity to a specific value (doesn't stack) */
interface CapacitySetEffect {
    type: 'capacitySet';
    /** Which resource's cap to set */
    resource: string;
    /** The value to set the cap to */
    value: number;
}

/**
 * Transforms resources into other resources.
 * Can handle 1:1, many:1, 1:many, or even pure production (empty inputs).
 */
interface ConversionEffect {
    type: 'conversion';
    /** What gets consumed (can be empty for pure production like sunlight) */
    inputs: ConversionIO[];
    /** What gets produced */
    outputs: ConversionIO[];
    /** If true (default), need ALL inputs available to run. If false, runs partially with available resources */
    requireAll?: boolean;
}

/** Input or output specification for a conversion effect */
interface ConversionIO {
    /** Which resource is consumed or produced */
    resource: string;
    /** Amount per second per building */
    rate: number;
}

/** Grants a modifier from a building (rare - usually upgrades do this) */
interface ModifierEffect {
    type: 'modifier';
    /** The modifier to grant */
    modifier: ModifierDef;
}

// ================================================================================================
// MODIFIERS
// ================================================================================================

/**
 * The calculation layer for a modifier.
 * Applied in order: (base + flat) × (1 + percent) × multiplier
 * Override replaces the value entirely (last one wins).
 */
type ModifierLayer = 'flat' | 'percent' | 'multiplier' | 'override';

/**
 * Definition for a modifier that can be attached to upgrades, mutations, etc.
 * This is the template - actual Modifier instances are created from these.
 */
interface ModifierDef {
    /** What this modifier affects, e.g. 'production.atp' or 'building.mitochondria.production.atp' */
    target: string;
    /** Which calculation layer this modifier applies to */
    layer: ModifierLayer;
    /** The modifier value (0.5 for +50% on percent layer, 1.25 for ×1.25 on multiplier layer) */
    value: number;
    /** Optional: only active when this function returns true */
    condition?: (state: GameState) => boolean;
}

/**
 * A modifier instance registered in the ModifierRegistry.
 * Created at runtime when upgrades are purchased, mutations trigger, etc.
 */
interface Modifier extends ModifierDef {
    /** Unique identifier for this modifier instance */
    id: string;
    /** What created this modifier, e.g. 'upgrade:cristae' or 'mutation:surge' */
    source: string;
    /** Unix timestamp when this modifier expires (undefined = permanent) */
    expiresAt?: number;
}

// ================================================================================================
// UPGRADES
// ================================================================================================

/**
 * Definition for a purchasable upgrade.
 * Upgrades permanently modify game values by creating modifiers.
 */
interface UpgradeDef {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Description/tooltip text */
    description: string;
    /** Cost to purchase, e.g. { dna: 10, biomass: 50 } */
    cost: Record<string, number>;
    /** Function that determines when this upgrade becomes visible/purchasable */
    unlockCondition?: (state: GameState) => boolean;
    /** The modifiers this upgrade creates when purchased */
    modifiers: ModifierDef[];
}

// ================================================================================================
// MUTATIONS
// ================================================================================================

/**
 * Definition for a mutation event.
 * Mutations are temporary effects that can grant DNA and modify game values.
 */
interface MutationDef {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Description/tooltip text */
    description: string;
    /** Whether this mutation is beneficial (true) or harmful (false) */
    isPositive: boolean;
    /** Duration in seconds (undefined = instant effect only, no ongoing modifiers) */
    duration?: number;
    /** DNA granted when this mutation triggers */
    baseDnaReward: number;
    /** Ongoing modifiers active for the duration */
    modifiers: ModifierDef[];
    /** One-time effects applied immediately when the mutation triggers */
    instantEffects?: InstantEffect[];
}

/** An instant effect applied when a mutation triggers */
interface InstantEffect {
    /** Whether to grant or remove the resource */
    type: 'grant' | 'remove';
    /** Which resource to affect */
    resource: string;
    /** Amount to grant or remove */
    amount: number;
}

// ================================================================================================
// EVOLUTION ORGANELLES
// ================================================================================================

/**
 * Definition for an evolution organelle.
 * Major permanent modifications available during evolution.
 */
interface EvolutionOrganelleDef {
    /** Unique identifier */
    id: string;
    /** Display name */
    name: string;
    /** Description/tooltip text */
    description: string;
    /** Cost to purchase */
    cost: Record<string, number>;
    /** Which lineage this organelle belongs to (if restricted) */
    lineage?: LineageType;
    /** Function that determines when this organelle becomes visible/purchasable */
    unlockCondition?: (state: GameState) => boolean;
    /** The modifiers this organelle creates when purchased */
    modifiers: ModifierDef[];
}

// ================================================================================================
// OFFLINE PROGRESS
// ================================================================================================

/** A tier in the offline efficiency curve */
interface EfficiencyTier {
    /** Maximum milliseconds for this tier */
    upTo: number;
    /** Efficiency rate (1.0 = 100%, 0.5 = 50%) */
    rate: number;
}

/** Report returned after calculating offline progress */
interface OfflineReport {
    /** Raw time elapsed in milliseconds */
    rawOfflineMs: number;
    /** Effective seconds after applying efficiency curve */
    effectiveSeconds: number;
    /** Overall efficiency ratio */
    efficiency: number;
    /** Resources gained during offline time */
    gains: Record<string, number>;
}

// ================================================================================================
// GAME STATE (Runtime)
// ================================================================================================

/**
 * The runtime game state interface.
 * This is what gets passed to unlock conditions and modifier conditions.
 * Actual implementation may have more properties.
 */
interface GameState {
    resources: Record<string, number>;
    buildings: Record<string, number>;
    buildingsEnabled: Record<string, boolean>;
    upgrades: string[];
    stats: CellStats;
}

// ================================================================================================
// EXPORTS
// ================================================================================================

export {
    // Save structures
    GameSave,
    StageType,
    GameMeta,
    LineageType,
    StagesSave,
    CellStageSave,
    CellResources,
    CellStats,

    // Buildings
    BuildingDef,

    // Effects
    BuildingEffect,
    ProductionEffect,
    CapacityEffect,
    CapacitySetEffect,
    ConversionEffect,
    ConversionIO,
    ModifierEffect,

    // Modifiers
    ModifierLayer,
    ModifierDef,
    Modifier,

    // Upgrades
    UpgradeDef,

    // Mutations
    MutationDef,
    InstantEffect,

    // Evolution
    EvolutionOrganelleDef,

    // Offline
    EfficiencyTier,
    OfflineReport,

    // Runtime
    GameState,
};
