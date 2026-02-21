import { Node } from './Node.js';

const MAP_TYPES = ['GALAXY_SPIRAL', 'CONSTELLATION_NET', 'SOLAR_SYSTEMS', 'ORBITAL_RINGS', 'DEEP_SPACE_CLUSTERS'];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minNodes = playerCount * 4;
        const maxNodes = playerCount * 7;
        let attempts = 0;

        // Bucle de reintento para garantizar la densidad solicitada
        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 15) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated cosmic map with ${finalNodes.length} nodes (Target: ${minNodes}-${maxNodes}).`);
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
        
        const MIN_NODE_DIST = 260; 

        const isValid = (x, y, r, extraMargin = 120) => {
            const margin = 80; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 35;
                if (dist < physicalLimit) return false;
                
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 600) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 10) {
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

        // Crea formaciones temáticas (Sistema Solar, Constelación, Galaxia)
        const createCosmicFormation = (cx, cy, owner, theme = 'SOLAR') => {
            if (theme === 'SOLAR') {
                // Una estrella central con 1-2 planetas orbitando
                addSymmetricNode(cx, cy, owner, 'large');
                const orbitR = 240;
                const planets = Math.random() > 0.5 ? 2 : 1;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    const px = cx + orbitR * Math.cos(a);
                    const py = cy + orbitR * Math.sin(a);
                    addSymmetricNode(px, py, -1, 'medium');
                }
            } else if (theme === 'CONSTELLATION') {
                // 3 nodos formando un triángulo o línea estirada
                addSymmetricNode(cx, cy, owner, 'medium');
                const dist = 300;
                const angle = Math.random() * Math.PI;
                addSymmetricNode(cx + dist * Math.cos(angle), cy + dist * Math.sin(angle), -1, 'small');
                addSymmetricNode(cx - dist * Math.cos(angle), cy - dist * Math.sin(angle), -1, 'medium');
            } else if (theme === 'CLUSTER') {
                // Grupo denso de 2-3 nodos de varios tamaños
                addSymmetricNode(cx, cy, owner, 'large');
                const angle = Math.random() * Math.PI * 2;
                addSymmetricNode(cx + 180 * Math.cos(angle), cy + 180 * Math.sin(angle), -1, 'medium');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro (Estructura Fija)
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.95; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // Bases: Nodo único Large (Simetría Absoluta)
        addSymmetricNode(p0x, p0y, 0, 'large');

        // Centro: Super Nodo (Objetivo Galáctico)
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos y Conexiones Estratégicas
        // ─────────────────────────────────────────────────────────────────
        
        // Creamos un "puente" o camino claro hacia el centro para guiar el flujo
        const pathSteps = 2;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const px = p0x + (centerX - p0x) * t;
            const py = p0y + (centerY - p0y) * t;
            
            // Jitter para no ser una línea perfecta aburrida
            const offset = (i === 1 ? 350 : -350);
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 55, 200)) {
                addSymmetricNode(jx, jy, -1, i === 1 ? 'large' : 'medium');
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Lógica por Tipo de Mapa (Relleno del espacio vacío)
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'GALAXY_SPIRAL') {
            const points = 3;
            for (let i = 1; i <= points; i++) {
                const t = i / (points + 1);
                const angle = baseStartAngle + (t * 2.0 * Math.PI);
                const dist = 500 + (t * (baseDist - 800));
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'SOLAR');
                }
            }
        } else if (mapType === 'ORBITAL_RINGS') {
            const ringCount = 3;
            for (let i = 0; i < ringCount; i++) {
                const a = baseStartAngle + (Math.PI / playerCount) + (i * Math.PI / 1.5);
                const d = mapRadius * 0.55;
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'CLUSTER');
                }
            }
        } else if (mapType === 'SOLAR_SYSTEMS') {
            for (let k = 0; k < 2; k++) {
                const a = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const d = 600 + Math.random() * (baseDist - 1200);
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 60, MIN_NODE_DIST + 100)) {
                    createCosmicFormation(px, py, -1, 'SOLAR');
                }
            }
        } else {
            // CONSTELLATION_NET / DEFAULT
            for (let k = 0; k < 2; k++) {
                const a = baseStartAngle + (Math.PI / (playerCount * 2)) + (Math.random() * 0.5);
                const d = mapRadius * 0.4;
                const px = centerX + d * Math.cos(a);
                const py = centerY + d * Math.sin(a);
                if (isValid(px, py, 55, MIN_NODE_DIST)) {
                    createCosmicFormation(px, py, -1, 'CONSTELLATION');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Periferia asimétrica)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 4) + 2; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.3 + Math.random() * 0.2);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                if (Math.hypot(px - (centerX + baseDist * Math.cos(pA)), py - (centerY + baseDist * Math.sin(pA))) < 800) {
                    far = false; break;
                }
            }
            if (far && isValid(px, py, 25, 120)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.8 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Cleanup & Count Final
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 50) {
                    tooClose = true; break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
