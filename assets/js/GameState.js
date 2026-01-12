// GameState.js
// Core game state management for the Cell Stage

class GameState {
    constructor(stageData) {
        this.data = this._deepClone(stageData);
        this.lastTick = Date.now();
        this.cellStage = new CellStage(this.data);
    }

    /**
     * Main game tick - updates all resources based on building production
     */
    tick() {
        const now = Date.now();
        const deltaTime = (now - this.lastTick) / 1000; // Convert to seconds
        this.lastTick = now;

        // Process each building's production
        for (const [buildingKey, buildingData] of Object.entries(this.data.buildings)) {
            if (buildingData.count > 0) {
                const building = this.cellStage.buildings[buildingKey];
                const rate = building.resourceChangeRate;
                
                for (const [resourceKey, ratePerSecond] of Object.entries(rate)) {
                    const resource = this.data.resources[resourceKey];
                    if (resource && typeof resource.amount === 'number') {
                        const totalChange = ratePerSecond * buildingData.count * deltaTime;
                        this._applyResourceChange(resource, totalChange);
                    }
                }
            }
        }
    }

    /**
     * Perform an action (e.g., gather nutrients, manual click actions)
     * @param {string} actionType - The effect type to calculate (e.g., 'nutrientAbsorption')
     * @returns {Object} - The resources gained from the action
     */
    performAction(actionType) {
        const actionEffects = this.cellStage.getAllActionEffects(actionType);
        const results = {};

        // Group effects by type
        const grouped = actionEffects.reduce(
            (acc, eff) => {
                if (eff.type === 'additive') {
                    acc.additive.push(eff);
                } else if (eff.type === 'multiplicative') {
                    acc.multiplicative.push(eff);
                } else if (eff.type === 'set') {
                    acc.set.push(eff);
                }
                return acc;
            },
            {additive: [], multiplicative: [], set: []}
        );

        let totalValue = 0;

        // Apply additive effects
        grouped.additive.forEach((eff) => {
            totalValue += eff.value;
        });

        // Apply multiplicative effects
        grouped.multiplicative.forEach((eff) => {
            totalValue *= eff.value;
        });

        // Apply set effects (overrides everything)
        grouped.set.forEach((eff) => {
            totalValue = eff.value;
        });

        // Apply the result to the appropriate resource
        // For nutrientAbsorption, the resource property indicates which resource to add
        const targetResource = actionEffects[0]?.resource || actionType;
        
        if (actionType === 'nutrientAbsorption') {
            // Special case: nutrientAbsorption adds to nutrients
            const nutrientResource = this.data.resources.nutrients;
            if (nutrientResource) {
                this._applyResourceChange(nutrientResource, totalValue);
                results.nutrients = totalValue;
            }
        } else {
            // Generic handling for other action types
            const resource = this.data.resources[targetResource];
            if (resource) {
                this._applyResourceChange(resource, totalValue);
                results[targetResource] = totalValue;
            }
        }

        return results;
    }

    /**
     * Get the current value of an action (useful for displaying button tooltips)
     * @param {string} actionType - The effect type to calculate
     * @returns {number} - The total value of the action
     */
    getActionValue(actionType) {
        const actionEffects = this.cellStage.getAllActionEffects(actionType);
        
        const grouped = actionEffects.reduce(
            (acc, eff) => {
                if (eff.type === 'additive') {
                    acc.additive.push(eff);
                } else if (eff.type === 'multiplicative') {
                    acc.multiplicative.push(eff);
                } else if (eff.type === 'set') {
                    acc.set.push(eff);
                }
                return acc;
            },
            {additive: [], multiplicative: [], set: []}
        );

        let totalValue = 0;

        // Apply additive effects
        grouped.additive.forEach((eff) => {
            totalValue += eff.value;
        });

        // Apply multiplicative effects
        grouped.multiplicative.forEach((eff) => {
            totalValue *= eff.value;
        });

        // Apply set effects
        grouped.set.forEach((eff) => {
            totalValue = eff.value;
        });

        return totalValue;
    }

    /**
     * Purchase a building
     * @param {string} buildingKey - The key of the building to purchase
     * @param {number} count - Number of buildings to purchase (default: 1)
     * @returns {boolean} - Whether the purchase was successful
     */
    buyBuilding(buildingKey, count = 1) {
        const building = this.data.buildings[buildingKey];
        if (!building) return false;

        // Check if single purchase and already owned
        if (building.singlePurchase && building.count > 0) {
            return false;
        }

        // Calculate total cost
        const cost = this._calculateBuildingCost(buildingKey, count);
        
        // Check if we can afford it
        if (!this._canAfford(cost)) return false;

        // Deduct resources
        for (const [resourceKey, amount] of Object.entries(cost)) {
            this.data.resources[resourceKey].amount -= amount;
        }

        // Add building
        building.count += count;
        
        // Invalidate any cached calculations
        this.cellStage.invalidateCache();

        return true;
    }

