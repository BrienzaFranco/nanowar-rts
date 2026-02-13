// NANOWAR RTS v3.3 - Sistema de Waypoints Mejorado
// =================================================
// - Waypoints como línea continua (no puntos individuales)
// - Tecla T: Setear punto de rally/spawn
// - Tecla S: Stop total del movimiento
// - Zoom inicial muestra todo el mapa
// - Nodos de diferentes tamaños (chicos y grandes)
// - Mapa asimétrico
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
                // Punto final de la línea (más visible)
                ctx.beginPath();
                ctx.arc(screenX, screenY, 4 * camera.zoom, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(100, 200, 255, ${alpha * 0.8})`;
                ctx.fill();
            } else {
                // Punto intermedio (sutil)
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
        this.points = points; // Array de {x, y}
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
        
        const alpha = Math.max(0, this.life / this.maxLife) * 0.3; // Muy transparente
        const color = PLAYER_COLORS[this.owner % PLAYER_COLORS.length];
        
        ctx.strokeStyle = color.replace(')', `, ${alpha})`).replace('rgb', 'rgba');
        if (!color.startsWith('rgb')) {
            // Convertir hex a rgba
            const r = parseInt(color.slice(1, 3), 16);
            const g = parseInt(color.slice(3, 5), 16);
            const b = parseInt(color.slice(5, 7), 16);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
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
        
        // Dibujar puntos en cada waypoint
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
 * CLASE ENTITY
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
    
    setTarget(x, y) {
        this.waypoints = [{ x, y }];
        this.currentTarget = null;
    }
    
    // Stop total - limpiar todos los waypoints
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
        
        // Movimiento idle muy suave
        this.vx += (Math.random() - 0.5) * 10 * dt;
        this.vy += (Math.random() - 0.5) * 10 * dt;
        
        // Movimiento hacia target actual
        if (this.currentTarget) {
            const dx = this.currentTarget.x - this.x;
            const dy = this.currentTarget.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 5) {
                this.vx += (dx / dist) * this.acceleration * dt;
                this.vy += (dy / dist) * this.acceleration * dt;
            }
        }
        
        // Fricción
        this.vx *= this.friction;
        this.vy *= this.friction;
        
        // Limitar velocidad
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
        
        this.checkNodeProximity(nodes);
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
        // Cohesión
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
        
        // Colisiones suaves
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
    
    checkNodeProximity(nodes) {
        for (let node of nodes) {
            const dx = node.x - this.x;
            const dy = node.y - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            // Si está tocando el nodo (colisión)
            if (dist < node.radius + this.radius) {
                if (node.owner === this.owner) {
                    // NODO PROPIO: Rebote suave
                    const nx = dx / dist;
                    const ny = dy / dist;
                    const pushDistance = (node.radius + this.radius) - dist + 2;
                    this.x -= nx * pushDistance;
                    this.y -= ny * pushDistance;
                    this.vx -= nx * 80;
                    this.vy -= ny * 80;
                } else {
                    // NODO ENEMIGO O NEUTRAL: Atacar y conquistar
                    // Solo atacar si no estamos muriendo ya
                    if (!this.dying) {
                        console.log(`Entidad ${this.id} atacando nodo ${node.id}. HP antes: ${node.hp}`);
                        node.hp -= this.damage;
                        console.log(`HP después: ${node.hp}`);
                        
                        // Verificar conquista INMEDIATAMENTE
                        if (node.hp <= 0) {
                            console.log(`¡CONQUISTA! Nodo ${node.id} capturado por jugador ${this.owner}`);
                            node.owner = this.owner;
                            node.hp = 10; // HP inicial tras conquista
                            // Resetear spawn timer para que empiece a producir
                            node.hasSpawnedThisCycle = false;
                        }
                        
                        // La entidad muere al atacar (1 por 1)
                        this.die('attack', node);
                    }
                }
                return;
            }
        }
    }
    
    moveTo(x, y) {
        this.setTarget(x, y);
    }
    
    die(type, node = null) {
        this.dying = true;
        this.deathType = type;
        this.absorbTarget = node;
        this.deathTime = 0;
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
        
        // Sombra
        ctx.beginPath();
        ctx.arc(screenX + 1, screenY + 1, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.fill();
        
        // Cuerpo
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        const baseColor = PLAYER_COLORS[this.owner % PLAYER_COLORS.length];
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Brillo
        ctx.beginPath();
        ctx.arc(screenX - screenRadius * 0.3, screenY - screenRadius * 0.3, screenRadius * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.fill();
        
        // Selección
        if (this.selected) {
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius + 3 * camera.zoom, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.9)';
            ctx.lineWidth = 1.5 * camera.zoom;
            ctx.stroke();
        }
        
        // Indicador de dirección si tiene waypoints
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
    }
}

/**
 * CLASE NODE con diferentes tipos
 */
class Node {
    constructor(id, x, y, ownerId, type = 'medium') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.owner = ownerId;
        this.type = type; // 'small', 'medium', 'large'
        
        // Propiedades según tipo
        if (type === 'small') {
            this.radius = 35;
            this.influenceRadius = 90;
            this.hp = 8;
            this.maxHp = 60;
            this.spawnInterval = 2.0; // Spawnea más rápido
        } else if (type === 'large') {
            this.radius = 70;
            this.influenceRadius = 150;
            this.hp = 15;
            this.maxHp = 150;
            this.spawnInterval = 3.5; // Spawnea más lento
        } else { // medium
            this.radius = 55;
            this.influenceRadius = 120;
            this.hp = 10;
            this.maxHp = 100;
            this.spawnInterval = 2.5;
        }
        
        this.selected = false;
        this.hasSpawnedThisCycle = false;
        this.rallyPoint = null; // Punto de rally/spawn
    }
    
    getColor() {
        if (this.owner === -1) return '#757575';
        return PLAYER_COLORS[this.owner % PLAYER_COLORS.length];
    }
    
    // Setear punto de rally
    setRallyPoint(x, y) {
        this.rallyPoint = { x, y };
    }
    
    update(dt, entities, globalSpawnTimer) {
        // Calcular HP basado en protectores
        let protectors = 0;
        for (let e of entities) {
            if (e.owner === this.owner && !e.dead && !e.dying) {
                const dx = e.x - this.x;
                const dy = e.y - this.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < this.influenceRadius) protectors++;
            }
        }
        
        // HP base según tipo + protección
        const baseHp = this.type === 'small' ? 8 : this.type === 'large' ? 15 : 10;
        this.hp = Math.min(this.maxHp, baseHp + protectors);
        
        // Spawning
        if (this.owner !== -1 && globalSpawnTimer.shouldSpawn && !this.hasSpawnedThisCycle) {
            this.hasSpawnedThisCycle = true;
            
            const angle = Math.random() * Math.PI * 2;
            const dist = this.radius + 25 + Math.random() * 40;
            
            // Si tiene rally point, spawnear cerca del rally
            let spawnX, spawnY;
            if (this.rallyPoint) {
                const rallyAngle = Math.random() * Math.PI * 2;
                const rallyDist = 30 + Math.random() * 20;
                spawnX = this.rallyPoint.x + Math.cos(rallyAngle) * rallyDist;
                spawnY = this.rallyPoint.y + Math.sin(rallyAngle) * rallyDist;
            } else {
                spawnX = this.x + Math.cos(angle) * dist;
                spawnY = this.y + Math.sin(angle) * dist;
            }
            
            const entity = new Entity(spawnX, spawnY, this.owner, Date.now() + Math.random());
            
            // Si tiene rally point, la entidad va directo ahí
            if (this.rallyPoint && (Math.abs(spawnX - this.rallyPoint.x) > 5 || Math.abs(spawnY - this.rallyPoint.y) > 5)) {
                entity.setTarget(this.rallyPoint.x, this.rallyPoint.y);
            }
            
            return entity;
        }
        
        if (!globalSpawnTimer.shouldSpawn) {
            this.hasSpawnedThisCycle = false;
        }
        
        return null;
    }
    
    draw(ctx, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const screenRadius = this.radius * camera.zoom;
        const screenInfluence = this.influenceRadius * camera.zoom;
        const baseColor = this.getColor();
        
        // Si el nodo está por ser conquistado (HP bajo), mostrar efecto de alerta
        const hpPercent = this.hp / this.maxHp;
        const isCritical = hpPercent <= 0.3 && this.owner !== -1;
        
        const r = parseInt(baseColor.slice(1, 3), 16);
        const g = parseInt(baseColor.slice(3, 5), 16);
        const b = parseInt(baseColor.slice(5, 7), 16);
        
        // Área de influencia
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenInfluence, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.03)`;
        ctx.fill();
        
        // Si está crítico, hacer el borde más visible/pulsante
        if (isCritical) {
            const pulse = Math.sin(Date.now() * 0.01) * 0.5 + 0.5;
            ctx.strokeStyle = `rgba(255, 50, 50, ${0.3 + pulse * 0.4})`;
            ctx.lineWidth = (2 + pulse * 2) * camera.zoom;
        } else {
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.1)`;
            ctx.lineWidth = 1 * camera.zoom;
        }
        ctx.stroke();
        
        // Dibujar rally point si existe
        if (this.rallyPoint && this.owner !== -1) {
            const rallyScreenX = (this.rallyPoint.x - camera.x) * camera.zoom;
            const rallyScreenY = (this.rallyPoint.y - camera.y) * camera.zoom;
            
            // Línea punteada al rally point
            ctx.beginPath();
            ctx.moveTo(screenX, screenY);
            ctx.lineTo(rallyScreenX, rallyScreenY);
            ctx.strokeStyle = `rgba(${r}, ${g}, ${b}, 0.3)`;
            ctx.lineWidth = 1 * camera.zoom;
            ctx.setLineDash([3 * camera.zoom, 3 * camera.zoom]);
            ctx.stroke();
            ctx.setLineDash([]);
            
            // Indicador de rally
            ctx.beginPath();
            ctx.arc(rallyScreenX, rallyScreenY, 5 * camera.zoom, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${r}, ${g}, ${b}, 0.6)`;
            ctx.fill();
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            ctx.lineWidth = 1 * camera.zoom;
            ctx.stroke();
        }
        
        // Nodo principal
        ctx.beginPath();
        ctx.arc(screenX, screenY, screenRadius, 0, Math.PI * 2);
        ctx.fillStyle = baseColor;
        ctx.fill();
        
        // Borde según selección
        ctx.strokeStyle = this.selected ? 'rgba(255, 255, 255, 0.9)' : 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = this.selected ? 3 * camera.zoom : 1 * camera.zoom;
        ctx.stroke();
        
        // Indicador de tipo (anillo interno)
        if (this.type === 'small') {
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius * 0.7, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
            ctx.lineWidth = 2 * camera.zoom;
            ctx.stroke();
        } else if (this.type === 'large') {
            // Doble borde para nodos grandes
            ctx.beginPath();
            ctx.arc(screenX, screenY, screenRadius + 5 * camera.zoom, 0, Math.PI * 2);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 2 * camera.zoom;
            ctx.stroke();
        }
        
        // Barra de vida
        const barWidth = screenRadius * 2;
        const barHeight = 5 * camera.zoom;
        const hpPercent = this.hp / this.maxHp;
        
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(screenX - barWidth / 2, screenY + screenRadius + 8 * camera.zoom, barWidth, barHeight);
        
        ctx.fillStyle = hpPercent > 0.5 ? '#4CAF50' : hpPercent > 0.25 ? '#FFC107' : '#f44336';
        ctx.fillRect(screenX - barWidth / 2, screenY + screenRadius + 8 * camera.zoom, barWidth * hpPercent, barHeight);
        
        // HP
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.font = `${Math.floor(11 * camera.zoom)}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(Math.floor(this.hp), screenX, screenY + 1);
    }
    
    isPointInside(x, y, camera) {
        const screenX = (this.x - camera.x) * camera.zoom;
        const screenY = (this.y - camera.y) * camera.zoom;
        const dx = x - screenX;
        const dy = y - screenY;
        return Math.sqrt(dx * dx + dy * dy) < this.radius * camera.zoom;
    }
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
    
    // Zoom para ver todo el mundo
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

class Game {
    constructor(canvasId) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        
        this.camera = new Camera();
        this.globalSpawnTimer = new GlobalSpawnTimer(2.5);
        
        this.nodes = [];
        this.entities = [];
        this.selectedEntities = [];
        this.selectedNodes = [];
        this.commandIndicators = [];
        this.waypointLines = []; // Líneas de waypoint
        
        this.mouse = { x: 0, y: 0, down: false, drag: false };
        this.mouseDownPos = { x: 0, y: 0 };
        this.spacePressed = false;
        this.lastMouseWorld = { x: 0, y: 0 };
        
        this.rightMouseDown = false;
        this.commandHoldTimer = 0;
        this.waypointLinePoints = []; // Puntos para la línea actual
        
        this.selectBox = false;
        this.isPanning = false;
        this.dragThreshold = 5;
        
        this.worldWidth = 3500; // Más grande
        this.worldHeight = 2500;
        
        // Modo rally point
        this.rallyMode = false;
        
        this.init();
        this.setupEvents();
        this.start();
    }
    
    init() {
        this.resize();
        
        // Zoom inicial muestra todo
        this.camera.zoomToFit(this.worldWidth, this.worldHeight, this.canvas.width, this.canvas.height);
        
        this.createAsymmetricNodes();
        this.createInitialEntities();
    }
    
    createAsymmetricNodes() {
        // Jugador 1 - Abajo (posición defensiva)
        this.nodes.push(new Node(0, this.worldWidth * 0.3, this.worldHeight - 200, 0, 'large'));
        this.nodes.push(new Node(1, this.worldWidth * 0.7, this.worldHeight - 300, 0, 'small'));
        
        // Jugador 2 - Arriba (posición ofensiva)
        this.nodes.push(new Node(2, this.worldWidth * 0.5, 200, 1, 'large'));
        this.nodes.push(new Node(3, this.worldWidth * 0.2, 400, 1, 'small'));
        
        // Nodos neutrales distribuidos asimétricamente
        const neutralNodes = [
            { x: this.worldWidth * 0.15, y: this.worldHeight * 0.4, type: 'small' },
            { x: this.worldWidth * 0.85, y: this.worldHeight * 0.35, type: 'medium' },
            { x: this.worldWidth * 0.25, y: this.worldHeight * 0.6, type: 'medium' },
            { x: this.worldWidth * 0.75, y: this.worldHeight * 0.65, type: 'small' },
            { x: this.worldWidth * 0.45, y: this.worldHeight * 0.45, type: 'large' }, // Centro
            { x: this.worldWidth * 0.6, y: this.worldHeight * 0.25, type: 'small' },
            { x: this.worldWidth * 0.35, y: this.worldHeight * 0.75, type: 'small' },
        ];
        
        neutralNodes.forEach((pos, i) => {
            this.nodes.push(new Node(i + 4, pos.x, pos.y, -1, pos.type));
        });
    }
    
    createInitialEntities() {
        // Entidades para jugador 1 (más entidades por tener más nodos)
        [0, 1].forEach(nodeIndex => {
            const node = this.nodes[nodeIndex];
            const count = node.type === 'large' ? 12 : 8;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const dist = 70 + Math.random() * 40;
                this.entities.push(new Entity(
                    node.x + Math.cos(angle) * dist,
                    node.y + Math.sin(angle) * dist,
                    0,
                    Date.now() + i + nodeIndex * 100
                ));
            }
        });
        
        // Entidades para jugador 2
        [2, 3].forEach(nodeIndex => {
            const node = this.nodes[nodeIndex];
            const count = node.type === 'large' ? 12 : 8;
            for (let i = 0; i < count; i++) {
                const angle = (i / count) * Math.PI * 2;
                const dist = 70 + Math.random() * 40;
                this.entities.push(new Entity(
                    node.x + Math.cos(angle) * dist,
                    node.y + Math.sin(angle) * dist,
                    1,
                    Date.now() + i + nodeIndex * 100 + 1000
                ));
            }
        });
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    setupEvents() {
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            e.stopPropagation();
            return false;
        });
        
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        this.canvas.addEventListener('wheel', (e) => this.onWheel(e), { passive: false });
        
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space') {
                this.spacePressed = true;
                e.preventDefault();
            }
            if (e.key === 'Escape') {
                this.clearSelection();
                this.rallyMode = false;
            }
            // Tecla T: Modo rally point
            if (e.key === 't' || e.key === 'T') {
                if (this.selectedNodes.length > 0) {
                    this.rallyMode = true;
                }
            }
            // Tecla S: Stop
            if (e.key === 's' || e.key === 'S') {
                this.stopSelectedEntities();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            if (e.code === 'Space') this.spacePressed = false;
        });
        
        window.addEventListener('resize', () => this.resize());
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
    }
    
    stopSelectedEntities() {
        this.selectedEntities.forEach(ent => {
            if (!ent.dead) ent.stop();
        });
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
        
        // Modo rally point
        if (this.rallyMode && this.selectedNodes.length > 0) {
            this.selectedNodes.forEach(node => {
                node.setRallyPoint(worldPos.x, worldPos.y);
            });
            this.rallyMode = false;
            this.mouse.down = false;
            return;
        }
        
        // Click derecho - Iniciar línea de waypoints
        if (e.button === 2) {
            this.rightMouseDown = true;
            this.waypointLinePoints = [{ x: worldPos.x, y: worldPos.y }];
            this.executeCommand(worldPos.x, worldPos.y);
            return;
        }
        
        if (this.spacePressed || e.button === 1) {
            this.isPanning = true;
            return;
        }
        
        const localPlayerId = 0;
        const clickedEntity = this.entities.find(ent => 
            ent.owner === localPlayerId && !ent.dead && ent.isPointInside(this.mouse.x, this.mouse.y, this.camera)
        );
        const clickedNode = this.nodes.find(n => n.isPointInside(this.mouse.x, this.mouse.y, this.camera));
        
        if (e.shiftKey) {
            if (clickedEntity) {
                clickedEntity.selected = !clickedEntity.selected;
                this.updateSelectionArrays();
            } else if (clickedNode && clickedNode.owner === localPlayerId) {
                clickedNode.selected = !clickedNode.selected;
                this.updateSelectionArrays();
            }
        } else {
            if (clickedEntity) {
                this.clearSelection();
                clickedEntity.selected = true;
                this.selectedEntities.push(clickedEntity);
            } else if (clickedNode && clickedNode.owner === localPlayerId) {
                this.clearSelection();
                clickedNode.selected = true;
                this.selectedNodes.push(clickedNode);
                
                this.entities.forEach(ent => {
                    if (ent.owner === localPlayerId && !ent.dead) {
                        const dx = ent.x - clickedNode.x;
                        const dy = ent.y - clickedNode.y;
                        if (Math.sqrt(dx * dx + dy * dy) < clickedNode.influenceRadius) {
                            ent.selected = true;
                            this.selectedEntities.push(ent);
                        }
                    }
                });
            } else if (clickedNode && clickedNode.owner !== localPlayerId && this.selectedEntities.length > 0) {
                this.attackNode(clickedNode);
            } else {
                this.clearSelection();
                this.selectBox = true;
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
        
        // Dibujar línea de waypoints al mantener click derecho
        if (this.rightMouseDown && this.selectedEntities.length > 0) {
            const worldPos = this.camera.screenToWorld(this.mouse.x, this.mouse.y);
            
            // Agregar punto a la línea si se movió suficiente
            const lastPoint = this.waypointLinePoints[this.waypointLinePoints.length - 1];
            const dx = worldPos.x - lastPoint.x;
            const dy = worldPos.y - lastPoint.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > 30) {
                this.waypointLinePoints.push({ x: worldPos.x, y: worldPos.y });
                // Agregar waypoint a todas las entidades
                this.selectedEntities.forEach(ent => {
                    if (!ent.dead) ent.addWaypoint(worldPos.x, worldPos.y);
                });
            }
        }
        
        if (this.mouse.down && !this.mouse.drag) {
            const dx = this.mouse.x - this.mouseDownPos.x;
            const dy = this.mouse.y - this.mouseDownPos.y;
            if (Math.sqrt(dx * dx + dy * dy) > this.dragThreshold) {
                this.mouse.drag = true;
            }
        }
    }
    
    onMouseUp(e) {
        if (e.button === 2) {
            this.rightMouseDown = false;
            // Crear línea visual de waypoint
            if (this.waypointLinePoints.length > 1 && this.selectedEntities.length > 0) {
                this.waypointLines.push(new WaypointLine([...this.waypointLinePoints], 0));
            }
            this.waypointLinePoints = [];
        }
        
        if (this.isPanning) {
            this.isPanning = false;
            this.mouse.down = false;
            return;
        }
        
        if (this.mouse.down && this.selectBox && this.mouse.drag) {
            this.selectInBox(this.mouseDownPos.x, this.mouseDownPos.y, this.mouse.x, this.mouse.y);
        }
        
        this.mouse.down = false;
        this.mouse.drag = false;
        this.selectBox = false;
    }
    
    executeCommand(worldX, worldY) {
        if (this.selectedEntities.length === 0) return;
        
        this.commandIndicators.push(new CommandIndicator(worldX, worldY, 'move', true));
        
        this.selectedEntities.forEach(ent => {
            if (!ent.dead) ent.setTarget(worldX, worldY);
        });
    }
    
    onWheel(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
        this.camera.zoomAt(x, y, zoomFactor);
    }
    
    selectInBox(x1, y1, x2, y2) {
        const localPlayerId = 0;
        this.entities.forEach(ent => {
            if (ent.owner === localPlayerId && !ent.dead) {
                if (ent.isInsideRect(x1, y1, x2, y2, this.camera)) {
                    ent.selected = true;
                }
            }
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
        
        attackers.forEach(ent => {
            if (!ent.dead) ent.setTarget(targetNode.x, targetNode.y);
        });
        
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
        
        this.nodes.forEach(node => {
            const newEntity = node.update(dt, this.entities, this.globalSpawnTimer);
            if (newEntity) this.entities.push(newEntity);
        });
        
        this.entities.forEach(ent => {
            ent.update(dt, this.entities, this.nodes, this.camera);
        });
        
        this.commandIndicators = this.commandIndicators.filter(indicator => indicator.update(dt));
        this.waypointLines = this.waypointLines.filter(line => line.update(dt));
        
        this.entities = this.entities.filter(ent => !ent.dead);
        this.selectedEntities = this.selectedEntities.filter(ent => !ent.dead);
    }
    
    draw() {
        this.ctx.fillStyle = '#151515';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.drawGrid();
        
        // Líneas entre nodos
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.02)';
        this.ctx.lineWidth = 1 * this.camera.zoom;
        for (let i = 0; i < this.nodes.length; i++) {
            for (let j = i + 1; j < this.nodes.length; j++) {
                const pos1 = this.camera.worldToScreen(this.nodes[i].x, this.nodes[i].y);
                const pos2 = this.camera.worldToScreen(this.nodes[j].x, this.nodes[j].y);
                this.ctx.beginPath();
                this.ctx.moveTo(pos1.x, pos1.y);
                this.ctx.lineTo(pos2.x, pos2.y);
                this.ctx.stroke();
            }
        }
        
        // Dibujar líneas de waypoint
        this.waypointLines.forEach(line => line.draw(this.ctx, this.camera));
        
        // Dibujar línea actual si está manteniendo click derecho
        if (this.rightMouseDown && this.waypointLinePoints.length > 1) {
            const line = new WaypointLine(this.waypointLinePoints, 0);
            line.life = 1.0; // Forzar visibilidad completa
            line.draw(this.ctx, this.camera);
        }
        
        this.commandIndicators.forEach(indicator => indicator.draw(this.ctx, this.camera));
        
        // Caja de selección
        if (this.mouse.down && this.selectBox && this.mouse.drag) {
            const x = Math.min(this.mouseDownPos.x, this.mouse.x);
            const y = Math.min(this.mouseDownPos.y, this.mouse.y);
            const w = Math.abs(this.mouse.x - this.mouseDownPos.x);
            const h = Math.abs(this.mouse.y - this.mouseDownPos.y);
            
            this.ctx.fillStyle = 'rgba(76, 175, 80, 0.1)';
            this.ctx.fillRect(x, y, w, h);
            this.ctx.strokeStyle = 'rgba(76, 175, 80, 0.5)';
            this.ctx.lineWidth = 1.5;
            this.ctx.strokeRect(x, y, w, h);
        }
        
        this.nodes.forEach(node => node.draw(this.ctx, this.camera));
        this.entities.forEach(ent => ent.draw(this.ctx, this.camera));
        
        // Indicador de modo rally
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
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.015)';
        this.ctx.lineWidth = 1;
        
        for (let x = offsetX; x < this.canvas.width; x += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(x, 0);
            this.ctx.lineTo(x, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = offsetY; y < this.canvas.height; y += gridSize) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y);
            this.ctx.lineTo(this.canvas.width, y);
            this.ctx.stroke();
        }
    }
    
    drawUI() {
        const localPlayerId = 0;
        
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        this.ctx.font = '12px monospace';
        this.ctx.textAlign = 'left';
        this.ctx.fillText(`Seleccionados: ${this.selectedEntities.length}`, 20, 30);
        this.ctx.fillText(`Unidades: ${this.entities.filter(e => e.owner === localPlayerId).length}`, 20, 50);
        this.ctx.fillText(`Zoom: ${Math.round(this.camera.zoom * 100)}%`, 20, 70);
        
        if (this.selectedEntities.length > 0) {
            this.ctx.fillText('Hold Click Der: Línea de waypoints | S: Stop', 20, 90);
        }
        
        if (this.selectedNodes.length > 0) {
            this.ctx.fillText('T: Set Rally Point', 20, 110);
        }
        
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
        this.nodes = [];
        this.entities = [];
        this.selectedEntities = [];
        this.selectedNodes = [];
        this.commandIndicators = [];
        this.waypointLines = [];
        this.camera = new Camera();
        this.globalSpawnTimer = new GlobalSpawnTimer(2.5);
        this.rallyMode = false;
        this.init();
    }
}

window.onload = () => {
    const game = new Game('game-canvas');
};