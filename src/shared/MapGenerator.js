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
        // const mapType = 'GALAXY'; // Debug override
        console.log(`Generating map: ${mapType} for ${playerCount} players.`);

        // ─────────────────────────────────────────────────────────────────
        // 1. Helper: Symmetry & Placement
        // ─────────────────────────────────────────────────────────────────
        
        // Check if a point is valid (bounds & collision)
        const isValid = (x, y, r, extraMargin = 0) => {
            // Boundary check
            const margin = 100;
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) {
                return false;
            }
            // Collision check
            for (let n of nodes) {
                const dx = x - n.x;
                const dy = y - n.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < r + n.radius + extraMargin) return false;
            }
            return true;
        };

        // Add a node and its symmetric counterparts
        const addSymmetricNode = (baseX, baseY, owner, type, rOverride = null) => {
            const angleStep = (Math.PI * 2) / playerCount;
            
            // Calculate base polar relative to center
            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            const baseAngle = Math.atan2(dy, dx);

            for (let i = 0; i < playerCount; i++) {
                const angle = baseAngle + (i * angleStep);
                const px = centerX + baseDist * Math.cos(angle);
                const py = centerY + baseDist * Math.sin(angle);
                
                // Determine owner: 
                // If owner is -1, it's neutral. 
                // If owner is 0, it becomes 0, 1, 2... for each symmetric clone.
                const finalOwner = (owner === -1) ? -1 : (owner + i) % playerCount;

                // Safety check for the first placement (others are guaranteed by symmetry if first works)
                // We only check heavily on the first one or if the map is very crowded.
                // Here we trust the generator logic to spacing, but we can do a final verify.
                
                const node = new Node(idCounter++, px, py, finalOwner, type);
                if (rOverride) node.radius = rOverride;
                nodes.push(node);
            }
        };

        // Create a "Solar System" (Central Star + Orbiting Planets)
        const createSystem = (cx, cy, owner, type, planetCount = 0, orbitRadius = 80) => {
            // Central Star
            addSymmetricNode(cx, cy, owner, type);

            // Orbiting Planets
            if (planetCount > 0) {
                const orbitStep = (Math.PI * 2) / planetCount;
                const orbitOffset = Math.random() * Math.PI; // Random rotation for the system
                
                for (let i = 0; i < planetCount; i++) {
                    const angle = orbitOffset + (i * orbitStep);
                    const px = cx + orbitRadius * Math.cos(angle);
                    const py = cy + orbitRadius * Math.sin(angle);
                    
                    // Planets are usually neutral or same owner? 
                    // Usually neutral defenses around a base, or empty satellites.
                    // Let's make base-systems fully owned, others neutral.
                    const planetOwner = owner; 
                    
                    // Recursive symmetry handled by addSymmetricNode? 
                    // NO. addSymmetricNode rotates the *entire* position around World Center.
                    // So we just pass the calculated planet pos to it.
                    addSymmetricNode(px, py, planetOwner, 'small');
                }
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base Generation (Always consistent)
        // ─────────────────────────────────────────────────────────────────
        
        // Bases are pushed out towards the edge
        const baseDist = mapRadius * 0.85;
        // Base Angle: Player 0 at -90deg (Top) or -135deg (Top-Left)
        // Let's stick to standard angles relative to center.
        const baseStartAngle = -Math.PI / 2; // Top
        
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // Create Player 0's base system (Symmetry function handles the rest)
        // A "Home System": 1 Large Node + 2 Medium/Small guards
        createSystem(p0x, p0y, 0, 'large', 2, 90);


        // ─────────────────────────────────────────────────────────────────
        // 3. Map Type Logic
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'GALAXY') {
            // Spiral Arms
            const armCount = playerCount < 4 ? 2 : playerCount; // 2 arms for 1v1, else N arms
            const armPoints = 5; 
            const twistFactor = 1.5; // How much the arm curves

            // We generate ONE arm for Player 0, and symmetry handles the rest.
            // Start from near center, spiral out to near base.
            
            for (let i = 1; i < armPoints; i++) {
                const t = i / armPoints; // 0 to 1
                const angle = baseStartAngle + (t * twistFactor * Math.PI); // Curve
                const dist = 300 + (t * (baseDist - 400)); // From center-ish to base-ish
                
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                
                // Add "Cluster" at this point on the arm
                const isMajor = i % 2 === 0;
                const size = isMajor ? 'medium' : 'small';
                
                // Random jitter
                const jx = px + (Math.random() - 0.5) * 100;
                const jy = py + (Math.random() - 0.5) * 100;

                if (isValid(jx, jy, 40, 50)) {
                    createSystem(jx, jy, -1, size, isMajor ? 1 : 0, 60);
                }
            }

            // Central Super-Massive Black Hole (Contested)
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'large'));
            // Inner Ring
            const ringCount = 4;
            for(let i=0; i<ringCount; i++) {
                const a = (Math.PI * 2 / ringCount) * i;
                const d = 180;
                nodes.push(new Node(idCounter++, centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'medium'));
            }

        } else if (mapType === 'CONSTELLATION') {
            // Connect bases to center with "Stars"
            const steps = 4;
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x + (centerX - p0x) * t;
                const py = p0y + (centerY - p0y) * t;
                
                // Zig-zag path
                const perpAngle = baseStartAngle + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 200;
                const jx = px + offset * Math.cos(perpAngle);
                const jy = py + offset * Math.sin(perpAngle);

                addSymmetricNode(jx, jy, -1, 'medium');
            }

            // Central "Orion's Belt" or similar
            addSymmetricNode(centerX, centerY - 100, -1, 'large');
            // Center is empty? Or just one big node?
            // Let's make the center a "Triangle" of nodes
            if (nodes.every(n => Math.hypot(n.x - centerX, n.y - centerY) > 100)) {
                 nodes.push(new Node(idCounter++, centerX, centerY, -1, 'large'));
            }

        } else if (mapType === 'SCATTERED_SYSTEMS') {
            // Random clusters in valid annular space
            const numSystems = 6;
            for (let i = 0; i < numSystems; i++) {
                // Polar coordinates relative to P0's sector
                const angleWiggle = (Math.PI * 2) / playerCount / 2;
                const angle = baseStartAngle + (Math.random() - 0.5) * angleWiggle;
                const dist = 400 + Math.random() * (baseDist - 600);
                
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                
                // 50% chance of a "Binary System" (2 nodes) or "Single"
                if (Math.random() > 0.5) {
                    createSystem(px, py, -1, 'medium', 1, 50);
                } else {
                    addSymmetricNode(px, py, -1, 'medium');
                }
            }
             // Center Hub
            createSystem(centerX, centerY, -1, 'large', 3, 120);
        } else if (mapType === 'BINARY_STARS') {
            // Two massive stars in the center
             const offset = 100;
             nodes.push(new Node(idCounter++, centerX - offset, centerY, -1, 'large'));
             nodes.push(new Node(idCounter++, centerX + offset, centerY, -1, 'large'));
             
             // Field of debris
             const debrisCount = 10;
             for (let i = 0; i < debrisCount; i++) {
                 const a = Math.random() * Math.PI * 2;
                 const d = 300 + Math.random() * 800;
                 const px = centerX + d * Math.cos(a);
                 const py = centerY + d * Math.sin(a);
                 
                 // Add debris symmetrically so the map remains fair
                 // Debris is usually neutral
                 if (isValid(px, py, 20, 30)) {
                     addSymmetricNode(px, py, -1, 'small');
                 }
             }
             
             // P0 Sector generation
             for(let k=0; k<5; k++) {
                 const t = k/5;
                 const px = p0x * (1-t) + centerX * t;
                 const py = p0y * (1-t) + centerY * t;
                 const jx = px + (Math.random()-0.5)*300;
                 const jy = py + (Math.random()-0.5)*300;
                 if(isValid(jx, jy, 30)) {
                    addSymmetricNode(jx, jy, -1, 'small');
                 }
             }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Cleanup & Validation
        // ─────────────────────────────────────────────────────────────────
        
        // Ensure connectivity?
        // In RTS, usually gaps are fine as long as flight is possible.
        // We just ensure no node is overlapping.
        
        // Remove overlaps (brute force cleanup if any slipped through)
        const finalNodes = [];
        for (let i = 0; i < nodes.length; i++) {
            let keep = true;
            for (let j = 0; j < finalNodes.length; j++) {
                const dist = Math.hypot(nodes[i].x - finalNodes[j].x, nodes[i].y - finalNodes[j].y);
                if (dist < nodes[i].radius + finalNodes[j].radius + 30) {
                    keep = false;
                    break;
                }
            }
            if (keep) finalNodes.push(nodes[i]);
        }
        
        // Re-assign IDs to be clean
        finalNodes.forEach((n, idx) => n.id = idx);

        return finalNodes;
    }
}
