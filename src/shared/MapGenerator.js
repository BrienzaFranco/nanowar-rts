import { Node } from './Node.js';

const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_WEB', 'SOLAR_SYSTEMS', 
    'ORBITAL_RINGS', 'VOID_ISLANDS', 'NEBULA_CHANNELS',
    'ASTEROID_BELT', 'DUAL_CORE', 'FRACTAL_BRANCHES'
];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minNodes = playerCount * 6; 
        const maxNodes = playerCount * 14;
        let attempts = 0;

        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 35) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated stabilized map: ${finalNodes.length} nodes after ${attempts} attempts.`);
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
                const physicalLimit = r + n.radius + 30; // Espacio físico mínimo
                if (dist < physicalLimit) return false;
                
                // Exclusión de bases (Muy grande para el inicio)
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 480) : extraMargin;
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
            const themes = ['SOLAR', 'CROSS', 'CIRCLE', 'HEXAGON', 'STAR', 'BINARY'];
            const activeTheme = theme || themes[Math.floor(Math.random() * themes.length)];

            if (activeTheme === 'SOLAR') {
                const centerType = Math.random() > 0.7 ? 'ultra' : 'large';
                addSymmetricNode(cx, cy, owner, centerType);
                const planets = 2;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    addSymmetricNode(cx + 280 * Math.cos(a), cy + 280 * Math.sin(a), -1, 'medium');
                }
            } else if (activeTheme === 'CROSS') {
                addSymmetricNode(cx, cy, owner, 'large');
                const d = 300;
                addSymmetricNode(cx + d, cy, -1, 'medium');
                addSymmetricNode(cx - d, cy, -1, 'medium');
                addSymmetricNode(cx, cy + d, -1, 'medium');
                addSymmetricNode(cx, cy - d, -1, 'medium');
            } else if (activeTheme === 'CIRCLE') {
                addSymmetricNode(cx, cy, owner, 'mega');
                const satellites = 6;
                for(let i=0; i<satellites; i++) {
                    const a = (Math.PI * 2 / satellites) * i;
                    addSymmetricNode(cx + 320*Math.cos(a), cy + 320*Math.sin(a), -1, 'small');
                }
            } else if (activeTheme === 'HEXAGON') {
                const hexDist = 250;
                for(let i=0; i<6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    addSymmetricNode(cx + hexDist * Math.cos(a), cy + hexDist * Math.sin(a), -1, 'medium');
                }
            } else if (activeTheme === 'STAR') {
                addSymmetricNode(cx, cy, owner, 'large');
                for(let i=0; i<5; i++) {
                    const a = (Math.PI * 2 / 5) * i;
                    addSymmetricNode(cx + 380*Math.cos(a), cy + 380*Math.sin(a), -1, 'small');
                }
            } else {
                addSymmetricNode(cx - 150, cy, owner, 'large');
                addSymmetricNode(cx + 150, cy, owner, 'large');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro
        // ─────────────────────────────────────────────────────────────────
        
        const baseDistActual = mapRadius * 0.95; 
        addSymmetricNode(centerX + baseDistActual * Math.cos(baseStartAngle), centerY + baseDistActual * Math.sin(baseStartAngle), 0, 'large');

        // Centro: Omega o Ultra
        const centerType = Math.random() > 0.6 ? 'omega' : 'ultra';
        addSymmetricNode(centerX, centerY, -1, centerType);

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos y Relleno
        // ─────────────────────────────────────────────────────────────────
        
        const pathSteps = 3;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const bx = centerX + baseDistActual * Math.cos(baseStartAngle);
            const by = centerY + baseDistActual * Math.sin(baseStartAngle);
            const px = bx + (centerX - bx) * t;
            const py = by + (centerY - by) * t;
            
            const offset = (i % 2 === 0 ? 400 : -400);
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 80, 200)) {
                const type = i === 2 ? 'mega' : 'medium';
                addSymmetricNode(jx, jy, -1, type);
            }
        }

        // Relleno de Sectores
        const sectors = playerCount === 2 ? 6 : playerCount * 2;
        for (let k = 0; k < sectors; k++) {
            const angle = baseStartAngle + (k * (Math.PI * 2 / sectors)) + (Math.PI/sectors);
            const d = mapRadius * 0.6;
            const px = centerX + d * Math.cos(angle);
            const py = centerY + d * Math.sin(angle);
            if (isValid(px, py, 60, 250)) {
                createCosmicFormation(px, py, -1);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Nodos Perdidos (Asimétricos)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 6; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.3);
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
                const type = Math.random() > 0.8 ? 'large' : 'medium';
                nodes.push(new Node(idCounter++, px, py, -1, type));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Cleanup
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
