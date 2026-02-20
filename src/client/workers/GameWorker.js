import { SharedMemory, MEMORY_LAYOUT } from '@shared/SharedMemory.js';
import { EntityData, DEATH_TYPES } from '@shared/EntityData.js';
import { NodeData, NODE_TYPES } from '@shared/NodeData.js';

let sharedMemory = null;
let entityData = null;
let nodeData = null;
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

        sharedMemory.setEntityCount(0);
        sharedMemory.setNodeCount(0);

        self.postMessage({ type: 'initialized' });
    }
}

function handleSetGameSettings(data) {
    gameSettings = { ...gameSettings, ...data };
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
    if (!sharedMemory || !entityData || !nodeData) {
        return;
    }

    if (!syncComplete) {
        return;
    }

    const { dt } = data;
    const cappedDt = Math.min(dt, 0.05);

    handleCollisionsAndCohesion();
    handleEntityNodeCollisions();
    updateEntities(cappedDt);
    updateNodes(cappedDt);

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

const CELL_SIZE = 80;
let spatialGrid = new Map();

const MAX_QUERY_RESULTS = 256;
let queryResultArray = new Int32Array(MAX_QUERY_RESULTS);

const MAX_DEFENDERS_PER_NODE = 64;
let defendersPool = [];
let defendersCount = [];

function getCellKey(x, y) {
    const col = Math.floor(x / CELL_SIZE);
    const row = Math.floor(y / CELL_SIZE);
    // Usar bitwise en vez de strings para indexar la grilla (extremadamente rápido)
    return (col << 16) | (row & 0xFFFF);
}

function buildSpatialGrid() {
    // Reutilizar arrays en lugar de instanciar nuevos (salva el CPU)
    for (const arr of spatialGrid.values()) {
        arr.length = 0;
    }

    const count = entityData.getCount();
    for (let i = 0; i < count; i++) {
        if (entityData.isDead(i) || entityData.isDying(i)) continue;
        const x = entityData.getX(i);
        const y = entityData.getY(i);
        const key = getCellKey(x, y);
        if (!spatialGrid.has(key)) {
            spatialGrid.set(key, []);
        }
        spatialGrid.get(key).push(i);
    }
}

function getNearbyEntities(x, y, radius) {
    let count = 0;
    const startCol = Math.floor((x - radius) / CELL_SIZE);
    const endCol = Math.floor((x + radius) / CELL_SIZE);
    const startRow = Math.floor((y - radius) / CELL_SIZE);
    const endRow = Math.floor((y + radius) / CELL_SIZE);

    for (let c = startCol; c <= endCol; c++) {
        for (let r = startRow; r <= endRow; r++) {
            const key = (c << 16) | (r & 0xFFFF);
            const cell = spatialGrid.get(key);
            if (cell) {
                for (let j = 0; j < cell.length && count < MAX_QUERY_RESULTS; j++) {
                    queryResultArray[count++] = cell[j];
                }
            }
        }
    }
    return count;
}

function handleCollisionsAndCohesion() {
    buildSpatialGrid();

    const count = entityData.getCount();
    const cohesionRadius = 45;
    const cohesionForce = 30;
    const separationRadius = 18;
    const separationForce = 65;

    for (let i = 0; i < count; i++) {
        if (entityData.isDead(i) || entityData.isDying(i)) continue;

        let x = entityData.getX(i);
        let y = entityData.getY(i);
        const owner = entityData.getOwner(i);
        const radius = entityData.getRadius(i);

        for (let n = 0; n < nodeData.getCount(); n++) {
            const nodeX = nodeData.getX(n);
            const nodeY = nodeData.getY(n);
            const nodeRadius = nodeData.getRadius(n);

            const dx = x - nodeX;
            const dy = y - nodeY;
            const distSq = dx * dx + dy * dy;
            const minDist = nodeRadius + radius;

            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                x += nx * overlap;
                y += ny * overlap;

                const vx = entityData.getVx(i) + nx * 50 * 0.016;
                const vy = entityData.getVy(i) + ny * 50 * 0.016;
                entityData.setVx(i, vx);
                entityData.setVy(i, vy);
            }
        }

        entityData.setX(i, x);
        entityData.setY(i, y);

        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
        let separationX = 0, separationY = 0, separationCount = 0;

        const neighborCount = getNearbyEntities(x, y, cohesionRadius);
        const flockId = entityData.getFlockId(i);
        const inFlock = flockId !== -1;

        for (let nIdx = 0; nIdx < neighborCount; nIdx++) {
            const other = queryResultArray[nIdx];
            if (other === i) continue;
            if (entityData.isDead(other) || entityData.isDying(other)) continue;

            const ox = entityData.getX(other);
            const oy = entityData.getY(other);
            const dx = ox - x;
            const dy = oy - y;
            const distSq = dx * dx + dy * dy;

            if (distSq > cohesionRadius * cohesionRadius) continue;
            const dist = Math.sqrt(distSq);

            const otherOwner = entityData.getOwner(other);
            const minDist = radius + entityData.getRadius(other);

            if (dist < minDist && dist > 0) {
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                let xi = entityData.getX(i) - nx * overlap * 0.6;
                let yi = entityData.getY(i) - ny * overlap * 0.6;
                entityData.setX(i, xi);
                entityData.setY(i, yi);

                if (owner !== otherOwner) {
                    entityData.setDying(i, true);
                    entityData.setDeathType(i, DEATH_TYPES.EXPLOSION);
                    entityData.setDeathTime(i, 0);
                    sharedMemory.addDeathEvent(x, y, owner, DEATH_TYPES.EXPLOSION, i);

                    entityData.setDying(other, true);
                    entityData.setDeathType(other, DEATH_TYPES.EXPLOSION);
                    entityData.setDeathTime(other, 0);
                    const ox2 = entityData.getX(other);
                    const oy2 = entityData.getY(other);
                    sharedMemory.addDeathEvent(ox2, oy2, otherOwner, DEATH_TYPES.EXPLOSION, other);
                    break;
                }

                const ovx = entityData.getVx(other);
                const ovy = entityData.getVy(other);
                const ivx = entityData.getVx(i);
                const ivy = entityData.getVy(i);
                const dvx = ovx - ivx;
                const dvy = ovy - ivy;
                const velAlongNormal = dvx * nx + dvy * ny;

                if (velAlongNormal > 0) {
                    const j = -(1.3) * velAlongNormal * 0.5;
                    entityData.setVx(i, ivx - j * nx);
                    entityData.setVy(i, ivy - j * ny);
                    entityData.setVx(other, ovx + j * nx);
                    entityData.setVy(other, ovy + j * ny);
                }
            }

            if (otherOwner === owner) {
                if (dist < separationRadius) {
                    const safeDist = Math.max(0.1, dist);
                    const force = (1 - safeDist / separationRadius);
                    separationX -= (dx / safeDist) * force;
                    separationY -= (dy / safeDist) * force;
                    separationCount++;
                } else if (dist > radius * 2.5) {
                    const safeDist = Math.max(0.1, dist);
                    if (inFlock && entityData.getFlockId(other) === flockId) {
                        cohesionX += (dx / safeDist) * 1.5;
                        cohesionY += (dy / safeDist) * 1.5;
                    } else {
                        cohesionX += dx / safeDist;
                        cohesionY += dy / safeDist;
                    }
                    cohesionCount++;
                }
            }
        }

        if (cohesionCount > 0 || separationCount > 0) {
            let fx = 0, fy = 0;
            if (cohesionCount > 0) {
                fx += (cohesionX / cohesionCount) * cohesionForce;
                fy += (cohesionY / cohesionCount) * cohesionForce;
            }
            if (separationCount > 0) {
                fx += (separationX / separationCount) * separationForce;
                fy += (separationY / separationCount) * separationForce;
            }

            const vx = entityData.getVx(i) + fx * 0.016;
            const vy = entityData.getVy(i) + fy * 0.016;
            entityData.setVx(i, vx);
            entityData.setVy(i, vy);
        }
    }
}
function handleEntityNodeCollisions() {
    const entityCount = entityData.getCount();
    const nodeCount = nodeData.getCount();

    if (defendersPool.length < nodeCount) {
        for (let i = defendersPool.length; i < nodeCount; i++) {
            defendersPool.push(new Int32Array(MAX_DEFENDERS_PER_NODE));
        }
    }
    if (defendersCount.length < nodeCount) {
        for (let i = defendersCount.length; i < nodeCount; i++) {
            defendersCount.push(0);
        }
    }

    for (let n = 0; n < nodeCount; n++) {
        defendersCount[n] = 0;
    }

    for (let i = 0; i < entityCount; i++) {
        if (entityData.isDead(i) || entityData.isDying(i)) continue;
        const ex = entityData.getX(i);
        const ey = entityData.getY(i);
        const eOwner = entityData.getOwner(i);

        for (let n = 0; n < nodeCount; n++) {
            const nodeOwner = nodeData.getOwner(n);
            if (eOwner !== nodeOwner || nodeOwner === -1) continue;

            const nodeX = nodeData.getX(n);
            const nodeY = nodeData.getY(n);
            const nodeInfluenceRadius = nodeData.getInfluenceRadius(n);

            const dx = ex - nodeX;
            const dy = ey - nodeY;
            const distSq = dx * dx + dy * dy;

            if (distSq < nodeInfluenceRadius * nodeInfluenceRadius) {
                if (defendersCount[n] < MAX_DEFENDERS_PER_NODE) {
                    defendersPool[n][defendersCount[n]++] = i;
                }
            }
        }
    }

    for (let i = 0; i < entityCount; i++) {
        if (entityData.isDead(i) || entityData.isDying(i)) continue;

        let ex = entityData.getX(i);
        let ey = entityData.getY(i);
        const eRadius = entityData.getRadius(i);
        const eOwner = entityData.getOwner(i);
        const eTargetNodeId = entityData.getTargetNodeId(i);

        for (let n = 0; n < nodeCount; n++) {
            const nodeOwner = nodeData.getOwner(n);
            const nodeX = nodeData.getX(n);
            const nodeY = nodeData.getY(n);
            const nodeRadius = nodeData.getRadius(n);
            const nodeId = nodeData.getId(n);

            const dx = ex - nodeX;
            const dy = ey - nodeY;
            const distSq = dx * dx + dy * dy;
            const touchRange = nodeRadius + eRadius;
            const dist = Math.sqrt(distSq);

            const isTargetingThisNode = (eTargetNodeId === nodeId);

            if (dist < touchRange && dist > 0.001) {
                const overlap = touchRange - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                if (isTargetingThisNode) {
                    if (nodeOwner === -1) {
                        // Neutral node - cell dies and damages node
                        nodeData.setBaseHp(n, nodeData.getBaseHp(n) - 1);
                        nodeData.setHitFlash(n, 0.3);

                        if (nodeData.getBaseHp(n) <= 0) {
                            nodeData.setOwner(n, eOwner);
                            nodeData.setBaseHp(n, nodeData.getMaxHp(n) * 0.1);
                        }

                        entityData.setDying(i, true);
                        entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                        entityData.setDeathTime(i, 0);
                        sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i);
                        break;
                    }
                    else if (nodeOwner === eOwner) {
                        const baseHp = nodeData.getBaseHp(n);
                        const maxHp = nodeData.getMaxHp(n);
                        if (baseHp < maxHp) {
                            nodeData.setBaseHp(n, baseHp + 1);
                            nodeData.setHitFlash(n, 0.15);

                            entityData.setDying(i, true);
                            entityData.setDeathType(i, DEATH_TYPES.ABSORBED);
                            entityData.setDeathTime(i, 0);
                            sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ABSORBED, i, nodeX, nodeY);
                            break;
                        }
                        else {
                            entityData.setTargetNodeId(i, -1);
                            entityData.setTargetX(i, ex);
                            entityData.setTargetY(i, ey);

                            ex = ex + nx * overlap;
                            ey = ey + ny * overlap;
                            entityData.setX(i, ex);
                            entityData.setY(i, ey);
                        }
                    }
                    else {
                        let defenderIdx = -1;
                        for (let d = 0; d < defendersCount[n]; d++) {
                            const idx = defendersPool[n][d];
                            if (!entityData.isDead(idx) && !entityData.isDying(idx)) {
                                defenderIdx = idx;
                                break;
                            }
                        }

                        if (defenderIdx !== -1) {
                            entityData.setDying(defenderIdx, true);
                            entityData.setDeathType(defenderIdx, DEATH_TYPES.SACRIFICE);
                            entityData.setDeathTime(defenderIdx, 0);
                            const defX = entityData.getX(defenderIdx);
                            const defY = entityData.getY(defenderIdx);
                            const defOwner = entityData.getOwner(defenderIdx);
                            sharedMemory.addDeathEvent(defX, defY, defOwner, DEATH_TYPES.SACRIFICE, defenderIdx, nodeX, nodeY);

                            entityData.setDying(i, true);
                            entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                            entityData.setDeathTime(i, 0);
                            sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                            break;
                        }
                        else {
                            nodeData.setBaseHp(n, nodeData.getBaseHp(n) - 1);
                            nodeData.setHitFlash(n, 0.3);

                            if (nodeData.getBaseHp(n) <= 0) {
                                nodeData.setOwner(n, eOwner);
                                nodeData.setBaseHp(n, nodeData.getMaxHp(n) * 0.1);
                            }

                            entityData.setDying(i, true);
                            entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                            entityData.setDeathTime(i, 0);
                            sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                            break;
                        }
                    }
                }
                else {
                    if (nodeOwner === -1) {
                        // Neutral node - cell dies and damages node
                        nodeData.setBaseHp(n, nodeData.getBaseHp(n) - 1);
                        nodeData.setHitFlash(n, 0.3);

                        if (nodeData.getBaseHp(n) <= 0) {
                            nodeData.setOwner(n, eOwner);
                            nodeData.setBaseHp(n, nodeData.getMaxHp(n) * 0.1);
                        }

                        entityData.setDying(i, true);
                        entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                        entityData.setDeathTime(i, 0);
                        sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                        break;
                    }
                    else {
                        ex = ex + nx * overlap;
                        ey = ey + ny * overlap;
                        entityData.setX(i, ex);
                        entityData.setY(i, ey);

                        const perpX = -ny;
                        const perpY = nx;
                        const targetDx = entityData.getTargetX(i) - ex;
                        const targetDy = entityData.getTargetY(i) - ey;
                        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                        if (targetDist > 0.001) {
                            const side = (dx * targetDy - dy * targetDx) > 0 ? 1 : -1;
                            entityData.setVx(i, entityData.getVx(i) + perpX * side * 100);
                            entityData.setVy(i, entityData.getVy(i) + perpY * side * 100);
                        }
                    }
                }
            }
        }
    }
}

