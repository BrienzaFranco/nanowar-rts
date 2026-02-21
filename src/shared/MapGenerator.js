import { Node } from './Node.js';

const MAP_TYPES = ['SPIRAL_GALAXY', 'CONSTELLATIONS', 'SOLAR_CLUSTERS', 'RING_GALAXY', 'CROSSROADS', 'VOID_ISLANDS', 'GRID_NETWORK'];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.45;

        // Pick a random map style
        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];
        console.log(`Generating map: ${mapType} for ${playerCount} players.`);

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación y Simetría
        // ─────────────────────────────────────────────────────────────────
        
        const MIN_NODE_DIST = 140; 

        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 50; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                // Physical limit to prevent overlapping bodies
                const physicalLimit = r + n.radius + 20;
                if (dist < physicalLimit) return false;
                
                // Exclusion zone: larger if the other node belongs to a player
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 400) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            const angleStep = (Math.PI * 2) / playerCount;
            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            const baseAngle = Math.atan2(dy, dx);

            for (let i = 0; i < playerCount; i++) {
                const angle = baseAngle + (i * angleStep);
                const px = centerX + baseDist * Math.cos(angle);
                const py = centerY + baseDist * Math.sin(angle);
                const finalOwner = (owner === -1) ? -1 : (owner + i) % playerCount;
                nodes.push(new Node(idCounter++, px, py, finalOwner, type));
            }
        };

        // Crea grupos con formas interesantes (Triángulos, Líneas, Cúmulos)
        const createFormGroup = (cx, cy, owner, mainType, formType = 'CLUSTER') => {
            addSymmetricNode(cx, cy, owner, mainType);
            
            let points = [];
            const orbitRadius = mainType === 'large' ? 140 : 110;

            if (formType === 'TRIANGLE') {
                points = [
                    { a: 0, d: orbitRadius },
                    { a: Math.PI * 2/3, d: orbitRadius },
                    { a: Math.PI * 4/3, d: orbitRadius }
                ];
            } else if (formType === 'LINE') {
                const angle = Math.random() * Math.PI;
                points = [
                    { a: angle, d: orbitRadius },
                    { a: angle + Math.PI, d: orbitRadius }
                ];
            } else {
                const count = Math.floor(Math.random() * 3 + 2);
                for (let i = 0; i < count; i++) {
                    points.push({ a: (Math.PI * 2 / count) * i + Math.random(), d: orbitRadius });
                }
            }

            for (let pt of points) {
                const px = cx + pt.d * Math.cos(pt.a);
                const py = cy + pt.d * Math.sin(pt.a);
                const subType = mainType === 'large' ? (Math.random() > 0.4 ? 'medium' : 'small') : 'small';
                addSymmetricNode(px, py, owner, subType);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.94; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // BASES: Exactly ONE large node per player. No satellites, no clusters.
        addSymmetricNode(p0x, p0y, 0, 'large');

        // Dynamic center
        const centerStyle = Math.random();
        if (centerStyle > 0.7) {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
            for(let i=0; i<3; i++) {
                const a = (Math.PI * 2 / 3) * i;
                nodes.push(new Node(idCounter++, centerX + 220*Math.cos(a), centerY + 220*Math.sin(a), -1, 'medium'));
            }
        } else if (centerStyle > 0.35) {
            createFormGroup(centerX, centerY, -1, 'large', 'TRIANGLE');
        } else {
            createFormGroup(centerX, centerY, -1, 'medium', 'LINE');
            nodes.push(new Node(idCounter++, centerX, centerY + 250, -1, 'medium'));
            nodes.push(new Node(idCounter++, centerX, centerY - 250, -1, 'medium'));
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Map Type Logic
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 6;
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * 1.5 * Math.PI);
                const dist = 350 + (t * (baseDist - 600)); // Slightly more center-focused
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, 150)) {
                    createFormGroup(px, py, -1, i % 2 === 0 ? 'large' : 'medium', Math.random() > 0.7 ? 'LINE' : 'CLUSTER');
                }
            }
        } else if (mapType === 'CONSTELLATIONS') {
            const steps = 6;
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x * (1 - t) + centerX * t;
                const py = p0y * (1 - t) + centerY * t;
                const offset = (Math.random() - 0.5) * 600;
                const jx = px + offset * Math.cos(baseStartAngle + Math.PI/2);
                const jy = py + offset * Math.sin(baseStartAngle + Math.PI/2);
                if (isValid(jx, jy, 55, 120)) {
                    createFormGroup(jx, jy, -1, 'medium', 'LINE');
                }
            }
        } else if (mapType === 'VOID_ISLANDS') {
            for (let i = 0; i < 4; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * Math.PI / 2);
                const dist = mapRadius * 0.65;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 70, 200)) {
                    createFormGroup(px, py, -1, 'large', 'TRIANGLE');
                }
            }
        } else if (mapType === 'GRID_NETWORK') {
            for(let x = -1; x <= 1; x++) {
                for(let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) continue;
                    const px = centerX + x * 700;
                    const py = centerY + y * 600;
                    const dx = px - centerX;
                    const dy = py - centerY;
                    const angle = Math.atan2(dy, dx);
                    const sectorAngle = (Math.PI * 2) / playerCount;
                    const relAngle = (angle - baseStartAngle + Math.PI * 4) % (Math.PI * 2);
                    
                    if (relAngle < sectorAngle && isValid(px, py, 50, 150)) {
                        addSymmetricNode(px, py, -1, 'medium');
                    }
                }
            }
        } else {
            for (let k = 0; k < 4; k++) {
                const angle = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const dist = 450 + Math.random() * (baseDist - 750);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, 180)) {
                    createFormGroup(px, py, -1, 'large', 'CLUSTER');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Lost Nodes (Far from players and asymmetrical)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 5) + 3; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.15 + Math.random() * 0.25); // Pushed further out
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let farFromPlayers = true;
            for (let p = 0; p < playerCount; p++) {
                const pAngle = baseStartAngle + (p * Math.PI * 2 / playerCount);
                const bx = centerX + baseDist * Math.cos(pAngle);
                const by = centerY + baseDist * Math.sin(pAngle);
                if (Math.hypot(px - bx, py - by) < 700) { // Minimum 700 from any player base
                    farFromPlayers = false;
                    break;
                }
            }

            if (farFromPlayers && isValid(px, py, 25, 100)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.8 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Cleanup
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                // Minimum physical space between any two nodes
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 40) {
                    tooClose = true;
                    break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
