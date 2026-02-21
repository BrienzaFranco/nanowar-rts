import { Node } from './Node.js';

const MAP_TYPES = [
    'GALAXY_SPIRAL', 'CONSTELLATION_WEB', 'SOLAR_SYSTEMS', 
    'ORBITAL_RINGS', 'DEEP_SPACE_CLUSTERS', 'NEBULA_CHANNELS',
    'ASTEROID_BELT', 'DUAL_CORE', 'FRACTAL_BRANCHES', 'SUPER_CLUSTER'
];

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        let finalNodes = [];
        const minNodes = playerCount * 8; 
        const maxNodes = playerCount * 16;
        let attempts = 0;

        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 40) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated High-Density Map with OMEGA core: ${finalNodes.length} nodes.`);
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
                const physicalLimit = r + n.radius + 45; // Margen físico mayor para nodos grandes
                if (dist < physicalLimit) return false;
                
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, 550) : extraMargin;
                if (dist < r + n.radius + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            if (baseDist < 50) return false; // El centro está reservado para el Omega

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
                const centerType = Math.random() > 0.6 ? 'ultra' : 'large';
                addSymmetricNode(cx, cy, owner, centerType);
                const planets = 2;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    addSymmetricNode(cx + 400 * Math.cos(a), cy + 400 * Math.sin(a), -1, 'medium');
                }
            } else if (activeTheme === 'PENTAGON') {
                addSymmetricNode(cx, cy, owner, 'mega');
                for(let i=0; i<5; i++) {
                    const a = (Math.PI * 2 / 5) * i;
                    addSymmetricNode(cx + 350*Math.cos(a), cy + 350*Math.sin(a), -1, 'small');
                }
            } else if (activeTheme === 'DIAMOND') {
                addSymmetricNode(cx, cy, owner, 'large');
                const d = 400;
                addSymmetricNode(cx + d, cy, -1, 'medium');
                addSymmetricNode(cx - d, cy, -1, 'medium');
                addSymmetricNode(cx, cy + d, -1, 'medium');
                addSymmetricNode(cx, cy - d, -1, 'medium');
            } else if (activeTheme === 'BINARY') {
                const type = Math.random() > 0.5 ? 'mega' : 'large';
                addSymmetricNode(cx - 200, cy, owner, type);
                addSymmetricNode(cx + 200, cy, owner, type);
            } else if (activeTheme === 'CONSTELLATION') {
                addSymmetricNode(cx, cy, owner, 'large');
                const a = Math.random() * Math.PI * 2;
                addSymmetricNode(cx + 450 * Math.cos(a), cy + 450 * Math.sin(a), -1, 'medium');
                addSymmetricNode(cx + 800 * Math.cos(a + 0.4), cy + 800 * Math.sin(a + 0.4), -1, 'small');
            } else {
                addSymmetricNode(cx, cy, owner, 'mega');
                addSymmetricNode(cx + 350, cy + 350, -1, 'medium');
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Corazón del Mapa: EL NODO OMEGA
        // ─────────────────────────────────────────────────────────────────
        
        // El Omega es intocable en el centro
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'omega'));

        // Bases siempre en los extremos opuestos
        const baseDistActual = mapRadius * 0.96; 
        addSymmetricNode(centerX + baseDistActual * Math.cos(baseStartAngle), centerY + baseDistActual * Math.sin(baseStartAngle), 0, 'large');

        // ─────────────────────────────────────────────────────────────────
        // 3. Caminos Estratégicos y Cinturones (Nueva Escala)
        // ─────────────────────────────────────────────────────────────────
        
        const pathSteps = 3;
        for (let i = 1; i <= pathSteps; i++) {
            const t = i / (pathSteps + 1);
            const bx = centerX + baseDistActual * Math.cos(baseStartAngle);
            const by = centerY + baseDistActual * Math.sin(baseStartAngle);
            const px = bx + (centerX - bx) * t;
            const py = by + (centerY - by) * t;
            
            const offset = (i % 2 === 0 ? 550 : -550);
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 80, 250)) {
                // El medio del camino suele tener un nodo importante (Mega/Ultra)
                const type = i === 2 ? 'mega' : 'medium';
                if (i === 2 && Math.random() > 0.5) {
                    createCosmicFormation(jx, jy, -1, 'SOLAR');
                } else {
                    addSymmetricNode(jx, jy, -1, type);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Relleno de Sectores (Cúmulos Ultra-Masivos)
        // ─────────────────────────────────────────────────────────────────

        const sectors = 8;
        for (let k = 0; k < sectors; k++) {
            const angle = baseStartAngle + (k * (Math.PI * 2 / sectors)) + 0.35;
            const dists = [mapRadius * 0.45, mapRadius * 0.75];
            for(let d of dists) {
                const px = centerX + d * Math.cos(angle);
                const py = centerY + d * Math.sin(angle);
                if (isValid(px, py, 70, 300)) {
                    createCosmicFormation(px, py, -1);
                }
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 5. Nodos Perdidos (Periferia Cósmica)
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 10; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.25 + Math.random() * 0.5);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                if (Math.hypot(px - (centerX + baseDistActual * Math.cos(pA)), py - (centerY + baseDistActual * Math.sin(pA))) < 900) {
                    far = false; break;
                }
            }
            if (far && isValid(px, py, 40, 150)) {
                const type = Math.random() > 0.8 ? 'large' : Math.random() > 0.4 ? 'medium' : 'small';
                nodes.push(new Node(idCounter++, px, py, -1, type));
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 6. Limpieza y Consolidación
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                const combinedR = n.radius + f.radius;
                const margin = n.type === 'omega' || f.type === 'omega' ? 150 : 60;
                if (Math.hypot(n.x - f.x, n.y - f.y) < combinedR + margin) {
                    tooClose = true; break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
