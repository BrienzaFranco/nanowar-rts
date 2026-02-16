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

        // 2. Central Conflict Node (Guaranteed large)
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'large'));

        // Collision helper (ensures nodes don't overlap or get too close)
        const canPlace = (x, y, r, existing) => {
            for (let n of existing) {
                const dx = x - (n.x || 0), dy = y - (n.y || 0);
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDistance = r + (n.radius || 0) + 140; // Increased padding for better distribution
                if (dist < minDistance) return false;
            }
            return true;
        };

        // 3. Mirror-based Node Generation for fairness
        // Each quadrant will contribute a proportional amount of nodes
        // Range: 5 to 8 nodes per player total.
        const totalNeutralsGoal = Math.floor(playerCount * (5 + Math.random() * 3));
        // Divided by 4 quadrants (rounded up)
        const nodesPerQuadrant = Math.max(1, Math.ceil(totalNeutralsGoal / 4));

        const quadrantNodes = [];
        const tempAll = [...nodes];

        for (let i = 0; i < nodesPerQuadrant; i++) {
            let placed = false;
            const typeProb = Math.random();
            const type = typeProb > 0.8 ? 'large' : typeProb > 0.4 ? 'medium' : 'small';
            const radius = type === 'large' ? 60 : type === 'medium' ? 35 : 20;

            for (let attempt = 0; attempt < 100; attempt++) {
                // Random position in the Top-Left quadrant
                const x = 150 + Math.random() * (centerX - 300);
                const y = 150 + Math.random() * (centerY - 300);

                if (canPlace(x, y, radius, tempAll)) {
                    quadrantNodes.push({ x, y, type, radius });
                    tempAll.push({ x, y, radius });
                    placed = true;
                    break;
                }
            }
        }

        // Mirror the quadrant nodes symmetrically
        quadrantNodes.forEach(q => {
            nodes.push(new Node(idCounter++, q.x, q.y, -1, q.type)); // Top-Left
            nodes.push(new Node(idCounter++, worldWidth - q.x, q.y, -1, q.type)); // Top-Right
            nodes.push(new Node(idCounter++, q.x, worldHeight - q.y, -1, q.type)); // Bottom-Left
            nodes.push(new Node(idCounter++, worldWidth - q.x, worldHeight - q.y, -1, q.type)); // Bottom-Right
        });

        return nodes;
    }
}
