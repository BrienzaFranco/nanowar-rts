export class Particle {
    constructor(x, y, color, size, type) {
        this.x = x;
        this.y = y;
        this.color = color;
        this.size = size;
        this.type = type;
        this.life = 1.0;
        this.maxLife = 1.0;
        this.vx = (Math.random() - 0.5) * 100;
        this.vy = (Math.random() - 0.5) * 100;
        if (type === 'hit') {
            this.life = 0.3;
            this.maxLife = 0.3;
        }
    }

    update(dt) {
        this.x += this.vx * dt;
        this.y += this.vy * dt;
        this.life -= dt;
        return this.life > 0;
    }
}
