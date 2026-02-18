export class SpatialGrid {
    constructor(width, height, cellSize) {
        this.width = width;
        this.height = height;
        this.cellSize = cellSize;
        this.cols = Math.ceil(width / cellSize);
        this.rows = Math.ceil(height / cellSize);
        this.cells = new Map();
        this.queryIds = 0;
        
        // Pre-allocated array for retrieve() to avoid GC
        this._resultArray = [];
        this._resultLength = 0;
    }

    clear() {
        this.cells.clear();
    }

    _getKey(col, row) {
        return col + "," + row;
    }

    addObject(obj) {
        const col = Math.floor(obj.x / this.cellSize);
        const row = Math.floor(obj.y / this.cellSize);

        if (col >= 0 && col < this.cols && row >= 0 && row < this.rows) {
            const key = this._getKey(col, row);
            if (!this.cells.has(key)) {
                this.cells.set(key, []);
            }
            this.cells.get(key).push(obj);
        }
    }

    // Retrieve objects - optimized with pre-allocated array
    retrieve(x, y, radius) {
        // Reset result array without allocation
        this._resultLength = 0;
        
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
                        this._resultArray[this._resultLength++] = cellObjects[i];
                    }
                }
            }
        }
        return this._resultArray;
    }

    // Callback-based query - most efficient, no allocations
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

    // Retrieve only nodes - also optimized
    retrieveNodes(x, y, searchRadius) {
        this._resultLength = 0;
        
        const startCol = Math.floor((x - searchRadius) / this.cellSize);
        const endCol = Math.floor((x + searchRadius) / this.cellSize);
        const startRow = Math.floor((y - searchRadius) / this.cellSize);
        const endRow = Math.floor((y + searchRadius) / this.cellSize);

        for (let c = startCol; c <= endCol; c++) {
            if (c < 0 || c >= this.cols) continue;
            for (let r = startRow; r <= endRow; r++) {
                if (r < 0 || r >= this.rows) continue;

                const key = this._getKey(c, r);
                const cellObjects = this.cells.get(key);
                if (cellObjects) {
                    for (let i = 0; i < cellObjects.length; i++) {
                        const node = cellObjects[i];
                        if (node && node.influenceRadius !== undefined) {
                            this._resultArray[this._resultLength++] = node;
                        }
                    }
                }
            }
        }
        return this._resultArray;
    }
}
