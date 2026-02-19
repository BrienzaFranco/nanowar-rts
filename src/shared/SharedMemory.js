export const MEMORY_LAYOUT = {
    MAX_ENTITIES: 15000,
    MAX_NODES: 64,
    MAX_DEATH_EVENTS: 256,
    MAX_SPAWN_EVENTS: 64,
};

const HEADER_SIZE = 256;

const ENTITY_FIELDS = {
    x: 4, y: 4, vx: 4, vy: 4,
    owner: 4, radius: 4, maxSpeed: 4, friction: 4,
    hp: 4, speedBoost: 4,
    flags: 4, deathTime: 4, deathType: 4,
    targetX: 4, targetY: 4, targetNodeId: 4,
    flockId: 4, outsideTime: 4,
};

let entityOffset = 0;
const ENTITY_OFFSET_X = entityOffset; entityOffset += ENTITY_FIELDS.x;
const ENTITY_OFFSET_Y = entityOffset; entityOffset += ENTITY_FIELDS.y;
const ENTITY_OFFSET_VX = entityOffset; entityOffset += ENTITY_FIELDS.vx;
const ENTITY_OFFSET_VY = entityOffset; entityOffset += ENTITY_FIELDS.vy;
const ENTITY_OFFSET_OWNER = entityOffset; entityOffset += ENTITY_FIELDS.owner;
const ENTITY_OFFSET_RADIUS = entityOffset; entityOffset += ENTITY_FIELDS.radius;
const ENTITY_OFFSET_MAXSPEED = entityOffset; entityOffset += ENTITY_FIELDS.maxSpeed;
const ENTITY_OFFSET_FRICTION = entityOffset; entityOffset += ENTITY_FIELDS.friction;
const ENTITY_OFFSET_HP = entityOffset; entityOffset += ENTITY_FIELDS.hp;
const ENTITY_OFFSET_SPEEDBOOST = entityOffset; entityOffset += ENTITY_FIELDS.speedBoost;
const ENTITY_OFFSET_FLAGS = entityOffset; entityOffset += ENTITY_FIELDS.flags;
const ENTITY_OFFSET_DEATHTIME = entityOffset; entityOffset += ENTITY_FIELDS.deathTime;
const ENTITY_OFFSET_DEATHTYPE = entityOffset; entityOffset += ENTITY_FIELDS.deathType;
const ENTITY_OFFSET_TARGETX = entityOffset; entityOffset += ENTITY_FIELDS.targetX;
const ENTITY_OFFSET_TARGETY = entityOffset; entityOffset += ENTITY_FIELDS.targetY;
const ENTITY_OFFSET_TARGETNODEID = entityOffset; entityOffset += ENTITY_FIELDS.targetNodeId;
const ENTITY_OFFSET_FLOCKID = entityOffset; entityOffset += ENTITY_FIELDS.flockId;
const ENTITY_OFFSET_OUTSIDETIME = entityOffset; entityOffset += ENTITY_FIELDS.outsideTime;

const ENTITY_STRIDE = entityOffset;

const NODE_FIELDS = {
    x: 4, y: 4, owner: 4, baseHp: 4, maxHp: 4,
    radius: 4, influenceRadius: 4, spawnTimer: 4, spawnProgress: 4,
    hitFlash: 4, stock: 4, nodeFlags: 4, type: 4, spawnEffect: 4, manualSpawnReady: 4,
};

let nodeOffset = 0;
const NODE_OFFSET_X = nodeOffset; nodeOffset += NODE_FIELDS.x;
const NODE_OFFSET_Y = nodeOffset; nodeOffset += NODE_FIELDS.y;
const NODE_OFFSET_OWNER = nodeOffset; nodeOffset += NODE_FIELDS.owner;
const NODE_OFFSET_BASEHP = nodeOffset; nodeOffset += NODE_FIELDS.baseHp;
const NODE_OFFSET_MAXHP = nodeOffset; nodeOffset += NODE_FIELDS.maxHp;
const NODE_OFFSET_RADIUS = nodeOffset; nodeOffset += NODE_FIELDS.radius;
const NODE_OFFSET_INFLUENCERADIUS = nodeOffset; nodeOffset += NODE_FIELDS.influenceRadius;
const NODE_OFFSET_SPAWNTIMER = nodeOffset; nodeOffset += NODE_FIELDS.spawnTimer;
const NODE_OFFSET_SPAWNPROGRESS = nodeOffset; nodeOffset += NODE_FIELDS.spawnProgress;
const NODE_OFFSET_HITFLASH = nodeOffset; nodeOffset += NODE_FIELDS.hitFlash;
const NODE_OFFSET_STOCK = nodeOffset; nodeOffset += NODE_FIELDS.stock;
const NODE_OFFSET_NODEFLAGS = nodeOffset; nodeOffset += NODE_FIELDS.nodeFlags;
const NODE_OFFSET_TYPE = nodeOffset; nodeOffset += NODE_FIELDS.type;
const NODE_OFFSET_SPAWNEFFECT = nodeOffset; nodeOffset += NODE_FIELDS.spawnEffect;
const NODE_OFFSET_MANUALSPAWNREADY = nodeOffset; nodeOffset += NODE_FIELDS.manualSpawnReady;

