// ============================================
// BAREBONES MEDIEVAL BUILDING EXAMPLE
// Run with: node medieval-example.js
// ============================================

// --- MODIFIER REGISTRY ---
class ModifierRegistry {
    constructor() {
        this.modifiers = new Map();
        this.onChangeCallback = null;  // Called when modifiers change
    }

    // Set a callback to be notified when modifiers change
    onChange(callback) {
        this.onChangeCallback = callback;
    }

    _notifyChange() {
        if (this.onChangeCallback) this.onChangeCallback();
    }

    add(mod) {
        this.modifiers.set(mod.id, mod);
        this._notifyChange();
        console.log(`  [Modifier Added] ${mod.id}: ${mod.layer} ${mod.value} → ${mod.target}`);
    }

    remove(id) {
        if (this.modifiers.delete(id)) {
            this._notifyChange();
        }
    }

    calculate(target, baseValue) {
        const mods = [];
        for (const mod of this.modifiers.values()) {
            if (mod.target === target || target.startsWith(mod.target + '.')) {
                mods.push(mod);
            }
        }

        // Check for overrides first
        const overrides = mods.filter((m) => m.layer === 'override');
        if (overrides.length > 0) {
            return overrides[overrides.length - 1].value;
        }

        const flatTotal = mods.filter((m) => m.layer === 'flat').reduce((sum, m) => sum + m.value, 0);
        const percentTotal = mods.filter((m) => m.layer === 'percent').reduce((sum, m) => sum + m.value, 0);
        const multiplierTotal = mods.filter((m) => m.layer === 'multiplier').reduce((product, m) => product * m.value, 1);

        return (baseValue + flatTotal) * (1 + percentTotal) * multiplierTotal;
    }
}

// --- BUILDING DEFINITIONS ---
// These define what buildings DO - you write these by hand
const BUILDINGS = {
    farm: {
        id: 'farm',
        name: 'Farm',
        baseCost: {wood: 10, gold: 5},
        costScaling: 1.15,
        effects: [
            {type: 'production', resource: 'food', value: 2}, // +2 food/sec per farm
        ],
    },

    lumberMill: {
        id: 'lumberMill',
        name: 'Lumber Mill',
        baseCost: {gold: 15},
        costScaling: 1.2,
        effects: [
            {type: 'production', resource: 'wood', value: 1.5}, // +1.5 wood/sec
        ],
    },

    quarry: {
        id: 'quarry',
        name: 'Quarry',
        baseCost: {wood: 20, gold: 10},
        costScaling: 1.25,
        effects: [
            {type: 'production', resource: 'stone', value: 1}, // +1 stone/sec
        ],
    },

    bakery: {
        id: 'bakery',
        name: 'Bakery',
        baseCost: {wood: 25, stone: 10},
        costScaling: 1.15,
        effects: [
            // Conversion: consumes 1 food/sec, produces 0.5 gold/sec (selling bread)
            {
                type: 'conversion',
                inputs: [{resource: 'food', rate: 1}],
                outputs: [{resource: 'gold', rate: 0.5}],
            },
        ],
    },

    market: {
        id: 'market',
        name: 'Market',
        baseCost: {wood: 50, stone: 30},
        costScaling: 1.5,
        effects: [
            // Conversion: stone + wood → gold
            {
                type: 'conversion',
                inputs: [
                    {resource: 'stone', rate: 0.5},
                    {resource: 'wood', rate: 0.5},
                ],
                outputs: [{resource: 'gold', rate: 1}],
            },
        ],
    },
};

// --- UPGRADE DEFINITIONS ---
// These define MODIFIERS - you write these by hand too
const UPGRADES = {
    ironPlows: {
        id: 'ironPlows',
        name: 'Iron Plows',
        description: 'Farms produce 50% more food',
        cost: {gold: 50},
        modifiers: [{target: 'building.farm.production.food', layer: 'percent', value: 0.5}],
    },

    betterAxes: {
        id: 'betterAxes',
        name: 'Better Axes',
        description: 'Lumber Mills produce +1 flat wood/sec',
        cost: {gold: 40},
        modifiers: [{target: 'building.lumberMill.production.wood', layer: 'flat', value: 1}],
    },

    tradeRoutes: {
        id: 'tradeRoutes',
        name: 'Trade Routes',
        description: 'All gold production x1.25',
        cost: {gold: 100},
        modifiers: [{target: 'production.gold', layer: 'multiplier', value: 1.25}],
    },
};

