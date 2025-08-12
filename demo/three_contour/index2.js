/**
 * ThreeContour - 基于three.js的等值线渲染实现
 * 参考plotly.js的实现方式
 */

import * as THREE from 'three';

/**
 * 等值线渲染器类
 */
class ThreeContour {
  /**
   * 构造函数
   * @param {Object} options 配置选项
   */
  constructor(options = {}) {
    this.options = Object.assign({
      // 默认配置
      width: 500,
      height: 500,
      antialias: true,
      backgroundColor: 0xf0f0f0
    }, options);

    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.contourGroup = null;
    this.colorMap = null;
    this.data = null;

    this._init();
  }

  /**
   * 初始化three.js场景
   * @private
   */
  _init() {
    // 创建场景
    this.scene = new THREE.Scene();
    
    // 创建相机
    this.camera = new THREE.OrthographicCamera(
      -1, 1, 1, -1, 0.1, 1000
    );
    this.camera.position.z = 5;
    
    // 创建渲染器
    this.renderer = new THREE.WebGLRenderer({
      antialias: this.options.antialias
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setClearColor(this.options.backgroundColor);
    
    // 创建等值线组
    this.contourGroup = new THREE.Group();
    this.scene.add(this.contourGroup);
  }

  /**
   * 设置数据
   * @param {Array<Array<number>>} z 二维数组数据
   * @param {Object} options 等值线配置选项
   */
  setData(z, options = {}) {
    this.data = z;
    this.dataOptions = Object.assign({
      // 默认等值线配置
      start: null,
      end: null,
      size: null,
      coloring: 'fill', // 'fill', 'lines', 'heatmap'
      colorscale: [
        [0, 'rgb(0,0,255)'],
        [0.5, 'rgb(0,255,0)'],
        [1, 'rgb(255,0,0)']
      ],
      useRealValue: false,
      showLines: true,
      lineWidth: 2,
      lineColor: 'rgb(0,0,0)',
      opacity: 1
    }, options);

    // 计算数据范围
    this._calculateDataRange();

    // 设置默认的起始值、结束值和步长
    if (this.dataOptions.start === null) {
      this.dataOptions.start = this.dataRange.min;
    }
    if (this.dataOptions.end === null) {
      this.dataOptions.end = this.dataRange.max;
    }
    if (this.dataOptions.size === null) {
      const range = this.dataOptions.end - this.dataOptions.start;
      this.dataOptions.size = range / 10;
    }

    // 创建颜色映射函数
    this._createColorMap();

    // 清除现有的等值线
    this._clearContours();

    // 生成等值线
    this._generateContours();
  }

  /**
   * 计算数据范围
   * @private
   */
  _calculateDataRange() {
    let min = Infinity;
    let max = -Infinity;
    
    for (let i = 0; i < this.data.length; i++) {
      for (let j = 0; j < this.data[i].length; j++) {
        const val = this.data[i][j];
        if (val < min) min = val;
        if (val > max) max = val;
      }
    }
    
    this.dataRange = { min, max };
  }

  /**
   * 创建颜色映射函数
   * @private
   */
  _createColorMap() {
    const { colorscale, useRealValue } = this.dataOptions;
    const { min, max } = this.dataRange;
    
    // 处理colorscale
    let domain = [];
    let range = [];
    
    for (let i = 0; i < colorscale.length; i++) {
      const si = colorscale[i];
      if (useRealValue) {
        // 使用真实值
        domain.push(si[0]);
      } else {
        // 使用归一化值
        domain.push(min + si[0] * (max - min));
      }
      
      // 解析颜色
      range.push(this._parseColor(si[1]));
    }
    
    // 确保domain是升序排列的
    if (domain.length > 1) {
      const needsSort = domain[0] > domain[domain.length - 1];
      if (needsSort) {
        const pairs = domain.map((d, i) => ({ domain: d, range: range[i] }));
        pairs.sort((a, b) => a.domain - b.domain);
        
        domain = pairs.map(p => p.domain);
        range = pairs.map(p => p.range);
      }
    }
    
    // 创建颜色映射函数
    this.colorMap = (value) => {
      // 处理边界情况
      if (value <= domain[0]) return range[0];
      if (value >= domain[domain.length - 1]) return range[domain.length - 1];
      
      // 找到value所在的区间
      let i = 0;
      while (i < domain.length - 1 && value > domain[i + 1]) i++;
      
      if (useRealValue) {
        // 对于真实值模式，使用最接近的颜色
        const d1 = Math.abs(value - domain[i]);
        const d2 = Math.abs(value - domain[i + 1]);
        return d1 <= d2 ? range[i] : range[i + 1];
      } else {
        // 对于归一化模式，使用线性插值
        const t = (value - domain[i]) / (domain[i + 1] - domain[i]);
        return this._lerpColor(range[i], range[i + 1], t);
      }
    };
  }

  /**
   * 解析颜色字符串为THREE.Color对象
   * @param {string} colorStr 颜色字符串，如'rgb(255,0,0)'
   * @returns {THREE.Color} THREE.Color对象
   * @private
   */
  _parseColor(colorStr) {
    if (colorStr.startsWith('rgb')) {
      const rgb = colorStr.match(/\d+/g).map(Number);
      return new THREE.Color(rgb[0] / 255, rgb[1] / 255, rgb[2] / 255);
    }
    return new THREE.Color(colorStr);
  }

  /**
   * 线性插值两个颜色
   * @param {THREE.Color} color1 第一个颜色
   * @param {THREE.Color} color2 第二个颜色
   * @param {number} t 插值因子，范围[0,1]
   * @returns {THREE.Color} 插值后的颜色
   * @private
   */
  _lerpColor(color1, color2, t) {
    const result = new THREE.Color();
    result.r = color1.r + (color2.r - color1.r) * t;
    result.g = color1.g + (color2.g - color1.g) * t;
    result.b = color1.b + (color2.b - color1.b) * t;
    return result;
  }

  /**
   * 清除现有的等值线
   * @private
   */
  _clearContours() {
    while (this.contourGroup.children.length > 0) {
      const child = this.contourGroup.children[0];
      this.contourGroup.remove(child);
      
      if (child.geometry) {
        child.geometry.dispose();
      }
      if (child.material) {
        child.material.dispose();
      }
    }
  }

  /**
   * 创建边界路径，确保等值线填充区域的完整性
   * @private
   */
  _createBoundaryPath() {
    const rows = this.data.length;
    const cols = this.data[0].length;
    
    // 创建矩形边界的四个角点
    return [
      new THREE.Vector3(0, 0, 0),                 // 左上
      new THREE.Vector3(cols - 1, 0, 0),          // 右上
      new THREE.Vector3(cols - 1, rows - 1, 0),   // 右下
      new THREE.Vector3(0, rows - 1, 0)           // 左下
    ];
  }
  
  /**
   * 判断路径是否需要在边界上闭合
   * @param {number} level 等值线级别
   * @private
   */
  _needsBoundaryPrefix(level) {
    if (!this.data || !this.data.length || !this.data[0].length) return false;
    
    // 参考 Plotly.js 的 close_boundaries.js 实现
    // 检查边界点的最小值是否大于 level
    const edgeVal = Math.min(this.data[0][0], this.data[0][1]); 
    return edgeVal > level;
  }
  
  /**
   * 修改生成等值线的方法，添加边界处理
   * @private
   */
  _generateContours() {
    const { start, end, size, coloring, showLines, lineWidth, lineColor, opacity } = this.dataOptions;
    
    // 计算等值线级别
    const levels = [];
    for (let level = start; level <= end; level += size) {
      levels.push(level);
    }
    
    // 为所有级别提前计算等值线，以确保所有模式使用相同的等值线形状
    const allContourPaths = {};
    for (const level of levels) {
      allContourPaths[level] = this._marchingSquares(this.data, level);
    }
    
    // 创建矩形边界
    const boundaryPath = this._createBoundaryPath();
    
    // 根据coloring决定如何渲染
    if (coloring === 'fill') {
      // 渲染填充区域 - 使用类似 Plotly 的方式
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        
        // 获取当前级别的路径
        const paths = allContourPaths[level];
        
        // 分离开口线和闭合线
        const edgepaths = paths.filter(path => !this._isClosedPath(path));
        const closedpaths = paths.filter(path => this._isClosedPath(path));
        
        // 创建类似 Plotly 的 pathinfo 对象
        const pathinfo = {
          level,
          edgepaths,
          paths: closedpaths
        };
        
        // 检查是否需要添加边界
        pathinfo.prefixBoundary = this._needsBoundaryPrefix(level);
        
        try {
          // 创建填充材质
          const fillMaterial = new THREE.MeshBasicMaterial({
            color: this.colorMap(level),
            opacity: opacity,
            transparent: opacity < 1,
            side: THREE.DoubleSide
          });
          
          // 使用 joinAllPaths 获取完整的填充路径
          const fullpath = this._joinAllPaths(pathinfo, boundaryPath);
          
          // 如果需要添加边界前缀
          if (pathinfo.prefixBoundary) {
            // 添加边界路径
            fullpath.unshift(...boundaryPath);
          }
          
          if (fullpath.length >= 3) {
            // 创建填充几何体
            const shape = new THREE.Shape();
            
            // 移动到第一个点
            shape.moveTo(fullpath[0].x, fullpath[0].y);
            
            // 添加所有其他点
            for (let j = 1; j < fullpath.length; j++) {
              shape.lineTo(fullpath[j].x, fullpath[j].y);
            }
            
            // 闭合形状
            shape.closePath();
            
            // 创建几何体
            const geometry = new THREE.ShapeGeometry(shape);
            
            // 创建网格并添加到场景
            const mesh = new THREE.Mesh(geometry, fillMaterial);
            mesh.position.z = 0.01 * i; // 轻微偏移以避免z-fighting
            this.contourGroup.add(mesh);
          }
        } catch (e) {
          console.error('创建填充区域时发生错误', e);
        }
      }
      
      // 在fill模式下，总是渲染线条
      if (showLines) {
        for (let i = 0; i < levels.length; i++) {
          const level = levels[i];
          const paths = allContourPaths[level];
          
          if (paths.length === 0) continue;
          
          // 对于线条，使用指定的线条颜色或当前级别的颜色
          const currentLineColor = lineColor || this._getLevelColor(level);
          const currentLineWidth = lineWidth || 1;
          
          this._renderContourLine(paths, level, currentLineColor, currentLineWidth, opacity);
        }
      }
    } else if (coloring === 'lines') {
      // 只渲染线条模式
      for (let i = 0; i < levels.length; i++) {
        const level = levels[i];
        const paths = allContourPaths[level];
        
        if (paths.length === 0) continue;
        this._renderContourLine(paths, level, null, lineWidth, opacity);
      }
    } else if (coloring === 'heatmap') {
      // 热图模式
      this._createHeatmap();
    }
    
    // 调整相机以适应等值线
    this._adjustCamera();
  }
  
  /**
   * 获取特定级别的颜色
   * @param {number} level 等值线级别
   * @returns {string} 颜色
   * @private
   */
  _getLevelColor(level) {
    const color = this.colorMap(level);
    return `rgb(${Math.round(color.r * 255)},${Math.round(color.g * 255)},${Math.round(color.b * 255)})`;
  }
  
  /**
   * 创建边界填充几何体 - 用于一个等值线级别没有路径的情况
   * @param {Array<Array<THREE.Vector3>>} paths1 第一组等值线路径
   * @param {Array<Array<THREE.Vector3>>} paths2 第二组等值线路径
   * @returns {THREE.BufferGeometry} 填充几何体
   * @private
   */
  _createBoundaryFill(paths1, paths2) {
    // 合并所有路径创建一个单一的几何体
    const geometries = [];
    
    for (const path1 of paths1) {
      for (const path2 of paths2) {
        const fillGeom = this._createSingleFillGeometry(path1, path2);
        if (fillGeom) {
          geometries.push(fillGeom);
        }
      }
    }
    
    if (geometries.length === 0) return null;
    if (geometries.length === 1) return geometries[0];
    
    return mergeGeometries(geometries);
  }

  /**
   * 渲染等值线线条
   * @param {Array<Array<THREE.Vector3>>} paths 路径数组
   * @param {number} level 等值线级别
   * @param {string|null} lineColor 线条颜色，null表示使用colorMap
   * @param {number} lineWidth 线条宽度
   * @param {number} opacity 不透明度
   * @private
   */
  _renderContourLine(paths, level, lineColor, lineWidth, opacity) {
    // 创建线条材质
    const material = new THREE.LineBasicMaterial({
      color: lineColor ? this._parseColor(lineColor) : this.colorMap(level),
      linewidth: lineWidth,
      opacity: opacity,
      transparent: opacity < 1
    });
    
    // 为每条路径创建线条
    for (const path of paths) {
      if (path.length < 2) continue;
      
      // 验证点坐标
      const validPath = path.filter(pt => 
        !isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z) &&
        isFinite(pt.x) && isFinite(pt.y) && isFinite(pt.z)
      );
      
      if (validPath.length < 2) continue;
      
      // 创建线条几何体
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      
      // 添加所有顶点
      for (const point of validPath) {
        vertices.push(point.x, point.y, point.z);
      }
      
      // 闭合路径（如果需要）
      if (this._isClosedPath(path) && 
          !this._pointsAreClose(path[0], path[path.length - 1])) {
        vertices.push(path[0].x, path[0].y, path[0].z);
      }
      
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      // 创建线段
      const line = new THREE.Line(geometry, material);
      this.contourGroup.add(line);
    }
  }

