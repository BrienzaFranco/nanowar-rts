export class Camera {
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
    centerOn(worldX, worldY, screenWidth, screenHeight) {
        this.x = worldX - screenWidth / (2 * this.zoom);
        this.y = worldY - screenHeight / (2 * this.zoom);
    }
}
