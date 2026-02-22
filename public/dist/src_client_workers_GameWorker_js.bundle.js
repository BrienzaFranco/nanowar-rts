/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/shared/EntityData.js"
/*!**********************************!*\
  !*** ./src/shared/EntityData.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   DEATH_TYPES: () => (/* binding */ DEATH_TYPES),
/* harmony export */   EntityData: () => (/* binding */ EntityData)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");



const DEATH_TYPES = {
    NONE: 0,
    ATTACK: 1,
    EXPLOSION: 2,
    ABSORBED: 3,
    SACRIFICE: 4,
    OUT_OF_BOUNDS: 5,
};

class EntityData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.entities = sharedMemory.entities;
        // Sync count from shared header so reconstucting is safe when buffer arrives from server
        this.count = sharedMemory.getEntityCount();
    }

    allocate(x, y, owner, id) {
        let idx = -1;

        // Try to find a dead slot to recycle
        for (let i = 0; i < this.count; i++) {
            if (this.entities.flags[i] & 0x01) { // isDead flag
                idx = i;
                break;
            }
        }

        if (idx === -1) {
            idx = this.count;
            if (idx >= _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_ENTITIES) {
                console.warn('Max entities reached');
                return -1;
            }
            this.count++;
            this.memory.setEntityCount(this.count);
        }

        this.entities.x[idx] = x;
        this.entities.y[idx] = y;
        this.entities.vx[idx] = 0;
        this.entities.vy[idx] = 0;
        this.entities.owner[idx] = owner;
        this.entities.radius[idx] = 5;
        this.entities.maxSpeed[idx] = 50;
        this.entities.friction[idx] = 0.975;
        this.entities.hp[idx] = 1;
        this.entities.speedBoost[idx] = 0;

        this.entities.flags[idx] = 0; // Clear all flags including isDead
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = DEATH_TYPES.NONE;

        this.entities.targetX[idx] = 0;
        this.entities.targetY[idx] = 0;
        this.entities.targetNodeId[idx] = -1;

        this.entities.id[idx] = id || 0;
        this.entities.outsideTime[idx] = 0;

        return idx;
    }

    // Sync count from header (e.g. after server wrote a new entity count via allocateEntity)
    syncCount() {
        this.count = this.memory.getEntityCount();
    }

    getCount() {
        return this.count;
    }

    getX(index) {
        return this.entities.x[index];
    }

    setX(index, value) {
        this.entities.x[index] = value;
    }

    getY(index) {
        return this.entities.y[index];
    }

    setY(index, value) {
        this.entities.y[index] = value;
    }

    getVx(index) {
        return this.entities.vx[index];
    }

    setVx(index, value) {
        this.entities.vx[index] = value;
    }

    getVy(index) {
        return this.entities.vy[index];
    }

    setVy(index, value) {
        this.entities.vy[index] = value;
    }

    getOwner(index) {
        return this.entities.owner[index];
    }

    setOwner(index, value) {
        this.entities.owner[index] = value;
    }

    getRadius(index) {
        return this.entities.radius[index];
    }

    setRadius(index, value) {
        this.entities.radius[index] = value;
    }

    getMaxSpeed(index) {
        return this.entities.maxSpeed[index];
    }

    setMaxSpeed(index, value) {
        this.entities.maxSpeed[index] = value;
    }

    getFriction(index) {
        return this.entities.friction[index];
    }

    setFriction(index, value) {
        this.entities.friction[index] = value;
    }

    getHp(index) {
        return this.entities.hp[index];
    }

    setHp(index, value) {
        this.entities.hp[index] = value;
    }

    getSpeedBoost(index) {
        return this.entities.speedBoost[index];
    }

    setSpeedBoost(index, value) {
        this.entities.speedBoost[index] = value;
    }

    isDead(index) {
        return this.memory.isDead(index);
    }

    setDead(index, value) {
        this.memory.setDead(index, value);
    }

    isDying(index) {
        return this.memory.isDying(index);
    }

    setDying(index, value) {
        this.memory.setDying(index, value);
    }

    isSelected(index) {
        return this.memory.isSelected(index);
    }

    setSelected(index, value) {
        this.memory.setSelected(index, value);
    }

    hasOutsideWarning(index) {
        return this.memory.hasOutsideWarning(index);
    }

    setOutsideWarning(index, value) {
        this.memory.setOutsideWarning(index, value);
    }

    getDeathTime(index) {
        return this.entities.deathTime[index];
    }

    setDeathTime(index, value) {
        this.entities.deathTime[index] = value;
    }

    getDeathType(index) {
        return this.entities.deathType[index];
    }

    setDeathType(index, value) {
        this.entities.deathType[index] = value;
    }

    getTargetX(index) {
        return this.entities.targetX[index];
    }

    setTargetX(index, value) {
        this.entities.targetX[index] = value;
    }

    getTargetY(index) {
        return this.entities.targetY[index];
    }

    setTargetY(index, value) {
        this.entities.targetY[index] = value;
    }

    getTargetNodeId(index) {
        return this.entities.targetNodeId[index];
    }

    setTargetNodeId(index, value) {
        this.entities.targetNodeId[index] = value;
    }

    hasTarget(index) {
        return this.entities.targetNodeId[index] !== -1 ||
            (this.entities.targetX[index] !== 0 || this.entities.targetY[index] !== 0);
    }

    // Used by GameServer to set whether entity has an active target
    // For now this mirrors the hasTarget logic: clear targetX/Y and targetNodeId to unset
    setHasTarget(index, value) {
        if (!value) {
            this.entities.targetX[index] = 0;
            this.entities.targetY[index] = 0;
            this.entities.targetNodeId[index] = -1;
        }
        // If value=true, caller must also set targetX/Y/nodeId separately
    }

    getFlockId(index) {
        return this.entities.flockId[index];
    }

    setFlockId(index, value) {
        this.entities.flockId[index] = value;
    }

    getOutsideTime(index) {
        return this.entities.outsideTime[index];
    }

    setOutsideTime(index, value) {
        this.entities.outsideTime[index] = value;
    }

    getId(index) {
        return this.entities.id[index];
    }

    setId(index, value) {
        this.entities.id[index] = value;
    }

    isValidIndex(index) {
        return index >= 0 && index < this.count;
    }

    getWorldBounds() {
        if (this._worldBoundsOverride) return this._worldBoundsOverride;
        return {
            width: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_WIDTH,
            height: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_HEIGHT,
            worldRadius: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_RADIUS,
            centerX: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_WIDTH / 2,
            centerY: _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.GAME_SETTINGS.WORLD_HEIGHT / 2,
        };
    }

    setWorldBounds(centerX, centerY, worldRadius) {
        this._worldBoundsOverride = { centerX, centerY, worldRadius, width: worldRadius * 2, height: worldRadius * 2 };
    }
}


/***/ },

/***/ "./src/shared/GameConfig.js"
/*!**********************************!*\
  !*** ./src/shared/GameConfig.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GAME_SETTINGS: () => (/* binding */ GAME_SETTINGS),
/* harmony export */   NODE_CONFIG: () => (/* binding */ NODE_CONFIG),
/* harmony export */   NODE_TYPES: () => (/* binding */ NODE_TYPES),
/* harmony export */   PLAYER_COLORS: () => (/* binding */ PLAYER_COLORS),
/* harmony export */   setPlayerColor: () => (/* binding */ setPlayerColor)
/* harmony export */ });
const DEFAULT_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63', '#000000'
];

let PLAYER_COLORS = [...DEFAULT_COLORS];

function setPlayerColor(index) {
    if (index >= 0 && index < DEFAULT_COLORS.length) {
        // Reset to default first to be idempotent
        PLAYER_COLORS = [...DEFAULT_COLORS];

        if (index > 0) {
            // Swap selected color with first color (Player 0)
            const temp = PLAYER_COLORS[0];
            PLAYER_COLORS[0] = PLAYER_COLORS[index];
            PLAYER_COLORS[index] = temp;
        }
    }
}

