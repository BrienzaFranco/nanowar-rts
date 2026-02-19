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
}