function updateEntities(dt) {
    const bounds = entityData.getWorldBounds();
    const speedMult = gameSettings.speedMultiplier || 1;

    for (let i = 0; i < entityData.getCount(); i++) {
        if (entityData.isDead(i)) continue;

        if (entityData.isDying(i)) {
            let deathTime = entityData.getDeathTime(i) + dt;
            entityData.setDeathTime(i, deathTime);

            if (deathTime > 0.4) {
                entityData.setDead(i, true);
            }
            continue;
        }

        let x = entityData.getX(i);
        let y = entityData.getY(i);
        let vx = entityData.getVx(i);
        let vy = entityData.getVy(i);
        let speedBoost = entityData.getSpeedBoost(i);
        const owner = entityData.getOwner(i);

        let inFriendlyTerritory = false;
        if (owner !== -1) {
            for (let n = 0; n < nodeData.getCount(); n++) {
                if (nodeData.getOwner(n) !== owner) continue;
                const nx = nodeData.getX(n);
                const ny = nodeData.getY(n);
                const influenceRadius = nodeData.getInfluenceRadius(n);
                const dx = x - nx;
                const dy = y - ny;
                if (dx * dx + dy * dy < influenceRadius * influenceRadius) {
                    inFriendlyTerritory = true;
                    break;
                }
            }
        }

        // 10% boost en territorio friendly, 5% fuera
        if (inFriendlyTerritory) {
            speedBoost = Math.min(1.0, speedBoost + dt * 2.0);
        } else {
            speedBoost = Math.max(0.5, speedBoost - dt * 1.0);
        }

        const targetX = entityData.getTargetX(i);
        const targetY = entityData.getTargetY(i);
        const hasTarget = entityData.hasTarget(i);

        const dx = targetX - x;
        const dy = targetY - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (hasTarget && dist > 5) {
            const moveForce = 800;
            vx += (dx / dist) * moveForce * dt;
            vy += (dy / dist) * moveForce * dt;

            const targetNx = dx / dist;
            const targetNy = dy / dist;
            const targetNodeId = entityData.getTargetNodeId(i);

            for (let n = 0; n < nodeData.getCount(); n++) {
                if (targetNodeId === nodeData.getId(n)) continue;

                const nx = nodeData.getX(n);
                const ny = nodeData.getY(n);
                const nRadius = nodeData.getRadius(n);

                const ndx = nx - x;
                const ndy = ny - y;
                const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

                if (nDist < nRadius + 60 && nDist > 10) {
                    const dot = (ndx / nDist) * targetNx + (ndy / nDist) * targetNy;
                    if (dot > 0.3) {
                        const perpX = -targetNy;
                        const perpY = targetNx;
                        const side = (ndx * targetNy - ndy * targetNx) > 0 ? 1 : -1;
                        const forceMult = (1 - (nDist / (nRadius + 60))) * 2500;
                        vx += perpX * side * forceMult * 0.016;
                        vy += perpY * side * forceMult * 0.016;
                    }
                }
            }
        }

        const randomForce = 10;
        vx += (Math.random() - 0.5) * randomForce * dt;
        vy += (Math.random() - 0.5) * randomForce * dt;

        let friction = entityData.getFriction(i);
        vx *= friction;
        vy *= friction;

        // speedBoost ya se calculó en el bloque de friendly territory
        let maxSpeed = entityData.getMaxSpeed(i) * (1 + speedBoost * 0.4) * speedMult;

        const speedSq = vx * vx + vy * vy;
        const maxSpdSq = maxSpeed * maxSpeed;

        if (speedSq > maxSpdSq) {
            const speed = Math.sqrt(speedSq);
            vx = (vx / speed) * maxSpeed;
            vy = (vy / speed) * maxSpeed;
        }

        x += vx * dt;
        y += vy * dt;

        const centerDx = x - bounds.centerX;
        const centerDy = y - bounds.centerY;
        const distFromCenter = Math.sqrt(centerDx * centerDx + centerDy * centerDy);

        if (distFromCenter > bounds.worldRadius) {
            let outsideTime = entityData.getOutsideTime(i) + dt;
            entityData.setOutsideTime(i, outsideTime);
            entityData.setOutsideWarning(i, true);

            if (outsideTime >= 5) {
                entityData.setDying(i, true);
                entityData.setDeathType(i, DEATH_TYPES.OUT_OF_BOUNDS);
                entityData.setDeathTime(i, 0);
                sharedMemory.addDeathEvent(x, y, owner, DEATH_TYPES.OUT_OF_BOUNDS, i);
            }
        } else {
            entityData.setOutsideTime(i, 0);
            entityData.setOutsideWarning(i, false);
        }

        entityData.setX(i, x);
        entityData.setY(i, y);
        entityData.setVx(i, vx);
        entityData.setVy(i, vy);
        entityData.setSpeedBoost(i, speedBoost);
    }
}

