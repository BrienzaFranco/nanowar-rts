import { GlobalSpawnTimer } from './GlobalSpawnTimer.js';
import { GAME_SETTINGS } from './GameConfig.js';
import { SpatialGrid } from './SpatialGrid.js';

export class GameState {
    constructor() {
        this.nodes = [];
        this.entities = [];
        this.playerCount = 1;
        this.globalSpawnTimer = new GlobalSpawnTimer(2.5);
        this.worldWidth = GAME_SETTINGS.WORLD_WIDTH;
        this.worldHeight = GAME_SETTINGS.WORLD_HEIGHT;
        this.elapsedTime = 0; // Track game time for escalation

        // Game settings (from lobby)
        this.speedMultiplier = 1;
        this.accelerationEnabled = true;
        this.showProduction = true;

        // optimizations
        this.spatialGrid = new SpatialGrid(this.worldWidth, this.worldHeight, 160); // 160px cells for units
        this.spatialGridNodes = new SpatialGrid(this.worldWidth, this.worldHeight, 400); // 400px cells for nodes (larger radius)
        this.maxEntitiesPerPlayer = 1000; // Increased to 1000 per user feedback
        this.unitCounts = {}; // Cache unit counts per player for capping
        this.flockUpdateCounter = 0; // Throttling for flock detection

        // Statistics tracking
        this.stats = {
            startTime: Date.now(),
            unitsProduced: {}, // playerId -> count
            unitsLost: {}, // playerId -> count
            unitsCurrent: {}, // playerId -> current count
            capturedNodes: {}, // playerId -> count
            history: [], // { time, playerId, count }
            productionHistory: [], // { time, playerId, rate, total }
            events: [] // { time, type, playerId, data }
        };

        this.deathBuffer = []; // To detect "Big Battles"
    }

    recordDeath(playerId, x, y) {
        if (!this.stats.unitsLost[playerId]) this.stats.unitsLost[playerId] = 0;
        this.stats.unitsLost[playerId]++;

        const now = Date.now();
        this.deathBuffer.push({ time: now, x, y, owner: playerId });

        // Clean old deaths from buffer (last 3 seconds for better detection)
        this.deathBuffer = this.deathBuffer.filter(d => now - d.time < 3000);

        // Detect Big Battle: 40+ deaths in 3 seconds in a small area
        if (this.deathBuffer.length >= 40) {
            // Simple spatial check: average position
            let avgX = 0, avgY = 0;
            this.deathBuffer.forEach(d => { avgX += d.x; avgY += d.y; });
            avgX /= this.deathBuffer.length;
            avgY /= this.deathBuffer.length;

            // If majority are within 200px of center
            const closeOnes = this.deathBuffer.filter(d => {
                const dx = d.x - avgX;
                const dy = d.y - avgY;
                return dx * dx + dy * dy < 200 * 200;
            });

            if (closeOnes.length >= 30 && now - (this.lastBigBattle || 0) > 8000) {
                this.lastBigBattle = now;
                // Count deaths per player in this battle
                const participants = {};
                closeOnes.forEach(d => participants[d.owner] = (participants[d.owner] || 0) + 1);
                
                this.recordEvent('big_battle', playerId, { 
                    x: avgX, y: avgY, 
                    count: closeOnes.length,
                    participants
                });
            }
        }
    }

    recordEvent(type, playerId, data = {}) {
        this.stats.events.push({
            time: (Date.now() - this.stats.startTime) / 1000, // seconds
            type,
            playerId,
            data
        });
    }