const NODE_STRIDE = nodeOffset;

const DEATH_EVENT_FIELDS = { x: 4, y: 4, owner: 4, type: 4, entityIndex: 4 };
let deathOffset = 0;
const DEATH_OFFSET_X = deathOffset; deathOffset += DEATH_EVENT_FIELDS.x;
const DEATH_OFFSET_Y = deathOffset; deathOffset += DEATH_EVENT_FIELDS.y;
const DEATH_OFFSET_OWNER = deathOffset; deathOffset += DEATH_EVENT_FIELDS.owner;
const DEATH_OFFSET_TYPE = deathOffset; deathOffset += DEATH_EVENT_FIELDS.type;
const DEATH_OFFSET_ENTITYINDEX = deathOffset; deathOffset += DEATH_EVENT_FIELDS.entityIndex;
const DEATH_EVENT_STRIDE = deathOffset;

const SPAWN_EVENT_FIELDS = { x: 4, y: 4, owner: 4, targetX: 4, targetY: 4, targetNodeId: 4 };
let spawnOffset = 0;
const SPAWN_OFFSET_X = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.x;
const SPAWN_OFFSET_Y = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.y;
const SPAWN_OFFSET_OWNER = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.owner;
const SPAWN_OFFSET_TARGETX = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.targetX;
const SPAWN_OFFSET_TARGETY = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.targetY;
const SPAWN_OFFSET_TARGETNODEID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELDS.targetNodeId;
const SPAWN_EVENT_STRIDE = spawnOffset;

const NODES_OFFSET = HEADER_SIZE + MEMORY_LAYOUT.MAX_ENTITIES * ENTITY_STRIDE;
const DEATH_EVENTS_OFFSET = NODES_OFFSET + MEMORY_LAYOUT.MAX_NODES * NODE_STRIDE;
const SPAWN_EVENTS_OFFSET = DEATH_EVENTS_OFFSET + MEMORY_LAYOUT.MAX_DEATH_EVENTS * DEATH_EVENT_STRIDE;

export function calculateBufferSize() {
    return SPAWN_EVENTS_OFFSET + MEMORY_LAYOUT.MAX_SPAWN_EVENTS * SPAWN_EVENT_STRIDE;
}

