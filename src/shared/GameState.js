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
    }

    update(dt, gameInstance) {
        this.globalSpawnTimer.update(dt);

        this.nodes.forEach(node => {
            const newEntity = node.update(dt, this.entities, this.globalSpawnTimer, gameInstance);
            if (newEntity) {
                this.entities.push(newEntity);
            }
        });

        this.entities.forEach(ent => {
            ent.update(dt, this.entities, this.nodes, null, gameInstance); // Camera is null here for server/shared logic
        });

        // Clean up dead entities
        this.entities = this.entities.filter(ent => !ent.dead);
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
                spawnEffect: n.spawnEffect || 0
            })),
            entities: this.entities.map(e => ({
                id: e.id, x: e.x, y: e.y, owner: e.owner, radius: e.radius,
                vx: e.vx, vy: e.vy,
                dying: e.dying, deathType: e.deathType, deathTime: e.deathTime
            })),
            playerCount: this.playerCount
        };
    }
}
