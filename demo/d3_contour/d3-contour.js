// https://d3js.org/d3-contour/ v4.0.2 Copyright 2012-2023 Mike Bostock
(function (global, factory) {
typeof exports === 'object' && typeof module !== 'undefined' ? factory(exports, require('d3-array')) :
typeof define === 'function' && define.amd ? define(['exports', 'd3-array'], factory) :
(global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.d3 = global.d3 || {}, global.d3));
})(this, (function (exports, d3Array) { 'use strict';

var array = Array.prototype;

var slice = array.slice;

function ascending(a, b) {
  return a - b;
}

function area(ring) {
  var i = 0, n = ring.length, area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1];
  while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1];
  return area;
}

var constant = x => () => x;

function contains(ring, hole) {
  var i = -1, n = hole.length, c;
  while (++i < n) if (c = ringContains(ring, hole[i])) return c;
  return 0;
}

function ringContains(ring, point) {
  var x = point[0], y = point[1], contains = -1;
  for (var i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
    var pi = ring[i], xi = pi[0], yi = pi[1], pj = ring[j], xj = pj[0], yj = pj[1];
    if (segmentContains(pi, pj, point)) return 0;
    if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) contains = -contains;
  }
  return contains;
}

function segmentContains(a, b, c) {
  var i; return collinear(a, b, c) && within(a[i = +(a[0] === b[0])], c[i], b[i]);
}

function collinear(a, b, c) {
  return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1]);
}

function within(p, q, r) {
  return p <= q && q <= r || r <= q && q <= p;
}

function noop() {}

// 添加缺失值填充函数
function fillNaN(values, width, height, maxIterations = 100, tolerance = 1e-4) {
  // 创建数组副本
  const result = values.slice();
  const mask = new Array(result.length);
  
  // 标记缺失值位置
  for (let i = 0; i < result.length; i++) {
    if (result[i] == null || isNaN(result[i])) {
      mask[i] = 1;
      result[i] = 0; // 初始化为0
    } else {
      mask[i] = 0;
    }
  }
  
  // 检查是否有缺失值
  if (!mask.some(m => m === 1)) return result;
  
  // 泊松方程迭代求解
  for (let iter = 0; iter < maxIterations; iter++) {
    let maxChange = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const i = y * width + x;
        
        // 只处理缺失值
        if (mask[i] === 1) {
          let sum = 0;
          let count = 0;
          
          // 上下左右四个方向
          if (y > 0) {
            sum += result[i - width];
            count++;
          }
          if (y < height - 1) {
            sum += result[i + width];
            count++;
          }
          if (x > 0) {
            sum += result[i - 1];
            count++;
          }
          if (x < width - 1) {
            sum += result[i + 1];
            count++;
          }
          
          // 更新缺失值
          if (count > 0) {
            const newValue = sum / count;
            const change = Math.abs(result[i] - newValue);
            result[i] = newValue;
            maxChange = Math.max(maxChange, change);
          }
        }
      }
    }
    
    // 收敛检查
    if (maxChange < tolerance) break;
  }
  
  return result;
}

var cases = [
  [],
  [[[1.0, 1.5], [0.5, 1.0]]],
  [[[1.5, 1.0], [1.0, 1.5]]],
  [[[1.5, 1.0], [0.5, 1.0]]],
  [[[1.0, 0.5], [1.5, 1.0]]],
  [[[1.0, 1.5], [0.5, 1.0]], [[1.0, 0.5], [1.5, 1.0]]],
  [[[1.0, 0.5], [1.0, 1.5]]],
  [[[1.0, 0.5], [0.5, 1.0]]],
  [[[0.5, 1.0], [1.0, 0.5]]],
  [[[1.0, 1.5], [1.0, 0.5]]],
  [[[0.5, 1.0], [1.0, 0.5]], [[1.5, 1.0], [1.0, 1.5]]],
  [[[1.5, 1.0], [1.0, 0.5]]],
  [[[0.5, 1.0], [1.5, 1.0]]],
  [[[1.0, 1.5], [1.5, 1.0]]],
  [[[0.5, 1.0], [1.0, 1.5]]],
  []
];

