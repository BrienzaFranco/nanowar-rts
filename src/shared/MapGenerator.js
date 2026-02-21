import { Node } from './Node.js';

const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_NET', 'SOLAR_SYSTEMS', 
    'ORBITAL_RINGS', 'DEEP_SPACE_CLUSTERS', 'NEBULA_CHANNELS',
    'ASTEROID_BELT', 'DUAL_CORE', 'FRACTAL_BRANCHES'
];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minNodes = playerCount * 4;
        const maxNodes = playerCount * 7;
        let attempts = 0;

        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 30) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated unique map: ${finalNodes.length} nodes after ${attempts} attempts.`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight, maxAllowed) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.45;

        // Aleatoriedad Total: El ángulo de inicio ahora es libre
        const baseStartAngle = Math.random() * Math.PI * 2;
        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers
        // ─────────────────────────────────────────────────────────────────
        
        const isValid = (x, y, r, extraMargin = 120) => {
            const margin = 100; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 35;
                if (dist < physicalLimit) return false;
                
                // Zona de exclusión de bases
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 450) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 20) {
                if (isValid(centerX, centerY, 80, 50)) {
                    nodes.push(new Node(idCounter++, centerX, centerY, -1, type));
                    return true;
                }
                return false;
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
            const themes = ['SOLAR', 'CONSTELLATION', 'CLUSTER', 'DIAMOND', 'RING'];
            const activeTheme = theme || themes[Math.floor(Math.random() * themes.length)];

            if (activeTheme === 'SOLAR') {
                addSymmetricNode(cx, cy, owner, 'large');
                const planets = Math.floor(Math.random() * 2) + 1;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    const d = 280;
                    addSymmetricNode(cx + d * Math.cos(a), cy + d * Math.sin(a), -1, 'medium');
                }
            } else if (activeTheme === 'CONSTELLATION') {
                const angle = Math.random() * Math.PI * 2;
                addSymmetricNode(cx, cy, owner, 'medium');
                addSymmetricNode(cx + 350 * Math.cos(angle), cy + 350 * Math.sin(angle), -1, 'medium');
                addSymmetricNode(cx + 350 * Math.cos(angle + 0.8), cy + 350 * Math.sin(angle + 0.8), -1, 'small');
            } else if (activeTheme === 'DIAMOND') {
                addSymmetricNode(cx, cy, owner, 'large');
                const d = 300;
                addSymmetricNode(cx + d, cy, -1, 'small');
                addSymmetricNode(cx - d, cy, -1, 'small');
                addSymmetricNode(cx, cy + d, -1, 'small');
                addSymmetricNode(cx, cy - d, -1, 'small');
            } else if (activeTheme === 'RING') {
                addSymmetricNode(cx, cy, owner, 'medium');
                for(let i=0; i<3; i++) {
                    const a = (Math.PI * 2 / 3) * i;
                    addSymmetricNode(cx + 250*Math.cos(a), cy + 250*Math.sin(a), -1, 'small');
                }
            } else {
                addSymmetricNode(cx, cy, owner, 'large');
                addSymmetricNode(cx + 220, cy + 220, -1, 'medium');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Jugadores y Centro
        // ─────────────────────────────────────────────────────────────────
        
        const baseDistActual = mapRadius * (0.92 + Math.random() * 0.06); 
        const p0x = centerX + baseDistActual * Math.cos(baseStartAngle);
        const p0y = centerY + baseDistActual * Math.sin(baseStartAngle);

        addSymmetricNode(p0x, p0y, 0, 'large');

        // Centro: Super Nodo o Estrellas Binarias
        if (mapType === 'DUAL_CORE') {
            const offset = 400;
            const a = baseStartAngle + Math.PI/playerCount;
            addSymmetricNode(centerX + offset * Math.cos(a), centerY + offset * Math.sin(a), -1, 'large');
        } else {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos y Relleno Simétrico
        // ─────────────────────────────────────────────────────────────────
        
        // Caminos procedimentales al centro
        const pathSteps = Math.floor(Math.random() * 2) + 2;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const px = p0x + (centerX - p0x) * t;
            const py = p0y + (centerY - p0y) * t;
            const offset = (Math.random() - 0.5) * 800;
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 60, 250)) {
                if (Math.random() > 0.5) {
                    createCosmicFormation(jx, jy, -1, 'CONSTELLATION');
                } else {
                    addSymmetricNode(jx, jy, -1, 'medium');
                }
            }
        }

        // Relleno de "Sectores Vacíos" (Entre brazos/caminos)
        for (let k = 0; k < 5; k++) {
            const angle = baseStartAngle + (Math.PI / playerCount) + (Math.random() - 0.5) * 1.5;
            const dist = 600 + Math.random() * (baseDistActual - 1000);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            if (isValid(px, py, 60, 300)) {
                createCosmicFormation(px, py, -1);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Lógica de Relleno Temático
        // ─────────────────────────────────────────────────────────────────

        if (mapType === 'ASTEROID_BELT') {
            const beltCount = 6;
            for (let i = 0; i < beltCount; i++) {
                const a = baseStartAngle + (i + 0.5) * (Math.PI / (beltCount / 2));
                const d = mapRadius * 0.5;
                if (isValid(centerX + d*Math.cos(a), centerY + d*Math.sin(a), 40, 200)) {
                    addSymmetricNode(centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'medium');
                }
            }
        } else if (mapType === 'FRACTAL_BRANCHES') {
            const angle = baseStartAngle + (Math.PI / (playerCount * 2));
            const d = mapRadius * 0.7;
            if (isValid(centerX + d*Math.cos(angle), centerY + d*Math.sin(angle), 60, 250)) {
                createCosmicFormation(centerX + d*Math.cos(angle), centerY + d*Math.sin(angle), -1, 'DIAMOND');
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Asimétricos)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 5; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.4);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                if (Math.hypot(px - (centerX + baseDistActual * Math.cos(pA)), py - (centerY + baseDistActual * Math.sin(pA))) < 800) {
                    far = false; break;
                }
            }
            if (far && isValid(px, py, 25, 120)) {
                nodes.push(new Node(idCounter++, px, py, -1, 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Limpieza
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
