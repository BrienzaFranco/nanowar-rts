import { Node } from './Node.js';

const MAP_TYPES = ['SPIRAL_GALAXY', 'CONSTELLATIONS', 'SOLAR_CLUSTERS', 'RING_GALAXY', 'CROSSROADS', 'VOID_ISLANDS', 'GRID_NETWORK'];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minRequiredNodes = playerCount * 4;
        let attempts = 0;

        while (finalNodes.length < minRequiredNodes && attempts < 10) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight);
        }

        console.log(`Generated massive symmetric map with ${finalNodes.length} nodes.`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.42;

        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación y Simetría
        // ─────────────────────────────────────────────────────────────────
        
        const MIN_NODE_DIST = 280; 

        const isValid = (x, y, r, extraMargin = 150) => {
            const margin = 100; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 30;
                if (dist < physicalLimit) return false;
                
                // Exclusión de bases: ligeramente reducida para permitir el inicio de caminos estratégicos
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 550) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 5) {
                nodes.push(new Node(idCounter++, centerX, centerY, -1, type));
                return;
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
        };

        const createFormGroup = (cx, cy, owner, mainType, formType = 'CLUSTER') => {
            addSymmetricNode(cx, cy, owner, mainType);
            let points = [];
            const orbitRadius = mainType === 'large' ? 220 : 160;

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
                const count = Math.floor(Math.random() * 2 + 1);
                for (let i = 0; i < count; i++) {
                    points.push({ a: (Math.PI * 2 / (count+1)) * i + Math.random(), d: orbitRadius });
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
        
        const baseDist = mapRadius * 0.96; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        addSymmetricNode(p0x, p0y, 0, 'large');

        // Centro: Super nodo siempre presente
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
        // Pequeño anillo simétrico alrededor
        for(let i=0; i<3; i++) {
            const a = (Math.PI * 2 / 3) * i;
            nodes.push(new Node(idCounter++, centerX + 400*Math.cos(a), centerY + 400*Math.sin(a), -1, 'medium'));
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos Estratégicos Base -> Centro
        // ─────────────────────────────────────────────────────────────────
        
        const hasPath = Math.random() > 0.15; // 85% de probabilidad de camino claro
        if (hasPath) {
            const pathStyle = Math.random();
            const steps = 3;
            for (let i = 1; i <= steps; i++) {
                const t = i / (steps + 1);
                const px = p0x + (centerX - p0x) * t;
                const py = p0y + (centerY - p0y) * t;
                
                let jx = px, jy = py;
                if (pathStyle > 0.6) {
                    // Estilo A: Cadena zig-zag (Sinuosa)
                    const offAngle = baseStartAngle + Math.PI / 2;
                    const offset = (i % 2 === 0 ? 300 : -300);
                    jx += offset * Math.cos(offAngle);
                    jy += offset * Math.sin(offAngle);
                } else if (pathStyle > 0.3) {
                    // Estilo B: Escalonada (Nodos intermedios claros)
                    // (Sin offset, solo t puro)
                } else {
                    // Estilo C: Cúmulos conectores (Nodos que sirven de hubs)
                    if (i === 2) { // Solo en el medio
                        createFormGroup(jx, jy, -1, 'large', 'TRIANGLE');
                        continue;
                    }
                }
                
                if (isValid(jx, jy, 55, 200)) {
                    addSymmetricNode(jx, jy, -1, 'medium');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Lógica de Tipos de Mapa (Capa extra de complejidad)
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 3; 
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * 1.8 * Math.PI);
                const dist = 800 + (t * (baseDist - 1200)); 
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createFormGroup(px, py, -1, 'medium', 'LINE');
                }
            }
        } else if (mapType === 'VOID_ISLANDS') {
            const islandCount = 4;
            for (let i = 0; i < islandCount; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * Math.PI / 2);
                const dist = mapRadius * 0.75;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 70, 400)) {
                    createFormGroup(px, py, -1, 'large', 'TRIANGLE');
                }
            }
        } else if (mapType === 'GRID_NETWORK') {
            // Reforzamos la red geométrica pero manteniendo los pasillos
            for(let x = -1; x <= 1; x++) {
                for(let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) continue;
                    const px = centerX + x * 1200;
                    const py = centerY + y * 1000;
                    const dx = px - centerX;
                    const dy = py - centerY;
                    const angle = Math.atan2(dy, dx);
                    const sectorAngle = (Math.PI * 2) / playerCount;
                    const relAngle = (angle - baseStartAngle + Math.PI * 4) % (Math.PI * 2);
                    
                    if (relAngle < sectorAngle && isValid(px, py, 50, 250)) {
                        addSymmetricNode(px, py, -1, 'medium');
                    }
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Periferia profunda)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 4) + 2; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.25 + Math.random() * 0.3);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let farFromPlayers = true;
            for (let p = 0; p < playerCount; p++) {
                const pAngle = baseStartAngle + (p * Math.PI * 2 / playerCount);
                const bx = centerX + baseDist * Math.cos(pAngle);
                const by = centerY + baseDist * Math.sin(pAngle);
                if (Math.hypot(px - bx, py - by) < 1000) {
                    farFromPlayers = false;
                    break;
                }
            }

            if (farFromPlayers && isValid(px, py, 25, 150)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.8 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Limpieza
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 60) {
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
