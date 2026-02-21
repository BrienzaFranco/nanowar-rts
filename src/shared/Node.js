import { PLAYER_COLORS, NODE_TYPES, NODE_CONFIG } from './GameConfig.js';
import { Entity } from './Entity.js'; // Circular dependency if Entity imports Node? Node doesn't import Entity class, but uses it in JSDoc maybe.
// Actually Node creates new Entity in update(). So it needs to import Entity.

export class Node {
    constructor(id, x, y, ownerId, type = NODE_TYPES.MEDIUM) {
        this.id = id; this.x = x; this.y = y; this.owner = ownerId; this.type = type;

        const config = NODE_CONFIG[type] || NODE_CONFIG[NODE_TYPES.MEDIUM];

        // Add a small bit of random variation to radius for natural feel
        const variation = (Math.random() - 0.5) * (config.radius * 0.15);
        this.radius = config.radius + variation;
        this.influenceRadius = config.influenceRadius;
        this.maxHp = config.maxHp;
        this.spawnInterval = config.spawnInterval;

        // Neutral nodes start at 10% health (same)
        // Owned nodes (starter) start at 25% health (Was 50%) -> More balanced start
        this.baseHp = (this.owner === -1) ? (this.maxHp * 0.1) : (this.maxHp * 0.25);
        this.stock = 0;

        this.spawnEffect = 0;
        this.spawnTimer = 0;
        this.spawnProgress = 0;
        this.defendersInside = 0; this.defenderCounts = {}; this.hitFlash = 0; this.selected = false; this.hasSpawnedThisCycle = false; this.rallyPoint = null; this.enemyPressure = false;
        this.areaDefenders = []; this.allAreaDefenders = [];
    }

    getColor() { return this.owner === -1 ? '#757575' : PLAYER_COLORS[this.owner % PLAYER_COLORS.length]; }

    setRallyPoint(x, y, targetNode = null) {
        this.rallyPoint = { x, y };
        this.rallyTargetNode = targetNode;

        // Sincronizar con el worker si tenemos el índice y el worker está activo
        if (this.nodeIndex !== undefined && this.sharedNodeData) {
            this.sharedNodeData.setRallyX(this.nodeIndex, x);
            this.sharedNodeData.setRallyY(this.nodeIndex, y);
            this.sharedNodeData.setRallyTargetNodeId(this.nodeIndex, targetNode ? targetNode.id : -1);
        }
    }

    calculateDefenders(spatialGrid) {
        this.defendersInside = 0;
        this.stockDefenders = 0;
        this.defenderCounts = {};
        this.defendingEntities = [];
        this.allAreaDefenders = [];

        // Use spatial grid to find nearby entities
        // Influence radius is the max check distance
        const nearbyEntities = spatialGrid.retrieve(this.x, this.y, this.influenceRadius);

        for (let e of nearbyEntities) {
            if (e.dead || e.dying) continue;

            // Squared distance check is faster
            const dx = e.x - this.x;
            const dy = e.y - this.y;
            const distSq = dx * dx + dy * dy;

            // Area de influencia
            const influenceRadSq = this.influenceRadius * this.influenceRadius;
            if (distSq <= influenceRadSq) {
                this.defenderCounts[e.owner] = (this.defenderCounts[e.owner] || 0) + 1;
                this.allAreaDefenders.push(e);
                if (e.owner === this.owner) {
                    this.areaDefenders.push(e);
                }
            }

            // Dentro del nodo para stock
            // Approximate radius check to avoid sqrt if possible, or just do it
            const stockRad = this.radius + e.radius + 5;
            if (distSq <= stockRad * stockRad) {
                if (e.owner === this.owner) {
                    this.defendersInside++;
                    this.stockDefenders++;
                    this.defendingEntities.push(e);
                }
            }
        }
    }

    getTotalHp() {
        return Math.min(this.maxHp, this.baseHp);
    }

    receiveAttack(attackerId, damage, game) {
        // Don't allow defeated players to capture nodes
        if (game && game.playerSockets) {
            const player = game.playerSockets[attackerId];
            if (player && player.defeated) {
                return false; // Can't capture nodes
            }
        }

        this.hitFlash = 0.3;
        const attackerColor = PLAYER_COLORS[attackerId % PLAYER_COLORS.length];
        if (game) game.spawnParticles(this.x, this.y, attackerColor, 3, 'hit');

        this.baseHp -= damage;
        if (this.baseHp <= 0) {
            this.owner = attackerId;
            // Captured nodes start at 10% health
            this.baseHp = this.maxHp * 0.1;
            this.stock = 0;
            this.hasSpawnedThisCycle = false;
            this.rallyPoint = null;
            this.justCapturedBy = attackerId; // Flag for GameState stats

            if (game && game.state && game.state.recordEvent) {
                game.state.recordEvent('capture', attackerId, { nodeId: this.id, x: this.x, y: this.y });
            }

            if (game) game.spawnParticles(this.x, this.y, PLAYER_COLORS[attackerId % PLAYER_COLORS.length], 20, 'explosion');
            return true;
        }
        return false;
    }

