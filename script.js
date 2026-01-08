const gameState = {
    money: 0,
    resources: {
        wood: 0,
        stone: 0,
        food: 0,
    },
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
    gameSpeed: 1, // 0 = paused, 1 = normal
};

// Helper functions for pre-html testing
function addMoney(amount) {
    gameState.money += amount;
}
function addResource(type, amount) {
    if (gameState.resources[type] !== undefined) {
        gameState.resources[type] += amount;
    }
}
function addBuilding(type) {
    if (gameState.buildings[type] !== undefined) {
        gameState.buildings[type] += 1;
    }
}
function addWorker(n = 1) {
    gameState.workers.unassigned.count += n;
}
// Workers should be pushed from the "default" pool to their assigned jobs, regardless of type
function assignWorker(type, n = 1) {
    // const defaultPool = gameState.find(worker => worker.default);
    // Find the default pool
    const defaultPool = Object.values(gameState.workers).find(worker => worker.default);

    if (defaultPool && defaultPool.count > 0 && gameState.workers[type]) {
        defaultPool.count -= n;
        gameState.workers[type].count += n;
    }
}

// Expose helper functions for testing
window.addMoney = addMoney;
window.addResource = addResource;
window.addBuilding = addBuilding;
window.addWorker = addWorker;
window.assignWorker = assignWorker;
window.setGameSpeed = setGameSpeed;

// Figure out the render and game tick here using delta time for smoother updates
function setGameSpeed(speed /*0 or 1*/) {
    gameState.gameSpeed = speed;
}

function gameTick() {
    const now = Date.now();
    const deltaTime = (now - gameState.lastTick) / 1000;
    gameState.lastTick = now;

    // Resource generation logic
    gameState.resources.food += gameState.workers.farm.count * 1 * deltaTime;
    gameState.resources.stone += gameState.workers.quarry.count * 1 * deltaTime;
    gameState.resources.wood += gameState.workers.lumberMill.count * 1 * deltaTime;
}

// setInterval(gameTick, 1000 / 24); // 24 ticks per second

function render() {
    // Rendering logic here
    // console.clear();
    // console.group('Game State');
    // console.log('Money:', gameState.money.toFixed(2));
    // console.log('Resources:', gameState.resources);
    // console.log('Buildings:', gameState.buildings);
    // console.log('Workers:', {
    //     Unemployed: gameState.workers.unassigned.count,
    //     Farmer: gameState.workers.farm.count,
    //     'Quarry Worker': gameState.workers.quarry.count,
    //     Lumberjack: gameState.workers.lumberMill.count,
    // });
    // console.groupEnd();

    const displayState = {
        money: Math.floor(gameState.money),
        resources: {
            wood: Math.floor(gameState.resources.wood),
            stone: Math.floor(gameState.resources.stone),
            food: Math.floor(gameState.resources.food),
        },
        buildings: gameState.buildings,
        workers: {
            Unemployed: gameState.workers.unassigned.count,
            Farmer: gameState.workers.farm.count,
            'Quarry Worker': gameState.workers.quarry.count,
            Lumberjack: gameState.workers.lumberMill.count,
        },
    };

    document.getElementById('output').textContent = JSON.stringify(displayState, null, 4);
}

// setInterval(() => {
//     gameTick();
//     render();
// }, 1000 / 24); // 24 frames per second

// If speed is set to 0, pause the game tick updates, otherwise run them
setInterval(() => {
    if (gameState.gameSpeed === 1) {
        gameTick();
        render();
    }
}, 1000 / 24); // 24 frames per second

console.groupCollapsed('commands');
console.log('addMoney(amount)');
console.log('addResource(type, amount)');
console.log('addBuilding(type)');
console.log('addWorker(n = 1)');
console.log('assignWorker(type, n = 1)');
console.groupEnd();