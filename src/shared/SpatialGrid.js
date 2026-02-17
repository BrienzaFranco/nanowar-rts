export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Map();
        this.queryIds = 0; // To avoid duplicate checks in a single query
    }

    clear() {
        this.cells.clear();
    }

    _getKey(col, row) {
        return col + "," + row;
    }

    addObject(obj) {
        // Assume obj has x and y
        const col = Math.floor(obj.x / this.cellSize);
        const row = Math.floor(obj.y / this.cellSize);

        // Add to the specific cell
        // We could handle objects spanning multiple cells if they have large radius, 
        // but for point-like entities, center cell is usually enough if we query neighbors.
        // For logic consistency with "retrieve", simpler to just put in one cell and search neighbors.

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const key = this._getKey(col, row);
            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key).push(obj);
        }
    }

    // Retrieve objects in the cells surrounding the given area
    retrieve(x, y, radius) {
        const found = [];
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        // Optimization: Single bucket lookup for small radii inside one cell?
        // Standard loop is robust.

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        found.push(cellObjects[i]);
                    }
                }
            }
        }
        return found;
    }

    /**
     * More optimized retrieval that calls a callback for each potential neighbor
     * eliminating array allocations.
     * @param {number} x 
     * @param {number} y 
     * @param {number} radius 
     * @param {function} callback - Called with (object)
     */
    query(x, y, radius, callback) {
        const startCol = Math.floor((x - radius) / this.cellSize);
        const endCol = Math.floor((x + radius) / this.cellSize);
        const startRow = Math.floor((y - radius) / this.cellSize);
        const endRow = Math.floor((y + radius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        callback(cellObjects[i]);
                    }
                }
            }
        }
    }
}
