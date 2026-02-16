export class GlobalSpawnTimer {
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
