// Resource class with bar rendering
class Resource {
    constructor(name, textElement, barElement, maxVal = 100) {
        this.name = name;
        this.val = 0;
        this.maxVal = maxVal;
        this.textElement = textElement;
        this.barElement = barElement;
        this.lastRenderedVal = -1;
    }
    
    refresh() {
        const currentVal = Math.floor(this.val);
        if (currentVal !== this.lastRenderedVal) {
            this.textElement.textContent = `${currentVal} / ${this.maxVal}`;
            this.lastRenderedVal = currentVal;
        }
        
        // Update bar width (always update for smooth animation)
        const percentage = Math.min((this.val / this.maxVal) * 100, 100);
        this.barElement.style.width = `${percentage}%`;
    }
}

// Game state
const gameState = {
    money: 0,
    buildings: {
        house: 0,
        farm: 0,
        quarry: 0,
        lumberMill: 0,
    },
    workers: {
        unassigned: {
            count: 0,
            name: 'Unemployed',
            default: true,
        },
        farm: {
            count: 0,
            name: 'Farmer',
            default: false,
        },
        quarry: {
            count: 0,
            name: 'Quarry Worker',
            default: false,
        },
        lumberMill: {
            count: 0,
            name: 'Lumberjack',
            default: false,
        },
    },
    lastTick: Date.now(),
    gameSpeed: 1,
};

// Initialize resources with DOM references
const resources = {
    wood: new Resource(
        'wood',
        document.getElementById('wood-text'),
        document.getElementById('wood-bar'),
        100
    ),
    stone: new Resource(
        'stone',
        document.getElementById('stone-text'),
        document.getElementById('stone-bar'),
        100
    ),
    food: new Resource(
        'food',
        document.getElementById('food-text'),
        document.getElementById('food-bar'),
        100
    ),
};

// Helper functions
function addMoney(amount) {
    gameState.money += amount;
}

function addResource(type, amount) {
    if (resources[type]) {
        resources[type].val += amount;
        // Cap at max
        if (resources[type].val > resources[type].maxVal) {
            resources[type].val = resources[type].maxVal;
        }
    }
}

function addBuilding(type) {
    if (gameState.buildings[type] !== undefined) {
        gameState.buildings[type] += 1;
    }
}

function addWorker(n = 1) {
    gameState.workers.unassigned.count += n;
    renderWorkers();
}

function assignWorker(type, n = 1) {
    const defaultPool = Object.values(gameState.workers).find(worker => worker.default);

    if (defaultPool && defaultPool.count >= n && gameState.workers[type]) {
        defaultPool.count -= n;
        gameState.workers[type].count += n;
        renderWorkers();
    }
}

function setGameSpeed(speed) {
    gameState.gameSpeed = speed;
}

// Game tick
function gameTick() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastTick) / 1000;
    gameState.lastTick = now;

    // Resource generation logic
    resources.food.val += gameState.workers.farm.count * 1 * deltaTime;
    resources.stone.val += gameState.workers.quarry.count * 1 * deltaTime;
    resources.wood.val += gameState.workers.lumberMill.count * 1 * deltaTime;

    // Cap resources at max
    Object.values(resources).forEach(resource => {
        if (resource.val > resource.maxVal) {
            resource.val = resource.maxVal;
        }
    });
}

// Render
function render() {
    // Update all resource bars
    Object.values(resources).forEach(resource => resource.refresh());
}

function renderWorkers() {
    const workerDisplay = document.getElementById('worker-display');
    workerDisplay.innerHTML = `
        Unemployed: ${gameState.workers.unassigned.count}<br>
        Farmers: ${gameState.workers.farm.count}<br>
        Quarry Workers: ${gameState.workers.quarry.count}<br>
        Lumberjacks: ${gameState.workers.lumberMill.count}
    `;
}

// Game loop
setInterval(() => {
    if (gameState.gameSpeed === 1) {
        gameTick();
        render();
    }
}, 1000 / 24); // 24 frames per second

// Initial render
renderWorkers();

// Expose functions for console testing
window.addMoney = addMoney;
window.addResource = addResource;
window.addBuilding = addBuilding;
window.addWorker = addWorker;
window.assignWorker = assignWorker;
window.setGameSpeed = setGameSpeed;
window.resources = resources;

console.log('Commands available:');
console.log('addWorker(n) - Add unemployed workers');
console.log('assignWorker(type, n) - Assign workers to lumberMill, quarry, or farm');
console.log('addResource(type, amount) - Manually add resources');