function Contours() {
  var dx = 1,
      dy = 1,
      threshold = d3Array.thresholdSturges,
      smooth = smoothLinear,
      connectGaps = false, // 新增参数控制是否填充缺失值
      smoothTension = 0.5; // 新增参数控制曲线平滑度

  function contours(values) {
    // 处理缺失值
    let processedValues = values;
    if (connectGaps) {
      processedValues = fillNaN(values, dx, dy);
    }
  
    var tz = threshold(processedValues);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      const e = d3Array.extent(processedValues, finite);
      tz = d3Array.ticks(...d3Array.nice(e[0], e[1], tz), tz);
      while (tz[tz.length - 1] >= e[1]) tz.pop();
      while (tz[1] < e[0]) tz.shift();
    } else {
      tz = tz.slice().sort(ascending);
    }

    return tz.map(value => contour(processedValues, value));
  }

  // Accumulate, smooth contour rings, assign holes to exterior rings.
  // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
  function contour(values, value) {
    const v = value == null ? NaN : +value;
    if (isNaN(v)) throw new Error(`invalid value: ${value}`);

    var polygons = [],
        holes = [];

    isorings(values, v, function(ring) {
      if (smooth === smoothSpline) {
        smooth(ring, values, v, smoothTension);
      } else {
        smooth(ring, values, v);
      }
      if (area(ring) > 0) polygons.push([ring]);
      else holes.push(ring);
    });

    holes.forEach(function(hole) {
      for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
        if (contains((polygon = polygons[i])[0], hole) !== -1) {
          polygon.push(hole);
          return;
        }
      }
    });

    return {
      type: "MultiPolygon",
      value: value,
      coordinates: polygons
    };
  }

  // Marching squares with isolines stitched into rings.
  // Based on https://github.com/topojson/topojson-client/blob/v3.0.0/src/stitch.js
  function isorings(values, value, callback) {
    var fragmentByStart = new Array,
        fragmentByEnd = new Array,
        x, y, t0, t1, t2, t3;

    // Special case for the first row (y = -1, t2 = t3 = 0).
    x = y = -1;
    t1 = above(values[0], value);
    cases[t1 << 1].forEach(stitch);
    while (++x < dx - 1) {
      t0 = t1, t1 = above(values[x + 1], value);
      cases[t0 | t1 << 1].forEach(stitch);
    }
    cases[t1 << 0].forEach(stitch);

    // General case for the intermediate rows.
    while (++y < dy - 1) {
      x = -1;
      t1 = above(values[y * dx + dx], value);
      t2 = above(values[y * dx], value);
      cases[t1 << 1 | t2 << 2].forEach(stitch);
      while (++x < dx - 1) {
        t0 = t1, t1 = above(values[y * dx + dx + x + 1], value);
        t3 = t2, t2 = above(values[y * dx + x + 1], value);
        cases[t0 | t1 << 1 | t2 << 2 | t3 << 3].forEach(stitch);
      }
      cases[t1 | t2 << 3].forEach(stitch);
    }

    // Special case for the last row (y = dy - 1, t0 = t1 = 0).
    x = -1;
    t2 = values[y * dx] >= value;
    cases[t2 << 2].forEach(stitch);
    while (++x < dx - 1) {
      t3 = t2, t2 = above(values[y * dx + x + 1], value);
      cases[t2 << 2 | t3 << 3].forEach(stitch);
    }
    cases[t2 << 3].forEach(stitch);

    function stitch(line) {
      var start = [line[0][0] + x, line[0][1] + y],
          end = [line[1][0] + x, line[1][1] + y],
          startIndex = index(start),
          endIndex = index(end),
          f, g;
      if (f = fragmentByEnd[startIndex]) {
        if (g = fragmentByStart[endIndex]) {
          delete fragmentByEnd[f.end];
          delete fragmentByStart[g.start];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[f.start] = fragmentByEnd[g.end] = {start: f.start, end: g.end, ring: f.ring.concat(g.ring)};
          }
        } else {
          delete fragmentByEnd[f.end];
          f.ring.push(end);
          fragmentByEnd[f.end = endIndex] = f;
        }
      } else if (f = fragmentByStart[endIndex]) {
        if (g = fragmentByEnd[startIndex]) {
          delete fragmentByStart[f.start];
          delete fragmentByEnd[g.end];
          if (f === g) {
            f.ring.push(end);
            callback(f.ring);
          } else {
            fragmentByStart[g.start] = fragmentByEnd[f.end] = {start: g.start, end: f.end, ring: g.ring.concat(f.ring)};
          }
        } else {
          delete fragmentByStart[f.start];
          f.ring.unshift(start);
          fragmentByStart[f.start = startIndex] = f;
        }
      } else {
        fragmentByStart[startIndex] = fragmentByEnd[endIndex] = {start: startIndex, end: endIndex, ring: [start, end]};
      }
    }
  }

  function index(point) {
    return point[0] * 2 + point[1] * (dx + 1) * 4;
  }

  function smoothLinear(ring, values, value) {
    ring.forEach(function(point) {
      var x = point[0],
          y = point[1],
          xt = x | 0,
          yt = y | 0,
          v1 = valid(values[yt * dx + xt]);
      if (x > 0 && x < dx && xt === x) {
        point[0] = smooth1(x, valid(values[yt * dx + xt - 1]), v1, value);
      }
      if (y > 0 && y < dy && yt === y) {
        point[1] = smooth1(y, valid(values[(yt - 1) * dx + xt]), v1, value);
      }
    });
  }


    /**
   * Applies smoothing to an iso-ring according to the Dual Marching Squares algorithm.
   * @param {[number, number][]} ring The sorted list of (x,y) coordinates of points for a given iso-ring.
   * @param {number[]} values The underlying grid values.
   * @param {number} value The iso-value for this iso-ring.
   */
    function smoothLinearDual(ring, values, value) {
      var point, x, y, x1, y1;
  
      // The first step in Dual Marching Squares smoothing is linear interpolation.
      smoothLinear(ring, values, value);
  
      for (var i = 0; i < ring.length; i++) {
        point = ring[i];
        x = point[0];
        y = point[1];
  
        if (i < ring.length - 1) {
          // Next point
          x1 = ring[i + 1][0];
          y1 = ring[i + 1][1];
  
          // Set the current point to the midpoint between it and the next point.
          point[0] = x + (x1 - x) / 2;
          point[1] = y + (y1 - y) / 2;
        } else  {
          // This is the last point, complete the ring by matching the first point
          point[0] = ring[0][0];
          point[1] = ring[0][1];
        }
      }
    }
  // 添加smoothBilinear