  /**
   * 使用marching squares算法生成等值线
   * @param {Array<Array<number>>} data 二维数组数据
   * @param {number} level 等值线级别
   * @returns {Array<Array<THREE.Vector3>>} 等值线路径数组
   * @private
   */
  _marchingSquares(data, level) {
    const rows = data.length;
    const cols = data[0].length;
    const paths = [];
    
    // 创建一个访问标记数组，用于跟踪已访问的单元格
    const visited = Array(rows - 1).fill().map(() => Array(cols - 1).fill(false));
    
    // 遍历每个单元格
    for (let i = 0; i < rows - 1; i++) {
      for (let j = 0; j < cols - 1; j++) {
        if (visited[i][j]) continue;
        
        // 检查当前单元格是否与等值线相交
        const path = this._tracePath(data, level, i, j, visited);
        if (path.length > 0) {
          paths.push(path);
        }
      }
    }
    
    return paths;
  }

  /**
   * 从给定的起始单元格追踪等值线路径
   * @param {Array<Array<number>>} data 二维数组数据
   * @param {number} level 等值线级别
   * @param {number} startI 起始单元格的行索引
   * @param {number} startJ 起始单元格的列索引
   * @param {Array<Array<boolean>>} visited 访问标记数组
   * @returns {Array<THREE.Vector3>} 等值线路径
   * @private
   */
  _tracePath(data, level, startI, startJ, visited) {
    const rows = data.length;
    const cols = data[0].length;
    const path = [];
    
    let i = startI;
    let j = startJ;
    let entryEdge = -1; // 初始没有入口边
    
    // 定义边界检查函数
    const isOnLeftBoundary = (x) => Math.abs(x - 0) < 1e-6;
    const isOnRightBoundary = (x) => Math.abs(x - (cols - 1)) < 1e-6;
    const isOnTopBoundary = (y) => Math.abs(y - 0) < 1e-6;
    const isOnBottomBoundary = (y) => Math.abs(y - (rows - 1)) < 1e-6;
    
    // 追踪等值线路径
    do {
      if (i < 0 || i >= rows - 1 || j < 0 || j >= cols - 1 || visited[i][j]) break;
      visited[i][j] = true;
      
      // 获取单元格的四个角点值
      const v00 = data[i][j];
      const v01 = data[i][j + 1];
      const v10 = data[i + 1][j];
      const v11 = data[i + 1][j + 1];
      
      // 确定单元格类型 (marching squares case)
      let caseIndex = 0;
      if (v00 > level) caseIndex |= 1;
      if (v01 > level) caseIndex |= 2;
      if (v11 > level) caseIndex |= 4;
      if (v10 > level) caseIndex |= 8;
      
      // 单元格完全在等值线之上或之下，跳过
      if (caseIndex === 0 || caseIndex === 15) continue;
      
      // 计算等值线与单元格边的交点
      const points = [];
      
      // 边0: (i,j) - (i,j+1) [上边]
      if ((caseIndex & 3) === 1 || (caseIndex & 3) === 2) {
        const denominator = v01 - v00;
        if (Math.abs(denominator) > 1e-10) {
          const t = (level - v00) / denominator;
          if (!isNaN(t) && t >= 0 && t <= 1) {
            points.push(new THREE.Vector3(j + t, i, 0));
          }
        }
      }
      
      // 边1: (i,j+1) - (i+1,j+1) [右边]
      if ((caseIndex & 6) === 2 || (caseIndex & 6) === 4) {
        const denominator = v11 - v01;
        if (Math.abs(denominator) > 1e-10) {
          const t = (level - v01) / denominator;
          if (!isNaN(t) && t >= 0 && t <= 1) {
            points.push(new THREE.Vector3(j + 1, i + t, 0));
          }
        }
      }
      
      // 边2: (i+1,j+1) - (i+1,j) [下边]
      if ((caseIndex & 12) === 4 || (caseIndex & 12) === 8) {
        const denominator = v10 - v11;
        if (Math.abs(denominator) > 1e-10) {
          const t = (level - v11) / denominator;
          if (!isNaN(t) && t >= 0 && t <= 1) {
            points.push(new THREE.Vector3(j + 1 - t, i + 1, 0));
          }
        }
      }
      
      // 边3: (i+1,j) - (i,j) [左边]
      if ((caseIndex & 9) === 1 || (caseIndex & 9) === 8) {
        const denominator = v00 - v10;
        if (Math.abs(denominator) > 1e-10) {
          const t = (level - v10) / denominator;
          if (!isNaN(t) && t >= 0 && t <= 1) {
            points.push(new THREE.Vector3(j, i + 1 - t, 0));
          }
        }
      }
      
      // 鞍点情况处理
      if (caseIndex === 5 || caseIndex === 10) {
        const vCenter = (v00 + v01 + v10 + v11) / 4;
        if ((vCenter > level && caseIndex === 5) || (vCenter <= level && caseIndex === 10)) {
          // 确保点按正确的顺序排列
          const orderedPoints = [];
          orderedPoints.push(points.find(p => Math.abs(p.y - i) < 1e-6));  // 上边的点
          orderedPoints.push(points.find(p => Math.abs(p.x - (j + 1)) < 1e-6)); // 右边的点
          orderedPoints.push(points.find(p => Math.abs(p.y - (i + 1)) < 1e-6)); // 下边的点
          orderedPoints.push(points.find(p => Math.abs(p.x - j) < 1e-6)); // 左边的点
          
          path.push(orderedPoints[0], orderedPoints[3]);
          path.push(orderedPoints[1], orderedPoints[2]);
        } else {
          // 另一种鞍点情况
          const orderedPoints = [];
          orderedPoints.push(points.find(p => Math.abs(p.y - i) < 1e-6));  // 上边的点
          orderedPoints.push(points.find(p => Math.abs(p.x - (j + 1)) < 1e-6)); // 右边的点
          orderedPoints.push(points.find(p => Math.abs(p.y - (i + 1)) < 1e-6)); // 下边的点
          orderedPoints.push(points.find(p => Math.abs(p.x - j) < 1e-6)); // 左边的点
          
          path.push(orderedPoints[0], orderedPoints[1]);
          path.push(orderedPoints[2], orderedPoints[3]);
        }
      } else {
        // 确保点按正确的顺序连接 - 先根据边的顺序排序
        points.sort((a, b) => {
          // 如果一个点在上边，另一个点不在，则上边的点排前面
          if (Math.abs(a.y - i) < 1e-6 && Math.abs(b.y - i) >= 1e-6) return -1;
          if (Math.abs(a.y - i) >= 1e-6 && Math.abs(b.y - i) < 1e-6) return 1;
          
          // 如果都在上下边或者都不在上下边，则按x坐标排序
          if (Math.abs(a.y - i) < 1e-6 && Math.abs(b.y - i) < 1e-6 ||
              Math.abs(a.y - (i + 1)) < 1e-6 && Math.abs(b.y - (i + 1)) < 1e-6) {
            return a.x - b.x;
          }
          
          // 其他情况按y坐标排序
          return a.y - b.y;
        });
        
        // 正常情况下将排序后的点添加到路径中
        path.push(...points);
      }
      
      // 确定下一个单元格
      const exitEdge = this._findExitEdge(points, i, j);
      if (exitEdge === -1) break;
      
      // 移动到下一个单元格
      if (exitEdge === 0) j += 1;      // 向右
      else if (exitEdge === 1) i += 1; // 向下
      else if (exitEdge === 2) j -= 1; // 向左
      else if (exitEdge === 3) i -= 1; // 向上
      
      entryEdge = (exitEdge + 2) % 4;  // 入口边是出口边的对面
      
    } while (i >= 0 && i < rows - 1 && j >= 0 && j < cols - 1 && !(i === startI && j === startJ));
    
    // 检查路径上的点，去除距离太近的点
    if (path.length > 2) {
      const filteredPath = [path[0]];
      const minDistance = 0.01; // 最小距离阈值
      
      for (let i = 1; i < path.length; i++) {
        const prev = filteredPath[filteredPath.length - 1];
        const curr = path[i];
        const dist = Math.hypot(curr.x - prev.x, curr.y - prev.y);
        
        if (dist > minDistance) {
          filteredPath.push(curr);
        }
      }
      
      return filteredPath;
    }
    
    return path;
  }

