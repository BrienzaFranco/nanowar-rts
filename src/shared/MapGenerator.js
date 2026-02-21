import { Node } from './Node.js';

const MAP_TYPES = ['SPIRAL_GALAXY', 'CONSTELLATIONS', 'SOLAR_CLUSTERS', 'RING_GALAXY', 'CROSSROADS'];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.45;

        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];
        console.log(`Generating dense map: ${mapType} for ${playerCount} players.`);

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación y Simetría
        // ─────────────────────────────────────────────────────────────────
        
        const MIN_NODE_DIST = 140; 

        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 60; 
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

        const createCluster = (cx, cy, owner, mainType, densityMult = 1.0) => {
            addSymmetricNode(cx, cy, owner, mainType);
            const satelliteCount = Math.floor((Math.random() * 3 + 2) * densityMult); // 2-4 nodos base
            const orbitRadius = mainType === 'large' ? 140 : 110;

            for (let i = 0; i < satelliteCount; i++) {
                const angle = (Math.PI * 2 / satelliteCount) * i + Math.random();
                const px = cx + orbitRadius * Math.cos(angle);
                const py = cy + orbitRadius * Math.sin(angle);
                const subType = mainType === 'large' ? (Math.random() > 0.4 ? 'medium' : 'small') : 'small';
                addSymmetricNode(px, py, owner, subType);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro (Lógica Mejorada)
        // ─────────────────────────────────────────────────────────────────
        
        const baseDist = mapRadius * 0.92; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        createCluster(p0x, p0y, 0, 'large', 1.2); // Bases un poco más densas

        // --- Variedad en el Centro ---
        const centerStyle = Math.random();
        if (centerStyle > 0.6) {
            // Variante A: Un solo nodo masivo (Super)
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
        } else if (centerStyle > 0.3) {
            // Variante B: Un nodo mediano rodeado de muchos pequeños (Nube central)
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'medium'));
            const satellites = 6;
            for(let i=0; i<satellites; i++) {
                const a = (Math.PI * 2 / satellites) * i;
                const d = 150;
                nodes.push(new Node(idCounter++, centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'small'));
            }
        } else {
            // Variante C: Núcleo de varios nodos medianos
            const coreCount = 3;
            for(let i=0; i<coreCount; i++) {
                const a = (Math.PI * 2 / coreCount) * i;
                const d = 120;
                nodes.push(new Node(idCounter++, centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'medium'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Lógica de Tipos de Mapa (Densidad Aumentada)
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 5; // Aumentado de 3 a 5
            const twist = 1.5;
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * twist * Math.PI);
                const dist = 400 + (t * (baseDist - 600));
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST - 20)) {
                    createCluster(px, py, -1, i % 2 === 0 ? 'large' : 'medium');
                }
            }
        } else if (mapType === 'CONSTELLATIONS') {
            const steps = 5; // Aumentado de 3 a 5
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x * (1 - t) + centerX * t;
                const py = p0y * (1 - t) + centerY * t;
                const offAngle = baseStartAngle + Math.PI / 2;
                const offset = (Math.random() - 0.5) * 500;
                const jx = px + offset * Math.cos(offAngle);
                const jy = py + offset * Math.sin(offAngle);
                if (isValid(jx, jy, 55, MIN_NODE_DIST - 10)) {
                    createCluster(jx, jy, -1, 'medium');
                }
            }
        } else if (mapType === 'RING_GALAXY') {
            const ringNodes = 6; // Aumentado de 4 a 6
            for (let i = 0; i < ringNodes; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * (Math.PI / (ringNodes/2)));
                const dist = mapRadius * 0.6;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 55, MIN_NODE_DIST)) {
                    createCluster(px, py, -1, 'medium');
                }
            }
        } else if (mapType === 'SOLAR_CLUSTERS') {
            const clusters = 5; // Aumentado de 3 a 5
            for (let k = 0; k < clusters; k++) {
                const angle = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const dist = 400 + Math.random() * (baseDist - 600);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCluster(px, py, -1, 'large');
                }
            }
        } else if (mapType === 'CROSSROADS') {
            const points = 3;
            for(let i=1; i<=points; i++) {
                const distFactor = (i / (points + 1)) * 0.8;
                const midAngle = baseStartAngle + (Math.PI / playerCount);
                const px = centerX + (mapRadius * distFactor) * Math.cos(midAngle);
                const py = centerY + (mapRadius * distFactor) * Math.sin(midAngle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createCluster(px, py, -1, 'large');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Nodos Perdidos (Más frecuentes)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 6) + 2; // Aumentado de 1-3 a 2-8
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (0.8 + Math.random() * 0.35);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            if (isValid(px, py, 25, 80)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.7 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Limpieza Final (Overlap Protection)
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 60) { // Margen reducido para permitir densidad
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
