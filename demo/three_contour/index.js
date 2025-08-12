import * as THREE from 'three';

/**
 * A minimal binary search function to find a value's index in a sorted array.
 * @param {number} val The value to find.
 * @param {Array<number>} arr The sorted array to search in.
 * @returns {number} The index of the bin the value belongs to.
 */
function findBin(val, arr) {
    let low = 0;
    let high = arr.length - 1;
    let mid;
    while (low < high) {
        mid = Math.floor((low + high) / 2);
        if (arr[mid] < val) {
            low = mid + 1;
        } else {
            high = mid;
        }
    }
    return low > 0 ? low - 1 : 0;
}

/**
 * Checks if a point is on the edge of the grid.
 * @param {Array<number>} pt The point [y, x].
 * @param {number} xmin The minimum x value.
 * @param {number} xmax The maximum x value.
 * @param {number} ymin The minimum y value.
 * @param {number} ymax The maximum y value.
 * @returns {boolean} True if the point is on an edge.
 */
function ptOnEdge(pt, xmin, xmax, ymin, ymax) {
    const ε = 1e-10;
    return (
        Math.abs(pt[0] - ymin) < ε ||
        Math.abs(pt[0] - ymax) < ε ||
        Math.abs(pt[1] - xmin) < ε ||
        Math.abs(pt[1] - xmax) < ε
    );
}

/**
 * ContourGenerator a class to generate contour lines and filled contours
 * from a 2D data grid, for use with Three.js.
 *
 * This implementation is heavily inspired by the contour generation logic
 * in Plotly.js, particularly the "marching squares" algorithm.
 */
class ContourGenerator {
    /**
     * @param {object} options
     * @param {Array<number>} options.x - The x-coordinates of the grid.
     * @param {Array<number>} options.y - The y-coordinates of the grid.
     * @param {Array<Array<number>>} options.z - The 2D array of z-values.
     * @param {object} options.contours - Contour settings.
     * @param {number} options.contours.start - The starting contour level.
     * @param {number} options.contours.end - The ending contour level.
     * @param {number} options.contours.size - The step size between contours.
     * @param {string} [options.contours.coloring] - 'fill', 'lines', 'none'.
     * @param {number} [options.smoothing=0] - Smoothing factor for the lines.
     * @param {Array<Array>} [options.colorscale] - Colorscale for coloring fills/lines.
     */
    constructor(options) {
        this.x = options.x;
        this.y = options.y;
        this.z = options.z;
        this.contours = options.contours;
        this.smoothing = options.smoothing === undefined ? 0 : options.smoothing;
        this.colorscale = options.colorscale;
        this.useRealValue = options.useRealValue;

        this._validateInputs();

        // This will hold the generated path data for each level
        this.pathinfo = this._initializePathinfo();
    }

    /**
     * Validates the input options.
     * @private
     */
    _validateInputs() {
        if (!this.x || !this.y || !this.z) {
            throw new Error('x, y, and z data must be provided.');
        }
        if (this.z.length !== this.y.length || this.z[0].length !== this.x.length) {
            throw new Error('Dimensions of z data do not match x and y coordinates.');
        }
        if (!this.contours || this.contours.start === undefined || this.contours.end === undefined || this.contours.size === undefined) {
            throw new Error('Contour settings (start, end, size) are required.');
        }
    }

    /**
     * Initializes the pathinfo structure that will hold contour path data.
     * This is analogous to Plotly's `emptyPathinfo`.
     * @private
     */
    _initializePathinfo() {
        const pathinfo = [];
        const { start, end, size } = this.contours;

        if (size <= 0) {
            throw new Error('Contour size must be positive.');
        }

        for (let level = start; level <= end; level += size) {
            pathinfo.push({
                level: level,
                // arrays of [x,y] points
                paths: [], // closed paths inside the grid
                edgepaths: [], // open paths that end on a grid edge
            });
        }
        return pathinfo;
    }
    
    /**
     * Generates the contour paths.
     * This is the main entry point for the generation algorithm.
     */
    generatePaths() {
        // Step 1: Find where contours cross grid lines (makeCrossings)
        this._makeCrossings();
        
        // Step 2: Connect crossings into paths (findAllPaths)
        this._findAllPaths();

        return this.pathinfo;
    }

