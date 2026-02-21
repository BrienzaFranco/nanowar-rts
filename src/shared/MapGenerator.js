import { Node } from './Node.js';

export class MapGenerator {
    static generate(playerCount, worldWidth, worldHeight) {
        const nodes = [];
        let idCounter = 0;

        const centerX = worldWidth / 2;
        const centerY = worldHeight / 2;

        // Elliptical radii for spawn keeping a smaller edge margin to push players out
        const margin = 180;
        const radiusX = centerX - margin;
        const radiusY = centerY - margin;

        // 1. Central Conflict Node (Guaranteed large)
        nodes.push(new Node(idCounter++, centerX, centerY, -1, 'large'));

        // 2. Symmetrical Starting Positions for N players
        const sliceAngle = (Math.PI * 2) / playerCount;
        // Start angle at -135 degrees (-0.75 * PI) so Player 0 is Top-Left
        const startAngle = -0.75 * Math.PI;

        for (let i = 0; i < playerCount; i++) {
            const angle = startAngle + (i * sliceAngle);
            const px = centerX + radiusX * Math.cos(angle);
            const py = centerY + radiusY * Math.sin(angle);
            nodes.push(new Node(idCounter++, px, py, i, 'large'));
        }

        // Collision helper: Returns an array of symmetrically valid N coordinates, or false if any collide
        const canPlaceSymmetrically = (baseDistFactor, baseAngle, r) => {
            const testPositions = [];
            for (let p = 0; p < playerCount; p++) {
                const angle = startAngle + (p * sliceAngle) + baseAngle;
                // Using distance factor on the elliptical radii
                const px = centerX + (baseDistFactor * radiusX) * Math.cos(angle);
                const py = centerY + (baseDistFactor * radiusY) * Math.sin(angle);

                // Boundary check
                const minBoundaryMargin = 80;
                if (px - r < minBoundaryMargin || px + r > worldWidth - minBoundaryMargin ||
                    py - r < minBoundaryMargin || py + r > worldHeight - minBoundaryMargin) {
                    return false;
                }
                testPositions.push({ x: px, y: py });
            }

            // Check against existing nodes
            for (let testPos of testPositions) {
                for (let n of nodes) {
                    const dx = testPos.x - n.x;
                    const dy = testPos.y - n.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    // Standard margin for general node overlap
                    const minDistance = r + n.radius + 60;
                    if (dist < minDistance) return false;
                }
            }

            // Also check against itself (other testPositions in the same symmetric ring)
            for (let i = 0; i < testPositions.length; i++) {
                for (let j = i + 1; j < testPositions.length; j++) {
                    const dx = testPositions[i].x - testPositions[j].x;
                    const dy = testPositions[i].y - testPositions[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < r * 2 + 130) return false;
                }
            }

            return testPositions;
        };

        // 3. Cluster Symmetry Node Generation
        // Setup "Clusters" per slice (e.g. 2 or 3 distinct systems of nodes)
        const clusterCount = Math.floor(2 + Math.random() * 2);
        const clusters = [];

        // Try to generate distinct cluster centers for the slice
        for (let i = 0; i < clusterCount; i++) {
            for (let attempt = 0; attempt < 100; attempt++) {
                // Determine a relative position for the cluster
                const distFactor = 0.2 + Math.random() * 0.7; // From 20% to 90% distance
                const angleWithinSlice = Math.random() * sliceAngle;

                // Keep clusters somewhat separated from each other
                let tooClose = false;
                for (let c of clusters) {
                    const dDiff = Math.abs(c.distFactor - distFactor);
                    const aDiff = Math.abs(c.angle - angleWithinSlice);
                    // Very rough abstract distance check for cluster centers
                    if (dDiff < 0.2 && aDiff < 0.3) {
                        tooClose = true;
                        break;
                    }
                }

                if (!tooClose) {
                    clusters.push({ distFactor, angle: angleWithinSlice });
                    break;
                }
            }
        }

        // 4. Fill clusters with nodes 
        // 3-5 nodes per cluster keeps the map populated but grouped up
        for (let c of clusters) {
            const nodesInCluster = Math.floor(3 + Math.random() * 3);

            for (let i = 0; i < nodesInCluster; i++) {
                const typeProb = Math.random();
                const type = typeProb > 0.8 ? 'large' : typeProb > 0.4 ? 'medium' : 'small';
                const radius = type === 'large' ? 60 : type === 'medium' ? 35 : 20;

                for (let attempt = 0; attempt < 100; attempt++) {
                    // Small offset from the cluster center
                    // We map distance back to the distorted elliptical polar coords
                    // so we do this by adding small perturbations to the factor/angle
                    const angleOffset = (Math.random() - 0.5) * 0.4; // +/- angle offset
                    const distOffset = (Math.random() - 0.5) * 0.3;  // +/- 15% distance

                    const testDist = Math.max(0.1, Math.min(1.1, c.distFactor + distOffset));

                    // Constrain angle inside this slice
                    let testAngle = c.angle + angleOffset;
                    if (testAngle < 0) testAngle = 0;
                    if (testAngle > sliceAngle) testAngle = sliceAngle;

                    const validPositions = canPlaceSymmetrically(testDist, testAngle, radius);
                    if (validPositions) {
                        validPositions.forEach(pos => {
                            nodes.push(new Node(idCounter++, pos.x, pos.y, -1, type));
                        });
                        break;
                    }
                }
            }
        }

        return nodes;
    }
}