  /**
   * 找到等值线离开单元格的边
   * @param {Array<THREE.Vector3>} points 等值线与单元格边的交点
   * @param {number} i 单元格的行索引
   * @param {number} j 单元格的列索引
   * @returns {number} 出口边的索引（0-3）或-1表示没有出口
   * @private
   */
  _findExitEdge(points, i, j) {
    if (points.length !== 2) return -1;
    
    const lastPoint = points[points.length - 1];
    
    // 检查点是否在各边上
    if (Math.abs(lastPoint.x - j) < 1e-6) return 2; // 左边
    if (Math.abs(lastPoint.x - (j + 1)) < 1e-6) return 0; // 右边
    if (Math.abs(lastPoint.y - i) < 1e-6) return 3; // 上边
    if (Math.abs(lastPoint.y - (i + 1)) < 1e-6) return 1; // 下边
    
    return -1;
  }

  /**
   * 创建两组等值线路径之间的填充几何体
   * @param {Array<Array<THREE.Vector3>>} paths1 第一组等值线路径
   * @param {Array<Array<THREE.Vector3>>} paths2 第二组等值线路径
   * @returns {THREE.BufferGeometry|null} 填充几何体
   * @private
   */
  _createFillGeometry(paths1, paths2) {
    if (!paths1.length || !paths2.length) return null;
    
    // 创建一个几何体集合以便后续合并
    const geometries = [];

    // 获取整体边界以确保一致的填充方向
    const boundaryPath = this._createBoundaryPath();
    const boundaryBox = this._getPathBoundingBox(boundaryPath);
    
    // 确保两个级别的路径都具有一致的方向
    // 这在渲染均匀的条带填充时非常重要
    const sortedPaths1 = [...paths1].sort((a, b) => {
      const areaA = Math.abs(this._calculatePathArea(a));
      const areaB = Math.abs(this._calculatePathArea(b));
      return areaB - areaA; // 面积大的优先
    });
    
    const sortedPaths2 = [...paths2].sort((a, b) => {
      const areaA = Math.abs(this._calculatePathArea(a));
      const areaB = Math.abs(this._calculatePathArea(b));
      return areaB - areaA; // 面积大的优先
    });
    
    // 对于每个路径组合，创建填充
    // 首先处理闭合路径
    const closedPaths1 = sortedPaths1.filter(path => this._isClosedPath(path));
    const closedPaths2 = sortedPaths2.filter(path => this._isClosedPath(path));
    
    // 处理内部闭合路径
    for (const path1 of closedPaths1) {
      // 寻找最佳匹配的路径
      const bestMatch = this._findBestPathMatch(path1, closedPaths2);
      if (bestMatch) {
        const fillGeom = this._createSingleFillGeometry(path1, bestMatch);
        if (fillGeom) geometries.push(fillGeom);
      }
    }
    
    // 处理边缘路径
    const edgePaths1 = sortedPaths1.filter(path => !this._isClosedPath(path));
    const edgePaths2 = sortedPaths2.filter(path => !this._isClosedPath(path));
    
    // 如果有边缘路径，确保它们被闭合并一致地填充
    if (edgePaths1.length || edgePaths2.length) {
      // 处理第一组级别的边缘路径
      for (const path1 of edgePaths1) {
        // 对于第二级中的每条路径
        for (const path2 of edgePaths2) {
          // 创建一个闭合路径
          const closedPath = this._createClosedContourPath(path1, path2, boundaryPath);
          if (closedPath) {
            const fillGeom = this._createSingleFillGeometry(closedPath, path2);
            if (fillGeom) geometries.push(fillGeom);
          }
        }
      }
      
      // 如果上面的方法没有产生几何体，我们尝试直接使用边界
      if (geometries.length === 0) {
        const boundaryFill = this._createBoundaryFill([boundaryPath], [boundaryPath]);
        if (boundaryFill) geometries.push(boundaryFill);
      }
    }
    
    // 如果没有创建几何体，返回null
    if (geometries.length === 0) {
      return null;
    }
    
    // 如果只有一个几何体，直接返回
    if (geometries.length === 1) {
      return geometries[0];
    }
    
    // 合并所有几何体
    return mergeGeometries(geometries);
  }
  