function smoothBilinear(ring, values, value) {
  ring.forEach(function(point) {
    var x = point[0],
        y = point[1],
        xt = Math.floor(x),
        yt = Math.floor(y),
        fx = x - xt,
        fy = y - yt;
        
    // 获取网格四个角点值(如果在边界内)
    if (x > 0 && x < dx-1 && y > 0 && y < dy-1) {
      // 获取四个角点值
      var v00 = valid(values[yt * dx + xt]),
          v10 = valid(values[yt * dx + xt + 1]),
          v01 = valid(values[(yt + 1) * dx + xt]),
          v11 = valid(values[(yt + 1) * dx + xt + 1]);
          
      // 水平方向插值
      var vx0 = v00 * (1 - fx) + v10 * fx,
          vx1 = v01 * (1 - fx) + v11 * fx;
          
      // 垂直方向插值
      var vxy = vx0 * (1 - fy) + vx1 * fy;
      
      // 计算梯度
      var gradX = (v10 - v00) * (1 - fy) + (v11 - v01) * fy,
          gradY = (v01 - v00) * (1 - fx) + (v11 - v10) * fx;
      
      // 如果插值结果接近目标值，不调整点位置
      if (Math.abs(vxy - value) < 1e-6) ; else {
        // 沿着梯度方向调整点位置
        var diff = value - vxy;
        var gradMag = Math.sqrt(gradX * gradX + gradY * gradY);
        
        // 防止除以零
        if (gradMag > 1e-10) {
          // 限制调整步长，以避免过度调整
          var maxStep = 0.5;
          var step = Math.min(Math.abs(diff) / gradMag, maxStep) * Math.sign(diff);
          
          // 沿梯度方向移动点
          point[0] += step * gradX / gradMag;
          point[1] += step * gradY / gradMag;
          
          // 确保点仍在网格单元内
          point[0] = Math.max(xt, Math.min(xt + 1, point[0]));
          point[1] = Math.max(yt, Math.min(yt + 1, point[1]));
        }
      }
    } else {
      // 边界点使用原始线性插值
      var v1 = valid(values[yt * dx + xt]);
      if (x > 0 && x < dx && xt === x) {
        point[0] = smooth1(x, valid(values[yt * dx + xt - 1]), v1, value);
      }
      if (y > 0 && y < dy && yt === y) {
        point[1] = smooth1(y, valid(values[(yt - 1) * dx + xt]), v1, value);
      }
    }
  });
}