const GAME_SETTINGS = {
    WORLD_WIDTH: 4000,
    WORLD_HEIGHT: 3000,
    WORLD_RADIUS: 3000, // Larger than map - units won't reach it often
    OUTSIDE_DEATH_TIME: 5, // Seconds before unit dies outside boundary
    MAX_UNITS_PER_PLAYER: 500, // Global unit cap
};

const NODE_TYPES = {
    SMALL: 0,
    MEDIUM: 1,
    LARGE: 2,
    MEGA: 3,
    ULTRA: 4,
    OMEGA: 5
};

const NODE_CONFIG = {
    [NODE_TYPES.SMALL]: { radius: 22, influenceRadius: 100, baseHp: 6, maxHp: 15, spawnInterval: 4.8 },
    [NODE_TYPES.MEDIUM]: { radius: 40, influenceRadius: 160, baseHp: 12, maxHp: 35, spawnInterval: 3.8 },
    [NODE_TYPES.LARGE]: { radius: 65, influenceRadius: 220, baseHp: 25, maxHp: 70, spawnInterval: 2.7 },
    [NODE_TYPES.MEGA]: { radius: 100, influenceRadius: 300, baseHp: 50, maxHp: 120, spawnInterval: 2.3 },
    [NODE_TYPES.ULTRA]: { radius: 125, influenceRadius: 380, baseHp: 80, maxHp: 200, spawnInterval: 1.9 },
    [NODE_TYPES.OMEGA]: { radius: 160, influenceRadius: 450, baseHp: 120, maxHp: 300, spawnInterval: 1.5 }
};


/***/ },

/***/ "./src/shared/GameEngine.js"
/*!**********************************!*\
  !*** ./src/shared/GameEngine.js ***!
  \**********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   GameEngine: () => (/* binding */ GameEngine)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _EntityData_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./EntityData.js */ "./src/shared/EntityData.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");





class GameEngine {
    constructor(sharedMemory, entityData, nodeData, gameSettings) {
        this.sharedMemory = sharedMemory;
        this.entityData = entityData;
        this.nodeData = nodeData;
        this.gameSettings = gameSettings || { speedMultiplier: 1, maxEntitiesPerPlayer: _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER };

        this.CELL_SIZE = 80;
        this.spatialGrid = new Map();

        this.MAX_QUERY_RESULTS = 256;
        this.queryResultArray = new Int32Array(this.MAX_QUERY_RESULTS);

        this.MAX_DEFENDERS_PER_NODE = 64;
        this.defendersPool = [];
        this.defendersCount = [];
    }

    setGameSettings(settings) {
        this.gameSettings = { ...this.gameSettings, ...settings };
    }