function updateNodes(dt) {
    for (let i = 0; i < nodeData.getCount(); i++) {
        const owner = nodeData.getOwner(i);

        if (owner !== -1) {
            let baseHp = nodeData.getBaseHp(i);
            const maxHp = nodeData.getMaxHp(i);

            if (baseHp < maxHp) {
                baseHp += 0.5 * dt;
                nodeData.setBaseHp(i, baseHp);
            }

            let spawnTimer = nodeData.getSpawnTimer(i);
            spawnTimer += dt;

            const healthPercent = Math.min(baseHp / maxHp, 1.0);
            let healthScaling = 0.3 + healthPercent * 1.2;

            // Smoothly ramp bonus production from 90% to 100% HP (prevents visual jumps)
            const fullBonus = Math.max(0, Math.min(0.5, (healthPercent - 0.9) * 5));
            healthScaling += fullBonus;

            const nodeType = nodeData.getType(i);
            if (nodeType === NODE_TYPES.LARGE) {
                healthScaling += 0.5;
            }

            const spawnInterval = nodeData.getSpawnInterval(i);
            const spawnThreshold = spawnInterval / healthScaling;

            const canSpawn = entityData.getCount() < MEMORY_LAYOUT.MAX_ENTITIES;

            if (canSpawn && spawnTimer >= spawnThreshold && baseHp > maxHp * 0.1) {
                spawnTimer = 0;
                nodeData.setManualSpawnReady(i, false);

                const angle = Math.random() * Math.PI * 2;
                const influenceRadius = nodeData.getInfluenceRadius(i);
                const spawnDist = influenceRadius * 0.6;
                const ex = nodeData.getX(i) + Math.cos(angle) * spawnDist;
                const ey = nodeData.getY(i) + Math.sin(angle) * spawnDist;

                const targetX = nodeData.getRallyX(i);
                const targetY = nodeData.getRallyY(i);
                const targetNodeId = nodeData.getRallyTargetNodeId(i);

                sharedMemory.addSpawnEvent(ex, ey, owner, targetX, targetY, targetNodeId);

                nodeData.setSpawnEffect(i, 0.4);
            }

            nodeData.setSpawnTimer(i, spawnTimer);
            nodeData.setSpawnProgress(i, spawnTimer / spawnThreshold);
        }

        let hitFlash = nodeData.getHitFlash(i);
        if (hitFlash > 0) {
            hitFlash -= dt;
            nodeData.setHitFlash(i, hitFlash);
        }

        let spawnEffect = nodeData.getSpawnEffect(i);
        if (spawnEffect > 0) {
            spawnEffect -= dt;
            nodeData.setSpawnEffect(i, spawnEffect);
        }
    }
}
