import { Node } from './Node.js';
import { NODE_TYPES } from './GameConfig.js';

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

        console.log(`Generated massive symmetric map: ${finalNodes.length} nodes after ${attempts} attempts.`);
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
        // 1. Helpers
        // ─────────────────────────────────────────────────────────────────
        
        const isValid = (x, y, r, extraMargin = 100) => {
            const margin = 80; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const physicalLimit = r + n.radius + 30;
                if (dist < physicalLimit) return false;
                
                // Base exclusion
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
            
            if (baseDist < 50) return false; // Reserved for Omega

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
                const centerType = Math.random() > 0.7 ? NODE_TYPES.ULTRA : NODE_TYPES.LARGE;
                addSymmetricNode(cx, cy, owner, centerType);
                const planets = 2;
                for(let i=0; i<planets; i++) {
                    const a = (Math.PI * 2 / planets) * i + Math.random();
                    addSymmetricNode(cx + 350 * Math.cos(a), cy + 350 * Math.sin(a), -1, NODE_TYPES.MEDIUM);
                }
            } else if (activeTheme === 'CROSS') {
                addSymmetricNode(cx, cy, owner, NODE_TYPES.LARGE);
                const d = 350;
                addSymmetricNode(cx + d, cy, -1, NODE_TYPES.MEDIUM);
                addSymmetricNode(cx - d, cy, -1, NODE_TYPES.MEDIUM);
                addSymmetricNode(cx, cy + d, -1, NODE_TYPES.MEDIUM);
                addSymmetricNode(cx, cy - d, -1, NODE_TYPES.MEDIUM);
            } else if (activeTheme === 'CIRCLE') {
                addSymmetricNode(cx, cy, owner, NODE_TYPES.MEGA);
                const satellites = 6;
                for(let i=0; i<satellites; i++) {
                    const a = (Math.PI * 2 / satellites) * i;
                    addSymmetricNode(cx + 380*Math.cos(a), cy + 380*Math.sin(a), -1, NODE_TYPES.SMALL);
                }
            } else if (activeTheme === 'HEXAGON') {
                const hexDist = 300;
                for(let i=0; i<6; i++) {
                    const a = (Math.PI * 2 / 6) * i;
                    addSymmetricNode(cx + hexDist * Math.cos(a), cy + hexDist * Math.sin(a), -1, NODE_TYPES.MEDIUM);
                }
            } else if (activeTheme === 'STAR') {
                addSymmetricNode(cx, cy, owner, NODE_TYPES.LARGE);
                for(let i=0; i<5; i++) {
                    const a = (Math.PI * 2 / 5) * i;
                    addSymmetricNode(cx + 420*Math.cos(a), cy + 420*Math.sin(a), -1, NODE_TYPES.SMALL);
                }
            } else {
                addSymmetricNode(cx - 200, cy, owner, NODE_TYPES.LARGE);
                addSymmetricNode(cx + 200, cy, owner, NODE_TYPES.LARGE);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Base y Centro (EL CORAZÓN OMEGA)
        // ─────────────────────────────────────────────────────────────────
        
        // El Omega SIEMPRE en el centro
        nodes.push(new Node(idCounter++, centerX, centerY, -1, NODE_TYPES.OMEGA));

        const baseDistActual = mapRadius * 0.95; 
        addSymmetricNode(centerX + baseDistActual * Math.cos(baseStartAngle), centerY + baseDistActual * Math.sin(baseStartAngle), 0, NODE_TYPES.LARGE);

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
            
            const offset = (i % 2 === 0 ? 500 : -500);
            const a = baseStartAngle + Math.PI/2;
            const jx = px + offset * Math.cos(a);
            const jy = py + offset * Math.sin(a);
            
            if (isValid(jx, jy, 80, 250)) {
                const type = i === 2 ? NODE_TYPES.MEGA : NODE_TYPES.MEDIUM;
                addSymmetricNode(jx, jy, -1, type);
            }
        }

        const sectors = playerCount === 2 ? 6 : playerCount * 2;
        for (let k = 0; k < sectors; k++) {
            const angle = baseStartAngle + (k * (Math.PI * 2 / sectors)) + (Math.PI/sectors);
            const d = mapRadius * 0.65;
            const px = centerX + d * Math.cos(angle);
            const py = centerY + d * Math.sin(angle);
            if (isValid(px, py, 80, 300)) {
                createCosmicFormation(px, py, -1);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Perdidos
        // ─────────────────────────────────────────────────────────────────
        
        const lostCount = 6; 
        for (let i = 0; i < lostCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const dist = mapRadius * (1.2 + Math.random() * 0.35);
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            let far = true;
            for (let p = 0; p < playerCount; p++) {
                const pA = baseStartAngle + (p * Math.PI * 2 / playerCount);
                const bx = centerX + baseDistActual * Math.cos(pA);
                const by = centerY + baseDistActual * Math.sin(pA);
                if (Math.hypot(px - bx, py - by) < 800) { far = false; break; }
            }
            if (far && isValid(px, py, 40, 150)) {
                const type = Math.random() > 0.8 ? NODE_TYPES.LARGE : NODE_TYPES.MEDIUM;
                nodes.push(new Node(idCounter++, px, py, -1, type));
            }
        }

        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                const limit = n.type === NODE_TYPES.OMEGA || f.type === NODE_TYPES.OMEGA ? 180 : 60;
                if (Math.hypot(n.x - f.x, n.y - f.y) < n.radius + f.radius + limit) {
                    tooClose = true; break;
                }
            }
            if (!tooClose) finalNodes.push(n);
        }
        
        finalNodes.forEach((n, idx) => n.id = idx);
        return finalNodes;
    }
}
