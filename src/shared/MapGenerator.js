import { Node } from './Node.js';

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;

        // 1. Symmetrical Starting Positions for up to 4 players
        const margin = 250;
        const playerPositions = [
            { x: margin, y: margin }, // Player 0 (Top Left)
            { x: worldWidth - margin, y: worldHeight - margin }, // Player 1 (Bottom Right)
            { x: worldWidth - margin, y: margin }, // Player 2 (Top Right)
            { x: margin, y: worldHeight - margin } // Player 3 (Bottom Left)
        ];

        for (let i = 0; i < playerCount; i++) {
            nodes.push(new Node(idCounter++, playerPositions[i].x, playerPositions[i].y, i, 'large'));
        }

        // Collision helper (ensures nodes don't overlap or get too close)
        const canPlace = (x, y, r, existing) => {
            for (let n of existing) {
                const dx = x - (n.x || 0), dy = y - (n.y || 0);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDistance = r + (n.radius || 0) + 120; // 120px padding
                if (dist < minDistance) return false;
            }
            return true;
        };

        // 2. Mirror-based Node Generation for fairness
        // We generate nodes in the top-left quadrant and mirror them to the other three.
        const quadrantNodes = [];
        const nodeSpecs = [
            { type: 'large', count: 1 },
            { type: 'medium', count: 2 },
            { type: 'small', count: 3 }
        ];

        // Temp list for placement checks within the quadrant
        const tempAll = [...nodes];

        nodeSpecs.forEach(spec => {
            for (let i = 0; i < spec.count; i++) {
                let placed = false;
                for (let attempt = 0; attempt < 100; attempt++) {
                    // Random position in the Top-Left quadrant (with some padding)
                    // We stay a bit away from the center line to avoid crowded center
                    const x = 150 + Math.random() * (centerX - 300);
                    const y = 150 + Math.random() * (centerY - 300);
                    const radius = spec.type === 'large' ? 60 : spec.type === 'medium' ? 35 : 20;

                    if (canPlace(x, y, radius, tempAll)) {
                        quadrantNodes.push({ x, y, type: spec.type, radius });
                        tempAll.push({ x, y, radius });
                        placed = true;
                        break;
                    }
                }
            }
        });

        // Mirror the quadrant nodes to fill the entire map symmetrically
        quadrantNodes.forEach(q => {
            // Top-Left (Original)
            nodes.push(new Node(idCounter++, q.x, q.y, -1, q.type));

            // Top-Right
            nodes.push(new Node(idCounter++, worldWidth - q.x, q.y, -1, q.type));

            // Bottom-Left
            nodes.push(new Node(idCounter++, q.x, worldHeight - q.y, -1, q.type));

            // Bottom-Right
            nodes.push(new Node(idCounter++, worldWidth - q.x, worldHeight - q.y, -1, q.type));
        });

        // 3. Central Conflict Node (optional but good for gameplay)
        if (canPlace(centerX, centerY, 60, nodes)) {
            nodes.push(new Node(idCounter++, centerX, centerY, -1, 'large'));
        }

        return nodes;
    }
}