    step(dt) {
        // Track which players currently own at least one node
        this.activePlayers = new Set();
        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);
            if (owner !== -1) {
                this.activePlayers.add(owner);
            }
        }

        this.handleCollisionsAndCohesion(dt);
        this.handleEntityNodeCollisions(dt);
        this.updateEntities(dt);
        this.updateNodes(dt);
    }

    getCellKey(x, y) {
        const col = Math.floor(x / this.CELL_SIZE);
        const row = Math.floor(y / this.CELL_SIZE);
        return (col << 16) | (row & 0xFFFF);
    }

    buildSpatialGrid() {
        for (const arr of this.spatialGrid.values()) {
            arr.length = 0;
        }

        const count = this.entityData.getCount();
        for (let i = 0; i < count; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            const x = this.entityData.getX(i);
            const y = this.entityData.getY(i);
            const key = this.getCellKey(x, y);
            if (!this.spatialGrid.has(key)) {
                this.spatialGrid.set(key, []);
            }
            this.spatialGrid.get(key).push(i);
        }
    }

    getNearbyEntities(x, y, radius) {
        let count = 0;
        const startCol = Math.floor((x - radius) / this.CELL_SIZE);
        const endCol = Math.floor((x + radius) / this.CELL_SIZE);
        const startRow = Math.floor((y - radius) / this.CELL_SIZE);
        const endRow = Math.floor((y + radius) / this.CELL_SIZE);

        for (let c = startCol; c <= endCol; c++) {
            for (let r = startRow; r <= endRow; r++) {
                const key = (c << 16) | (r & 0xFFFF);
                const cell = this.spatialGrid.get(key);
                if (cell) {
                    for (let j = 0; j < cell.length && count < this.MAX_QUERY_RESULTS; j++) {
                        this.queryResultArray[count++] = cell[j];
                    }
                }
            }
        }
        return count;
    }

    handleCollisionsAndCohesion(dt) {
        this.buildSpatialGrid();

        const count = this.entityData.getCount();

        // Swarm tuning constants
        // -----------------------------------------------------------
        // SEPARATION: hard push away from overlapping neighbors
        const SEP_RADIUS = 8;     // allow more clumping
        const SEP_FORCE = 300;    // softer separation
        // ALIGNMENT: match velocity with nearby friends (gives the "school of fish" feel)
        const ALI_RADIUS = 90;
        const ALI_FORCE = 25;     // less rigid alignment
        // COHESION: drift toward center of nearby friends
        const COH_RADIUS = 120;
        const COH_FORCE = 18;
        // Enemy repulsion (steer AROUND enemies – not combat, that's handled elsewhere)
        const ENE_RADIUS = 50;
        const ENE_FORCE = 220;
        // Node-body repulsion radius (extra push away from node circles)
        const NODE_BODY_MARGIN = 2; // VERY tight margin so they can dive into nodes

        for (let i = 0; i < count; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;

            let x = this.entityData.getX(i);
            let y = this.entityData.getY(i);
            const owner = this.entityData.getOwner(i);
            const radius = this.entityData.getRadius(i);
            let vx = this.entityData.getVx(i);
            let vy = this.entityData.getVy(i);

            // ──────────────────────────────────────
            // 1. Hard push OUT of node bodies
            // ──────────────────────────────────────
            const targetNodeId = this.entityData.getTargetNodeId(i);
            const targetX = this.entityData.getTargetX(i);
            const targetY = this.entityData.getTargetY(i);
            const hasTarget = this.entityData.hasTarget(i);

            for (let n = 0; n < this.nodeData.getCount(); n++) {
                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeRadius = this.nodeData.getRadius(n);
                const nodeId = this.nodeData.getId(n);

                // If this is the node we want to enter, don't push us away physically!
                if (hasTarget && nodeId === targetNodeId) continue;

                // Also skip push if our target point is INSIDE this node (sensitive capture)
                const tdx = targetX - nodeX;
                const tdy = targetY - nodeY;
                if (hasTarget && tdx * tdx + tdy * tdy < (nodeRadius + 35) * (nodeRadius + 35)) continue;

                const minDist = nodeRadius + radius + NODE_BODY_MARGIN;

                const dx = x - nodeX;
                const dy = y - nodeY;
                const distSq = dx * dx + dy * dy;

                if (distSq < minDist * minDist && distSq > 0.001) {
                    const dist = Math.sqrt(distSq);
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    // Positional correction + velocity kick (gentler to allow grazing)
                    x += nx * overlap * 0.4;
                    y += ny * overlap * 0.4;
                    vx += nx * overlap * 3;
                    vy += ny * overlap * 3;
                }
            }
            this.entityData.setX(i, x);
            this.entityData.setY(i, y);

            // ──────────────────────────────────────
            // 2. Reynolds Boids forces
            // ──────────────────────────────────────
            let sepX = 0, sepY = 0, sepN = 0;
            let aliVx = 0, aliVy = 0, aliN = 0;
            let cohX = 0, cohY = 0, cohN = 0;
            let eneX = 0, eneY = 0, eneN = 0;

            const queryR = Math.max(SEP_RADIUS, ALI_RADIUS, COH_RADIUS, ENE_RADIUS);
            const neighborCount = this.getNearbyEntities(x, y, queryR);

            for (let nIdx = 0; nIdx < neighborCount; nIdx++) {
                const other = this.queryResultArray[nIdx];
                if (other === i) continue;
                if (this.entityData.isDead(other) || this.entityData.isDying(other)) continue;

                const ox = this.entityData.getX(other);
                const oy = this.entityData.getY(other);
                const dx = ox - x;
                const dy = oy - y;
                const distSq = dx * dx + dy * dy;
                const dist = Math.sqrt(distSq);

                const otherOwner = this.entityData.getOwner(other);
                const isFriend = (otherOwner === owner);

                // ── Hard collision: entities physically overlapping ──
                const combinedR = radius + this.entityData.getRadius(other);
                if (dist < combinedR && dist > 0.001) {
                    const overlap = combinedR - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isFriend) {
                        // Soft elastic push — let friends overlap heavily
                        const pushFactor = overlap * 0.2;
                        x -= nx * pushFactor;
                        y -= ny * pushFactor;

                        // Velocity exchange (elastic collision, mass=1)
                        const ovx = this.entityData.getVx(other);
                        const ovy = this.entityData.getVy(other);
                        const relV = (vx - ovx) * nx + (vy - ovy) * ny;
                        if (relV > 0) {
                            vx -= relV * nx * 0.4;
                            vy -= relV * ny * 0.4;
                        }
                    } else {
                        // COMBAT: both die — handled by combat pass
                        // But we still do positional correction to avoid z-fighting
                        this.entityData.setDying(i, true);
                        this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(i, 0);
                        this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, i);

                        this.entityData.setDying(other, true);
                        this.entityData.setDeathType(other, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(other, 0);
                        const ox2 = this.entityData.getX(other);
                        const oy2 = this.entityData.getY(other);
                        this.sharedMemory.addDeathEvent(ox2, oy2, otherOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, other);
                        break;
                    }
                }

                // ── Boids forces (only apply to friends in respective radii) ──
                if (isFriend) {
                    if (dist < SEP_RADIUS && dist > 0.001) {
                        // Separation: exponentially stronger when very close
                        const strength = (1 - dist / SEP_RADIUS) * (1 - dist / SEP_RADIUS);
                        sepX -= (dx / dist) * strength;
                        sepY -= (dy / dist) * strength;
                        sepN++;
                    }
                    if (dist < ALI_RADIUS) {
                        // Alignment: weighted by proximity
                        const w = 1 - dist / ALI_RADIUS;
                        aliVx += this.entityData.getVx(other) * w;
                        aliVy += this.entityData.getVy(other) * w;
                        aliN++;
                    }
                    if (dist < COH_RADIUS) {
                        cohX += ox;
                        cohY += oy;
                        cohN++;
                    }
                } else {
                    // Enemy repulsion (steer around — combat handled separately)
                    if (dist < ENE_RADIUS && dist > 0.001) {
                        const strength = (1 - dist / ENE_RADIUS);
                        eneX -= (dx / dist) * strength;
                        eneY -= (dy / dist) * strength;
                        eneN++;
                    }
                }
            }

            // Apply Boids forces
            let fx = 0, fy = 0;
            if (sepN > 0) {
                fx += (sepX / sepN) * SEP_FORCE;
                fy += (sepY / sepN) * SEP_FORCE;
            }
            if (aliN > 0) {
                // Drive velocity toward flock average
                const targetVx = aliVx / aliN;
                const targetVy = aliVy / aliN;
                fx += (targetVx - vx) * ALI_FORCE * dt;
                fy += (targetVy - vy) * ALI_FORCE * dt;
            }
            if (cohN > 0) {
                const cx = cohX / cohN - x;
                const cy = cohY / cohN - y;
                const cDist = Math.sqrt(cx * cx + cy * cy) || 1;
                fx += (cx / cDist) * COH_FORCE;
                fy += (cy / cDist) * COH_FORCE;
            }
            if (eneN > 0) {
                fx += (eneX / eneN) * ENE_FORCE;
                fy += (eneY / eneN) * ENE_FORCE;
            }

            vx += fx * dt;
            vy += fy * dt;

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);
            this.entityData.setVx(i, vx);
            this.entityData.setVy(i, vy);
        }
    }

    handleEntityNodeCollisions(dt) {
        const entityCount = this.entityData.getCount();
        const nodeCount = this.nodeData.getCount();

        if (this.defendersPool.length < nodeCount) {
            for (let i = this.defendersPool.length; i < nodeCount; i++) {
                this.defendersPool.push(new Int32Array(this.MAX_DEFENDERS_PER_NODE));
            }
        }
        if (this.defendersCount.length < nodeCount) {
            for (let i = this.defendersCount.length; i < nodeCount; i++) {
                this.defendersCount.push(0);
            }
        }

        for (let n = 0; n < nodeCount; n++) {
            this.defendersCount[n] = 0;
        }

        for (let i = 0; i < entityCount; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            const ex = this.entityData.getX(i);
            const ey = this.entityData.getY(i);
            const eOwner = this.entityData.getOwner(i);

            for (let n = 0; n < nodeCount; n++) {
                const nodeOwner = this.nodeData.getOwner(n);
                if (eOwner !== nodeOwner || nodeOwner === -1) continue;

                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeInfluenceRadius = this.nodeData.getInfluenceRadius(n);

                const dx = ex - nodeX;
                const dy = ey - nodeY;
                const distSq = dx * dx + dy * dy;

                if (distSq < nodeInfluenceRadius * nodeInfluenceRadius) {
                    if (this.defendersCount[n] < this.MAX_DEFENDERS_PER_NODE) {
                        this.defendersPool[n][this.defendersCount[n]++] = i;
                    }
                }
            }
        }

        for (let i = 0; i < entityCount; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;

            let ex = this.entityData.getX(i);
            let ey = this.entityData.getY(i);
            const eRadius = this.entityData.getRadius(i);
            const eOwner = this.entityData.getOwner(i);
            const eTargetNodeId = this.entityData.getTargetNodeId(i);

            for (let n = 0; n < nodeCount; n++) {
                const nodeOwner = this.nodeData.getOwner(n);
                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeRadius = this.nodeData.getRadius(n);
                const nodeId = this.nodeData.getId(n);

                const dx = ex - nodeX;
                const dy = ey - nodeY;
                const distSq = dx * dx + dy * dy;
                // ROBUST CONTACT: Trigger at edge (+8px margin for high speed safety)
                const touchRange = nodeRadius + eRadius + 8;
                const dist = Math.sqrt(distSq);

                const targetX = this.entityData.getTargetX(i);
                const targetY = this.entityData.getTargetY(i);
                const hasTarget = this.entityData.hasTarget(i);
                const isTargetingThisNode = hasTarget && ((eTargetNodeId === nodeId) ||
                    (Math.hypot(targetX - nodeX, targetY - nodeY) < nodeRadius + 35));

                if (dist < touchRange && dist > 0.001) {
                    const overlap = touchRange - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isTargetingThisNode) {
                        if (nodeOwner === -1) {
                            // Neutral node - cell dies and damages node
                            this.nodeData.setBaseHp(n, this.nodeData.getBaseHp(n) - 1);
                            this.nodeData.setHitFlash(n, 0.3);

                            if (this.nodeData.getBaseHp(n) <= 0) {
                                this.nodeData.setOwner(n, eOwner);
                                this.nodeData.setBaseHp(n, this.nodeData.getMaxHp(n) * 0.1);
                            }

                            this.entityData.setDying(i, true);
                            this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                            this.entityData.setDeathTime(i, 0);
                            this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i);
                            break;
                        }
                        else if (nodeOwner === eOwner) {
                            const baseHp = this.nodeData.getBaseHp(n);
                            const maxHp = this.nodeData.getMaxHp(n);
                            if (baseHp < maxHp) {
                                this.nodeData.setBaseHp(n, baseHp + 1);
                                this.nodeData.setHitFlash(n, 0.15);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED, i, nodeX, nodeY);
                                break;
                            }
                            else {
                                this.entityData.setTargetNodeId(i, -1);
                                this.entityData.setTargetX(i, ex);
                                this.entityData.setTargetY(i, ey);

                                ex = ex + nx * overlap;
                                ey = ey + ny * overlap;
                                this.entityData.setX(i, ex);
                                this.entityData.setY(i, ey);
                            }
                        }
                        else {
                            let defenderIdx = -1;
                            let minDistDefender = Infinity;
                            for (let d = 0; d < this.defendersCount[n]; d++) {
                                const idx = this.defendersPool[n][d];
                                if (!this.entityData.isDead(idx) && !this.entityData.isDying(idx)) {
                                    const dx2 = this.entityData.getX(idx) - nodeX;
                                    const dy2 = this.entityData.getY(idx) - nodeY;
                                    const d2 = dx2 * dx2 + dy2 * dy2;
                                    if (d2 < minDistDefender) {
                                        minDistDefender = d2;
                                        defenderIdx = idx;
                                    }
                                }
                            }

                            if (defenderIdx !== -1) {
                                this.entityData.setDying(defenderIdx, true);
                                this.entityData.setDeathType(defenderIdx, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE);
                                this.entityData.setDeathTime(defenderIdx, 0);

                                // Store node center as target for pull animation
                                this.entityData.setTargetX(defenderIdx, nodeX);
                                this.entityData.setTargetY(defenderIdx, nodeY);

                                const defX = this.entityData.getX(defenderIdx);
                                const defY = this.entityData.getY(defenderIdx);
                                const defOwner = this.entityData.getOwner(defenderIdx);
                                this.sharedMemory.addDeathEvent(defX, defY, defOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE, defenderIdx, nodeX, nodeY);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                                break;
                            }
                            else {
                                this.nodeData.setBaseHp(n, this.nodeData.getBaseHp(n) - 1);
                                this.nodeData.setHitFlash(n, 0.3);

                                if (this.nodeData.getBaseHp(n) <= 0) {
                                    this.nodeData.setOwner(n, eOwner);
                                    this.nodeData.setBaseHp(n, this.nodeData.getMaxHp(n) * 0.1);
                                }

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ATTACK, i, nodeX, nodeY);
                                break;
                            }
                        }
                    }
                    else {
                        // Not targeting this node: only physical collision and evasion
                        ex = ex + nx * overlap;
                        ey = ey + ny * overlap;
                        this.entityData.setX(i, ex);
                        this.entityData.setY(i, ey);

                        const perpX = -ny;
                        const perpY = nx;
                        const targetDx = this.entityData.getTargetX(i) - ex;
                        const targetDy = this.entityData.getTargetY(i) - ey;
                        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
                        if (targetDist > 0.01) {
                            const side = (dx * targetDy - dy * targetDx) > 0 ? 1 : -1;
                            // Increased evasion force (was 100/2500)
                            const evasionForce = (1 - (dist / (nodeRadius + 60))) * 4500;
                            this.entityData.setVx(i, this.entityData.getVx(i) + perpX * side * evasionForce * dt);
                            this.entityData.setVy(i, this.entityData.getVy(i) + perpY * side * evasionForce * dt);
                        }
                    }
                }
            }
        }
    }

    updateEntities(dt) {
        const bounds = this.entityData.getWorldBounds();
        const speedMult = this.gameSettings.speedMultiplier || 1;
        const now = (Date.now() * 0.001); // seconds, for oscillation

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i)) continue;

            // ── Death animation ──
            if (this.entityData.isDying(i)) {
                let deathTime = this.entityData.getDeathTime(i) + dt;
                this.entityData.setDeathTime(i, deathTime);

                const deathType = this.entityData.getDeathType(i);
                if (deathType === _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.ABSORBED || deathType === _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.SACRIFICE) {
                    const tx = this.entityData.getTargetX(i);
                    const ty = this.entityData.getTargetY(i);
                    if (tx !== 0 || ty !== 0) {
                        const pullFactor = Math.pow(deathTime / 0.4, 2);
                        let ex = this.entityData.getX(i);
                        let ey = this.entityData.getY(i);
                        ex += (tx - ex) * pullFactor * 0.5;
                        ey += (ty - ey) * pullFactor * 0.5;
                        this.entityData.setX(i, ex);
                        this.entityData.setY(i, ey);
                    }
                }

                if (deathTime > 0.4) {
                    this.entityData.setDead(i, true);
                }
                continue;
            }

            let x = this.entityData.getX(i);
            let y = this.entityData.getY(i);
            let vx = this.entityData.getVx(i);
            let vy = this.entityData.getVy(i);
            let speedBoost = this.entityData.getSpeedBoost(i);
            const owner = this.entityData.getOwner(i);

            // ─────────────────────────────────────────────────────────────────
            // 0. Starvation Attrition: If owner has 0 nodes, progressive death
            // ─────────────────────────────────────────────────────────────────
            if (owner !== -1 && !this.activePlayers.has(owner)) {
                // To keep it performant and chaotic, each unit has a small random
                // chance to die every second. A 5% chance per second per unit 
                // means an army of 100 will lose ~5 units per sec.
                if (Math.random() < 0.05 * dt) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.EXPLOSION, i);
                    continue; // Skip the rest of the update for this entity
                }
            }

            // ─────────────────────────────────────────────────────────────────
            // A. Speed-boost: faster in friendly territory (acceleration lane)
            // ─────────────────────────────────────────────────────────────────
            let inFriendlyTerritory = false;
            if (owner !== -1) {
                for (let n = 0; n < this.nodeData.getCount(); n++) {
                    if (this.nodeData.getOwner(n) !== owner) continue;
                    const ndx = x - this.nodeData.getX(n);
                    const ndy = y - this.nodeData.getY(n);
                    const ir = this.nodeData.getInfluenceRadius(n);
                    if (ndx * ndx + ndy * ndy < ir * ir) {
                        inFriendlyTerritory = true;
                        break;
                    }
                }
            }
            speedBoost = inFriendlyTerritory
                ? Math.min(1.0, speedBoost + dt * 1.8)
                : Math.max(0.0, speedBoost - dt * 0.9);


            // B. Seek target -- direct drive, no orbit
            //    * Node target  -> straight in (separation handles spacing)
            //    * Point target -> 12px golden-angle spread across units
            //    * Obstacle avoidance: minimal swerve, graze close to nodes
            const hasTarget = this.entityData.hasTarget(i);
            const targetX = this.entityData.getTargetX(i);
            const targetY = this.entityData.getTargetY(i);
            const targetNodeId = this.entityData.getTargetNodeId(i);

            if (hasTarget) {
                let arrivalX = targetX;
                let arrivalY = targetY;

                let seekThreshold = 2;

                // Point-only targets: stop seeking when close to let the group settle naturally
                if (targetNodeId === -1) {
                    seekThreshold = 25;
                }

                const dx = arrivalX - x;
                const dy = arrivalY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > seekThreshold) {
                    const SEEK_FORCE = 900;
                    vx += (dx / dist) * SEEK_FORCE * dt;
                    vy += (dy / dist) * SEEK_FORCE * dt;

                    // Obstacle avoidance: graze non-target nodes (tight)
                    const speed2 = Math.sqrt(vx * vx + vy * vy);
                    const lookAhead = 30 + speed2 * 0.12;
                    const dirX = vx / (speed2 || 1);
                    const dirY = vy / (speed2 || 1);

                    for (let n = 0; n < this.nodeData.getCount(); n++) {
                        const nnx = this.nodeData.getX(n);
                        const nny = this.nodeData.getY(n);
                        const nRadius = this.nodeData.getRadius(n);

                        // Skip avoidance if this is our target node OR if our target point is inside it
                        if (this.nodeData.getId(n) === targetNodeId) continue;
                        const tdx = targetX - nnx;
                        const tdy = targetY - nny;
                        if (tdx * tdx + tdy * tdy < (nRadius + 35) * (nRadius + 35)) continue;

                        const ndx = nnx - x;
                        const ndy = nny - y;
                        const nDist = Math.sqrt(ndx * ndx + ndy * ndy);

                        if (nDist < nRadius + lookAhead && nDist > 1) {
                            const dot = (ndx / nDist) * dirX + (ndy / nDist) * dirY;
                            if (dot > 0.2) {
                                const perpX = -dirY;
                                const perpY = dirX;
                                const side = (ndx * dirY - ndy * dirX) > 0 ? 1 : -1;
                                const avoidStrength = (1 - nDist / (nRadius + lookAhead)) * 2000;
                                vx += perpX * side * avoidStrength * dt;
                                vy += perpY * side * avoidStrength * dt;
                            }
                        }
                    }
                }
            }

            // C. Organic wobble -- gentle, fades at speed
            //    Idle cells wander slowly; moving cells are nearly straight
            const wobbleFreq = 0.9 + (i % 7) * 0.11;
            const wobblePhase = i * 1.618;
            const wobbleAmp = 2.5;
            const speed = Math.sqrt(vx * vx + vy * vy);
            const speedFade = Math.max(0, 1 - speed / 30);
            if (speed > 0.5) {
                const perpX = -vy / speed;
                const perpY = vx / speed;
                const wobble = Math.sin(now * wobbleFreq + wobblePhase) * wobbleAmp * speedFade;
                vx += perpX * wobble * dt;
                vy += perpY * wobble * dt;
            } else {
                // Idle: slow biological drift
                vx += Math.sin(now * wobbleFreq + wobblePhase) * wobbleAmp * 0.4 * dt;
                vy += Math.cos(now * wobbleFreq + wobblePhase + 0.8) * wobbleAmp * 0.4 * dt;
            }



            // ─────────────────────────────────────────────────────────────────
            // D. Friction + speed cap
            // ─────────────────────────────────────────────────────────────────
            const friction = this.entityData.getFriction(i);
            vx *= friction;
            vy *= friction;

            const maxSpeed = this.entityData.getMaxSpeed(i) * (1 + speedBoost * 0.5) * speedMult;
            const speedSq = vx * vx + vy * vy;
            if (speedSq > maxSpeed * maxSpeed) {
                const s = Math.sqrt(speedSq);
                vx = (vx / s) * maxSpeed;
                vy = (vy / s) * maxSpeed;
            }

            x += vx * dt;
            y += vy * dt;

            // ─────────────────────────────────────────────────────────────────
            // E. World boundary — push back and die if outside too long
            // ─────────────────────────────────────────────────────────────────
            const centerDx = x - bounds.centerX;
            const centerDy = y - bounds.centerY;
            const distFromCenter = Math.sqrt(centerDx * centerDx + centerDy * centerDy);

            if (distFromCenter > bounds.worldRadius) {
                // Soft push back toward center
                const pushStr = (distFromCenter - bounds.worldRadius) * 3;
                vx -= (centerDx / distFromCenter) * pushStr * dt;
                vy -= (centerDy / distFromCenter) * pushStr * dt;

                let outsideTime = this.entityData.getOutsideTime(i) + dt;
                this.entityData.setOutsideTime(i, outsideTime);
                this.entityData.setOutsideWarning(i, true);

                if (outsideTime >= 5) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.OUT_OF_BOUNDS);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, _EntityData_js__WEBPACK_IMPORTED_MODULE_1__.DEATH_TYPES.OUT_OF_BOUNDS, i);
                }
            } else {
                this.entityData.setOutsideTime(i, 0);
                this.entityData.setOutsideWarning(i, false);
            }

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);
            this.entityData.setVx(i, vx);
            this.entityData.setVy(i, vy);
            this.entityData.setSpeedBoost(i, speedBoost);
        }
    }

    updateNodes(dt) {
        // Precalculate unit counts per player to enforce global cap efficiently
        const playerUnitCounts = {};
        let totalAlive = 0;
        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
            totalAlive++;
            const owner = this.entityData.getOwner(i);
            if (owner !== -1) {
                playerUnitCounts[owner] = (playerUnitCounts[owner] || 0) + 1;
            }
        }

        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);

            if (owner !== -1) {
                let baseHp = this.nodeData.getBaseHp(i);
                const maxHp = this.nodeData.getMaxHp(i);

                if (baseHp < maxHp) {
                    baseHp += 0.5 * dt;
                    this.nodeData.setBaseHp(i, baseHp);
                }

                let spawnTimer = this.nodeData.getSpawnTimer(i);
                spawnTimer += dt;

                const healthPercent = Math.min(baseHp / maxHp, 1.0);
                let healthScaling = 0.3 + healthPercent * 1.2;

                // Smoothly ramp bonus production from 90% to 100% HP (prevents visual jumps)
                const fullBonus = Math.max(0, Math.min(0.5, (healthPercent - 0.9) * 5));
                healthScaling += fullBonus;

                const nodeType = this.nodeData.getType(i);
                if (nodeType === _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.NODE_TYPES.LARGE) {
                    healthScaling += 0.5;
                }

                const spawnInterval = this.nodeData.getSpawnInterval(i);
                const spawnThreshold = spawnInterval / healthScaling;

                const currentCount = playerUnitCounts[owner] || 0;
                const hitGlobalCap = currentCount >= _GameConfig_js__WEBPACK_IMPORTED_MODULE_2__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER;
                const canSpawn = totalAlive < _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_ENTITIES && !hitGlobalCap;

                if (canSpawn && spawnTimer >= spawnThreshold && baseHp > maxHp * 0.1) {
                    spawnTimer = 0;
                    this.nodeData.setManualSpawnReady(i, false);

                    const angle = Math.random() * Math.PI * 2;
                    const influenceRadius = this.nodeData.getInfluenceRadius(i);
                    const spawnDist = influenceRadius * 0.6;
                    const ex = this.nodeData.getX(i) + Math.cos(angle) * spawnDist;
                    const ey = this.nodeData.getY(i) + Math.sin(angle) * spawnDist;

                    const targetX = this.nodeData.getRallyX(i);
                    const targetY = this.nodeData.getRallyY(i);
                    const targetNodeId = this.nodeData.getRallyTargetNodeId(i);

                    this.sharedMemory.addSpawnEvent(ex, ey, owner, targetX, targetY, targetNodeId);

                    this.nodeData.setSpawnEffect(i, 0.4);
                }

                this.nodeData.setSpawnTimer(i, spawnTimer);
                this.nodeData.setSpawnProgress(i, spawnTimer / spawnThreshold);
            }

            let hitFlash = this.nodeData.getHitFlash(i);
            if (hitFlash > 0) {
                hitFlash -= dt;
                this.nodeData.setHitFlash(i, hitFlash);
            }

            let spawnEffect = this.nodeData.getSpawnEffect(i);
            if (spawnEffect > 0) {
                spawnEffect -= dt;
                this.nodeData.setSpawnEffect(i, spawnEffect);
            }
        }
    }

}


