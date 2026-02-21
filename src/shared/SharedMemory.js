// These are filled in after the offset calculations below
export const MEMORY_LAYOUT = {
    MAX_ENTITIES: 15000,
    MAX_NODES: 128,
    MAX_DEATH_EVENTS: 256,
    MAX_SPAWN_EVENTS: 64,
    // Filled in at bottom of this file after layout is computed:
    TOTAL_SIZE: 0,
    ENTITY_DATA_START: 0,
    NODE_DATA_START: 0,
    ENTITY_STRIDE: 0,
    NODE_STRIDE: 0,
};

const HEADER_SIZE = 256;

const ENTITY_FIELD_SIZES = {
    x: 4, y: 4, vx: 4, vy: 4,
    owner: 4, radius: 4, maxSpeed: 4, friction: 4,
    hp: 4, speedBoost: 4,
    flags: 4, deathTime: 4, deathType: 4,
    targetX: 4, targetY: 4, targetNodeId: 4,
    flockId: 4, outsideTime: 4,
    id: 8,
};

let entityOffset = 0;
const ENTITY_OFFSET_X = entityOffset; entityOffset += ENTITY_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_Y = entityOffset; entityOffset += ENTITY_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vx * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_VY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.vy * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OWNER = entityOffset; entityOffset += ENTITY_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_RADIUS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_MAXSPEED = entityOffset; entityOffset += ENTITY_FIELD_SIZES.maxSpeed * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FRICTION = entityOffset; entityOffset += ENTITY_FIELD_SIZES.friction * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_HP = entityOffset; entityOffset += ENTITY_FIELD_SIZES.hp * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_SPEEDBOOST = entityOffset; entityOffset += ENTITY_FIELD_SIZES.speedBoost * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLAGS = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flags * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_DEATHTYPE = entityOffset; entityOffset += ENTITY_FIELD_SIZES.deathType * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETX = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETY = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_TARGETNODEID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_FLOCKID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.flockId * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_OUTSIDETIME = entityOffset; entityOffset += ENTITY_FIELD_SIZES.outsideTime * MEMORY_LAYOUT.MAX_ENTITIES;
const ENTITY_OFFSET_ID = entityOffset; entityOffset += ENTITY_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_ENTITIES;

const TOTAL_ENTITY_BYTES = entityOffset;

const NODE_FIELD_SIZES = {
    x: 4, y: 4, owner: 4, baseHp: 4, maxHp: 4,
    radius: 4, influenceRadius: 4, spawnTimer: 4, spawnProgress: 4,
    hitFlash: 4, stock: 4, nodeFlags: 4, type: 4, spawnEffect: 4, manualSpawnReady: 4,
    id: 4,
    rallyX: 4, rallyY: 4, rallyTargetNodeId: 4,
};

let nodeOffset = 0;
const NODE_OFFSET_X = nodeOffset; nodeOffset += NODE_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_Y = nodeOffset; nodeOffset += NODE_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_OWNER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_BASEHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.baseHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MAXHP = nodeOffset; nodeOffset += NODE_FIELD_SIZES.maxHp * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.radius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_INFLUENCERADIUS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.influenceRadius * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNTIMER = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnTimer * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNPROGRESS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnProgress * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_HITFLASH = nodeOffset; nodeOffset += NODE_FIELD_SIZES.hitFlash * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_STOCK = nodeOffset; nodeOffset += NODE_FIELD_SIZES.stock * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_NODEFLAGS = nodeOffset; nodeOffset += NODE_FIELD_SIZES.nodeFlags * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_TYPE = nodeOffset; nodeOffset += NODE_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_SPAWNEFFECT = nodeOffset; nodeOffset += NODE_FIELD_SIZES.spawnEffect * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_MANUALSPAWNREADY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.manualSpawnReady * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_ID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYX = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyX * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYY = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyY * MEMORY_LAYOUT.MAX_NODES;
const NODE_OFFSET_RALLYTARGETNODEID = nodeOffset; nodeOffset += NODE_FIELD_SIZES.rallyTargetNodeId * MEMORY_LAYOUT.MAX_NODES;

const TOTAL_NODE_BYTES = nodeOffset;

const DEATH_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, type: 4, entityIndex: 4, targetX: 4, targetY: 4 };
let deathOffset = 0;
const DEATH_OFFSET_X = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_Y = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_OWNER = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TYPE = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.type * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_ENTITYINDEX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.entityIndex * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETX = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const DEATH_OFFSET_TARGETY = deathOffset; deathOffset += DEATH_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_DEATH_EVENTS;
const TOTAL_DEATH_EVENT_BYTES = deathOffset;

const SPAWN_EVENT_FIELD_SIZES = { x: 4, y: 4, owner: 4, targetX: 4, targetY: 4, targetNodeId: 4, id: 8 };
let spawnOffset = 0;
const SPAWN_OFFSET_X = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.x * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_Y = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.y * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_OWNER = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.owner * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETX = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetX * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETY = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetY * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_TARGETNODEID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.targetNodeId * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const SPAWN_OFFSET_ID = spawnOffset; spawnOffset += SPAWN_EVENT_FIELD_SIZES.id * MEMORY_LAYOUT.MAX_SPAWN_EVENTS;
const TOTAL_SPAWN_EVENT_BYTES = spawnOffset;