    update(dt, gameInstance) {
        this.elapsedTime += dt;
        this.globalSpawnTimer.update(dt);

        // Apply time-based escalation to spawn intervals
        const timeBonus = Math.min(this.elapsedTime / 120, 1.0); // Max bonus at 2 minutes

        // CLIENT EXTRAPOLATION: If we are a client in multiplayer, we don't run the backend simulation.
        // We just extrapolate positions for smooth 60fps rendering between server syncs.
        if (this.isClient) {
            this.nodes.forEach(node => {
                if (node.hitFlash > 0) node.hitFlash -= dt;
                if (node.spawnEffect > 0) node.spawnEffect -= dt;
            });

            this.entities.forEach(ent => {
                if (ent.dead) return;

                if (ent.dying) {
                    ent.deathTime += dt;
                    if (ent.deathTime > 0.4) ent.dead = true;
                    return;
                }

                // Visual extrapolation purely based on velocity
                ent.x += ent.vx * dt;
                ent.y += ent.vy * dt;
            });

            // Clean up dead entities
            this.entities = this.entities.filter(ent => !ent.dead);

            return; // Skip full simulation logic
        }

        // Populate spatial grid for nodes once (nodes don't move)
        this.spatialGridNodes.clear();
        this.nodes.forEach(node => {
            this.spatialGridNodes.addObject(node);
        });

        // Populate spatial grid once per frame
        this.spatialGrid.clear();
        this.entities.forEach(ent => {
            this.spatialGrid.addObject(ent);
        });

        // --- OPTIMIZACIÓN CPU: THROTTLING DE FLOCKS ---
        // Detectar grupos (flocks) es costoso y no necesita ser frame-perfect.
        // Lo corremos 1 vez cada 15 frames (~4 veces por segundo).
        this.flockUpdateCounter++;
        if (this.flockUpdateCounter >= 15) {
            this._detectFlocks();
            this.flockUpdateCounter = 0;
        }

        // Count units and production rates per player
        this.unitCounts = {};
        this.productionRates = {};
        this.entities.forEach(ent => {
            if (!ent.dead) {
                this.unitCounts[ent.owner] = (this.unitCounts[ent.owner] || 0) + 1;
            }
        });

        this.nodes.forEach(node => {
            // Check cap before spawning
            const canSpawn = (this.unitCounts[node.owner] || 0) < this.maxEntitiesPerPlayer;

            const newEntity = node.update(dt, this.spatialGrid, this.globalSpawnTimer, gameInstance, this.nodes, canSpawn);
            if (newEntity) {
                this.entities.push(newEntity);
                // Track production
                const pid = newEntity.owner;
                this.stats.unitsProduced[pid] = (this.stats.unitsProduced[pid] || 0) + 1;
                this.unitCounts[pid] = (this.unitCounts[pid] || 0) + 1;

                // Add new entity to grid immediately so it interacts
                this.spatialGrid.addObject(newEntity);
            }

            // Track captures
            if (node.justCapturedBy !== undefined) {
                const pid = node.justCapturedBy;
                this.stats.capturedNodes[pid] = (this.stats.capturedNodes[pid] || 0) + 1;
                node.justCapturedBy = undefined;
            }

            // Aggregate production rates
            if (node.owner !== -1) {
                this.productionRates[node.owner] = (this.productionRates[node.owner] || 0) + (node.currentProductionRate || 0);
            }
        });

        const currentUnits = {};
        this.entities.forEach(ent => {
            if (!ent.dead && !ent.dying) {
                currentUnits[ent.owner] = (currentUnits[ent.owner] || 0) + 1;
            }
        });

        // Track unit losses
        this.entities.forEach(ent => {
            if (ent.dead && !ent.lossTracked) {
                ent.lossTracked = true;
                const pid = ent.owner;
                this.stats.unitsLost[pid] = (this.stats.unitsLost[pid] || 0) + 1;
            }
        });

        // Update current counts
        this.stats.unitsCurrent = currentUnits;

        // Record history every second
        const now = Date.now();
        if (now - (this.stats.lastRecord || 0) > 1000) {
            this.stats.lastRecord = now;

            // Count current nodes owned
            const nodesOwned = {};
            this.nodes.forEach(n => {
                if (n.owner !== -1) {
                    nodesOwned[n.owner] = (nodesOwned[n.owner] || 0) + 1;
                }
            });

            const elapsed = (now - this.stats.startTime) / 1000;

            for (let pid in currentUnits) {
                this.stats.history.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    count: currentUnits[pid]
                });
            }