/***/ },

/***/ "./src/shared/NodeData.js"
/*!********************************!*\
  !*** ./src/shared/NodeData.js ***!
  \********************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   NodeData: () => (/* binding */ NodeData)
/* harmony export */ });
/* harmony import */ var _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./GameConfig.js */ "./src/shared/GameConfig.js");



class NodeData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.nodes = sharedMemory.nodes;
        // Initialize count from the shared header so we can reconstruct NodeData
        // after the memory is written externally (e.g. server sending to client)
        this.count = sharedMemory.getNodeCount();

        this.typeConfig = _GameConfig_js__WEBPACK_IMPORTED_MODULE_1__.NODE_CONFIG;
    }

    allocate(x, y, owner, type, id) {
        const idx = this.count;
        if (idx >= _SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_NODES) {
            console.warn('Max nodes reached');
            return -1;
        }

        const config = this.typeConfig[type];

        this.nodes.x[idx] = x;
        this.nodes.y[idx] = y;
        this.nodes.owner[idx] = owner;
        this.nodes.baseHp[idx] = owner === -1 ? config.maxHp * 0.1 : config.maxHp * 0.25;
        this.nodes.maxHp[idx] = config.maxHp;
        this.nodes.radius[idx] = config.radius;
        this.nodes.influenceRadius[idx] = config.influenceRadius;
        this.nodes.spawnTimer[idx] = 0;
        this.nodes.spawnProgress[idx] = 0;
        this.nodes.hitFlash[idx] = 0;
        this.nodes.stock[idx] = 0;
        this.nodes.nodeFlags[idx] = 0;
        this.nodes.type[idx] = type;
        this.nodes.spawnEffect[idx] = 0;
        this.nodes.manualSpawnReady[idx] = 0;
        this.nodes.id[idx] = id || idx;
        this.nodes.rallyX[idx] = 0;
        this.nodes.rallyY[idx] = 0;
        this.nodes.rallyTargetNodeId[idx] = -1;

        this.count++;
        this.memory.setNodeCount(this.count);

        return idx;
    }

    getCount() {
        return this.count;
    }

    getX(index) {
        return this.nodes.x[index];
    }

    setX(index, value) {
        this.nodes.x[index] = value;
    }

    getY(index) {
        return this.nodes.y[index];
    }

    setY(index, value) {
        this.nodes.y[index] = value;
    }

    getOwner(index) {
        return this.nodes.owner[index];
    }

    setOwner(index, value) {
        this.nodes.owner[index] = value;
    }

    getBaseHp(index) {
        return this.nodes.baseHp[index];
    }

    setBaseHp(index, value) {
        this.nodes.baseHp[index] = value;
    }

    getMaxHp(index) {
        return this.nodes.maxHp[index];
    }

    setMaxHp(index, value) {
        this.nodes.maxHp[index] = value;
    }

    getRadius(index) {
        return this.nodes.radius[index];
    }

    setRadius(index, value) {
        this.nodes.radius[index] = value;
    }

    getInfluenceRadius(index) {
        return this.nodes.influenceRadius[index];
    }

    setInfluenceRadius(index, value) {
        this.nodes.influenceRadius[index] = value;
    }

    getSpawnTimer(index) {
        return this.nodes.spawnTimer[index];
    }

    setSpawnTimer(index, value) {
        this.nodes.spawnTimer[index] = value;
    }

    getSpawnProgress(index) {
        return this.nodes.spawnProgress[index];
    }

    setSpawnProgress(index, value) {
        this.nodes.spawnProgress[index] = value;
    }

    getRallyX(index) {
        return this.nodes.rallyX[index];
    }

    setRallyX(index, value) {
        this.nodes.rallyX[index] = value;
    }

    getRallyY(index) {
        return this.nodes.rallyY[index];
    }

    setRallyY(index, value) {
        this.nodes.rallyY[index] = value;
    }

    getRallyTargetNodeId(index) {
        return this.nodes.rallyTargetNodeId[index];
    }

    setRallyTargetNodeId(index, value) {
        this.nodes.rallyTargetNodeId[index] = value;
    }

    getHitFlash(index) {
        return this.nodes.hitFlash[index];
    }

    setHitFlash(index, value) {
        this.nodes.hitFlash[index] = value;
    }

    getStock(index) {
        return this.nodes.stock[index];
    }

    setStock(index, value) {
        this.nodes.stock[index] = value;
    }

    getType(index) {
        return this.nodes.type[index];
    }

    setType(index, value) {
        this.nodes.type[index] = value;
    }

    setSpawnInterval(index, value) {
        // spawnInterval is stored in the SharedMemory spawnTimer field (no dedicated field).
        // We store it separately using a per-node override encoded in a spare field.
        // Actually spawnTimer stores the current timer, so we need another approach:
        // NodeData.getSpawnInterval reads from typeConfig; to override per-node, store in stock temporarily.
        // Better: use a dedicated backing array.
        if (!this._spawnIntervalOverride) this._spawnIntervalOverride = new Float32Array(_SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.MEMORY_LAYOUT.MAX_NODES);
        this._spawnIntervalOverride[index] = value;
    }

    getSpawnEffect(index) {
        return this.nodes.spawnEffect[index];
    }

    setSpawnEffect(index, value) {
        this.nodes.spawnEffect[index] = value;
    }

    isManualSpawnReady(index) {
        return this.memory.isNodeManualSpawnReady(index);
    }

    setManualSpawnReady(index, value) {
        this.memory.setNodeManualSpawnReady(index, value);
    }

    isValidIndex(index) {
        return index >= 0 && index < this.count;
    }

    getSpawnInterval(index) {
        if (this._spawnIntervalOverride && this._spawnIntervalOverride[index] > 0) {
            return this._spawnIntervalOverride[index];
        }
        const type = this.nodes.type[index];
        return this.typeConfig[type]?.spawnInterval || 3.5;
    }

    getTotalHp(index) {
        return Math.min(this.nodes.maxHp[index], this.nodes.baseHp[index]);
    }

    getId(index) {
        return this.nodes.id[index];
    }

    setId(index, value) {
        this.nodes.id[index] = value;
    }
}