  /**
   * 创建闭合的等值线路径
   * @param {Array<THREE.Vector3>} path1 第一条路径
   * @param {Array<THREE.Vector3>} path2 第二条路径
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @returns {Array<THREE.Vector3>|null} 闭合路径
   * @private
   */
  _createClosedContourPath(path1, path2, boundaryPath) {
    if (!path1.length || !path2.length) return null;
    
    // 找出边界点
    const startPoint1 = path1[0];
    const endPoint1 = path1[path1.length - 1];
    const startPoint2 = path2[0];
    const endPoint2 = path2[path2.length - 1];
    
    // 检查路径是否能够直接连接
    if (this._pointsAreClose(endPoint1, startPoint2)) {
      // 路径1的终点和路径2的起点相连
      const combined = [...path1];
      combined.pop(); // 移除最后一个点，避免重复
      combined.push(...path2);
      return combined;
    } else if (this._pointsAreClose(endPoint2, startPoint1)) {
      // 路径2的终点和路径1的起点相连
      const combined = [...path2];
      combined.pop(); // 移除最后一个点，避免重复
      combined.push(...path1);
      return combined;
    }
    
    // 如果两条路径都碰到了边界，尝试沿边界连接它们
    const isOnBoundary = (point) => {
      const rows = this.data.length;
      const cols = this.data[0].length;
      const eps = 0.01;
      
      return Math.abs(point.x - 0) < eps || 
             Math.abs(point.x - (cols-1)) < eps || 
             Math.abs(point.y - 0) < eps || 
             Math.abs(point.y - (rows-1)) < eps;
    };
    
    const start1OnBoundary = isOnBoundary(startPoint1);
    const end1OnBoundary = isOnBoundary(endPoint1);
    const start2OnBoundary = isOnBoundary(startPoint2);
    const end2OnBoundary = isOnBoundary(endPoint2);
    
    if ((start1OnBoundary || end1OnBoundary) && 
        (start2OnBoundary || end2OnBoundary)) {
      
      // 优先使用第一个路径
      const combined = [...path1];
      
      // 尝试找到边界连接点
      const boundaryPoints = this._findBoundaryConnection(
        end1OnBoundary ? endPoint1 : startPoint1, 
        start2OnBoundary ? startPoint2 : endPoint2, 
        boundaryPath
      );
      
      if (boundaryPoints.length) {
        // 确保路径1是正确的方向
        const finalPath1 = end1OnBoundary ? path1 : path1.slice().reverse();
        const finalPath2 = start2OnBoundary ? path2 : path2.slice().reverse();
        
        // 构建完整路径
        const combinedPath = [...finalPath1];
        combinedPath.push(...boundaryPoints);
        combinedPath.push(...finalPath2);
        
        return combinedPath;
      }
    }
    
    // 如果无法连接，返回null
    return null;
  }
  
  /**
   * 查找两点之间沿边界的连接路径
   * @param {THREE.Vector3} point1 第一个点
   * @param {THREE.Vector3} point2 第二个点
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @returns {Array<THREE.Vector3>} 连接点
   * @private
   */
  _findBoundaryConnection(point1, point2, boundaryPath) {
    const rows = this.data.length;
    const cols = this.data[0].length;
    const eps = 0.01;
    
    // 判断点在哪条边界上
    const getBoundarySide = (point) => {
      if (Math.abs(point.y) < eps) return "top";
      if (Math.abs(point.y - (rows-1)) < eps) return "bottom";
      if (Math.abs(point.x) < eps) return "left";
      if (Math.abs(point.x - (cols-1)) < eps) return "right";
      return "";
    };
    
    const side1 = getBoundarySide(point1);
    const side2 = getBoundarySide(point2);
    
    if (!side1 || !side2) return [];
    
    // 边界角点索引
    const cornerIndex = {
      "top-left": 0,     // 左上角
      "top-right": 1,    // 右上角
      "bottom-right": 2, // 右下角
      "bottom-left": 3   // 左下角
    };
    
    // 边界边的索引
    const sideIndex = {
      "top": 0,    // 上边 (从左到右)
      "right": 1,  // 右边 (从上到下)
      "bottom": 2, // 下边 (从右到左)
      "left": 3    // 左边 (从下到上)
    };
    
    // 如果点在同一边界上，只需直接连接它们
    if (side1 === side2) {
      return [];
    }
    
    // 为简单起见，我们走最短的边界路径
    const path = [];
    let currentSide = sideIndex[side1];
    const targetSide = sideIndex[side2];
    
    // 计算顺时针和逆时针的距离
    const clockwiseDist = (targetSide - currentSide + 4) % 4;
    const counterClockwiseDist = (currentSide - targetSide + 4) % 4;
    
    // 选择最短的路径
    const clockwise = clockwiseDist <= counterClockwiseDist;
    
    while (currentSide !== targetSide) {
      currentSide = clockwise ? 
        (currentSide + 1) % 4 : 
        (currentSide - 1 + 4) % 4;
      
      // 添加当前边的终点
      const cornerIdx = clockwise ? 
        (currentSide + 1) % 4 : 
        currentSide;
      
      path.push(boundaryPath[cornerIdx].clone());
    }
    
    return path;
  }

  /**
   * 连接边缘路径，处理与边界的连接
   * @param {Array<Array<THREE.Vector3>>} edgePaths1 第一组边缘路径
   * @param {Array<Array<THREE.Vector3>>} edgePaths2 第二组边缘路径
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @returns {Array<THREE.BufferGeometry>} 填充几何体数组
   * @private
   */
  _connectEdgePaths(edgePaths1, edgePaths2, boundaryPath) {
    const geometries = [];
    const rows = this.data.length;
    const cols = this.data[0].length;
    
    // 用于边界检测的小值
    const epsilon = 0.01;
    
    // 定义边界函数，类似于 Plotly 的实现
    const isOnLeftBoundary = (pt) => Math.abs(pt.x - 0) < epsilon;
    const isOnRightBoundary = (pt) => Math.abs(pt.x - (cols - 1)) < epsilon;
    const isOnTopBoundary = (pt) => Math.abs(pt.y - 0) < epsilon;
    const isOnBottomBoundary = (pt) => Math.abs(pt.y - (rows - 1)) < epsilon;
    
    // 处理第一组边缘路径
    for (const path1 of edgePaths1) {
      if (path1.length < 2) continue;
      
      // 获取路径的起点和终点
      const startPt = path1[0];
      const endPt = path1[path1.length - 1];
      
      // 确定路径的边界点
      const startOnBoundary = isOnLeftBoundary(startPt) || isOnRightBoundary(startPt) || 
                             isOnTopBoundary(startPt) || isOnBottomBoundary(startPt);
      
      const endOnBoundary = isOnLeftBoundary(endPt) || isOnRightBoundary(endPt) || 
                           isOnTopBoundary(endPt) || isOnBottomBoundary(endPt);
      
      // 对于第二组中的每条路径尝试连接
      for (const path2 of edgePaths2) {
        if (path2.length < 2) continue;
        
        const startPt2 = path2[0];
        const endPt2 = path2[path2.length - 1];
        
        // 尝试连接路径
        const combinedPath1 = this._connectPathsIfPossible(path1, path2, boundaryPath.slice());
        if (combinedPath1) {
          const fillGeom = this._createSingleFillGeometry(combinedPath1, path2);
          if (fillGeom) geometries.push(fillGeom);
          continue;
        }
        
        // 反向尝试
        const combinedPath2 = this._connectPathsIfPossible(path2, path1, boundaryPath.slice());
        if (combinedPath2) {
          const fillGeom = this._createSingleFillGeometry(path1, combinedPath2);
          if (fillGeom) geometries.push(fillGeom);
          continue;
        }
        
        // 如果无法连接，则尝试使用边界封闭
        if (startOnBoundary && endOnBoundary) {
          // 创建一个包含路径1和路径2的闭合回路
          // 这类似于 Plotly 的 joinAllPaths 函数
          const closedPath = this._createClosedPathWithBoundary(
            path1, path2, boundaryPath, isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary
          );
          
          if (closedPath) {
            const fillGeom = this._createSingleFillGeometry(closedPath, path2);
            if (fillGeom) geometries.push(fillGeom);
          } else {
            // 最简单的情况：直接尝试填充两条路径
            const fillGeom = this._createSingleFillGeometry(path1, path2);
            if (fillGeom) geometries.push(fillGeom);
          }
        } else {
          // 直接连接两条路径
          const fillGeom = this._createSingleFillGeometry(path1, path2);
          if (fillGeom) geometries.push(fillGeom);
        }
      }
    }
    
    return geometries;
  }
  
