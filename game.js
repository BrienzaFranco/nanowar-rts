// NANOWAR RTS v4.0 - Sistema de Defensa y Conquista
// =================================================
// - Vida combinada: baseHp + defensores dentro del area
// - Defensores se consumen primero al atacar  
// - Area coloreada segun defensor dominante
// =================================================

const PLAYER_COLORS = [
    '#4CAF50', '#f44336', '#2196F3', '#FF9800',
    '#9C27B0', '#00BCD4', '#FFEB3B', '#E91E63'
];

/**
 * Indicador de comando (línea o punto)
 */
class CommandIndicator {
    constructor(x, y, type = 'move', isLineEnd = false) {
        this.x = x;
        this.y = y;
        this.type = type;
        this.isLineEnd = isLineEnd;
        this.life = 1.0;
        this.maxLife = 2.0;
        this.radius = 0;
        this.maxRadius = 20;
    }

    update(dt) {
        this.life -= dt;
        if (!this.isLineEnd) {
            const progress = 1 - (this.life / this.maxLife);
            this.radius = this.maxRadius * Math.sin(progress * Math.PI);
        }
        return this.life > 0;
    }

    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const alpha = Math.max(0, this.life / this.maxLife);

        if (this.type === 'move') {
            if (this.isLineEnd) {
                ctx.beginPath();
                ctx.arc(screenX, screenY, 4 * camera.zoom, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
                ctx.fill();
            } else {
                ctx.beginPath();
                ctx.arc(screenX, screenY, 2 * camera.zoom, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.4})`;
                ctx.fill();
            }
        } else if (this.type === 'attack') {
            ctx.strokeStyle = `rgba(255, 100, 100, ${alpha})`;
            ctx.lineWidth = 2 * camera.zoom;
            const size = 8 * camera.zoom;
            ctx.beginPath();
            ctx.moveTo(screenX - size, screenY - size);
            ctx.lineTo(screenX + size, screenY + size);
            ctx.moveTo(screenX + size, screenY - size);
            ctx.lineTo(screenX - size, screenY + size);
            ctx.stroke();
        }
    }
}

/**
 * Línea de waypoint visible
 */
class WaypointLine {
    constructor(points, ownerId) {
        this.points = points;
        this.owner = ownerId;
        this.life = 1.0;
        this.maxLife = 3.0;
    }

    update(dt) {
        this.life -= dt;
        return this.life > 0;
    }

    draw(ctx, camera) {
        if (this.points.length < 2) return;

        const alpha = Math.max(0, this.life / this.maxLife) * 0.3;
        const color = PLAYER_COLORS[this.owner % PLAYER_COLORS.length];

        ctx.strokeStyle = color.startsWith('#') ? hexToRgba(color, alpha) : color;
        function hexToRgba(hex, alpha) {
            const r = parseInt(hex.slice(1, 3), 16);
            const g = parseInt(hex.slice(3, 5), 16);
            const b = parseInt(hex.slice(5, 7), 16);
            return `rgba(${r}, ${g}, ${b}, ${alpha})`;
        }

        ctx.lineWidth = 2 * camera.zoom;
        ctx.setLineDash([5 * camera.zoom, 5 * camera.zoom]);

        ctx.beginPath();
        const start = this.points[0];
        ctx.moveTo((start.x - camera.x) * camera.zoom, (start.y - camera.y) * camera.zoom);

        for (let i = 1; i < this.points.length; i++) {
            const point = this.points[i];
            ctx.lineTo((point.x - camera.x) * camera.zoom, (point.y - camera.y) * camera.zoom);
        }

        ctx.stroke();
        ctx.setLineDash([]);

        this.points.forEach((point, i) => {
            const screenX = (point.x - camera.x) * camera.zoom;
            const screenY = (point.y - camera.y) * camera.zoom;

            ctx.beginPath();
            ctx.arc(screenX, screenY, (i === this.points.length - 1 ? 4 : 2) * camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(255, 255, 255, ${alpha * (i === this.points.length - 1 ? 0.8 : 0.4)})`;
            ctx.fill();
        });
    }
}

/**
 * CLASE ENTITY (Complex Logic + Node Attack Patch)
 */
class Entity {
    constructor(x, y, ownerId, id) {
        this.id = id;
        this.x = x;
        this.y = y;
        this.owner = ownerId;

        this.radius = 5;
        this.vx = 0;
        this.vy = 0;
        this.maxSpeed = 120;
        this.acceleration = 250;
        this.friction = 0.95;

        this.hp = 1;
        this.damage = 1;
        this.selected = false;
        this.dead = false;
        this.dying = false;
        this.deathTime = 0;

        this.waypoints = [];
        this.currentTarget = null;
        this.absorbTarget = null;

        this.cohesionRadius = 60;
        this.cohesionForce = 80;
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
            if (this.deathType === 'attack' && this.absorbTarget) {
                // ... animation handled in draw
            }
            return;
        }

        this.processWaypoints();
        this.handleCollisionsAndCohesion(entities, nodes);