/***/ },

/***/ "./src/shared/SharedMemory.js"
/*!************************************!*\
  !*** ./src/shared/SharedMemory.js ***!
  \************************************/
(__unused_webpack___webpack_module__, __webpack_exports__, __webpack_require__) {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   MEMORY_LAYOUT: () => (/* binding */ MEMORY_LAYOUT),
/* harmony export */   SharedMemory: () => (/* binding */ SharedMemory),
/* harmony export */   calculateBufferSize: () => (/* binding */ calculateBufferSize)
/* harmony export */ });
// These are filled in after the offset calculations below
const MEMORY_LAYOUT = {
    MAX_ENTITIES: 15000,
    MAX_NODES: 128,
    MAX_DEATH_EVENTS: 256,
    MAX_SPAWN_EVENTS: 64,
    // Filled in at bottom of this file after layout is computed:
    TOTAL_SIZE: 0,
    ENTITY_DATA_START: 0,
    NODE_DATA_START: 0,
    ENTITY_STRIDE: 0,
    NODE_STRIDE: 0,
};

const HEADER_SIZE = 256;

const ENTITY_FIELD_SIZES = {
    x: 4, y: 4, vx: 4, vy: 4,
    owner: 4, radius: 4, maxSpeed: 4, friction: 4,
    hp: 4, speedBoost: 4,
    flags: 4, deathTime: 4, deathType: 4,
    targetX: 4, targetY: 4, targetNodeId: 4,
    flockId: 4, outsideTime: 4,
    id: 8,
};