  /**
   * 判断路径是否闭合
   * @param {Array<THREE.Vector3>} path 路径
   * @returns {boolean} 是否闭合
   * @private
   */
  _isClosedPath(path) {
    if (path.length < 3) return false;
    
    const firstPt = path[0];
    const lastPt = path[path.length - 1];
    
    // 检查首尾点是否重合
    return Math.abs(firstPt.x - lastPt.x) < 0.01 && 
           Math.abs(firstPt.y - lastPt.y) < 0.01;
  }
  
  /**
   * 寻找最佳匹配路径
   * @param {Array<THREE.Vector3>} path 源路径
   * @param {Array<Array<THREE.Vector3>>} candidatePaths 候选路径数组
   * @returns {Array<THREE.Vector3>|null} 最佳匹配路径
   * @private
   */
  _findBestPathMatch(path, candidatePaths) {
    if (!candidatePaths.length) return null;
    
    // 获取路径的边界框
    const bbox = this._getPathBoundingBox(path);
    
    // 计算每个候选路径的重叠区域
    const overlaps = candidatePaths.map(candidatePath => {
      const candidateBBox = this._getPathBoundingBox(candidatePath);
      return {
        path: candidatePath,
        overlap: this._calculateOverlapArea(bbox, candidateBBox),
        distance: this._calculateBoundingBoxDistance(bbox, candidateBBox)
      };
    });
    
    // 按重叠区域排序（优先）和距离（其次）
    overlaps.sort((a, b) => {
      if (a.overlap !== b.overlap) {
        return b.overlap - a.overlap; // 重叠区域大的优先
      }
      return a.distance - b.distance; // 距离小的优先
    });
    
    // 返回最佳匹配
    return overlaps.length ? overlaps[0].path : null;
  }
  
  /**
   * 尝试连接两条路径
   * @param {Array<THREE.Vector3>} path1 第一条路径
   * @param {Array<THREE.Vector3>} path2 第二条路径
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @returns {Array<THREE.Vector3>|null} 连接后的路径或null
   * @private
   */
  _connectPathsIfPossible(path1, path2, boundaryPath) {
    if (path1.length < 2 || path2.length < 2) return null;
    
    const endPt1 = path1[path1.length - 1];
    const startPt2 = path2[0];
    
    // 检查路径是否可以直接连接
    if (Math.abs(endPt1.x - startPt2.x) < 0.01 && 
        Math.abs(endPt1.y - startPt2.y) < 0.01) {
      // 路径可以直接连接
      return [...path1, ...path2.slice(1)];
    }
    
    return null;
  }
  
  /**
   * 使用边界创建闭合路径
   * @param {Array<THREE.Vector3>} path1 第一条路径
   * @param {Array<THREE.Vector3>} path2 第二条路径
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @param {Function} isOnLeftBoundary 左边界检测函数
   * @param {Function} isOnRightBoundary 右边界检测函数
   * @param {Function} isOnTopBoundary 上边界检测函数
   * @param {Function} isOnBottomBoundary 下边界检测函数
   * @returns {Array<THREE.Vector3>|null} 闭合路径或null
   * @private
   */
  _createClosedPathWithBoundary(path1, path2, boundaryPath, 
    isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary) {
    
    if (path1.length < 2 || path2.length < 2) return null;
    
    // 获取路径的端点
    const startPt1 = path1[0];
    const endPt1 = path1[path1.length - 1];
    const startPt2 = path2[0];
    const endPt2 = path2[path2.length - 1];
    
    // 创建一个包含所有边界点的新路径
    const newPath = [...path1];
    
    // 从 path1 的终点连接到 path2 的起点
    if (!this._pointsAreClose(endPt1, startPt2)) {
      // 确定 endPt1 和 startPt2 所在边界
      const boundary1 = this._getBoundarySegment(endPt1, boundaryPath, 
        isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary);
        
      const boundary2 = this._getBoundarySegment(startPt2, boundaryPath, 
        isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary);
      
      if (boundary1 !== -1 && boundary2 !== -1) {
        // 添加沿边界的路径
        const boundaryPoints = this._getBoundarySegmentPoints(
          endPt1, startPt2, boundaryPath, boundary1, boundary2
        );
        
        if (boundaryPoints.length) {
          newPath.push(...boundaryPoints);
        }
      }
    }
    
    // 添加 path2
    newPath.push(...path2);
    
    // 从 path2 的终点连接回 path1 的起点
    if (!this._pointsAreClose(endPt2, startPt1)) {
      // 确定 endPt2 和 startPt1 所在边界
      const boundary1 = this._getBoundarySegment(endPt2, boundaryPath, 
        isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary);
        
      const boundary2 = this._getBoundarySegment(startPt1, boundaryPath, 
        isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary);
      
      if (boundary1 !== -1 && boundary2 !== -1) {
        // 添加沿边界的路径
        const boundaryPoints = this._getBoundarySegmentPoints(
          endPt2, startPt1, boundaryPath, boundary1, boundary2
        );
        
        if (boundaryPoints.length) {
          newPath.push(...boundaryPoints);
        }
      }
    }
    
    return newPath;
  }
  
  /**
   * 检查两点是否足够接近
   * @param {THREE.Vector3} pt1 点1
   * @param {THREE.Vector3} pt2 点2
   * @returns {boolean} 是否接近
   * @private
   */
  _pointsAreClose(pt1, pt2) {
    return Math.abs(pt1.x - pt2.x) < 0.01 && 
           Math.abs(pt1.y - pt2.y) < 0.01;
  }
  
  /**
   * 获取点所在边界段索引
   * @param {THREE.Vector3} pt 点
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @param {Function} isOnLeftBoundary 左边界检测函数
   * @param {Function} isOnRightBoundary 右边界检测函数
   * @param {Function} isOnTopBoundary 上边界检测函数
   * @param {Function} isOnBottomBoundary 下边界检测函数
   * @returns {number} 边界段索引 (0-3) 或 -1
   * @private
   */
  _getBoundarySegment(pt, boundaryPath, 
    isOnLeftBoundary, isOnRightBoundary, isOnTopBoundary, isOnBottomBoundary) {
    
    if (isOnTopBoundary(pt)) {
      if (isOnLeftBoundary(pt)) return 0; // 左上角
      if (isOnRightBoundary(pt)) return 1; // 右上角
      return 0; // 上边
    }
    
    if (isOnBottomBoundary(pt)) {
      if (isOnLeftBoundary(pt)) return 3; // 左下角
      if (isOnRightBoundary(pt)) return 2; // 右下角
      return 2; // 下边
    }
    
    if (isOnLeftBoundary(pt)) return 3; // 左边
    if (isOnRightBoundary(pt)) return 1; // 右边
    
    return -1; // 不在边界上
  }
  
  /**
   * 获取边界段上的点
   * @param {THREE.Vector3} start 起点
   * @param {THREE.Vector3} end 终点
   * @param {Array<THREE.Vector3>} boundaryPath 边界路径
   * @param {number} startSeg 起点所在边界段
   * @param {number} endSeg 终点所在边界段
   * @returns {Array<THREE.Vector3>} 边界段上的点
   * @private
   */
  _getBoundarySegmentPoints(start, end, boundaryPath, startSeg, endSeg) {
    const points = [];
    let currentSeg = startSeg;
    
    // 沿着边界移动，添加角点
    while (currentSeg !== endSeg) {
      // 添加当前段的终点（即下一个角点）
      const nextCorner = (currentSeg + 1) % 4;
      points.push(boundaryPath[nextCorner].clone());
      currentSeg = nextCorner;
    }
    
    return points;
  }