        this.vx += (Math.random() - 0.5) * 10 * dt;
        this.vy += (Math.random() - 0.5) * 10 * dt;

        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 5) {
                this.vx += (dx / dist) * this.acceleration * dt;
                this.vy += (dy / dist) * this.acceleration * dt;
            }
        }

        this.vx *= this.friction;
        this.vy *= this.friction;

        const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx / speed) * this.maxSpeed;
            this.vy = (this.vy / speed) * this.maxSpeed;
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

    handleCollisionsAndCohesion(allEntities, nodes) {
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
                    const relativeSpeed = Math.sqrt((this.vx - other.vx) ** 2 + (this.vy - other.vy) ** 2);
                    if (relativeSpeed > 40 || Math.random() < 0.2) {
                        this.die('explosion');
                        other.die('explosion');
                        return;
                    }
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

    avoidObstacles(nodes, entities) {
        const targetDx = this.currentTarget.x - this.x;
        const targetDy = this.currentTarget.y - this.y;
        const targetDist = Math.sqrt(targetDx * targetDx + targetDy * targetDy);
        const targetNx = targetDx / targetDist;
        const targetNy = targetDy / targetDist;

        for (let node of nodes) {
            if (this.targetNode === node) continue; // Don't avoid target
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

            if (dist < node.radius + this.radius) {
                if (node.owner === this.owner) {
                    if (this.targetNode === node) {
                        this.stop();
                        this.targetNode = null;
                        return;
                    }
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const pushDistance = (node.radius + this.radius) - dist + 2;
                    this.x -= nx * pushDistance;
                    this.y -= ny * pushDistance;
                    this.vx -= nx * 80;
                    this.vy -= ny * 80;
                } else {
                    if (!this.dying) {
                        node.receiveAttack(this.owner, this.damage, game);
                        this.die('attack', node, game);
                    }
                }
                return;
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
        if (game && type === 'explosion') {
            game.spawnParticles(this.x, this.y, this.getColor(), 8, 'explosion');
        } else if (game && type === 'attack') {
            game.spawnParticles(this.x, this.y, '#FF4444', 5, 'hit');
        } else if (game && type === 'sacrifice') {
            game.spawnParticles(this.x, this.y, '#FFFFFF', 4, 'hit');
        }
    }

    isPointInside(x, y, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const dx = x - screenX;
        const dy = y - screenY;
        return Math.sqrt(dx * dx + dy * dy) < (this.radius + 5) * camera.zoom;
    }

    isInsideRect(x1, y1, x2, y2, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const minX = Math.min(x1, x2);
        const maxX = Math.max(x1, x2);
        const minY = Math.min(y1, y2);
        const maxY = Math.max(y1, y2);
        return screenX >= minX && screenX <= maxX && screenY >= minY && screenY <= maxY;
    }

    draw(ctx, camera) {
        if (this.dead) return;

        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const screenRadius = this.radius * camera.zoom;

        if (this.dying) {
            const progress = this.deathTime / 0.4;

            if (this.deathType === 'explosion') {
                const maxRadius = screenRadius * 4;
                const currentRadius = screenRadius + (maxRadius - screenRadius) * progress;
                const alpha = 1 - progress;

                ctx.beginPath();
                ctx.arc(screenX, screenY, currentRadius, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 200, 50, ${alpha * 0.3})`;
                ctx.fill();

                ctx.beginPath();
                ctx.arc(screenX, screenY, screenRadius * (1 - progress * 0.8), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 255, 200, ${alpha})`;
                ctx.fill();
            } else if (this.deathType === 'attack' && this.absorbTarget) {
                const flash = Math.sin(progress * Math.PI * 6) * 0.5 + 0.5;
                ctx.beginPath();
                ctx.arc(screenX, screenY, screenRadius * (1 + progress * 2), 0, Math.PI * 2);
                ctx.fillStyle = `rgba(255, 100, 100, ${flash * 0.4 * (1 - progress)})`;
                ctx.fill();
            }
            return;
        }

        ctx.beginPath();
        ctx.arc(screenX + 1, screenY + 1, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        const baseColor = PLAYER_COLORS[this.owner % PLAYER_COLORS.length];
        ctx.fillStyle = baseColor;
        ctx.fill();

        ctx.beginPath();
        ctx.arc(screenX - screenRadius * 0.3, screenY - screenRadius * 0.3, screenRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();

        if (this.selected) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius + 3 * camera.zoom, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.5 * camera.zoom;
            ctx.stroke();
        }

        if (this.currentTarget || this.waypoints.length > 0) {
            const target = this.currentTarget || this.waypoints[0];
            const dx = target.x - this.x;
            const dy = target.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 5) {
                const angle = Math.atan2(dy, dx);
                const arrowLen = 8 * camera.zoom;
                ctx.beginPath();
                ctx.moveTo(screenX, screenY);
                ctx.lineTo(screenX + Math.cos(angle) * arrowLen, screenY + Math.sin(angle) * arrowLen);
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
                ctx.lineWidth = 1.5 * camera.zoom;
                ctx.stroke();
            }
        }

        // Draw path line always for player 0
        if (this.owner === 0 && this.waypoints.length > 0 && !this.dead && !this.dying) {
            const screenX = (this.x - camera.x) * camera.zoom;
            const screenY = (this.y - camera.y) * camera.zoom;
            const target = this.waypoints[0];
            const screenTx = (target.x - camera.x) * camera.zoom;
            const screenTy = (target.y - camera.y) * camera.zoom;

            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(screenTx, screenTy);
            ctx.strokeStyle = `rgba(${this.getColor().slice(1)}, 0.4)`; // Use entity color
            ctx.lineWidth = 2 * camera.zoom;
            // Removed: ctx.stroke(); - User requested removal of this line ("la otra sacala")
            // Actually I should remove the whole block if I want to remove the line.
            // Better to just comment out or remove.
            // ctx.stroke();
        }
    }
}

/**
 * CLASE NODE (Improved Node Defense)
 */
class Node {
    constructor(id, x, y, ownerId, type = 'medium') {
        this.id = id; this.x = x; this.y = y; this.owner = ownerId; this.type = type;
        if (type === 'small') { this.radius = 35; this.influenceRadius = 90; this.baseHp = 8; this.maxHp = 60; this.spawnInterval = 1.7; }
        else if (type === 'large') { this.radius = 70; this.influenceRadius = 150; this.baseHp = 15; this.maxHp = 150; this.spawnInterval = 3.0; }
        else { this.radius = 55; this.influenceRadius = 120; this.baseHp = 10; this.maxHp = 100; this.spawnInterval = 2.1; }
        this.defendersInside = 0; this.defenderCounts = {}; this.hitFlash = 0; this.selected = false; this.hasSpawnedThisCycle = false; this.rallyPoint = null;
    }
    getColor() { return this.owner === -1 ? '#757575' : PLAYER_COLORS[this.owner % PLAYER_COLORS.length]; }
    setRallyPoint(x, y) { this.rallyPoint = { x, y }; }
    calculateDefenders(entities) {
        this.defendersInside = 0;
        this.defenderCounts = {};
        this.defendingEntities = [];
        for (let e of entities) {
            if (e.dead || e.dying) continue;
            const dx = e.x - this.x, dy = e.y - this.y;
            if (Math.sqrt(dx * dx + dy * dy) <= this.influenceRadius) {
                this.defenderCounts[e.owner] = (this.defenderCounts[e.owner] || 0) + 1;
                if (e.owner === this.owner) {
                    this.defendersInside++;
                    this.defendingEntities.push(e);
                }
            }
        }
    }
    getTotalHp() { return Math.min(this.maxHp, this.baseHp + this.defendersInside); }
    receiveAttack(attackerId, damage, game) {
        this.hitFlash = 0.3;
        if (game) game.spawnParticles(this.x, this.y, '#FF0000', 3, 'hit');

        // Consumir defensores físicos primero
        while (damage > 0 && this.defendingEntities && this.defendingEntities.length > 0) {
            const defender = this.defendingEntities.pop();
            if (defender && !defender.dead && !defender.dying) {
                defender.die('sacrifice', null, game);
                this.defendersInside = Math.max(0, this.defendersInside - 1);
                damage--;
            }
        }

        if (damage > 0) {
            this.baseHp -= damage;
            if (this.baseHp <= 0) {
                this.owner = attackerId;
                this.baseHp = this.type === 'small' ? 8 : this.type === 'large' ? 15 : 10;
                this.hasSpawnedThisCycle = false;
                if (game) game.spawnParticles(this.x, this.y, PLAYER_COLORS[attackerId % PLAYER_COLORS.length], 20, 'explosion');
                return true;
            }
        }
        return false;
    }
    update(dt, entities, globalSpawnTimer, game) {
        this.calculateDefenders(entities);
        if (this.hitFlash > 0) this.hitFlash -= dt;
        if (this.owner !== -1 && globalSpawnTimer.shouldSpawn && !this.hasSpawnedThisCycle) {
            this.hasSpawnedThisCycle = true;
            const angle = Math.random() * Math.PI * 2, dist = this.radius + 25 + Math.random() * 40;
            const ex = this.x + Math.cos(angle) * dist, ey = this.y + Math.sin(angle) * dist;
            const entity = new Entity(ex, ey, this.owner, Date.now() + Math.random());
            if (this.rallyPoint) entity.setTarget(this.rallyPoint.x, this.rallyPoint.y);
            return entity;
        }
        if (!globalSpawnTimer.shouldSpawn) this.hasSpawnedThisCycle = false;
        return null;
    }
    draw(ctx, camera) {
        const sx = (this.x - camera.x) * camera.zoom, sy = (this.y - camera.y) * camera.zoom, sr = this.radius * camera.zoom, sir = this.influenceRadius * camera.zoom;
        let maxDefenders = 0, dominantOwner = -1;
        for (let owner in this.defenderCounts) { if (this.defenderCounts[owner] > maxDefenders) { maxDefenders = this.defenderCounts[owner]; dominantOwner = parseInt(owner); } }
        let areaColor;
        if (this.owner !== -1) {
            // Si tiene dueño, color del dueño SIEMPRE
            const c = PLAYER_COLORS[this.owner % PLAYER_COLORS.length].slice(1);
            areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');
        } else {
            // Neutral: color del dominante o gris
            if (dominantOwner === -1 || maxDefenders === 0) {
                const c = '#757575'.slice(1);
                areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');
            } else {
                const c = PLAYER_COLORS[dominantOwner % PLAYER_COLORS.length].slice(1);
                areaColor = [parseInt(c.slice(0, 2), 16), parseInt(c.slice(2, 4), 16), parseInt(c.slice(4, 6), 16)].join(',');
            }
        }
        ctx.beginPath(); ctx.arc(sx, sy, sir, 0, Math.PI * 2); ctx.fillStyle = `rgba(${areaColor},0.1)`; ctx.fill(); ctx.strokeStyle = `rgba(${areaColor},0.4)`; ctx.lineWidth = 2 * camera.zoom; ctx.stroke();
        if (this.rallyPoint && this.owner !== -1) {
            const rx = (this.rallyPoint.x - camera.x) * camera.zoom, ry = (this.rallyPoint.y - camera.y) * camera.zoom;
            ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(rx, ry); ctx.strokeStyle = `rgba(${areaColor},0.4)`; ctx.setLineDash([3 * camera.zoom, 3 * camera.zoom]); ctx.stroke(); ctx.setLineDash([]);
            ctx.beginPath(); ctx.arc(rx, ry, 5 * camera.zoom, 0, Math.PI * 2); ctx.fillStyle = `rgba(${areaColor},0.6)`; ctx.fill();
        }
        ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fillStyle = this.getColor(); ctx.fill(); ctx.strokeStyle = this.selected ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.2)'; ctx.lineWidth = this.selected ? 3 * camera.zoom : 1 * camera.zoom; ctx.stroke();
        if (this.hitFlash > 0) { ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.strokeStyle = `rgba(255,100,100,${this.hitFlash})`; ctx.lineWidth = 5 * camera.zoom; ctx.stroke(); }
        const totalHp = this.getTotalHp(), maxHp = this.type === 'small' ? 60 : this.type === 'large' ? 150 : 100, baseHpPercent = this.baseHp / maxHp, totalHpPercent = totalHp / maxHp, bw = sr * 2, bh = 5 * camera.zoom;
        ctx.fillStyle = 'rgba(0,0,0,0.5)'; ctx.fillRect(sx - bw / 2, sy + sr + 8 * camera.zoom, bw, bh);
        ctx.fillStyle = baseHpPercent > 0.5 ? '#2E7D32' : baseHpPercent > 0.25 ? '#F57F17' : '#C62828'; ctx.fillRect(sx - bw / 2, sy + sr + 8 * camera.zoom, bw * baseHpPercent, bh);
        if (totalHpPercent > baseHpPercent) { ctx.fillStyle = 'rgba(76,175,80,0.6)'; ctx.fillRect(sx - bw / 2 + bw * baseHpPercent, sy + sr + 8 * camera.zoom, bw * (totalHpPercent - baseHpPercent), bh); }

        // Texto de vida (Base + Defensores) Grande y Dentro
        const hpSize = Math.max(16, sr * 0.6); // Escalar con el nodo
        ctx.font = `bold ${hpSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        let text = `${Math.ceil(this.baseHp)}`;
        if (this.defendersInside > 0) text += `+${this.defendersInside}`;

        // Sombra para legibilidad
        ctx.lineWidth = 4 * camera.zoom;
        ctx.strokeStyle = 'rgba(0,0,0,0.8)';
        ctx.strokeText(text, sx, sy);

        // Color del texto: Blanco o del jugador?
        // "Todo debe respetar el color del jugador que es"
        // Si el nodo es del jugador, el fondo ya es del color.
        // Usaremos Blanco para legibilidad maxima, pero quizas el borde del color?
        // No, Blanco Brillante siempre legible.
        ctx.fillStyle = '#FFFFFF';
        ctx.fillText(text, sx, sy);

        // Icono Espada pequeño si hay defensa
        if (this.defendersInside > 0) {
            ctx.font = `${hpSize * 0.5}px Arial`;
            ctx.fillStyle = '#AAAAAA';
            ctx.fillText("🛡️", sx, sy + hpSize * 0.8);
        }
    }
    isPointInside(x, y, camera) { const sx = (this.x - camera.x) * camera.zoom, sy = (this.y - camera.y) * camera.zoom; return Math.sqrt((x - sx) ** 2 + (y - sy) ** 2) < this.radius * camera.zoom; }
}

class Camera {
    constructor() {
        this.x = 0;
        this.y = 0;
        this.zoom = 1;
        this.minZoom = 0.1;
        this.maxZoom = 3;
    }
    worldToScreen(worldX, worldY) {
        return {
            x: (worldX - this.x) * this.zoom,
            y: (worldY - this.y) * this.zoom
        };
    }
    screenToWorld(screenX, screenY) {
        return {
            x: screenX / this.zoom + this.x,
            y: screenY / this.zoom + this.y
        };
    }
    zoomAt(screenX, screenY, delta) {
        const worldPos = this.screenToWorld(screenX, screenY);
        this.zoom *= delta;
        this.zoom = Math.max(this.minZoom, Math.min(this.maxZoom, this.zoom));
        this.x = worldPos.x - screenX / this.zoom;
        this.y = worldPos.y - screenY / this.zoom;
    }
    pan(dx, dy) {
        this.x -= dx / this.zoom;
        this.y -= dy / this.zoom;
    }
    zoomToFit(worldWidth, worldHeight, screenWidth, screenHeight) {
        const padding = 100;
        const zoomX = screenWidth / (worldWidth + padding * 2);
        const zoomY = screenHeight / (worldHeight + padding * 2);
        this.zoom = Math.min(zoomX, zoomY);
        this.x = -padding;
        this.y = -padding;
    }
}

class GlobalSpawnTimer {
    constructor(interval = 2.5) {
        this.interval = interval;
        this.timer = 0;
        this.shouldSpawn = false;
    }
    update(dt) {
        this.timer += dt;
        if (this.timer >= this.interval) {
            this.timer = 0;
            this.shouldSpawn = true;
            return true;
        }
        this.shouldSpawn = false;
        return false;
    }
}

class Particle {
    constructor(x, y, color, size, type) {
        this.x = x; this.y = y; this.color = color; this.size = size; this.type = type;
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * (type === 'explosion' ? 120 : 60);
        this.vx = Math.cos(angle) * speed;
        this.vy = Math.sin(angle) * speed;
        this.life = 0.8;
        this.maxLife = 0.8;
    }
    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }
    draw(ctx, camera) {
        const screen = camera.worldToScreen(this.x, this.y);
        ctx.globalAlpha = this.life / this.maxLife;
        ctx.fillStyle = this.color;

        if (this.type === 'hit') {
            // Spark line
            ctx.beginPath();
            ctx.moveTo(screen.x, screen.y);
            ctx.lineTo(screen.x - this.vx * 0.1, screen.y - this.vy * 0.1);
            ctx.strokeStyle = this.color;
            ctx.lineWidth = 2 * camera.zoom;
            ctx.stroke();
        } else {
            // Circle
            ctx.beginPath();
            ctx.arc(screen.x, screen.y, this.size * 0.6 * camera.zoom, 0, Math.PI * 2); // Smaller ("finitas")
            ctx.fill();
        }
        ctx.globalAlpha = 1.0;
    }
}

class AIController {
    constructor(game, playerId) {
        this.game = game;
        this.playerId = playerId; // 1 (Red)
        this.timer = 0;
        this.decisionInterval = 1.5; // Seconds between decisions
    }

    update(dt) {
        this.timer += dt;
        if (this.timer >= this.decisionInterval) {
            this.timer = 0;
            this.makeDecision();
        }
    }

    makeDecision() {
        const myNodes = this.game.nodes.filter(n => n.owner === this.playerId);
        const availableNodes = this.game.nodes.filter(n => n.owner !== this.playerId);

        if (myNodes.length === 0) return; // Dead

        myNodes.forEach(sourceNode => {
            // If we have enough defenders, attack!
            if (sourceNode.defendersInside > 10 || (sourceNode.defendersInside > 5 && Math.random() < 0.3)) {
                // Find closest target
                let closest = null;
                let minDist = Infinity;

                for (let target of availableNodes) {
                    const dx = target.x - sourceNode.x;
                    const dy = target.y - sourceNode.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    // Prioritize neutral nodes or weak enemies
                    let score = dist;
                    if (target.owner === -1) score *= 0.5; // Prefer neutrals
                    else if (target.defendersInside < 5) score *= 0.7; // Prefer weak enemies

                    if (score < minDist) {
                        minDist = score;
                        closest = target;
                    }
                }

                if (closest) {
                    this.attack(sourceNode, closest);
                }
            }
        });
    }

    attack(sourceNode, targetNode) {
        // Select available units in source node
        const units = this.game.entities.filter(e =>
            e.owner === this.playerId &&
            !e.dead &&
            !e.targetNode && // Don't redirect units already on mission? Actually, maybe redirect idle ones
            Math.sqrt((e.x - sourceNode.x) ** 2 + (e.y - sourceNode.y) ** 2) <= sourceNode.influenceRadius
        );

        // Send 60% of them
        const count = Math.ceil(units.length * 0.6);
        const attackers = units.slice(0, count);

        attackers.forEach(e => {
            e.setTarget(targetNode.x, targetNode.y, targetNode);
        });
    }
}

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');

        this.resize();
        this.camera = new Camera();
        this.globalSpawnTimer = new GlobalSpawnTimer(2.5);

        this.setupEvents();
        this.init();
    }

    init() {
        this.nodes = [];
        this.entities = [];
        this.selectedEntities = [];
        this.selectedNodes = [];
        this.commandIndicators = [];
        this.waypointLines = [];

        this.mouse = { x: 0, y: 0, down: false, drag: false };
        this.mouseDownPos = { x: 0, y: 0 };
        this.spacePressed = false;
        this.lastMouseWorld = { x: 0, y: 0 };

        this.rightMouseDown = false;
        this.commandHoldTimer = 0;
        this.waypointLinePoints = [];

        this.selectBox = false;
        this.isPanning = false;
        this.rallyMode = false;

        this.ai = null; // Removed single AI
        this.ais = [];
        this.playerCount = 4; // 4 Players (1 Human + 3 AI)

        this.createLevel();
        this.createInitialEntities();

        // Init AIs for players 1, 2, 3
        for (let i = 1; i < this.playerCount; i++) {
            this.ais.push(new AIController(this, i));
        }
    }

    createLevel() {
        this.nodes = [];
        let idCounter = 1;
        const cx = this.worldWidth / 2;
        const cy = this.worldHeight / 2;
        const radius = Math.min(this.worldWidth, this.worldHeight) * 0.35;

        // Central Node
        this.nodes.push(new Node(idCounter++, cx, cy, -1, 'large'));

        // Generate Random "Template" for consistency (Symmetric balance)
        const templateNodes = [];
        const satellites = 2 + Math.floor(Math.random() * 2); // 2-3 satellite neutrals per player
        for (let j = 0; j < satellites; j++) {
            const dist = 100 + Math.random() * 200;
            const angleOffset = (Math.random() - 0.5) * 1.0; // +/- radians
            const type = Math.random() > 0.7 ? 'medium' : 'small';
            templateNodes.push({ dist, angleOffset, type });
        }

        // Place Player Bases and Symmetric Neutrals
        for (let i = 0; i < this.playerCount; i++) {
            const angleBase = (i / this.playerCount) * Math.PI * 2 - Math.PI / 2;

            // Home Base
            const bx = cx + Math.cos(angleBase) * radius;
            const by = cy + Math.sin(angleBase) * radius;
            this.nodes.push(new Node(idCounter++, bx, by, i, 'large'));

            // Symmetric Neutrals relative to Home Base or Center?
            // Relative to Home Base connects them to player.
            // Relative to Center with rotation is cleaner for "map sectors".
            // Let's do relative to Home Base to give starting resources.
            templateNodes.forEach(tmpl => {
                const angle = angleBase + tmpl.angleOffset; // Rotate template
                const nx = bx + Math.cos(angle + Math.PI) * tmpl.dist; // Towards center? or just offset?
                // Let's put them between base and center
                const tx = cx + Math.cos(angleBase + tmpl.angleOffset * 0.5) * (radius * 0.6 + Math.random() * 100);
                // Wait, to be perfectly symmetric, I must use exact rotated coordinates from a "wedge".

                // Better approach: Define wedge relative to CENTER
                // Wedge center angle = angleBase.
                // Template is polar offset (d, theta) from Center, rotated by angleBase.
            });
        }

        // Let's retry the loop with proper wedge symmetry
        // We generated templateNodes with { dist, angleOffset, type } relative to base... no.

        // Clear and restart loop concept
        // New Template: Nodes in the "Sector 0".
        const sectorNeutrals = [];
        for (let j = 0; j < 3; j++) {
            // Random pos in sector
            const dist = radius * (0.3 + Math.random() * 0.5); // Between center and base
            const ang = (Math.random() - 0.5) * (Math.PI * 2 / this.playerCount) * 0.8;
            const type = Math.random() > 0.5 ? 'medium' : 'small';
            sectorNeutrals.push({ dist, ang, type });
        }

        for (let i = 0; i < this.playerCount; i++) {
            const sectorAngle = (i / this.playerCount) * Math.PI * 2 - Math.PI / 2;

            // Base
            const bx = cx + Math.cos(sectorAngle) * radius;
            const by = cy + Math.sin(sectorAngle) * radius;
            this.nodes.push(new Node(idCounter++, bx, by, i, 'large'));

            // Neutrals
            sectorNeutrals.forEach(n => {
                const na = sectorAngle + n.ang;
                const nx = cx + Math.cos(na) * n.dist;
                const ny = cy + Math.sin(na) * n.dist;
                this.nodes.push(new Node(idCounter++, nx, ny, -1, n.type));
            });
        }
    }

    createInitialEntities() {
        // Spawn actual units for all players
        for (let i = 0; i < this.playerCount; i++) {
            // Find base(s) for player i
            const myNodes = this.nodes.filter(n => n.owner === i);
            myNodes.forEach(node => {
                const count = node.type === 'large' ? 12 : 8;
                for (let k = 0; k < count; k++) {
                    const angle = (k / count) * Math.PI * 2;
                    const dist = 70 + Math.random() * 40;
                    this.entities.push(new Entity(
                        node.x + Math.cos(angle) * dist,
                        node.y + Math.sin(angle) * dist,
                        i,
                        Date.now() + k + (i * 100)
                    ));
                }
            });
        }
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEvents() {
        this.canvas.addEventListener('contextmenu', (e) => { e.preventDefault(); e.stopPropagation(); return false; });
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });

        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') { this.spacePressed = true; e.preventDefault(); }
            if (e.key === 'Escape') { this.clearSelection(); this.rallyMode = false; }
            if (e.key === 't' || e.key === 'T') { if (this.selectedNodes.length > 0) this.rallyMode = true; }
            if (e.key === 's' || e.key === 'S') { this.stopSelectedEntities(); }
        });

        document.addEventListener('keyup', (e) => { if (e.code === 'Space') this.spacePressed = false; });
        window.addEventListener('resize', () => this.resize());

        // Check if reset button exists
        const resetBtn = document.getElementById('reset-btn');
        if (resetBtn) resetBtn.addEventListener('click', () => this.reset());
    }

    stopSelectedEntities() {
        this.selectedEntities.forEach(ent => { if (!ent.dead) ent.stop(); });
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        this.mouse.x = e.clientX - rect.left;
        this.mouse.y = e.clientY - rect.top;
        this.mouse.down = true;
        this.mouse.drag = false;
        this.mouseDownPos = { x: this.mouse.x, y: this.mouse.y };

        const worldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
        this.lastMouseWorld = worldPos;

        if (this.rallyMode && this.selectedNodes.length > 0) {
            this.selectedNodes.forEach(node => { node.setRallyPoint(worldPos.x, worldPos.y); });
            this.rallyMode = false;
            this.mouse.down = false;
            return;
        }

        if (e.button === 2) {
            this.rightMouseDown = true;
            this.waypointLinePoints = [{ x: worldPos.x, y: worldPos.y }];
            const clickedNode = this.nodes.find(n => n.isPointInside(this.mouse.x, this.mouse.y, this.camera));
            this.executeCommand(worldPos.x, worldPos.y, clickedNode);
            return;
        }

        if (this.spacePressed || e.button === 1) {
            this.isPanning = true;
            return;
        }

        const localPlayerId = 0;
        const clickedEntity = this.entities.find(ent => ent.owner === localPlayerId && !ent.dead && ent.isPointInside(this.mouse.x, this.mouse.y, this.camera));
        const clickedNode = this.nodes.find(n => n.isPointInside(this.mouse.x, this.mouse.y, this.camera));

        if (e.shiftKey) {
            if (clickedEntity) { clickedEntity.selected = !clickedEntity.selected; this.updateSelectionArrays(); }
            else if (clickedNode && clickedNode.owner === localPlayerId) { clickedNode.selected = !clickedNode.selected; this.updateSelectionArrays(); }
        } else {
            if (clickedEntity) {
                this.clearSelection(); clickedEntity.selected = true; this.selectedEntities.push(clickedEntity);
            } else if (clickedNode && clickedNode.owner === localPlayerId) {
                this.clearSelection(); clickedNode.selected = true; this.selectedNodes.push(clickedNode);
                this.entities.forEach(ent => {
                    if (ent.owner === localPlayerId && !ent.dead) {
                        const dx = ent.x - clickedNode.x, dy = ent.y - clickedNode.y;
                        if (Math.sqrt(dx * dx + dy * dy) < clickedNode.influenceRadius) { ent.selected = true; this.selectedEntities.push(ent); }
                    }
                });
            } else if (clickedNode && clickedNode.owner !== localPlayerId && this.selectedEntities.length > 0) {
                this.attackNode(clickedNode);
            } else {
                this.clearSelection(); this.selectBox = true;
            }
        }
    }

    onMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const newX = e.clientX - rect.left;
        const newY = e.clientY - rect.top;

        if (this.isPanning && this.mouse.down) {
            this.camera.pan(newX - this.mouse.x, newY - this.mouse.y);
        }

        this.mouse.x = newX;
        this.mouse.y = newY;
        this.lastMouseWorld = this.camera.screenToWorld(this.mouse.x, this.mouse.y);

        if (this.rightMouseDown && this.selectedEntities.length > 0) {
            const worldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
            const lastPoint = this.waypointLinePoints[this.waypointLinePoints.length - 1];
            const dx = worldPos.x - lastPoint.x, dy = worldPos.y - lastPoint.y;

            if (Math.sqrt(dx * dx + dy * dy) > 30) {
                this.waypointLinePoints.push({ x: worldPos.x, y: worldPos.y });
                this.selectedEntities.forEach(ent => { if (!ent.dead) ent.addWaypoint(worldPos.x, worldPos.y); });
            }
        }

        if (this.mouse.down && !this.mouse.drag) {
            const dx = this.mouse.x - this.mouseDownPos.x, dy = this.mouse.y - this.mouseDownPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > 5) { this.mouse.drag = true; }
        }
    }

    onMouseUp(e) {
        if (e.button === 2) {
            this.rightMouseDown = false;
            if (this.waypointLinePoints.length > 1 && this.selectedEntities.length > 0) {
                this.waypointLines.push(new WaypointLine([...this.waypointLinePoints], 0));
            }
            this.waypointLinePoints = [];
        }

        if (this.isPanning) { this.isPanning = false; this.mouse.down = false; return; }

        if (this.mouse.down && this.selectBox && this.mouse.drag) {
            this.selectInBox(this.mouseDownPos.x, this.mouseDownPos.y, this.mouse.x, this.mouse.y);
        }

        this.mouse.down = false;
        this.mouse.drag = false;
        this.selectBox = false;
    }

    executeCommand(worldX, worldY, targetNode = null) {
        if (this.selectedEntities.length === 0) return;
        this.commandIndicators.push(new CommandIndicator(worldX, worldY, 'move', true));
        this.selectedEntities.forEach(ent => { if (!ent.dead) ent.setTarget(worldX, worldY, targetNode); });
    }

    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        this.camera.zoomAt(e.clientX - rect.left, e.clientY - rect.top, e.deltaY > 0 ? 0.9 : 1.1);
    }

    selectInBox(x1, y1, x2, y2) {
        const localPlayerId = 0;
        this.entities.forEach(ent => {
            if (ent.owner === localPlayerId && !ent.dead && ent.isInsideRect(x1, y1, x2, y2, this.camera)) { ent.selected = true; }
        });
        this.updateSelectionArrays();
    }

    updateSelectionArrays() {
        this.selectedEntities = this.entities.filter(e => e.selected && !e.dead);
        this.selectedNodes = this.nodes.filter(n => n.selected);
        if (this.selectedNodes.length === 0) this.rallyMode = false;
    }

    attackNode(targetNode) {
        this.commandIndicators.push(new CommandIndicator(targetNode.x, targetNode.y, 'attack', true));
        const count = Math.ceil(this.selectedEntities.length / 2);
        const attackers = this.selectedEntities.slice(0, count);
        attackers.forEach(ent => { if (!ent.dead) ent.setTarget(targetNode.x, targetNode.y, targetNode); });
        this.clearSelection();
    }

    clearSelection() {
        this.entities.forEach(e => e.selected = false);
        this.nodes.forEach(n => n.selected = false);
        this.selectedEntities = [];
        this.selectedNodes = [];
        this.rallyMode = false;
    }

    update(dt) {
        this.globalSpawnTimer.update(dt);
        // Update all AIs
        if (this.ais) this.ais.forEach(ai => ai.update(dt));
        else if (this.ai) this.ai.update(dt); // Fallback? No, replaced.

        this.particles = this.particles.filter(p => p.update(dt));

        this.nodes.forEach(node => {
            const newEntity = node.update(dt, this.entities, this.globalSpawnTimer, this);
            if (newEntity) this.entities.push(newEntity);
        });

        this.entities.forEach(ent => ent.update(dt, this.entities, this.nodes, this.camera, this));

        this.commandIndicators = this.commandIndicators.filter(indicator => indicator.update(dt));
        this.waypointLines = this.waypointLines.filter(line => line.update(dt));

        this.entities = this.entities.filter(ent => !ent.dead);
        this.selectedEntities = this.selectedEntities.filter(ent => !ent.dead);
    }

    draw() {
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

        this.drawGrid();

        // Links
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)'; // More visible ("que se vea mas")
        this.ctx.lineWidth = 2 * this.camera.zoom;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const pos1 = this.camera.worldToScreen(this.nodes[i].x, this.nodes[i].y);
                const pos2 = this.camera.worldToScreen(this.nodes[j].x, this.nodes[j].y);
                this.ctx.beginPath(); this.ctx.moveTo(pos1.x, pos1.y); this.ctx.lineTo(pos2.x, pos2.y); this.ctx.stroke();
            }
        }

        this.waypointLines.forEach(line => line.draw(this.ctx, this.camera));

        if (this.rightMouseDown && this.waypointLinePoints.length > 1) {
            const line = new WaypointLine(this.waypointLinePoints, 0);
            line.life = 1.0;
            line.draw(this.ctx, this.camera);
        }

        this.commandIndicators.forEach(indicator => indicator.draw(this.ctx, this.camera));

        if (this.mouse.down && this.selectBox && this.mouse.drag) {
            const x = Math.min(this.mouseDownPos.x, this.mouse.x), y = Math.min(this.mouseDownPos.y, this.mouse.y);
            const w = Math.abs(this.mouse.x - this.mouseDownPos.x), h = Math.abs(this.mouse.y - this.mouseDownPos.y);
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)'; this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)'; this.ctx.lineWidth = 1.5; this.ctx.strokeRect(x, y, w, h);
        }

        this.nodes.forEach(node => node.draw(this.ctx, this.camera));
        this.entities.forEach(ent => ent.draw(this.ctx, this.camera));
        this.particles.forEach(p => p.draw(this.ctx, this.camera));

        if (this.rallyMode && this.selectedNodes.length > 0) {
            this.ctx.fillStyle = 'rgba(255, 255, 0, 0.8)';
            this.ctx.font = 'bold 16px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('MODO RALLY: Click para setear punto de spawn', this.canvas.width / 2, 50);
        }

        this.drawUI();
    }

    drawGrid() {
        const gridSize = 100 * this.camera.zoom;
        const offsetX = (-this.camera.x * this.camera.zoom) % gridSize;
        const offsetY = (-this.camera.y * this.camera.zoom) % gridSize;
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)'; this.ctx.lineWidth = 1;
        for (let x = offsetX; x < this.canvas.width; x += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(x, 0); this.ctx.lineTo(x, this.canvas.height); this.ctx.stroke(); }
        for (let y = offsetY; y < this.canvas.height; y += gridSize) { this.ctx.beginPath(); this.ctx.moveTo(0, y); this.ctx.lineTo(this.canvas.width, y); this.ctx.stroke(); }
    }

    drawUI() {
        const localPlayerId = 0;
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Seleccionados: ${this.selectedEntities.length}`, 20, 30);
        this.ctx.fillText(`Unidades: ${this.entities.filter(e => e.owner === localPlayerId).length}`, 20, 50);
        this.ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 20, 70);
        if (this.selectedEntities.length > 0) this.ctx.fillText('Hold Click Der: Línea de waypoints | S: Stop', 20, 90);
        if (this.selectedNodes.length > 0) this.ctx.fillText('T: Set Rally Point', 20, 110);
        this.ctx.textAlign = 'right';
        this.ctx.fillText('Izq: Select | Der: Mover/Hold línea | Wheel: Zoom | Space: Pan', this.canvas.width - 20, 30);
    }

    start() {
        let lastTime = performance.now();
        const loop = (now) => {
            const dt = Math.min((now - lastTime) / 1000, 0.05);
            lastTime = now;
            this.update(dt);
            this.draw();
            requestAnimationFrame(loop);
        };
        requestAnimationFrame(loop);
    }

    reset() {
        this.init();
    }

    spawnParticles(x, y, color, count, type) {
        for (let i = 0; i < count; i++) {
            this.particles.push(new Particle(x, y, color, Math.random() * 1.5 + 1, type)); // Smaller
        }
    }
}

window.onload = () => {
    const game = new Game('game-canvas');
    game.start();
};