            // Record node history
            for (let pid in nodesOwned) {
                if (!this.stats.nodeHistory) this.stats.nodeHistory = [];
                this.stats.nodeHistory.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    count: nodesOwned[pid]
                });
            }
        }

        // Record production rate every 5 seconds (more granular for graph)
        if (now - (this.stats.lastProductionRecord || 0) > 5000) {
            this.stats.lastProductionRecord = now;
            const elapsed = (now - this.stats.startTime) / 60000;
            for (let pid in this.stats.unitsProduced) {
                // Use current production rate from nodes logic (units/sec -> units/min)
                const currentRate = this.productionRates[pid] || 0;
                const ratePerMin = Math.round(currentRate * 60);

                this.stats.productionHistory.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    rate: ratePerMin,
                    total: this.stats.unitsProduced[pid] || 0
                });
            }
        }

        this.entities.forEach(ent => {
            ent.update(dt, this.spatialGrid, this.spatialGridNodes, this.nodes, null, gameInstance);
        });

        // Clean up dead entities
        this.entities = this.entities.filter(ent => !ent.dead);
    }

    getStats() {
        const elapsed = (Date.now() - this.stats.startTime) / 60000; // minutes
        const result = {
            elapsed: elapsed,
            produced: {},
            lost: {},
            current: {},
            captured: {},
            history: this.stats.history,
            nodeHistory: this.stats.nodeHistory || [],
            productionHistory: this.stats.productionHistory,
            events: this.stats.events || []
        };

        for (let pid in this.stats.unitsProduced) {
            result.produced[pid] = {
                total: this.stats.unitsProduced[pid],
                perMinute: elapsed > 0 ? Math.round(this.stats.unitsProduced[pid] / elapsed) : 0
            };
        }

        for (let pid in this.stats.unitsLost) {
            result.lost[pid] = {
                total: this.stats.unitsLost[pid],
                perMinute: elapsed > 0 ? Math.round(this.stats.unitsLost[pid] / elapsed) : 0
            };
        }

        for (let pid in this.stats.unitsCurrent) {
            result.current[pid] = this.stats.unitsCurrent[pid];
        }

        for (let pid in this.stats.capturedNodes) {
            result.captured[pid] = this.stats.capturedNodes[pid];
        }

        return result;
    }

    getState() {
        return {
            nodes: this.nodes.map(n => ({
                id: n.id, x: n.x, y: n.y, owner: n.owner, type: n.type,
                radius: n.radius, influenceRadius: n.influenceRadius,
                baseHp: n.baseHp, maxHp: n.maxHp, stock: n.stock,
                maxStock: n.maxStock, spawnProgress: n.spawnProgress || 0,
                rallyPoint: n.rallyPoint,
                hitFlash: n.hitFlash || 0,
                spawnEffect: n.spawnEffect || 0,
                enemyPressure: n.enemyPressure || false
            })),
            entities: this.entities.map(e => ({
                id: e.id, x: e.x, y: e.y, owner: e.owner, radius: e.radius,
                vx: e.vx, vy: e.vy,
                dying: e.dying, deathType: e.deathType, deathTime: e.deathTime,
                outsideWarning: e.outsideWarning || false
            })),
            playerCount: this.playerCount,
            elapsedTime: this.elapsedTime,
            speedMultiplier: this.speedMultiplier,
            accelerationEnabled: this.accelerationEnabled,
            showProduction: this.showProduction,
            stats: this.getStats(),
            productionRates: this.productionRates
        };
    }

    /**
     * Detect flocks - for medium groups to create intimidating balls
     */
    _detectFlocks() {
        const FLOCK_RADIUS = 45; // Medium radius for ball formation
        const MIN_FLOCK_SIZE = 12; // Minimum units
        const MAX_FLOCK_SIZE = 25; // Max units per flock - creates big intimidating balls

        // Reset flock assignments
        for (const ent of this.entities) {
            if (!ent.dead && !ent.dying) {
                ent.flockId = null;
                ent.isFlockLeader = false;
            }
        }

        // Group entities by owner and mark unassigned units
        const byOwner = {};
        for (const ent of this.entities) {
            if (ent.dead || ent.dying) continue;
            if (!byOwner[ent.owner]) byOwner[ent.owner] = [];
            byOwner[ent.owner].push(ent);
        }

        // For each owner, find flocks using spatial grid
        for (const ownerId in byOwner) {
            const ownerEnts = byOwner[ownerId];
            let flockCounter = 0;

            for (const ent of ownerEnts) {
                // Skip if already assigned to a flock
                if (ent.flockId) continue;

                // Find all units in this potential flock using spatial grid
                const nearby = this.spatialGrid.retrieve(ent.x, ent.y, FLOCK_RADIUS);
                const flock = [];

                for (const other of nearby) {
                    if (other.owner !== parseInt(ownerId)) continue;
                    if (other.flockId) continue;
                    if (other.dead || other.dying) continue;

                    // Check actual distance
                    const dx = other.x - ent.x;
                    const dy = other.y - ent.y;
                    if (dx * dx + dy * dy <= FLOCK_RADIUS * FLOCK_RADIUS) {
                        flock.push(other);
                        if (flock.length >= MAX_FLOCK_SIZE) break;
                    }
                }

                // If we have enough units, assign flock ID
                if (flock.length >= MIN_FLOCK_SIZE) {
                    const flockId = `flock_${ownerId}_${flockCounter++}`;
                    for (let i = 0; i < flock.length; i++) {
                        flock[i].flockId = flockId;
                        flock[i].isFlockLeader = (i === 0);
                    }
                }
            }
        }
    }
}
