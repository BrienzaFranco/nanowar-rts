import { Node } from './Node.js';

const MAP_TYPES = ['SPIRAL_GALAXY', 'CONSTELLATIONS', 'SOLAR_CLUSTERS', 'RING_GALAXY', 'CROSSROADS'];

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
        
        const MIN_NODE_DIST = 150; // Aumentado ligeramente para más espacio

        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 80; // Margen menor para permitir nodos "perdidos" cerca del borde
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
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

        const createCluster = (cx, cy, owner, mainType) => {
            addSymmetricNode(cx, cy, owner, mainType);
            const satelliteCount = Math.floor(Math.random() * 3) + 1;
            const orbitRadius = mainType === 'large' ? 140 : 110;

            for (let i = 0; i < satelliteCount; i++) {
                const angle = (Math.PI * 2 / satelliteCount) * i + Math.random();
                const px = cx + orbitRadius * Math.cos(angle);
                const py = cy + orbitRadius * Math.sin(angle);
                const subType = mainType === 'large' ? (Math.random() > 0.5 ? 'medium' : 'small') : 'small';
                addSymmetricNode(px, py, owner, subType);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro
        // ─────────────────────────────────────────────────────────────────
        
        // Aumentada la distancia de spawn (era 0.88)
        const baseDist = mapRadius * 0.92; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        createCluster(p0x, p0y, 0, 'large');

        const centerType = Math.random() > 0.5 ? 'super' : 'large';
        nodes.push(new Node(idCounter++, centerX, centerY, -1, centerType));

        // ─────────────────────────────────────────────────────────────────
        // 3. Lógica de Tipos de Mapa
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 3; 
            const twist = 1.3;
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * twist * Math.PI);
                const dist = 450 + (t * (baseDist - 650));
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCluster(px, py, -1, 'large');
                }
            }
        } else if (mapType === 'CONSTELLATIONS') {
            const steps = 3;
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x * (1 - t) + centerX * t;
                const py = p0y * (1 - t) + centerY * t;
                const offAngle = baseStartAngle + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 450;
                const jx = px + offset * Math.cos(offAngle);
                const jy = py + offset * Math.sin(offAngle);
                if (isValid(jx, jy, 55, MIN_NODE_DIST)) {
                    createCluster(jx, jy, -1, 'medium');
                }
            }
        } else if (mapType === 'RING_GALAXY') {
            const ringNodes = 4;
            for (let i = 0; i < ringNodes; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * (Math.PI / ringNodes));
                const dist = mapRadius * 0.55;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 55, MIN_NODE_DIST)) {
                    createCluster(px, py, -1, 'medium');
                }
            }
        } else if (mapType === 'SOLAR_CLUSTERS') {
            for (let k = 0; k < 3; k++) {
                const angle = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const dist = 450 + Math.random() * (baseDist - 700);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST + 80)) {
                    createCluster(px, py, -1, 'large');
                }
            }
        } else if (mapType === 'CROSSROADS') {
            const midAngle = baseStartAngle + (Math.PI / playerCount);
            const px = centerX + (mapRadius * 0.6) * Math.cos(midAngle);
            const py = centerY + (mapRadius * 0.6) * Math.sin(midAngle);
            if (isValid(px, py, 60, MIN_NODE_DIST)) {
                createCluster(px, py, -1, 'large');
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Nodos Perdidos (Asimétricos y detrás de los jugadores)
        // ─────────────────────────────────────────────────────────────────
        
        if (Math.random() > 0.3) { // 70% de probabilidad de que aparezcan
            const lostCount = Math.floor(Math.random() * 3) + 1; // 1 a 3 nodos perdidos totales
            for (let i = 0; i < lostCount; i++) {
                // Elegir un ángulo aleatorio en el mundo
                const angle = Math.random() * Math.PI * 2;
                // Distancia muy alejada (detrás de las bases habituales)
                const dist = mapRadius * (1.0 + Math.random() * 0.15);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                
                // Estos nodos son pequeños y están "solos" (sin simetría)
                if (isValid(px, py, 20, 100)) {
                    nodes.push(new Node(idCounter++, px, py, -1, 'small'));
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Limpieza Final (Overlap Protection)
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 75) {
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
