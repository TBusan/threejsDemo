import { contours as ztContours } from "./d3_zoutao.js";

/**
 * A custom Cesium primitive for rendering contour lines and fills using D3.js
 */
class CustomContourPrimitive {
    constructor(options = {}) {
        // Default options
        this.options = {
            contourData: null,
            specificThresholds: [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800],
            showContourLines: true,
            showContourFill: true,
            smooth: true,
            height: 0,
            referencePoint: [0, 0], // Reference point longitude and latitude [lon, lat]
            scale: 0.001, // Scale factor to convert data units to geographic distance
            ...options
        };
        
        this._primitive = null;
        this._linesPrimitive = null;
        this._contourInstances = [];
        this._lineInstances = [];
        this._materialCache = new Map();
    }
    
    // Process contourData to D3 compatible format
    processContourData() {
        if (!this.options.contourData || !this.options.contourData.data) {
            return null;
        }
        
        const dataX = this.options.contourData.data.x;
        const dataY = this.options.contourData.data.y;
        const dataValues = this.options.contourData.data.v;
        
        // Get data grid dimensions
        const gridSizeX = dataX.length;
        const gridSizeY = dataY.length;
        
        // Create a one-dimensional array for D3 to use
        const gridData = new Array(gridSizeY * gridSizeX);
        
        // Flatten 2D array to 1D
        for (let y = 0; y < gridSizeY; y++) {
            for (let x = 0; x < gridSizeX; x++) {
                const value = dataValues[y][x];

                // Handle null values: replace with NaN so D3 skips these areas
                if (value === null || value === undefined) {
                    gridData[y * gridSizeX + x] = NaN;
                } else {
                    gridData[y * gridSizeX + x] = value;
                }
            }
        }
        
        return {
            data: gridData,
            gridSizeX,
            gridSizeY,
            dataX,
            dataY
        };
    }
    
    // Preprocess data to ensure NaN values are handled properly
    handleNullInGrid(gridData) {
        // Create a copy to avoid modifying original data
        const processedData = [...gridData];
        
        // Ensure all NaN and null values are properly replaced with values D3 understands
        for (let i = 0; i < processedData.length; i++) {
            if (processedData[i] === null || isNaN(processedData[i])) {
                processedData[i] = NaN; // D3 contour generator will skip NaN values
            }
        }
        
        return processedData;
    }
    
    // Get color based on data value
    getTerrainColor(value) {
        const localOriginColor = [
            [200.000, "rgba(255, 0, 0, 1.00)"],
            [400.000, "rgba(255, 24, 0, 1.00)"],
            [600.000, "rgba(255, 55, 0, 1.00)"],
            [800.000, "rgba(255, 87, 0, 1.00)"],
            [1000.000, "rgba(255, 119, 0, 1.00)"],
            [1200.000, "rgba(255, 143, 0, 1.00)"],
            [1400.000, "rgba(255, 166, 0, 1.00)"],
            [1600.000, "rgba(255, 188, 0, 1.00)"],
            [1800.000, "rgba(255, 211, 0, 1.00)"],
            [2000.000, "rgba(223, 219, 20, 1.00)"],
            [2200.000, "rgba(184, 226, 44, 1.00)"],
            [2400.000, "rgba(146, 232, 69, 1.00)"],
            [2600.000, "rgba(108, 238, 93, 1.00)"],
            [2800.000, "rgba(85, 206, 131, 1.00)"],
            [3000.000, "rgba(65, 169, 172, 1.00)"],
            [3200.000, "rgba(44, 132, 212, 1.00)"],
            [3400.000, "rgba(23, 95, 253, 1.00)"],
            [3600.000, "rgba(61, 78, 249, 1.00)"],
            [3800.000, "rgba(102, 62, 242, 1.00)"]
        ];

        const localOriginColorLen = localOriginColor.length;
        const localOriginColorMin = localOriginColor[0][0];
        const localOriginColorMax = localOriginColor[localOriginColorLen - 1][0];

        if (value <= localOriginColorMin) {
            return localOriginColor[0][1];
        } else if (value >= localOriginColorMax) {
            return localOriginColor[localOriginColorLen - 1][1];
        } else {
            for (let i = 0; i < localOriginColorLen - 1; i++) {
                if (value >= localOriginColor[i][0] && value < localOriginColor[i + 1][0]) {
                    return localOriginColor[i + 1][1];
                }
            }
            return localOriginColor[0][1];
        }
    }
    
