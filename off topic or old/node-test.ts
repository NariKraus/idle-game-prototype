// example.ts
// Run with: npx ts-node example.ts
// Or: tsc example.ts && node example.js

type Mode = 'add' | 'mul' | 'set';
type Condition = (state: GameState) => boolean;

type Resource = 'atp' | 'nutrients';

interface Modifier {
    path: string;
    mode: Mode;
    value: number;
    priority: number;
    condition?: Condition;
    source?: string;
}

interface GameState {
    resources: {
        waste: number;
    };
    buildings: {
        mitochondrion: number;
    };
}

/* -----------------------------
   Definitions (author-facing)
-------------------------------- */

type ProductionMap = Partial<Record<Resource, number>>;

interface BuildingDef {
    production: ProductionMap;
}

const BUILDING_DEFS: Record<string, BuildingDef> = {
    mitochondrion: {
        production: {
            atp: 4,
            nutrients: -1,
        },
    },
};

/* -----------------------------
   Runtime: base modifiers
-------------------------------- */

function getBaseModifiers(state: GameState): Modifier[] {
    const mods: Modifier[] = [];

    for (const [id, count] of Object.entries(state.buildings)) {
        const def = BUILDING_DEFS[id];
        if (!def || count <= 0) continue;

        for (const [res, value] of Object.entries(def.production)) {
            mods.push({
                path: `building.${id}.production.${res}`,
                mode: 'add',
                value: value * count,
                priority: 0,
                source: id,
            });
        }
    }

    return mods;
}

/* -----------------------------
   Static modifiers (upgrades, lineage, etc)
-------------------------------- */

const STATIC_MODIFIERS: Modifier[] = [
    {
        path: 'building.mitochondrion.production.atp',
        mode: 'mul',
        value: 1.2,
        priority: 100,
        source: 'endoplasmicReticulum',
    },
    {
        path: 'building.mitochondrion.production.*',
        mode: 'mul',
        value: 1.1,
        priority: 100,
        source: 'metabolicLineage',
    },
    {
        path: 'building.mitochondrion.production.atp',
        mode: 'mul',
        value: 0.5,
        priority: 200,
        condition: (s) => s.resources.waste >= 50,
        source: 'wastePenalty',
    },
];

/* -----------------------------
   Resolver
-------------------------------- */

function matches(modPath: string, target: string): boolean {
    if (modPath === target) return true;
    if (modPath.endsWith('.*')) {
        return target.startsWith(modPath.slice(0, -2));
    }
    return false;
}

function resolve(path: string, state: GameState): number {
    const mods = [...getBaseModifiers(state), ...STATIC_MODIFIERS]
        .filter((m) => matches(m.path, path))
        .filter((m) => !m.condition || m.condition(state))
        .sort((a, b) => a.priority - b.priority);

    let value = 0;

    for (const m of mods) {
        switch (m.mode) {
            case 'add':
                value += m.value;
                break;
            case 'mul':
                value *= m.value;
                break;
            case 'set':
                value = m.value;
                break;
        }
    }

    return Number(value.toFixed(3));
}

/* -----------------------------
   Demo
-------------------------------- */

const lowWaste: GameState = {
    resources: {waste: 10},
    buildings: {mitochondrion: 2},
};

const highWaste: GameState = {
    resources: {waste: 80},
    buildings: {mitochondrion: 2},
};

console.log('ATP (low waste):', resolve('building.mitochondrion.production.atp', lowWaste));
console.log('ATP (high waste):', resolve('building.mitochondrion.production.atp', highWaste));
