import { SharedMemory, MEMORY_LAYOUT } from './SharedMemory.js';

export class SharedView {
    constructor(buffer) {
        this.buffer = buffer;
        this.memory = new SharedMemory(buffer);
    }

    getEntityCount() {
        return this.memory.getEntityCount();
    }

    getNodeCount() {
        return this.memory.getNodeCount();
    }

    getEntityX(index) {
        return this.memory.entities.x[index];
    }

    getEntityY(index) {
        return this.memory.entities.y[index];
    }

    getEntityVx(index) {
        return this.memory.entities.vx[index];
    }

    getEntityVy(index) {
        return this.memory.entities.vy[index];
    }

    getEntityOwner(index) {
        return this.memory.entities.owner[index];
    }

    getEntityRadius(index) {
        return this.memory.entities.radius[index];
    }

    getEntityMaxSpeed(index) {
        return this.memory.entities.maxSpeed[index];
    }

    getEntityFriction(index) {
        return this.memory.entities.friction[index];
    }

    getEntityHp(index) {
        return this.memory.entities.hp[index];
    }

    getEntitySpeedBoost(index) {
        return this.memory.entities.speedBoost[index];
    }

    getEntityTargetX(index) {
        return this.memory.entities.targetX[index];
    }

    getEntityTargetY(index) {
        return this.memory.entities.targetY[index];
    }

    getEntityTargetNodeId(index) {
        return this.memory.entities.targetNodeId[index];
    }

    getEntityId(index) {
        return this.memory.entities.id[index];
    }

    isEntityDead(index) {
        return this.memory.isDead(index);
    }

    isEntityDying(index) {
        return this.memory.isDying(index);
    }

    isEntitySelected(index) {
        return this.memory.isSelected(index);
    }

    hasEntityOutsideWarning(index) {
        return this.memory.hasOutsideWarning(index);
    }

    getEntityDeathTime(index) {
        return this.memory.entities.deathTime[index];
    }

    getEntityDeathType(index) {
        return this.memory.entities.deathType[index];
    }

    getNodeX(index) {
        return this.memory.nodes.x[index];
    }

    getNodeY(index) {
        return this.memory.nodes.y[index];
    }

    getNodeOwner(index) {
        return this.memory.nodes.owner[index];
    }

    getNodeRadius(index) {
        return this.memory.nodes.radius[index];
    }

    getNodeInfluenceRadius(index) {
        return this.memory.nodes.influenceRadius[index];
    }

    getNodeBaseHp(index) {
        return this.memory.nodes.baseHp[index];
    }

    getNodeMaxHp(index) {
        return this.memory.nodes.maxHp[index];
    }

    getNodeSpawnProgress(index) {
        return this.memory.nodes.spawnProgress[index];
    }

    getNodeHitFlash(index) {
        return this.memory.nodes.hitFlash[index];
    }

    getNodeSpawnEffect(index) {
        return this.memory.nodes.spawnEffect[index];
    }

    getNodeId(index) {
        return this.memory.nodes.id[index];
    }

    getNodeRallyX(index) {
        return this.memory.nodes.rallyX[index];
    }

    getNodeRallyY(index) {
        return this.memory.nodes.rallyY[index];
    }

    getNodeRallyTargetNodeId(index) {
        return this.memory.nodes.rallyTargetNodeId[index];
    }

    getDeathEventsCount() {
        return this.memory.header.deathEventsCount[0];
    }

    getDeathEvent(index) {
        if (index >= this.getDeathEventsCount()) return null;
        return {
            x: this.memory.deathEvents.x[index],
            y: this.memory.deathEvents.y[index],
            owner: this.memory.deathEvents.owner[index],
            type: this.memory.deathEvents.type[index],
            targetX: this.memory.deathEvents.targetX[index],
            targetY: this.memory.deathEvents.targetY[index],
        };
    }

    getSpawnEventsCount() {
        return this.memory.header.spawnEventsCount[0];
    }

    getSpawnEvent(index) {
        if (index >= this.getSpawnEventsCount()) return null;
        return {
            x: this.memory.spawnEvents.x[index],
            y: this.memory.spawnEvents.y[index],
            owner: this.memory.spawnEvents.owner[index],
            targetX: this.memory.spawnEvents.targetX[index],
            targetY: this.memory.spawnEvents.targetY[index],
            targetNodeId: this.memory.spawnEvents.targetNodeId[index],
            id: this.memory.spawnEvents.id[index],
        };
    }

    getFrameCounter() {
        return this.memory.getFrameCounter();
    }

    iterateEntities(callback) {
        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (!this.isEntityDead(i)) {
                callback(i);
            }
        }
    }

    iterateNodes(callback) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            callback(i);
        }
    }

    findNodeByPosition(x, y, radius) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            const nx = this.getNodeX(i);
            const ny = this.getNodeY(i);
            const nr = this.getNodeRadius(i);
            const dx = x - nx;
            const dy = y - ny;
            if (dx * dx + dy * dy < (nr + radius) * (nr + radius)) {
                return i;
            }
        }
        return -1;
    }

    findNodeById(id) {
        const count = this.getNodeCount();
        for (let i = 0; i < count; i++) {
            if (this.getNodeId(i) === id) {
                return i;
            }
        }
        return -1;
    }

    findEntityById(id) {
        const count = this.getEntityCount();
        for (let i = 0; i < count; i++) {
            if (this.getEntityId(i) === id) {
                return i;
            }
        }
        return -1;
    }

    getEntitiesInRect(x1, y1, x2, y2, owner = -1) {
        const result = [];
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== -1 && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);

            if (ex >= minX && ex <= maxX && ey >= minY && ey <= maxY) {
                result.push(i);
            }
        }
        return result;
    }

    getEntitiesInRadius(x, y, radius, owner = -1) {
        const result = [];
        const radiusSq = radius * radius;
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (owner !== -1 && this.getEntityOwner(i) !== owner) continue;

            const ex = this.getEntityX(i);
            const ey = this.getEntityY(i);
            const dx = x - ex;
            const dy = y - ey;

            if (dx * dx + dy * dy <= radiusSq) {
                result.push(i);
            }
        }
        return result;
    }

    getEntitiesByOwner(owner) {
        const result = [];
        const count = this.getEntityCount();

        for (let i = 0; i < count; i++) {
            if (this.isEntityDead(i) || this.isEntityDying(i)) continue;
            if (this.getEntityOwner(i) === owner) {
                result.push(i);
            }
        }
        return result;
    }

    getNodesByOwner(owner) {
        const result = [];
        const count = this.getNodeCount();

        for (let i = 0; i < count; i++) {
            if (this.getNodeOwner(i) === owner) {
                result.push(i);
            }
        }
        return result;
    }

    getEntityTargetNodeId(index) {
        return this.memory.entities.targetNodeId[index];
    }

    getEntityTargetX(index) {
        return this.memory.entities.targetX[index];
    }

    getEntityTargetY(index) {
        return this.memory.entities.targetY[index];
    }
}
