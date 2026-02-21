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
        // Densidad mínima: 4 nodos por jugador + centro. 
        // Densidad máxima: 12 nodos por jugador para evitar caos visual.
        const minNodes = Math.max(8, playerCount * 4); 
        const maxNodes = playerCount * 12;
        let attempts = 0;

        while ((finalNodes.length < minNodes || finalNodes.length > maxNodes) && attempts < 50) {
            attempts++;
            finalNodes = this._doGenerate(playerCount, worldWidth, worldHeight, maxNodes);
        }

        console.log(`Generated robust map for ${playerCount} players: ${finalNodes.length} nodes.`);
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
        
        const checkPos = (x, y, r, extraMargin = 60) => {
            const margin = 100; 
            if (x - r < margin || x + r > worldWidth - margin ||
                y - r < margin || y + r > worldHeight - margin) return false;
            
            for (let n of nodes) {
                const dist = Math.hypot(x - n.x, y - n.y);
                const combinedR = r + n.radius;
                
                // Zona de exclusión de bases (Reducida dinámicamente para playerCount alto)
                const baseExclusion = Math.max(300, 500 - playerCount * 20);
                const effectiveMargin = (n.owner !== -1) ? Math.max(extraMargin, baseExclusion) : extraMargin;
                
                if (dist < combinedR + effectiveMargin) return false;
            }
            return true;
        };

        const addSymmetricNode = (baseX, baseY, owner, type) => {
            if (nodes.length >= maxAllowed) return false;

            const dx = baseX - centerX;
            const dy = baseY - centerY;
            const baseDist = Math.sqrt(dx * dx + dy * dy);
            
            // Si es el centro exacto
            if (baseDist < 20) {
                if (checkPos(centerX, centerY, 100, 50)) {
                    nodes.push(new Node(idCounter++, centerX, centerY, -1, type));
                    return true;
                }
                return false;
            }

            const angleStep = (Math.PI * 2) / playerCount;
            const baseAngle = Math.atan2(dy, dx);
            const positions = [];

            // 1. Calcular todas las posiciones primero
            for (let i = 0; i < playerCount; i++) {
                const angle = baseAngle + (i * angleStep);
                const px = centerX + baseDist * Math.cos(angle);
                const py = centerY + baseDist * Math.sin(angle);
                positions.push({ x: px, y: py, owner: (owner === -1 ? -1 : (owner + i) % playerCount) });
            }

            // 2. Validar que ninguna posición colisione con el mapa o entre sí
            for (let i = 0; i < positions.length; i++) {
                const p = positions[i];
                // Check against existing map
                if (!checkPos(p.x, p.y, 40, 40)) return false;
                
                // Check against other clones in this same set
                for (let j = i + 1; j < positions.length; j++) {
                    const p2 = positions[j];
                    if (Math.hypot(p.x - p2.x, p.y - p2.y) < 150) return false;
                }
            }

            // 3. Añadir todos si todo es válido
            for (let p of positions) {
                nodes.push(new Node(idCounter++, p.x, p.y, p.owner, type));
            }
            return true;
        };

        const createCosmicFormation = (cx, cy, owner, theme) => {
            const themes = ['SOLAR', 'CROSS', 'CIRCLE', 'BINARY'];
            const activeTheme = theme || themes[Math.floor(Math.random() * themes.length)];

            if (activeTheme === 'SOLAR') {
                const centerType = Math.random() > 0.7 ? NODE_TYPES.ULTRA : NODE_TYPES.LARGE;
                if (addSymmetricNode(cx, cy, owner, centerType)) {
                    const planets = 2;
                    const orbit = 350;
                    for(let i=0; i<planets; i++) {
                        const a = (Math.PI * 2 / planets) * i + Math.random();
                        addSymmetricNode(cx + orbit * Math.cos(a), cy + orbit * Math.sin(a), -1, NODE_TYPES.MEDIUM);
                    }
                }
            } else if (activeTheme === 'CROSS') {
                if (addSymmetricNode(cx, cy, owner, NODE_TYPES.LARGE)) {
                    const d = 300;
                    addSymmetricNode(cx + d, cy, -1, NODE_TYPES.MEDIUM);
                    addSymmetricNode(cx - d, cy, -1, NODE_TYPES.MEDIUM);
                }
            } else {
                addSymmetricNode(cx, cy, owner, NODE_TYPES.MEGA);
            }
        };

        // ─────────────────────────────────────────────────────────────────
        // 2. Estructura Principal
        // ─────────────────────────────────────────────────────────────────
        
        // El Omega en el corazón
        nodes.push(new Node(idCounter++, centerX, centerY, -1, NODE_TYPES.OMEGA));

        // Bases
        const baseDistActual = mapRadius * 0.95; 
        addSymmetricNode(centerX + baseDistActual * Math.cos(baseStartAngle), centerY + baseDistActual * Math.sin(baseStartAngle), 0, NODE_TYPES.LARGE);

        // ─────────────────────────────────────────────────────────────────
        // 3. Relleno y Caminos
        // ─────────────────────────────────────────────────────────────────
        
        // Un camino claro al centro
        const t = 0.5;
        const bx = centerX + baseDistActual * Math.cos(baseStartAngle);
        const by = centerY + baseDistActual * Math.sin(baseStartAngle);
        const jx = bx + (centerX - bx) * t;
        const jy = by + (centerY - by) * t;
        addSymmetricNode(jx, jy, -1, NODE_TYPES.MEGA);

        // Relleno de Sectores (Adaptativo a playerCount)
        const sectorCount = playerCount <= 3 ? 6 : playerCount;
        for (let k = 0; k < sectorCount; k++) {
            const angle = baseStartAngle + (k * (Math.PI * 2 / sectorCount)) + (Math.PI / sectorCount);
            const dist = mapRadius * 0.6;
            const px = centerX + dist * Math.cos(angle);
            const py = centerY + dist * Math.sin(angle);
            
            if (nodes.length < maxAllowed) {
                createCosmicFormation(px, py, -1);
            }
        }

        // ─────────────────────────────────────────────────────────────────
        // 4. Cleanup
        // ─────────────────────────────────────────────────────────────────
        
        const finalNodes = [];
        for (let n of nodes) {
            let tooClose = false;
            for (let f of finalNodes) {
                const limit = (n.type === NODE_TYPES.OMEGA || f.type === NODE_TYPES.OMEGA) ? 200 : 60;
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
