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
        this.cohesionRadius = 60;
        this.cohesionForce = 80;
    }
    
    addWaypoint(x, y) {
        this.waypoints.push({x, y});
    }
    
    setTarget(x, y) {
        this.waypoints = [{x, y}];
        this.currentTarget = null;
    }
    
    stop() {
        this.waypoints = [];
        this.currentTarget = null;
        this.vx *= 0.3;
        this.vy *= 0.3;
    }
    
    update(dt, allEntities, nodes, camera) {
        if (this.dead) return;
        
        if (this.dying) {
            this.deathTime += dt;
            if (this.deathTime >= 0.4) this.dead = true;
            return;
        }
        
        this.processWaypoints();
        this.handleCollisionsAndCohesion(allEntities, nodes);
        
        this.vx += (Math.random() - 0.5) * 15 * dt;
        this.vy += (Math.random() - 0.5) * 15 * dt;
        
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist > 5) {
                this.vx += (dx/dist) * this.acceleration * dt;
                this.vy += (dy/dist) * this.acceleration * dt;
            }
        }
        
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        const speed = Math.sqrt(this.vx*this.vx + this.vy*this.vy);
        if (speed > this.maxSpeed) {
            this.vx = (this.vx/speed) * this.maxSpeed;
            this.vy = (this.vy/speed) * this.maxSpeed;
        }
        if (speed < 3 && speed > 0) {
            this.vx = (this.vx/speed) * 3;
            this.vy = (this.vy/speed) * 3;
        }
        
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        
        this.checkNodeProximity(nodes);
    }
    
    processWaypoints() {
        if (!this.currentTarget && this.waypoints.length > 0) {
            this.currentTarget = this.waypoints.shift();
        }
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < 15) {
                this.currentTarget = this.waypoints.length > 0 ? this.waypoints.shift() : null;
            }
        }
    }
    
    handleCollisionsAndCohesion(allEntities, nodes) {
        let cohesionX = 0, cohesionY = 0, cohesionCount = 0;
        
        for (let other of allEntities) {
            if (other === this || other.dead || other.dying) continue;
            const dx = other.x - this.x;
            const dy = other.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (other.owner === this.owner && dist < this.cohesionRadius && dist > this.radius*2) {
                cohesionX += dx/dist;
                cohesionY += dy/dist;
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
            const distSq = dx*dx + dy*dy;
            const minDist = this.radius + other.radius;
            
            if (distSq < minDist*minDist && distSq > 0) {
                const dist = Math.sqrt(distSq);
                const overlap = minDist - dist;
                const nx = dx/dist;
                const ny = dy/dist;
                
                this.x -= nx * overlap * 0.3;
                this.y -= ny * overlap * 0.3;
                
                if (this.owner !== other.owner) {
                    const relativeSpeed = Math.sqrt((this.vx-other.vx)**2 + (this.vy-other.vy)**2);
                    if (relativeSpeed > 40 || Math.random() < 0.2) {
                        this.die('explosion');
                        other.die('explosion');
                        return;
                    }
                }
                
                const dvx = other.vx - this.vx;
                const dvy = other.vy - this.vy;
                const velAlongNormal = dvx*nx + dvy*ny;
                if (velAlongNormal > 0) {
                    const j = -(1+0.3) * velAlongNormal * 0.5;
                    this.vx -= j*nx;
                    this.vy -= j*ny;
                    other.vx += j*nx;
                    other.vy += j*ny;
                }
            }
        }
        
        if (this.currentTarget) this.avoidObstacles(nodes, allEntities);
    }
    
    avoidObstacles(nodes, entities) {
        const targetDx = this.currentTarget.x - this.x;
        const targetDy = this.currentTarget.y - this.y;
        const targetDist = Math.sqrt(targetDx*targetDx + targetDy*targetDy);
        const targetNx = targetDx/targetDist;
        const targetNy = targetDy/targetDist;
        
        for (let node of nodes) {
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            if (dist < node.radius + 60 && dist > 10) {
                const dot = (dx/dist)*targetNx + (dy/dist)*targetNy;
                if (dot > 0.5) {
                    const perpX = -targetNy;
                    const perpY = targetNx;
                    const side = (dx*targetNy - dy*targetNx) > 0 ? 1 : -1;
                    this.vx += perpX * side * 150 * 0.016;
                    this.vy += perpY * side * 150 * 0.016;
                }
            }
        }
    }
    
    checkNodeProximity(nodes) {
        for (let node of nodes) {
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            
            if (dist < node.radius + this.radius) {
                if (node.owner === this.owner) {
                    const nx = dx/dist;
                    const ny = dy/dist;
                    const pushDistance = (node.radius + this.radius) - dist + 2;
                    this.x -= nx * pushDistance;
                    this.y -= ny * pushDistance;
                    this.vx -= nx * 80;
                    this.vy -= ny * 80;
                } else {
                    if (!this.dying) {
                        node.receiveAttack(this.owner, 1);
                        this.die('attack');
                    }
                }
                return;
            }
        }
    }
    
    die(type) {
        this.dying = true;
        this.deathType = type;
        this.deathTime = 0;
    }
    
    isPointInside(x, y, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const dx = x - screenX;
        const dy = y - screenY;
        return Math.sqrt(dx*dx + dy*dy) < (this.radius + 5) * camera.zoom;
    }
    
    isInsideRect(x1, y1, x2, y2, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
  