    // Convert RGBA string to Cesium.Color
    parseColor(colorStr) {
        const rgba = colorStr.match(/\d+/g).map(Number);
        // Ensure alpha value is correct, if not exists or parse error, use default 1.0
        const r = rgba[0] / 255;
        const g = rgba[1] / 255;
        const b = rgba[2] / 255;
        const a = rgba.length >= 4 ? rgba[3] / 255 : 1.0;
        return new Cesium.Color(r, g, b, a);
    }
    
    // Convert data coordinates to Cesium geographic coordinates
    dataToCartesian(x, y) {
        const [refLon, refLat] = this.options.referencePoint;
        const scale = this.options.scale;
        const height = this.options.height;
        
        // Convert data coordinates to longitude/latitude offsets from reference point
        const lonOffset = x * scale;
        const latOffset = y * scale;
        
        // Calculate final longitude and latitude
        const lon = refLon + lonOffset;
        const lat = refLat + latOffset;
        
        // Convert to Cesium world coordinates
        return Cesium.Cartesian3.fromDegrees(lon, lat, height);
    }
    
    // Create geometry instances for a single contour
    createContourInstances(contours) {
        this._contourInstances = [];
        this._lineInstances = [];
        
        if (!contours || contours.length === 0) return;
        
        // Ensure contours are processed from low to high values
        const sortedContours = [...contours].sort((a, b) => a.value - b.value);
        
        for (let i = 0; i < sortedContours.length; i++) {
            const contour = sortedContours[i];
            
            // Get color for current contour
            const colorStr = this.getTerrainColor(contour.value);
            const color = this.parseColor(colorStr);
            
            const isSpecialContour = this.options.specificThresholds.includes(contour.value);
            
            // Create geometry instances for each polygon
            for (const polygon of contour.coordinates) {
                // Check if polygon has enough points
                if (!polygon || !polygon[0] || polygon[0].length < 3) {
                    continue;
                }
                
                // Create polygon
                if (this.options.showContourFill) {
                    this._createPolygonInstance(polygon, color, contour.value, i);
                }
                
                // Create lines
                if (this.options.showContourLines) {
                    this._createLineInstance(polygon, isSpecialContour, contour.value, i);
                }
            }
        }
    }
    
    // Create polygon geometry instance
    _createPolygonInstance(polygon, color, value, zIndex) {
        // Handle outer contour
        const outerRing = polygon[0];
        const positions = [];
        
        // Convert contour points to Cesium coordinates
        for (const point of outerRing) {
            const [x, y] = point;
            if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                continue;
            }
            positions.push(this.dataToCartesian(x, y));
        }
        
        if (positions.length < 3) return; // Need at least 3 points to form a polygon
        
        // Handle holes
        const holes = [];
        for (let i = 1; i < polygon.length; i++) {
            const holePositions = [];
            
            for (const point of polygon[i]) {
                const [x, y] = point;
                if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                    continue;
                }
                holePositions.push(this.dataToCartesian(x, y));
            }
            
