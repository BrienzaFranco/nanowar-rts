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
        console.log(`Generating dense map: ${mapType} for ${playerCount} players.`);

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
                // Permite un pequeño solapamiento de áreas de influencia (radius + extraMargin)
                // pero nunca solapamiento físico de nodos (r + n.radius)
                const physicalLimit = r + n.radius + 15; // Mínimo espacio físico absoluto
                if (dist < physicalLimit) return false;
                if (dist < r + n.radius + extraMargin) return false;
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
                // CLUSTER estándar
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
        
        const baseDist = mapRadius * 0.94; // Más lejos de los demás
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // Bases ahora pueden tener forma de triángulo o línea
        const baseForm = Math.random() > 0.5 ? 'TRIANGLE' : 'CLUSTER';
        createFormGroup(p0x, p0y, 0, 'large', baseForm);

        // Centro dinámico
        const centerStyle = Math.random();
        if (centerStyle > 0.7) {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
            // Pequeño anillo protector
            for(let i=0; i<3; i++) {
                const a = (Math.PI * 2 / 3) * i;
                nodes.push(new Node(idCounter++, centerX + 200*Math.cos(a), centerY + 200*Math.sin(a), -1, 'medium'));
            }
        } else if (centerStyle > 0.35) {
            createFormGroup(centerX, centerY, -1, 'large', 'TRIANGLE');
        } else {
            createFormGroup(centerX, centerY, -1, 'medium', 'LINE');
            // Nodos extra en los laterales del centro
            nodes.push(new Node(idCounter++, centerX, centerY + 200, -1, 'medium'));
            nodes.push(new Node(idCounter++, centerX, centerY - 200, -1, 'medium'));
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Lógica de Tipos de Mapa
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 6;
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * 1.5 * Math.PI);
                const dist = 350 + (t * (baseDist - 550));
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, 100)) {
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
                if (isValid(jx, jy, 55, 90)) {
                    createFormGroup(jx, jy, -1, 'medium', 'LINE');
                }
            }
        } else if (mapType === 'VOID_ISLANDS') {
            // Grandes islas separadas
            for (let i = 0; i < 4; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * Math.PI / 2);
                const dist = mapRadius * 0.7;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 70, 150)) {
                    createFormGroup(px, py, -1, 'large', 'TRIANGLE');
                }
            }
        } else if (mapType === 'GRID_NETWORK') {
            // Estructura más geométrica
            for(let x = -1; x <= 1; x++) {
                for(let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) continue;
                    const px = centerX + x * 600;
                    const py = centerY + y * 500;
                    // Solo si está en el sector de P0 para mantener simetría
                    const dx = px - centerX;
                    const dy = py - centerY;
                    const angle = Math.atan2(dy, dx);
                    const sectorAngle = (Math.PI * 2) / playerCount;
                    const relAngle = (angle - baseStartAngle + Math.PI * 4) % (Math.PI * 2);
                    
                    if (relAngle < sectorAngle && isValid(px, py, 50, 80)) {
                        addSymmetricNode(px, py, -1, 'medium');
                    }
                }
            }
        } else {
            // Default: Solar Clusters densos
            for (let k = 0; k < 4; k++) {
                const angle = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const dist = 400 + Math.random() * (baseDist - 600);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, 110)) {
                    createFormGroup(px, py, -1, 'large', 'CLUSTER');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Nodos Perdidos (Lejos de jugadores y asimétricos)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 5) + 3; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            // Distancia extrema, muy lejos del centro y de las bases (usando mapRadius extendido)
            const dist = mapRadius * (1.1 + Math.random() * 0.2);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            // Verificar distancia a TODAS las bases de jugadores
            let farFromPlayers = true;
            for (let p = 0; p < playerCount; p++) {
                const pAngle = baseStartAngle + (p * Math.PI * 2 / playerCount);
                const bx = centerX + baseDist * Math.cos(pAngle);
                const by = centerY + baseDist * Math.sin(pAngle);
                if (Math.hypot(px - bx, py - by) < 600) { // Mínimo 600 unidades de cualquier base
                    farFromPlayers = false;
                    break;
                }
            }

            if (farFromPlayers && isValid(px, py, 25, 60)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.8 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Limpieza Final
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                // Permitir solapamiento visual de áreas pero no físico
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 30) {
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