    /**
     * Creates Three.js objects (Lines and Meshes) from the generated paths.
     * @returns {THREE.Group} A group containing all the contour objects.
     */
    createThreeObjects() {
        const group = new THREE.Group();
        
        if (this.pathinfo[0].paths.length === 0 && this.pathinfo[0].edgepaths.length === 0) {
            this.generatePaths();
        }
        
        const coloring = this.contours.coloring;
        const colorscale = this._createColorscaleFunction();

        // Handle filled contours
        if (coloring === 'fill') {
            this._closeBoundaries(); // Ensure edge paths are closed for filling
            
            this.pathinfo.forEach(pi => {
                const color = new THREE.Color(colorscale(pi.level));
                const material = new THREE.MeshBasicMaterial({ color: color, side: THREE.DoubleSide });

                const allPaths = pi.paths.concat(pi.edgepaths);

                allPaths.forEach(pathPoints => {
                    if (pathPoints.length < 2) return;
                    
                    const shape = new THREE.Shape();
                    shape.moveTo(pathPoints[0][1], pathPoints[0][0]);
                    for (let i = 1; i < pathPoints.length; i++) {
                        shape.lineTo(pathPoints[i][1], pathPoints[i][0]);
                    }
                    shape.closePath();

                    const geometry = new THREE.ShapeGeometry(shape);
                    const mesh = new THREE.Mesh(geometry, material);
                    group.add(mesh);
                });
            });
        }
        
        // Handle contour lines
        if (coloring === 'lines') {
            this.pathinfo.forEach(pi => {
                const color = new THREE.Color(colorscale(pi.level));
                const material = new THREE.LineBasicMaterial({ color: color });

                const allPaths = pi.paths.concat(pi.edgepaths);

                allPaths.forEach(pathPoints => {
                    if (pathPoints.length < 2) return;

                    const points = pathPoints.map(p => new THREE.Vector3(p[1], p[0], 0));
                    const geometry = new THREE.BufferGeometry().setFromPoints(points);
                    const line = new THREE.Line(geometry, material);
                    group.add(line);
                });
            });
        }

        return group;
    }

    _closeBoundaries() {
       // A simplified version of closeBoundaries for filling
       const x = this.x;
       const y = this.y;
       const perimeter = [
           [y[0], x[0]], // top-left
           [y[0], x[x.length-1]], // top-right
           [y[y.length-1], x[x.length-1]], // bottom-right
           [y[y.length-1], x[0]], // bottom-left
       ];

       this.pathinfo.forEach(pi => {
           if(pi.edgepaths.length === 0) return;
           
           const newEdgePaths = [];
           let currentPath = pi.edgepaths.shift();

           while(currentPath) {
               const lastPt = currentPath[currentPath.length - 1];

               // Find the next segment on the perimeter
               // This is a simplified connection logic. A robust implementation
               // would sort edge paths and connect them intelligently.
               if(lastPt[1] === x[x.length-1]) { // right edge
                   currentPath.push(perimeter[2]);
               } else if(lastPt[0] === y[y.length-1]) { // bottom edge
                   currentPath.push(perimeter[3]);
               } else if(lastPt[1] === x[0]) { // left edge
                  currentPath.push(perimeter[0]);
               } else if(lastPt[0] === y[0]) { // top edge
                  currentPath.push(perimeter[1]);
               }

               newEdgePaths.push(currentPath);
               currentPath = pi.edgepaths.shift();
           }
           pi.edgepaths = newEdgePaths;
       });
    }

    _createColorscaleFunction() {
        if (!this.colorscale) {
            return () => '#000000'; // Default to black if no colorscale
        }
        
        // This is a simplified version of Plotly's makeColorScaleFunc
        const domain = this.colorscale.map(d => d[0]);
        const range = this.colorscale.map(d => new THREE.Color(d[1]));

        return (value) => {
            if (this.useRealValue) {
                let closestIndex = 0;
                let smallestDist = Infinity;
                for(let i=0; i<domain.length; i++) {
                    const dist = Math.abs(value - domain[i]);
                    if (dist < smallestDist) {
                        smallestDist = dist;
                        closestIndex = i;
                    }
                }
                return range[closestIndex];
            } else {
                // Normalize value
                const { start, end } = this.contours;
                const t = (value - start) / (end - start);

                for (let i = 0; i < domain.length - 1; i++) {
                    if (t >= domain[i] && t <= domain[i + 1]) {
                        const localT = (t - domain[i]) / (domain[i + 1] - domain[i]);
                        return new THREE.Color().lerpColors(range[i], range[i+1], localT);
                    }
                }
                return range[range.length - 1];
            }
        };
    }