  /**
   * 获取路径的边界框
   * @param {Array<THREE.Vector3>} path 路径
   * @returns {{minX: number, minY: number, maxX: number, maxY: number}} 边界框
   * @private
   */
  _getPathBoundingBox(path) {
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    
    for (const point of path) {
      minX = Math.min(minX, point.x);
      minY = Math.min(minY, point.y);
      maxX = Math.max(maxX, point.x);
      maxY = Math.max(maxY, point.y);
    }
    
    return { minX, minY, maxX, maxY };
  }

  /**
   * 通过在路径点之间插值来增加点密度
   * @param {Array<THREE.Vector3>} path 原始路径
   * @param {number} density 每两点之间插入的点数
   * @returns {Array<THREE.Vector3>} 增密后的路径
   * @private
   */
  _interpolatePath(path, density) {
    if (path.length < 2) return path;
    
    const result = [];
    
    // 复制第一个点
    result.push(path[0].clone());
    
    // 在每两点之间插入额外的点
    for (let i = 1; i < path.length; i++) {
      const prev = path[i - 1];
      const curr = path[i];
      
      // 插入插值点
      for (let j = 1; j <= density; j++) {
        const t = j / (density + 1);
        const x = prev.x + (curr.x - prev.x) * t;
        const y = prev.y + (curr.y - prev.y) * t;
        const z = prev.z + (curr.z - prev.z) * t;
        
        result.push(new THREE.Vector3(x, y, z));
      }
      
      // 添加当前点
      result.push(curr.clone());
    }
    
    return result;
  }
  
  /**
   * 获取给定位置的数据值
   * @param {THREE.Vector3} position 位置
   * @returns {number} 数据值
   * @private
   */
  _getValueAtPosition(position) {
    // 转换为数据索引
    const i = Math.floor(position.y);
    const j = Math.floor(position.x);
    
    // 确保索引在有效范围内
    if (i < 0 || i >= this.data.length - 1 || j < 0 || j >= this.data[0].length - 1) {
      return 0;
    }
    
    // 计算小数部分
    const fi = position.y - i;
    const fj = position.x - j;
    
    // 双线性插值
    const v00 = this.data[i][j];
    const v01 = this.data[i][j + 1];
    const v10 = this.data[i + 1][j];
    const v11 = this.data[i + 1][j + 1];
    
    // 先在x方向插值
    const v0 = v00 * (1 - fj) + v01 * fj;
    const v1 = v10 * (1 - fj) + v11 * fj;
    
    // 然后在y方向插值
    return v0 * (1 - fi) + v1 * fi;
  }

