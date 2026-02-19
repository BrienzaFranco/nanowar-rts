import { SharedMemory, MEMORY_LAYOUT } from './SharedMemory.js';

export const NODE_TYPES = {
    SMALL: 0,
    MEDIUM: 1,
    LARGE: 2,
};

export class NodeData {
    constructor(sharedMemory) {
        this.memory = sharedMemory;
        this.nodes = sharedMemory.nodes;
        this.count = 0;
        
        this.typeConfig = {
            [NODE_TYPES.SMALL]: {
                radius: 22,
                influenceRadius: 88,
                maxHp: 40,
                spawnInterval: 4.5,
            },
            [NODE_TYPES.MEDIUM]: {
                radius: 39,
                influenceRadius: 136,
                maxHp: 80,
                spawnInterval: 3.5,
            },
            [NODE_TYPES.LARGE]: {
                radius: 62,
                influenceRadius: 186,
                maxHp: 150,
                spawnInterval: 2.4,
            },
        };
    }
    
    allocate(x, y, owner, type, id) {
        const idx = this.count;
        if (idx >= MEMORY_LAYOUT.MAX_NODES) {
            console.warn('Max nodes reached');
            return -1;
        }
        
        const config = this.typeConfig[type];
        
        this.nodes.x[idx] = x;
        this.nodes.y[idx] = y;
        this.nodes.owner[idx] = owner;
        this.nodes.baseHp[idx] = owner === -1 ? config.maxHp * 0.1 : config.maxHp * 0.25;
        this.nodes.maxHp[idx] = config.maxHp;
        this.nodes.radius[idx] = config.radius;
        this.nodes.influenceRadius[idx] = config.influenceRadius;
        this.nodes.spawnTimer[idx] = 0;
        this.nodes.spawnProgress[idx] = 0;
        this.nodes.hitFlash[idx] = 0;
        this.nodes.stock[idx] = 0;
        this.nodes.nodeFlags[idx] = 0;
        this.nodes.type[idx] = type;
        this.nodes.spawnEffect[idx] = 0;
        this.nodes.manualSpawnReady[idx] = 0;
        this.nodes.id[idx] = id || idx;
        
        this.count++;
        this.memory.setNodeCount(this.count);
        
        return idx;
    }
    
    getCount() {
        return this.count;
    }
    
    getX(index) {
        return this.nodes.x[index];
    }
    
    setX(index, value) {
        this.nodes.x[index] = value;
    }
    
    getY(index) {
        return this.nodes.y[index];
    }
    
    setY(index, value) {
        this.nodes.y[index] = value;
    }
    
    getOwner(index) {
        return this.nodes.owner[index];
    }
    
    setOwner(index, value) {
        this.nodes.owner[index] = value;
    }
    
    getBaseHp(index) {
        return this.nodes.baseHp[index];
    }
    
    setBaseHp(index, value) {
        this.nodes.baseHp[index] = value;
    }
    
    getMaxHp(index) {
        return this.nodes.maxHp[index];
    }
    
    setMaxHp(index, value) {
        this.nodes.maxHp[index] = value;
    }
    
    getRadius(index) {
        return this.nodes.radius[index];
    }
    
    setRadius(index, value) {
        this.nodes.radius[index] = value;
    }
    
    getInfluenceRadius(index) {
        return this.nodes.influenceRadius[index];
    }
    
    setInfluenceRadius(index, value) {
        this.nodes.influenceRadius[index] = value;
    }
    
    getSpawnTimer(index) {
        return this.nodes.spawnTimer[index];
    }
    
    setSpawnTimer(index, value) {
        this.nodes.spawnTimer[index] = value;
    }
    
    getSpawnProgress(index) {
        return this.nodes.spawnProgress[index];
    }
    
    setSpawnProgress(index, value) {
        this.nodes.spawnProgress[index] = value;
    }
    
    getHitFlash(index) {
        return this.nodes.hitFlash[index];
    }
    
    setHitFlash(index, value) {
        this.nodes.hitFlash[index] = value;
    }
    
    getStock(index) {
        return this.nodes.stock[index];
    }
    
    setStock(index, value) {
        this.nodes.stock[index] = value;
    }
    
    getType(index) {
        return this.nodes.type[index];
    }
    
    getSpawnEffect(index) {
        return this.nodes.spawnEffect[index];
    }
    
    setSpawnEffect(index, value) {
        this.nodes.spawnEffect[index] = value;
    }
    
    isManualSpawnReady(index) {
        return this.memory.isNodeManualSpawnReady(index);
    }
    
    setManualSpawnReady(index, value) {
        this.memory.setNodeManualSpawnReady(index, value);
    }
    
    isValidIndex(index) {
        return index >= 0 && index < this.count;
    }
    
    getSpawnInterval(index) {
        const type = this.nodes.type[index];
        return this.typeConfig[type]?.spawnInterval || 3.5;
    }
    
    getTotalHp(index) {
        return Math.min(this.nodes.maxHp[index], this.nodes.baseHp[index]);
    }
    
    getId(index) {
        return this.nodes.id[index];
    }
    
    setId(index, value) {
        this.nodes.id[index] = value;
    }
}
