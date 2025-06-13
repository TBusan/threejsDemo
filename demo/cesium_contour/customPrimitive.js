import { contours as ztContours } from "./d3_zoutao.js";

/**
 * A custom Cesium primitive for rendering contour lines and fills using D3.js and custom shaders
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
        
        this._fillCommands = [];
        this._lineCommands = [];
        this._createFillCommand = this._createFillCommand.bind(this);
        this._createLineCommand = this._createLineCommand.bind(this);
        this._colorMap = this._buildColorMap();
        
        this.show = true;
        this._generated = false;
    }
    
    // Build color map for contour values
    _buildColorMap() {
        const colorMap = [
            [200.000, [1.0, 0.0, 0.0, 0.6]],  // rgba(255, 0, 0, 0.6)
            [400.000, [1.0, 0.094, 0.0, 0.6]], // rgba(255, 24, 0, 0.6)
            [600.000, [1.0, 0.216, 0.0, 0.6]], // rgba(255, 55, 0, 0.6)
            [800.000, [1.0, 0.341, 0.0, 0.6]], // rgba(255, 87, 0, 0.6)
            [1000.000, [1.0, 0.467, 0.0, 0.6]], // rgba(255, 119, 0, 0.6)
            [1200.000, [1.0, 0.561, 0.0, 0.6]], // rgba(255, 143, 0, 0.6)
            [1400.000, [1.0, 0.651, 0.0, 0.6]], // rgba(255, 166, 0, 0.6)
            [1600.000, [1.0, 0.737, 0.0, 0.6]], // rgba(255, 188, 0, 0.6)
            [1800.000, [1.0, 0.827, 0.0, 0.6]], // rgba(255, 211, 0, 0.6)
            [2000.000, [0.875, 0.859, 0.078, 0.6]], // rgba(223, 219, 20, 0.6)
            [2200.000, [0.722, 0.886, 0.173, 0.6]], // rgba(184, 226, 44, 0.6)
            [2400.000, [0.573, 0.91, 0.271, 0.6]], // rgba(146, 232, 69, 0.6)
            [2600.000, [0.424, 0.933, 0.365, 0.6]], // rgba(108, 238, 93, 0.6)
            [2800.000, [0.333, 0.808, 0.514, 0.6]], // rgba(85, 206, 131, 0.6)
            [3000.000, [0.255, 0.663, 0.675, 0.6]], // rgba(65, 169, 172, 0.6)
            [3200.000, [0.173, 0.518, 0.831, 0.6]], // rgba(44, 132, 212, 0.6)
            [3400.000, [0.09, 0.373, 0.992, 0.6]], // rgba(23, 95, 253, 0.6)
            [3600.000, [0.239, 0.306, 0.976, 0.6]], // rgba(61, 78, 249, 0.6)
            [3800.000, [0.4, 0.243, 0.949, 0.6]] // rgba(102, 62, 242, 0.6)
        ];
        return colorMap;
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
    getColorForValue(value) {
        const colorMap = this._colorMap;
        const colorMapLen = colorMap.length;
        const colorMapMin = colorMap[0][0];
        const colorMapMax = colorMap[colorMapLen - 1][0];

        if (value <= colorMapMin) {
            return colorMap[0][1];
        } else if (value >= colorMapMax) {
            return colorMap[colorMapLen - 1][1];
        } else {
            for (let i = 0; i < colorMapLen - 1; i++) {
                if (value >= colorMap[i][0] && value < colorMap[i + 1][0]) {
                    return colorMap[i + 1][1];
                }
            }
            return colorMap[0][1];
        }
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
    
    // Create vertex array for contour polygons
    _createFillVertexArray(context, polygon, color, value) {
        // Handle outer contour
        const outerRing = polygon[0];
        const positions = [];
        
        // Convert contour points to Cesium coordinates
        for (const point of outerRing) {
            const [x, y] = point;
            if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                continue;
            }
            const cartesian = this.dataToCartesian(x, y);
            positions.push(cartesian.x, cartesian.y, cartesian.z);
        }
        
        if (positions.length < 9) return null; // Need at least 3 points to form a polygon
        
        // Triangulate the polygon (simple earcut algorithm)
        const indices = [];
        for (let i = 1; i < positions.length / 3 - 1; i++) {
            indices.push(0, i, i + 1);
        }
        
        // Create a vertex buffer for positions
        const positionBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: new Float32Array(positions),
            usage: Cesium.BufferUsage.STATIC_DRAW
        });
        
        // Create color buffer (same color for all vertices)
        const colorArray = new Float32Array(positions.length / 3 * 4);
        for (let i = 0; i < positions.length / 3; i++) {
            colorArray[i * 4] = color[0];
            colorArray[i * 4 + 1] = color[1];
            colorArray[i * 4 + 2] = color[2];
            colorArray[i * 4 + 3] = color[3];
        }
        
        const colorBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: colorArray,
            usage: Cesium.BufferUsage.STATIC_DRAW
        });
        
        // Create index buffer
        const indexBuffer = Cesium.Buffer.createIndexBuffer({
            context: context,
            typedArray: new Uint16Array(indices),
            usage: Cesium.BufferUsage.STATIC_DRAW,
            indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
        });
        
        // Define vertex attributes
        const attributes = [
            {
                index: 0,  // position attribute
                vertexBuffer: positionBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            },
            {
                index: 1,  // color attribute
                vertexBuffer: colorBuffer,
                componentsPerAttribute: 4,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }
        ];
        
        // Create and return the vertex array
        return new Cesium.VertexArray({
            context: context,
            attributes: attributes,
            indexBuffer: indexBuffer
        });
    }
    
    // Create vertex array for contour lines
    _createLineVertexArray(context, ring, isSpecial) {
        const positions = [];
        
        // Convert contour points to Cesium coordinates
        for (const point of ring) {
            const [x, y] = point;
            if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                continue;
            }
            const cartesian = this.dataToCartesian(x, y);
            positions.push(cartesian.x, cartesian.y, cartesian.z);
        }
        
        // Ensure we have enough points and close the loop
        if (positions.length < 6) return null; // Need at least 2 points for a line
        
        // Create a vertex buffer for positions
        const positionBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: new Float32Array(positions),
            usage: Cesium.BufferUsage.STATIC_DRAW
        });
        
        // Create color buffer
        const color = isSpecial ? [1.0, 1.0, 1.0, 1.0] : [0.5, 0.5, 0.5, 0.8];
        const colorArray = new Float32Array(positions.length / 3 * 4);
        for (let i = 0; i < positions.length / 3; i++) {
            colorArray[i * 4] = color[0];
            colorArray[i * 4 + 1] = color[1];
            colorArray[i * 4 + 2] = color[2];
            colorArray[i * 4 + 3] = color[3];
        }
        
        const colorBuffer = Cesium.Buffer.createVertexBuffer({
            context: context,
            typedArray: colorArray,
            usage: Cesium.BufferUsage.STATIC_DRAW
        });
        
        // Create indices for line strip
        const indices = [];
        for (let i = 0; i < positions.length / 3; i++) {
            indices.push(i);
        }
        // Close the loop
        indices.push(0);
        
        const indexBuffer = Cesium.Buffer.createIndexBuffer({
            context: context,
            typedArray: new Uint16Array(indices),
            usage: Cesium.BufferUsage.STATIC_DRAW,
            indexDatatype: Cesium.IndexDatatype.UNSIGNED_SHORT
        });
        
        // Define vertex attributes
        const attributes = [
            {
                index: 0,  // position attribute
                vertexBuffer: positionBuffer,
                componentsPerAttribute: 3,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            },
            {
                index: 1,  // color attribute
                vertexBuffer: colorBuffer,
                componentsPerAttribute: 4,
                componentDatatype: Cesium.ComponentDatatype.FLOAT
            }
        ];
        
        // Create and return the vertex array
        return new Cesium.VertexArray({
            context: context,
            attributes: attributes,
            indexBuffer: indexBuffer
        });
    }
    
    // Define shader source for filled contours
    _getFillVertexShader() {
        return `
        attribute vec3 position;
        attribute vec4 color;
        
        varying vec4 v_color;
        
        void main() {
            v_color = color;
            gl_Position = czm_modelViewProjection * vec4(position, 1.0);
        }
        `;
    }
    
    _getFillFragmentShader() {
        return `
        varying vec4 v_color;
        
        void main() {
            gl_FragColor = v_color;
        }
        `;
    }
    
    // Define shader source for contour lines
    _getLineVertexShader() {
        return `
        attribute vec3 position;
        attribute vec4 color;
        
        varying vec4 v_color;
        
        void main() {
            v_color = color;
            gl_Position = czm_modelViewProjection * vec4(position, 1.0);
        }
        `;
    }
    
    _getLineFragmentShader() {
        return `
        varying vec4 v_color;
        
        void main() {
            gl_FragColor = v_color;
        }
        `;
    }
    
    // Create command for filled contours
    _createFillCommand(context, vertexArray, value, zIndex) {
        // Define attribute locations
        const attributeLocations = {
            position: 0,
            color: 1
        };
        
        // Create shader sources
        const vertexShaderSource = new Cesium.ShaderSource({
            sources: [this._getFillVertexShader()]
        });
        
        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [this._getFillFragmentShader()]
        });
        
        // Create shader program
        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            attributeLocations: attributeLocations
        });
        
        // Define render state (with alpha blending)
        const renderState = Cesium.RenderState.fromCache({
            depthTest: {
                enabled: true
            },
            blending: Cesium.BlendingState.ALPHA_BLEND,
            depthMask: false
        });
        
        // Create and return the draw command
        return new Cesium.DrawCommand({
            vertexArray: vertexArray,
            primitiveType: Cesium.PrimitiveType.TRIANGLES,
            renderState: renderState,
            shaderProgram: shaderProgram,
            pass: Cesium.Pass.TRANSLUCENT,
            owner: this,
            uniformMap: {}
        });
    }
    
    // Create command for contour lines
    _createLineCommand(context, vertexArray, isSpecial, value, zIndex) {
        // Define attribute locations
        const attributeLocations = {
            position: 0,
            color: 1
        };
        
        // Create shader sources
        const vertexShaderSource = new Cesium.ShaderSource({
            sources: [this._getLineVertexShader()]
        });
        
        const fragmentShaderSource = new Cesium.ShaderSource({
            sources: [this._getLineFragmentShader()]
        });
        
        // Create shader program
        const shaderProgram = Cesium.ShaderProgram.fromCache({
            context: context,
            vertexShaderSource: vertexShaderSource,
            fragmentShaderSource: fragmentShaderSource,
            attributeLocations: attributeLocations
        });
        
        // Define render state
        const renderState = Cesium.RenderState.fromCache({
            depthTest: {
                enabled: true
            },
            blending: Cesium.BlendingState.ALPHA_BLEND,
            lineWidth: 1.0, // isSpecial ? 3.0 : 1.0,
            depthMask: false
        });
        
        // Create and return the draw command
        return new Cesium.DrawCommand({
            vertexArray: vertexArray,
            primitiveType: Cesium.PrimitiveType.LINE_STRIP,
            renderState: renderState,
            shaderProgram: shaderProgram,
            pass: Cesium.Pass.TRANSLUCENT,
            owner: this,
            uniformMap: {}
        });
    }
    
    // Generate contours and create necessary commands
    _generateContours(context) {
        if (!this.options.contourData) return;
        
        // Process grid data
        const { data: gridData, gridSizeX, gridSizeY, dataX, dataY } = this.processContourData();
        if (!gridData) return;
        
        // Use D3 contour generator
        const contourGenerator = ztContours()
            .size([gridSizeX, gridSizeY])
            .thresholds(this.options.specificThresholds)
            .x(dataX)
            .y(dataY)
            .smooth(this.options.smooth);
            
        // Calculate contours - use preprocessed data
        const contours = contourGenerator(this.handleNullInGrid(gridData));
        
        // Ensure contours are processed from low to high values for proper rendering
        const sortedContours = [...contours].sort((a, b) => a.value - b.value);
        
        // Reset commands
        this._fillCommands = [];
        this._lineCommands = [];
        
        // Create commands for contours
        for (let i = 0; i < sortedContours.length; i++) {
            const contour = sortedContours[i];
            
            // Get color for current contour
            const color = this.getColorForValue(contour.value);
            const isSpecialContour = this.options.specificThresholds.includes(contour.value);
            
            // Process each polygon in the contour
            for (const polygon of contour.coordinates) {
                // Check if polygon has enough points
                if (!polygon || !polygon[0] || polygon[0].length < 3) {
                    continue;
                }
                
                // Create filled polygon
                if (this.options.showContourFill) {
                    const vertexArray = this._createFillVertexArray(context, polygon, color, contour.value);
                    if (vertexArray) {
                        const command = this._createFillCommand(context, vertexArray, contour.value, i);
                        this._fillCommands.push(command);
                    }
                }
                
                // Create contour lines
                if (this.options.showContourLines) {
                    for (const ring of polygon) {
                        const vertexArray = this._createLineVertexArray(context, ring, isSpecialContour);
                        if (vertexArray) {
                            const command = this._createLineCommand(context, vertexArray, isSpecialContour, contour.value, i);
                            this._lineCommands.push(command);
                        }
                    }
                }
            }
        }
        
        this._generated = true;
    }
    
    update(frameState) {
        if (!this.show) {
            return;
        }
        
        const context = frameState.context;
        
        if (!this._generated) {
            this._generateContours(context);
        }
        
        // Add fill commands to the command list
        for (const command of this._fillCommands) {
            frameState.commandList.push(command);
        }
        
        // Add line commands to the command list
        for (const command of this._lineCommands) {
            frameState.commandList.push(command);
        }
    }
    
    // Reset primitive to regenerate with new settings
    destroy() {
        // Clean up shader programs
        for (const command of this._fillCommands) {
            command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy();
            command.vertexArray = command.vertexArray && command.vertexArray.destroy();
        }
        
        for (const command of this._lineCommands) {
            command.shaderProgram = command.shaderProgram && command.shaderProgram.destroy();
            command.vertexArray = command.vertexArray && command.vertexArray.destroy();
        }
        
        this._fillCommands = [];
        this._lineCommands = [];
        this._generated = false;
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
    
    isDestroyed() {
        return false;
    }
}

// Export
export { CustomContourPrimitive };