// 删除现有的smoothSpline函数，用新的基于Catmull-Rom的实现替代
function smoothSpline(ring, values, value, tension = 0.5) {
  // 首先应用线性插值来获得准确的等值线位置
  smoothLinear(ring, values, value);
  
  // 如果点数太少，直接返回
  if (ring.length < 3) return;
  
  // 判断是否为闭合环（area不为0表示闭合环）
  const closed = area(ring) !== 0;
  
  // 创建点的副本，避免直接修改原始点
  const points = ring.map(p => [p[0], p[1]]);
  const n = points.length;
  
  // 计算所有点的切线向量（用于贝塞尔曲线控制点）
  const tangents = [];
  
  if (closed) {
    // 闭合曲线：首先计算最后一个点的切线（连接最后一点、第一点和第二点）
    tangents.push(calculateTangent(
      points[n-1], points[0], points[1], tension
    ));
    
    // 计算中间点的切线
    for (let i = 1; i < n; i++) {
      tangents.push(calculateTangent(
        points[i-1], points[i], points[(i+1) % n], tension
      ));
    }
  } else {
    // 开放曲线：对第一个点使用特殊处理
    tangents.push(calculateEndpointTangent(
      points[0], points[1], tension, true
    ));
    
    // 计算中间点的切线
    for (let i = 1; i < n-1; i++) {
      tangents.push(calculateTangent(
        points[i-1], points[i], points[i+1], tension
      ));
    }
    
    // 对最后一个点使用特殊处理
    tangents.push(calculateEndpointTangent(
      points[n-1], points[n-2], tension, false
    ));
  }
  
  // 创建新的平滑点集合
  const smoothedPoints = [];
  
  if (closed) {
    // 闭合曲线：使用三次贝塞尔曲线连接所有点
    for (let i = 0; i < n; i++) {
      const p0 = points[i];
      const p1 = points[(i+1) % n];
      const t0 = tangents[i];
      const t1 = tangents[(i+1) % n];
      
      // 添加当前点
      smoothedPoints.push([...p0]);
      
      // 添加两个控制点和下一个点的贝塞尔段
      const cp1 = [p0[0] + t0[1][0], p0[1] + t0[1][1]];
      const cp2 = [p1[0] - t1[0][0], p1[1] - t1[0][1]];
      
      // 只为非最后一点添加贝塞尔段（避免重复）
      if (i < n-1 || !closed) {
        addBezierSegment(smoothedPoints, cp1, cp2, p1);
      }
    }
    
    // 确保闭合
    if (closed) {
      smoothedPoints.push([...smoothedPoints[0]]);
    }
  } else {
    // 开放曲线：从第一个点开始
    smoothedPoints.push([...points[0]]);
    
    // 使用二次贝塞尔曲线连接第一个点和第二个点
    const cp1 = [
      points[0][0] + tangents[0][0],
      points[0][1] + tangents[0][1]
    ];
    addQuadraticSegment(smoothedPoints, cp1, points[1]);
    
    // 使用三次贝塞尔曲线连接中间点
    for (let i = 1; i < n-2; i++) {
      const p0 = points[i];
      const p1 = points[i+1];
      const t0 = tangents[i];
      const t1 = tangents[i+1];
      
      const cp1 = [p0[0] + t0[1][0], p0[1] + t0[1][1]];
      const cp2 = [p1[0] - t1[0][0], p1[1] - t1[0][1]];
      
      addBezierSegment(smoothedPoints, cp1, cp2, p1);
    }
    
    // 使用二次贝塞尔曲线连接最后两个点
    if (n > 2) {
      const pLast = points[n-1];
      const t = tangents[n-1];
      
      const cp = [
        pLast[0] - t[0],
        pLast[1] - t[1]
      ];
      addQuadraticSegment(smoothedPoints, cp, pLast);
    }
  }
  
  // 用平滑点替换原始点
  ring.length = 0;
  smoothedPoints.forEach(p => ring.push(p));
}

