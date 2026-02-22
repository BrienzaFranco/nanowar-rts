import { Node } from './Node.js';
import { NODE_TYPES, NODE_CONFIG } from './GameConfig.js';

const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_WEB', 'SOLAR_SYSTEMS',
    'RING_OF_FIRE', 'VOID_ISLANDS'
];

export class MapGenerator {
    static getRadiusForType(type) {
        return (NODE_CONFIG[type] && NODE_CONFIG[type].radius) || 40;
    }

    static generate(playerCount, worldWidth, worldHeight, fixedNodes = null) {
        let finalNodes = [];

        if (fixedNodes && fixedNodes.length > 0) {
            // Bypass random generation and use fixed layout
            console.log(`Loading fixed map layout with ${fixedNodes.length} nodes.`);
            fixedNodes.forEach((n, index) => {
                const node = new Node(index, n.x, n.y, n.owner, n.type);
                if (n.baseHp !== undefined) node.baseHp = n.baseHp;
                if (n.maxHp !== undefined) node.maxHp = n.maxHp;
                if (n.radius !== undefined) node.radius = n.radius;
                finalNodes.push(node);
            });
            return finalNodes;
        }

        const minNodes = Math.max(8, playerCount * 4);
        const maxNodes = playerCount * 15;
        let attempts = 0;

        while (attempts < 50) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);