            if (holePositions.length >= 3) {
                holes.push(new Cesium.PolygonHierarchy(holePositions));
            }
        }
        
        // Create polygon geometry
        const polygonHierarchy = new Cesium.PolygonHierarchy(positions, holes);
        
        // Ensure color alpha is moderate to make fill visible
        const fillColor = color.clone();
        fillColor.alpha = Math.max(0.6, fillColor.alpha); // Ensure at least 0.6 opacity
        
        const polygonInstance = new Cesium.GeometryInstance({
            geometry: new Cesium.PolygonGeometry({
                polygonHierarchy: polygonHierarchy,
                height: this.options.height,
                vertexFormat: Cesium.VertexFormat.POSITION_AND_COLOR
            }),
            attributes: {
                color: Cesium.ColorGeometryInstanceAttribute.fromColor(fillColor),
                distanceDisplayCondition: new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(0, 1.0e6)
            },
            id: `contour-${value}-${zIndex}`
        });
        
        this._contourInstances.push(polygonInstance);
    }
    
    // Create line geometry instance
    _createLineInstance(polygon, isSpecial, value, zIndex) {
        // Handle each ring (outer contour and holes)
        for (const ring of polygon) {
            const positions = [];
            
            // Convert contour points to Cesium coordinates
            for (const point of ring) {
                const [x, y] = point;
                if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                    continue;
                }
                positions.push(this.dataToCartesian(x, y));
            }
            
            // Close the ring
            if (positions.length > 0 && positions.length > 2) {
                positions.push(positions[0]);
            } else {
                continue; // Skip invalid rings
            }
            
            // Create line geometry
            const lineInstance = new Cesium.GeometryInstance({
                geometry: new Cesium.PolylineGeometry({
                    positions: positions,
                    width: isSpecial ? 3.0 : 1.0,
                    vertexFormat: Cesium.PolylineColorAppearance.VERTEX_FORMAT
                }),
                attributes: {
                    color: Cesium.ColorGeometryInstanceAttribute.fromColor(
                        isSpecial ? Cesium.Color.WHITE : Cesium.Color.fromAlpha(Cesium.Color.GRAY, 0.8)
                    ),
                    distanceDisplayCondition: new Cesium.DistanceDisplayConditionGeometryInstanceAttribute(0, 1.0e6)
                },
                id: `contour-line-${value}-${zIndex}`
            });
            
            this._lineInstances.push(lineInstance);
        }
    }
    
    // Generate contours
    generateContours() {
        if (!this.options.contourData) return;
        
        // Process grid data
        const { data: gridData, gridSizeX, gridSizeY, dataX, dataY } = this.processContourData();
        if (!gridData) return;
        
        // Import d3-contour library
        const contourGenerator = ztContours()
            .size([gridSizeX, gridSizeY])
            .thresholds(this.options.specificThresholds)
            .x(dataX)
            .y(dataY)
            .smooth(this.options.smooth);
            
        // Calculate contours - use preprocessed data
        const contours = contourGenerator(this.handleNullInGrid(gridData));
        
        // Create geometry instances
        this.createContourInstances(contours);
        
        return contours;
    }
    
    // Create Primitive - Implementation of the Cesium primitive interface
    update(frameState) {
        if (!this._primitive || !this._linesPrimitive) {
            this.generateContours();
            
            if (this._contourInstances.length > 0) {
                // Create primitive for fill areas
                this._primitive = new Cesium.Primitive({
                    geometryInstances: this._contourInstances,
                    appearance: new Cesium.PerInstanceColorAppearance({
                        flat: true,
                        translucent: true,
                        renderState: {
                            depthMask: false,
                            blending: Cesium.BlendingState.ALPHA_BLEND
                        }
                    }),
                    asynchronous: false
                });
            }
            
            if (this._lineInstances.length > 0) {
                // Create primitive for lines
                this._linesPrimitive = new Cesium.Primitive({
                    geometryInstances: this._lineInstances,
                    appearance: new Cesium.PolylineColorAppearance({
                        translucent: true
                    }),
                    asynchronous: false
                });
            }
        }
        
        // Update primitives with current frame state
        if (this._primitive) {
            this._primitive.update(frameState);
        }
        
        if (this._linesPrimitive) {
            this._linesPrimitive.update(frameState);
        }
    }
    
    // Clean up resources
    destroy() {
        if (this._primitive) {
            this._primitive.destroy();
            this._primitive = null;
        }
        
        if (this._linesPrimitive) {
            this._linesPrimitive.destroy();
            this._linesPrimitive = null;
        }
        
        this._contourInstances = [];
        this._lineInstances = [];
    }
    
    // Set new thresholds
    setThresholds(thresholds) {
        this.options.specificThresholds = thresholds;
        this.destroy();
    }
    
    // Set whether to show contour lines
    setShowContourLines(show) {
        if (this.options.showContourLines !== show) {
            this.options.showContourLines = show;
            this.destroy();
        }
    }
    
    // Set whether to smooth contours
    setSmooth(smooth) {
        if (this.options.smooth !== smooth) {
            this.options.smooth = smooth;
            this.destroy();
        }
    }
    
    // Set whether to show fill areas
    setShowContourFill(show) {
        if (this.options.showContourFill !== show) {
            this.options.showContourFill = show;
            this.destroy();
        }
    }
    
    // Set new data
    setContourData(contourData) {
        this.options.contourData = contourData;
        this.destroy();
    }
}

// Export
export { CustomContourPrimitive };
