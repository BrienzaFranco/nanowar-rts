import { Node } from './Node.js';

const MAP_TYPES = ['GALAXY', 'CONSTELLATION', 'SCATTERED_SYSTEMS', 'BINARY_STARS'];

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
        // 1. Helper: Symmetry & Placement
        // ─────────────────────────────────────────────────────────────────
        
        // Increased global spacing for troops to move comfortably
        const GLOBAL_SPACING = 150; 

        // Check if a point is valid (bounds & collision)
        const isValid = (x, y, r, extraMargin = GLOBAL_SPACING) => {
            const margin = 120;
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) {
                return false;
            }
            for (let n of nodes) {
                const dx = x - n.x;
                const dy = y - n.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                // Stricter distance check for more open space
                if (dist < r + n.radius + extraMargin) return false;
            }
            return true;
        };

        // Add a node and its symmetric counterparts
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

        // Create a "Solar System" (Central Star + Orbiting Planets)
        const createSystem = (cx, cy, owner, type, planetCount = 0, orbitRadius = 140) => {
            addSymmetricNode(cx, cy, owner, type);

            if (planetCount > 0) {
                const orbitStep = (Math.PI * 2) / planetCount;
                const orbitOffset = Math.random() * Math.PI;
                
                for (let i = 0; i < planetCount; i++) {
                    const angle = orbitOffset + (i * orbitStep);
                    const px = cx + orbitRadius * Math.cos(angle);
                    const py = cy + orbitRadius * Math.sin(angle);
                    
                    // Planets are now more likely to be Medium
                    const planetType = Math.random() > 0.4 ? 'medium' : 'small';
                    addSymmetricNode(px, py, owner, planetType);
                }
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base Generation (Home System)
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.85;
        const baseStartAngle = -Math.PI / 2; // Top
        
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // Bases have 1 Large Node + 1 Medium satellite (cleaner, less clutter)
        createSystem(p0x, p0y, 0, 'large', 1, 130);


        // ─────────────────────────────────────────────────────────────────
        // 3. Map Type Logic
        // ─────────────────────────────────────────────────────────────────

        // ALWAYS place a SUPER node in the center (High Value Objective)
        if (mapType !== 'BINARY_STARS') {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
        }

        if (mapType === 'GALAXY') {
            const armCount = playerCount < 4 ? 2 : playerCount;
            const armPoints = 4; // Fewer points = more space
            const twistFactor = 1.2; 

            for (let i = 1; i < armPoints; i++) {
                const t = i / armPoints; 
                const angle = baseStartAngle + (t * twistFactor * Math.PI); 
                const dist = 450 + (t * (baseDist - 600)); 
                
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                
                const isMajor = i % 2 === 0;
                const size = isMajor ? 'large' : 'medium';
                
                const jx = px + (Math.random() - 0.5) * 150;
                const jy = py + (Math.random() - 0.5) * 150;

                if (isValid(jx, jy, 60, 200)) {
                    createSystem(jx, jy, -1, size, isMajor ? 1 : 0, 150);
                }
            }

            // Inner Ring of Medium Nodes (Guardians of the Super node)
            const ringCount = 3;
            for(let i=0; i<ringCount; i++) {
                const a = (Math.PI * 2 / ringCount) * i + Math.random();
                const d = 350;
                nodes.push(new Node(idCounter++, centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'medium'));
            }

        } else if (mapType === 'CONSTELLATION') {
            const steps = 3; // Fewer steps for more space
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x + (centerX - p0x) * t;
                const py = p0y + (centerY - p0y) * t;
                
                const perpAngle = baseStartAngle + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 350;
                const jx = px + offset * Math.cos(perpAngle);
                const jy = py + offset * Math.sin(perpAngle);

                if (isValid(jx, jy, 50, 180)) {
                    addSymmetricNode(jx, jy, -1, 'large');
                }
            }
            // Secondary large nodes for flanking
            addSymmetricNode(centerX + 600, centerY, -1, 'medium');

        } else if (mapType === 'SCATTERED_SYSTEMS') {
            const numSystems = 4; // Reduced from 6 for more space
            for (let i = 0; i < numSystems; i++) {
                const angleWiggle = (Math.PI * 2) / playerCount / 1.5;
                const angle = baseStartAngle + (Math.random() - 0.5) * angleWiggle + (Math.PI/playerCount);
                const dist = 500 + Math.random() * (baseDist - 800);
                
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                
                if (isValid(px, py, 60, 250)) {
                    createSystem(px, py, -1, 'large', 1, 160);
                }
            }
        } else if (mapType === 'BINARY_STARS') {
             // Two SUPER stars in the center instead of Large
             const offset = 250;
             nodes.push(new Node(idCounter++, centerX - offset, centerY, -1, 'super'));
             nodes.push(new Node(idCounter++, centerX + offset, centerY, -1, 'super'));
             
             const debrisCount = 6; // Fewer, larger debris
             for (let i = 0; i < debrisCount; i++) {
                 const a = Math.random() * Math.PI * 2;
                 const d = 500 + Math.random() * 700;
                 const px = centerX + d * Math.cos(a);
                 const py = centerY + d * Math.sin(a);
                 
                 if (isValid(px, py, 32, 250)) {
                     addSymmetricNode(px, py, -1, 'medium');
                 }
             }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Cleanup & Validation
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            let keep = true;
            for (let j = 0; j < finalNodes.length; j++) {
                const dist = Math.hypot(nodes[i].x - finalNodes[j].x, nodes[i].y - finalNodes[j].y);
                // Final safety margin is much larger now
                if (dist < nodes[i].radius + finalNodes[j].radius + 120) {
                    keep = false;
                    break;
                }
            }
            if (keep) finalNodes.push(nodes[i]);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