    /**
     * Purchase an upgrade
     * @param {string} upgradeKey - The key of the upgrade to purchase
     * @returns {boolean} - Whether the purchase was successful
     */
    buyUpgrade(upgradeKey) {
        const upgrade = this.data.upgrades[upgradeKey];
        if (!upgrade || upgrade.purchased) return false;

        // Check if we can afford it
        if (!this._canAfford(upgrade.cost)) return false;

        // Deduct resources
        for (const [resourceKey, amount] of Object.entries(upgrade.cost)) {
            this.data.resources[resourceKey].amount -= amount;
        }

        // Mark as purchased
        upgrade.purchased = true;

        // Invalidate any cached calculations
        this.cellStage.invalidateCache();

        return true;
    }

    /**
     * Get the current production rate for a specific building
     * @param {string} buildingKey - The building to check
     * @returns {Object} - Resource production rates per second
     */
    getBuildingProductionRate(buildingKey) {
        const building = this.cellStage.buildings[buildingKey];
        return building ? building.productionRate : {};
    }

    /**
     * Get the total production rate across all buildings
     * @returns {Object} - Total resource production rates per second
     */
    getTotalProductionRate() {
        const totalRates = {};
        
        for (const [buildingKey, buildingData] of Object.entries(this.data.buildings)) {
            if (buildingData.count > 0) {
                const building = this.cellStage.buildings[buildingKey];
                const rate = building.resourceChangeRate;
                
                for (const [resourceKey, ratePerSecond] of Object.entries(rate)) {
                    if (!totalRates[resourceKey]) totalRates[resourceKey] = 0;
                    totalRates[resourceKey] += ratePerSecond * buildingData.count;
                }
            }
        }
        
        return totalRates;
    }

    /**
     * Check if unlock conditions are met for a building
     * @param {string} buildingKey - The building to check
     * @returns {boolean} - Whether the building is unlocked
     */
    isBuildingUnlocked(buildingKey) {
        const building = this.data.buildings[buildingKey];
        if (!building || !building.unlockCondition) return true;

        for (const [requiredBuilding, requiredCount] of Object.entries(building.unlockCondition)) {
            const ownedCount = this.data.buildings[requiredBuilding]?.count || 0;
            if (ownedCount < requiredCount) return false;
        }

        return true;
    }

    /**
     * Check if unlock conditions are met for an upgrade
     * @param {string} upgradeKey - The upgrade to check
     * @returns {boolean} - Whether the upgrade is unlocked
     */
    isUpgradeUnlocked(upgradeKey) {
        const upgrade = this.data.upgrades[upgradeKey];
        if (!upgrade || !upgrade.unlockCondition) return true;

        for (const [requiredBuilding, requiredCount] of Object.entries(upgrade.unlockCondition)) {
            const ownedCount = this.data.buildings[requiredBuilding]?.count || 0;
            if (ownedCount < requiredCount) return false;
        }

        return true;
    }

    // Private helper methods
    _applyResourceChange(resource, change) {
        const newAmount = resource.amount + change;
        resource.amount = Math.max(0, Math.min(newAmount, resource.max));
        return {
            capped: newAmount > resource.max,
            depleted: newAmount < 0,
        };
    }

    _calculateBuildingCost(buildingKey, count) {
        const building = this.data.buildings[buildingKey];
        const baseCost = building.defaultCost;
        const currentCount = building.count;
        
        // Simple linear scaling for now (can be enhanced with exponential)
        const cost = {};
        for (const [resourceKey, baseAmount] of Object.entries(baseCost)) {
            cost[resourceKey] = baseAmount * count;
        }
        
        return cost;
    }

    _canAfford(cost) {
        for (const [resourceKey, amount] of Object.entries(cost)) {
            const resource = this.data.resources[resourceKey];
            if (!resource || resource.amount < amount) {
                return false;
            }
        }
        return true;
    }

    _deepClone(obj) {
        return JSON.parse(JSON.stringify(obj));
    }
}

class CellStage {
    constructor(data) {
        this._buildings = data.buildings;
        this._upgrades = data.upgrades;

        this.buildings = {};
        for (const [buildingKey, buildingData] of Object.entries(this._buildings)) {
            this.buildings[buildingKey] = new Building(buildingKey, buildingData, this);
        }
    }

    /**
     * Get all effects that apply to a specific building
     * @param {string} buildingKey - The building to get effects for
     * @param {string} effectType - The type of effect (e.g., 'production', 'wasteProduction')
     * @returns {Array} - Array of effect objects
     */
    getAllEffectsForBuilding(buildingKey, effectType) {
        let effects = [];

        // 1. Building's own effects
        const building = this._buildings[buildingKey];
        if (building.effects && building.effects[effectType]) {
            effects = effects.concat(building.effects[effectType]);
        }

        // 2. Effects from other buildings that target this building
        for (const [otherKey, otherData] of Object.entries(this._buildings)) {
            if (otherKey === buildingKey) continue;
            if (otherData.count && otherData.effects && otherData.effects[effectType]) {
                for (const eff of otherData.effects[effectType]) {
                    if (eff.building === buildingKey) {
                        effects.push(eff);
                    }
                }
            }
        }

        // 3. Effects from upgrades that target this building
        for (const upg of Object.values(this._upgrades)) {
            if (upg.purchased && upg.effects && upg.effects[effectType]) {
                for (const eff of upg.effects[effectType]) {
                    if (eff.building === buildingKey) {
                        effects.push(eff);
                    }
                }
            }
        }

        return effects;
    }

