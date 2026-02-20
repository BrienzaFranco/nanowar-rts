import { PLAYER_COLORS, GAME_SETTINGS } from './GameConfig.js';

export class Entity {
    static idCounter = 0;
    static resetIdCounter() {
        Entity.idCounter = 0;
    }

    constructor(x, y, ownerId, id) {
        this.id = id !== undefined ? id : ++Entity.idCounter;
        this.x = x;
        this.y = y;
        this.owner = ownerId;

        this.radius = 5;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 50;
        this.speedBoost = 0; // 0 to 1.0 scalar for territorial acceleration
        // Acceleration removed as per request
        this.friction = 0.975;

        this.hp = 1;
        this.damage = 1;
        this.attackCooldown = 0;
        this.selected = false;
        this.dead = false;
        this.dying = false;
        this.deathTime = 0;

        this.waypoints = [];
        this.currentTarget = null;
        this.absorbTarget = null;
        this.targetNode = null;

        this.cohesionRadius = 80;
        this.cohesionForce = 35;
        this.separationRadius = 32;
        this.separationForce = 150;

        // Map boundary tracking
        this.outsideTime = 0;
        this.outsideWarning = false;
    }

    addWaypoint(x, y) {
        this.waypoints.push({ x, y });
    }

    setTarget(x, y, node = null) {
        this.waypoints = [{ x, y }];
        this.currentTarget = null;
        this.targetNode = node;
    }

    stop() {
        this.waypoints = [];
        this.currentTarget = null;
        this.vx *= 0.3;
        this.vy *= 0.3;
        this.targetNode = null;
    }

