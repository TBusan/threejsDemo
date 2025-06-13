// https://d3js.org/d3-contour/ v4.0.2 Copyright 2012-2023 Mike Bostock
(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined'
    ? factory(exports, require('d3-array'))
    : typeof define === 'function' && define.amd
      ? define(['exports', 'd3-array'], factory)
      : (global = typeof globalThis !== 'undefined' ? globalThis : global || self, factory(global.d3 = global.d3 || {}, global.d3))
})(this, (exports, d3Array) => {
  'use strict'

  let array = Array.prototype

  let slice = array.slice

  function ascending(a, b) {
    return a - b
  }

  function area(ring) {
    let i = 0; let n = ring.length; let area = ring[n - 1][1] * ring[0][0] - ring[n - 1][0] * ring[0][1]
    while (++i < n) area += ring[i - 1][1] * ring[i][0] - ring[i - 1][0] * ring[i][1]
    return area
  }

  let constant = (x) => () => x

  function contains(ring, hole) {
    let i = -1; let n = hole.length; let c
    while (++i < n) {
      if (c = ringContains(ring, hole[i])) return c
    }
    return 0
  }

  function ringContains(ring, point) {
    let x = point[0]; let y = point[1]; let contains = -1
    for (let i = 0, n = ring.length, j = n - 1; i < n; j = i++) {
      let pi = ring[i]; let xi = pi[0]; let yi = pi[1]; let pj = ring[j]; let xj = pj[0]; let yj = pj[1]
      if (segmentContains(pi, pj, point)) return 0
      if (((yi > y) !== (yj > y)) && ((x < (xj - xi) * (y - yi) / (yj - yi) + xi))) contains = -contains
    }
    return contains
  }

  function segmentContains(a, b, c) {
    let i; return collinear(a, b, c) && within(a[i = +(a[0] === b[0])], c[i], b[i])
  }

  function collinear(a, b, c) {
    return (b[0] - a[0]) * (c[1] - a[1]) === (c[0] - a[0]) * (b[1] - a[1])
  }

  function within(p, q, r) {
    return p <= q && q <= r || r <= q && q <= p
  }

  function noop() {}

  // Define constants for saddle point handling, inspired by plotly.js approach
  const CHOOSESADDLE = {
    713: [7, 13],
    1114: [11, 14],
    104: [1, 4],
    208: [2, 8],
  }
  const SADDLEREMAINDER = {
    1: 4,
    2: 8,
    4: 1,
    7: 13,
    8: 2,
    11: 14,
    13: 7,
    14: 11,
  }

  // The marching squares algorithm produces square-based contour rings with 16 cases
  let cases = [
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
    [],
  ]

  function Contours() {
    let dx = 1
    let dy = 1
    let threshold = d3Array.thresholdSturges
    let smooth = smoothLinear

    function contours(values) {
      let tz = threshold(values)

      // Convert number of thresholds into uniform thresholds.
      if (!Array.isArray(tz)) {
        const e = d3Array.extent(values, finite)
        tz = d3Array.ticks(...d3Array.nice(e[0], e[1], tz), tz)
        while (tz[tz.length - 1] >= e[1]) tz.pop()
        while (tz[1] < e[0]) tz.shift()
      } else {
        tz = tz.slice().sort(ascending)
      }

      return tz.map((value) => contour(values, value))
    }

    // Accumulate, smooth contour rings, assign holes to exterior rings.
    // Based on https://github.com/mbostock/shapefile/blob/v0.6.2/shp/polygon.js
    function contour(values, value) {
      const v = value == null ? Number.NaN : +value
      if (isNaN(v)) throw new Error(`invalid value: ${value}`)

      let polygons = []
      let holes = []

      isorings(values, v, (ring) => {
        smooth(ring, values, v)
        // Add distance information for post-processing
        addGridInfo(ring)
        if (area(ring) > 0) polygons.push([ring])
        else holes.push(ring)
      })

      // Post-process rings to improve quality
      polygons = polygons.map((polygon) => {
      // Remove too close points
        polygon[0] = optimizePointDensity(polygon[0])
        return polygon
      })

      holes = holes.map((hole) => optimizePointDensity(hole))

      holes.forEach((hole) => {
        for (var i = 0, n = polygons.length, polygon; i < n; ++i) {
          if (contains((polygon = polygons[i])[0], hole) !== -1) {
            polygon.push(hole)
            return
          }
        }
      })

      return {
        type: 'MultiPolygon',
        value,
        coordinates: polygons,
      }
    }

    // Add grid index information to ring points for better path optimization
    function addGridInfo(ring) {
      ring.forEach((point) => {
        point[2] = point[0] | 0 // add grid x index
        point[3] = point[1] | 0 // add grid y index
      })
    }

    // Remove points that are too close together
    function optimizePointDensity(ring) {
      if (ring.length <= 2) return ring

      // Calculate total path length in grid units
      let totaldist = 0
      const alldists = []

      for (let i = 1; i < ring.length; i++) {
        const thisdist = ptDist(ring[i], ring[i - 1])
        totaldist += thisdist
        alldists.push(thisdist)
      }

      // Add last segment if this is a closed path
      const closedpath = equalPts(ring[0], ring[ring.length - 1], 0.01, 0.01)
      if (closedpath && ring.length > 1) {
        const thisdist = ptDist(ring[0], ring[ring.length - 1])
        totaldist += thisdist
        alldists.push(thisdist)
      }

      // If there are not enough points, return the original
      if (ring.length < 4) return ring

      const distThresholdFactor = 0.2 * (smooth === smoothLinear ? 1 : 0)
      const distThreshold = totaldist / alldists.length * distThresholdFactor

      // Skip optimization if threshold is zero or too small
      if (distThreshold <= 0.01) return ring

      const result = []
      let i = 0
      let current = ring[0]
      result.push(current)

      while (i < ring.length - 1) {
        let nextIndex = i + 1
        let distAcc = alldists[i]

        // Accumulate points that are too close
        while (nextIndex < ring.length - 1 && distAcc + alldists[nextIndex] < distThreshold) {
          distAcc += alldists[nextIndex]
          nextIndex++
        }

        if (nextIndex > i + 1) {
        // Average the points
          const avgPoint = [0, 0]
          for (let j = i + 1; j <= nextIndex; j++) {
            avgPoint[0] += ring[j][0]
            avgPoint[1] += ring[j][1]
          }
          avgPoint[0] /= (nextIndex - i)
          avgPoint[1] /= (nextIndex - i)
          result.push(avgPoint)
        } else {
          result.push(ring[nextIndex])
        }

        i = nextIndex
      }

      // Ensure closed paths remain closed
      if (closedpath && !equalPts(result[0], result[result.length - 1], 0.01, 0.01)) {
        result.push([result[0][0], result[0][1]])
      }

      return result
    }

    // Marching squares with isolines stitched into rings.
    // Based on https://github.com/topojson/topojson-client/blob/v3.0.0/src/stitch.js
    // Enhanced with better saddle point handling
    function isorings(values, value, callback) {
      let fragmentByStart = new Array()
      let fragmentByEnd = new Array()
      let x; let y; let t0; let t1; let t2; let t3

      // Special case for the first row (y = -1, t2 = t3 = 0).
      x = y = -1
      t1 = above(values[0], value)
      cases[t1 << 1].forEach(stitch)
      while (++x < dx - 1) {
        t0 = t1, t1 = above(values[x + 1], value)
        cases[t0 | t1 << 1].forEach(stitch)
      }
      cases[t1 << 0].forEach(stitch)

      // General case for the intermediate rows.
      while (++y < dy - 1) {
        x = -1
        t1 = above(values[y * dx + dx], value)
        t2 = above(values[y * dx], value)
        cases[t1 << 1 | t2 << 2].forEach(stitch)
        while (++x < dx - 1) {
          t0 = t1, t1 = above(values[y * dx + dx + x + 1], value)
          t3 = t2, t2 = above(values[y * dx + x + 1], value)

          // Get marching index
          let mi = t0 | t1 << 1 | t2 << 2 | t3 << 3

          // Handle saddle cases better (case 5 and 10)
          if (mi === 5 || mi === 10) {
          // Sample the center value to disambiguate the saddle
            const corners = [
              [values[y * dx + x], values[y * dx + x + 1]],
              [values[(y + 1) * dx + x], values[(y + 1) * dx + x + 1]],
            ]
            const avg = (corners[0][0] + corners[0][1] + corners[1][0] + corners[1][1]) / 4

            // Determine which way the saddle should go based on the average
            if (value > avg) {
              mi = (mi === 5) ? 713 : 1114
            } else {
              mi = (mi === 5) ? 104 : 208
            }

            // Handle the special saddle cases
            if (mi > 15) {
              if (mi === 713 || mi === 1114) {
              // Apply the saddle case direction using CHOOSESADDLE
                const directions = CHOOSESADDLE[mi]
                cases[directions[0]].forEach(stitch)
                cases[directions[1]].forEach(stitch)

                // Update the marching index for potential next steps
                mi = SADDLEREMAINDER[directions[1]]
              } else if (mi === 104 || mi === 208) {
              // Apply the saddle case direction using CHOOSESADDLE
                const directions = CHOOSESADDLE[mi]
                cases[directions[0]].forEach(stitch)
                cases[directions[1]].forEach(stitch)

                // Update the marching index for potential next steps
                mi = SADDLEREMAINDER[directions[1]]
              }
              continue
            }
          }

          cases[mi].forEach(stitch)
        }
        cases[t1 | t2 << 3].forEach(stitch)
      }

      // Special case for the last row (y = dy - 1, t0 = t1 = 0).
      x = -1
      t2 = values[y * dx] >= value
      cases[t2 << 2].forEach(stitch)
      while (++x < dx - 1) {
        t3 = t2, t2 = above(values[y * dx + x + 1], value)
        cases[t2 << 2 | t3 << 3].forEach(stitch)
      }
      cases[t2 << 3].forEach(stitch)

      function stitch(line) {
        let start = [line[0][0] + x, line[0][1] + y]
        let end = [line[1][0] + x, line[1][1] + y]
        let startIndex = index(start)
        let endIndex = index(end)
        let f; let g
        if (f = fragmentByEnd[startIndex]) {
          if (g = fragmentByStart[endIndex]) {
            delete fragmentByEnd[f.end]
            delete fragmentByStart[g.start]
            if (f === g) {
              f.ring.push(end)
              callback(f.ring)
            } else {
              fragmentByStart[f.start] = fragmentByEnd[g.end] = { start: f.start, end: g.end, ring: f.ring.concat(g.ring) }
            }
          } else {
            delete fragmentByEnd[f.end]
            f.ring.push(end)
            fragmentByEnd[f.end = endIndex] = f
          }
        } else if (f = fragmentByStart[endIndex]) {
          if (g = fragmentByEnd[startIndex]) {
            delete fragmentByStart[f.start]
            delete fragmentByEnd[g.end]
            if (f === g) {
              f.ring.push(end)
              callback(f.ring)
            } else {
              fragmentByStart[g.start] = fragmentByEnd[f.end] = { start: g.start, end: f.end, ring: g.ring.concat(f.ring) }
            }
          } else {
            delete fragmentByStart[f.start]
            f.ring.unshift(start)
            fragmentByStart[f.start = startIndex] = f
          }
        } else {
          fragmentByStart[startIndex] = fragmentByEnd[endIndex] = { start: startIndex, end: endIndex, ring: [start, end] }
        }
      }
    }

    function index(point) {
      return point[0] * 2 + point[1] * (dx + 1) * 4
    }

    // Compare if two points are equal within tolerance
    function equalPts(pt1, pt2, xtol, ytol) {
      return Math.abs(pt1[0] - pt2[0]) < xtol
        && Math.abs(pt1[1] - pt2[1]) < ytol
    }

    // Calculate distance between points in grid units
    function ptDist(pt1, pt2) {
    // If grid indices are available, use them
      if (pt1.length > 2 && pt2.length > 2) {
        const dx = pt1[2] - pt2[2]
        const dy = pt1[3] - pt2[3]
        return Math.sqrt(dx * dx + dy * dy)
      } else {
      // Fall back to pixel coordinates
        const dx = pt1[0] - pt2[0]
        const dy = pt1[1] - pt2[1]
        return Math.sqrt(dx * dx + dy * dy)
      }
    }

    function smoothLinear(ring, values, value) {
      ring.forEach((point) => {
        let x = point[0]
        let y = point[1]
        let xt = x | 0
        let yt = y | 0
        let v1 = valid(values[yt * dx + xt])
        if (x > 0 && x < dx && xt === x) {
          point[0] = smooth1(x, valid(values[yt * dx + xt - 1]), v1, value)
        }
        if (y > 0 && y < dy && yt === y) {
          point[1] = smooth1(y, valid(values[(yt - 1) * dx + xt]), v1, value)
        }
      })
    }

    contours.contour = contour

    contours.size = function (_) {
      if (!arguments.length) return [dx, dy]
      let _0 = Math.floor(_[0]); let _1 = Math.floor(_[1])
      if (!(_0 >= 0 && _1 >= 0)) throw new Error('invalid size')
      return dx = _0, dy = _1, contours
    }

    contours.thresholds = function (_) {
      return arguments.length ? (threshold = typeof _ === 'function' ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), contours) : threshold
    }

    contours.smooth = function (_) {
      return arguments.length ? (smooth = _ ? smoothLinear : noop, contours) : smooth === smoothLinear
    }

    return contours
  }

  // When computing the extent, ignore infinite values (as well as invalid ones).
  function finite(x) {
    return isFinite(x) ? x : Number.NaN
  }

  // Is the (possibly invalid) x greater than or equal to the (known valid) value?
  // Treat any invalid value as below negative infinity.
  function above(x, value) {
    return x == null ? false : +x >= value
  }

  // During smoothing, treat any invalid value as negative infinity.
  function valid(v) {
    return v == null || isNaN(v = +v) ? -Infinity : v
  }

  function smooth1(x, v0, v1, value) {
    const a = value - v0
    const b = v1 - v0
    const d = isFinite(a) || isFinite(b) ? a / b : Math.sign(a) / Math.sign(b)
    return isNaN(d) ? x : x + d - 0.5
  }

  function defaultX(d) {
    return d[0]
  }

  function defaultY(d) {
    return d[1]
  }

  function defaultWeight() {
    return 1
  }

  function density() {
    let x = defaultX
    let y = defaultY
    let weight = defaultWeight
    let dx = 960
    let dy = 500
    let r = 20 // blur radius
    let k = 2 // log2(grid cell size)
    let o = r * 3 // grid offset, to pad for blur
    let n = (dx + o * 2) >> k // grid width
    let m = (dy + o * 2) >> k // grid height
    let threshold = constant(20)

    function grid(data) {
      let values = new Float32Array(n * m)
      let pow2k = 2 ** -k
      let i = -1

      for (const d of data) {
        let xi = (x(d, ++i, data) + o) * pow2k
        let yi = (y(d, i, data) + o) * pow2k
        let wi = +weight(d, i, data)
        if (wi && xi >= 0 && xi < n && yi >= 0 && yi < m) {
          let x0 = Math.floor(xi)
          let y0 = Math.floor(yi)
          let xt = xi - x0 - 0.5
          let yt = yi - y0 - 0.5
          values[x0 + y0 * n] += (1 - xt) * (1 - yt) * wi
          values[x0 + 1 + y0 * n] += xt * (1 - yt) * wi
          values[x0 + 1 + (y0 + 1) * n] += xt * yt * wi
          values[x0 + (y0 + 1) * n] += (1 - xt) * yt * wi
        }
      }

      d3Array.blur2({ data: values, width: n, height: m }, r * pow2k)
      return values
    }

    function density(data) {
      let values = grid(data)
      let tz = threshold(values)
      let pow4k = 2 ** (2 * k)

      // Convert number of thresholds into uniform thresholds.
      if (!Array.isArray(tz)) {
        tz = d3Array.ticks(Number.MIN_VALUE, d3Array.max(values) / pow4k, tz)
      }

      return Contours()
        .size([n, m])
        .thresholds(tz.map((d) => d * pow4k))
        (values)
        .map((c, i) => (c.value = +tz[i], transform(c)))
    }

    density.contours = function (data) {
      let values = grid(data)
      let contours = Contours().size([n, m])
      let pow4k = 2 ** (2 * k)
      let contour = (value) => {
        value = +value
        let c = transform(contours.contour(values, value * pow4k))
        c.value = value // preserve exact threshold value
        return c
      }
      Object.defineProperty(contour, 'max', { get: () => d3Array.max(values) / pow4k })
      return contour
    }

    function transform(geometry) {
      geometry.coordinates.forEach(transformPolygon)
      return geometry
    }

    function transformPolygon(coordinates) {
      coordinates.forEach(transformRing)
    }

    function transformRing(coordinates) {
      coordinates.forEach(transformPoint)
    }

    // TODO Optimize.
    function transformPoint(coordinates) {
      coordinates[0] = coordinates[0] * 2 ** k - o
      coordinates[1] = coordinates[1] * 2 ** k - o
    }

    function resize() {
      o = r * 3
      n = (dx + o * 2) >> k
      m = (dy + o * 2) >> k
      return density
    }

    density.x = function (_) {
      return arguments.length ? (x = typeof _ === 'function' ? _ : constant(+_), density) : x
    }

    density.y = function (_) {
      return arguments.length ? (y = typeof _ === 'function' ? _ : constant(+_), density) : y
    }

    density.weight = function (_) {
      return arguments.length ? (weight = typeof _ === 'function' ? _ : constant(+_), density) : weight
    }

    density.size = function (_) {
      if (!arguments.length) return [dx, dy]
      let _0 = +_[0]; let _1 = +_[1]
      if (!(_0 >= 0 && _1 >= 0)) throw new Error('invalid size')
      return dx = _0, dy = _1, resize()
    }

    density.cellSize = function (_) {
      if (!arguments.length) return 1 << k
      if (!((_ = +_) >= 1)) throw new Error('invalid cell size')
      return k = Math.floor(Math.log(_) / Math.LN2), resize()
    }

    density.thresholds = function (_) {
      return arguments.length ? (threshold = typeof _ === 'function' ? _ : Array.isArray(_) ? constant(slice.call(_)) : constant(_), density) : threshold
    }

    density.bandwidth = function (_) {
      if (!arguments.length) return Math.sqrt(r * (r + 1))
      if (!((_ = +_) >= 0)) throw new Error('invalid bandwidth')
      return r = (Math.sqrt(4 * _ * _ + 1) - 1) / 2, resize()
    }

    return density
  }

  exports.contourDensity = density
  exports.contours = Contours
})
