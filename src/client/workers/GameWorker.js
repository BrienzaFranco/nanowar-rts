import { SharedMemory, MEMORY_LAYOUT } from '@shared/SharedMemory.js';
import { EntityData, DEATH_TYPES } from '@shared/EntityData.js';
import { NodeData, NODE_TYPES } from '@shared/NodeData.js';
import { GameEngine } from '@shared/GameEngine.js';

let sharedMemory = null;
let entityData = null;
let nodeData = null;
let gameEngine = null;
let syncComplete = false;
let entityIdToIndex = new Map();
let nodeIdToIndex = new Map();
let gameSettings = {
    speedMultiplier: 1,
    maxEntitiesPerPlayer: 1000,
};

const WORLD_WIDTH = 2400;
const WORLD_HEIGHT = 1800;
const WORLD_RADIUS = 1800;
const CENTER_X = 1200;
const CENTER_Y = 900;

self.onmessage = function (e) {
    const { type, data } = e.data;

    switch (type) {
        case 'init':
            handleInit(data);
            break;
        case 'update':
            handleUpdate(data);
            break;
        case 'setGameSettings':
            handleSetGameSettings(data);
            break;
        case 'addNode':
            handleAddNode(data);
            break;
        case 'spawnEntity':
            handleSpawnEntity(data);
            break;
        case 'setEntityTarget':
            handleSetEntityTarget(data);
            break;
        case 'setEntityTargetById':
            handleSetEntityTargetById(data);
            break;
        case 'setMultipleEntityTargets':
            handleSetMultipleEntityTargets(data);
            break;
        case 'syncComplete':
            syncComplete = true;
            self.postMessage({ type: 'workerReady' });
            break;
    }
};

function handleInit(data) {
    if (data.sharedBuffer) {
        sharedMemory = new SharedMemory(data.sharedBuffer);
        entityData = new EntityData(sharedMemory);
        nodeData = new NodeData(sharedMemory);
        gameEngine = new GameEngine(sharedMemory, entityData, nodeData, gameSettings);

        sharedMemory.setEntityCount(0);
        sharedMemory.setNodeCount(0);

        self.postMessage({ type: 'initialized' });
    }
}

function handleSetGameSettings(data) {
    gameSettings = { ...gameSettings, ...data };
    if (gameEngine) gameEngine.setGameSettings(gameSettings);
}

function handleAddNode(data) {
    const { x, y, owner, type, id } = data;
    const nodeType = type === 'small' ? NODE_TYPES.SMALL :
        type === 'large' ? NODE_TYPES.LARGE : NODE_TYPES.MEDIUM;

    const idx = nodeData.allocate(x, y, owner, nodeType, id);

    if (idx !== -1 && id !== undefined) {
        nodeIdToIndex.set(id, idx);
    }

    self.postMessage({
        type: 'nodeAdded',
        data: { index: idx, x, y, owner, type, id }
    });
}

function handleSpawnEntity(data) {
    const { x, y, owner, targetX, targetY, targetNodeId, id } = data;

    const idx = entityData.allocate(x, y, owner, id);

    if (idx !== -1) {
        entityIdToIndex.set(id, idx);

        if (targetX !== undefined || targetY !== undefined) {
            entityData.setTargetX(idx, targetX || 0);
            entityData.setTargetY(idx, targetY || 0);
        }
        if (targetNodeId !== undefined) {
            entityData.setTargetNodeId(idx, targetNodeId);
        }
    }
}

function handleSetEntityTarget(data) {
    const { entityIndex, targetX, targetY, targetNodeId } = data;

    if (entityData.isValidIndex(entityIndex)) {
        if (targetX !== undefined) entityData.setTargetX(entityIndex, targetX);
        if (targetY !== undefined) entityData.setTargetY(entityIndex, targetY);
        if (targetNodeId !== undefined) entityData.setTargetNodeId(entityIndex, targetNodeId);
    }
}

function handleSetEntityTargetById(data) {
    const { entityId, targetX, targetY, targetNodeId } = data;

    const idx = entityIdToIndex.get(entityId);
    if (idx !== undefined && entityData.isValidIndex(idx)) {
        entityData.setTargetX(idx, targetX);
        entityData.setTargetY(idx, targetY);
        entityData.setTargetNodeId(idx, targetNodeId != null ? targetNodeId : -1);
    }
}

function handleSetMultipleEntityTargets(data) {
    const { entityIds, targetX, targetY, targetNodeId } = data;

    for (let i = 0; i < entityIds.length; i++) {
        const idx = entityIdToIndex.get(entityIds[i]);
        if (idx !== undefined && entityData.isValidIndex(idx)) {
            entityData.setTargetX(idx, targetX);
            entityData.setTargetY(idx, targetY);
            entityData.setTargetNodeId(idx, targetNodeId != null ? targetNodeId : -1);
        }
    }
}

function handleUpdate(data) {
    if (!sharedMemory || !entityData || !nodeData || !gameEngine) {
        return;
    }

    if (!syncComplete) {
        return;
    }

    const { dt } = data;
    const cappedDt = Math.min(dt, 0.05);

    gameEngine.step(cappedDt);

    sharedMemory.incrementFrameCounter();

    self.postMessage({
        type: 'frameComplete',
        data: {
            entityCount: entityData.getCount(),
            nodeCount: nodeData.getCount(),
            frameCounter: sharedMemory.getFrameCounter(),
        }
    });
}