const NODES_OFFSET = HEADER_SIZE + TOTAL_ENTITY_BYTES;
const DEATH_EVENTS_OFFSET = NODES_OFFSET + TOTAL_NODE_BYTES;
const SPAWN_EVENTS_OFFSET = DEATH_EVENTS_OFFSET + TOTAL_DEATH_EVENT_BYTES;

// Fill in derived layout constants now that offsets are known
MEMORY_LAYOUT.ENTITY_DATA_START = HEADER_SIZE;
MEMORY_LAYOUT.NODE_DATA_START = NODES_OFFSET;
MEMORY_LAYOUT.ENTITY_STRIDE = Object.values(ENTITY_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4; // in float32 words
MEMORY_LAYOUT.NODE_STRIDE = Object.values(NODE_FIELD_SIZES).reduce((a, b) => a + b, 0) / 4;

export function calculateBufferSize() {
    return SPAWN_EVENTS_OFFSET + TOTAL_SPAWN_EVENT_BYTES;
}
// Also store total size on MEMORY_LAYOUT for external use
MEMORY_LAYOUT.TOTAL_SIZE = calculateBufferSize();

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
            id: new Float64Array(buffer, HEADER_SIZE + ENTITY_OFFSET_ID, MEMORY_LAYOUT.MAX_ENTITIES),
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
            id: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_ID, MEMORY_LAYOUT.MAX_NODES),
            rallyX: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYX, MEMORY_LAYOUT.MAX_NODES),
            rallyY: new Float32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYY, MEMORY_LAYOUT.MAX_NODES),
            rallyTargetNodeId: new Int32Array(buffer, NODES_OFFSET + NODE_OFFSET_RALLYTARGETNODEID, MEMORY_LAYOUT.MAX_NODES),
        };

        this.deathEvents = {
            x: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_X, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            y: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_Y, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            owner: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_OWNER, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            type: new Uint32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TYPE, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            entityIndex: new Int32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_ENTITYINDEX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetX: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
            targetY: new Float32Array(buffer, DEATH_EVENTS_OFFSET + DEATH_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_DEATH_EVENTS),
        };

        this.spawnEvents = {
            x: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_X, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            y: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_Y, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            owner: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_OWNER, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetX: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETX, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetY: new Float32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETY, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            targetNodeId: new Int32Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_TARGETNODEID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
            id: new Float64Array(buffer, SPAWN_EVENTS_OFFSET + SPAWN_OFFSET_ID, MEMORY_LAYOUT.MAX_SPAWN_EVENTS),
        };
    }

    static create() {
        const size = calculateBufferSize();
        const buffer = new SharedArrayBuffer(size);
        return new SharedMemory(buffer);
    }

    // Convenience alias: clear both event queues
    clearEvents() {
        this.header.deathEventsCount[0] = 0;
        this.header.spawnEventsCount[0] = 0;
    }

    clearDeathEvents() {
        this.header.deathEventsCount[0] = 0;
    }

    addDeathEvent(x, y, owner, type, entityIndex, targetX = 0, targetY = 0) {
        const idx = this.header.deathEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_DEATH_EVENTS) return;

        this.deathEvents.x[idx] = x;
        this.deathEvents.y[idx] = y;
        this.deathEvents.owner[idx] = owner;
        this.deathEvents.type[idx] = type;
        this.deathEvents.entityIndex[idx] = entityIndex;
        this.deathEvents.targetX[idx] = targetX;
        this.deathEvents.targetY[idx] = targetY;

        this.header.deathEventsCount[0] = idx + 1;
    }

    clearSpawnEvents() {
        this.header.spawnEventsCount[0] = 0;
    }

    // Allocate entity: returns index or -1
    allocateEntity() {
        const idx = this.header.entityCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_ENTITIES) return -1;
        this.header.entityCount[0] = idx + 1;
        // Zero the flags for this slot
        this.entities.flags[idx] = 0;
        this.entities.deathTime[idx] = 0;
        this.entities.deathType[idx] = 0;
        return idx;
    }

    // Read back all death events as array of objects
    getDeathEvents() {
        const count = this.header.deathEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.deathEvents.x[i],
                y: this.deathEvents.y[i],
                owner: this.deathEvents.owner[i],
                type: this.deathEvents.type[i],
                entityIndex: this.deathEvents.entityIndex[i],
                targetX: this.deathEvents.targetX[i],
                targetY: this.deathEvents.targetY[i],
            });
        }
        return events;
    }

    // Read back all spawn events as array of objects
    getSpawnEvents() {
        const count = this.header.spawnEventsCount[0];
        const events = [];
        for (let i = 0; i < count; i++) {
            events.push({
                x: this.spawnEvents.x[i],
                y: this.spawnEvents.y[i],
                owner: this.spawnEvents.owner[i],
                targetX: this.spawnEvents.targetX[i],
                targetY: this.spawnEvents.targetY[i],
                targetNodeId: this.spawnEvents.targetNodeId[i],
                id: this.spawnEvents.id[i],
            });
        }
        return events;
    }

    addSpawnEvent(x, y, owner, targetX, targetY, targetNodeId, id) {
        const idx = this.header.spawnEventsCount[0];
        if (idx >= MEMORY_LAYOUT.MAX_SPAWN_EVENTS) return;

        this.spawnEvents.x[idx] = x;
        this.spawnEvents.y[idx] = y;
        this.spawnEvents.owner[idx] = owner;
        this.spawnEvents.targetX[idx] = targetX;
        this.spawnEvents.targetY[idx] = targetY;
        this.spawnEvents.targetNodeId[idx] = targetNodeId;
        this.spawnEvents.id[idx] = id;

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