export class SharedMemory {
    constructor(buffer) {
        this.buffer = buffer;
        
        this.header = {
            entityCount: new Uint32Array(buffer, 0, 1),
            nodeCount: new Uint32Array(buffer, 4, 1),
            maxEntities: new Uint32Array(buffer, 8, 1),
            maxNodes: new Uint32Array(buffer, 12, 1),
            flags: new Uint8Array(buffer, 16, 1),
            deathEventsCount: new Uint32Array(buffer, 20, 1),
            spawnEventsCount: new Uint32Array(buffer, 24, 1),
            frameCounter: new Uint32Array(buffer, 28, 1),
        };
        
        this.header.maxEntities[0] = MEMORY_LAYOUT.MAX_ENTITIES;
        this.header.maxNodes[0] = MEMORY_LAYOUT.MAX_NODES;
        
        this.entities = {
            x: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_X, MEMORY_LAYOUT.MAX_ENTITIES),
            y: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_Y, MEMORY_LAYOUT.MAX_ENTITIES),
            vx: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VX, MEMORY_LAYOUT.MAX_ENTITIES),
            vy: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_VY, MEMORY_LAYOUT.MAX_ENTITIES),
            owner: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OWNER, MEMORY_LAYOUT.MAX_ENTITIES),
            radius: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_ENTITIES),
            maxSpeed: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_MAXSPEED, MEMORY_LAYOUT.MAX_ENTITIES),
            friction: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FRICTION, MEMORY_LAYOUT.MAX_ENTITIES),
            hp: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_HP, MEMORY_LAYOUT.MAX_ENTITIES),
            speedBoost: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_SPEEDBOOST, MEMORY_LAYOUT.MAX_ENTITIES),
            flags: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLAGS, MEMORY_LAYOUT.MAX_ENTITIES),
            deathTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTIME, MEMORY_LAYOUT.MAX_ENTITIES),
            deathType: new Uint32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_DEATHTYPE, MEMORY_LAYOUT.MAX_ENTITIES),
            targetX: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_ENTITIES),
            targetY: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_ENTITIES),
            targetNodeId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_ENTITIES),
            flockId: new Int32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_FLOCKID, MEMORY_LAYOUT.MAX_ENTITIES),
            outsideTime: new Float32Array(buffer, HEADER_SIZE + ENTITY_OFFSET_OUTSIDETIME, MEMORY_LAYOUT.MAX_ENTITIES),
        };
        
        this.nodes = {
            x: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_X, MEMORY_LAYOUT.MAX_NODES),
            y: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_Y, MEMORY_LAYOUT.MAX_NODES),
            owner: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_OWNER, MEMORY_LAYOUT.MAX_NODES),
            baseHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_BASEHP, MEMORY_LAYOUT.MAX_NODES),
            maxHp: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_MAXHP, MEMORY_LAYOUT.MAX_NODES),
            radius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RADIUS, MEMORY_LAYOUT.MAX_NODES),
            influenceRadius: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_INFLUENCERADIUS, MEMORY_LAYOUT.MAX_NODES),
            spawnTimer: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNTIMER, MEMORY_LAYOUT.MAX_NODES),
            spawnProgress: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNPROGRESS, MEMORY_LAYOUT.MAX_NODES),
            hitFlash: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_HITFLASH, MEMORY_LAYOUT.MAX_NODES),
            stock: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_STOCK, MEMORY_LAYOUT.MAX_NODES),
            nodeFlags: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_NODEFLAGS, MEMORY_LAYOUT.MAX_NODES),
            type: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_TYPE, MEMORY_LAYOUT.MAX_NODES),
            spawnEffect: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_SPAWNEFFECT, MEMORY_LAYOUT.MAX_NODES),
            manualSpawnReady: new Uint32Array(buffer, NODES_OFFSET + NODE_OFFSET_MANUALSPAWNREADY, MEMORY_LAYOUT.MAX_NODES),
        };
        
        this.deathEvents = {
            x: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_X, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            y: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_Y, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            owner: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_OWNER, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            type: new Uint32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TYPE, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            entityIndex: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_ENTITYINDEX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
        };
        
        this.spawnEvents = {
            x: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_X, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            y: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_Y, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            owner: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_OWNER, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetX: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetY: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetNodeId: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
        };
    }
    
    static create() {
        const size = calculateBufferSize();
        const buffer = new SharedArrayBuffer(size);
        return new SharedMemory(buffer);
    }
    
    clearDeathEvents() {
        this.header.deathEventsCount[0] = 0;
    }
    
    addDeathEvent(x, y, owner, type, entityIndex) {
        const idx = this.header.deathEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_DEATH_EVENTS) return;
        
        this.deathEvents.x[idx] = x;
        this.deathEvents.y[idx] = y;
        this.deathEvents.owner[idx] = owner;
        this.deathEvents.type[idx] = type;
        this.deathEvents.entityIndex[idx] = entityIndex;
        
        this.header.deathEventsCount[0] = idx + 1;
    }
    
    clearSpawnEvents() {
        this.header.spawnEventsCount[0] = 0;
    }
    
    addSpawnEvent(x, y, owner, targetX, targetY, targetNodeId) {
        const idx = this.header.spawnEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_SPAWN_EVENTS) return;
        
        this.spawnEvents.x[idx] = x;
        this.spawnEvents.y[idx] = y;
        this.spawnEvents.owner[idx] = owner;
        this.spawnEvents.targetX[idx] = targetX;
        this.spawnEvents.targetY[idx] = targetY;
        this.spawnEvents.targetNodeId[idx] = targetNodeId;
        
        this.header.spawnEventsCount[0] = idx + 1;
    }
    
    setEntityCount(count) {
        this.header.entityCount[0] = count;
    }
    
    setNodeCount(count) {
        this.header.nodeCount[0] = count;
    }
    
    getEntityCount() {
        return this.header.entityCount[0];
    }
    
    getNodeCount() {
        return this.header.nodeCount[0];
    }
    
    incrementFrameCounter() {
        this.header.frameCounter[0]++;
    }
    
    getFrameCounter() {
        return this.header.frameCounter[0];
    }
    
    isDead(entityIndex) {
        return (this.entities.flags[entityIndex] & 1) !== 0;
    }
    
    setDead(entityIndex, dead) {
        if (dead) {
            this.entities.flags[entityIndex] |= 1;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFE;
        }
    }
    
    isDying(entityIndex) {
        return (this.entities.flags[entityIndex] & 2) !== 0;
    }
    
    setDying(entityIndex, dying) {
        if (dying) {
            this.entities.flags[entityIndex] |= 2;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFD;
        }
    }
    
    isSelected(entityIndex) {
        return (this.entities.flags[entityIndex] & 4) !== 0;
    }
    
    setSelected(entityIndex, selected) {
        if (selected) {
            this.entities.flags[entityIndex] |= 4;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFFB;
        }
    }
    
    hasOutsideWarning(entityIndex) {
        return (this.entities.flags[entityIndex] & 8) !== 0;
    }
    
    setOutsideWarning(entityIndex, warning) {
        if (warning) {
            this.entities.flags[entityIndex] |= 8;
        } else {
            this.entities.flags[entityIndex] &= 0xFFFFFFF7;
        }
    }
    
    isNodeManualSpawnReady(nodeIndex) {
        return (this.nodes.nodeFlags[nodeIndex] & 1) !== 0;
    }
    
    setNodeManualSpawnReady(nodeIndex, ready) {
        if (ready) {
            this.nodes.nodeFlags[nodeIndex] |= 1;
        } else {
            this.nodes.nodeFlags[nodeIndex] &= 0xFFFFFFFE;
        }
    }
}
