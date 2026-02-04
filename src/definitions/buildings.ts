// Get types
import {BuildingDef} from '../core/types.js';

const DEFAULTS: Record<string, any> = {
    COST_SCALING: 1.15,
};

const BUILDINGS: Record<string, BuildingDef> = {
    // ! ==================== !
    // ! CELL STAGE BUILDINGS !
    // ! ==================== !

    // #region Cell Stage Buildings

    // @@ bm CELL: Cell Membrane - basic building
    cellMembrane: {
        id: 'cellMembrane',
        name: 'Cell Membrane',
        description: 'The outer layer of the cell, controlling what enters and leaves.',
        baseCost: {biomass: 5},
        costScaling: DEFAULTS.COST_SCALING,
        wastePerSec: 0.1,
        unlockCondition: undefined,
        effects: [
            {type: 'capacity', resource: 'nutrients', value: 20},
            {type: 'production', resource: 'stability', value: 0.5}, // Regenerate 0.5% stability per second
        ],
        canDisable: false,
        stage: 'cell',
    },

    // @@ bm CELL: Mitochondrion - produces energy
    mitochondria: {
        id: 'mitochondria',
        name: 'Mitochondria',
        description: 'The Powerhouse of the cell. Produces energy (ATP) for the cell.',
        baseCost: {biomass: 8, atp: 5},
        costScaling: DEFAULTS.COST_SCALING,
        wastePerSec: 0.2,
        unlockCondition: undefined,
        effects: [
            {type: 'conversion', inputs: [{resource: 'nutrients', rate: 2}], outputs: [{resource: 'atp', rate: 5}]},
            {type: 'capacity', resource: 'atp', value: 10},
        ],
        canDisable: true,
        stage: 'cell',
    },

    // @@ bm CELL: Ribosome - produces proteins
    ribosome: {
        id: 'ribosome',
        name: 'Ribosome',
        description: 'Produces proteins necessary for cell functions.',
        baseCost: {biomass: 20, atp: 15},
        costScaling: DEFAULTS.COST_SCALING,
        wastePerSec: 0.15,
        unlockCondition: (state) => state.buildings.mitochondria > 0,
        effects: [
            {type: 'conversion', inputs: [{resource: 'nutrients', rate: 1}], outputs: [{resource: 'biomass', rate: 0.5}]},
        ],
        canDisable: true,
        stage: 'cell',
    },

    // #endregion Cell Stage Buildings
};

export default BUILDINGS;
