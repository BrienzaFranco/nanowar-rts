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
        // mapRadius ligeramente reducido para alejarse de los bordes finales
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.42;

        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación y Simetría
        // ─────────────────────────────────────────────────────────────────
        
        // Espaciado masivo para que el viaje sea largo y determinante
        const MIN_NODE_DIST = 280; 

        const isValid = (x, y, r, extraMargin = 150) => {
            const margin = 100; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 30;
                if (dist < physicalLimit) return false;
                
                // Zona de exclusión de bases MUY grande (650 unidades)
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 650) : extraMargin;
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
            // Órbitas más amplias para evitar amontonamiento
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
                const count = Math.floor(Math.random() * 2 + 1); // Menos satélites para más espacio
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
        
        // Bases en el extremo máximo (96% del radio del mapa)
        const baseDist = mapRadius * 0.96; 
        const baseStartAngle = -Math.PI / 2;
        const p0x = centerX + baseDist * Math.cos(baseStartAngle);
        const p0y = centerY + baseDist * Math.sin(baseStartAngle);

        addSymmetricNode(p0x, p0y, 0, 'large');

        // Centro: Siempre con buen espacio alrededor
        const centerStyle = Math.random();
        if (centerStyle > 0.7) {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
            const satellites = 3;
            for(let i=0; i<satellites; i++) {
                const a = (Math.PI * 2 / satellites) * i;
                nodes.push(new Node(idCounter++, centerX + 350*Math.cos(a), centerY + 350*Math.sin(a), -1, 'medium'));
            }
        } else if (centerStyle > 0.35) {
            createFormGroup(centerX, centerY, -1, 'large', 'TRIANGLE');
        } else {
            createFormGroup(centerX, centerY, -1, 'medium', 'LINE');
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Lógica de Tipos de Mapa (Espaciada)
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'SPIRAL_GALAXY') {
            const armPoints = 4; // Menos puntos para más vacío
            for (let i = 1; i <= armPoints; i++) {
                const t = i / (armPoints + 1);
                const angle = baseStartAngle + (t * 1.6 * Math.PI);
                const dist = 600 + (t * (baseDist - 1000)); // Gran salto inicial desde el centro
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST)) {
                    createFormGroup(px, py, -1, i % 2 === 0 ? 'large' : 'medium', 'LINE');
                }
            }
        } else if (mapType === 'CONSTELLATIONS') {
            const steps = 4; // Menos pasos intermedios
            for (let i = 1; i < steps; i++) {
                const t = i / steps;
                const px = p0x * (1 - t) + centerX * t;
                const py = p0y * (1 - t) + centerY * t;
                const offset = (Math.random() - 0.5) * 800; // Zig-zags más anchos
                const jx = px + offset * Math.cos(baseStartAngle + Math.PI/2);
                const jy = py + offset * Math.sin(baseStartAngle + Math.PI/2);
                if (isValid(jx, jy, 55, MIN_NODE_DIST)) {
                    createFormGroup(jx, jy, -1, 'medium', 'LINE');
                }
            }
        } else if (mapType === 'VOID_ISLANDS') {
            const islandCount = 4;
            for (let i = 0; i < islandCount; i++) {
                const angle = baseStartAngle + (Math.PI / playerCount) + (i * Math.PI / 2);
                const dist = mapRadius * 0.6;
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 70, 350)) {
                    createFormGroup(px, py, -1, 'large', 'TRIANGLE');
                }
            }
        } else if (mapType === 'GRID_NETWORK') {
            for(let x = -1; x <= 1; x++) {
                for(let y = -1; y <= 1; y++) {
                    if (x === 0 && y === 0) continue;
                    const px = centerX + x * 900;
                    const py = centerY + y * 800;
                    
                    const dx = px - centerX;
                    const dy = py - centerY;
                    const angle = Math.atan2(dy, dx);
                    const sectorAngle = (Math.PI * 2) / playerCount;
                    const relAngle = (angle - baseStartAngle + Math.PI * 4) % (Math.PI * 2);
                    
                    if (relAngle < sectorAngle && isValid(px, py, 50, 200)) {
                        addSymmetricNode(px, py, -1, 'medium');
                    }
                }
            }
        } else {
            // Solar Clusters dispersos
            for (let k = 0; k < 3; k++) {
                const angle = baseStartAngle + (Math.random() * (Math.PI * 2 / playerCount));
                const dist = 600 + Math.random() * (baseDist - 1200);
                const px = centerX + dist * Math.cos(angle);
                const py = centerY + dist * Math.sin(angle);
                if (isValid(px, py, 60, MIN_NODE_DIST + 100)) {
                    createFormGroup(px, py, -1, 'large', 'CLUSTER');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Nodos Perdidos (Asimétricos y ultra-alejados)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = Math.floor(Math.random() * 4) + 2; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.3); // Aún más lejos
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let farFromPlayers = true;
            for (let p = 0; p < playerCount; p++) {
                const pAngle = baseStartAngle + (p * Math.PI * 2 / playerCount);
                const bx = centerX + baseDist * Math.cos(pAngle);
                const by = centerY + baseDist * Math.sin(pAngle);
                if (Math.hypot(px - bx, py - by) < 900) { // Mínimo 900 de cualquier base
                    farFromPlayers = false;
                    break;
                }
            }

            if (farFromPlayers && isValid(px, py, 25, 150)) {
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
                // Margen de limpieza mayor
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