    //
    // The following methods are adaptations of the core Plotly.js algorithms.
    //

    _makeCrossings() {
        const { x, y, z, pathinfo } = this;
        const xa = x;
        const ya = y;
        const za = z;

        // horizontal crossings
        const hx = [];
        const hy = [];
        // vertical crossings
        const vx = [];
        const vy = [];

        for (let i = 0; i < pathinfo.length; i++) {
            const pi = pathinfo[i];
            const level = pi.level;

            hx.push([]);
            hy.push([]);
            vx.push([]);
            vy.push([]);
            
            // horizontal crossings
            for (let j = 0; j < ya.length; j++) {
                const zrow = za[j];
                const hxj = [];
                const hyj = [];
                for (let k = 0; k < xa.length - 1; k++) {
                    const z1 = zrow[k];
                    const z2 = zrow[k + 1];
                    if ((z1 > level) !== (z2 > level)) {
                        const atFraction = (level - z1) / (z2 - z1);
                        hxj.push(this._interp(xa[k], xa[k + 1], atFraction));
                        hyj.push(ya[j]);
                    }
                }
                hx[i].push(hxj);
                hy[i].push(hyj);
            }

            // vertical crossings
            for (let j = 0; j < xa.length; j++) {
                const zcol = za.map(row => row[j]);
                const vxj = [];
                const vyj = [];
                for (let k = 0; k < ya.length - 1; k++) {
                    const z1 = zcol[k];
                    const z2 = zcol[k + 1];
                    if ((z1 > level) !== (z2 > level)) {
                        vxj.push(xa[j]);
                        vyj.push(this._interp(ya[k], ya[k + 1], (level - z1) / (z2 - z1)));
                    }
                }
                vx[i].push(vxj);
                vy[i].push(vyj);
            }
        }
        
        // Store crossings in pathinfo for the next step
        for (let i = 0; i < pathinfo.length; i++) {
            pathinfo[i].crossings = {
                hx: hx[i],
                hy: hy[i],
                vx: vx[i],
                vy: vy[i],
            };
            // also store grid properties for later
            pathinfo[i].x = x;
            pathinfo[i].y = y;
            pathinfo[i].z = z;
        }
    }

    _findAllPaths() {
        this.pathinfo.forEach(pi => {
            const { hx, hy, vx, vy } = pi.crossings;

            // path starting points, and direction.
            // entries are [x, y, v or h, back or fwd]
            const starts = [];
            let i, j, k;

            // find all starting points
            for (j = 0; j < hy.length; j++) {
                for (k = 0; k < hy[j].length; k++) {
                    starts.push([hy[j][k], hx[j][k], 'h', 'fwd']);
                    starts.push([hy[j][k], hx[j][k], 'h', 'back']);
                }
            }
            for (j = 0; j < vy.length; j++) {
                for (k = 0; k < vy[j].length; k++) {
                    starts.push([vy[j][k], vx[j][k], 'v', 'fwd']);
                    starts.push([vy[j][k], vx[j][k], 'v', 'back']);
                }
            }

            const x = pi.x;
            const y = pi.y;
            const z = pi.z;
            const level = pi.level;

            // find the cell a point is in
            const ylen = y.length;
            const xlen = x.length;
            function getCell(pt) {
                const ybi = Math.max(0, Math.min(ylen - 2, findBin(pt[0], y)));
                const xbi = Math.max(0, Math.min(xlen - 2, findBin(pt[1], x)));
                return [ybi, xbi];
            }

            // remove a point from the starts list
            function removeStart(pt) {
                for (let i = 0; i < starts.length; i++) {
                    if (starts[i][0] === pt[0] && starts[i][1] === pt[1]) {
                        starts.splice(i, 1);
                        return;
                    }
                }
            }

            let startpt, dir, type, newpath, pt, cell, nextpt;

            while (starts.length) {
                [startpt, dir, type] = [starts[0].slice(0, 2), starts[0][3], starts[0][2]];
                starts.splice(0, 1);
                removeStart(startpt);

                newpath = [startpt];

                for (let k = 0; k < 2 * (xlen + ylen); k++) {
                    cell = getCell(startpt);
                    nextpt = this._walkCell(cell, startpt, dir, type, level, x, y, z);
                    
                    if (nextpt) {
                        newpath.push(nextpt.pt);
                        startpt = nextpt.pt;
                        dir = nextpt.dir;
                        type = nextpt.type;
                        if (ptOnEdge(startpt, x[0], x[xlen - 1], y[0], y[ylen - 1])) {
                             pi.edgepaths.push(newpath);
                             break;
                        }
                        removeStart(startpt);
                    } else {
                        pi.paths.push(newpath);
                        break;
                    }
                }
            }
        });
    }

