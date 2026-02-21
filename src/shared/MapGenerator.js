import { Node } from './Node.js';

const MAP_TYPES = ['GALAXY_SPIRAL', 'CONSTELLATION_NET', 'SOLAR_SYSTEMS', 'ORBITAL_RINGS', 'DEEP_SPACE_CLUSTERS', 'NEBULA_CHANNELS'];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minNodes = playerCount * 4;
        const maxNodes = playerCount * 7;
        let attempts = 0;

        // Bucle de reintento para garantizar la densidad solicitada
        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 25) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated cosmic map with ${finalNodes.length} nodes (Attempts: ${attempts}).`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight, maxAllowed) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.44;

        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación y Simetría
        // ─────────────────────────────────────────────────────────────────
        
        const MIN_NODE_DIST = 220; 

        const isValid = (x, y, r, extraMargin = 120) => {
            const margin = 80; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 35;
                if (dist < physicalLimit) return false;
                
                // Zona de exclusión de bases reducida de 600 a 400 para permitir densidad
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 400) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 15) {
                nodes.push(new Node(idCounter++, centerX, centerY, -1, type));
                return true;
            }

            const angleStep = (Math.PI * 2) / playerCount;
            const baseAngle = Math.atan2(dy, dx);

            for (let i = 0; i < playerCount; i++) {
                const angle = baseAngle + (i * angleStep);
                const px = centerX + baseDist * Math.cos(angle);
                const py = centerY + baseDist * Math.sin(angle);
                const finalOwner = (owner === -1) ? -1 : (owner + i) % playerCount;
                nodes.push(new Node(idCounter++, px, py, finalOwner, type));
            }
            return true;
        };

        const createCosmicFormation = (cx, cy, owner, theme = 'SOLAR') => {
            if (theme === 'SOLAR') {
                addSymmetricNode(cx, cy, owner, 'large');
                const orbitR = 260;
                const planets = 2;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    addSymmetricNode(cx + orbitR * Math.cos(a), cy + orbitR * Math.sin(a), -1, 'medium');
                }
            } else if (theme === 'CONSTELLATION') {
                addSymmetricNode(cx, cy, owner, 'medium');
                const dist = 320;
                const angle = Math.random() * Math.PI;
                addSymmetricNode(cx + dist * Math.cos(angle), cy + dist * Math.sin(angle), -1, 'medium');
                addSymmetricNode(cx - dist * Math.cos(angle), cy - dist * Math.sin(angle), -1, 'small');
            } else if (theme === 'CLUSTER') {
                addSymmetricNode(cx, cy, owner, 'large');
                const a1 = Math.random() * Math.PI * 2;
                addSymmetricNode(cx + 200 * Math.cos(a1), cy + 200 * Math.sin(a1), -1, 'medium');
                addSymmetricNode(cx + 200 * Math.cos(a1 + Math.PI), cy + 200 * Math.sin(a1 + Math.PI), -1, 'small');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Estructura Base: Jugadores y Centro
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.96; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        addSymmetricNode(p0x, p0y, 0, 'large');
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos Estratégicos (Forzados para densidad inicial)
        // ─────────────────────────────────────────────────────────────────
        
        const pathSteps = 2;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const px = p0x + (centerX - p0x) * t;
            const py = p0y + (centerY - p0y) * t;
            const offset = (i === 1 ? 400 : -400); // Zig-zag amplio
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 60, 180)) {
                addSymmetricNode(jx, jy, -1, i === 1 ? 'large' : 'medium');
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Lógica de Relleno Temático
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'GALAXY_SPIRAL') {
            const points = 4;
            for (let i = 1; i <= points; i++) {
                const t = i / (points + 1);
                const angle = baseStartAngle + (t * 2.2 * Math.PI);
                const dist = 600 + (t * (baseDist - 1000));
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'SOLAR');
                }
            }
        } else if (mapType === 'NEBULA_CHANNELS') {
            for (let i = 0; i < 3; i++) {
                const a = baseStartAngle + (i + 1) * (Math.PI / 4);
                const d = mapRadius * 0.5;
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'CONSTELLATION');
                }
            }
        } else if (mapType === 'SOLAR_SYSTEMS') {
            for (let k = 0; k < 3; k++) {
                const a = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const d = 800 + Math.random() * (baseDist - 1400);
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'SOLAR');
                }
            }
        } else {
            // Estilo por defecto/Clusters
            for (let k = 0; k < 4; k++) {
                const a = baseStartAngle + (Math.random() * (Math.PI / playerCount));
                const d = mapRadius * 0.45;
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'CLUSTER');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Periferia profunda)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 4; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.25);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                if (Math.hypot(px - (centerX + baseDist * Math.cos(pA)), py - (centerY + baseDist * Math.sin(pA))) < 900) {
                    far = false; break;
                }
            }
            if (far && isValid(px, py, 25, 100)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.7 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Cleanup
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 40) {
                    tooClose = true; break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