let entityOffset = 0;
const ENTITY_OFFSET_X = entityOffset; entityOffset += ENTITY_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_Y = entityOffset; entityOffset += ENTITY_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vx * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vy * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OWNER = entityOffset; entityOffset += ENTITY_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_RADIUS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_MAXSPEED = entityOffset; entityOffset += ENTITY_FIELD_SIZES.maxSpeed * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FRICTION = entityOffset; entityOffset += ENTITY_FIELD_SIZES.friction * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_HP = entityOffset; entityOffset += ENTITY_FIELD_SIZES.hp * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_SPEEDBOOST = entityOffset; entityOffset += ENTITY_FIELD_SIZES.speedBoost * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLAGS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flags * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTYPE = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathType * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETNODEID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLOCKID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flockId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OUTSIDETIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.outsideTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_ID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_ENTITIES;

const TOTAL_ENTITY_BYTES = entityOffset;

const NODE_FIELD_SIZES = {
    x: 4, y: 4, owner: 4, baseHp: 4, maxHp: 4,
    radius: 4, influenceRadius: 4, spawnTimer: 4, spawnProgress: 4,
    hitFlash: 4, stock: 4, nodeFlags: 4, type: 4, spawnEffect: 4, manualSpawnReady: 4,
    id: 4,
    rallyX: 4, rallyY: 4, rallyTargetNodeId: 4,
};

