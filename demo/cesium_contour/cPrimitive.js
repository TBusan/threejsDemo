import { contours as ztContours, contourDensity } from "./d3_zoutao.js";
class ContourPrimitive {
    constructor(options = {}) {
        // 默认选项
        this.options = {
            contourData: null,
            specificThresholds: [0, 200, 400, 600, 800, 1000, 1200, 1400, 1600, 1800, 2000, 2200, 2400, 2600, 2800, 3000, 3200, 3400, 3600, 3800],
            showContourLines: true,
            showContourFill: true,
            smooth: true,
            height: 0,
            referencePoint: [0, 0], // 参考点经纬度 [lon, lat]
            scale: 0.001, // 缩放因子，将数据单位转换为地理距离
            ...options
        };
        
        this._primitive = null;
        this._linesPrimitive = null;
        this._contourInstances = [];
        this._lineInstances = [];
        this._materialCache = new Map();
    }
    
    // 处理contourData中的数据，转换为D3可用的格式
    processContourData() {
        if (!this.options.contourData || !this.options.contourData.data) {
            return null;
        }
        
        const dataX = this.options.contourData.data.x;
        const dataY = this.options.contourData.data.y;
        const dataValues = this.options.contourData.data.v;
        
        // 获取数据网格尺寸
        const gridSizeX = dataX.length;
        const gridSizeY = dataY.length;
        
        // 创建一维数组来存储数据，以供D3使用
        const gridData = new Array(gridSizeY * gridSizeX);
        
        // 将二维数组扁平化为一维
        for (let y = 0; y < gridSizeY; y++) {
            for (let x = 0; x < gridSizeX; x++) {
                const value = dataValues[y][x];

                // null值处理：将null值替换为NaN，让D3正确跳过这些区域
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
    
    // 预处理数据，确保NaN值被正确处理
    handleNullInGrid(gridData) {
        // 创建一个副本，避免修改原始数据
        const processedData = [...gridData];
        
        // 确保所有NaN和null值被正确替换为D3能理解的值
        for (let i = 0; i < processedData.length; i++) {
            if (processedData[i] === null || isNaN(processedData[i])) {
                processedData[i] = NaN; // D3 contour generator会跳过NaN值
            }
        }
        
        return processedData;
    }
    
    // 根据数据值获取颜色
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
    
    // 将RGBA字符串转换为Cesium.Color
    parseColor(colorStr) {
        const rgba = colorStr.match(/\d+/g).map(Number);
        // 确保alpha值正确，如果不存在或者解析错误，使用默认值1.0
        const r = rgba[0] / 255;
        const g = rgba[1] / 255;
        const b = rgba[2] / 255;
        const a = rgba.length >= 4 ? rgba[3] / 255 : 1.0;
        return new Cesium.Color(r, g, b, a);
    }
    
    // 将数据坐标转换为Cesium地理坐标
    dataToCartesian(x, y) {
        const [refLon, refLat] = this.options.referencePoint;
        const scale = this.options.scale;
        const height = this.options.height;
        
        // 将数据坐标转换为相对于参考点的经纬度差值
        const lonOffset = x * scale;
        const latOffset = y * scale;
        
        // 计算最终经纬度
        const lon = refLon + lonOffset;
        const lat = refLat + latOffset;
        
        // 转换为Cesium世界坐标
        return Cesium.Cartesian3.fromDegrees(lon, lat, height);
    }
    
    // 为单个等值线创建几何实例
    createContourInstances(contours) {
        this._contourInstances = [];
        this._lineInstances = [];
        
        if (!contours || contours.length === 0) return;
        
        // 确保从低值到高值的顺序处理等值线
        const sortedContours = [...contours].sort((a, b) => a.value - b.value);
        
        for (let i = 0; i < sortedContours.length; i++) {
            const contour = sortedContours[i];
            
            // 获取当前等值线的颜色
            const colorStr = this.getTerrainColor(contour.value);
            const color = this.parseColor(colorStr);
            debugger
            const isSpecialContour = this.options.specificThresholds.includes(contour.value);
            
            // 为每个多边形创建几何实例
            for (const polygon of contour.coordinates) {
                // 检查多边形是否有足够的点
                if (!polygon || !polygon[0] || polygon[0].length < 3) {
                    continue;
                }
                
                // 创建多边形
                if (this.options.showContourFill) {
                    this._createPolygonInstance(polygon, color, contour.value, i);
                }
                
                // 创建线条
                if (this.options.showContourLines) {
                    this._createLineInstance(polygon, isSpecialContour, contour.value, i);
                }
            }
        }
    }
    
    // 创建多边形几何实例
    _createPolygonInstance(polygon, color, value, zIndex) {
        // 处理外部轮廓
        const outerRing = polygon[0];
        const positions = [];
        
        // 转换轮廓点为Cesium坐标
        for (const point of outerRing) {
            const [x, y] = point;
            if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                continue;
            }
            positions.push(this.dataToCartesian(x, y));
        }
        
        if (positions.length < 3) return; // 至少需要3个点形成多边形
        
        // 处理孔洞
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
        
        // 创建多边形几何体
        const polygonHierarchy = new Cesium.PolygonHierarchy(positions, holes);
        
        // 确保颜色的alpha值适中，使填充可见
        const fillColor = color.clone();
        fillColor.alpha = Math.max(0.6, fillColor.alpha); // 确保至少有0.6的不透明度
        
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
    
    // 创建线条几何实例
    _createLineInstance(polygon, isSpecial, value, zIndex) {
        // 处理每个环（外部轮廓和孔洞）
        for (const ring of polygon) {
            const positions = [];
            
            // 转换轮廓点为Cesium坐标
            for (const point of ring) {
                const [x, y] = point;
                if (x === undefined || y === undefined || isNaN(x) || isNaN(y)) {
                    continue;
                }
                positions.push(this.dataToCartesian(x, y));
            }
            
            // 闭合环
            if (positions.length > 0 && positions.length > 2) {
                positions.push(positions[0]);
            } else {
                continue; // 跳过无效的环
            }
            
            // 创建线条几何体
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
    
    // 生成等值线
    generateContours() {
        if (!this.options.contourData) return;
        
        // 处理网格数据
        const { data: gridData, gridSizeX, gridSizeY, dataX, dataY } = this.processContourData();
        if (!gridData) return;
        
        // 导入d3-contour库
        const contourGenerator = ztContours()
            .size([gridSizeX, gridSizeY])
            .thresholds(this.options.specificThresholds)
            .x(dataX)
            .y(dataY)
            .smooth(this.options.smooth);
            
        // 计算等值线 - 使用预处理的数据
        const contours = contourGenerator(this.handleNullInGrid(gridData));
        
        // 创建几何实例
        this.createContourInstances(contours);
        
        return contours;
    }
    
    // 创建Primitive
    update(frameState) {
        if (!this._primitive || !this._linesPrimitive) {
            this.generateContours();
            
            if (this._contourInstances.length > 0) {
                // 创建填充区域的Primitive
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
                // 创建线条的Primitive
                this._linesPrimitive = new Cesium.Primitive({
                    geometryInstances: this._lineInstances,
                    appearance: new Cesium.PolylineColorAppearance({
                        translucent: true
                    }),
                    asynchronous: false
                });
            }
        }
        
        if (this._primitive) {
            this._primitive.update(frameState);
        }
        
        if (this._linesPrimitive) {
            this._linesPrimitive.update(frameState);
        }
    }
    
    // 销毁资源
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
    
    // 设置新的阈值
    setThresholds(thresholds) {
        this.options.specificThresholds = thresholds;
        this.destroy();
    }
    
    // 设置是否显示等值线
    setShowContourLines(show) {
        if (this.options.showContourLines !== show) {
            this.options.showContourLines = show;
            this.destroy();
        }
    }
    
    // 设置是否平滑处理
    setSmooth(smooth) {
        if (this.options.smooth !== smooth) {
            this.options.smooth = smooth;
            this.destroy();
        }
    }
    
    // 设置是否显示填充区域
    setShowContourFill(show) {
        if (this.options.showContourFill !== show) {
            this.options.showContourFill = show;
            this.destroy();
        }
    }
    
    // 设置新的数据
    setContourData(contourData) {
        this.options.contourData = contourData;
        this.destroy();
    }
}

// 导出
export { ContourPrimitive };
