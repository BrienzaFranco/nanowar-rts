import { PLAYER_COLORS } from './GameConfig.js';

export class Entity {
    constructor(x, y, ownerId, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.owner = ownerId;

        this.radius = 5;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 50;
        this.acceleration = 100;
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

        this.cohesionRadius = 30;
        this.cohesionForce = 40;
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
    }

    update(dt, entities, nodes, camera, game) {
        if (this.dying) {
            this.deathTime += dt;
            if (this.deathTime > 0.4) { this.dead = true; }
            // Animation logic is handled in client-side Renderer
            return;
        }

        if (this.attackCooldown > 0) this.attackCooldown -= dt;

        this.processWaypoints();
        this.handleCollisionsAndCohesion(entities, nodes, game);

        // Get game settings for speed and acceleration
        const speedMult = (game?.state?.speedMultiplier) || 1;
        const accelEnabled = game?.state?.accelerationEnabled !== false;
        
        // Random movement - reduced or disabled based on acceleration setting
        const randomForce = accelEnabled ? 10 : 0;
        this.vx += (Math.random() - 0.5) * randomForce * dt;
        this.vy += (Math.random() - 0.5) * randomForce * dt;

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                const accel = accelEnabled ? this.acceleration : this.maxSpeed * 10;
                this.vx += (dx / dist) * accel * dt;
                this.vy += (dy / dist) * accel * dt;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        const maxSpd = this.maxSpeed * speedMult;
        if (speed > maxSpd) {
            this.vx = (this.vx / speed) * maxSpd;
            this.vy = (this.vy / speed) * maxSpd;
        }
        if (speed < 3 && speed > 0) {
            this.vx = (this.vx / speed) * 3;
            this.vy = (this.vy / speed) * 3;
        }

        this.x += this.vx * dt;
        this.y += this.vy * dt;

        this.checkNodeProximity(nodes, game);
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

    handleCollisionsAndCohesion(allEntities, nodes, game) {
        // First, push entities out of nodes they might be inside
        if (nodes) {
            for (let node of nodes) {
                const dx = this.x - node.x;
                const dy = this.y - node.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                const minDist = node.radius + this.radius;
                
                if (dist < minDist && dist > 0) {
                    // Push entity out of node
                    const overlap = minDist - dist;
                    const nx = dx / dist;
                    const ny = dy / dist;
                    this.x += nx * overlap;
                    this.y += ny * overlap;
                    
                    // Bounce velocity
                    this.vx += nx * 50 * 0.016;
                    this.vy += ny * 50 * 0.016;
                }
            }
        }
        
        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;

        for (let other of allEntities) {
            if (other === this || other.dead || other.dying) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (other.owner === this.owner && dist < this.cohesionRadius && dist > this.radius * 2) {
                cohesionX += dx / dist;
                cohesionY += dy / dist;
                cohesionCount++;
            }
        }

        if (cohesionCount > 0) {
            cohesionX /= cohesionCount;
            cohesionY /= cohesionCount;
            this.vx += cohesionX * this.cohesionForce * 0.016;
            this.vy += cohesionY * this.cohesionForce * 0.016;
        }

        for (let other of allEntities) {
            if (other === this || other.dead || other.dying) continue;

            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const distSq = dx * dx + dy * dy;
            const minDist = this.radius + other.radius;

            if (distSq < minDist * minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx / dist;
                const ny = dy / dist;

                this.x -= nx * overlap * 0.3;
                this.y -= ny * overlap * 0.3;

                if (this.owner !== other.owner) {
                    this.die('explosion', null, game);
                    other.die('explosion', null, game);
                    return;
                }

                const dvx = other.vx - this.vx;
                const dvy = other.vy - this.vy;
                const velAlongNormal = dvx * nx + dvy * ny;

                if (velAlongNormal > 0) {
                    const j = -(1 + 0.3) * velAlongNormal * 0.5;
                    this.vx -= j * nx;
                    this.vy -= j * ny;
                    other.vx += j * nx;
                    other.vy += j * ny;
                }
            }
        }

        if (this.currentTarget) this.avoidObstacles(nodes, allEntities);
    }

    // I need to update signature of handleCollisionsAndCohesion to accept 'game' if die() needs it.
    // However, Entity.update() calls handleCollisionsAndCohesion(entities, nodes).
    // I should update Entity.update() to pass 'game'.

    avoidObstacles(nodes, entities) {
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
                if (dot > 0.5) {
                    const perpX = -targetNy;
                    const perpY = targetNx;
                    const side = (dx * targetNy - dy * targetNx) > 0 ? 1 : -1;
                    this.vx += perpX * side * 150 * 0.016;
                    this.vy += perpY * side * 150 * 0.016;
                }
            }
        }
    }

    checkNodeProximity(nodes, game) {
        for (let node of nodes) {
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const touchRange = node.radius + this.radius;

            if (dist <= touchRange) {
                // Neutral node - capture with HP system, cell crashes
                if (node.owner === -1) {
                    if (!this.dying) {
                        node.receiveAttack(this.owner, 1, game); // Normal HP damage
                        this.die('attack', node, game); // Cell crashes
                    }
                    return;
                }

                // Owned node logic - existing behavior
                if (node.owner === this.owner && node.owner !== -1) {
                    // Absorb cell to heal node (only when node needs healing)
                    if (node.baseHp < node.maxHp && !this.dying) {
                        node.baseHp += 1;
                        this.die('absorbed', node, game);
                        return;
                    }
                    if (this.targetNode === node) {
                        this.stop();
                        this.targetNode = null;
                    }
                    return;
                }

                if (node.owner !== this.owner) {
                    if (!this.dying && this.attackCooldown <= 0) {
                        const allDefenders = node.allAreaDefenders || [];

                        const ownerDefenders = allDefenders.filter(e => e.owner === node.owner && !e.dead && !e.dying);
                        if (ownerDefenders.length > 0) {
                            const target = ownerDefenders[0];
                            target.die('sacrifice', null, game);
                            this.die('attack', node, game);
                            return;
                        }

                        const rivalDefenders = allDefenders.filter(e => e.owner !== this.owner && e.owner !== node.owner && !e.dead && !e.dying);
                        if (rivalDefenders.length > 0) {
                            const target = rivalDefenders[0];
                            target.die('sacrifice', null, game);
                            this.die('attack', node, game);
                            return;
                        }

                        node.receiveAttack(this.owner, 1, game);
                        this.die('attack', node, game);
                        return;
                    }
                }
            }
        }
    }

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
        const playerColor = this.getColor();
        if (game) {
            if (type === 'explosion' || type === 'absorbed') {
                game.spawnParticles(this.x, this.y, playerColor, 8, 'explosion');
            } else if (type === 'attack') {
                game.spawnParticles(this.x, this.y, playerColor, 5, 'hit');
            } else if (type === 'sacrifice') {
                game.spawnParticles(this.x, this.y, playerColor, 4, 'hit');
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