let nodeOffset = 0;
const NODE_OFFSET_X = nodeOffset; nodeOffset += NODE_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_Y = nodeOffset; nodeOffset += NODE_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_OWNER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_BASEHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.baseHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MAXHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.maxHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_INFLUENCERADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.influenceRadius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNTIMER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnTimer * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNPROGRESS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnProgress * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_HITFLASH = nodeOffset; nodeOffset += NODE_FIELD_SIZES.hitFlash * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_STOCK = nodeOffset; nodeOffset += NODE_FIELD_SIZES.stock * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_NODEFLAGS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.nodeFlags * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_TYPE = nodeOffset; nodeOffset += NODE_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNEFFECT = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnEffect * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MANUALSPAWNREADY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.manualSpawnReady * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_ID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYX = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyX * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyY * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYTARGETNODEID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyTargetNodeId * MEMORY_LAYOUT.MAX_NODES;

const TOTAL_NODE_BYTES = nodeOffset;

const DEATH_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, type: 4, entityIndex: 4, targetX: 4, targetY: 4 };
let deathOffset = 0;
const DEATH_OFFSET_X = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_Y = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_OWNER = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TYPE = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_ENTITYINDEX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.entityIndex * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETY = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const TOTAL_DEATH_EVENT_BYTES = deathOffset;

const SPAWN_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, targetX: 4, targetY: 4, targetNodeId: 4, id: 8 };
let spawnOffset = 0;
const SPAWN_OFFSET_X = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_Y = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_OWNER = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETX = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETY = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETNODEID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_ID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const TOTAL_SPAWN_EVENT_BYTES = spawnOffset;

const NODES_OFFSET = HEADER_SIZE + TOTAL_ENTITY_BYTES;
const DEATH_EVENTS_OFFSET = NODES_OFFSET + TOTAL_NODE_BYTES;
const SPAWN_EVENTS_OFFSET = DEATH_EVENTS_OFFSET + TOTAL_DEATH_EVENT_BYTES;

// Fill in derived layout constants now that offsets are known
MEMORY_LAYOUT.ENTITY_DATA_START = HEADER_SIZE;
MEMORY_LAYOUT.NODE_DATA_START = NODES_OFFSET;
MEMORY_LAYOUT.ENTITY_STRIDE = Object.values(ENTITY_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4; // in float32 words
MEMORY_LAYOUT.NODE_STRIDE = Object.values(NODE_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4;

function calculateBufferSize() {
    return SPAWN_EVENTS_OFFSET + TOTAL_SPAWN_EVENT_BYTES;
}
// Also store total size on MEMORY_LAYOUT for external use
MEMORY_LAYOUT.TOTAL_SIZE = calculateBufferSize();

class SharedMemory {
    constructor(buffer) {
        this.buffer = buffer;

        this.header = {
            entityCount: new Uint32Array(buffer, 0, 1),
            nodeCount: new Uint32Array(buffer, 4, 1),
            maxEntities: new Uint32Array(buffer, 8, 1),
            maxNodes: new Uint32Array(buffer, 12, 1),
            flags: new Uint8Array(buffer, 16, 1),
            deathEventsCount: new Uint32Array(buffer, 20, 1),
            spawnEventsCount: new Uint32Array(buffer, 24, 1),
            frameCounter: new Uint32Array(buffer, 28, 1),
        };

        this.header.maxEntities[0] = MEMORY_LAYOUT.MAX_ENTITIES;
        this.header.maxNodes[0] = MEMORY_LAYOUT.MAX_NODES;

        this.entities = {
            x: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_X, MEMORY_LAYOUT.MAX_ENTITIES),
            y: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_Y, MEMORY_LAYOUT.MAX_ENTITIES),
            vx: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VX, MEMORY_LAYOUT.MAX_ENTITIES),
            vy: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VY, MEMORY_LAYOUT.MAX_ENTITIES),
            owner: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OWNER, MEMORY_LAYOUT.MAX_ENTITIES),
            radius: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_ENTITIES),
            maxSpeed: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_MAXSPEED, MEMORY_LAYOUT.MAX_ENTITIES),
            friction: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FRICTION, MEMORY_LAYOUT.MAX_ENTITIES),
            hp: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_HP, MEMORY_LAYOUT.MAX_ENTITIES),
            speedBoost: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_SPEEDBOOST, MEMORY_LAYOUT.MAX_ENTITIES),
            flags: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLAGS, MEMORY_LAYOUT.MAX_ENTITIES),
            deathTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTIME, MEMORY_LAYOUT.MAX_ENTITIES),
            deathType: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTYPE, MEMORY_LAYOUT.MAX_ENTITIES),
            targetX: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_ENTITIES),
            targetY: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_ENTITIES),
            targetNodeId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_ENTITIES),
            flockId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLOCKID, MEMORY_LAYOUT.MAX_ENTITIES),
            outsideTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OUTSIDETIME, MEMORY_LAYOUT.MAX_ENTITIES),
            id: new Float64Array(buffer, HEADER_SIZE + ENTITY_OFFSET_ID, MEMORY_LAYOUT.MAX_ENTITIES),
        };

        this.nodes = {
            x: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_X, MEMORY_LAYOUT.MAX_NODES),
            y: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_Y, MEMORY_LAYOUT.MAX_NODES),
            owner: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_OWNER, MEMORY_LAYOUT.MAX_NODES),
            baseHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_BASEHP, MEMORY_LAYOUT.MAX_NODES),
            maxHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_MAXHP, MEMORY_LAYOUT.MAX_NODES),
            radius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_NODES),
            influenceRadius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_INFLUENCERADIUS, MEMORY_LAYOUT.MAX_NODES),
            spawnTimer: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNTIMER, MEMORY_LAYOUT.MAX_NODES),
            spawnProgress: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNPROGRESS, MEMORY_LAYOUT.MAX_NODES),
            hitFlash: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_HITFLASH, MEMORY_LAYOUT.MAX_NODES),
            stock: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_STOCK, MEMORY_LAYOUT.MAX_NODES),
            nodeFlags: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_NODEFLAGS, MEMORY_LAYOUT.MAX_NODES),
            type: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_TYPE, MEMORY_LAYOUT.MAX_NODES),
            spawnEffect: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNEFFECT, MEMORY_LAYOUT.MAX_NODES),
            manualSpawnReady: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_MANUALSPAWNREADY, MEMORY_LAYOUT.MAX_NODES),
            id: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_ID, MEMORY_LAYOUT.MAX_NODES),
            rallyX: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYX, MEMORY_LAYOUT.MAX_NODES),
            rallyY: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYY, MEMORY_LAYOUT.MAX_NODES),
            rallyTargetNodeId: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYTARGETNODEID, MEMORY_LAYOUT.MAX_NODES),
        };

        this.deathEvents = {
            x: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_X, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            y: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_Y, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            owner: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_OWNER, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            type: new Uint32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TYPE, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            entityIndex: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_ENTITYINDEX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetX: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetY: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
        };

        this.spawnEvents = {
            x: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_X, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            y: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_Y, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            owner: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_OWNER, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetX: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetY: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetNodeId: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            id: new Float64Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_ID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
        };
    }

    static create() {
        const size = calculateBufferSize();
        const buffer = new SharedArrayBuffer(size);
        return new SharedMemory(buffer);
    }

    // Convenience alias: clear both event queues
    clearEvents() {
        this.header.deathEventsCount[0] = 0;
        this.header.spawnEventsCount[0] = 0;
    }

    clearDeathEvents() {
        this.header.deathEventsCount[0] = 0;
    }

    addDeathEvent(x, y, owner, type, entityIndex, targetX = 0, targetY = 0) {
        const idx = this.header.deathEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_DEATH_EVENTS) return;

        this.deathEvents.x[idx] = x;
        this.deathEvents.y[idx] = y;
        this.deathEvents.owner[idx] = owner;
        this.deathEvents.type[idx] = type;
        this.deathEvents.entityIndex[idx] = entityIndex;
        this.deathEvents.targetX[idx] = targetX;
        this.deathEvents.targetY[idx] = targetY;

        this.header.deathEventsCount[0] = idx + 1;
    }

    clearSpawnEvents() {
        this.header.spawnEventsCount[0] = 0;
    }

    // Allocate entity: returns index or -1
    allocateEntity() {
        const idx = this.header.entityCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_ENTITIES) return -1;
        this.header.entityCount[0] = idx + 1;
        // Zero the flags for this slot
        this.entities.flags[idx] = 0;
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = 0;
        return idx;
    }

    // Read back all death events as array of objects
    getDeathEvents() {
        const count = this.header.deathEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.deathEvents.x[i],
                y: this.deathEvents.y[i],
                owner: this.deathEvents.owner[i],
                type: this.deathEvents.type[i],
                entityIndex: this.deathEvents.entityIndex[i],
                targetX: this.deathEvents.targetX[i],
                targetY: this.deathEvents.targetY[i],
            });
        }
        return events;
    }

    // Read back all spawn events as array of objects
    getSpawnEvents() {
        const count = this.header.spawnEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.spawnEvents.x[i],
                y: this.spawnEvents.y[i],
                owner: this.spawnEvents.owner[i],
                targetX: this.spawnEvents.targetX[i],
                targetY: this.spawnEvents.targetY[i],
                targetNodeId: this.spawnEvents.targetNodeId[i],
                id: this.spawnEvents.id[i],
            });
        }
        return events;
    }

    addSpawnEvent(x, y, owner, targetX, targetY, targetNodeId, id) {
        const idx = this.header.spawnEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_SPAWN_EVENTS) return;

        this.spawnEvents.x[idx] = x;
        this.spawnEvents.y[idx] = y;
        this.spawnEvents.owner[idx] = owner;
        this.spawnEvents.targetX[idx] = targetX;
        this.spawnEvents.targetY[idx] = targetY;
        this.spawnEvents.targetNodeId[idx] = targetNodeId;
        this.spawnEvents.id[idx] = id;

        this.header.spawnEventsCount[0] = idx + 1;
    }

    setEntityCount(count) {
        this.header.entityCount[0] = count;
    }

    setNodeCount(count) {
        this.header.nodeCount[0] = count;
    }

    getEntityCount() {
        return this.header.entityCount[0];
    }

    getNodeCount() {
        return this.header.nodeCount[0];
    }

    incrementFrameCounter() {
        this.header.frameCounter[0]++;
    }

    getFrameCounter() {
        return this.header.frameCounter[0];
    }

    isDead(entityIndex) {
        return (this.entities.flags[entityIndex] & 1) !== 0;
    }

    setDead(entityIndex, dead) {
        if (dead) {
            this.entities.flags[entityIndex] |= 1;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFE;
        }
    }

    isDying(entityIndex) {
        return (this.entities.flags[entityIndex] & 2) !== 0;
    }

    setDying(entityIndex, dying) {
        if (dying) {
            this.entities.flags[entityIndex] |= 2;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFD;
        }
    }

    isSelected(entityIndex) {
        return (this.entities.flags[entityIndex] & 4) !== 0;
    }

    setSelected(entityIndex, selected) {
        if (selected) {
            this.entities.flags[entityIndex] |= 4;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFB;
        }
    }

    hasOutsideWarning(entityIndex) {
        return (this.entities.flags[entityIndex] & 8) !== 0;
    }

    setOutsideWarning(entityIndex, warning) {
        if (warning) {
            this.entities.flags[entityIndex] |= 8;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFF7;
        }
    }

    isNodeManualSpawnReady(nodeIndex) {
        return (this.nodes.nodeFlags[nodeIndex] & 1) !== 0;
    }

    setNodeManualSpawnReady(nodeIndex, ready) {
        if (ready) {
            this.nodes.nodeFlags[nodeIndex] |= 1;
        } else {
            this.nodes.nodeFlags[nodeIndex] &= 0xFFFFFFFE;
        }
    }
}