            if (finalNodes && finalNodes.length >= minNodes && finalNodes.length <= maxNodes) {
                // Ensure all players have at least one node
                const uniqueOwners = new Set(finalNodes.filter(n => n.owner !== -1).map(n => n.owner));
                if (uniqueOwners.size === playerCount) {
                    break;
                }
            }
            finalNodes = [];
        }

        if (finalNodes.length === 0) {
            console.error("Failed to generate a valid map after 50 attempts. Forcing fallback.");
            // Last resort: just try one more time without owner check if it's really stuck
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes) || [];
        }

        console.log(`Generated robust map for ${playerCount} players: ${finalNodes.length} nodes after ${attempts} attempts.`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight, maxAllowed) {
        const nodes = [];
        let idCounter = 0;

        const cx = worldWidth / 2;
        const cy = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.46;

        const baseAngleOffset = Math.random() * Math.PI * 2;
        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // Helper to check collision for a single position against existing nodes
        const isValidPos = (x, y, r, extraMargin = 120) => {
            const margin = 100;
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;

            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const combinedR = r + this.getRadiusForType(n.type);

                const baseExclusion = Math.max(180, 250 - playerCount * 10); // More reasonable spacing
                const limit = (n.owner !== -1) ? baseExclusion : extraMargin;

                // Push Omega even further
                const finalLimit = (n.type === NODE_TYPES.OMEGA) ? limit + 100 : limit;

                if (dist < combinedR + finalLimit) return false;
            }
            return true;
        };

        // Attempts to add a node and all its rotationally symmetric clones.
        // If ANY clone collides, the WHOLE group is rejected to guarantee 100% fairness.
        const tryAddSymmetricGroup = (r, theta, type, ownerBaseIndex = -1) => {
            if (nodes.length >= maxAllowed) return false;

            const nodeRadius = this.getRadiusForType(type);
            const positions = [];
            const angleStep = (Math.PI * 2) / playerCount;

            // Center node special case
            if (r < 10) {
                if (isValidPos(cx, cy, nodeRadius, 100)) {
                    nodes.push(new Node(idCounter++, cx, cy, -1, type));
                    return true;
                }
                return false;
            }

            // Calculate all symmetric positions
            for (let i = 0; i < playerCount; i++) {
                const angle = theta + (i * angleStep);
                const px = cx + r * Math.cos(angle);
                const py = cy + r * Math.sin(angle);
                const owner = (ownerBaseIndex === -1 ? -1 : (ownerBaseIndex + i) % playerCount);
                positions.push({ x: px, y: py, owner, angle });
            }

            // Verify ALL positions before adding ANY
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i];
                if (!isValidPos(p.x, p.y, nodeRadius, 90)) return false;

                // Self-collision within the group: ensure nodes in the group don't overlap with each other
                for (let j = i + 1; j < positions.length; j++) {
                    const p2 = positions[j];
                    if (Math.hypot(p.x - p2.x, p.y - p2.y) < (nodeRadius * 2) + 120) return false;
                }
            }

            // All valid, apply!
            for (let p of positions) {
                nodes.push(new Node(idCounter++, p.x, p.y, p.owner, type));
            }
            return true;
        };

        // --- MAP GENERATION PIPELINE ---

        // 1. PLACE OMEGA (Center) / DUAL CORE
        if (mapType === 'RING_OF_FIRE' || (playerCount === 2 && Math.random() > 0.5)) {
            // No center node. If not Ring of Fire, place Dual Cores.
            if (mapType !== 'RING_OF_FIRE') {
                tryAddSymmetricGroup(mapRadius * 0.2, baseAngleOffset + Math.PI / 2, NODE_TYPES.OMEGA);
            }
        } else {
            // Standard center OMEGA
            nodes.push(new Node(idCounter++, cx, cy, -1, NODE_TYPES.OMEGA));
        }

        // 2. PLACE PLAYER BASES
        const baseDist = mapRadius * 0.85;
        if (!tryAddSymmetricGroup(baseDist, baseAngleOffset, NODE_TYPES.LARGE, 0)) {
            return null; // Fatal failure, retry
        }

        // 3. SECURE FIRST EXPANSION (Close to bases)
        // A medium node slightly inwards and to the side
        tryAddSymmetricGroup(baseDist * 0.75, baseAngleOffset + 0.3, NODE_TYPES.MEDIUM);

        // 4. THEMATIC FILL
        const fillTheme = (theme) => {
            // Reduced total thematic nodes for less clutter, better spacing
            const steps = 10;
            for (let i = 0; i < steps; i++) {
                if (nodes.length >= maxAllowed) break;

                let r, theta;
                let type;

                // Shifted node distribution to favor LARGE and MEGA, entirely cutting SMALL
                // 30% MEGA, 55% LARGE, 15% MEDIUM, 0% SMALL
                const randType = Math.random();
                if (randType > 0.70) type = NODE_TYPES.MEGA;
                else if (randType > 0.15) type = NODE_TYPES.LARGE;
                else type = NODE_TYPES.MEDIUM;

                if (theme === 'GALAXY_SPIRAL') {
                    const t = i / steps;
                    r = baseDist * (1 - t * 0.8);
                    theta = baseAngleOffset + t * Math.PI;
                }
                else if (theme === 'SOLAR_SYSTEMS') {
                    const a = Math.random() * Math.PI * 2;
                    const d = 150 + Math.random() * 200;
                    const bx = cx + baseDist * Math.cos(baseAngleOffset);
                    const by = cy + baseDist * Math.sin(baseAngleOffset);
                    const px = bx + d * Math.cos(a);
                    const py = by + d * Math.sin(a);
                    r = Math.hypot(px - cx, py - cy);
                    theta = Math.atan2(py - cy, px - cx);
                    type = Math.random() > 0.7 ? NODE_TYPES.LARGE : NODE_TYPES.MEDIUM;
                }
                else if (theme === 'CONSTELLATION_WEB') {
                    r = Math.random() * mapRadius * 0.9;
                    theta = Math.random() * Math.PI * 2;
                }
                else if (theme === 'RING_OF_FIRE') {
                    r = mapRadius * (0.6 + Math.random() * 0.3);
                    theta = Math.random() * Math.PI * 2;
                    type = Math.random() > 0.6 ? NODE_TYPES.MEGA : NODE_TYPES.LARGE;
                }
                else if (theme === 'VOID_ISLANDS') {
                    if (Math.random() > 0.5) continue;
                    r = Math.random() * mapRadius * 0.8;
                    theta = Math.random() * Math.PI * 2;
                    type = Math.random() > 0.5 ? NODE_TYPES.MEGA : NODE_TYPES.ULTRA;
                }

                tryAddSymmetricGroup(r, theta, type);
            }

            // Post-theme random scatter for connections
            // Reduced to 10 scattered structures
            for (let i = 0; i < 10; i++) {
                if (nodes.length >= maxAllowed) break;
                const r = Math.random() * mapRadius * 0.9;
                const theta = Math.random() * Math.PI * 2;

                // Keep the proportion balanced instead of defaulting entirely to SMALL/MEDIUM
                // 80% LARGE, 20% MEDIUM
                const rand = Math.random();
                let type;
                if (rand > 0.20) type = NODE_TYPES.LARGE;
                else type = NODE_TYPES.MEDIUM;

                tryAddSymmetricGroup(r, theta, type);
            }
        };

        fillTheme(mapType);

        return nodes;
    }
}