  /**
   * 创建热图
   * @private
   */
  _createHeatmap() {
    const rows = this.data.length;
    const cols = this.data[0].length;
    
    // 创建带更高分辨率的热图几何体，使用2倍的分辨率来获得更平滑的效果
    const segmentsX = (cols - 1) * 2;
    const segmentsY = (rows - 1) * 2;
    const geometry = new THREE.PlaneGeometry(cols - 1, rows - 1, segmentsX, segmentsY);
    
    // 获取顶点位置
    const positions = geometry.attributes.position.array;
    
    // 创建顶点颜色数组
    const colors = [];
    
    // 为每个顶点设置颜色，使用插值获得数据值
    for (let i = 0; i <= segmentsY; i++) {
      for (let j = 0; j <= segmentsX; j++) {
        const idx = (i * (segmentsX + 1) + j) * 3;
        
        // 顶点在网格中的位置
        const x = positions[idx];
        const y = positions[idx + 1];
        
        // 转换到数据坐标系
        const dataX = x + (cols - 1) / 2 + 0.5;
        const dataY = y + (rows - 1) / 2 + 0.5;
        
        // 获取插值数据值
        const value = this._getInterpolatedValue(dataY, dataX);
        
        // 获取颜色
        const color = this.colorMap(value);
        colors.push(color.r, color.g, color.b);
      }
    }
    
    // 设置顶点颜色
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    
    // 创建材质
    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      opacity: this.dataOptions.opacity,
      transparent: this.dataOptions.opacity < 1,
      side: THREE.DoubleSide
    });
    
    // 创建网格
    const mesh = new THREE.Mesh(geometry, material);
    
    // 调整位置
    mesh.position.set(cols / 2 - 0.5, rows / 2 - 0.5, -0.01);
    
    this.contourGroup.add(mesh);
  }
  
  /**
   * 获取插值数据值
   * @param {number} y 行坐标（非整数）
   * @param {number} x 列坐标（非整数）
   * @returns {number} 插值数据值
   * @private
   */
  _getInterpolatedValue(y, x) {
    const rows = this.data.length;
    const cols = this.data[0].length;
    
    // 边界检查
    if (x < 0) x = 0;
    if (x > cols - 1) x = cols - 1;
    if (y < 0) y = 0;
    if (y > rows - 1) y = rows - 1;
    
    // 计算索引
    const i0 = Math.floor(y);
    const j0 = Math.floor(x);
    const i1 = Math.min(i0 + 1, rows - 1);
    const j1 = Math.min(j0 + 1, cols - 1);
    
    // 计算插值权重
    const fy = y - i0;
    const fx = x - j0;
    
    // 获取四个角的值
    const v00 = this.data[i0][j0];
    const v01 = this.data[i0][j1];
    const v10 = this.data[i1][j0];
    const v11 = this.data[i1][j1];
    
    // 双线性插值
    const v0 = v00 * (1 - fx) + v01 * fx;
    const v1 = v10 * (1 - fx) + v11 * fx;
    
    return v0 * (1 - fy) + v1 * fy;
  }

  /**
   * 调整相机以适应等值线
   * @private
   */
  _adjustCamera() {
    const rows = this.data.length;
    const cols = this.data[0].length;
    
    // 计算合适的相机参数
    const aspect = this.options.width / this.options.height;
    const size = Math.max(cols, rows / aspect);
    
    this.camera.left = -size / 2;
    this.camera.right = size / 2;
    this.camera.top = size / aspect / 2;
    this.camera.bottom = -size / aspect / 2;
    this.camera.updateProjectionMatrix();
    
    // 调整相机位置
    this.camera.position.set(cols / 2 - 0.5, rows / 2 - 0.5, 5);
    this.camera.lookAt(cols / 2 - 0.5, rows / 2 - 0.5, 0);
  }

  /**
   * 渲染场景
   */
  render() {
    this.renderer.render(this.scene, this.camera);
  }

  /**
   * 获取渲染器的DOM元素
   * @returns {HTMLElement} 渲染器的DOM元素
   */
  getDomElement() {
    return this.renderer.domElement;
  }

  /**
   * 调整大小
   * @param {number} width 宽度
   * @param {number} height 高度
   */
  resize(width, height) {
    this.options.width = width;
    this.options.height = height;
    
    this.renderer.setSize(width, height);
    
    // 重新调整相机
    this._adjustCamera();
  }

  /**
   * 销毁实例
   */
  dispose() {
    this._clearContours();
    
    this.renderer.dispose();
    
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.contourGroup = null;
    this.colorMap = null;
    this.data = null;
  }

  /**
   * 检查两个边界框是否重叠
   * @param {Object} bbox1 第一个边界框
   * @param {Object} bbox2 第二个边界框
   * @returns {boolean} 是否重叠
   * @private
   */
  _doBoundingBoxesOverlap(bbox1, bbox2) {
    return (
      bbox1.minX <= bbox2.maxX &&
      bbox1.maxX >= bbox2.minX &&
      bbox1.minY <= bbox2.maxY &&
      bbox1.maxY >= bbox2.minY
    );
  }
  
  /**
   * 计算两个边界框的重叠区域
   * @param {Object} bbox1 第一个边界框
   * @param {Object} bbox2 第二个边界框
   * @returns {number} 重叠区域面积
   * @private
   */
  _calculateOverlapArea(bbox1, bbox2) {
    const xOverlap = Math.max(0, 
      Math.min(bbox1.maxX, bbox2.maxX) - Math.max(bbox1.minX, bbox2.minX)
    );
    const yOverlap = Math.max(0, 
      Math.min(bbox1.maxY, bbox2.maxY) - Math.max(bbox1.minY, bbox2.minY)
    );
    return xOverlap * yOverlap;
  }
  
  /**
   * 计算两个边界框之间的最短距离
   * @param {Object} bbox1 第一个边界框
   * @param {Object} bbox2 第二个边界框
   * @returns {number} 最短距离
   * @private
   */
  _calculateBoundingBoxDistance(bbox1, bbox2) {
    const dx = Math.max(0, 
      Math.max(bbox1.minX, bbox2.minX) - Math.min(bbox1.maxX, bbox2.maxX)
    );
    const dy = Math.max(0, 
      Math.max(bbox1.minY, bbox2.minY) - Math.min(bbox1.maxY, bbox2.maxY)
    );
    return Math.sqrt(dx * dx + dy * dy);
  }
  
  /**
   * 计算路径的面积（用于判断路径的顺逆时针方向）
   * @param {Array<THREE.Vector3>} path 路径
   * @returns {number} 面积（正值表示逆时针，负值表示顺时针）
   * @private
   */
  _calculatePathArea(path) {
    if (!path || path.length < 3) return 0;
    
    let area = 0;
    const len = path.length;
    
    try {
      for (let i = 0; i < len; i++) {
        const j = (i + 1) % len;
        
        // 检查坐标是否有效
        if (isNaN(path[i].x) || isNaN(path[i].y) || 
            isNaN(path[j].x) || isNaN(path[j].y) ||
            !isFinite(path[i].x) || !isFinite(path[i].y) ||
            !isFinite(path[j].x) || !isFinite(path[j].y)) {
          continue;
        }
        
        area += path[i].x * path[j].y;
        area -= path[j].x * path[i].y;
      }
      
      return area / 2;
    } catch (e) {
      console.error('计算路径面积时发生错误', e);
      return 0;
    }
  }
  
  /**
   * 为两条路径创建填充几何体
   * @param {Array<THREE.Vector3>} path1 第一条路径
   * @param {Array<THREE.Vector3>} path2 第二条路径
   * @returns {THREE.BufferGeometry|null} 填充几何体
   * @private
   */
  _createSingleFillGeometry(path1, path2) {
    try {
      // 确保路径有足够的点
      if (path1.length < 3 || path2.length < 3) {
        return null;
      }
      
      // 过滤非法坐标值
      path1 = path1.filter(pt => !isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z) && 
                                isFinite(pt.x) && isFinite(pt.y) && isFinite(pt.z));
      path2 = path2.filter(pt => !isNaN(pt.x) && !isNaN(pt.y) && !isNaN(pt.z) && 
                                isFinite(pt.x) && isFinite(pt.y) && isFinite(pt.z));
      
      // 再次检查过滤后的路径长度
      if (path1.length < 3 || path2.length < 3) {
        return null;
      }
      
      // 确保路径方向的一致性（对于整齐的填充条带非常重要）
      const path1Area = this._calculatePathArea(path1);
      const path2Area = this._calculatePathArea(path2);
      
      // 检查面积计算结果是否有效
      if (isNaN(path1Area) || isNaN(path2Area) || !isFinite(path1Area) || !isFinite(path2Area)) {
        return null;
      }
      
      // 我们希望所有路径方向一致（均为顺时针或均为逆时针）
      // 这样能确保填充后的条带有统一的方向
      const shouldBeClockwise = this.dataOptions.useRealValue;
      
      // 根据需要调整路径方向
      const path1IsClockwise = path1Area < 0; // 面积为负表示顺时针
      const path2IsClockwise = path2Area < 0;
      
      const finalPath1 = (path1IsClockwise !== shouldBeClockwise) ? 
        path1.slice().reverse() : path1.slice();
      const finalPath2 = (path2IsClockwise !== shouldBeClockwise) ? 
        path2.slice().reverse() : path2.slice();
      
      // 创建几何体
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      
      // 获取等值线级别
      const level1 = this._getValueAtPosition(finalPath1[0]);
      const level2 = this._getValueAtPosition(finalPath2[0]);
      
      // 确保级别值有效
      if (isNaN(level1) || isNaN(level2) || !isFinite(level1) || !isFinite(level2)) {
        return null;
      }
      
      // 添加第一条路径的顶点
      for (const point of finalPath1) {
        vertices.push(point.x, point.y, point.z);
      }
      
      // 计算第一条路径的长度
      const path1Length = finalPath1.length;
      
      // 添加第二条路径的顶点
      for (const point of finalPath2) {
        vertices.push(point.x, point.y, point.z);
      }
      
      // 检查顶点数组中是否有NaN值
      for (let i = 0; i < vertices.length; i++) {
        if (isNaN(vertices[i]) || !isFinite(vertices[i])) {
          console.warn('发现NaN或无穷大的顶点坐标，跳过创建几何体');
          return null;
        }
      }
      
      // 创建索引 - 使用改进的三角剖分算法
      const indices = [];
      const p1len = finalPath1.length;
      const p2len = finalPath2.length;
      
      // 确保路径长度合理
      if (p1len < 3 || p2len < 3) {
        return null;
      }
      
      // 构建三角形带 - 使用动态采样确保更均匀的三角形
      // 计算两条路径间的映射关系
      const ratio = (p2len - 1) / (p1len - 1);
      
      for (let i = 0; i < p1len - 1; i++) {
        const i1 = i;
        const i2 = i + 1;
        
        // 计算对应的第二条路径上的点
        const j1 = Math.floor(i * ratio);
        const j2 = Math.floor((i + 1) * ratio);
        
        // 添加四边形 (两个三角形)
        indices.push(i1, p1len + j1, i2);
        
        if (j1 !== j2) {
          indices.push(i2, p1len + j1, p1len + j2);
        }
      }
      
      // 闭合回路
      if (this._isClosedPath(finalPath1) && this._isClosedPath(finalPath2)) {
        // 如果两条路径都是闭合的，连接最后一个点和第一个点
        indices.push(p1len - 1, p1len + p2len - 1, 0);
        indices.push(0, p1len + p2len - 1, p1len);
      }
      
      // 设置顶点属性
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      // 设置索引
      if (indices.length > 0) {
        geometry.setIndex(indices);
      } else {
        return null;
      }
      
      // 计算法线
      try {
        geometry.computeVertexNormals();
      } catch (e) {
        console.warn('计算顶点法线失败', e);
      }
      
      return geometry;
    } catch (e) {
      console.error('创建填充几何体时发生错误', e);
      return null;
    }
  }
  
  /**
   * 计算路径的中点
   * @param {Array<THREE.Vector3>} path 路径
   * @returns {THREE.Vector3} 中点
   * @private
   */
  _calculatePathMidPoint(path) {
    if (!path || path.length === 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    let sumX = 0, sumY = 0, sumZ = 0;
    let validPoints = 0;
    
    for (const point of path) {
      if (!isNaN(point.x) && !isNaN(point.y) && !isNaN(point.z) &&
          isFinite(point.x) && isFinite(point.y) && isFinite(point.z)) {
        sumX += point.x;
        sumY += point.y;
        sumZ += point.z;
        validPoints++;
      }
    }
    
    if (validPoints === 0) {
      return new THREE.Vector3(0, 0, 0);
    }
    
    return new THREE.Vector3(
      sumX / validPoints,
      sumY / validPoints,
      sumZ / validPoints
    );
  }

  /**
   * 将所有路径拼接成一个完整路径
   * 移植自 Plotly.js 的 joinAllPaths 函数
   * @param {Object} pi 路径信息对象，包含 edgepaths 和 paths
   * @param {Array<THREE.Vector3>} perimeter 边界点数组
   * @returns {Array<THREE.Vector3>} 拼接后的完整路径
   * @private
   */
  _joinAllPaths(pi, perimeter) {
    const fullpath = [];
    let i = 0;
    let startsleft = pi.edgepaths.map((_, i) => i);
    let newloop = true;
    let endpt, newendpt, nexti;
    
    // 判断点是否在边界上的辅助函数
    const epsilon = 0.01;
    const istop = (pt) => Math.abs(pt.y - perimeter[0].y) < epsilon;
    const isbottom = (pt) => Math.abs(pt.y - perimeter[2].y) < epsilon;
    const isleft = (pt) => Math.abs(pt.x - perimeter[0].x) < epsilon;
    const isright = (pt) => Math.abs(pt.x - perimeter[2].x) < epsilon;
    
    // 拼接所有 edgepaths（开口线）
    while (startsleft.length) {
      // 添加当前路径
      const currentPath = pi.edgepaths[i];
      if (newloop) {
        // 新的循环，直接添加整个路径
        fullpath.push(...currentPath);
      } else {
        // 继续现有循环，添加除第一点外的所有点（避免重复）
        fullpath.push(...currentPath.slice(1));
      }
      
      // 从待处理列表中移除当前路径
      startsleft.splice(startsleft.indexOf(i), 1);
      
      // 获取当前路径的终点
      endpt = currentPath[currentPath.length - 1];
      nexti = -1;
      
      // 沿着边界移动，直到找到下一条路径的起点
      for (let cnt = 0; cnt < 4; cnt++) { // 防止无限循环
        if (!endpt) break;
        
        // 根据终点位置确定下一个边界点
        if (istop(endpt) && !isright(endpt)) newendpt = perimeter[1]; // 右上
        else if (isleft(endpt)) newendpt = perimeter[0]; // 左上
        else if (isbottom(endpt)) newendpt = perimeter[3]; // 右下
        else if (isright(endpt)) newendpt = perimeter[2]; // 左下
        else break; // 不在边界上
        
        // 查找所有可能的下一条路径
        for (let possiblei = 0; possiblei < pi.edgepaths.length; possiblei++) {
          const ptNew = pi.edgepaths[possiblei][0];
          
          // 检查是否在同一水平或垂直线上
          if (Math.abs(endpt.x - newendpt.x) < epsilon) {
            if (Math.abs(endpt.x - ptNew.x) < epsilon &&
                (ptNew.y - endpt.y) * (newendpt.y - ptNew.y) >= 0) {
              newendpt = ptNew;
              nexti = possiblei;
            }
          } else if (Math.abs(endpt.y - newendpt.y) < epsilon) {
            if (Math.abs(endpt.y - ptNew.y) < epsilon &&
                (ptNew.x - endpt.x) * (newendpt.x - ptNew.x) >= 0) {
              newendpt = ptNew;
              nexti = possiblei;
            }
          }
        }
        
        endpt = newendpt;
        
        if (nexti >= 0) break;
        
        // 添加边界点
        fullpath.push(newendpt);
      }
      
      // 确定下一条路径
      i = nexti;
      
      // 如果闭合或没有下一条路径，开始新的循环
      newloop = (nexti < 0 || startsleft.indexOf(i) === -1);
      if (newloop && startsleft.length) {
        i = startsleft[0];
      }
    }
    
    // 添加所有闭合路径
    for (i = 0; i < pi.paths.length; i++) {
      fullpath.push(...pi.paths[i]);
    }
    
    return fullpath;
  }
  
  /**
   * 获取等值线和等值面的几何数据
   * @param {Object} options 选项
   * @returns {Object} 几何数据
   */
  getContourGeometryData(options = {}) {
    const { start, end, size } = this.dataOptions;
    
    // 计算等值线级别
    const levels = [];
    for (let level = start; level <= end; level += size) {
      levels.push(level);
    }
    
    // 为所有级别计算等值线
    const result = {};
    for (const level of levels) {
      const paths = this._marchingSquares(this.data, level);
      
      // 分离开口线和闭合线
      const edgepaths = paths.filter(path => !this._isClosedPath(path));
      const closedpaths = paths.filter(path => this._isClosedPath(path));
      
      // 创建类似 Plotly 的 pathinfo 对象
      const pathinfo = {
        level,
        edgepaths,
        paths: closedpaths
      };
      
      // 检查是否需要添加边界
      pathinfo.prefixBoundary = this._needsBoundaryPrefix(level);
      
      // 创建边界
      const boundaryPath = this._createBoundaryPath();
      
      // 使用 joinAllPaths 获取完整的填充路径
      const fullpath = this._joinAllPaths(pathinfo, boundaryPath);
      
      result[level] = {
        level,
        edgepaths,
        paths: closedpaths,
        fullpath: fullpath,
        prefixBoundary: pathinfo.prefixBoundary
      };
    }
    
    return result;
  }
}