// 添加一个三次贝塞尔曲线段（控制点cp1、cp2和终点p1）
function addBezierSegment(points, cp1, cp2, p1) {
  // 分段数（越多越平滑，但点也越多）
  const segments = 4;
  
  for (let t = 1; t <= segments; t++) {
    const pct = t / segments;
    const x = cubicBezier(
      points[points.length-1][0], cp1[0], cp2[0], p1[0], pct
    );
    const y = cubicBezier(
      points[points.length-1][1], cp1[1], cp2[1], p1[1], pct
    );
    points.push([x, y]);
  }
}

// 添加一个二次贝塞尔曲线段（控制点cp和终点p1）
function addQuadraticSegment(points, cp, p1) {
  // 分段数
  const segments = 3;
  
  for (let t = 1; t <= segments; t++) {
    const pct = t / segments;
    const x = quadraticBezier(
      points[points.length-1][0], cp[0], p1[0], pct
    );
    const y = quadraticBezier(
      points[points.length-1][1], cp[1], p1[1], pct
    );
    points.push([x, y]);
  }
}

// 计算Catmull-Rom样条曲线的切线（返回前后两个控制点）
function calculateTangent(p0, p1, p2, tension) {
  // 计算方向向量
  const dx1 = p1[0] - p0[0];
  const dy1 = p1[1] - p0[1];
  const dx2 = p2[0] - p1[0];
  const dy2 = p2[1] - p1[1];
  
  // 计算分段长度（使用平方根的一半作为权重）
  const len1 = Math.sqrt(dx1*dx1 + dy1*dy1) / 2;
  const len2 = Math.sqrt(dx2*dx2 + dy2*dy2) / 2;
  
  // 应用Catmull-Rom公式计算切线
  // 使用张力参数调整平滑度
  const tension_factor = tension * 0.5;
  
  // 防止除以零
  if (len1 < 1e-10 || len2 < 1e-10) {
    return [[0, 0], [0, 0]];
  }
  
  // 计算标准化的切线向量
  const tx = (dx1/len1 + dx2/len2) * tension_factor;
  const ty = (dy1/len1 + dy2/len2) * tension_factor;
  
  // 返回前后两个控制点的相对位置
  return [
    [tx * len1, ty * len1],  // 用于p1的前控制点
    [tx * len2, ty * len2]   // 用于p1的后控制点
  ];
}

