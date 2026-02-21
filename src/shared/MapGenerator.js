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
        
        const MIN_NODE_DIST = 140; // Espacio para que las tropas respiren

        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 120;
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

        // Crea un cúmulo de 2-4 nodos: 1 Grande/Mediano + satélites
        const createCluster = (cx, cy, owner, mainType) => {
            addSymmetricNode(cx, cy, owner, mainType);

            // Determinar cantidad de satélites (1 a 3)
            const satelliteCount = Math.floor(Math.random() * 3) + 1;
            const orbitRadius = mainType === 'large' ? 140 : 110;

            for (let i = 0; i < satelliteCount; i++) {
                const angle = (Math.PI * 2 / satelliteCount) * i + Math.random();
                const px = cx + orbitRadius * Math.cos(angle);
                const py = cy + orbitRadius * Math.sin(angle);
                
                // Jerarquía: Large -> Medium/Small, Medium -> Small
                const subType = mainType === 'large' ? (Math.random() > 0.5 ? 'medium' : 'small') : 'small';
                
                addSymmetricNode(px, py, owner, subType);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.88;
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        // Bases: 1 Large + satélites (Defensa espaciada)
        createCluster(p0x, p0y, 0, 'large');

        // Nodo Central: Super o Large
        const centerType = Math.random() > 0.5 ? 'super' : 'large';
        nodes.push(new Node(idCounter++, centerX, centerY, -1, centerType));

        // ─────────────────────────────────────────────────────────────────
        // 3. Lógica de Tipos de Mapa (Restaurada y Pulida)
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 3; 
            const twist = 1.3;
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * twist * Math.PI);
                const dist = 500 + (t * (baseDist - 700));
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
                const dist = 500 + Math.random() * (baseDist - 800);
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
        // 4. Limpieza Final (Overlap Protection)
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 70) {
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