    /**
     * Get all effects for an action type (e.g., nutrientAbsorption for click actions)
     * @param {string} actionType - The action/effect type to collect
     * @returns {Array} - Array of effect objects
     */
    getAllActionEffects(actionType) {
        let effects = [];

        // 1. Effects from buildings with count > 0
        for (const [buildingKey, buildingData] of Object.entries(this._buildings)) {
            if (buildingData.count > 0 && buildingData.effects && buildingData.effects[actionType]) {
                effects = effects.concat(buildingData.effects[actionType]);
            }
        }

        // 2. Effects from purchased upgrades
        for (const upg of Object.values(this._upgrades)) {
            if (upg.purchased && upg.effects && upg.effects[actionType]) {
                effects = effects.concat(upg.effects[actionType]);
            }
        }

        return effects;
    }

    invalidateCache() {
        for (const building of Object.values(this.buildings)) {
            building._productionCacheInvalid = true;
            building._wasteCacheInvalid = true;
        }
    }
}

class Building {
    constructor(key, data, cellStage) {
        this.key = key;
        this.data = data;
        this.cellStage = cellStage;
        
        this._productionCache = null;
        this._productionCacheInvalid = true;
        this._wasteCache = null;
        this._wasteCacheInvalid = true;
    }

    /**
     * Get the total resource change rate (production + waste)
     */
    get resourceChangeRate() {
        let rate = {...this.productionRate};
        rate.waste = (rate.waste || 0) + this.wasteProductionRate;
        return rate;
    }

    /**
     * Get production rate with all effects applied
     */
    get productionRate() {
        if (this._productionCacheInvalid || !this._productionCache) {
            this._productionCache = this._getProduction();
            this._productionCacheInvalid = false;
        }
        return this._productionCache;
    }

    /**
     * Get waste production rate with all effects applied
     */
    get wasteProductionRate() {
        if (this._wasteCacheInvalid || !this._wasteCache) {
            this._wasteCache = this._getWasteProduction();
            this._wasteCacheInvalid = false;
        }
        return this._wasteCache;
    }

    _getProduction() {
        const effects = this.cellStage.getAllEffectsForBuilding(this.key, 'production').reduce(
            (acc, val) => {
                if (val.type === 'additive') {
                    acc.additive.push(val);
                } else if (val.type === 'multiplicative') {
                    acc.multiplicative.push(val);
                } else if (val.type === 'set') {
                    acc.set.push(val);
                }
                return acc;
            },
            {additive: [], multiplicative: [], set: []}
        );

        let totalProduction = {};
        
        // Apply additive effects
        effects.additive.forEach((eff) => {
            if (!totalProduction[eff.resource]) totalProduction[eff.resource] = 0;
            totalProduction[eff.resource] += eff.value;
        });
        
        // Apply multiplicative effects
        effects.multiplicative.forEach((eff) => {
            if (eff.resource) {
                // Multiply a specific resource
                if (totalProduction[eff.resource]) {
                    totalProduction[eff.resource] *= eff.value;
                }
            } else {
                // Multiply all resources (building-wide effect)
                for (const res in totalProduction) {
                    totalProduction[res] *= eff.value;
                }
            }
        });
        
        // Apply set effects
        effects.set.forEach((eff) => {
            totalProduction[eff.resource] = eff.value;
        });

        return totalProduction;
    }

    _getWasteProduction() {
        const effects = this.cellStage.getAllEffectsForBuilding(this.key, 'wasteProduction').reduce(
            (acc, val) => {
                if (val.type === 'additive') {
                    acc.additive.push(val);
                } else if (val.type === 'multiplicative') {
                    acc.multiplicative.push(val);
                } else if (val.type === 'set') {
                    acc.set.push(val);
                }
                return acc;
            },
            {additive: [], multiplicative: [], set: []}
        );
        
        let totalWasteProduction = this.data.wasteProduction || 0;
        
        // Apply additive effects
        effects.additive.forEach((eff) => {
            totalWasteProduction += eff.value;
        });
        
        // Apply multiplicative effects
        effects.multiplicative.forEach((eff) => {
            totalWasteProduction *= eff.value;
        });
        
        // Apply set effects
        effects.set.forEach((eff) => {
            totalWasteProduction = eff.value;
        });
        
        return totalWasteProduction;
    }
}

// Export for Node.js
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {GameState, CellStage, Building};
}