/***/ }

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Check if module exists (development only)
/******/ 		if (__webpack_modules__[moduleId] === undefined) {
/******/ 			var e = new Error("Cannot find module '" + moduleId + "'");
/******/ 			e.code = 'MODULE_NOT_FOUND';
/******/ 			throw e;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry needs to be wrapped in an IIFE because it needs to be isolated against other modules in the chunk.
(() => {
/*!******************************************!*\
  !*** ./src/client/workers/GameWorker.js ***!
  \******************************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @shared/SharedMemory.js */ "./src/shared/SharedMemory.js");
/* harmony import */ var _shared_EntityData_js__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @shared/EntityData.js */ "./src/shared/EntityData.js");
/* harmony import */ var _shared_NodeData_js__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @shared/NodeData.js */ "./src/shared/NodeData.js");
/* harmony import */ var _shared_GameEngine_js__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @shared/GameEngine.js */ "./src/shared/GameEngine.js");
/* harmony import */ var _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! @shared/GameConfig.js */ "./src/shared/GameConfig.js");






let sharedMemory = null;
let entityData = null;
let nodeData = null;
let gameEngine = null;
let syncComplete = false;
let entityIdToIndex = new Map();
let nodeIdToIndex = new Map();
let gameSettings = {
    speedMultiplier: 1,
    maxEntitiesPerPlayer: _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.GAME_SETTINGS.MAX_UNITS_PER_PLAYER,
};

const WORLD_WIDTH = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.GAME_SETTINGS.WORLD_WIDTH;
const WORLD_HEIGHT = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.GAME_SETTINGS.WORLD_HEIGHT;
const WORLD_RADIUS = _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.GAME_SETTINGS.WORLD_RADIUS;
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
        sharedMemory = new _shared_SharedMemory_js__WEBPACK_IMPORTED_MODULE_0__.SharedMemory(data.sharedBuffer);
        entityData = new _shared_EntityData_js__WEBPACK_IMPORTED_MODULE_1__.EntityData(sharedMemory);
        nodeData = new _shared_NodeData_js__WEBPACK_IMPORTED_MODULE_2__.NodeData(sharedMemory);
        gameEngine = new _shared_GameEngine_js__WEBPACK_IMPORTED_MODULE_3__.GameEngine(sharedMemory, entityData, nodeData, gameSettings);

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
    // type is now expected to be a numeric constant from NODE_TYPES
    const nodeType = typeof type === 'number' ? type :
        (type === 'small' ? _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.SMALL :
            type === 'large' ? _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.LARGE :
                type === 'mega' ? _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.MEGA :
                    type === 'ultra' ? _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.ULTRA :
                        type === 'omega' ? _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.OMEGA : _shared_GameConfig_js__WEBPACK_IMPORTED_MODULE_4__.NODE_TYPES.MEDIUM);

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

    // REBUILD ID MAP: Source of truth is the actual shared memory
    // Only clear and rebuild if count changed or periodically for safety
    entityIdToIndex.clear();
    const count = entityData.getCount();
    for (let i = 0; i < count; i++) {
        if (!entityData.isDead(i)) {
            const id = entityData.getId(i);
            if (id > 0) {
                entityIdToIndex.set(id, i);
            }
        }
    }

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

})();

/******/ })()
;
//# sourceMappingURL=src_client_workers_GameWorker_js.bundle.js.map