// --- GAME STATE ---
const state = {
    resources: {
        gold: 200,
        food: 50,
        wood: 100,
        stone: 50,
    },
    buildings: {
        farm: 0,
        lumberMill: 0,
        quarry: 0,
        bakery: 0,
        market: 0,
    },
    upgrades: [], // IDs of purchased upgrades
};

const modifiers = new ModifierRegistry();

// --- PRODUCTION RATE CACHE ---
// Only recalculate when something changes
const rateCache = {
    dirty: true,           // Start dirty so first calc runs
    rates: null,           // Cached production rates
    recalcCount: 0,        // For debugging - count how many times we actually recalc
    cacheHitCount: 0       // For debugging - count cache hits
};

function markRatesDirty() {
    if (!rateCache.dirty) {
        rateCache.dirty = true;
        // console.log('  [Cache] Marked dirty');
    }
}

// Hook up modifier changes to invalidate cache
modifiers.onChange(markRatesDirty);

// --- HELPER FUNCTIONS ---

function getBuildingCost(buildingId) {
    const def = BUILDINGS[buildingId];
    const owned = state.buildings[buildingId];
    const cost = {};
    for (const [resource, baseCost] of Object.entries(def.baseCost)) {
        cost[resource] = Math.floor(baseCost * Math.pow(def.costScaling, owned));
    }
    return cost;
}

function canAfford(cost) {
    for (const [resource, amount] of Object.entries(cost)) {
        if (state.resources[resource] < amount) return false;
    }
    return true;
}

function spendResources(cost) {
    for (const [resource, amount] of Object.entries(cost)) {
        state.resources[resource] -= amount;
    }
}

function purchaseBuilding(buildingId) {
    const cost = getBuildingCost(buildingId);
    if (!canAfford(cost)) {
        console.log(`  Cannot afford ${BUILDINGS[buildingId].name}`);
        return false;
    }
    spendResources(cost);
    state.buildings[buildingId]++;
    markRatesDirty();  // <-- Invalidate cache when buildings change
    console.log(`  Purchased ${BUILDINGS[buildingId].name} (now own ${state.buildings[buildingId]})`);
    return true;
}

function purchaseUpgrade(upgradeId) {
    const upgrade = UPGRADES[upgradeId];
    if (state.upgrades.includes(upgradeId)) {
        console.log(`  Already own ${upgrade.name}`);
        return false;
    }
    if (!canAfford(upgrade.cost)) {
        console.log(`  Cannot afford ${upgrade.name}`);
        return false;
    }
    spendResources(upgrade.cost);
    state.upgrades.push(upgradeId);

    // Register the modifiers from this upgrade
    console.log(`  Purchased upgrade: ${upgrade.name}`);
    for (let i = 0; i < upgrade.modifiers.length; i++) {
        const modDef = upgrade.modifiers[i];
        modifiers.add({
            id: `upgrade:${upgradeId}:${i}`,
            source: `upgrade:${upgradeId}`,
            target: modDef.target,
            layer: modDef.layer,
            value: modDef.value,
        });
    }
    return true;
}

// --- PRODUCTION CALCULATION ---

function calculateProductionRates() {
    // Return cached rates if nothing has changed
    if (!rateCache.dirty && rateCache.rates !== null) {
        rateCache.cacheHitCount++;
        return rateCache.rates;
    }

    // Actually calculate (only when dirty)
    rateCache.recalcCount++;
    const rates = {gold: 0, food: 0, wood: 0, stone: 0};

    for (const [buildingId, count] of Object.entries(state.buildings)) {
        if (count <= 0) continue;

        const def = BUILDINGS[buildingId];
        for (const effect of def.effects) {
            if (effect.type === 'production') {
                // Get base production per building
                const basePerBuilding = effect.value;

                // Apply building-specific modifiers
                const modifiedPerBuilding = modifiers.calculate(`building.${buildingId}.production.${effect.resource}`, basePerBuilding);

                rates[effect.resource] += count * modifiedPerBuilding;
            }
        }
    }

    // Apply global modifiers to each resource
    for (const resource of Object.keys(rates)) {
        rates[resource] = modifiers.calculate(`production.${resource}`, rates[resource]);
    }

    // Cache the result
    rateCache.rates = rates;
    rateCache.dirty = false;

    return rates;
}

// --- CONVERSION PROCESSING ---