// 创建自己的合并几何体函数，因为BufferGeometryUtils.mergeBufferGeometries已被移除
function mergeGeometries(geometries) {
  // 过滤掉无效的几何体
  geometries = geometries.filter(geom => {
    if (!geom || !geom.attributes.position) return false;
    
    // 检查位置属性中是否有无效值
    const positions = geom.attributes.position.array;
    for (let i = 0; i < positions.length; i++) {
      if (isNaN(positions[i]) || !isFinite(positions[i])) {
        console.warn('几何体包含NaN或无穷大的位置值，已忽略此几何体');
        return false;
      }
    }
    
    return true;
  });
  
  // 如果没有几何体，返回null
  if (geometries.length === 0) {
    return null;
  }
  
  // 如果只有一个几何体，直接返回
  if (geometries.length === 1) {
    return geometries[0];
  }
  
  try {
    // 创建合并后的几何体
    const mergedGeometry = new THREE.BufferGeometry();
    
    // 计算顶点、颜色和索引的总数
    let vertexCount = 0;
    let indexCount = 0;
    let hasColors = false;
    
    for (const geometry of geometries) {
      vertexCount += geometry.attributes.position.count;
      if (geometry.index) {
        indexCount += geometry.index.count;
      }
      
      if (geometry.attributes.color) {
        hasColors = true;
      }
    }
    
    // 创建合并后的属性数组
    const positions = new Float32Array(vertexCount * 3);
    const colors = hasColors ? new Float32Array(vertexCount * 3) : null;
    const indices = indexCount > 0 ? new Uint32Array(indexCount) : null;
    
    // 合并几何体
    let vertexOffset = 0;
    let indexOffset = 0;
    
    for (const geometry of geometries) {
      // 复制顶点位置
      const positionAttribute = geometry.attributes.position;
      const posCount = positionAttribute.count;
      
      for (let i = 0; i < posCount; i++) {
        const x = positionAttribute.getX(i);
        const y = positionAttribute.getY(i);
        const z = positionAttribute.getZ(i);
        
        // 额外验证，确保不会复制NaN或无穷大的值
        if (isNaN(x) || isNaN(y) || isNaN(z) || 
            !isFinite(x) || !isFinite(y) || !isFinite(z)) {
          continue;
        }
        
        positions[vertexOffset * 3] = x;
        positions[vertexOffset * 3 + 1] = y;
        positions[vertexOffset * 3 + 2] = z;
        vertexOffset++;
      }
      
      // 复制顶点颜色
      if (colors && geometry.attributes.color) {
        const colorAttribute = geometry.attributes.color;
        const offset = vertexOffset - posCount;
        
        for (let i = 0; i < posCount; i++) {
          colors[offset * 3 + i * 3] = colorAttribute.getX(i);
          colors[offset * 3 + i * 3 + 1] = colorAttribute.getY(i);
          colors[offset * 3 + i * 3 + 2] = colorAttribute.getZ(i);
        }
      } else if (colors) {
        // 如果该几何体没有颜色，使用默认颜色
        const offset = vertexOffset - posCount;
        for (let i = 0; i < posCount; i++) {
          colors[offset * 3 + i * 3] = 1;
          colors[offset * 3 + i * 3 + 1] = 1;
          colors[offset * 3 + i * 3 + 2] = 1;
        }
      }
      
      // 复制索引
      if (indices && geometry.index) {
        const indexAttribute = geometry.index;
        const vertexShift = vertexOffset - posCount;
        
        for (let i = 0; i < indexAttribute.count; i++) {
          indices[indexOffset++] = indexAttribute.getX(i) + vertexShift;
        }
      }
    }
    
    // 最终验证：检查是否有足够的有效顶点
    if (vertexOffset < 3) {
      console.warn('合并后的几何体顶点数不足，无法创建有效网格');
      return null;
    }
    
    // 如果因为过滤掉NaN值而导致顶点数减少，则需要调整数组大小
    let validPositions = positions;
    let validColors = colors;
    
    if (vertexOffset * 3 < positions.length) {
      validPositions = new Float32Array(vertexOffset * 3);
      for (let i = 0; i < vertexOffset * 3; i++) {
        validPositions[i] = positions[i];
      }
      
      if (colors) {
        validColors = new Float32Array(vertexOffset * 3);
        for (let i = 0; i < vertexOffset * 3; i++) {
          validColors[i] = colors[i];
        }
      }
    }
    
    // 设置合并后的几何体属性
    mergedGeometry.setAttribute('position', new THREE.BufferAttribute(validPositions, 3));
    
    if (validColors) {
      mergedGeometry.setAttribute('color', new THREE.BufferAttribute(validColors, 3));
    }
    
    if (indices && indexOffset > 0) {
      mergedGeometry.setIndex(new THREE.BufferAttribute(indices, 1));
    }
    
    // 计算法线
    try {
      mergedGeometry.computeVertexNormals();
    } catch (e) {
      console.warn('计算顶点法线失败', e);
    }
    
    return mergedGeometry;
  } catch (e) {
    console.error('合并几何体时发生错误', e);
    return null;
  }
}

// 导出模块
export default ThreeContour;