    update(dt, spatialGrid, globalSpawnTimer, game, allNodes, canSpawn = true) {
        this.calculateDefenders(spatialGrid);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.spawnEffect > 0) this.spawnEffect -= dt;

        // Check if enemies outnumber us in area - pause spawning
        this.enemyPressure = false;
        if (this.owner !== -1 && this.areaDefenders) {
            const myDefenders = this.areaDefenders.length;
            let enemyInArea = 0;
            for (let e of this.allAreaDefenders) {
                if (e.owner !== this.owner) enemyInArea++;
            }
            // If enemies outnumber us, pause spawn
            if (enemyInArea > myDefenders) {
                this.enemyPressure = true;
            }
        }

        if (this.owner !== -1) {
            // Heal node slowly if not at max
            const healRate = 0.5;
            if (this.baseHp < this.maxHp) {
                this.baseHp += healRate * dt;
            }

            // Check if node is full (100%+ health = bonus production)
            const isFull = this.baseHp >= this.maxHp;

            this.spawnTimer += dt;
            const healthPercent = Math.min(this.baseHp / this.maxHp, 1.0);

            // Base generation: 0.2 at 0% HP (Was 0.3), up to 1.4 at 100% HP
            // This slows down early game production significantly
            let healthScaling = 0.2 + healthPercent * 1.2;

            // Smoothly ramp bonus production from 90% to 100% HP (prevents visual jumps)
            const fullBonus = Math.max(0, Math.min(0.5, (healthPercent - 0.9) * 5));
            healthScaling += fullBonus;

            // Type bonus: large nodes produce more
            if (this.type === 'large') {
                healthScaling += 0.5; // Large nodes get +50% production (reduced from 100%)
            }

            // Cluster bonus: more defenders = more production
            const defenderCount = this.areaDefenders ? this.areaDefenders.length : 0;
            const clusterBonus = Math.min(defenderCount * 0.1, 0.5); // Up to 0.5 extra with 5+ defenders
            healthScaling += clusterBonus;

            const spawnThreshold = this.spawnInterval / healthScaling;

            // Store current production rate for UI (units per second)
            // If neutral, production is effectively 0 for player stats
            this.currentProductionRate = (this.owner !== -1) ? (1 / spawnThreshold) : 0;
            // Player must click to spawn units
            if (!this.manualSpawnReady && this.spawnTimer >= spawnThreshold && this.baseHp > (this.maxHp * 0.1)) {
                // Auto spawn is disabled - just reset timer and show progress
                this.manualSpawnReady = true;
            }

            // Manual spawn - when player clicks on node
            // Added check for canSpawn to implement entity cap
            if (canSpawn && this.manualSpawnReady && this.spawnTimer >= spawnThreshold && this.baseHp > (this.maxHp * 0.1)) {
                this.spawnTimer = 0;
                this.manualSpawnReady = false;

                // Spawn at middle of influence radius (not too close to edge, not too close to center)
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = this.influenceRadius * 0.6; // 60% from center
                const ex = this.x + Math.cos(angle) * spawnDist, ey = this.y + Math.sin(angle) * spawnDist;
                const entity = new Entity(ex, ey, this.owner);

                // If no rally point, just stay there floating (no target)
                if (!this.rallyPoint) {
                    // No target - will float in place with random movement
                } else {
                    entity.setTarget(this.rallyPoint.x, this.rallyPoint.y, this.rallyTargetNode);
                }

                this.spawnEffect = 0.4;
                if (game) game.spawnParticles(this.x, this.y, this.getColor(), 6, 'explosion');
                return entity;
            }

            // Show progress
            this.spawnProgress = this.spawnTimer / spawnThreshold;
        } else {
            this.spawnTimer = 0;
            this.spawnProgress = 0;
        }
        return null;
    }
    isPointInside(mx, my, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const dx = mx - screen.x;
        const dy = my - screen.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius + 10) * camera.zoom;
    }

    isInsideRect(x1, y1, x2, y2, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY;
    }
}
