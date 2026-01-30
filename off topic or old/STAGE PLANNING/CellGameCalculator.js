/**
 * CELL STAGE - Game Calculator
 * 
 * This class handles all calculations based on the current game state.
 * It computes effective values considering all modifiers, unlocks, etc.
 * This keeps calculations lazy and efficient - only computed when needed.
 */

const {
    RESOURCE_DEFINITIONS,
    BUILDING_DEFINITIONS,
    UPGRADE_DEFINITIONS,
    SPECIAL_MECHANICS,
} = require('./CellGameDefinitions');

class CellGameCalculator {
    constructor(gameState) {
        this.state = gameState;
        
        // Cache for expensive calculations (cleared on state change)
        this.cache = {
            resources: {},
            buildings: {},
            production: {},
            storage: {},
        };
    }
    
    // Clear cache when state changes
    invalidateCache() {
        this.cache = {
            resources: {},
            buildings: {},
            production: {},
            storage: {},
        };
    }
    
    // ===========================
    // RESOURCE QUERIES
    // ===========================
    
    getResource(resourceId) {
        if (this.cache.resources[resourceId]) {
            return this.cache.resources[resourceId];
        }
        
        const def = RESOURCE_DEFINITIONS[resourceId];
        if (!def) return null;
        
        const amount = this.state.resources[resourceId] || 0;
        const max = this.calculateResourceMax(resourceId);
        const production = this.calculateResourceProduction(resourceId);
        
        const result = {
            id: resourceId,
            name: def.displayName,
            description: def.description,
            amount,
            max,
            production,
            percentFull: max > 0 ? amount / max : 0,
            showBar: def.showBar,
            showInUI: def.showInUI,
        };
        
        this.cache.resources[resourceId] = result;
        return result;
    }
    
    // Calculate maximum storage for a resource
    calculateResourceMax(resourceId) {
        const def = RESOURCE_DEFINITIONS[resourceId];
        if (!def) return 0;
        
        let max = def.baseMax;
        
        // Apply building storage effects
        for (const [buildingId, count] of Object.entries(this.state.buildings)) {
            if (count === 0) continue;
            
            const buildingDef = BUILDING_DEFINITIONS[buildingId];
            if (!buildingDef) continue;
            
            const storageEffects = buildingDef.effects.filter(
                e => e.type === 'storage' && e.resource === resourceId
            );
            
            for (const effect of storageEffects) {
                max = this.applyModifier(max, effect, count);
            }
        }
        
        // Apply upgrade modifiers
        const modifiers = this.getActiveModifiers('storage', resourceId);
        for (const mod of modifiers) {
            // For storage modifiers from upgrades, we don't multiply by count
            max = this.applyModifier(max, mod, 1);
        }
        
        // Apply building-specific storage upgrades
        const buildingStorageModifiers = this.getActiveModifiers('buildingStorage', resourceId);
        for (const mod of buildingStorageModifiers) {
            const buildingCount = this.state.buildings[mod.building] || 0;
            max = this.applyModifier(max, mod, buildingCount);
        }
        
        return Math.max(0, max);
    }
    