    update(dt, spatialGrid, spatialGridNodes, nodes, camera, game) {
        if (this.dying) {
            this.deathTime += dt;
            if (this.deathTime > 0.4) { this.dead = true; }

            // Pull towards node center for violent absorption
            if (this.absorbTarget && (this.deathType === 'absorbed' || this.deathType === 'sacrifice')) {
                const pullFactor = Math.pow(this.deathTime / 0.4, 2); // Accelerate into the center
                const dx = this.absorbTarget.x - this.x;
                const dy = this.absorbTarget.y - this.y;
                this.x += dx * pullFactor * 0.5; // Smooth pull
                this.y += dy * pullFactor * 0.5;
            }
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        this.processWaypoints();
        this.handleCollisionsAndCohesion(spatialGrid, nodes, game);

        let inFriendlyTerritory = false;
        const speedMult = (game?.state?.speedMultiplier) || 1;

        const nearbyNodes = spatialGridNodes ? spatialGridNodes.retrieveNodes(this.x, this.y, 200) : nodes;

        if (nearbyNodes) {
            for (let node of nearbyNodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;

                if (node.owner === this.owner && node.owner !== -1) {
                    if (distSq < node.influenceRadius * node.influenceRadius) {
                        inFriendlyTerritory = true;
                    }
                }

                const dist = Math.sqrt(distSq);
                const touchRange = node.radius + this.radius;
                const isTargetingThisNode = (this.targetNode === node);

                if (dist < touchRange && dist > 0.001) {
                    const overlap = touchRange - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;

                    if (isTargetingThisNode) {
                        if (node.owner === -1) {
                            if (!this.dying) {
                                node.receiveAttack(this.owner, 1, game);
                                this.die('attack', node, game);
                            }
                            return;
                        }
                        else if (node.owner === this.owner) {
                            if (node.baseHp < node.maxHp && !this.dying) {
                                node.baseHp += 1;
                                node.hitFlash = 0.15;
                                this.die('absorbed', node, game);
                                return;
                            }
                            else {
                                this.stop();
                                this.targetNode = null;

                                this.x += nx * overlap;
                                this.y += ny * overlap;
                            }
                        }
                        else {
                            const allDefenders = node.allAreaDefenders || [];
                            const ownerDefenders = allDefenders.filter(e =>
                                e.owner === node.owner && !e.dead && !e.dying
                            );

                            if (ownerDefenders.length > 0) {
                                // Choose closest defender to node center
                                let closest = ownerDefenders[0];
                                let minDist = Infinity;
                                for (const def of ownerDefenders) {
                                    const ddx = def.x - node.x;
                                    const ddy = def.y - node.y;
                                    const d = ddx * ddx + ddy * ddy;
                                    if (d < minDist) {
                                        minDist = d;
                                        closest = def;
                                    }
                                }
                                closest.die('sacrifice', node, game);
                                this.die('attack', node, game);
                                return;
                            }

                            if (!this.dying) {
                                node.receiveAttack(this.owner, 1, game);
                                this.die('attack', node, game);
                            }
                            return;
                        }
                    }
                    else {
                        // Not targeting this node: only physical collision and evasion
                        this.x += nx * overlap;
                        this.y += ny * overlap;

                        if (this.currentTarget) {
                            const perpX = -ny;
                            const perpY = nx;
                            const targetDx = this.currentTarget.x - this.x;
                            const targetDy = this.currentTarget.y - this.y;
                            const side = (dx * targetDy - dy * targetDx) > 0 ? 1 : -1;

                            // Dynamic evasion force
                            const evasionForce = (1 - (dist / (node.radius + 60))) * 4500;
                            this.vx += perpX * side * evasionForce * 0.016;
                            this.vy += perpY * side * evasionForce * 0.016;
                        }
                    }
                }
            }
        }

        const randomForce = 10;
        this.vx += (Math.random() - 0.5) * randomForce * dt;
        this.vy += (Math.random() - 0.5) * randomForce * dt;

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                const moveForce = 800;
                this.vx += (dx / dist) * moveForce * dt;
                this.vy += (dy / dist) * moveForce * dt;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        // Calculate max speed with gradual "Acceleration Zone" effect
        if (inFriendlyTerritory) {
            this.speedBoost = Math.min(1.0, this.speedBoost + dt * 2.0); // Ramp up in 0.5s
        } else {
            this.speedBoost = Math.max(0.0, this.speedBoost - dt * 1.0); // Decay in 1.0s
        }

        let currentMaxSpeed = this.maxSpeed * (1 + this.speedBoost * 0.4); // Max 40% boost
        this.hasSpeedBoost = this.speedBoost > 0.1; // Threshold flag for renderer

        currentMaxSpeed *= speedMult;

        // Cap speed
        const speedSq = this.vx * this.vx + this.vy * this.vy;
        const maxSpdSq = currentMaxSpeed * currentMaxSpeed;

        if (speedSq > maxSpdSq) {
            const speed = Math.sqrt(speedSq);
            this.vx = (this.vx / speed) * currentMaxSpeed;
            this.vy = (this.vy / speed) * currentMaxSpeed;
        }

        // Apply movement
        this.x += this.vx * dt;
        this.y += this.vy * dt;

        // Check map boundary - die if outside
        const worldRadius = GAME_SETTINGS.WORLD_RADIUS || 1800;
        const centerX = (GAME_SETTINGS.WORLD_WIDTH || 2400) / 2;
        const centerY = (GAME_SETTINGS.WORLD_HEIGHT || 1800) / 2;
        const dx = this.x - centerX;
        const dy = this.y - centerY;
        const distFromCenter = Math.sqrt(dx * dx + dy * dy);

        if (distFromCenter > worldRadius) {
            this.outsideTime += dt;
            this.outsideWarning = true;
            if (this.outsideTime >= (GAME_SETTINGS.OUTSIDE_DEATH_TIME || 5)) {
                this.die('outOfBounds', null, game);
                return;
            }
        } else {
            this.outsideTime = 0;
            this.outsideWarning = false;
        }
    }

    processWaypoints() {
        if (!this.currentTarget && this.waypoints.length > 0) {
            this.currentTarget = this.waypoints.shift();
        }

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 15) {
                if (this.waypoints.length > 0) {
                    this.currentTarget = this.waypoints.shift();
                } else {
                    this.currentTarget = null;
                }
            }
        }
    }

    handleCollisionsAndCohesion(spatialGrid, nodes, game) {
        // Push entities out of nodes physical radius
        if (nodes) {
            for (let node of nodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const distSq = dx * dx + dy * dy;
                const minDist = node.radius + this.radius;

                if (distSq < minDist * minDist) {
                    const dist = Math.sqrt(distSq);
                    const safeDist = Math.max(0.1, dist);
                    const overlap = minDist - safeDist;
                    const nx = dx / safeDist;
                    const ny = dy / safeDist;

                    const safeOverlap = Math.min(overlap, minDist);
                    this.x += nx * safeOverlap;
                    this.y += ny * safeOverlap;

                    // Limit push force
                    const force = 50 * 0.016;
                    this.vx += nx * force;
                    this.vy += ny * force;
                }
            }
        }

        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
        let separationX = 0, separationY = 0, separationCount = 0;
        let pushX = 0, pushY = 0;
        // Optimized spatial query
        const searchRadius = this.cohesionRadius;
        const neighbors = spatialGrid.retrieve(this.x, this.y, searchRadius);

        // Check if in flock for stronger cohesion
        const inFlock = !!this.flockId;

        for (let other of neighbors) {
            if (other === this || other.dead || other.dying) continue;

            let dx = other.x - this.x;
            let dy = other.y - this.y;
            let distSq = dx * dx + dy * dy;

            // Critical fix for PERFECT overlaps (e.g mass rally onto the same pixel)
            // Deterministic hash to avoid desyncs between client/server
            if (distSq < 0.0001) {
                const hash = (this.id * 31 + other.id) % 360;
                const angle = (hash * Math.PI) / 180;
                dx = Math.cos(angle) * 0.1;
                dy = Math.sin(angle) * 0.1;
                distSq = 0.01;
            }

            if (distSq > searchRadius * searchRadius) continue;
            const dist = Math.sqrt(distSq);
            const otherOwner = other.owner;

            // COHESION & SEPARATION logic
            if (otherOwner === this.owner) {
                if (dist < this.separationRadius) {
                    // SEPARATION: Push away if too close
                    const safeDist = Math.max(0.1, dist);
                    const force = (1 - safeDist / this.separationRadius);
                    separationX -= (dx / safeDist) * force;
                    separationY -= (dy / safeDist) * force;
                    separationCount++;
                } else if (dist > this.radius * 2.5) {
                    // COHESION: Pull towards if far enough
                    const safeDist = Math.max(0.1, dist);
                    if (inFlock && other.flockId === this.flockId) {
                        cohesionX += (dx / safeDist) * 1.5;
                        cohesionY += (dy / safeDist) * 1.5;
                        cohesionCount++;
                    } else {
                        cohesionX += dx / safeDist;
                        cohesionY += dy / safeDist;
                        cohesionCount++;
                    }
                }
            }

            // COLLISION logic - intensified to prevent overlapping
            const minDist = this.radius + other.radius;
            if (dist < minDist) {
                // Prevent division by zero or near zero
                const safeDist = Math.max(0.01, dist);
                const overlap = minDist - safeDist;
                const nx = dx / safeDist;
                const ny = dy / safeDist;

                // Push apart more aggressively (0.6 instead of 0.3)
                // Cap the overlap to prevent teleporting cross-map
                const safeOverlap = Math.min(overlap, minDist);

                pushX -= nx * safeOverlap * 0.6;
                pushY -= ny * safeOverlap * 0.6;

                if (this.owner !== other.owner) {
                    this.die('explosion', null, game);
                    other.die('explosion', null, game);
                    return;
                }

                const dvx = other.vx - this.vx;
                const dvy = other.vy - this.vy;
                const velAlongNormal = dvx * nx + dvy * ny;

                if (velAlongNormal > 0) {
                    const j = -(1.3) * velAlongNormal * 0.5;
                    // Cap the physics impulse to prevent erratic zooming
                    const maxJ = 100;
                    const safeJ = Math.max(-maxJ, Math.min(maxJ, j));

                    // ONLY modify 'this' to prevent exponential O(N^2) feedback loops
                    // 'other' will update itself during its own update() cycle
                    this.vx -= safeJ * nx;
                    this.vy -= safeJ * ny;
                }
            }
        }

        // Apply accumulated collision pushes with a strict cap per frame
        if (pushX !== 0 || pushY !== 0) {
            const maxPushPerFrame = this.radius * 1.5; // Prevent explosive teleporting (e.g., max 7.5px per frame)
            const pushDist = Math.sqrt(pushX * pushX + pushY * pushY);
            if (pushDist > maxPushPerFrame) {
                pushX = (pushX / pushDist) * maxPushPerFrame;
                pushY = (pushY / pushDist) * maxPushPerFrame;
            }
            this.x += pushX;
            this.y += pushY;
        }

        if (cohesionCount > 0 || separationCount > 0) {
            let fx = 0, fy = 0;
            if (cohesionCount > 0) {
                fx += (cohesionX / cohesionCount) * this.cohesionForce;
                fy += (cohesionY / cohesionCount) * this.cohesionForce;
            }
            if (separationCount > 0) {
                // Diminishing returns after 6 overlapping units, instead of flat average
                const densityMult = Math.min(separationCount, 6) / separationCount;
                fx += (separationX * densityMult) * this.separationForce;
                fy += (separationY * densityMult) * this.separationForce;
            }

            this.vx += fx * 0.016;
            this.vy += fy * 0.016;
        }

        if (this.currentTarget) this.avoidObstacles(nodes);
    }

    avoidObstacles(nodes) {
        const targetDx = this.currentTarget.x - this.x;
        const targetDy = this.currentTarget.y - this.y;
        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        const targetNx = targetDx / targetDist;
        const targetNy = targetDy / targetDist;

        for (let node of nodes) {
            if (this.targetNode === node) continue;
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < node.radius + 60 && dist > 10) {
                const dot = (dx / dist) * targetNx + (dy / dist) * targetNy;
                if (dot > 0.1) { // Wider detection angle
                    const perpX = -targetNy;
                    const perpY = targetNx;
                    const side = (dx * targetNy - dy * targetNx) > 0 ? 1 : -1;

                    // Improved avoidance force proportional to proximity
                    const forceMult = (1 - (dist / (node.radius + 60))) * 4500;
                    this.vx += perpX * side * forceMult * 0.016;
                    this.vy += perpY * side * forceMult * 0.016;
                }
            }
        }
    }

    // checkNodeProximity removed as logic is merged into update()

    moveTo(x, y) {
        this.setTarget(x, y);
    }

    getColor() {
        return PLAYER_COLORS[this.owner % PLAYER_COLORS.length];
    }

    die(type, node = null, game = null) {
        this.dying = true;
        this.deathType = type;
        this.deathTime = 0;
        this.absorbTarget = node;

        if (game && game.state && game.state.recordDeath) {
            game.state.recordDeath(this.owner, this.x, this.y);
        }

        const playerColor = this.getColor();
        if (game && game.spawnParticles) {
            if (type === 'explosion' || type === 'absorbed') {
                game.spawnParticles(this.x, this.y, playerColor, 8, 'explosion');
            } else if (type === 'attack') {
                game.spawnParticles(this.x, this.y, playerColor, 5, 'hit');
            }
        }
    }

    isPointInside(mx, my, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const dx = mx - screen.x;
        const dy = my - screen.y;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius + 5) * camera.zoom;
    }

    isInsideRect(x1, y1, x2, y2, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return screen.x >= minX && screen.x <= maxX && screen.y >= minY && screen.y <= maxY;
    }
}