// 为开放曲线的端点计算切线
function calculateEndpointTangent(p, pOther, tension, isStart) {
  const dx = pOther[0] - p[0];
  const dy = pOther[1] - p[1];
  const len = Math.sqrt(dx*dx + dy*dy);
  
  if (len < 1e-10) return [0, 0];
  
  // 对端点使用较小的张力系数
  const tension_factor = tension * 0.3;
  
  // 标准化并缩放
  const tx = (dx / len) * tension_factor * len;
  const ty = (dy / len) * tension_factor * len;
  
  // 如果是起点，返回正向切线；如果是终点，返回负向切线
  return isStart ? [tx, ty] : [-tx, -ty];
}

// 三次贝塞尔曲线插值
function cubicBezier(p0, p1, p2, p3, t) {
  const t2 = t * t;
  const t3 = t2 * t;
  const mt = 1 - t;
  const mt2 = mt * mt;
  const mt3 = mt2 * mt;
  return p0 * mt3 + 3 * p1 * mt2 * t + 3 * p2 * mt * t2 + p3 * t3;
}

// 二次贝塞尔曲线插值
function quadraticBezier(p0, p1, p2, t) {
  const mt = 1 - t;
  return p0 * mt * mt + 2 * p1 * mt * t + p2 * t * t;
}

  contours.contour = contour;

  contours.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = Math.floor(_[0]), _1 = Math.floor(_[1]);
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, contours;
  };

  contours.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), contours) : threshold;
  };

  // contours.smooth = function(_) {
  //   return arguments.length ? (smooth = _ ? smoothLinear : noop, contours) : smooth === smoothLinear;
  // };

  // 修改contours.smooth方法
contours.smooth = function(_) {
  return arguments.length 
    ? (smooth = _ === true ? smoothLinear : 
               _ === "linearDual" ? smoothLinearDual : 
               _ === "bilinear" ? smoothBilinear : 
               _ === "spline" ? smoothSpline :
               _ === false ? noop : _, 
       contours) 
    : smooth === smoothLinear ? true : 
      smooth === smoothBilinear ? "bilinear" : 
      smooth === smoothLinearDual ? "linearDual" : 
      smooth === smoothSpline ? "spline" :
      false;
};

  // 添加connectGaps方法
  contours.connectGaps = function(_) {
    return arguments.length ? (connectGaps = !!_, contours) : connectGaps;
  };

  // 添加smoothTension方法
  contours.smoothTension = function(_) {
    return arguments.length ? (smoothTension = +_, contours) : smoothTension;
  };

  return contours;
}

// When computing the extent, ignore infinite values (as well as invalid ones).
function finite(x) {
  return isFinite(x) ? x : NaN;
}

// Is the (possibly invalid) x greater than or equal to the (known valid) value?
// Treat any invalid value as below negative infinity.
function above(x, value) {
  return x == null ? false : +x >= value;
}

// During smoothing, treat any invalid value as negative infinity.
function valid(v) {
  return v == null || isNaN(v = +v) ? -Infinity : v;
}

function smooth1(x, v0, v1, value) {
  const a = value - v0;
  const b = v1 - v0;
  const d = isFinite(a) || isFinite(b) ? a / b : Math.sign(a) / Math.sign(b);
  return isNaN(d) ? x : x + d - 0.5;
}

function defaultX(d) {
  return d[0];
}

function defaultY(d) {
  return d[1];
}

function defaultWeight() {
  return 1;
}