    // Calculate production/consumption rate for a resource
    calculateResourceProduction(resourceId) {
        if (this.cache.production[resourceId] !== undefined) {
            return this.cache.production[resourceId];
        }
        
        let production = 0;
        
        // Sum production from all buildings
        for (const [buildingId, count] of Object.entries(this.state.buildings)) {
            if (count === 0) continue;
            
            const buildingDef = BUILDING_DEFINITIONS[buildingId];
            if (!buildingDef) continue;
            
            // Base production effects from building definition
            const productionEffects = buildingDef.effects.filter(
                e => e.type === 'production' && e.resource === resourceId
            );
            
            let buildingProduction = 0;
            for (const effect of productionEffects) {
                buildingProduction = this.applyModifier(buildingProduction, effect, 1);
            }
            
            // Apply building-specific production modifiers from upgrades
            const buildingModifiers = this.getActiveModifiers('buildingProduction', resourceId, buildingId);
            for (const mod of buildingModifiers) {
                buildingProduction = this.applyModifier(buildingProduction, mod, 1);
            }
            
            // Multiply by building count
            production += buildingProduction * count;
        }
        
        // Apply conditional production (like autophagy)
        for (const [buildingId, count] of Object.entries(this.state.buildings)) {
            if (count === 0) continue;
            
            const conditionalModifiers = this.getActiveModifiers('conditionalProduction', resourceId, buildingId);
            for (const mod of conditionalModifiers) {
                if (this.checkCondition(mod.condition)) {
                    production = this.applyModifier(production, mod, count);
                }
            }
        }
        
        this.cache.production[resourceId] = production;
        return production;
    }
    
    // ===========================
    // BUILDING QUERIES
    // ===========================
    
    getBuilding(buildingId) {
        if (this.cache.buildings[buildingId]) {
            return this.cache.buildings[buildingId];
        }
        
        const def = BUILDING_DEFINITIONS[buildingId];
        if (!def) return null;
        
        const count = this.state.buildings[buildingId] || 0;
        const cost = def.getCost(count);
        
        // Check if already unlocked (persistent) OR meets unlock condition
        let unlocked = this.state.unlockedBuildings.has(buildingId);
        if (!unlocked && def.isUnlocked(this)) {
            unlocked = true;
            this.state.unlockedBuildings.add(buildingId); // Permanently unlock
        }
        
        const affordable = this.canAfford(cost);
        
        const result = {
            id: buildingId,
            name: def.name,
            description: def.description,
            count,
            cost,
            unlocked,
            affordable,
            visible: unlocked || count > 0,
            singlePurchase: def.singlePurchase,
            maxReached: def.singlePurchase && count > 0,
            category: def.category,
            lineage: def.lineage,
        };
        
        this.cache.buildings[buildingId] = result;
        return result;
    }
    
    getAllBuildings() {
        return Object.keys(BUILDING_DEFINITIONS)
            .map(id => this.getBuilding(id))
            .filter(b => b.visible);
    }
    
    // ===========================
    // UPGRADE QUERIES
    // ===========================
    
    getUpgrade(upgradeId) {
        const def = UPGRADE_DEFINITIONS[upgradeId];
        if (!def) return null;
        
        // Skip hidden upgrades (auto-applied modifiers)
        if (def.hidden) return null;
        
        const purchased = this.state.upgrades[upgradeId] || false;
        const cost = def.getCost();
        
        // Check if already unlocked (persistent) OR meets unlock condition
        let unlocked = this.state.unlockedUpgrades.has(upgradeId);
        if (!unlocked && def.isUnlocked(this)) {
            unlocked = true;
            this.state.unlockedUpgrades.add(upgradeId); // Permanently unlock
        }
        
        const affordable = this.canAfford(cost);
        
        return {
            id: upgradeId,
            name: def.name,
            description: def.description,
            purchased,
            cost,
            unlocked,
            affordable,
            visible: unlocked || purchased,
            category: def.category,
            lineage: def.lineage,
            targetBuilding: def.targetBuilding,
        };
    }
    
    getAllUpgrades() {
        return Object.keys(UPGRADE_DEFINITIONS)
            .map(id => this.getUpgrade(id))
            .filter(u => u && u.visible);
    }
    
    // ===========================
    // MODIFIER SYSTEM
    // ===========================
    
    // Get all active modifiers of a specific type
    getActiveModifiers(type, resource = null, building = null) {
        const modifiers = [];
        
        // Check all purchased upgrades and owned buildings
        for (const [upgradeId, purchased] of Object.entries(this.state.upgrades)) {
            // For hidden upgrades, check if they're unlocked instead of purchased
            const def = UPGRADE_DEFINITIONS[upgradeId];
            if (!def) continue;
            
            const isActive = def.hidden ? def.isUnlocked(this) : purchased;
            if (!isActive) continue;
            
            for (const mod of def.modifiers) {
                if (mod.type !== type) continue;
                if (resource && mod.resource && mod.resource !== resource) continue;
                if (building && mod.building && mod.building !== building) continue;
                
                modifiers.push(mod);
            }
        }
        
        return modifiers;
    }
    