function processConversions(delta) {
    for (const [buildingId, count] of Object.entries(state.buildings)) {
        if (count <= 0) continue;

        const def = BUILDINGS[buildingId];
        const conversions = def.effects.filter((e) => e.type === 'conversion');

        for (const conv of conversions) {
            // Check if we have enough inputs
            let canRun = conv.inputs.every((input) => state.resources[input.resource] >= input.rate * delta * count);

            if (!canRun) continue;

            // Consume inputs
            for (const input of conv.inputs) {
                state.resources[input.resource] -= input.rate * delta * count;
            }

            // Produce outputs (with modifiers)
            for (const output of conv.outputs) {
                const baseOutput = output.rate * count;
                const modifiedOutput = modifiers.calculate(`building.${buildingId}.production.${output.resource}`, baseOutput);
                // Also apply global modifiers
                const finalOutput = modifiers.calculate(`production.${output.resource}`, modifiedOutput);
                state.resources[output.resource] += finalOutput * delta;
            }
        }
    }
}

// --- GAME TICK ---

function tick(delta) {
    // Calculate and apply simple production
    const rates = calculateProductionRates();
    for (const [resource, rate] of Object.entries(rates)) {
        state.resources[resource] += rate * delta;
    }

    // Process conversions
    processConversions(delta);
}

// --- DISPLAY ---

function logState(label) {
    console.log(`\n=== ${label} ===`);
    console.log(
        'Resources:',
        Object.entries(state.resources)
            .map(([k, v]) => `${k}: ${v.toFixed(1)}`)
            .join(', '),
    );
    console.log(
        'Buildings:',
        Object.entries(state.buildings)
            .filter(([k, v]) => v > 0)
            .map(([k, v]) => `${BUILDINGS[k].name}: ${v}`)
            .join(', ') || '(none)',
    );
    console.log('Upgrades:', state.upgrades.map((id) => UPGRADES[id].name).join(', ') || '(none)');
}

function logRates() {
    const rates = calculateProductionRates();
    console.log(
        'Production rates:',
        Object.entries(rates)
            .filter(([k, v]) => v !== 0)
            .map(([k, v]) => `${k}: ${v.toFixed(2)}/sec`)
            .join(', ') || '(none)',
    );
}

// ============================================
// SIMULATION
// ============================================

console.log('╔════════════════════════════════════════════╗');
console.log('║   MEDIEVAL BUILDING SYSTEM DEMO            ║');
console.log('╚════════════════════════════════════════════╝');

logState('INITIAL STATE');

// Purchase some buildings
console.log('\n--- Purchasing buildings ---');
purchaseBuilding('farm');
purchaseBuilding('farm');
purchaseBuilding('lumberMill');
purchaseBuilding('quarry');

logState('AFTER INITIAL PURCHASES');
logRates();

// Simulate 5 seconds
console.log('\n--- Simulating 5 seconds ---');
for (let i = 0; i < 5; i++) {
    tick(1); // 1 second per tick for clarity
}

logState('AFTER 5 SECONDS');

// Purchase an upgrade
console.log('\n--- Purchasing Iron Plows upgrade ---');
purchaseUpgrade('ironPlows');
logRates();

// Simulate 5 more seconds
console.log('\n--- Simulating 5 more seconds ---');
for (let i = 0; i < 5; i++) {
    tick(1);
}

logState('AFTER UPGRADE + 5 SECONDS');

// Purchase bakery (conversion building)
console.log('\n--- Purchasing Bakery (converts food → gold) ---');
purchaseBuilding('bakery');

// Simulate 5 seconds to see conversion
console.log('\n--- Simulating 5 seconds with bakery ---');
for (let i = 0; i < 5; i++) {
    tick(1);
}

logState('AFTER BAKERY + 5 SECONDS');

// Purchase trade routes (global multiplier)
console.log('\n--- Purchasing Trade Routes upgrade (x1.25 gold) ---');
purchaseUpgrade('tradeRoutes');
logRates();

// Final simulation
console.log('\n--- Final 10 second simulation ---');
for (let i = 0; i < 10; i++) {
    tick(1);
}

logState('FINAL STATE');

// Show cache efficiency
console.log('\n--- Cache Statistics ---');
console.log(`  Actual recalculations: ${rateCache.recalcCount}`);
console.log(`  Cache hits (avoided recalcs): ${rateCache.cacheHitCount}`);
console.log(`  Efficiency: ${((rateCache.cacheHitCount / (rateCache.cacheHitCount + rateCache.recalcCount)) * 100).toFixed(1)}% of calls used cache`);

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   DEMO COMPLETE                            ║');
console.log('╚════════════════════════════════════════════╝');
