import { Node } from './Node.js';

const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_WEB', 'SOLAR_SYSTEMS', 
    'ORBITAL_RINGS', 'DEEP_SPACE_CLUSTERS', 'NEBULA_CHANNELS',
    'ASTEROID_BELT', 'DUAL_CORE', 'FRACTAL_BRANCHES', 'SUPER_CLUSTER'
];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        // Aumentamos drásticamente la densidad mínima y máxima
        const minNodes = playerCount * 7; 
        const maxNodes = playerCount * 15;
        let attempts = 0;

        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 40) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated High-Density Map: ${finalNodes.length} nodes (${attempts} attempts).`);
        return finalNodes;
    }

    static _doGenerate(playerCount, worldWidth, worldHeight, maxAllowed) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;
        const mapRadius = Math.min(worldWidth, worldHeight) * 0.46;

        const baseStartAngle = Math.random() * Math.PI * 2;
        const mapType = MAP_TYPES[Math.floor(Math.random() * MAP_TYPES.length)];

        // ─────────────────────────────────────────────────────────────────
        // 1. Helpers de Colocación
        // ─────────────────────────────────────────────────────────────────
        
        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 80; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 35;
                if (dist < physicalLimit) return false;
                
                // Exclusión de bases (Mantenemos el nodo inicial solo)
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 500) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 25) {
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
            const themes = ['SOLAR', 'CONSTELLATION', 'CLUSTER', 'DIAMOND', 'PENTAGON', 'BINARY'];
            const activeTheme = theme || themes[Math.floor(Math.random() * themes.length)];

            if (activeTheme === 'SOLAR') {
                addSymmetricNode(cx, cy, owner, 'large');
                const planets = 2;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    addSymmetricNode(cx + 300 * Math.cos(a), cy + 300 * Math.sin(a), -1, 'medium');
                }
            } else if (activeTheme === 'PENTAGON') {
                addSymmetricNode(cx, cy, owner, 'large');
                for(let i=0; i<5; i++) {
                    const a = (Math.PI * 2 / 5) * i;
                    addSymmetricNode(cx + 280*Math.cos(a), cy + 280*Math.sin(a), -1, 'small');
                }
            } else if (activeTheme === 'DIAMOND') {
                addSymmetricNode(cx, cy, owner, 'large');
                const d = 320;
                addSymmetricNode(cx + d, cy, -1, 'medium');
                addSymmetricNode(cx - d, cy, -1, 'medium');
                addSymmetricNode(cx, cy + d, -1, 'medium');
                addSymmetricNode(cx, cy - d, -1, 'medium');
            } else if (activeTheme === 'BINARY') {
                addSymmetricNode(cx - 150, cy, owner, 'large');
                addSymmetricNode(cx + 150, cy, owner, 'large');
            } else if (activeTheme === 'CONSTELLATION') {
                addSymmetricNode(cx, cy, owner, 'medium');
                const a = Math.random() * Math.PI * 2;
                addSymmetricNode(cx + 350 * Math.cos(a), cy + 350 * Math.sin(a), -1, 'medium');
                addSymmetricNode(cx + 600 * Math.cos(a + 0.4), cy + 600 * Math.sin(a + 0.4), -1, 'small');
            } else {
                addSymmetricNode(cx, cy, owner, 'large');
                addSymmetricNode(cx + 250, cy + 250, -1, 'medium');
                addSymmetricNode(cx - 250, cy - 250, -1, 'small');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Estructura Central (Super Densa)
        // ─────────────────────────────────────────────────────────────────
        
        const baseDistActual = mapRadius * 0.96; 
        addSymmetricNode(centerX + baseDistActual * Math.cos(baseStartAngle), centerY + baseDistActual * Math.sin(baseStartAngle), 0, 'large');

        // Centro Complejo
        const centerStyle = Math.random();
        if (centerStyle > 0.6) {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'super'));
            for(let i=0; i<4; i++) {
                const a = (Math.PI / 2) * i + Math.PI/4;
                nodes.push(new Node(idCounter++, centerX + 450*Math.cos(a), centerY + 450*Math.sin(a), -1, 'large'));
            }
        } else {
            createCosmicFormation(centerX, centerY, -1, 'DIAMOND');
        }

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos Estratégicos y Cinturones
        // ─────────────────────────────────────────────────────────────────
        
        // Camino de 3-4 pasos al centro
        const pathSteps = 3;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const bx = centerX + baseDistActual * Math.cos(baseStartAngle);
            const by = centerY + baseDistActual * Math.sin(baseStartAngle);
            const px = bx + (centerX - bx) * t;
            const py = by + (centerY - by) * t;
            
            const offset = (i % 2 === 0 ? 450 : -450);
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 60, 200)) {
                createCosmicFormation(jx, jy, -1, i === 2 ? 'SOLAR' : 'BINARY');
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Relleno Masivo de Sectores (Complejidad)
        // ─────────────────────────────────────────────────────────────────

        const sectors = 8;
        for (let k = 0; k < sectors; k++) {
            const angle = baseStartAngle + (k * (Math.PI * 2 / sectors)) + 0.3;
            const dists = [mapRadius * 0.4, mapRadius * 0.7];
            for(let d of dists) {
                const px = centerX + d * Math.cos(angle);
                const py = centerY + d * Math.sin(angle);
                if (isValid(px, py, 60, 250)) {
                    createCosmicFormation(px, py, -1);
                }
            }
        }

        // Lógica Temática Adicional
        if (mapType === 'GALAXY_SPIRAL') {
            const arms = playerCount === 2 ? 2 : playerCount;
            for(let a=0; a<arms; a++) {
                const armAngle = baseStartAngle + (a * (Math.PI * 2 / arms));
                for(let i=1; i<5; i++) {
                    const t = i/5;
                    const d = 600 + t * (baseDistActual - 1000);
                    const ang = armAngle + t * 2.5;
                    const px = centerX + d * Math.cos(ang);
                    const py = centerY + d * Math.sin(ang);
                    if (isValid(px, py, 50, 200)) addSymmetricNode(px, py, -1, 'medium');
                }
            }
        } else if (mapType === 'ASTEROID_BELT') {
            for(let i=0; i<12; i++) {
                const a = (Math.PI * 2 / 12) * i;
                const d = mapRadius * 0.55;
                if (isValid(centerX + d*Math.cos(a), centerY + d*Math.sin(a), 32, 180)) {
                    addSymmetricNode(centerX + d*Math.cos(a), centerY + d*Math.sin(a), -1, 'medium');
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Asimétricos Periféricos)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 8; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.45);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                if (Math.hypot(px - (centerX + baseDistActual * Math.cos(pA)), py - (centerY + baseDistActual * Math.sin(pA))) < 800) {
                    far = false; break;
                }
            }
            if (far && isValid(px, py, 30, 100)) {
                nodes.push(new Node(idCounter++, px, py, -1, Math.random() > 0.6 ? 'medium' : 'small'));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Limpieza y Consolidación
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + 45) {
                    tooClose = true; break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
