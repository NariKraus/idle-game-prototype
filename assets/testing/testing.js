// Import EvolveSave.json for testing purposes
const json = require('./EvolveSave.json');
const resource = json.resource;

/**
 * RESOURCE OBJECT KEY DOCUMENTATION
 * 
 * Each resource in the game has the following possible properties:
 * 
 * CORE PROPERTIES (present in all resources):
 * - name: string - Display name shown to the player
 * - display: boolean - Whether this resource is visible in the UI
 * - amount: number - Current quantity of this resource
 * - max: number - Maximum storage capacity (-1 for crafted goods, -2 for special items)
 * - diff: number - Production/consumption rate per tick (can be negative)
 * - delta: number - Change in the diff rate (acceleration/deceleration)
 * - rate: number - Multiplier applied to production rates
 * - bar: boolean - Whether to show a progress/storage bar in UI
 * - crates: number - Quantity stored in crates (if stackable)
 * - containers: number - Quantity stored in containers (if stackable)
 * 
 * OPTIONAL PROPERTIES:
 * - value: number - Market/trade value of the resource
 * - stackable: boolean - Can be stored in crates/containers for expanded storage
 * - trade: number - Current trade balance or trade rate
 * - gen: number - Generation rate (used for special resources like Mana)
 * - gen_d: number - Generation delta (change in generation rate)
 */

// Find all the unique keys in the resource array, and their types
const resourceKeys = {};

// Analyze each resource to catalog all properties
Object.entries(resource).forEach(([name, resourceObj]) => {
    Object.entries(resourceObj).forEach(([key, value]) => {
        if (!resourceKeys[key]) {
            resourceKeys[key] = {
                type: typeof value,
                count: 1,
                names: [name],
                all: false,
            };
        } else {
            resourceKeys[key].count += 1;
            resourceKeys[key].names.push(name);
        }

        // If the count matches the total number of resources, mark as 'all'
        if (resourceKeys[key].count === Object.keys(resource).length) {
            resourceKeys[key].all = true;
        }
    });
});

// Save analysis as a JSON file
const fs = require('fs');
fs.writeFileSync('assets/testing/resourceKeys.json', JSON.stringify(resourceKeys, null, 2));
