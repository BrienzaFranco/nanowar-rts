import { SharedMemory, MEMORY_LAYOUT } from './SharedMemory.js';

export const DEATH_TYPES = {
    NONE: 0,
    ATTACK: 1,
    EXPLOSION: 2,
    ABSORBED: 3,
    SACRIFICE: 4,
    OUT_OF_BOUNDS: 5,
};

export class EntityData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.entities = sharedMemory.entities;
        // Sync count from shared header so reconstucting is safe when buffer arrives from server
        this.count = sharedMemory.getEntityCount();
    }

    allocate(x, y, owner, id) {
        const idx = this.count;
        if (idx >= MEMORY_LAYOUT.MAX_ENTITIES) {
            console.warn('Max entities reached');
            return -1;
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

        this.entities.flags[idx] = 0;
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = DEATH_TYPES.NONE;

        this.entities.targetX[idx] = 0;
        this.entities.targetY[idx] = 0;
        this.entities.targetNodeId[idx] = -1;

        this.entities.id[idx] = id || 0;

        this.count++;
        this.memory.setEntityCount(this.count);

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
        return {
            width: 2400,
            height: 1800,
            worldRadius: 1800,
            centerX: 1200,
            centerY: 900,
        };
    }

    // No-op: world bounds are currently hardcoded in getWorldBounds()
    // This is here so GameServer can call setWorldBounds without crashing
    setWorldBounds(centerX, centerY, worldRadius) {
        this._worldBoundsOverride = { centerX, centerY, worldRadius };
    }
}
