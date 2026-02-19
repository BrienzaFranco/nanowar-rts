export class Particle {
    constructor(x, y, color, size, type, targetX, targetY) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.type = type;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.targetX = targetX;
        this.targetY = targetY;
        
        if (type === 'hit') {
            this.life = 0.3;
            this.maxLife = 0.3;
            this.vx = (Math.random() - 0.5) * 80;
            this.vy = (Math.random() - 0.5) * 80;
        } else if (type === 'absorb') {
            this.life = 0.5;
            this.maxLife = 0.5;
            const angle = Math.random() * Math.PI * 2;
            const dist = 20 + Math.random() * 15;
            this.x = x + Math.cos(angle) * dist;
            this.y = y + Math.sin(angle) * dist;
            this.vx = 0;
            this.vy = 0;
        } else if (type === 'sacrifice') {
            this.life = 0.4;
            this.maxLife = 0.4;
            this.vx = 0;
            this.vy = 0;
        } else if (type === 'explosion') {
            this.life = 0.6;
            this.maxLife = 0.6;
            const angle = Math.random() * Math.PI * 2;
            const speed = 50 + Math.random() * 80;
            this.vx = Math.cos(angle) * speed;
            this.vy = Math.sin(angle) * speed;
        } else {
            this.vx = (Math.random() - 0.5) * 100;
            this.vy = (Math.random() - 0.5) * 100;
        }
    }

    update(dt) {
        if (this.type === 'absorb' && this.targetX !== undefined && this.targetY !== undefined) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 3) {
                const speed = 120;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
        } else if (this.type === 'sacrifice' && this.targetX !== undefined && this.targetY !== undefined) {
            const dx = this.targetX - this.x;
            const dy = this.targetY - this.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 3) {
                const speed = 150;
                this.x += (dx / dist) * speed * dt;
                this.y += (dy / dist) * speed * dt;
            }
        } else {
            this.x += this.vx * dt;
            this.y += this.vy * dt;
        }
        this.life -= dt;
        return this.life > 0;
    }
}