    // Apply a single modifier value
    applyModifier(currentValue, modifier, multiplier = 1) {
        const value = modifier.value * multiplier;
        
        switch (modifier.method) {
            case 'add':
                return currentValue + value;
            case 'mult':
                return currentValue * value;
            case 'set':
                return value;
            default:
                return currentValue;
        }
    }
    
    // Check if a condition is met
    checkCondition(condition) {
        if (!condition) return true;
        
        switch (condition.type) {
            case 'resourceAbove':
                const resource = this.getResource(condition.resource);
                return resource.percentFull >= condition.threshold;
            
            case 'resourceBelow':
                const res = this.getResource(condition.resource);
                return res.percentFull < condition.threshold;
            
            case 'buildingCount':
                const count = this.state.buildings[condition.building] || 0;
                return count >= condition.count;
            
            default:
                return true;
        }
    }
    
    // ===========================
    // COST/AFFORDABILITY
    // ===========================
    
    canAfford(cost) {
        for (const [resource, amount] of Object.entries(cost)) {
            if ((this.state.resources[resource] || 0) < amount) {
                return false;
            }
        }
        return true;
    }
    
    // ===========================
    // ACTIONS
    // ===========================
    
    purchaseBuilding(buildingId) {
        const building = this.getBuilding(buildingId);
        if (!building.unlocked || !building.affordable || building.maxReached) {
            return false;
        }
        
        // Deduct cost
        for (const [resource, amount] of Object.entries(building.cost)) {
            this.state.resources[resource] -= amount;
        }
        
        // Increment count
        this.state.buildings[buildingId]++;
        
        this.invalidateCache();
        return true;
    }
    
    purchaseUpgrade(upgradeId) {
        const upgrade = this.getUpgrade(upgradeId);
        if (!upgrade || !upgrade.unlocked || !upgrade.affordable || upgrade.purchased) {
            return false;
        }
        
        // Deduct cost
        for (const [resource, amount] of Object.entries(upgrade.cost)) {
            this.state.resources[resource] -= amount;
        }
        
        // Mark as purchased
        this.state.upgrades[upgradeId] = true;
        
        this.invalidateCache();
        return true;
    }
    
    clickResource(resourceId) {
        const mechanic = SPECIAL_MECHANICS[`${resourceId}Click`];
        if (!mechanic) return;
        
        let amount = mechanic.baseValue;
        
        // Apply click power modifiers
        const modifiers = this.getActiveModifiers('clickPower', resourceId);
        for (const mod of modifiers) {
            amount = this.applyModifier(amount, mod, 1);
        }
        
        // Add to resource (respecting max)
        const resource = this.getResource(resourceId);
        this.state.resources[resourceId] = Math.min(
            resource.max,
            this.state.resources[resourceId] + amount
        );
        
        this.invalidateCache();
    }
    
    // ===========================
    // GAME TICK
    // ===========================
    
    tick(deltaTime) {
        // deltaTime in seconds
        
        // Update all resource amounts based on production
        for (const resourceId of Object.keys(RESOURCE_DEFINITIONS)) {
            const production = this.calculateResourceProduction(resourceId);
            const resource = this.getResource(resourceId);
            
            let newAmount = this.state.resources[resourceId] + (production * deltaTime);
            
            // Clamp to [0, max]
            newAmount = Math.max(0, Math.min(resource.max, newAmount));
            
            this.state.resources[resourceId] = newAmount;
        }
        
        this.invalidateCache();
    }
}

module.exports = CellGameCalculator;
