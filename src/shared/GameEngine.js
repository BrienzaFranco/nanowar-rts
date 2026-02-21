import { MEMORY_LAYOUT } from './SharedMemory.js';
import { DEATH_TYPES } from './EntityData.js';
import { NODE_TYPES } from './GameConfig.js';
import { GAME_SETTINGS } from './GameConfig.js';

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
        // Track which players currently own at least one node
        this.activePlayers = new Set();
        for (let i = 0; i < this.nodeData.getCount(); i++) {
            const owner = this.nodeData.getOwner(i);
            if (owner !== -1) {
                this.activePlayers.add(owner);
            }
        }

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
                fx += (targetVx - vx) * ALI_FORCE * 0.016;
                fy += (targetVy - vy) * ALI_FORCE * 0.016;
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

            vx += fx * 0.016;
            vy += fy * 0.016;

            this.entityData.setX(i, x);
            this.entityData.setY(i, y);
            this.entityData.setVx(i, vx);
            this.entityData.setVy(i, vy);
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
        const now = (Date.now() * 0.001); // seconds, for oscillation

        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i)) continue;

            // ── Death animation ──
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

            // ─────────────────────────────────────────────────────────────────
            // 0. Starvation Attrition: If owner has 0 nodes, progressive death
            // ─────────────────────────────────────────────────────────────────
            if (owner !== -1 && !this.activePlayers.has(owner)) {
                // To keep it performant and chaotic, each unit has a small random
                // chance to die every second. A 5% chance per second per unit 
                // means an army of 100 will lose ~5 units per sec.
                if (Math.random() < 0.05 * dt) {
                    this.entityData.setDying(i, true);
                    this.entityData.setDeathType(i, DEATH_TYPES.EXPLOSION);
                    this.entityData.setDeathTime(i, 0);
                    this.sharedMemory.addDeathEvent(x, y, owner, DEATH_TYPES.EXPLOSION, i);
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
        // Precalculate unit counts per player to enforce global cap efficiently
        const playerUnitCounts = {};
        for (let i = 0; i < this.entityData.getCount(); i++) {
            if (this.entityData.isDead(i) || this.entityData.isDying(i)) continue;
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
                if (nodeType === NODE_TYPES.LARGE) {
                    healthScaling += 0.5;
                }

                const spawnInterval = this.nodeData.getSpawnInterval(i);
                const spawnThreshold = spawnInterval / healthScaling;

                const currentCount = playerUnitCounts[owner] || 0;
                const hitGlobalCap = currentCount >= GAME_SETTINGS.MAX_UNITS_PER_PLAYER;
                const canSpawn = this.entityData.getCount() < MEMORY_LAYOUT.MAX_ENTITIES && !hitGlobalCap;

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
