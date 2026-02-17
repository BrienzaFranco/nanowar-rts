import { GlobalSpawnTimer } from './GlobalSpawnTimer.js';
import { GAME_SETTINGS } from './GameConfig.js';

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
        
        // Statistics tracking
        this.stats = {
            startTime: Date.now(),
            unitsProduced: {}, // playerId -> count
            unitsLost: {}, // playerId -> count
            unitsCurrent: {}, // playerId -> current count
            history: [], // { time, playerId, count }
            productionHistory: [] // { time, playerId, rate, total }
        };
    }

    update(dt, gameInstance) {
        this.elapsedTime += dt;
        this.globalSpawnTimer.update(dt);

        // Apply time-based escalation to spawn intervals
        const timeBonus = Math.min(this.elapsedTime / 120, 1.0); // Max bonus at 2 minutes

        this.nodes.forEach(node => {
            const newEntity = node.update(dt, this.entities, this.globalSpawnTimer, gameInstance, this.nodes);
            if (newEntity) {
                this.entities.push(newEntity);
                // Track production
                const pid = newEntity.owner;
                this.stats.unitsProduced[pid] = (this.stats.unitsProduced[pid] || 0) + 1;
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
            for (let pid in currentUnits) {
                this.stats.history.push({
                    time: (now - this.stats.startTime) / 1000,
                    playerId: parseInt(pid),
                    count: currentUnits[pid]
                });
            }
        }
        
        // Record production rate every 15 seconds
        if (now - (this.stats.lastProductionRecord || 0) > 15000) {
            this.stats.lastProductionRecord = now;
            const elapsed = (now - this.stats.startTime) / 60000;
            for (let pid in this.stats.unitsProduced) {
                const produced = this.stats.unitsProduced[pid] || 0;
                const rate = elapsed > 0 ? Math.round(produced / elapsed) : 0;
                this.stats.productionHistory.push({
                    time: elapsed,
                    playerId: parseInt(pid),
                    rate: rate,
                    total: produced
                });
            }
        }

        this.entities.forEach(ent => {
            ent.update(dt, this.entities, this.nodes, null, gameInstance);
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
            history: this.stats.history,
            productionHistory: this.stats.productionHistory
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
                captureBoost: n.captureBoost || 0,
                captureAura: n.captureAura || 0,
                auraOwner: n.auraOwner || -1,
                nearbyAuraBoost: n.nearbyAuraBoost || false,
                enemyPressure: n.enemyPressure || false
            })),
            entities: this.entities.map(e => ({
                id: e.id, x: e.x, y: e.y, owner: e.owner, radius: e.radius,
                vx: e.vx, vy: e.vy,
                dying: e.dying, deathType: e.deathType, deathTime: e.deathTime
            })),
            playerCount: this.playerCount,
            elapsedTime: this.elapsedTime,
            speedMultiplier: this.speedMultiplier,
            accelerationEnabled: this.accelerationEnabled,
            showProduction: this.showProduction,
            stats: this.getStats()
        };
    }
}