    _walkCell(cell, pt, dir, type, level, x, y, z) {
        const i = cell[0]; // y index
        const j = cell[1]; // x index

        const zCorners = [z[i][j], z[i][j + 1], z[i + 1][j + 1], z[i + 1][j]];
        const state = (zCorners[0] > level ? 8 : 0) +
                      (zCorners[1] > level ? 4 : 0) +
                      (zCorners[2] > level ? 2 : 0) +
                      (zCorners[3] > level ? 1 : 0);
        const frac = (axis, p1, p2) => (level - z[p1[0]][p1[1]]) / (z[p2[0]][p2[1]] - z[p1[0]][p1[1]]);

        const x0 = x[j], x1 = x[j + 1];
        const y0 = y[i], y1 = y[i + 1];

        const edges = {
            top: [y0, this._interp(x0, x1, frac('x', [i, j], [i, j + 1]))],
            right: [this._interp(y0, y1, frac('y', [i, j + 1], [i + 1, j + 1])), x1],
            bottom: [y1, this._interp(x0, x1, frac('x', [i + 1, j], [i + 1, j + 1]))],
            left: [this._interp(y0, y1, frac('y', [i, j], [i + 1, j])), x0]
        };
        const exits = this._getExits(state, edges, pt);
        if (!exits) return null;
        
        return { pt: exits.pt, dir: exits.dir, type: exits.type };
    }
    
    _getExits(state, edges, pt) {
        // Simplified marching squares logic to find the exit point in a cell
        const transitions = {
            1: { from: 'bottom', to: 'left'},
            2: { from: 'right', to: 'bottom'},
            3: { from: 'right', to: 'left' },
            4: { from: 'top', to: 'right' },
            5: { from: 'top', to: 'bottom' }, // Ambiguous case
            6: { from: 'top', to: 'left' },
            7: { from: 'top', to: 'left' },
            8: { from: 'left', to: 'top' },
            9: { from: 'bottom', to: 'top' },
            10: { from: 'left', to: 'right' }, // Ambiguous case
            11: { from: 'bottom', to: 'right' },
            12: { from: 'left', to: 'right' },
            13: { from: 'right', to: 'top' },
            14: { from: 'bottom', to: 'top'},
        };
        
        // Handle ambiguous cases based on the center point average
        if (state === 5 || state === 10) {
            const avg = (this.z[cell[0]][cell[1]] + this.z[cell[0]][cell[1]+1] + this.z[cell[0]+1][cell[1]] + this.z[cell[0]+1][cell[1]+1]) / 4;
            if (state === 5) {
                transitions[5] = avg > this.level ? 
                    { from: 'top', to: 'left' } : 
                    { from: 'right', to: 'bottom' };
            } else { // state 10
                 transitions[10] = avg > this.level ?
                    { from: 'top', to: 'right' } :
                    { from: 'left', to: 'bottom' };
            }
        }
        
        const trans = transitions[state];
        if (!trans) return null;
        const ptStr = JSON.stringify(pt);
        if (ptStr === JSON.stringify(edges[trans.from])) {
            return { pt: edges[trans.to] };
        } else if (ptStr === JSON.stringify(edges[trans.to])) {
            return { pt: edges[trans.from] };
        }
        return null;
    }

    /**
     * Linear interpolation helper.
     * @private
     */
    _interp(a, b, frac) {
        return a + (b - a) * frac;
    }
}

export { ContourGenerator };
