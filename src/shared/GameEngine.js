import { MEMORY_LAYOUT } from './SharedMemory.js';
import { DEATH_TYPES } from './EntityData.js';
import { NODE_TYPES } from './NodeData.js';

export class GameEngine {
    constructor(sharedMemory, entityData, nodeData, gameSettings) {
        this.sharedMemory = sharedMemory;
        this.entityData = entityData;
        this.nodeData = nodeData;
        this.gameSettings = gameSettings || { speedMultiplier: 1, maxEntitiesPerPlayer: 1000 };

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
        this.handleCollisionsAndCohesion();
        this.handleEntityNodeCollisions();
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

    handleCollisionsAndCohesion() {
        this.buildSpatialGrid();

        const count = this.entityData.getCount();
        const cohesionRadius = 80;
        const cohesionForce = 35;
        const separationRadius = 32;
        const separationForce = 150;

        for (let i = 0; i < count; i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;

            let x = this.entityData.getX(i);
            let y = this.entityData.getY(i);
            const owner = this.entityData.getOwner(i);
            const radius = this.entityData.getRadius(i);

            for (let n = 0; n < this.nodeData.getCount(); n++) {
                const nodeX = this.nodeData.getX(n);
                const nodeY = this.nodeData.getY(n);
                const nodeRadius = this.nodeData.getRadius(n);

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

                    const vx = this.entityData.getVx(i) + nx * 50 * 0.016;
                    const vy = this.entityData.getVy(i) + ny * 50 * 0.016;
                    this.entityData.setVx(i, vx);
                    this.entityData.setVy(i, vy);
                }
            }

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);

            let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
            let separationX = 0, separationY = 0, separationCount = 0;

            const neighborCount = this.getNearbyEntities(x, y, cohesionRadius);
            const flockId = this.entityData.getFlockId(i);
            const inFlock = flockId !== -1;

            for (let nIdx = 0; nIdx < neighborCount; nIdx++) {
                const other = this.queryResultArray[nIdx];
                if (other === i) continue;
                if (this.entityData.isDead(other) || this.entityData.isDying(other)) continue;

                const ox = this.entityData.getX(other);
                const oy = this.entityData.getY(other);
                const dx = ox - x;
                const dy = oy - y;
                const distSq = dx * dx + dy * dy;

                if (distSq > cohesionRadius * cohesionRadius) continue;
                const dist = Math.sqrt(distSq);

                const otherOwner = this.entityData.getOwner(other);
                const minDist = radius + this.entityData.getRadius(other);

                if (dist < minDist && dist > 0) {
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    let xi = this.entityData.getX(i) - nx * overlap * 0.6;
                    let yi = this.entityData.getY(i) - ny * overlap * 0.6;
                    this.entityData.setX(i, xi);
                    this.entityData.setY(i, yi);

                    if (owner !== otherOwner) {
                        this.entityData.setDying(i, true);
                        this.entityData.setDeathType(i, DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(i, 0);
                        this.sharedMemory.addDeathEvent(x, y, owner, DEATH_TYPES.EXPLOSION, i);

                        this.entityData.setDying(other, true);
                        this.entityData.setDeathType(other, DEATH_TYPES.EXPLOSION);
                        this.entityData.setDeathTime(other, 0);
                        const ox2 = this.entityData.getX(other);
                        const oy2 = this.entityData.getY(other);
                        this.sharedMemory.addDeathEvent(ox2, oy2, otherOwner, DEATH_TYPES.EXPLOSION, other);
                        break;
                    }

                    const ovx = this.entityData.getVx(other);
                    const ovy = this.entityData.getVy(other);
                    const ivx = this.entityData.getVx(i);
                    const ivy = this.entityData.getVy(i);
                    const dvx = ovx - ivx;
                    const dvy = ovy - ivy;
                    const velAlongNormal = dvx * nx + dvy * ny;

                    if (velAlongNormal > 0) {
                        const j = -(1.3) * velAlongNormal * 0.5;
                        this.entityData.setVx(i, ivx - j * nx);
                        this.entityData.setVy(i, ivy - j * ny);
                        this.entityData.setVx(other, ovx + j * nx);
                        this.entityData.setVy(other, ovy + j * ny);
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
                        if (inFlock && this.entityData.getFlockId(other) === flockId) {
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

                const vx = this.entityData.getVx(i) + fx * 0.016;
                const vy = this.entityData.getVy(i) + fy * 0.016;
                this.entityData.setVx(i, vx);
                this.entityData.setVy(i, vy);
            }
        }
    }

    handleEntityNodeCollisions() {
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
                            this.nodeData.setBaseHp(n, this.nodeData.getBaseHp(n) - 1);
                            this.nodeData.setHitFlash(n, 0.3);

                            if (this.nodeData.getBaseHp(n) <= 0) {
                                this.nodeData.setOwner(n, eOwner);
                                this.nodeData.setBaseHp(n, this.nodeData.getMaxHp(n) * 0.1);
                            }

                            this.entityData.setDying(i, true);
                            this.entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                            this.entityData.setDeathTime(i, 0);
                            this.sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i);
                            break;
                        }
                        else if (nodeOwner === eOwner) {
                            const baseHp = this.nodeData.getBaseHp(n);
                            const maxHp = this.nodeData.getMaxHp(n);
                            if (baseHp < maxHp) {
                                this.nodeData.setBaseHp(n, baseHp + 1);
                                this.nodeData.setHitFlash(n, 0.15);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, DEATH_TYPES.ABSORBED);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ABSORBED, i, nodeX, nodeY);
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
                                this.entityData.setDeathType(defenderIdx, DEATH_TYPES.SACRIFICE);
                                this.entityData.setDeathTime(defenderIdx, 0);

                                // Store node center as target for pull animation
                                this.entityData.setTargetX(defenderIdx, nodeX);
                                this.entityData.setTargetY(defenderIdx, nodeY);

                                const defX = this.entityData.getX(defenderIdx);
                                const defY = this.entityData.getY(defenderIdx);
                                const defOwner = this.entityData.getOwner(defenderIdx);
                                this.sharedMemory.addDeathEvent(defX, defY, defOwner, DEATH_TYPES.SACRIFICE, defenderIdx, nodeX, nodeY);

                                this.entityData.setDying(i, true);
                                this.entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i, nodeX, nodeY);
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
                                this.entityData.setDeathType(i, DEATH_TYPES.ATTACK);
                                this.entityData.setDeathTime(i, 0);
                                this.sharedMemory.addDeathEvent(ex, ey, eOwner, DEATH_TYPES.ATTACK, i, nodeX, nodeY);
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
                            this.entityData.setVx(i, this.entityData.getVx(i) + perpX * side * evasionForce * 0.016);
                            this.entityData.setVy(i, this.entityData.getVy(i) + perpY * side * evasionForce * 0.016);
                        }
                    }
                }
            }
        }
    }

    updateEntities(dt) {
        const bounds = this.entityData.getWorldBounds();
        const speedMult = this.gameSettings.speedMultiplier || 1;

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i)) continue;

            if (this.entityData.isDying(i)) {
                let deathTime = this.entityData.getDeathTime(i) + dt;
                this.entityData.setDeathTime(i, deathTime);

                const deathType = this.entityData.getDeathType(i);
                if (deathType === DEATH_TYPES.ABSORBED || deathType === DEATH_TYPES.SACRIFICE) {
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

            let inFriendlyTerritory = false;
            if (owner !== -1) {
                for (let n = 0; n < this.nodeData.getCount(); n++) {
                    if (this.nodeData.getOwner(n) !== owner) continue;
                    const nx = this.nodeData.getX(n);
                    const ny = this.nodeData.getY(n);
                    const influenceRadius = this.nodeData.getInfluenceRadius(n);
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

            const targetX = this.entityData.getTargetX(i);
            const targetY = this.entityData.getTargetY(i);
            const hasTarget = this.entityData.hasTarget(i);

            const dx = targetX - x;
            const dy = targetY - y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (hasTarget && dist > 5) {
                const moveForce = 800;
                vx += (dx / dist) * moveForce * dt;
                vy += (dy / dist) * moveForce * dt;

                const targetNx = dx / dist;
                const targetNy = dy / dist;
                const targetNodeId = this.entityData.getTargetNodeId(i);

                for (let n = 0; n < this.nodeData.getCount(); n++) {
                    if (targetNodeId === this.nodeData.getId(n)) continue;

                    const nx = this.nodeData.getX(n);
                    const ny = this.nodeData.getY(n);
                    const nRadius = this.nodeData.getRadius(n);

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

            let friction = this.entityData.getFriction(i);
            vx *= friction;
            vy *= friction;

            // speedBoost ya se calculó en el bloque de friendly territory
            let maxSpeed = this.entityData.getMaxSpeed(i) * (1 + speedBoost * 0.4) * speedMult;

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
                let outsideTime = this.entityData.getOutsideTime(i) + dt;
                this.entityData.setOutsideTime(i, outsideTime);
                this.entityData.setOutsideWarning(i, true);

                if (outsideTime >= 5) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, DEATH_TYPES.OUT_OF_BOUNDS);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, DEATH_TYPES.OUT_OF_BOUNDS, i);
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
                if (nodeType === NODE_TYPES.LARGE) {
                    healthScaling += 0.5;
                }

                const spawnInterval = this.nodeData.getSpawnInterval(i);
                const spawnThreshold = spawnInterval / healthScaling;

                const canSpawn = this.entityData.getCount() < MEMORY_LAYOUT.MAX_ENTITIES;

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