function density() {
  var x = defaultX,
      y = defaultY,
      weight = defaultWeight,
      dx = 960,
      dy = 500,
      r = 20, // blur radius
      k = 2, // log2(grid cell size)
      o = r * 3, // grid offset, to pad for blur
      n = (dx + o * 2) >> k, // grid width
      m = (dy + o * 2) >> k, // grid height
      threshold = constant(20);

  function grid(data) {
    var values = new Float32Array(n * m),
        pow2k = Math.pow(2, -k),
        i = -1;

    for (const d of data) {
      var xi = (x(d, ++i, data) + o) * pow2k,
          yi = (y(d, i, data) + o) * pow2k,
          wi = +weight(d, i, data);
      if (wi && xi >= 0 && xi < n && yi >= 0 && yi < m) {
        var x0 = Math.floor(xi),
            y0 = Math.floor(yi),
            xt = xi - x0 - 0.5,
            yt = yi - y0 - 0.5;
        values[x0 + y0 * n] += (1 - xt) * (1 - yt) * wi;
        values[x0 + 1 + y0 * n] += xt * (1 - yt) * wi;
        values[x0 + 1 + (y0 + 1) * n] += xt * yt * wi;
        values[x0 + (y0 + 1) * n] += (1 - xt) * yt * wi;
      }
    }

    d3Array.blur2({data: values, width: n, height: m}, r * pow2k);
    return values;
  }

  function density(data) {
    var values = grid(data),
        tz = threshold(values),
        pow4k = Math.pow(2, 2 * k);

    // Convert number of thresholds into uniform thresholds.
    if (!Array.isArray(tz)) {
      tz = d3Array.ticks(Number.MIN_VALUE, d3Array.max(values) / pow4k, tz);
    }

    return Contours()
        .size([n, m])
        .thresholds(tz.map(d => d * pow4k))
      (values)
        .map((c, i) => (c.value = +tz[i], transform(c)));
  }

  density.contours = function(data) {
    var values = grid(data),
        contours = Contours().size([n, m]),
        pow4k = Math.pow(2, 2 * k),
        contour = value => {
          value = +value;
          var c = transform(contours.contour(values, value * pow4k));
          c.value = value; // preserve exact threshold value
          return c;
        };
    Object.defineProperty(contour, "max", {get: () => d3Array.max(values) / pow4k});
    return contour;
  };

  function transform(geometry) {
    geometry.coordinates.forEach(transformPolygon);
    return geometry;
  }

  function transformPolygon(coordinates) {
    coordinates.forEach(transformRing);
  }

  function transformRing(coordinates) {
    coordinates.forEach(transformPoint);
  }

  // TODO Optimize.
  function transformPoint(coordinates) {
    coordinates[0] = coordinates[0] * Math.pow(2, k) - o;
    coordinates[1] = coordinates[1] * Math.pow(2, k) - o;
  }

  function resize() {
    o = r * 3;
    n = (dx + o * 2) >> k;
    m = (dy + o * 2) >> k;
    return density;
  }

  density.x = function(_) {
    return arguments.length ? (x = typeof _ === "function" ? _ : constant(+_), density) : x;
  };

  density.y = function(_) {
    return arguments.length ? (y = typeof _ === "function" ? _ : constant(+_), density) : y;
  };

  density.weight = function(_) {
    return arguments.length ? (weight = typeof _ === "function" ? _ : constant(+_), density) : weight;
  };

  density.size = function(_) {
    if (!arguments.length) return [dx, dy];
    var _0 = +_[0], _1 = +_[1];
    if (!(_0 >= 0 && _1 >= 0)) throw new Error("invalid size");
    return dx = _0, dy = _1, resize();
  };

  density.cellSize = function(_) {
    if (!arguments.length) return 1 << k;
    if (!((_ = +_) >= 1)) throw new Error("invalid cell size");
    return k = Math.floor(Math.log(_) / Math.LN2), resize();
  };

  density.thresholds = function(_) {
    return arguments.length ? (threshold = typeof _ === "function" ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), density) : threshold;
  };

  density.bandwidth = function(_) {
    if (!arguments.length) return Math.sqrt(r * (r + 1));
    if (!((_ = +_) >= 0)) throw new Error("invalid bandwidth");
    return r = (Math.sqrt(4 * _ * _ + 1) - 1) / 2, resize();
  };

  return density;
}

exports.contourDensity = density;
exports.contours = Contours;

}));
