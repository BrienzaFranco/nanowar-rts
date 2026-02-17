import { PLAYER_COLORS } from './GameConfig.js';
import { Entity } from './Entity.js'; // Circular dependency if Entity imports Node? Node doesn't import Entity class, but uses it in JSDoc maybe.
// Actually Node creates new Entity in update(). So it needs to import Entity.

export class Node {
    constructor(id, x, y, ownerId, type = 'medium') {
        this.id = id; this.x = x; this.y = y; this.owner = ownerId; this.type = type;

        if (type === 'small') {
            this.radius = 20 + Math.random() * 5;
            this.influenceRadius = this.radius * 4;
            this.maxHp = 50;
            this.spawnInterval = 4.0;
        }
        else if (type === 'large') {
            this.radius = 55 + Math.random() * 15;
            this.influenceRadius = this.radius * 3;
            this.maxHp = 200;
            this.spawnInterval = 2.0;
        }
        else {
            this.radius = 35 + Math.random() * 8;
            this.influenceRadius = this.radius * 3.5;
            this.maxHp = 100;
            this.spawnInterval = 3.0;
        }

        // Neutral nodes start at 10% health
        this.baseHp = (this.owner === -1) ? (this.maxHp * 0.1) : (this.maxHp * 0.33);
        this.stock = 0;

        this.spawnEffect = 0;
        this.spawnTimer = 0;
        this.spawnProgress = 0;
        this.defendersInside = 0; this.defenderCounts = {}; this.hitFlash = 0; this.selected = false; this.hasSpawnedThisCycle = false; this.rallyPoint = null;
        this.areaDefenders = []; this.allAreaDefenders = [];
    }

    getColor() { return this.owner === -1 ? '#757575' : PLAYER_COLORS[this.owner % PLAYER_COLORS.length]; }

    setRallyPoint(x, y, targetNode = null) {
        this.rallyPoint = { x, y };
        this.rallyTargetNode = targetNode;
    }

    calculateDefenders(entities) {
        this.defendersInside = 0;
        this.stockDefenders = 0;
        this.defenderCounts = {};
        this.defendingEntities = [];
        this.allAreaDefenders = [];
        for (let e of entities) {
            if (e.dead || e.dying) continue;
            const dx = e.x - this.x, dy = e.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist <= this.influenceRadius) {
                this.defenderCounts[e.owner] = (this.defenderCounts[e.owner] || 0) + 1;
                this.allAreaDefenders.push(e);
                if (e.owner === this.owner) {
                    this.areaDefenders.push(e);
                }
            }
            if (dist <= this.radius + e.radius + 5) {
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
            if (game) game.spawnParticles(this.x, this.y, PLAYER_COLORS[attackerId % PLAYER_COLORS.length], 20, 'explosion');
            return true;
        }
        return false;
    }

    update(dt, entities, globalSpawnTimer, game) {
        this.calculateDefenders(entities);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.spawnEffect > 0) this.spawnEffect -= dt;

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
            
            // Base generation: 0.5 at 0% HP, up to 1.5 at 100% HP (3x faster)
            let healthScaling = 0.5 + healthPercent * 1.0;
            
            // Extra bonus at full health (0.5 extra = up to 2x total)
            if (isFull) {
                healthScaling += 0.5;
            }
            
            // Cluster bonus: more defenders = more production
            const defenderCount = this.areaDefenders ? this.areaDefenders.length : 0;
            const clusterBonus = Math.min(defenderCount * 0.1, 0.5); // Up to 0.5 extra with 5+ defenders
            healthScaling += clusterBonus;
            
            const spawnThreshold = this.spawnInterval / healthScaling;

            // Always spawn when ready - full nodes spawn faster (20% bonus)
            if (this.spawnTimer >= spawnThreshold && this.baseHp > (this.maxHp * 0.1)) {
                this.spawnTimer = 0;

                // Spawn at middle of influence radius (not too close to edge, not too close to center)
                const angle = Math.random() * Math.PI * 2;
                const spawnDist = this.influenceRadius * 0.6; // 60% from center
                const ex = this.x + Math.cos(angle) * spawnDist, ey = this.y + Math.sin(angle) * spawnDist;
                const entity = new Entity(ex, ey, this.owner, Date.now() + Math.random());
                
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
