var Fe = Object.defineProperty;
var He = (l, r, s) => r in l ? Fe(l, r, { enumerable: !0, configurable: !0, writable: !0, value: s }) : l[r] = s;
var L = (l, r, s) => He(l, typeof r != "symbol" ? r + "" : r, s);
import { LoadingManager as De, Vector2 as le, Box2 as Ce, PlaneGeometry as ie, MeshBasicMaterial as ce, BufferAttribute as te, MeshStandardMaterial as je, FrontSide as Je, CanvasTexture as ye, ImageLoader as pe, Texture as Ee, SRGBColorSpace as Ne, FileLoader as Be, MathUtils as Oe, Vector3 as C, InstancedBufferGeometry as Qe, Matrix4 as Ae, Box3 as _e, Frustum as qe, Mesh as We, Raycaster as Ve, SpriteMaterial as $e, Sprite as et, Clock as tt } from "three";
const st = "0.10.3", me = {
  name: "GuoJF"
};
console.log(`====================three-tile V${st}==============================`);
class nt extends De {
  constructor() {
    super(...arguments);
    L(this, "onParseEnd");
  }
  parseEnd(s) {
    this.onParseEnd && this.onParseEnd(s);
  }
}
const R = {
  manager: new nt(),
  // Dict of dem loader
  demLoaderMap: /* @__PURE__ */ new Map(),
  // Dict of img loader
  imgLoaderMap: /* @__PURE__ */ new Map(),
  /**
   * Register material loader
   * @param loader material loader
   */
  registerMaterialLoader(l) {
    R.imgLoaderMap.set(l.dataType, l), l.info.author = l.info.author ?? me.name, console.log(`* Register imageLoader: '${l.dataType}', Author: '${l.info.author}'`);
  },
  /**
   * Register geometry loader
   * @param loader geometry loader
   */
  registerGeometryLoader(l) {
    R.demLoaderMap.set(l.dataType, l), l.info.author = l.info.author ?? me.name, console.log(`* Register terrainLoader: '${l.dataType}', Author: '${l.info.author}'`);
  },
  /**
   * Get material loader from datasource
   * @param source datasource
   * @returns material loader
   */
  getMaterialLoader(l) {
    const r = R.imgLoaderMap.get(l.dataType);
    if (r)
      return r;
    throw `Source dataType "${l.dataType}" is not support!`;
  },
  /**
   * Get geometry loader from datasource
   * @param source datasouce
   * @returns geometry loader
   */
  getGeometryLoader(l) {
    const r = R.demLoaderMap.get(l.dataType);
    if (r)
      return r;
    throw `Source dataType "${l.dataType}" is not support!`;
  }
};
class es {
  /**
   * 构造函数
   *
   * @param creator 创建一个 Worker 实例的函数
   */
  constructor(r) {
    L(this, "worker");
    this.worker = r();
  }
  /**
   * 异步执行worker任务，并返回结果。
   *
   * @param message 要传递给worker的消息。
   * @param transfer 可转移对象的数组，用于优化内存传输。
   * @returns 返回一个Promise，解析为worker返回的结果。
   */
  async run(r, s) {
    return new Promise((i) => {
      this.worker.onmessage = (e) => {
        i(e.data);
      }, this.worker.postMessage(r, s);
    });
  }
  /**
   * 终止当前工作进程。
   */
  terminate() {
    this.worker.terminate();
  }
}
function fe(l, r) {
  const s = Math.floor(l[0] * r), i = Math.floor(l[1] * r), e = Math.floor((l[2] - l[0]) * r), t = Math.floor((l[3] - l[1]) * r);
  return { sx: s, sy: i, sw: e, sh: t };
}
function Le(l, r, s, i) {
  if (i < l.minLevel)
    return {
      url: void 0,
      clipBounds: [0, 0, 1, 1]
    };
  if (i <= l.maxLevel)
    return {
      url: l._getUrl(r, s, i),
      clipBounds: [0, 0, 1, 1]
    };
  const e = rt(r, s, i, l.maxLevel), t = e.parentNO;
  return { url: l._getUrl(t.x, t.y, t.z), clipBounds: e.bounds };
}
function rt(l, r, s, i) {
  const e = s - i, t = { x: l >> e, y: r >> e, z: s - e }, n = Math.pow(2, e), o = Math.pow(0.5, e), c = l % n / n - 0.5 + o / 2, a = r % n / n - 0.5 + o / 2, h = new le(c, a), m = new Ce().setFromCenterAndSize(h, new le(o, o)), d = [m.min.x + 0.5, m.min.y + 0.5, m.max.x + 0.5, m.max.y + 0.5];
  return { parentNO: t, bounds: d };
}
class xe {
  constructor() {
    L(this, "_imgSource", []);
    L(this, "_demSource");
    /** Loader manager */
    L(this, "manager", R.manager);
  }
  /** Get image source */
  get imgSource() {
    return this._imgSource;
  }
  /** Set image source */
  set imgSource(r) {
    this._imgSource = r;
  }
  /** Get DEM source */
  get demSource() {
    return this._demSource;
  }
  /** Set DEM source */
  set demSource(r) {
    this._demSource = r;
  }
  /**
   * Load getmetry and materail of tile from x, y and z coordinate.
   *
   * @returns Promise<MeshDateType> tile data
   */
  async load(r) {
    const s = await this.loadGeometry(r), i = await this.loadMaterial(r);
    console.assert(!!i && !!s);
    for (let e = 0; e < i.length; e++)
      s.addGroup(0, 1 / 0, e);
    return { materials: i, geometry: s };
  }
  /**
   * Unload tile mesh data
   * @param tileMesh tile mesh
   */
  unload(r) {
    const s = r.material, i = r.geometry;
    for (let e = 0; e < s.length; e++)
      s[e].dispose();
    i.dispose();
  }
  /**
   * Load geometry
   * @returns BufferGeometry
   */
  async loadGeometry(r) {
    let s;
    if (this.demSource && r.z >= this.demSource.minLevel && this._isBoundsInSourceBounds(this.demSource, r.bounds)) {
      const i = R.getGeometryLoader(this.demSource), e = this.demSource;
      s = await i.load({ source: e, ...r }).catch((t) => (console.error("Load material error", e.dataType, r.x, r.y, r.z), new ie())), s.addEventListener("dispose", () => {
        i.unload && i.unload(s);
      });
    } else
      s = new ie();
    return s;
  }
  /**
   * Load material
   * @param x x coordinate of tile
   * @param y y coordinate of tile
   * @param z z coordinate of tile
   * @returns Material[]
   */
  async loadMaterial(r) {
    const i = this.imgSource.filter(
      (e) => r.z >= e.minLevel && this._isBoundsInSourceBounds(e, r.bounds)
    ).map(async (e) => {
      const t = R.getMaterialLoader(e), n = await t.load({ source: e, ...r }).catch((c) => (console.error("Load material error", e.dataType, r.x, r.y, r.z), new ce())), o = (c) => {
        t.unload && t.unload(c.target), c.target.removeEventListener("dispose", o);
      };
      return n instanceof ce || n.addEventListener("dispose", o), n;
    });
    return Promise.all(i);
  }
  /**
   * Check the tile is in the source bounds. (projection coordinate)
   * @returns true in the bounds,else false
   */
  _isBoundsInSourceBounds(r, s) {
    const i = r._projectionBounds;
    return !(s[2] < i[0] || s[3] < i[1] || s[0] > i[2] || s[1] > i[3]);
  }
}
function se(...l) {
  const r = l, s = r && r.length > 1 && r[0].constructor || null;
  if (!s)
    throw new Error(
      "concatenateTypedArrays - incorrect quantity of arguments or arguments have incompatible data types"
    );
  const i = r.reduce((n, o) => n + o.length, 0), e = new s(i);
  let t = 0;
  for (const n of r)
    e.set(n, t), t += n.length;
  return e;
}
function it(l, r, s, i) {
  const e = i ? at(i, l.position.value) : ot(r), t = e.length, n = new Float32Array(t * 6), o = new Float32Array(t * 4), c = new r.constructor(t * 6), a = new Float32Array(t * 6);
  for (let m = 0; m < t; m++)
    lt({
      edge: e[m],
      edgeIndex: m,
      attributes: l,
      skirtHeight: s,
      newPosition: n,
      newTexcoord0: o,
      newTriangles: c,
      newNormals: a
    });
  l.position.value = se(l.position.value, n), l.texcoord.value = se(l.texcoord.value, o), l.normal.value = se(l.normal.value, a);
  const h = se(r, c);
  return {
    attributes: l,
    indices: h
  };
}
function ot(l) {
  const r = [], s = Array.isArray(l) ? l : Array.from(l);
  for (let e = 0; e < s.length; e += 3) {
    const t = s[e], n = s[e + 1], o = s[e + 2];
    r.push([t, n], [n, o], [o, t]);
  }
  r.sort(([e, t], [n, o]) => {
    const c = Math.min(e, t), a = Math.min(n, o);
    return c !== a ? c - a : Math.max(e, t) - Math.max(n, o);
  });
  const i = [];
  for (let e = 0; e < r.length; e++)
    e + 1 < r.length && r[e][0] === r[e + 1][1] && r[e][1] === r[e + 1][0] ? e++ : i.push(r[e]);
  return i;
}
function at(l, r) {
  const s = (e, t) => {
    e.sort(t);
  };
  s(l.westIndices, (e, t) => r[3 * e + 1] - r[3 * t + 1]), s(l.eastIndices, (e, t) => r[3 * t + 1] - r[3 * e + 1]), s(l.southIndices, (e, t) => r[3 * t] - r[3 * e]), s(l.northIndices, (e, t) => r[3 * e] - r[3 * t]);
  const i = [];
  return Object.values(l).forEach((e) => {
    if (e.length > 1)
      for (let t = 0; t < e.length - 1; t++)
        i.push([e[t], e[t + 1]]);
  }), i;
}
function lt({
  edge: l,
  edgeIndex: r,
  attributes: s,
  skirtHeight: i,
  newPosition: e,
  newTexcoord0: t,
  newTriangles: n,
  newNormals: o
}) {
  const c = s.position.value.length, a = r * 2, h = a + 1;
  e.set(s.position.value.subarray(l[0] * 3, l[0] * 3 + 3), a * 3), e[a * 3 + 2] = e[a * 3 + 2] - i, e.set(s.position.value.subarray(l[1] * 3, l[1] * 3 + 3), h * 3), e[h * 3 + 2] = e[h * 3 + 2] - i, t.set(s.texcoord.value.subarray(l[0] * 2, l[0] * 2 + 2), a * 2), t.set(s.texcoord.value.subarray(l[1] * 2, l[1] * 2 + 2), h * 2);
  const m = r * 2 * 3;
  n[m] = l[0], n[m + 1] = c / 3 + h, n[m + 2] = l[1], n[m + 3] = c / 3 + h, n[m + 4] = l[0], n[m + 5] = c / 3 + a, o[m] = 0, o[m + 1] = 0, o[m + 2] = 1, o[m + 3] = 0, o[m + 4] = 0, o[m + 5] = 1;
}
function ct(l) {
  if (l.length < 4)
    throw new Error(`DEM array must > 4, got ${l.length}!`);
  const r = Math.floor(Math.sqrt(l.length)), s = r, i = r, e = Ge(i, s);
  return { attributes: mt(l, i, s), indices: e };
}
function mt(l, r, s) {
  const i = s * r, e = new Float32Array(i * 3), t = new Float32Array(i * 2);
  let n = 0;
  for (let o = 0; o < r; o++)
    for (let c = 0; c < s; c++) {
      const a = c / (s - 1), h = o / (r - 1);
      t[n * 2] = a, t[n * 2 + 1] = h, e[n * 3] = a - 0.5, e[n * 3 + 1] = h - 0.5, e[n * 3 + 2] = l[(r - o - 1) * s + c], n++;
    }
  return {
    // 顶点位置属性
    position: { value: e, size: 3 },
    // UV坐标属性
    texcoord: { value: t, size: 2 },
    // 法线属性
    normal: { value: Te(e, Ge(r, s)), size: 3 }
  };
}
function Ge(l, r) {
  const s = 6 * (r - 1) * (l - 1), i = new Uint16Array(s);
  let e = 0;
  for (let t = 0; t < l - 1; t++)
    for (let n = 0; n < r - 1; n++) {
      const o = t * r + n, c = o + 1, a = o + r, h = a + 1, m = e * 6;
      i[m] = o, i[m + 1] = c, i[m + 2] = a, i[m + 3] = a, i[m + 4] = c, i[m + 5] = h, e++;
    }
  return i;
}
function Te(l, r) {
  const s = new Float32Array(l.length);
  for (let i = 0; i < r.length; i += 3) {
    const e = r[i] * 3, t = r[i + 1] * 3, n = r[i + 2] * 3, o = l[e], c = l[e + 1], a = l[e + 2], h = l[t], m = l[t + 1], d = l[t + 2], y = l[n], Z = l[n + 1], p = l[n + 2], f = h - o, b = m - c, u = d - a, V = y - o, M = Z - c, g = p - a, x = b * g - u * M, X = u * V - f * g, T = f * M - b * V, I = Math.sqrt(x * x + X * X + T * T), G = [0, 0, 1];
    if (I > 0) {
      const W = 1 / I;
      G[0] = x * W, G[1] = X * W, G[2] = T * W;
    }
    for (let W = 0; W < 3; W++)
      s[e + W] = s[t + W] = s[n + W] = G[W];
  }
  return s;
}
class oe extends ie {
  constructor() {
    super(...arguments);
    L(this, "type", "TileGeometry");
  }
  /**
   * set attribute data to geometry
   * @param data geometry or DEM data
   * @returns this
   */
  setData(s, i = 1e3) {
    let e = s instanceof Float32Array ? ct(s) : s;
    e = it(e.attributes, e.indices, i);
    const { attributes: t, indices: n } = e;
    return this.setIndex(new te(n, 1)), this.setAttribute("position", new te(t.position.value, t.position.size)), this.setAttribute("uv", new te(t.texcoord.value, t.texcoord.size)), this.setAttribute("normal", new te(t.normal.value, t.normal.size)), this.computeBoundingBox(), this.computeBoundingSphere(), this;
  }
}
class dt {
  /**
   * Constructor for the generator.
   *
   * @param gridSize - Size of the grid.
   */
  constructor(r = 257) {
    /**
     * Size of the grid to be generated.
     */
    L(this, "gridSize");
    /**
     * Number of triangles to be used in the tile.
     */
    L(this, "numTriangles");
    /**
     * Number of triangles in the parent node.
     */
    L(this, "numParentTriangles");
    /**
     * Indices of the triangles faces.
     */
    L(this, "indices");
    /**
     * Coordinates of the points composing the mesh.
     */
    L(this, "coords");
    this.gridSize = r;
    const s = r - 1;
    if (s & s - 1)
      throw new Error(`Expected grid size to be 2^n+1, got ${r}.`);
    this.numTriangles = s * s * 2 - 2, this.numParentTriangles = this.numTriangles - s * s, this.indices = new Uint32Array(this.gridSize * this.gridSize), this.coords = new Uint16Array(this.numTriangles * 4);
    for (let i = 0; i < this.numTriangles; i++) {
      let e = i + 2, t = 0, n = 0, o = 0, c = 0, a = 0, h = 0;
      for (e & 1 ? o = c = a = s : t = n = h = s; (e >>= 1) > 1; ) {
        const d = t + o >> 1, y = n + c >> 1;
        e & 1 ? (o = t, c = n, t = a, n = h) : (t = o, n = c, o = a, c = h), a = d, h = y;
      }
      const m = i * 4;
      this.coords[m + 0] = t, this.coords[m + 1] = n, this.coords[m + 2] = o, this.coords[m + 3] = c;
    }
  }
  createTile(r) {
    return new ht(r, this);
  }
}
class ht {
  constructor(r, s) {
    /**
     * Pointer to the martini generator object.
     */
    L(this, "martini");
    /**
     * Terrain to generate the tile for.
     */
    L(this, "terrain");
    /**
     * Errors detected while creating the tile.
     */
    L(this, "errors");
    const i = s.gridSize;
    if (r.length !== i * i)
      throw new Error(
        `Expected terrain data of length ${i * i} (${i} x ${i}), got ${r.length}.`
      );
    this.terrain = r, this.martini = s, this.errors = new Float32Array(r.length), this.update();
  }
  update() {
    const { numTriangles: r, numParentTriangles: s, coords: i, gridSize: e } = this.martini, { terrain: t, errors: n } = this;
    for (let o = r - 1; o >= 0; o--) {
      const c = o * 4, a = i[c + 0], h = i[c + 1], m = i[c + 2], d = i[c + 3], y = a + m >> 1, Z = h + d >> 1, p = y + Z - h, f = Z + a - y, b = (t[h * e + a] + t[d * e + m]) / 2, u = Z * e + y, V = Math.abs(b - t[u]);
      if (n[u] = Math.max(n[u], V), o < s) {
        const M = (h + f >> 1) * e + (a + p >> 1), g = (d + f >> 1) * e + (m + p >> 1);
        n[u] = Math.max(n[u], n[M], n[g]);
      }
    }
  }
  getGeometryData(r = 0) {
    const { gridSize: s, indices: i } = this.martini, { errors: e } = this;
    let t = 0, n = 0;
    const o = s - 1;
    let c, a, h = 0;
    i.fill(0);
    function m(u, V, M, g, x, X) {
      const T = u + M >> 1, I = V + g >> 1;
      Math.abs(u - x) + Math.abs(V - X) > 1 && e[I * s + T] > r ? (m(x, X, u, V, T, I), m(M, g, x, X, T, I)) : (c = V * s + u, a = g * s + M, h = X * s + x, i[c] === 0 && (i[c] = ++t), i[a] === 0 && (i[a] = ++t), i[h] === 0 && (i[h] = ++t), n++);
    }
    m(0, 0, o, o, o, 0), m(o, o, 0, 0, 0, o);
    const d = t * 2, y = n * 3, Z = new Uint16Array(d), p = new Uint32Array(y);
    let f = 0;
    function b(u, V, M, g, x, X) {
      const T = u + M >> 1, I = V + g >> 1;
      if (Math.abs(u - x) + Math.abs(V - X) > 1 && e[I * s + T] > r)
        b(x, X, u, V, T, I), b(M, g, x, X, T, I);
      else {
        const G = i[V * s + u] - 1, W = i[g * s + M] - 1, Y = i[X * s + x] - 1;
        Z[2 * G] = u, Z[2 * G + 1] = V, Z[2 * W] = M, Z[2 * W + 1] = g, Z[2 * Y] = x, Z[2 * Y + 1] = X, p[f++] = G, p[f++] = W, p[f++] = Y;
      }
    }
    return b(0, 0, o, o, o, 0), b(o, o, 0, 0, 0, o), {
      attributes: this._getMeshAttributes(this.terrain, Z, p),
      indices: p
    };
  }
  _getMeshAttributes(r, s, i) {
    const e = Math.floor(Math.sqrt(r.length)), t = e - 1, n = s.length / 2, o = new Float32Array(n * 3), c = new Float32Array(n * 2);
    for (let h = 0; h < n; h++) {
      const m = s[h * 2], d = s[h * 2 + 1], y = d * e + m;
      o[3 * h + 0] = m / t - 0.5, o[3 * h + 1] = 0.5 - d / t, o[3 * h + 2] = r[y], c[2 * h + 0] = m / t, c[2 * h + 1] = 1 - d / t;
    }
    const a = Te(o, i);
    return {
      position: { value: o, size: 3 },
      texcoord: { value: c, size: 2 },
      normal: { value: a, size: 3 }
    };
  }
}
class Me {
  constructor() {
    L(this, "info", {
      version: "0.10.0",
      description: "Terrain loader base class"
    });
    L(this, "dataType", "");
  }
  /**
   * load tile's data from source
   * @param source
   * @param tile
   * @param onError
   * @returns
   */
  async load(r) {
    const { source: s, x: i, y: e, z: t } = r, { url: n, clipBounds: o } = Le(s, i, e, t);
    if (!n)
      return new oe();
    const c = await this.doLoad(n, { source: s, x: i, y: e, z: t, bounds: o });
    return R.manager.parseEnd(n), c;
  }
}
class Xe extends je {
  constructor(r = {}) {
    super({ transparent: !0, side: Je, ...r });
  }
  setTexture(r) {
    this.map = r, this.needsUpdate = !0;
  }
  dispose() {
    const r = this.map;
    r && (r.image instanceof ImageBitmap && r.image.close(), r.dispose());
  }
}
var q = /* @__PURE__ */ ((l) => (l[l.Unknown = 0] = "Unknown", l[l.Point = 1] = "Point", l[l.Linestring = 2] = "Linestring", l[l.Polygon = 3] = "Polygon", l))(q || {});
class ts {
  /**
   * 渲染矢量数据
   * @param ctx 渲染上下文
   * @param type 元素类型
   * @param feature 元素
   * @param style 样式
   * @param scale 拉伸倍数
   */
  render(r, s, i, e, t = 1) {
    switch (r.lineCap = "round", r.lineJoin = "round", (e.shadowBlur ?? 0) > 0 && (r.shadowBlur = e.shadowBlur ?? 2, r.shadowColor = e.shadowColor ?? "black", r.shadowOffsetX = e.shadowOffset ? e.shadowOffset[0] : 0, r.shadowOffsetY = e.shadowOffset ? e.shadowOffset[1] : 0), s) {
      case q.Point:
        r.textAlign = "center", r.textBaseline = "middle", r.font = e.font ?? "14px Arial", r.fillStyle = e.fontColor ?? "white", this._renderPointText(r, i, t, e.textField ?? "name", e.fontOffset ?? [0, -8]);
        break;
      case q.Linestring:
        this._renderLineString(r, i, t);
        break;
      case q.Polygon:
        this._renderPolygon(r, i, t);
        break;
      default:
        console.warn(`Unknown feature type: ${s}`);
    }
    (e.fill || s === q.Point) && (r.globalAlpha = e.fillOpacity || 0.5, r.fillStyle = e.fillColor || e.color || "#3388ff", r.fill(e.fillRule || "evenodd")), (e.stroke ?? !0) && (e.weight ?? 1) > 0 && (r.globalAlpha = e.opacity || 1, r.lineWidth = e.weight || 1, r.strokeStyle = e.color || "#3388ff", r.setLineDash(e.dashArray || []), r.stroke());
  }
  // 渲染点要素
  _renderPointText(r, s, i = 1, e = "name", t = [0, 0]) {
    const n = s.geometry;
    r.beginPath();
    for (const c of n)
      for (let a = 0; a < c.length; a++) {
        const h = c[a];
        r.arc(h.x * i, h.y * i, 2, 0, 2 * Math.PI);
      }
    const o = s.properties;
    o && o[e] && r.fillText(
      o[e],
      n[0][0].x * i + t[0],
      n[0][0].y * i + t[1]
    );
  }
  // 渲染线要素
  _renderLineString(r, s, i) {
    const e = s.geometry;
    r.beginPath();
    for (const t of e)
      for (let n = 0; n < t.length; n++) {
        const { x: o, y: c } = t[n];
        n === 0 ? r.moveTo(o * i, c * i) : r.lineTo(o * i, c * i);
      }
  }
  // 渲染面要素
  _renderPolygon(r, s, i) {
    const e = s.geometry;
    r.beginPath();
    for (let t = 0; t < e.length; t++) {
      const n = e[t];
      for (let o = 0; o < n.length; o++) {
        const { x: c, y: a } = n[o];
        o === 0 ? r.moveTo(c * i, a * i) : r.lineTo(c * i, a * i);
      }
      r.closePath();
    }
  }
}
class ut {
  constructor() {
    L(this, "info", {
      version: "0.10.0",
      description: "Image loader base class"
    });
    L(this, "dataType", "");
  }
  /**
   * Load tile data from source
   * @param source
   * @param tile
   * @returns
   */
  async load(r) {
    const { source: s, x: i, y: e, z: t } = r, n = new Xe(), { url: o, clipBounds: c } = Le(s, i, e, t);
    if (o) {
      const a = await this.doLoad(o, { source: s, x: i, y: e, z: t, bounds: c });
      n.map = a, R.manager.parseEnd(o);
    }
    return n;
  }
}
class ss {
  constructor() {
    L(this, "info", {
      version: "0.10.0",
      description: "Canvas tile abstract loader"
    });
    L(this, "dataType", "");
  }
  /**
   * Asynchronously load tile material
   * @param params Tile loading parameters
   * @returns Returns the tile material
   */
  async load(r) {
    const s = this._creatCanvasContext(256, 256);
    this.drawTile(s, r);
    const i = new ye(s.canvas.transferToImageBitmap());
    return new Xe({
      transparent: !0,
      map: i,
      opacity: r.source.opacity
    });
  }
  _creatCanvasContext(r, s) {
    const e = new OffscreenCanvas(r, s).getContext("2d");
    if (!e)
      throw new Error("create canvas context failed");
    return e.scale(1, -1), e.translate(0, -s), e;
  }
}
class Zt extends ut {
  constructor() {
    super(...arguments);
    L(this, "info", {
      version: "0.10.0",
      description: "Tile image loader. It can load xyz tile image."
    });
    L(this, "dataType", "image");
    L(this, "loader", new pe(R.manager));
  }
  /**
   * 加载图像资源的方法
   *
   * @param url 图像资源的URL
   * @param params 加载参数，包括x, y, z坐标和裁剪边界clipBounds
   * @returns 返回一个Promise对象，解析为HTMLImageElement类型。
   */
  async doLoad(s, i) {
    const e = await this.loader.loadAsync(s).catch((o) => new Image(1, 1)), t = new Ee();
    t.colorSpace = Ne;
    const { bounds: n } = i;
    return n[2] - n[0] < 1 ? t.image = bt(e, n) : t.image = e, t.needsUpdate = !0, t;
  }
}
function bt(l, r) {
  const s = l.width, i = new OffscreenCanvas(s, s), e = i.getContext("2d"), { sx: t, sy: n, sw: o, sh: c } = fe(r, l.width);
  return e.drawImage(l, t, n, o, c, 0, 0, s, s), i;
}
_t(new Zt());
class ge {
  constructor(r = 4) {
    this.pool = r, this.queue = [], this.workers = [], this.workersResolve = [], this.workerStatus = 0;
  }
  _initWorker(r) {
    if (!this.workers[r]) {
      const s = this.workerCreator();
      s.addEventListener("message", this._onMessage.bind(this, r)), this.workers[r] = s;
    }
  }
  _getIdleWorker() {
    for (let r = 0; r < this.pool; r++)
      if (!(this.workerStatus & 1 << r)) return r;
    return -1;
  }
  _onMessage(r, s) {
    const i = this.workersResolve[r];
    if (i && i(s), this.queue.length) {
      const { resolve: e, msg: t, transfer: n } = this.queue.shift();
      this.workersResolve[r] = e, this.workers[r].postMessage(t, n);
    } else
      this.workerStatus ^= 1 << r;
  }
  setWorkerCreator(r) {
    this.workerCreator = r;
  }
  setWorkerLimit(r) {
    this.pool = r;
  }
  postMessage(r, s) {
    return new Promise((i) => {
      const e = this._getIdleWorker();
      e !== -1 ? (this._initWorker(e), this.workerStatus |= 1 << e, this.workersResolve[e] = i, this.workers[e].postMessage(r, s)) : this.queue.push({ resolve: i, msg: r, transfer: s });
    });
  }
  dispose() {
    this.workers.forEach((r) => r.terminate()), this.workersResolve.length = 0, this.workers.length = 0, this.queue.length = 0, this.workerStatus = 0;
  }
}
const Ye = "dmFyIGNlPU9iamVjdC5kZWZpbmVQcm9wZXJ0eTt2YXIgbWU9KGosWixxKT0+WiBpbiBqP2NlKGosWix7ZW51bWVyYWJsZTohMCxjb25maWd1cmFibGU6ITAsd3JpdGFibGU6ITAsdmFsdWU6cX0pOmpbWl09cTt2YXIgTj0oaixaLHEpPT5tZShqLHR5cGVvZiBaIT0ic3ltYm9sIj9aKyIiOloscSk7KGZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO2Z1bmN0aW9uIGooQSxwKXtjb25zdCBrPW5ldyBGbG9hdDMyQXJyYXkoQS5sZW5ndGgpO2ZvcihsZXQgVT0wO1U8cC5sZW5ndGg7VSs9Myl7Y29uc3QgYT1wW1VdKjMsZT1wW1UrMV0qMyxyPXBbVSsyXSozLHM9QVthXSx0PUFbYSsxXSxuPUFbYSsyXSxoPUFbZV0saT1BW2UrMV0sbz1BW2UrMl0sYz1BW3JdLHU9QVtyKzFdLG09QVtyKzJdLHc9aC1zLGw9aS10LGY9by1uLGc9Yy1zLE09dS10LFY9bS1uLGQ9bCpWLWYqTSx5PWYqZy13KlYsST13Kk0tbCpnLHo9TWF0aC5zcXJ0KGQqZCt5KnkrSSpJKSx4PVswLDAsMV07aWYoej4wKXtjb25zdCB2PTEvejt4WzBdPWQqdix4WzFdPXkqdix4WzJdPUkqdn1mb3IobGV0IHY9MDt2PDM7disrKWtbYSt2XT1rW2Urdl09a1tyK3ZdPXhbdl19cmV0dXJuIGt9Y2xhc3MgWntjb25zdHJ1Y3RvcihwPTI1Nyl7Tih0aGlzLCJncmlkU2l6ZSIpO04odGhpcywibnVtVHJpYW5nbGVzIik7Tih0aGlzLCJudW1QYXJlbnRUcmlhbmdsZXMiKTtOKHRoaXMsImluZGljZXMiKTtOKHRoaXMsImNvb3JkcyIpO3RoaXMuZ3JpZFNpemU9cDtjb25zdCBrPXAtMTtpZihrJmstMSl0aHJvdyBuZXcgRXJyb3IoYEV4cGVjdGVkIGdyaWQgc2l6ZSB0byBiZSAyXm4rMSwgZ290ICR7cH0uYCk7dGhpcy5udW1UcmlhbmdsZXM9ayprKjItMix0aGlzLm51bVBhcmVudFRyaWFuZ2xlcz10aGlzLm51bVRyaWFuZ2xlcy1rKmssdGhpcy5pbmRpY2VzPW5ldyBVaW50MzJBcnJheSh0aGlzLmdyaWRTaXplKnRoaXMuZ3JpZFNpemUpLHRoaXMuY29vcmRzPW5ldyBVaW50MTZBcnJheSh0aGlzLm51bVRyaWFuZ2xlcyo0KTtmb3IobGV0IFU9MDtVPHRoaXMubnVtVHJpYW5nbGVzO1UrKyl7bGV0IGE9VSsyLGU9MCxyPTAscz0wLHQ9MCxuPTAsaD0wO2ZvcihhJjE/cz10PW49azplPXI9aD1rOyhhPj49MSk+MTspe2NvbnN0IG89ZStzPj4xLGM9cit0Pj4xO2EmMT8ocz1lLHQ9cixlPW4scj1oKTooZT1zLHI9dCxzPW4sdD1oKSxuPW8saD1jfWNvbnN0IGk9VSo0O3RoaXMuY29vcmRzW2krMF09ZSx0aGlzLmNvb3Jkc1tpKzFdPXIsdGhpcy5jb29yZHNbaSsyXT1zLHRoaXMuY29vcmRzW2krM109dH19Y3JlYXRlVGlsZShwKXtyZXR1cm4gbmV3IHEocCx0aGlzKX19Y2xhc3MgcXtjb25zdHJ1Y3RvcihwLGspe04odGhpcywibWFydGluaSIpO04odGhpcywidGVycmFpbiIpO04odGhpcywiZXJyb3JzIik7Y29uc3QgVT1rLmdyaWRTaXplO2lmKHAubGVuZ3RoIT09VSpVKXRocm93IG5ldyBFcnJvcihgRXhwZWN0ZWQgdGVycmFpbiBkYXRhIG9mIGxlbmd0aCAke1UqVX0gKCR7VX0geCAke1V9KSwgZ290ICR7cC5sZW5ndGh9LmApO3RoaXMudGVycmFpbj1wLHRoaXMubWFydGluaT1rLHRoaXMuZXJyb3JzPW5ldyBGbG9hdDMyQXJyYXkocC5sZW5ndGgpLHRoaXMudXBkYXRlKCl9dXBkYXRlKCl7Y29uc3R7bnVtVHJpYW5nbGVzOnAsbnVtUGFyZW50VHJpYW5nbGVzOmssY29vcmRzOlUsZ3JpZFNpemU6YX09dGhpcy5tYXJ0aW5pLHt0ZXJyYWluOmUsZXJyb3JzOnJ9PXRoaXM7Zm9yKGxldCBzPXAtMTtzPj0wO3MtLSl7Y29uc3QgdD1zKjQsbj1VW3QrMF0saD1VW3QrMV0saT1VW3QrMl0sbz1VW3QrM10sYz1uK2k+PjEsdT1oK28+PjEsbT1jK3UtaCx3PXUrbi1jLGw9KGVbaCphK25dK2VbbyphK2ldKS8yLGY9dSphK2MsZz1NYXRoLmFicyhsLWVbZl0pO2lmKHJbZl09TWF0aC5tYXgocltmXSxnKSxzPGspe2NvbnN0IE09KGgrdz4+MSkqYSsobittPj4xKSxWPShvK3c+PjEpKmErKGkrbT4+MSk7cltmXT1NYXRoLm1heChyW2ZdLHJbTV0scltWXSl9fX1nZXRHZW9tZXRyeURhdGEocD0wKXtjb25zdHtncmlkU2l6ZTprLGluZGljZXM6VX09dGhpcy5tYXJ0aW5pLHtlcnJvcnM6YX09dGhpcztsZXQgZT0wLHI9MDtjb25zdCBzPWstMTtsZXQgdCxuLGg9MDtVLmZpbGwoMCk7ZnVuY3Rpb24gaShmLGcsTSxWLGQseSl7Y29uc3QgST1mK00+PjEsej1nK1Y+PjE7TWF0aC5hYnMoZi1kKStNYXRoLmFicyhnLXkpPjEmJmFbeiprK0ldPnA/KGkoZCx5LGYsZyxJLHopLGkoTSxWLGQseSxJLHopKToodD1nKmsrZixuPVYqaytNLGg9eSprK2QsVVt0XT09PTAmJihVW3RdPSsrZSksVVtuXT09PTAmJihVW25dPSsrZSksVVtoXT09PTAmJihVW2hdPSsrZSkscisrKX1pKDAsMCxzLHMscywwKSxpKHMscywwLDAsMCxzKTtjb25zdCBvPWUqMixjPXIqMyx1PW5ldyBVaW50MTZBcnJheShvKSxtPW5ldyBVaW50MzJBcnJheShjKTtsZXQgdz0wO2Z1bmN0aW9uIGwoZixnLE0sVixkLHkpe2NvbnN0IEk9ZitNPj4xLHo9ZytWPj4xO2lmKE1hdGguYWJzKGYtZCkrTWF0aC5hYnMoZy15KT4xJiZhW3oqaytJXT5wKWwoZCx5LGYsZyxJLHopLGwoTSxWLGQseSxJLHopO2Vsc2V7Y29uc3QgeD1VW2cqaytmXS0xLHY9VVtWKmsrTV0tMSxEPVVbeSprK2RdLTE7dVsyKnhdPWYsdVsyKngrMV09Zyx1WzIqdl09TSx1WzIqdisxXT1WLHVbMipEXT1kLHVbMipEKzFdPXksbVt3KytdPXgsbVt3KytdPXYsbVt3KytdPUR9fXJldHVybiBsKDAsMCxzLHMscywwKSxsKHMscywwLDAsMCxzKSx7YXR0cmlidXRlczp0aGlzLl9nZXRNZXNoQXR0cmlidXRlcyh0aGlzLnRlcnJhaW4sdSxtKSxpbmRpY2VzOm19fV9nZXRNZXNoQXR0cmlidXRlcyhwLGssVSl7Y29uc3QgYT1NYXRoLmZsb29yKE1hdGguc3FydChwLmxlbmd0aCkpLGU9YS0xLHI9ay5sZW5ndGgvMixzPW5ldyBGbG9hdDMyQXJyYXkociozKSx0PW5ldyBGbG9hdDMyQXJyYXkocioyKTtmb3IobGV0IGg9MDtoPHI7aCsrKXtjb25zdCBpPWtbaCoyXSxvPWtbaCoyKzFdLGM9byphK2k7c1szKmgrMF09aS9lLS41LHNbMypoKzFdPS41LW8vZSxzWzMqaCsyXT1wW2NdLHRbMipoKzBdPWkvZSx0WzIqaCsxXT0xLW8vZX1jb25zdCBuPWoocyxVKTtyZXR1cm57cG9zaXRpb246e3ZhbHVlOnMsc2l6ZTozfSx0ZXhjb29yZDp7dmFsdWU6dCxzaXplOjJ9LG5vcm1hbDp7dmFsdWU6bixzaXplOjN9fX19LyogQ29weXJpZ2h0IDIwMTUtMjAyMSBFc3JpLiBMaWNlbnNlZCB1bmRlciB0aGUgQXBhY2hlIExpY2Vuc2UsIFZlcnNpb24gMi4wICh0aGUgIkxpY2Vuc2UiKTsgeW91IG1heSBub3QgdXNlIHRoaXMgZmlsZSBleGNlcHQgaW4gY29tcGxpYW5jZSB3aXRoIHRoZSBMaWNlbnNlLiBZb3UgbWF5IG9idGFpbiBhIGNvcHkgb2YgdGhlIExpY2Vuc2UgYXQgaHR0cDovL3d3dy5hcGFjaGUub3JnL2xpY2Vuc2VzL0xJQ0VOU0UtMi4wIEBwcmVzZXJ2ZSAqL2NvbnN0IGVlPWZ1bmN0aW9uKCl7dmFyIEE9e307QS5kZWZhdWx0Tm9EYXRhVmFsdWU9LTM0MDI3OTk5Mzg3OTAxNDg0ZTIyLEEuZGVjb2RlPWZ1bmN0aW9uKHIscyl7cz1zfHx7fTt2YXIgdD1zLmVuY29kZWRNYXNrRGF0YXx8cy5lbmNvZGVkTWFza0RhdGE9PT1udWxsLG49YShyLHMuaW5wdXRPZmZzZXR8fDAsdCksaD1zLm5vRGF0YVZhbHVlIT09bnVsbD9zLm5vRGF0YVZhbHVlOkEuZGVmYXVsdE5vRGF0YVZhbHVlLGk9cChuLHMucGl4ZWxUeXBlfHxGbG9hdDMyQXJyYXkscy5lbmNvZGVkTWFza0RhdGEsaCxzLnJldHVybk1hc2spLG89e3dpZHRoOm4ud2lkdGgsaGVpZ2h0Om4uaGVpZ2h0LHBpeGVsRGF0YTppLnJlc3VsdFBpeGVscyxtaW5WYWx1ZTppLm1pblZhbHVlLG1heFZhbHVlOm4ucGl4ZWxzLm1heFZhbHVlLG5vRGF0YVZhbHVlOmh9O3JldHVybiBpLnJlc3VsdE1hc2smJihvLm1hc2tEYXRhPWkucmVzdWx0TWFzaykscy5yZXR1cm5FbmNvZGVkTWFzayYmbi5tYXNrJiYoby5lbmNvZGVkTWFza0RhdGE9bi5tYXNrLmJpdHNldD9uLm1hc2suYml0c2V0Om51bGwpLHMucmV0dXJuRmlsZUluZm8mJihvLmZpbGVJbmZvPWsobikscy5jb21wdXRlVXNlZEJpdERlcHRocyYmKG8uZmlsZUluZm8uYml0RGVwdGhzPVUobikpKSxvfTt2YXIgcD1mdW5jdGlvbihyLHMsdCxuLGgpe3ZhciBpPTAsbz1yLnBpeGVscy5udW1CbG9ja3NYLGM9ci5waXhlbHMubnVtQmxvY2tzWSx1PU1hdGguZmxvb3Ioci53aWR0aC9vKSxtPU1hdGguZmxvb3Ioci5oZWlnaHQvYyksdz0yKnIubWF4WkVycm9yLGw9TnVtYmVyLk1BWF9WQUxVRSxmO3Q9dHx8KHIubWFzaz9yLm1hc2suYml0c2V0Om51bGwpO3ZhciBnLE07Zz1uZXcgcyhyLndpZHRoKnIuaGVpZ2h0KSxoJiZ0JiYoTT1uZXcgVWludDhBcnJheShyLndpZHRoKnIuaGVpZ2h0KSk7Zm9yKHZhciBWPW5ldyBGbG9hdDMyQXJyYXkodSptKSxkLHksST0wO0k8PWM7SSsrKXt2YXIgej1JIT09Yz9tOnIuaGVpZ2h0JWM7aWYoeiE9PTApZm9yKHZhciB4PTA7eDw9bzt4Kyspe3ZhciB2PXghPT1vP3U6ci53aWR0aCVvO2lmKHYhPT0wKXt2YXIgRD1JKnIud2lkdGgqbSt4KnUsVD1yLndpZHRoLXYsUz1yLnBpeGVscy5ibG9ja3NbaV0sQixMLEY7Uy5lbmNvZGluZzwyPyhTLmVuY29kaW5nPT09MD9CPVMucmF3RGF0YTooZShTLnN0dWZmZWREYXRhLFMuYml0c1BlclBpeGVsLFMubnVtVmFsaWRQaXhlbHMsUy5vZmZzZXQsdyxWLHIucGl4ZWxzLm1heFZhbHVlKSxCPVYpLEw9MCk6Uy5lbmNvZGluZz09PTI/Rj0wOkY9Uy5vZmZzZXQ7dmFyIGI7aWYodClmb3IoeT0wO3k8ejt5Kyspe2ZvcihEJjcmJihiPXRbRD4+M10sYjw8PUQmNyksZD0wO2Q8djtkKyspRCY3fHwoYj10W0Q+PjNdKSxiJjEyOD8oTSYmKE1bRF09MSksZj1TLmVuY29kaW5nPDI/QltMKytdOkYsbD1sPmY/ZjpsLGdbRCsrXT1mKTooTSYmKE1bRF09MCksZ1tEKytdPW4pLGI8PD0xO0QrPVR9ZWxzZSBpZihTLmVuY29kaW5nPDIpZm9yKHk9MDt5PHo7eSsrKXtmb3IoZD0wO2Q8djtkKyspZj1CW0wrK10sbD1sPmY/ZjpsLGdbRCsrXT1mO0QrPVR9ZWxzZSBmb3IobD1sPkY/RjpsLHk9MDt5PHo7eSsrKXtmb3IoZD0wO2Q8djtkKyspZ1tEKytdPUY7RCs9VH1pZihTLmVuY29kaW5nPT09MSYmTCE9PVMubnVtVmFsaWRQaXhlbHMpdGhyb3ciQmxvY2sgYW5kIE1hc2sgZG8gbm90IG1hdGNoIjtpKyt9fX1yZXR1cm57cmVzdWx0UGl4ZWxzOmcscmVzdWx0TWFzazpNLG1pblZhbHVlOmx9fSxrPWZ1bmN0aW9uKHIpe3JldHVybntmaWxlSWRlbnRpZmllclN0cmluZzpyLmZpbGVJZGVudGlmaWVyU3RyaW5nLGZpbGVWZXJzaW9uOnIuZmlsZVZlcnNpb24saW1hZ2VUeXBlOnIuaW1hZ2VUeXBlLGhlaWdodDpyLmhlaWdodCx3aWR0aDpyLndpZHRoLG1heFpFcnJvcjpyLm1heFpFcnJvcixlb2ZPZmZzZXQ6ci5lb2ZPZmZzZXQsbWFzazpyLm1hc2s/e251bUJsb2Nrc1g6ci5tYXNrLm51bUJsb2Nrc1gsbnVtQmxvY2tzWTpyLm1hc2subnVtQmxvY2tzWSxudW1CeXRlczpyLm1hc2subnVtQnl0ZXMsbWF4VmFsdWU6ci5tYXNrLm1heFZhbHVlfTpudWxsLHBpeGVsczp7bnVtQmxvY2tzWDpyLnBpeGVscy5udW1CbG9ja3NYLG51bUJsb2Nrc1k6ci5waXhlbHMubnVtQmxvY2tzWSxudW1CeXRlczpyLnBpeGVscy5udW1CeXRlcyxtYXhWYWx1ZTpyLnBpeGVscy5tYXhWYWx1ZSxub0RhdGFWYWx1ZTpyLm5vRGF0YVZhbHVlfX19LFU9ZnVuY3Rpb24ocil7Zm9yKHZhciBzPXIucGl4ZWxzLm51bUJsb2Nrc1gqci5waXhlbHMubnVtQmxvY2tzWSx0PXt9LG49MDtuPHM7bisrKXt2YXIgaD1yLnBpeGVscy5ibG9ja3Nbbl07aC5lbmNvZGluZz09PTA/dC5mbG9hdDMyPSEwOmguZW5jb2Rpbmc9PT0xP3RbaC5iaXRzUGVyUGl4ZWxdPSEwOnRbMF09ITB9cmV0dXJuIE9iamVjdC5rZXlzKHQpfSxhPWZ1bmN0aW9uKHIscyx0KXt2YXIgbj17fSxoPW5ldyBVaW50OEFycmF5KHIscywxMCk7aWYobi5maWxlSWRlbnRpZmllclN0cmluZz1TdHJpbmcuZnJvbUNoYXJDb2RlLmFwcGx5KG51bGwsaCksbi5maWxlSWRlbnRpZmllclN0cmluZy50cmltKCkhPT0iQ250WkltYWdlIil0aHJvdyJVbmV4cGVjdGVkIGZpbGUgaWRlbnRpZmllciBzdHJpbmc6ICIrbi5maWxlSWRlbnRpZmllclN0cmluZztzKz0xMDt2YXIgaT1uZXcgRGF0YVZpZXcocixzLDI0KTtpZihuLmZpbGVWZXJzaW9uPWkuZ2V0SW50MzIoMCwhMCksbi5pbWFnZVR5cGU9aS5nZXRJbnQzMig0LCEwKSxuLmhlaWdodD1pLmdldFVpbnQzMig4LCEwKSxuLndpZHRoPWkuZ2V0VWludDMyKDEyLCEwKSxuLm1heFpFcnJvcj1pLmdldEZsb2F0NjQoMTYsITApLHMrPTI0LCF0KWlmKGk9bmV3IERhdGFWaWV3KHIscywxNiksbi5tYXNrPXt9LG4ubWFzay5udW1CbG9ja3NZPWkuZ2V0VWludDMyKDAsITApLG4ubWFzay5udW1CbG9ja3NYPWkuZ2V0VWludDMyKDQsITApLG4ubWFzay5udW1CeXRlcz1pLmdldFVpbnQzMig4LCEwKSxuLm1hc2subWF4VmFsdWU9aS5nZXRGbG9hdDMyKDEyLCEwKSxzKz0xNixuLm1hc2subnVtQnl0ZXM+MCl7dmFyIG89bmV3IFVpbnQ4QXJyYXkoTWF0aC5jZWlsKG4ud2lkdGgqbi5oZWlnaHQvOCkpO2k9bmV3IERhdGFWaWV3KHIscyxuLm1hc2subnVtQnl0ZXMpO3ZhciBjPWkuZ2V0SW50MTYoMCwhMCksdT0yLG09MDtkb3tpZihjPjApZm9yKDtjLS07KW9bbSsrXT1pLmdldFVpbnQ4KHUrKyk7ZWxzZXt2YXIgdz1pLmdldFVpbnQ4KHUrKyk7Zm9yKGM9LWM7Yy0tOylvW20rK109d31jPWkuZ2V0SW50MTYodSwhMCksdSs9Mn13aGlsZSh1PG4ubWFzay5udW1CeXRlcyk7aWYoYyE9PS0zMjc2OHx8bTxvLmxlbmd0aCl0aHJvdyJVbmV4cGVjdGVkIGVuZCBvZiBtYXNrIFJMRSBlbmNvZGluZyI7bi5tYXNrLmJpdHNldD1vLHMrPW4ubWFzay5udW1CeXRlc31lbHNlIG4ubWFzay5udW1CeXRlc3xuLm1hc2subnVtQmxvY2tzWXxuLm1hc2subWF4VmFsdWV8fChuLm1hc2suYml0c2V0PW5ldyBVaW50OEFycmF5KE1hdGguY2VpbChuLndpZHRoKm4uaGVpZ2h0LzgpKSk7aT1uZXcgRGF0YVZpZXcocixzLDE2KSxuLnBpeGVscz17fSxuLnBpeGVscy5udW1CbG9ja3NZPWkuZ2V0VWludDMyKDAsITApLG4ucGl4ZWxzLm51bUJsb2Nrc1g9aS5nZXRVaW50MzIoNCwhMCksbi5waXhlbHMubnVtQnl0ZXM9aS5nZXRVaW50MzIoOCwhMCksbi5waXhlbHMubWF4VmFsdWU9aS5nZXRGbG9hdDMyKDEyLCEwKSxzKz0xNjt2YXIgbD1uLnBpeGVscy5udW1CbG9ja3NYLGY9bi5waXhlbHMubnVtQmxvY2tzWSxnPWwrKG4ud2lkdGglbD4wPzE6MCksTT1mKyhuLmhlaWdodCVmPjA/MTowKTtuLnBpeGVscy5ibG9ja3M9bmV3IEFycmF5KGcqTSk7Zm9yKHZhciBWPTAsZD0wO2Q8TTtkKyspZm9yKHZhciB5PTA7eTxnO3krKyl7dmFyIEk9MCx6PXIuYnl0ZUxlbmd0aC1zO2k9bmV3IERhdGFWaWV3KHIscyxNYXRoLm1pbigxMCx6KSk7dmFyIHg9e307bi5waXhlbHMuYmxvY2tzW1YrK109eDt2YXIgdj1pLmdldFVpbnQ4KDApO2lmKEkrKyx4LmVuY29kaW5nPXYmNjMseC5lbmNvZGluZz4zKXRocm93IkludmFsaWQgYmxvY2sgZW5jb2RpbmcgKCIreC5lbmNvZGluZysiKSI7aWYoeC5lbmNvZGluZz09PTIpe3MrKztjb250aW51ZX1pZih2IT09MCYmdiE9PTIpe2lmKHY+Pj02LHgub2Zmc2V0VHlwZT12LHY9PT0yKXgub2Zmc2V0PWkuZ2V0SW50OCgxKSxJKys7ZWxzZSBpZih2PT09MSl4Lm9mZnNldD1pLmdldEludDE2KDEsITApLEkrPTI7ZWxzZSBpZih2PT09MCl4Lm9mZnNldD1pLmdldEZsb2F0MzIoMSwhMCksSSs9NDtlbHNlIHRocm93IkludmFsaWQgYmxvY2sgb2Zmc2V0IHR5cGUiO2lmKHguZW5jb2Rpbmc9PT0xKWlmKHY9aS5nZXRVaW50OChJKSxJKysseC5iaXRzUGVyUGl4ZWw9diY2Myx2Pj49Nix4Lm51bVZhbGlkUGl4ZWxzVHlwZT12LHY9PT0yKXgubnVtVmFsaWRQaXhlbHM9aS5nZXRVaW50OChJKSxJKys7ZWxzZSBpZih2PT09MSl4Lm51bVZhbGlkUGl4ZWxzPWkuZ2V0VWludDE2KEksITApLEkrPTI7ZWxzZSBpZih2PT09MCl4Lm51bVZhbGlkUGl4ZWxzPWkuZ2V0VWludDMyKEksITApLEkrPTQ7ZWxzZSB0aHJvdyJJbnZhbGlkIHZhbGlkIHBpeGVsIGNvdW50IHR5cGUifWlmKHMrPUkseC5lbmNvZGluZyE9PTMpe3ZhciBELFQ7aWYoeC5lbmNvZGluZz09PTApe3ZhciBTPShuLnBpeGVscy5udW1CeXRlcy0xKS80O2lmKFMhPT1NYXRoLmZsb29yKFMpKXRocm93InVuY29tcHJlc3NlZCBibG9jayBoYXMgaW52YWxpZCBsZW5ndGgiO0Q9bmV3IEFycmF5QnVmZmVyKFMqNCksVD1uZXcgVWludDhBcnJheShEKSxULnNldChuZXcgVWludDhBcnJheShyLHMsUyo0KSk7dmFyIEI9bmV3IEZsb2F0MzJBcnJheShEKTt4LnJhd0RhdGE9QixzKz1TKjR9ZWxzZSBpZih4LmVuY29kaW5nPT09MSl7dmFyIEw9TWF0aC5jZWlsKHgubnVtVmFsaWRQaXhlbHMqeC5iaXRzUGVyUGl4ZWwvOCksRj1NYXRoLmNlaWwoTC80KTtEPW5ldyBBcnJheUJ1ZmZlcihGKjQpLFQ9bmV3IFVpbnQ4QXJyYXkoRCksVC5zZXQobmV3IFVpbnQ4QXJyYXkocixzLEwpKSx4LnN0dWZmZWREYXRhPW5ldyBVaW50MzJBcnJheShEKSxzKz1MfX19cmV0dXJuIG4uZW9mT2Zmc2V0PXMsbn0sZT1mdW5jdGlvbihyLHMsdCxuLGgsaSxvKXt2YXIgYz0oMTw8cyktMSx1PTAsbSx3PTAsbCxmLGc9TWF0aC5jZWlsKChvLW4pL2gpLE09ci5sZW5ndGgqNC1NYXRoLmNlaWwocyp0LzgpO2ZvcihyW3IubGVuZ3RoLTFdPDw9OCpNLG09MDttPHQ7bSsrKXtpZih3PT09MCYmKGY9clt1KytdLHc9MzIpLHc+PXMpbD1mPj4+dy1zJmMsdy09cztlbHNle3ZhciBWPXMtdztsPShmJmMpPDxWJmMsZj1yW3UrK10sdz0zMi1WLGwrPWY+Pj53fWlbbV09bDxnP24rbCpoOm99cmV0dXJuIGl9O3JldHVybiBBfSgpLHJlPWZ1bmN0aW9uKCl7dmFyIEE9e3Vuc3R1ZmY6ZnVuY3Rpb24oYSxlLHIscyx0LG4saCxpKXt2YXIgbz0oMTw8ciktMSxjPTAsdSxtPTAsdyxsLGYsZyxNPWEubGVuZ3RoKjQtTWF0aC5jZWlsKHIqcy84KTtpZihhW2EubGVuZ3RoLTFdPDw9OCpNLHQpZm9yKHU9MDt1PHM7dSsrKW09PT0wJiYobD1hW2MrK10sbT0zMiksbT49cj8odz1sPj4+bS1yJm8sbS09cik6KGY9ci1tLHc9KGwmbyk8PGYmbyxsPWFbYysrXSxtPTMyLWYsdys9bD4+Pm0pLGVbdV09dFt3XTtlbHNlIGZvcihnPU1hdGguY2VpbCgoaS1uKS9oKSx1PTA7dTxzO3UrKyltPT09MCYmKGw9YVtjKytdLG09MzIpLG0+PXI/KHc9bD4+Pm0tciZvLG0tPXIpOihmPXItbSx3PShsJm8pPDxmJm8sbD1hW2MrK10sbT0zMi1mLHcrPWw+Pj5tKSxlW3VdPXc8Zz9uK3cqaDppfSx1bnN0dWZmTFVUOmZ1bmN0aW9uKGEsZSxyLHMsdCxuKXt2YXIgaD0oMTw8ZSktMSxpPTAsbz0wLGM9MCx1PTAsbT0wLHcsbD1bXSxmPWEubGVuZ3RoKjQtTWF0aC5jZWlsKGUqci84KTthW2EubGVuZ3RoLTFdPDw9OCpmO3ZhciBnPU1hdGguY2VpbCgobi1zKS90KTtmb3Iobz0wO288cjtvKyspdT09PTAmJih3PWFbaSsrXSx1PTMyKSx1Pj1lPyhtPXc+Pj51LWUmaCx1LT1lKTooYz1lLXUsbT0odyZoKTw8YyZoLHc9YVtpKytdLHU9MzItYyxtKz13Pj4+dSksbFtvXT1tPGc/cyttKnQ6bjtyZXR1cm4gbC51bnNoaWZ0KHMpLGx9LHVuc3R1ZmYyOmZ1bmN0aW9uKGEsZSxyLHMsdCxuLGgsaSl7dmFyIG89KDE8PHIpLTEsYz0wLHUsbT0wLHc9MCxsLGYsZztpZih0KWZvcih1PTA7dTxzO3UrKyltPT09MCYmKGY9YVtjKytdLG09MzIsdz0wKSxtPj1yPyhsPWY+Pj53Jm8sbS09cix3Kz1yKTooZz1yLW0sbD1mPj4+dyZvLGY9YVtjKytdLG09MzItZyxsfD0oZiYoMTw8ZyktMSk8PHItZyx3PWcpLGVbdV09dFtsXTtlbHNle3ZhciBNPU1hdGguY2VpbCgoaS1uKS9oKTtmb3IodT0wO3U8czt1KyspbT09PTAmJihmPWFbYysrXSxtPTMyLHc9MCksbT49cj8obD1mPj4+dyZvLG0tPXIsdys9cik6KGc9ci1tLGw9Zj4+PncmbyxmPWFbYysrXSxtPTMyLWcsbHw9KGYmKDE8PGcpLTEpPDxyLWcsdz1nKSxlW3VdPWw8TT9uK2wqaDppfXJldHVybiBlfSx1bnN0dWZmTFVUMjpmdW5jdGlvbihhLGUscixzLHQsbil7dmFyIGg9KDE8PGUpLTEsaT0wLG89MCxjPTAsdT0wLG09MCx3PTAsbCxmPVtdLGc9TWF0aC5jZWlsKChuLXMpL3QpO2ZvcihvPTA7bzxyO28rKyl1PT09MCYmKGw9YVtpKytdLHU9MzIsdz0wKSx1Pj1lPyhtPWw+Pj53JmgsdS09ZSx3Kz1lKTooYz1lLXUsbT1sPj4+dyZoLGw9YVtpKytdLHU9MzItYyxtfD0obCYoMTw8YyktMSk8PGUtYyx3PWMpLGZbb109bTxnP3MrbSp0Om47cmV0dXJuIGYudW5zaGlmdChzKSxmfSxvcmlnaW5hbFVuc3R1ZmY6ZnVuY3Rpb24oYSxlLHIscyl7dmFyIHQ9KDE8PHIpLTEsbj0wLGgsaT0wLG8sYyx1LG09YS5sZW5ndGgqNC1NYXRoLmNlaWwocipzLzgpO2ZvcihhW2EubGVuZ3RoLTFdPDw9OCptLGg9MDtoPHM7aCsrKWk9PT0wJiYoYz1hW24rK10saT0zMiksaT49cj8obz1jPj4+aS1yJnQsaS09cik6KHU9ci1pLG89KGMmdCk8PHUmdCxjPWFbbisrXSxpPTMyLXUsbys9Yz4+PmkpLGVbaF09bztyZXR1cm4gZX0sb3JpZ2luYWxVbnN0dWZmMjpmdW5jdGlvbihhLGUscixzKXt2YXIgdD0oMTw8ciktMSxuPTAsaCxpPTAsbz0wLGMsdSxtO2ZvcihoPTA7aDxzO2grKylpPT09MCYmKHU9YVtuKytdLGk9MzIsbz0wKSxpPj1yPyhjPXU+Pj5vJnQsaS09cixvKz1yKToobT1yLWksYz11Pj4+byZ0LHU9YVtuKytdLGk9MzItbSxjfD0odSYoMTw8bSktMSk8PHItbSxvPW0pLGVbaF09YztyZXR1cm4gZX19LHA9e0hVRkZNQU5fTFVUX0JJVFNfTUFYOjEyLGNvbXB1dGVDaGVja3N1bUZsZXRjaGVyMzI6ZnVuY3Rpb24oYSl7Zm9yKHZhciBlPTY1NTM1LHI9NjU1MzUscz1hLmxlbmd0aCx0PU1hdGguZmxvb3Iocy8yKSxuPTA7dDspe3ZhciBoPXQ+PTM1OT8zNTk6dDt0LT1oO2RvIGUrPWFbbisrXTw8OCxyKz1lKz1hW24rK107d2hpbGUoLS1oKTtlPShlJjY1NTM1KSsoZT4+PjE2KSxyPShyJjY1NTM1KSsocj4+PjE2KX1yZXR1cm4gcyYxJiYocis9ZSs9YVtuXTw8OCksZT0oZSY2NTUzNSkrKGU+Pj4xNikscj0ociY2NTUzNSkrKHI+Pj4xNiksKHI8PDE2fGUpPj4+MH0scmVhZEhlYWRlckluZm86ZnVuY3Rpb24oYSxlKXt2YXIgcj1lLnB0cixzPW5ldyBVaW50OEFycmF5KGEsciw2KSx0PXt9O2lmKHQuZmlsZUlkZW50aWZpZXJTdHJpbmc9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLHMpLHQuZmlsZUlkZW50aWZpZXJTdHJpbmcubGFzdEluZGV4T2YoIkxlcmMyIiwwKSE9PTApdGhyb3ciVW5leHBlY3RlZCBmaWxlIGlkZW50aWZpZXIgc3RyaW5nIChleHBlY3QgTGVyYzIgKTogIit0LmZpbGVJZGVudGlmaWVyU3RyaW5nO3IrPTY7dmFyIG49bmV3IERhdGFWaWV3KGEsciw4KSxoPW4uZ2V0SW50MzIoMCwhMCk7dC5maWxlVmVyc2lvbj1oLHIrPTQsaD49MyYmKHQuY2hlY2tzdW09bi5nZXRVaW50MzIoNCwhMCkscis9NCksbj1uZXcgRGF0YVZpZXcoYSxyLDEyKSx0LmhlaWdodD1uLmdldFVpbnQzMigwLCEwKSx0LndpZHRoPW4uZ2V0VWludDMyKDQsITApLHIrPTgsaD49ND8odC5udW1EaW1zPW4uZ2V0VWludDMyKDgsITApLHIrPTQpOnQubnVtRGltcz0xLG49bmV3IERhdGFWaWV3KGEsciw0MCksdC5udW1WYWxpZFBpeGVsPW4uZ2V0VWludDMyKDAsITApLHQubWljcm9CbG9ja1NpemU9bi5nZXRJbnQzMig0LCEwKSx0LmJsb2JTaXplPW4uZ2V0SW50MzIoOCwhMCksdC5pbWFnZVR5cGU9bi5nZXRJbnQzMigxMiwhMCksdC5tYXhaRXJyb3I9bi5nZXRGbG9hdDY0KDE2LCEwKSx0LnpNaW49bi5nZXRGbG9hdDY0KDI0LCEwKSx0LnpNYXg9bi5nZXRGbG9hdDY0KDMyLCEwKSxyKz00MCxlLmhlYWRlckluZm89dCxlLnB0cj1yO3ZhciBpLG87aWYoaD49MyYmKG89aD49ND81Mjo0OCxpPXRoaXMuY29tcHV0ZUNoZWNrc3VtRmxldGNoZXIzMihuZXcgVWludDhBcnJheShhLHItbyx0LmJsb2JTaXplLTE0KSksaSE9PXQuY2hlY2tzdW0pKXRocm93IkNoZWNrc3VtIGZhaWxlZC4iO3JldHVybiEwfSxjaGVja01pbk1heFJhbmdlczpmdW5jdGlvbihhLGUpe3ZhciByPWUuaGVhZGVySW5mbyxzPXRoaXMuZ2V0RGF0YVR5cGVBcnJheShyLmltYWdlVHlwZSksdD1yLm51bURpbXMqdGhpcy5nZXREYXRhVHlwZVNpemUoci5pbWFnZVR5cGUpLG49dGhpcy5yZWFkU3ViQXJyYXkoYSxlLnB0cixzLHQpLGg9dGhpcy5yZWFkU3ViQXJyYXkoYSxlLnB0cit0LHMsdCk7ZS5wdHIrPTIqdDt2YXIgaSxvPSEwO2ZvcihpPTA7aTxyLm51bURpbXM7aSsrKWlmKG5baV0hPT1oW2ldKXtvPSExO2JyZWFrfXJldHVybiByLm1pblZhbHVlcz1uLHIubWF4VmFsdWVzPWgsb30scmVhZFN1YkFycmF5OmZ1bmN0aW9uKGEsZSxyLHMpe3ZhciB0O2lmKHI9PT1VaW50OEFycmF5KXQ9bmV3IFVpbnQ4QXJyYXkoYSxlLHMpO2Vsc2V7dmFyIG49bmV3IEFycmF5QnVmZmVyKHMpLGg9bmV3IFVpbnQ4QXJyYXkobik7aC5zZXQobmV3IFVpbnQ4QXJyYXkoYSxlLHMpKSx0PW5ldyByKG4pfXJldHVybiB0fSxyZWFkTWFzazpmdW5jdGlvbihhLGUpe3ZhciByPWUucHRyLHM9ZS5oZWFkZXJJbmZvLHQ9cy53aWR0aCpzLmhlaWdodCxuPXMubnVtVmFsaWRQaXhlbCxoPW5ldyBEYXRhVmlldyhhLHIsNCksaT17fTtpZihpLm51bUJ5dGVzPWguZ2V0VWludDMyKDAsITApLHIrPTQsKG49PT0wfHx0PT09bikmJmkubnVtQnl0ZXMhPT0wKXRocm93ImludmFsaWQgbWFzayI7dmFyIG8sYztpZihuPT09MClvPW5ldyBVaW50OEFycmF5KE1hdGguY2VpbCh0LzgpKSxpLmJpdHNldD1vLGM9bmV3IFVpbnQ4QXJyYXkodCksZS5waXhlbHMucmVzdWx0TWFzaz1jLHIrPWkubnVtQnl0ZXM7ZWxzZSBpZihpLm51bUJ5dGVzPjApe289bmV3IFVpbnQ4QXJyYXkoTWF0aC5jZWlsKHQvOCkpLGg9bmV3IERhdGFWaWV3KGEscixpLm51bUJ5dGVzKTt2YXIgdT1oLmdldEludDE2KDAsITApLG09Mix3PTAsbD0wO2Rve2lmKHU+MClmb3IoO3UtLTspb1t3KytdPWguZ2V0VWludDgobSsrKTtlbHNlIGZvcihsPWguZ2V0VWludDgobSsrKSx1PS11O3UtLTspb1t3KytdPWw7dT1oLmdldEludDE2KG0sITApLG0rPTJ9d2hpbGUobTxpLm51bUJ5dGVzKTtpZih1IT09LTMyNzY4fHx3PG8ubGVuZ3RoKXRocm93IlVuZXhwZWN0ZWQgZW5kIG9mIG1hc2sgUkxFIGVuY29kaW5nIjtjPW5ldyBVaW50OEFycmF5KHQpO3ZhciBmPTAsZz0wO2ZvcihnPTA7Zzx0O2crKylnJjc/KGY9b1tnPj4zXSxmPDw9ZyY3KTpmPW9bZz4+M10sZiYxMjgmJihjW2ddPTEpO2UucGl4ZWxzLnJlc3VsdE1hc2s9YyxpLmJpdHNldD1vLHIrPWkubnVtQnl0ZXN9cmV0dXJuIGUucHRyPXIsZS5tYXNrPWksITB9LHJlYWREYXRhT25lU3dlZXA6ZnVuY3Rpb24oYSxlLHIscyl7dmFyIHQ9ZS5wdHIsbj1lLmhlYWRlckluZm8saD1uLm51bURpbXMsaT1uLndpZHRoKm4uaGVpZ2h0LG89bi5pbWFnZVR5cGUsYz1uLm51bVZhbGlkUGl4ZWwqcC5nZXREYXRhVHlwZVNpemUobykqaCx1LG09ZS5waXhlbHMucmVzdWx0TWFzaztpZihyPT09VWludDhBcnJheSl1PW5ldyBVaW50OEFycmF5KGEsdCxjKTtlbHNle3ZhciB3PW5ldyBBcnJheUJ1ZmZlcihjKSxsPW5ldyBVaW50OEFycmF5KHcpO2wuc2V0KG5ldyBVaW50OEFycmF5KGEsdCxjKSksdT1uZXcgcih3KX1pZih1Lmxlbmd0aD09PWkqaClzP2UucGl4ZWxzLnJlc3VsdFBpeGVscz1wLnN3YXBEaW1lbnNpb25PcmRlcih1LGksaCxyLCEwKTplLnBpeGVscy5yZXN1bHRQaXhlbHM9dTtlbHNle2UucGl4ZWxzLnJlc3VsdFBpeGVscz1uZXcgcihpKmgpO3ZhciBmPTAsZz0wLE09MCxWPTA7aWYoaD4xKXtpZihzKXtmb3IoZz0wO2c8aTtnKyspaWYobVtnXSlmb3IoVj1nLE09MDtNPGg7TSsrLFYrPWkpZS5waXhlbHMucmVzdWx0UGl4ZWxzW1ZdPXVbZisrXX1lbHNlIGZvcihnPTA7ZzxpO2crKylpZihtW2ddKWZvcihWPWcqaCxNPTA7TTxoO00rKyllLnBpeGVscy5yZXN1bHRQaXhlbHNbVitNXT11W2YrK119ZWxzZSBmb3IoZz0wO2c8aTtnKyspbVtnXSYmKGUucGl4ZWxzLnJlc3VsdFBpeGVsc1tnXT11W2YrK10pfXJldHVybiB0Kz1jLGUucHRyPXQsITB9LHJlYWRIdWZmbWFuVHJlZTpmdW5jdGlvbihhLGUpe3ZhciByPXRoaXMuSFVGRk1BTl9MVVRfQklUU19NQVgscz1uZXcgRGF0YVZpZXcoYSxlLnB0ciwxNik7ZS5wdHIrPTE2O3ZhciB0PXMuZ2V0SW50MzIoMCwhMCk7aWYodDwyKXRocm93InVuc3VwcG9ydGVkIEh1ZmZtYW4gdmVyc2lvbiI7dmFyIG49cy5nZXRJbnQzMig0LCEwKSxoPXMuZ2V0SW50MzIoOCwhMCksaT1zLmdldEludDMyKDEyLCEwKTtpZihoPj1pKXJldHVybiExO3ZhciBvPW5ldyBVaW50MzJBcnJheShpLWgpO3AuZGVjb2RlQml0cyhhLGUsbyk7dmFyIGM9W10sdSxtLHcsbDtmb3IodT1oO3U8aTt1KyspbT11LSh1PG4/MDpuKSxjW21dPXtmaXJzdDpvW3UtaF0sc2Vjb25kOm51bGx9O3ZhciBmPWEuYnl0ZUxlbmd0aC1lLnB0cixnPU1hdGguY2VpbChmLzQpLE09bmV3IEFycmF5QnVmZmVyKGcqNCksVj1uZXcgVWludDhBcnJheShNKTtWLnNldChuZXcgVWludDhBcnJheShhLGUucHRyLGYpKTt2YXIgZD1uZXcgVWludDMyQXJyYXkoTSkseT0wLEksej0wO2ZvcihJPWRbMF0sdT1oO3U8aTt1KyspbT11LSh1PG4/MDpuKSxsPWNbbV0uZmlyc3QsbD4wJiYoY1ttXS5zZWNvbmQ9STw8eT4+PjMyLWwsMzIteT49bD8oeSs9bCx5PT09MzImJih5PTAseisrLEk9ZFt6XSkpOih5Kz1sLTMyLHorKyxJPWRbel0sY1ttXS5zZWNvbmR8PUk+Pj4zMi15KSk7dmFyIHg9MCx2PTAsRD1uZXcgaztmb3IodT0wO3U8Yy5sZW5ndGg7dSsrKWNbdV0hPT12b2lkIDAmJih4PU1hdGgubWF4KHgsY1t1XS5maXJzdCkpO3g+PXI/dj1yOnY9eDt2YXIgVD1bXSxTLEIsTCxGLGIsQztmb3IodT1oO3U8aTt1KyspaWYobT11LSh1PG4/MDpuKSxsPWNbbV0uZmlyc3QsbD4wKWlmKFM9W2wsbV0sbDw9dilmb3IoQj1jW21dLnNlY29uZDw8di1sLEw9MTw8di1sLHc9MDt3PEw7dysrKVRbQnx3XT1TO2Vsc2UgZm9yKEI9Y1ttXS5zZWNvbmQsQz1ELEY9bC0xO0Y+PTA7Ri0tKWI9Qj4+PkYmMSxiPyhDLnJpZ2h0fHwoQy5yaWdodD1uZXcgayksQz1DLnJpZ2h0KTooQy5sZWZ0fHwoQy5sZWZ0PW5ldyBrKSxDPUMubGVmdCksRj09PTAmJiFDLnZhbCYmKEMudmFsPVNbMV0pO3JldHVybntkZWNvZGVMdXQ6VCxudW1CaXRzTFVUUWljazp2LG51bUJpdHNMVVQ6eCx0cmVlOkQsc3R1ZmZlZERhdGE6ZCxzcmNQdHI6eixiaXRQb3M6eX19LHJlYWRIdWZmbWFuOmZ1bmN0aW9uKGEsZSxyLHMpe3ZhciB0PWUuaGVhZGVySW5mbyxuPXQubnVtRGltcyxoPWUuaGVhZGVySW5mby5oZWlnaHQsaT1lLmhlYWRlckluZm8ud2lkdGgsbz1pKmgsYz10aGlzLnJlYWRIdWZmbWFuVHJlZShhLGUpLHU9Yy5kZWNvZGVMdXQsbT1jLnRyZWUsdz1jLnN0dWZmZWREYXRhLGw9Yy5zcmNQdHIsZj1jLmJpdFBvcyxnPWMubnVtQml0c0xVVFFpY2ssTT1jLm51bUJpdHNMVVQsVj1lLmhlYWRlckluZm8uaW1hZ2VUeXBlPT09MD8xMjg6MCxkLHksSSx6PWUucGl4ZWxzLnJlc3VsdE1hc2sseCx2LEQsVCxTLEIsTCxGPTA7Zj4wJiYobCsrLGY9MCk7dmFyIGI9d1tsXSxDPWUuZW5jb2RlTW9kZT09PTEsUj1uZXcgcihvKm4pLE89UixYO2lmKG48Mnx8Qyl7Zm9yKFg9MDtYPG47WCsrKWlmKG4+MSYmKE89bmV3IHIoUi5idWZmZXIsbypYLG8pLEY9MCksZS5oZWFkZXJJbmZvLm51bVZhbGlkUGl4ZWw9PT1pKmgpZm9yKEI9MCxUPTA7VDxoO1QrKylmb3IoUz0wO1M8aTtTKyssQisrKXtpZih5PTAseD1iPDxmPj4+MzItZyx2PXgsMzItZjxnJiYoeHw9d1tsKzFdPj4+NjQtZi1nLHY9eCksdVt2XSl5PXVbdl1bMV0sZis9dVt2XVswXTtlbHNlIGZvcih4PWI8PGY+Pj4zMi1NLHY9eCwzMi1mPE0mJih4fD13W2wrMV0+Pj42NC1mLU0sdj14KSxkPW0sTD0wO0w8TTtMKyspaWYoRD14Pj4+TS1MLTEmMSxkPUQ/ZC5yaWdodDpkLmxlZnQsIShkLmxlZnR8fGQucmlnaHQpKXt5PWQudmFsLGY9ZitMKzE7YnJlYWt9Zj49MzImJihmLT0zMixsKyssYj13W2xdKSxJPXktVixDPyhTPjA/SSs9RjpUPjA/SSs9T1tCLWldOkkrPUYsSSY9MjU1LE9bQl09SSxGPUkpOk9bQl09SX1lbHNlIGZvcihCPTAsVD0wO1Q8aDtUKyspZm9yKFM9MDtTPGk7UysrLEIrKylpZih6W0JdKXtpZih5PTAseD1iPDxmPj4+MzItZyx2PXgsMzItZjxnJiYoeHw9d1tsKzFdPj4+NjQtZi1nLHY9eCksdVt2XSl5PXVbdl1bMV0sZis9dVt2XVswXTtlbHNlIGZvcih4PWI8PGY+Pj4zMi1NLHY9eCwzMi1mPE0mJih4fD13W2wrMV0+Pj42NC1mLU0sdj14KSxkPW0sTD0wO0w8TTtMKyspaWYoRD14Pj4+TS1MLTEmMSxkPUQ/ZC5yaWdodDpkLmxlZnQsIShkLmxlZnR8fGQucmlnaHQpKXt5PWQudmFsLGY9ZitMKzE7YnJlYWt9Zj49MzImJihmLT0zMixsKyssYj13W2xdKSxJPXktVixDPyhTPjAmJnpbQi0xXT9JKz1GOlQ+MCYmeltCLWldP0krPU9bQi1pXTpJKz1GLEkmPTI1NSxPW0JdPUksRj1JKTpPW0JdPUl9fWVsc2UgZm9yKEI9MCxUPTA7VDxoO1QrKylmb3IoUz0wO1M8aTtTKyspaWYoQj1UKmkrUywhenx8eltCXSlmb3IoWD0wO1g8bjtYKyssQis9byl7aWYoeT0wLHg9Yjw8Zj4+PjMyLWcsdj14LDMyLWY8ZyYmKHh8PXdbbCsxXT4+PjY0LWYtZyx2PXgpLHVbdl0peT11W3ZdWzFdLGYrPXVbdl1bMF07ZWxzZSBmb3IoeD1iPDxmPj4+MzItTSx2PXgsMzItZjxNJiYoeHw9d1tsKzFdPj4+NjQtZi1NLHY9eCksZD1tLEw9MDtMPE07TCsrKWlmKEQ9eD4+Pk0tTC0xJjEsZD1EP2QucmlnaHQ6ZC5sZWZ0LCEoZC5sZWZ0fHxkLnJpZ2h0KSl7eT1kLnZhbCxmPWYrTCsxO2JyZWFrfWY+PTMyJiYoZi09MzIsbCsrLGI9d1tsXSksST15LVYsT1tCXT1JfWUucHRyPWUucHRyKyhsKzEpKjQrKGY+MD80OjApLGUucGl4ZWxzLnJlc3VsdFBpeGVscz1SLG4+MSYmIXMmJihlLnBpeGVscy5yZXN1bHRQaXhlbHM9cC5zd2FwRGltZW5zaW9uT3JkZXIoUixvLG4scikpfSxkZWNvZGVCaXRzOmZ1bmN0aW9uKGEsZSxyLHMsdCl7e3ZhciBuPWUuaGVhZGVySW5mbyxoPW4uZmlsZVZlcnNpb24saT0wLG89YS5ieXRlTGVuZ3RoLWUucHRyPj01PzU6YS5ieXRlTGVuZ3RoLWUucHRyLGM9bmV3IERhdGFWaWV3KGEsZS5wdHIsbyksdT1jLmdldFVpbnQ4KDApO2krKzt2YXIgbT11Pj42LHc9bT09PTA/NDozLW0sbD0odSYzMik+MCxmPXUmMzEsZz0wO2lmKHc9PT0xKWc9Yy5nZXRVaW50OChpKSxpKys7ZWxzZSBpZih3PT09MilnPWMuZ2V0VWludDE2KGksITApLGkrPTI7ZWxzZSBpZih3PT09NClnPWMuZ2V0VWludDMyKGksITApLGkrPTQ7ZWxzZSB0aHJvdyJJbnZhbGlkIHZhbGlkIHBpeGVsIGNvdW50IHR5cGUiO3ZhciBNPTIqbi5tYXhaRXJyb3IsVixkLHksSSx6LHgsdixELFQsUz1uLm51bURpbXM+MT9uLm1heFZhbHVlc1t0XTpuLnpNYXg7aWYobCl7Zm9yKGUuY291bnRlci5sdXQrKyxEPWMuZ2V0VWludDgoaSksaSsrLEk9TWF0aC5jZWlsKChELTEpKmYvOCksej1NYXRoLmNlaWwoSS80KSxkPW5ldyBBcnJheUJ1ZmZlcih6KjQpLHk9bmV3IFVpbnQ4QXJyYXkoZCksZS5wdHIrPWkseS5zZXQobmV3IFVpbnQ4QXJyYXkoYSxlLnB0cixJKSksdj1uZXcgVWludDMyQXJyYXkoZCksZS5wdHIrPUksVD0wO0QtMT4+PlQ7KVQrKztJPU1hdGguY2VpbChnKlQvOCksej1NYXRoLmNlaWwoSS80KSxkPW5ldyBBcnJheUJ1ZmZlcih6KjQpLHk9bmV3IFVpbnQ4QXJyYXkoZCkseS5zZXQobmV3IFVpbnQ4QXJyYXkoYSxlLnB0cixJKSksVj1uZXcgVWludDMyQXJyYXkoZCksZS5wdHIrPUksaD49Mz94PUEudW5zdHVmZkxVVDIodixmLEQtMSxzLE0sUyk6eD1BLnVuc3R1ZmZMVVQodixmLEQtMSxzLE0sUyksaD49Mz9BLnVuc3R1ZmYyKFYscixULGcseCk6QS51bnN0dWZmKFYscixULGcseCl9ZWxzZSBlLmNvdW50ZXIuYml0c3R1ZmZlcisrLFQ9ZixlLnB0cis9aSxUPjAmJihJPU1hdGguY2VpbChnKlQvOCksej1NYXRoLmNlaWwoSS80KSxkPW5ldyBBcnJheUJ1ZmZlcih6KjQpLHk9bmV3IFVpbnQ4QXJyYXkoZCkseS5zZXQobmV3IFVpbnQ4QXJyYXkoYSxlLnB0cixJKSksVj1uZXcgVWludDMyQXJyYXkoZCksZS5wdHIrPUksaD49Mz9zPT1udWxsP0Eub3JpZ2luYWxVbnN0dWZmMihWLHIsVCxnKTpBLnVuc3R1ZmYyKFYscixULGcsITEscyxNLFMpOnM9PW51bGw/QS5vcmlnaW5hbFVuc3R1ZmYoVixyLFQsZyk6QS51bnN0dWZmKFYscixULGcsITEscyxNLFMpKX19LHJlYWRUaWxlczpmdW5jdGlvbihhLGUscixzKXt2YXIgdD1lLmhlYWRlckluZm8sbj10LndpZHRoLGg9dC5oZWlnaHQsaT1uKmgsbz10Lm1pY3JvQmxvY2tTaXplLGM9dC5pbWFnZVR5cGUsdT1wLmdldERhdGFUeXBlU2l6ZShjKSxtPU1hdGguY2VpbChuL28pLHc9TWF0aC5jZWlsKGgvbyk7ZS5waXhlbHMubnVtQmxvY2tzWT13LGUucGl4ZWxzLm51bUJsb2Nrc1g9bSxlLnBpeGVscy5wdHI9MDt2YXIgbD0wLGY9MCxnPTAsTT0wLFY9MCxkPTAseT0wLEk9MCx6PTAseD0wLHY9MCxEPTAsVD0wLFM9MCxCPTAsTD0wLEYsYixDLFIsTyxYLEc9bmV3IHIobypvKSxsZT1oJW98fG8sdWU9biVvfHxvLEssUSxKPXQubnVtRGltcywkLEU9ZS5waXhlbHMucmVzdWx0TWFzayxZPWUucGl4ZWxzLnJlc3VsdFBpeGVscyxoZT10LmZpbGVWZXJzaW9uLFA9aGU+PTU/MTQ6MTUsXyxXPXQuek1heCxIO2ZvcihnPTA7Zzx3O2crKylmb3IoVj1nIT09dy0xP286bGUsTT0wO008bTtNKyspZm9yKGQ9TSE9PW0tMT9vOnVlLHY9ZypuKm8rTSpvLEQ9bi1kLCQ9MDskPEo7JCsrKXtpZihKPjE/KEg9WSx2PWcqbipvK00qbyxZPW5ldyByKGUucGl4ZWxzLnJlc3VsdFBpeGVscy5idWZmZXIsaSokKnUsaSksVz10Lm1heFZhbHVlc1skXSk6SD1udWxsLHk9YS5ieXRlTGVuZ3RoLWUucHRyLEY9bmV3IERhdGFWaWV3KGEsZS5wdHIsTWF0aC5taW4oMTAseSkpLGI9e30sTD0wLEk9Ri5nZXRVaW50OCgwKSxMKyssXz10LmZpbGVWZXJzaW9uPj01P0kmNDowLHo9ST4+NiYyNTUseD1JPj4yJlAseCE9PShNKm8+PjMmUCl8fF8mJiQ9PT0wKXRocm93ImludGVncml0eSBpc3N1ZSI7aWYoWD1JJjMsWD4zKXRocm93IGUucHRyKz1MLCJJbnZhbGlkIGJsb2NrIGVuY29kaW5nICgiK1grIikiO2lmKFg9PT0yKXtpZihfKWlmKEUpZm9yKGw9MDtsPFY7bCsrKWZvcihmPTA7ZjxkO2YrKylFW3ZdJiYoWVt2XT1IW3ZdKSx2Kys7ZWxzZSBmb3IobD0wO2w8VjtsKyspZm9yKGY9MDtmPGQ7ZisrKVlbdl09SFt2XSx2Kys7ZS5jb3VudGVyLmNvbnN0YW50KyssZS5wdHIrPUw7Y29udGludWV9ZWxzZSBpZihYPT09MCl7aWYoXyl0aHJvdyJpbnRlZ3JpdHkgaXNzdWUiO2lmKGUuY291bnRlci51bmNvbXByZXNzZWQrKyxlLnB0cis9TCxUPVYqZCp1LFM9YS5ieXRlTGVuZ3RoLWUucHRyLFQ9VDxTP1Q6UyxDPW5ldyBBcnJheUJ1ZmZlcihUJXU9PT0wP1Q6VCt1LVQldSksUj1uZXcgVWludDhBcnJheShDKSxSLnNldChuZXcgVWludDhBcnJheShhLGUucHRyLFQpKSxPPW5ldyByKEMpLEI9MCxFKWZvcihsPTA7bDxWO2wrKyl7Zm9yKGY9MDtmPGQ7ZisrKUVbdl0mJihZW3ZdPU9bQisrXSksdisrO3YrPUR9ZWxzZSBmb3IobD0wO2w8VjtsKyspe2ZvcihmPTA7ZjxkO2YrKylZW3YrK109T1tCKytdO3YrPUR9ZS5wdHIrPUIqdX1lbHNlIGlmKEs9cC5nZXREYXRhVHlwZVVzZWQoXyYmYzw2PzQ6Yyx6KSxRPXAuZ2V0T25lUGl4ZWwoYixMLEssRiksTCs9cC5nZXREYXRhVHlwZVNpemUoSyksWD09PTMpaWYoZS5wdHIrPUwsZS5jb3VudGVyLmNvbnN0YW50b2Zmc2V0KyssRSlmb3IobD0wO2w8VjtsKyspe2ZvcihmPTA7ZjxkO2YrKylFW3ZdJiYoWVt2XT1fP01hdGgubWluKFcsSFt2XStRKTpRKSx2Kys7dis9RH1lbHNlIGZvcihsPTA7bDxWO2wrKyl7Zm9yKGY9MDtmPGQ7ZisrKVlbdl09Xz9NYXRoLm1pbihXLEhbdl0rUSk6USx2Kys7dis9RH1lbHNlIGlmKGUucHRyKz1MLHAuZGVjb2RlQml0cyhhLGUsRyxRLCQpLEw9MCxfKWlmKEUpZm9yKGw9MDtsPFY7bCsrKXtmb3IoZj0wO2Y8ZDtmKyspRVt2XSYmKFlbdl09R1tMKytdK0hbdl0pLHYrKzt2Kz1EfWVsc2UgZm9yKGw9MDtsPFY7bCsrKXtmb3IoZj0wO2Y8ZDtmKyspWVt2XT1HW0wrK10rSFt2XSx2Kys7dis9RH1lbHNlIGlmKEUpZm9yKGw9MDtsPFY7bCsrKXtmb3IoZj0wO2Y8ZDtmKyspRVt2XSYmKFlbdl09R1tMKytdKSx2Kys7dis9RH1lbHNlIGZvcihsPTA7bDxWO2wrKyl7Zm9yKGY9MDtmPGQ7ZisrKVlbdisrXT1HW0wrK107dis9RH19Sj4xJiYhcyYmKGUucGl4ZWxzLnJlc3VsdFBpeGVscz1wLnN3YXBEaW1lbnNpb25PcmRlcihlLnBpeGVscy5yZXN1bHRQaXhlbHMsaSxKLHIpKX0sZm9ybWF0RmlsZUluZm86ZnVuY3Rpb24oYSl7cmV0dXJue2ZpbGVJZGVudGlmaWVyU3RyaW5nOmEuaGVhZGVySW5mby5maWxlSWRlbnRpZmllclN0cmluZyxmaWxlVmVyc2lvbjphLmhlYWRlckluZm8uZmlsZVZlcnNpb24saW1hZ2VUeXBlOmEuaGVhZGVySW5mby5pbWFnZVR5cGUsaGVpZ2h0OmEuaGVhZGVySW5mby5oZWlnaHQsd2lkdGg6YS5oZWFkZXJJbmZvLndpZHRoLG51bVZhbGlkUGl4ZWw6YS5oZWFkZXJJbmZvLm51bVZhbGlkUGl4ZWwsbWljcm9CbG9ja1NpemU6YS5oZWFkZXJJbmZvLm1pY3JvQmxvY2tTaXplLGJsb2JTaXplOmEuaGVhZGVySW5mby5ibG9iU2l6ZSxtYXhaRXJyb3I6YS5oZWFkZXJJbmZvLm1heFpFcnJvcixwaXhlbFR5cGU6cC5nZXRQaXhlbFR5cGUoYS5oZWFkZXJJbmZvLmltYWdlVHlwZSksZW9mT2Zmc2V0OmEuZW9mT2Zmc2V0LG1hc2s6YS5tYXNrP3tudW1CeXRlczphLm1hc2subnVtQnl0ZXN9Om51bGwscGl4ZWxzOntudW1CbG9ja3NYOmEucGl4ZWxzLm51bUJsb2Nrc1gsbnVtQmxvY2tzWTphLnBpeGVscy5udW1CbG9ja3NZLG1heFZhbHVlOmEuaGVhZGVySW5mby56TWF4LG1pblZhbHVlOmEuaGVhZGVySW5mby56TWluLG5vRGF0YVZhbHVlOmEubm9EYXRhVmFsdWV9fX0sY29uc3RydWN0Q29uc3RhbnRTdXJmYWNlOmZ1bmN0aW9uKGEsZSl7dmFyIHI9YS5oZWFkZXJJbmZvLnpNYXgscz1hLmhlYWRlckluZm8uek1pbix0PWEuaGVhZGVySW5mby5tYXhWYWx1ZXMsbj1hLmhlYWRlckluZm8ubnVtRGltcyxoPWEuaGVhZGVySW5mby5oZWlnaHQqYS5oZWFkZXJJbmZvLndpZHRoLGk9MCxvPTAsYz0wLHU9YS5waXhlbHMucmVzdWx0TWFzayxtPWEucGl4ZWxzLnJlc3VsdFBpeGVscztpZih1KWlmKG4+MSl7aWYoZSlmb3IoaT0wO2k8bjtpKyspZm9yKGM9aSpoLHI9dFtpXSxvPTA7bzxoO28rKyl1W29dJiYobVtjK29dPXIpO2Vsc2UgZm9yKG89MDtvPGg7bysrKWlmKHVbb10pZm9yKGM9bypuLGk9MDtpPG47aSsrKW1bYytuXT10W2ldfWVsc2UgZm9yKG89MDtvPGg7bysrKXVbb10mJihtW29dPXIpO2Vsc2UgaWYobj4xJiZzIT09cilpZihlKWZvcihpPTA7aTxuO2krKylmb3IoYz1pKmgscj10W2ldLG89MDtvPGg7bysrKW1bYytvXT1yO2Vsc2UgZm9yKG89MDtvPGg7bysrKWZvcihjPW8qbixpPTA7aTxuO2krKyltW2MraV09dFtpXTtlbHNlIGZvcihvPTA7bzxoKm47bysrKW1bb109cn0sZ2V0RGF0YVR5cGVBcnJheTpmdW5jdGlvbihhKXt2YXIgZTtzd2l0Y2goYSl7Y2FzZSAwOmU9SW50OEFycmF5O2JyZWFrO2Nhc2UgMTplPVVpbnQ4QXJyYXk7YnJlYWs7Y2FzZSAyOmU9SW50MTZBcnJheTticmVhaztjYXNlIDM6ZT1VaW50MTZBcnJheTticmVhaztjYXNlIDQ6ZT1JbnQzMkFycmF5O2JyZWFrO2Nhc2UgNTplPVVpbnQzMkFycmF5O2JyZWFrO2Nhc2UgNjplPUZsb2F0MzJBcnJheTticmVhaztjYXNlIDc6ZT1GbG9hdDY0QXJyYXk7YnJlYWs7ZGVmYXVsdDplPUZsb2F0MzJBcnJheX1yZXR1cm4gZX0sZ2V0UGl4ZWxUeXBlOmZ1bmN0aW9uKGEpe3ZhciBlO3N3aXRjaChhKXtjYXNlIDA6ZT0iUzgiO2JyZWFrO2Nhc2UgMTplPSJVOCI7YnJlYWs7Y2FzZSAyOmU9IlMxNiI7YnJlYWs7Y2FzZSAzOmU9IlUxNiI7YnJlYWs7Y2FzZSA0OmU9IlMzMiI7YnJlYWs7Y2FzZSA1OmU9IlUzMiI7YnJlYWs7Y2FzZSA2OmU9IkYzMiI7YnJlYWs7Y2FzZSA3OmU9IkY2NCI7YnJlYWs7ZGVmYXVsdDplPSJGMzIifXJldHVybiBlfSxpc1ZhbGlkUGl4ZWxWYWx1ZTpmdW5jdGlvbihhLGUpe2lmKGU9PW51bGwpcmV0dXJuITE7dmFyIHI7c3dpdGNoKGEpe2Nhc2UgMDpyPWU+PS0xMjgmJmU8PTEyNzticmVhaztjYXNlIDE6cj1lPj0wJiZlPD0yNTU7YnJlYWs7Y2FzZSAyOnI9ZT49LTMyNzY4JiZlPD0zMjc2NzticmVhaztjYXNlIDM6cj1lPj0wJiZlPD02NTUzNjticmVhaztjYXNlIDQ6cj1lPj0tMjE0NzQ4MzY0OCYmZTw9MjE0NzQ4MzY0NzticmVhaztjYXNlIDU6cj1lPj0wJiZlPD00Mjk0OTY3Mjk2O2JyZWFrO2Nhc2UgNjpyPWU+PS0zNDAyNzk5OTM4NzkwMTQ4NGUyMiYmZTw9MzQwMjc5OTkzODc5MDE0ODRlMjI7YnJlYWs7Y2FzZSA3OnI9ZT49LTE3OTc2OTMxMzQ4NjIzMTU3ZTI5MiYmZTw9MTc5NzY5MzEzNDg2MjMxNTdlMjkyO2JyZWFrO2RlZmF1bHQ6cj0hMX1yZXR1cm4gcn0sZ2V0RGF0YVR5cGVTaXplOmZ1bmN0aW9uKGEpe3ZhciBlPTA7c3dpdGNoKGEpe2Nhc2UgMDpjYXNlIDE6ZT0xO2JyZWFrO2Nhc2UgMjpjYXNlIDM6ZT0yO2JyZWFrO2Nhc2UgNDpjYXNlIDU6Y2FzZSA2OmU9NDticmVhaztjYXNlIDc6ZT04O2JyZWFrO2RlZmF1bHQ6ZT1hfXJldHVybiBlfSxnZXREYXRhVHlwZVVzZWQ6ZnVuY3Rpb24oYSxlKXt2YXIgcj1hO3N3aXRjaChhKXtjYXNlIDI6Y2FzZSA0OnI9YS1lO2JyZWFrO2Nhc2UgMzpjYXNlIDU6cj1hLTIqZTticmVhaztjYXNlIDY6ZT09PTA/cj1hOmU9PT0xP3I9MjpyPTE7YnJlYWs7Y2FzZSA3OmU9PT0wP3I9YTpyPWEtMiplKzE7YnJlYWs7ZGVmYXVsdDpyPWE7YnJlYWt9cmV0dXJuIHJ9LGdldE9uZVBpeGVsOmZ1bmN0aW9uKGEsZSxyLHMpe3ZhciB0PTA7c3dpdGNoKHIpe2Nhc2UgMDp0PXMuZ2V0SW50OChlKTticmVhaztjYXNlIDE6dD1zLmdldFVpbnQ4KGUpO2JyZWFrO2Nhc2UgMjp0PXMuZ2V0SW50MTYoZSwhMCk7YnJlYWs7Y2FzZSAzOnQ9cy5nZXRVaW50MTYoZSwhMCk7YnJlYWs7Y2FzZSA0OnQ9cy5nZXRJbnQzMihlLCEwKTticmVhaztjYXNlIDU6dD1zLmdldFVJbnQzMihlLCEwKTticmVhaztjYXNlIDY6dD1zLmdldEZsb2F0MzIoZSwhMCk7YnJlYWs7Y2FzZSA3OnQ9cy5nZXRGbG9hdDY0KGUsITApO2JyZWFrO2RlZmF1bHQ6dGhyb3cidGhlIGRlY29kZXIgZG9lcyBub3QgdW5kZXJzdGFuZCB0aGlzIHBpeGVsIHR5cGUifXJldHVybiB0fSxzd2FwRGltZW5zaW9uT3JkZXI6ZnVuY3Rpb24oYSxlLHIscyx0KXt2YXIgbj0wLGg9MCxpPTAsbz0wLGM9YTtpZihyPjEpaWYoYz1uZXcgcyhlKnIpLHQpZm9yKG49MDtuPGU7bisrKWZvcihvPW4saT0wO2k8cjtpKyssbys9ZSljW29dPWFbaCsrXTtlbHNlIGZvcihuPTA7bjxlO24rKylmb3Iobz1uLGk9MDtpPHI7aSsrLG8rPWUpY1toKytdPWFbb107cmV0dXJuIGN9fSxrPWZ1bmN0aW9uKGEsZSxyKXt0aGlzLnZhbD1hLHRoaXMubGVmdD1lLHRoaXMucmlnaHQ9cn0sVT17ZGVjb2RlOmZ1bmN0aW9uKGEsZSl7ZT1lfHx7fTt2YXIgcj1lLm5vRGF0YVZhbHVlLHM9MCx0PXt9O2lmKHQucHRyPWUuaW5wdXRPZmZzZXR8fDAsdC5waXhlbHM9e30sISFwLnJlYWRIZWFkZXJJbmZvKGEsdCkpe3ZhciBuPXQuaGVhZGVySW5mbyxoPW4uZmlsZVZlcnNpb24saT1wLmdldERhdGFUeXBlQXJyYXkobi5pbWFnZVR5cGUpO2lmKGg+NSl0aHJvdyJ1bnN1cHBvcnRlZCBsZXJjIHZlcnNpb24gMi4iK2g7cC5yZWFkTWFzayhhLHQpLG4ubnVtVmFsaWRQaXhlbCE9PW4ud2lkdGgqbi5oZWlnaHQmJiF0LnBpeGVscy5yZXN1bHRNYXNrJiYodC5waXhlbHMucmVzdWx0TWFzaz1lLm1hc2tEYXRhKTt2YXIgbz1uLndpZHRoKm4uaGVpZ2h0O3QucGl4ZWxzLnJlc3VsdFBpeGVscz1uZXcgaShvKm4ubnVtRGltcyksdC5jb3VudGVyPXtvbmVzd2VlcDowLHVuY29tcHJlc3NlZDowLGx1dDowLGJpdHN0dWZmZXI6MCxjb25zdGFudDowLGNvbnN0YW50b2Zmc2V0OjB9O3ZhciBjPSFlLnJldHVyblBpeGVsSW50ZXJsZWF2ZWREaW1zO2lmKG4ubnVtVmFsaWRQaXhlbCE9PTApaWYobi56TWF4PT09bi56TWluKXAuY29uc3RydWN0Q29uc3RhbnRTdXJmYWNlKHQsYyk7ZWxzZSBpZihoPj00JiZwLmNoZWNrTWluTWF4UmFuZ2VzKGEsdCkpcC5jb25zdHJ1Y3RDb25zdGFudFN1cmZhY2UodCxjKTtlbHNle3ZhciB1PW5ldyBEYXRhVmlldyhhLHQucHRyLDIpLG09dS5nZXRVaW50OCgwKTtpZih0LnB0cisrLG0pcC5yZWFkRGF0YU9uZVN3ZWVwKGEsdCxpLGMpO2Vsc2UgaWYoaD4xJiZuLmltYWdlVHlwZTw9MSYmTWF0aC5hYnMobi5tYXhaRXJyb3ItLjUpPDFlLTUpe3ZhciB3PXUuZ2V0VWludDgoMSk7aWYodC5wdHIrKyx0LmVuY29kZU1vZGU9dyx3PjJ8fGg8NCYmdz4xKXRocm93IkludmFsaWQgSHVmZm1hbiBmbGFnICIrdzt3P3AucmVhZEh1ZmZtYW4oYSx0LGksYyk6cC5yZWFkVGlsZXMoYSx0LGksYyl9ZWxzZSBwLnJlYWRUaWxlcyhhLHQsaSxjKX10LmVvZk9mZnNldD10LnB0cjt2YXIgbDtlLmlucHV0T2Zmc2V0PyhsPXQuaGVhZGVySW5mby5ibG9iU2l6ZStlLmlucHV0T2Zmc2V0LXQucHRyLE1hdGguYWJzKGwpPj0xJiYodC5lb2ZPZmZzZXQ9ZS5pbnB1dE9mZnNldCt0LmhlYWRlckluZm8uYmxvYlNpemUpKToobD10LmhlYWRlckluZm8uYmxvYlNpemUtdC5wdHIsTWF0aC5hYnMobCk+PTEmJih0LmVvZk9mZnNldD10LmhlYWRlckluZm8uYmxvYlNpemUpKTt2YXIgZj17d2lkdGg6bi53aWR0aCxoZWlnaHQ6bi5oZWlnaHQscGl4ZWxEYXRhOnQucGl4ZWxzLnJlc3VsdFBpeGVscyxtaW5WYWx1ZTpuLnpNaW4sbWF4VmFsdWU6bi56TWF4LHZhbGlkUGl4ZWxDb3VudDpuLm51bVZhbGlkUGl4ZWwsZGltQ291bnQ6bi5udW1EaW1zLGRpbVN0YXRzOnttaW5WYWx1ZXM6bi5taW5WYWx1ZXMsbWF4VmFsdWVzOm4ubWF4VmFsdWVzfSxtYXNrRGF0YTp0LnBpeGVscy5yZXN1bHRNYXNrfTtpZih0LnBpeGVscy5yZXN1bHRNYXNrJiZwLmlzVmFsaWRQaXhlbFZhbHVlKG4uaW1hZ2VUeXBlLHIpKXt2YXIgZz10LnBpeGVscy5yZXN1bHRNYXNrO2ZvcihzPTA7czxvO3MrKylnW3NdfHwoZi5waXhlbERhdGFbc109cik7Zi5ub0RhdGFWYWx1ZT1yfXJldHVybiB0Lm5vRGF0YVZhbHVlPXIsZS5yZXR1cm5GaWxlSW5mbyYmKGYuZmlsZUluZm89cC5mb3JtYXRGaWxlSW5mbyh0KSksZn19LGdldEJhbmRDb3VudDpmdW5jdGlvbihhKXt2YXIgZT0wLHI9MCxzPXt9O2ZvcihzLnB0cj0wLHMucGl4ZWxzPXt9O3I8YS5ieXRlTGVuZ3RoLTU4OylwLnJlYWRIZWFkZXJJbmZvKGEscykscis9cy5oZWFkZXJJbmZvLmJsb2JTaXplLGUrKyxzLnB0cj1yO3JldHVybiBlfX07cmV0dXJuIFV9KCk7dmFyIG5lPWZ1bmN0aW9uKCl7dmFyIEE9bmV3IEFycmF5QnVmZmVyKDQpLHA9bmV3IFVpbnQ4QXJyYXkoQSksaz1uZXcgVWludDMyQXJyYXkoQSk7cmV0dXJuIGtbMF09MSxwWzBdPT09MX0oKSxpZT17ZGVjb2RlOmZ1bmN0aW9uKEEscCl7aWYoIW5lKXRocm93IkJpZyBlbmRpYW4gc3lzdGVtIGlzIG5vdCBzdXBwb3J0ZWQuIjtwPXB8fHt9O3ZhciBrPXAuaW5wdXRPZmZzZXR8fDAsVT1uZXcgVWludDhBcnJheShBLGssMTApLGE9U3RyaW5nLmZyb21DaGFyQ29kZS5hcHBseShudWxsLFUpLGUscjtpZihhLnRyaW0oKT09PSJDbnRaSW1hZ2UiKWU9ZWUscj0xO2Vsc2UgaWYoYS5zdWJzdHJpbmcoMCw1KT09PSJMZXJjMiIpZT1yZSxyPTI7ZWxzZSB0aHJvdyJVbmV4cGVjdGVkIGZpbGUgaWRlbnRpZmllciBzdHJpbmc6ICIrYTtmb3IodmFyIHM9MCx0PUEuYnl0ZUxlbmd0aC0xMCxuLGg9W10saSxvLGM9e3dpZHRoOjAsaGVpZ2h0OjAscGl4ZWxzOltdLHBpeGVsVHlwZTpwLnBpeGVsVHlwZSxtYXNrOm51bGwsc3RhdGlzdGljczpbXX0sdT0wO2s8dDspe3ZhciBtPWUuZGVjb2RlKEEse2lucHV0T2Zmc2V0OmssZW5jb2RlZE1hc2tEYXRhOm4sbWFza0RhdGE6byxyZXR1cm5NYXNrOnM9PT0wLHJldHVybkVuY29kZWRNYXNrOnM9PT0wLHJldHVybkZpbGVJbmZvOiEwLHJldHVyblBpeGVsSW50ZXJsZWF2ZWREaW1zOnAucmV0dXJuUGl4ZWxJbnRlcmxlYXZlZERpbXMscGl4ZWxUeXBlOnAucGl4ZWxUeXBlfHxudWxsLG5vRGF0YVZhbHVlOnAubm9EYXRhVmFsdWV8fG51bGx9KTtrPW0uZmlsZUluZm8uZW9mT2Zmc2V0LG89bS5tYXNrRGF0YSxzPT09MCYmKG49bS5lbmNvZGVkTWFza0RhdGEsYy53aWR0aD1tLndpZHRoLGMuaGVpZ2h0PW0uaGVpZ2h0LGMuZGltQ291bnQ9bS5kaW1Db3VudHx8MSxjLnBpeGVsVHlwZT1tLnBpeGVsVHlwZXx8bS5maWxlSW5mby5waXhlbFR5cGUsYy5tYXNrPW8pLHI+MSYmKG8mJmgucHVzaChvKSxtLmZpbGVJbmZvLm1hc2smJm0uZmlsZUluZm8ubWFzay5udW1CeXRlcz4wJiZ1KyspLHMrKyxjLnBpeGVscy5wdXNoKG0ucGl4ZWxEYXRhKSxjLnN0YXRpc3RpY3MucHVzaCh7bWluVmFsdWU6bS5taW5WYWx1ZSxtYXhWYWx1ZTptLm1heFZhbHVlLG5vRGF0YVZhbHVlOm0ubm9EYXRhVmFsdWUsZGltU3RhdHM6bS5kaW1TdGF0c30pfXZhciB3LGwsZjtpZihyPjEmJnU+MSl7Zm9yKGY9Yy53aWR0aCpjLmhlaWdodCxjLmJhbmRNYXNrcz1oLG89bmV3IFVpbnQ4QXJyYXkoZiksby5zZXQoaFswXSksdz0xO3c8aC5sZW5ndGg7dysrKWZvcihpPWhbd10sbD0wO2w8ZjtsKyspb1tsXT1vW2xdJmlbbF07Yy5tYXNrRGF0YT1vfXJldHVybiBjfX07Y29uc3QgdGU9ezA6N2UzLDE6NmUzLDI6NWUzLDM6NGUzLDQ6M2UzLDU6MjUwMCw2OjJlMyw3OjE1MDAsODo4MDAsOTo1MDAsMTA6MjAwLDExOjEwMCwxMjo0MCwxMzoxMiwxNDo1LDE1OjIsMTY6MSwxNzouNSwxODouMiwxOTouMSwyMDouMDF9O2Z1bmN0aW9uIGFlKEEpe2NvbnN0e2hlaWdodDpwLHdpZHRoOmsscGl4ZWxzOlV9PWllLmRlY29kZShBKSxhPW5ldyBGbG9hdDMyQXJyYXkocCprKTtmb3IobGV0IGU9MDtlPGEubGVuZ3RoO2UrKylhW2VdPVVbMF1bZV07cmV0dXJue2FycmF5OmEsd2lkdGg6ayxoZWlnaHQ6cH19ZnVuY3Rpb24gc2UoQSxwLGspe2xldCBVPWFlKEEpO2tbMl0ta1swXTwxJiYoVT1mZShVLGspKTtjb25zdHthcnJheTphLHdpZHRoOmV9PVUscz1uZXcgWihlKS5jcmVhdGVUaWxlKGEpLHQ9dGVbcF18fDA7cmV0dXJuIHMuZ2V0R2VvbWV0cnlEYXRhKHQpfWZ1bmN0aW9uIGZlKEEscCl7ZnVuY3Rpb24gayhzLHQsbixoLGksbyxjLHUpe2NvbnN0IG09bmV3IEZsb2F0MzJBcnJheShpKm8pO2ZvcihsZXQgbD0wO2w8bztsKyspZm9yKGxldCBmPTA7ZjxpO2YrKyl7Y29uc3QgZz0obCtoKSp0KyhmK24pLE09bCppK2Y7bVtNXT1zW2ddfWNvbnN0IHc9bmV3IEZsb2F0MzJBcnJheSh1KmMpO2ZvcihsZXQgbD0wO2w8dTtsKyspZm9yKGxldCBmPTA7ZjxjO2YrKyl7Y29uc3QgZz1sKnUrZixNPU1hdGgucm91bmQoZipvL3UpLGQ9TWF0aC5yb3VuZChsKmkvYykqaStNO3dbZ109bVtkXX1yZXR1cm4gd31jb25zdCBVPW9lKHAsQS53aWR0aCksYT1VLnN3KzEsZT1VLnNoKzE7cmV0dXJue2FycmF5OmsoQS5hcnJheSxBLndpZHRoLFUuc3gsVS5zeSxVLnN3LFUuc2gsYSxlKSx3aWR0aDphLGhlaWdodDplfX1mdW5jdGlvbiBvZShBLHApe2NvbnN0IGs9TWF0aC5mbG9vcihBWzBdKnApLFU9TWF0aC5mbG9vcihBWzFdKnApLGE9TWF0aC5mbG9vcigoQVsyXS1BWzBdKSpwKSxlPU1hdGguZmxvb3IoKEFbM10tQVsxXSkqcCk7cmV0dXJue3N4Omssc3k6VSxzdzphLHNoOmV9fXNlbGYub25tZXNzYWdlPUE9Pntjb25zdCBwPUEuZGF0YSxrPXNlKHAuZGVtRGF0YSxwLnoscC5jbGlwQm91bmRzKTtzZWxmLnBvc3RNZXNzYWdlKGspfX0pKCk7Cg==", yt = (l) => Uint8Array.from(atob(l), (r) => r.charCodeAt(0)), de = typeof self < "u" && self.Blob && new Blob([yt(Ye)], { type: "text/javascript;charset=utf-8" });
function pt(l) {
  let r;
  try {
    if (r = de && (self.URL || self.webkitURL).createObjectURL(de), !r) throw "";
    const s = new Worker(r, {
      name: l?.name
    });
    return s.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(r);
    }), s;
  } catch {
    return new Worker(
      "data:text/javascript;base64," + Ye,
      {
        name: l?.name
      }
    );
  } finally {
    r && (self.URL || self.webkitURL).revokeObjectURL(r);
  }
}
/* Copyright 2015-2021 Esri. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 @preserve */
const Wt = function() {
  var l = {};
  l.defaultNoDataValue = -34027999387901484e22, l.decode = function(n, o) {
    o = o || {};
    var c = o.encodedMaskData || o.encodedMaskData === null, a = e(n, o.inputOffset || 0, c), h = o.noDataValue !== null ? o.noDataValue : l.defaultNoDataValue, m = r(
      a,
      o.pixelType || Float32Array,
      o.encodedMaskData,
      h,
      o.returnMask
    ), d = {
      width: a.width,
      height: a.height,
      pixelData: m.resultPixels,
      minValue: m.minValue,
      maxValue: a.pixels.maxValue,
      noDataValue: h
    };
    return m.resultMask && (d.maskData = m.resultMask), o.returnEncodedMask && a.mask && (d.encodedMaskData = a.mask.bitset ? a.mask.bitset : null), o.returnFileInfo && (d.fileInfo = s(a), o.computeUsedBitDepths && (d.fileInfo.bitDepths = i(a))), d;
  };
  var r = function(n, o, c, a, h) {
    var m = 0, d = n.pixels.numBlocksX, y = n.pixels.numBlocksY, Z = Math.floor(n.width / d), p = Math.floor(n.height / y), f = 2 * n.maxZError, b = Number.MAX_VALUE, u;
    c = c || (n.mask ? n.mask.bitset : null);
    var V, M;
    V = new o(n.width * n.height), h && c && (M = new Uint8Array(n.width * n.height));
    for (var g = new Float32Array(Z * p), x, X, T = 0; T <= y; T++) {
      var I = T !== y ? p : n.height % y;
      if (I !== 0)
        for (var G = 0; G <= d; G++) {
          var W = G !== d ? Z : n.width % d;
          if (W !== 0) {
            var Y = T * n.width * p + G * Z, w = n.width - W, S = n.pixels.blocks[m], z, K, k;
            S.encoding < 2 ? (S.encoding === 0 ? z = S.rawData : (t(
              S.stuffedData,
              S.bitsPerPixel,
              S.numValidPixels,
              S.offset,
              f,
              g,
              n.pixels.maxValue
            ), z = g), K = 0) : S.encoding === 2 ? k = 0 : k = S.offset;
            var v;
            if (c)
              for (X = 0; X < I; X++) {
                for (Y & 7 && (v = c[Y >> 3], v <<= Y & 7), x = 0; x < W; x++)
                  Y & 7 || (v = c[Y >> 3]), v & 128 ? (M && (M[Y] = 1), u = S.encoding < 2 ? z[K++] : k, b = b > u ? u : b, V[Y++] = u) : (M && (M[Y] = 0), V[Y++] = a), v <<= 1;
                Y += w;
              }
            else if (S.encoding < 2)
              for (X = 0; X < I; X++) {
                for (x = 0; x < W; x++)
                  u = z[K++], b = b > u ? u : b, V[Y++] = u;
                Y += w;
              }
            else
              for (b = b > k ? k : b, X = 0; X < I; X++) {
                for (x = 0; x < W; x++)
                  V[Y++] = k;
                Y += w;
              }
            if (S.encoding === 1 && K !== S.numValidPixels)
              throw "Block and Mask do not match";
            m++;
          }
        }
    }
    return {
      resultPixels: V,
      resultMask: M,
      minValue: b
    };
  }, s = function(n) {
    return {
      fileIdentifierString: n.fileIdentifierString,
      fileVersion: n.fileVersion,
      imageType: n.imageType,
      height: n.height,
      width: n.width,
      maxZError: n.maxZError,
      eofOffset: n.eofOffset,
      mask: n.mask ? {
        numBlocksX: n.mask.numBlocksX,
        numBlocksY: n.mask.numBlocksY,
        numBytes: n.mask.numBytes,
        maxValue: n.mask.maxValue
      } : null,
      pixels: {
        numBlocksX: n.pixels.numBlocksX,
        numBlocksY: n.pixels.numBlocksY,
        numBytes: n.pixels.numBytes,
        maxValue: n.pixels.maxValue,
        noDataValue: n.noDataValue
      }
    };
  }, i = function(n) {
    for (var o = n.pixels.numBlocksX * n.pixels.numBlocksY, c = {}, a = 0; a < o; a++) {
      var h = n.pixels.blocks[a];
      h.encoding === 0 ? c.float32 = !0 : h.encoding === 1 ? c[h.bitsPerPixel] = !0 : c[0] = !0;
    }
    return Object.keys(c);
  }, e = function(n, o, c) {
    var a = {}, h = new Uint8Array(n, o, 10);
    if (a.fileIdentifierString = String.fromCharCode.apply(null, h), a.fileIdentifierString.trim() !== "CntZImage")
      throw "Unexpected file identifier string: " + a.fileIdentifierString;
    o += 10;
    var m = new DataView(n, o, 24);
    if (a.fileVersion = m.getInt32(0, !0), a.imageType = m.getInt32(4, !0), a.height = m.getUint32(8, !0), a.width = m.getUint32(12, !0), a.maxZError = m.getFloat64(16, !0), o += 24, !c)
      if (m = new DataView(n, o, 16), a.mask = {}, a.mask.numBlocksY = m.getUint32(0, !0), a.mask.numBlocksX = m.getUint32(4, !0), a.mask.numBytes = m.getUint32(8, !0), a.mask.maxValue = m.getFloat32(12, !0), o += 16, a.mask.numBytes > 0) {
        var d = new Uint8Array(Math.ceil(a.width * a.height / 8));
        m = new DataView(n, o, a.mask.numBytes);
        var y = m.getInt16(0, !0), Z = 2, p = 0;
        do {
          if (y > 0)
            for (; y--; )
              d[p++] = m.getUint8(Z++);
          else {
            var f = m.getUint8(Z++);
            for (y = -y; y--; )
              d[p++] = f;
          }
          y = m.getInt16(Z, !0), Z += 2;
        } while (Z < a.mask.numBytes);
        if (y !== -32768 || p < d.length)
          throw "Unexpected end of mask RLE encoding";
        a.mask.bitset = d, o += a.mask.numBytes;
      } else a.mask.numBytes | a.mask.numBlocksY | a.mask.maxValue || (a.mask.bitset = new Uint8Array(Math.ceil(a.width * a.height / 8)));
    m = new DataView(n, o, 16), a.pixels = {}, a.pixels.numBlocksY = m.getUint32(0, !0), a.pixels.numBlocksX = m.getUint32(4, !0), a.pixels.numBytes = m.getUint32(8, !0), a.pixels.maxValue = m.getFloat32(12, !0), o += 16;
    var b = a.pixels.numBlocksX, u = a.pixels.numBlocksY, V = b + (a.width % b > 0 ? 1 : 0), M = u + (a.height % u > 0 ? 1 : 0);
    a.pixels.blocks = new Array(V * M);
    for (var g = 0, x = 0; x < M; x++)
      for (var X = 0; X < V; X++) {
        var T = 0, I = n.byteLength - o;
        m = new DataView(n, o, Math.min(10, I));
        var G = {};
        a.pixels.blocks[g++] = G;
        var W = m.getUint8(0);
        if (T++, G.encoding = W & 63, G.encoding > 3)
          throw "Invalid block encoding (" + G.encoding + ")";
        if (G.encoding === 2) {
          o++;
          continue;
        }
        if (W !== 0 && W !== 2) {
          if (W >>= 6, G.offsetType = W, W === 2)
            G.offset = m.getInt8(1), T++;
          else if (W === 1)
            G.offset = m.getInt16(1, !0), T += 2;
          else if (W === 0)
            G.offset = m.getFloat32(1, !0), T += 4;
          else
            throw "Invalid block offset type";
          if (G.encoding === 1)
            if (W = m.getUint8(T), T++, G.bitsPerPixel = W & 63, W >>= 6, G.numValidPixelsType = W, W === 2)
              G.numValidPixels = m.getUint8(T), T++;
            else if (W === 1)
              G.numValidPixels = m.getUint16(T, !0), T += 2;
            else if (W === 0)
              G.numValidPixels = m.getUint32(T, !0), T += 4;
            else
              throw "Invalid valid pixel count type";
        }
        if (o += T, G.encoding !== 3) {
          var Y, w;
          if (G.encoding === 0) {
            var S = (a.pixels.numBytes - 1) / 4;
            if (S !== Math.floor(S))
              throw "uncompressed block has invalid length";
            Y = new ArrayBuffer(S * 4), w = new Uint8Array(Y), w.set(new Uint8Array(n, o, S * 4));
            var z = new Float32Array(Y);
            G.rawData = z, o += S * 4;
          } else if (G.encoding === 1) {
            var K = Math.ceil(G.numValidPixels * G.bitsPerPixel / 8), k = Math.ceil(K / 4);
            Y = new ArrayBuffer(k * 4), w = new Uint8Array(Y), w.set(new Uint8Array(n, o, K)), G.stuffedData = new Uint32Array(Y), o += K;
          }
        }
      }
    return a.eofOffset = o, a;
  }, t = function(n, o, c, a, h, m, d) {
    var y = (1 << o) - 1, Z = 0, p, f = 0, b, u, V = Math.ceil((d - a) / h), M = n.length * 4 - Math.ceil(o * c / 8);
    for (n[n.length - 1] <<= 8 * M, p = 0; p < c; p++) {
      if (f === 0 && (u = n[Z++], f = 32), f >= o)
        b = u >>> f - o & y, f -= o;
      else {
        var g = o - f;
        b = (u & y) << g & y, u = n[Z++], f = 32 - g, b += u >>> f;
      }
      m[p] = b < V ? a + b * h : d;
    }
    return m;
  };
  return l;
}(), Vt = /* @__PURE__ */ function() {
  var l = {
    //methods ending with 2 are for the new byte order used by Lerc2.3 and above.
    //originalUnstuff is used to unpack Huffman code table. code is duplicated to unstuffx for performance reasons.
    unstuff: function(e, t, n, o, c, a, h, m) {
      var d = (1 << n) - 1, y = 0, Z, p = 0, f, b, u, V, M = e.length * 4 - Math.ceil(n * o / 8);
      if (e[e.length - 1] <<= 8 * M, c)
        for (Z = 0; Z < o; Z++)
          p === 0 && (b = e[y++], p = 32), p >= n ? (f = b >>> p - n & d, p -= n) : (u = n - p, f = (b & d) << u & d, b = e[y++], p = 32 - u, f += b >>> p), t[Z] = c[f];
      else
        for (V = Math.ceil((m - a) / h), Z = 0; Z < o; Z++)
          p === 0 && (b = e[y++], p = 32), p >= n ? (f = b >>> p - n & d, p -= n) : (u = n - p, f = (b & d) << u & d, b = e[y++], p = 32 - u, f += b >>> p), t[Z] = f < V ? a + f * h : m;
    },
    unstuffLUT: function(e, t, n, o, c, a) {
      var h = (1 << t) - 1, m = 0, d = 0, y = 0, Z = 0, p = 0, f, b = [], u = e.length * 4 - Math.ceil(t * n / 8);
      e[e.length - 1] <<= 8 * u;
      var V = Math.ceil((a - o) / c);
      for (d = 0; d < n; d++)
        Z === 0 && (f = e[m++], Z = 32), Z >= t ? (p = f >>> Z - t & h, Z -= t) : (y = t - Z, p = (f & h) << y & h, f = e[m++], Z = 32 - y, p += f >>> Z), b[d] = p < V ? o + p * c : a;
      return b.unshift(o), b;
    },
    unstuff2: function(e, t, n, o, c, a, h, m) {
      var d = (1 << n) - 1, y = 0, Z, p = 0, f = 0, b, u, V;
      if (c)
        for (Z = 0; Z < o; Z++)
          p === 0 && (u = e[y++], p = 32, f = 0), p >= n ? (b = u >>> f & d, p -= n, f += n) : (V = n - p, b = u >>> f & d, u = e[y++], p = 32 - V, b |= (u & (1 << V) - 1) << n - V, f = V), t[Z] = c[b];
      else {
        var M = Math.ceil((m - a) / h);
        for (Z = 0; Z < o; Z++)
          p === 0 && (u = e[y++], p = 32, f = 0), p >= n ? (b = u >>> f & d, p -= n, f += n) : (V = n - p, b = u >>> f & d, u = e[y++], p = 32 - V, b |= (u & (1 << V) - 1) << n - V, f = V), t[Z] = b < M ? a + b * h : m;
      }
      return t;
    },
    unstuffLUT2: function(e, t, n, o, c, a) {
      var h = (1 << t) - 1, m = 0, d = 0, y = 0, Z = 0, p = 0, f = 0, b, u = [], V = Math.ceil((a - o) / c);
      for (d = 0; d < n; d++)
        Z === 0 && (b = e[m++], Z = 32, f = 0), Z >= t ? (p = b >>> f & h, Z -= t, f += t) : (y = t - Z, p = b >>> f & h, b = e[m++], Z = 32 - y, p |= (b & (1 << y) - 1) << t - y, f = y), u[d] = p < V ? o + p * c : a;
      return u.unshift(o), u;
    },
    originalUnstuff: function(e, t, n, o) {
      var c = (1 << n) - 1, a = 0, h, m = 0, d, y, Z, p = e.length * 4 - Math.ceil(n * o / 8);
      for (e[e.length - 1] <<= 8 * p, h = 0; h < o; h++)
        m === 0 && (y = e[a++], m = 32), m >= n ? (d = y >>> m - n & c, m -= n) : (Z = n - m, d = (y & c) << Z & c, y = e[a++], m = 32 - Z, d += y >>> m), t[h] = d;
      return t;
    },
    originalUnstuff2: function(e, t, n, o) {
      var c = (1 << n) - 1, a = 0, h, m = 0, d = 0, y, Z, p;
      for (h = 0; h < o; h++)
        m === 0 && (Z = e[a++], m = 32, d = 0), m >= n ? (y = Z >>> d & c, m -= n, d += n) : (p = n - m, y = Z >>> d & c, Z = e[a++], m = 32 - p, y |= (Z & (1 << p) - 1) << n - p, d = p), t[h] = y;
      return t;
    }
  }, r = {
    HUFFMAN_LUT_BITS_MAX: 12,
    //use 2^12 lut, treat it like constant
    computeChecksumFletcher32: function(e) {
      for (var t = 65535, n = 65535, o = e.length, c = Math.floor(o / 2), a = 0; c; ) {
        var h = c >= 359 ? 359 : c;
        c -= h;
        do
          t += e[a++] << 8, n += t += e[a++];
        while (--h);
        t = (t & 65535) + (t >>> 16), n = (n & 65535) + (n >>> 16);
      }
      return o & 1 && (n += t += e[a] << 8), t = (t & 65535) + (t >>> 16), n = (n & 65535) + (n >>> 16), (n << 16 | t) >>> 0;
    },
    readHeaderInfo: function(e, t) {
      var n = t.ptr, o = new Uint8Array(e, n, 6), c = {};
      if (c.fileIdentifierString = String.fromCharCode.apply(null, o), c.fileIdentifierString.lastIndexOf("Lerc2", 0) !== 0)
        throw "Unexpected file identifier string (expect Lerc2 ): " + c.fileIdentifierString;
      n += 6;
      var a = new DataView(e, n, 8), h = a.getInt32(0, !0);
      c.fileVersion = h, n += 4, h >= 3 && (c.checksum = a.getUint32(4, !0), n += 4), a = new DataView(e, n, 12), c.height = a.getUint32(0, !0), c.width = a.getUint32(4, !0), n += 8, h >= 4 ? (c.numDims = a.getUint32(8, !0), n += 4) : c.numDims = 1, a = new DataView(e, n, 40), c.numValidPixel = a.getUint32(0, !0), c.microBlockSize = a.getInt32(4, !0), c.blobSize = a.getInt32(8, !0), c.imageType = a.getInt32(12, !0), c.maxZError = a.getFloat64(16, !0), c.zMin = a.getFloat64(24, !0), c.zMax = a.getFloat64(32, !0), n += 40, t.headerInfo = c, t.ptr = n;
      var m, d;
      if (h >= 3 && (d = h >= 4 ? 52 : 48, m = this.computeChecksumFletcher32(new Uint8Array(e, n - d, c.blobSize - 14)), m !== c.checksum))
        throw "Checksum failed.";
      return !0;
    },
    checkMinMaxRanges: function(e, t) {
      var n = t.headerInfo, o = this.getDataTypeArray(n.imageType), c = n.numDims * this.getDataTypeSize(n.imageType), a = this.readSubArray(e, t.ptr, o, c), h = this.readSubArray(e, t.ptr + c, o, c);
      t.ptr += 2 * c;
      var m, d = !0;
      for (m = 0; m < n.numDims; m++)
        if (a[m] !== h[m]) {
          d = !1;
          break;
        }
      return n.minValues = a, n.maxValues = h, d;
    },
    readSubArray: function(e, t, n, o) {
      var c;
      if (n === Uint8Array)
        c = new Uint8Array(e, t, o);
      else {
        var a = new ArrayBuffer(o), h = new Uint8Array(a);
        h.set(new Uint8Array(e, t, o)), c = new n(a);
      }
      return c;
    },
    readMask: function(e, t) {
      var n = t.ptr, o = t.headerInfo, c = o.width * o.height, a = o.numValidPixel, h = new DataView(e, n, 4), m = {};
      if (m.numBytes = h.getUint32(0, !0), n += 4, (a === 0 || c === a) && m.numBytes !== 0)
        throw "invalid mask";
      var d, y;
      if (a === 0)
        d = new Uint8Array(Math.ceil(c / 8)), m.bitset = d, y = new Uint8Array(c), t.pixels.resultMask = y, n += m.numBytes;
      else if (m.numBytes > 0) {
        d = new Uint8Array(Math.ceil(c / 8)), h = new DataView(e, n, m.numBytes);
        var Z = h.getInt16(0, !0), p = 2, f = 0, b = 0;
        do {
          if (Z > 0)
            for (; Z--; )
              d[f++] = h.getUint8(p++);
          else
            for (b = h.getUint8(p++), Z = -Z; Z--; )
              d[f++] = b;
          Z = h.getInt16(p, !0), p += 2;
        } while (p < m.numBytes);
        if (Z !== -32768 || f < d.length)
          throw "Unexpected end of mask RLE encoding";
        y = new Uint8Array(c);
        var u = 0, V = 0;
        for (V = 0; V < c; V++)
          V & 7 ? (u = d[V >> 3], u <<= V & 7) : u = d[V >> 3], u & 128 && (y[V] = 1);
        t.pixels.resultMask = y, m.bitset = d, n += m.numBytes;
      }
      return t.ptr = n, t.mask = m, !0;
    },
    readDataOneSweep: function(e, t, n, o) {
      var c = t.ptr, a = t.headerInfo, h = a.numDims, m = a.width * a.height, d = a.imageType, y = a.numValidPixel * r.getDataTypeSize(d) * h, Z, p = t.pixels.resultMask;
      if (n === Uint8Array)
        Z = new Uint8Array(e, c, y);
      else {
        var f = new ArrayBuffer(y), b = new Uint8Array(f);
        b.set(new Uint8Array(e, c, y)), Z = new n(f);
      }
      if (Z.length === m * h)
        o ? t.pixels.resultPixels = r.swapDimensionOrder(
          Z,
          m,
          h,
          n,
          !0
        ) : t.pixels.resultPixels = Z;
      else {
        t.pixels.resultPixels = new n(m * h);
        var u = 0, V = 0, M = 0, g = 0;
        if (h > 1) {
          if (o) {
            for (V = 0; V < m; V++)
              if (p[V])
                for (g = V, M = 0; M < h; M++, g += m)
                  t.pixels.resultPixels[g] = Z[u++];
          } else
            for (V = 0; V < m; V++)
              if (p[V])
                for (g = V * h, M = 0; M < h; M++)
                  t.pixels.resultPixels[g + M] = Z[u++];
        } else
          for (V = 0; V < m; V++)
            p[V] && (t.pixels.resultPixels[V] = Z[u++]);
      }
      return c += y, t.ptr = c, !0;
    },
    readHuffmanTree: function(e, t) {
      var n = this.HUFFMAN_LUT_BITS_MAX, o = new DataView(e, t.ptr, 16);
      t.ptr += 16;
      var c = o.getInt32(0, !0);
      if (c < 2)
        throw "unsupported Huffman version";
      var a = o.getInt32(4, !0), h = o.getInt32(8, !0), m = o.getInt32(12, !0);
      if (h >= m)
        return !1;
      var d = new Uint32Array(m - h);
      r.decodeBits(e, t, d);
      var y = [], Z, p, f, b;
      for (Z = h; Z < m; Z++)
        p = Z - (Z < a ? 0 : a), y[p] = { first: d[Z - h], second: null };
      var u = e.byteLength - t.ptr, V = Math.ceil(u / 4), M = new ArrayBuffer(V * 4), g = new Uint8Array(M);
      g.set(new Uint8Array(e, t.ptr, u));
      var x = new Uint32Array(M), X = 0, T, I = 0;
      for (T = x[0], Z = h; Z < m; Z++)
        p = Z - (Z < a ? 0 : a), b = y[p].first, b > 0 && (y[p].second = T << X >>> 32 - b, 32 - X >= b ? (X += b, X === 32 && (X = 0, I++, T = x[I])) : (X += b - 32, I++, T = x[I], y[p].second |= T >>> 32 - X));
      var G = 0, W = 0, Y = new s();
      for (Z = 0; Z < y.length; Z++)
        y[Z] !== void 0 && (G = Math.max(G, y[Z].first));
      G >= n ? W = n : W = G;
      var w = [], S, z, K, k, v, P;
      for (Z = h; Z < m; Z++)
        if (p = Z - (Z < a ? 0 : a), b = y[p].first, b > 0)
          if (S = [b, p], b <= W)
            for (z = y[p].second << W - b, K = 1 << W - b, f = 0; f < K; f++)
              w[z | f] = S;
          else
            for (z = y[p].second, P = Y, k = b - 1; k >= 0; k--)
              v = z >>> k & 1, v ? (P.right || (P.right = new s()), P = P.right) : (P.left || (P.left = new s()), P = P.left), k === 0 && !P.val && (P.val = S[1]);
      return {
        decodeLut: w,
        numBitsLUTQick: W,
        numBitsLUT: G,
        tree: Y,
        stuffedData: x,
        srcPtr: I,
        bitPos: X
      };
    },
    readHuffman: function(e, t, n, o) {
      var c = t.headerInfo, a = c.numDims, h = t.headerInfo.height, m = t.headerInfo.width, d = m * h, y = this.readHuffmanTree(e, t), Z = y.decodeLut, p = y.tree, f = y.stuffedData, b = y.srcPtr, u = y.bitPos, V = y.numBitsLUTQick, M = y.numBitsLUT, g = t.headerInfo.imageType === 0 ? 128 : 0, x, X, T, I = t.pixels.resultMask, G, W, Y, w, S, z, K, k = 0;
      u > 0 && (b++, u = 0);
      var v = f[b], P = t.encodeMode === 1, N = new n(d * a), F = N, U;
      if (a < 2 || P) {
        for (U = 0; U < a; U++)
          if (a > 1 && (F = new n(N.buffer, d * U, d), k = 0), t.headerInfo.numValidPixel === m * h)
            for (z = 0, w = 0; w < h; w++)
              for (S = 0; S < m; S++, z++) {
                if (X = 0, G = v << u >>> 32 - V, W = G, 32 - u < V && (G |= f[b + 1] >>> 64 - u - V, W = G), Z[W])
                  X = Z[W][1], u += Z[W][0];
                else
                  for (G = v << u >>> 32 - M, W = G, 32 - u < M && (G |= f[b + 1] >>> 64 - u - M, W = G), x = p, K = 0; K < M; K++)
                    if (Y = G >>> M - K - 1 & 1, x = Y ? x.right : x.left, !(x.left || x.right)) {
                      X = x.val, u = u + K + 1;
                      break;
                    }
                u >= 32 && (u -= 32, b++, v = f[b]), T = X - g, P ? (S > 0 ? T += k : w > 0 ? T += F[z - m] : T += k, T &= 255, F[z] = T, k = T) : F[z] = T;
              }
          else
            for (z = 0, w = 0; w < h; w++)
              for (S = 0; S < m; S++, z++)
                if (I[z]) {
                  if (X = 0, G = v << u >>> 32 - V, W = G, 32 - u < V && (G |= f[b + 1] >>> 64 - u - V, W = G), Z[W])
                    X = Z[W][1], u += Z[W][0];
                  else
                    for (G = v << u >>> 32 - M, W = G, 32 - u < M && (G |= f[b + 1] >>> 64 - u - M, W = G), x = p, K = 0; K < M; K++)
                      if (Y = G >>> M - K - 1 & 1, x = Y ? x.right : x.left, !(x.left || x.right)) {
                        X = x.val, u = u + K + 1;
                        break;
                      }
                  u >= 32 && (u -= 32, b++, v = f[b]), T = X - g, P ? (S > 0 && I[z - 1] ? T += k : w > 0 && I[z - m] ? T += F[z - m] : T += k, T &= 255, F[z] = T, k = T) : F[z] = T;
                }
      } else
        for (z = 0, w = 0; w < h; w++)
          for (S = 0; S < m; S++)
            if (z = w * m + S, !I || I[z])
              for (U = 0; U < a; U++, z += d) {
                if (X = 0, G = v << u >>> 32 - V, W = G, 32 - u < V && (G |= f[b + 1] >>> 64 - u - V, W = G), Z[W])
                  X = Z[W][1], u += Z[W][0];
                else
                  for (G = v << u >>> 32 - M, W = G, 32 - u < M && (G |= f[b + 1] >>> 64 - u - M, W = G), x = p, K = 0; K < M; K++)
                    if (Y = G >>> M - K - 1 & 1, x = Y ? x.right : x.left, !(x.left || x.right)) {
                      X = x.val, u = u + K + 1;
                      break;
                    }
                u >= 32 && (u -= 32, b++, v = f[b]), T = X - g, F[z] = T;
              }
      t.ptr = t.ptr + (b + 1) * 4 + (u > 0 ? 4 : 0), t.pixels.resultPixels = N, a > 1 && !o && (t.pixels.resultPixels = r.swapDimensionOrder(
        N,
        d,
        a,
        n
      ));
    },
    decodeBits: function(e, t, n, o, c) {
      {
        var a = t.headerInfo, h = a.fileVersion, m = 0, d = e.byteLength - t.ptr >= 5 ? 5 : e.byteLength - t.ptr, y = new DataView(e, t.ptr, d), Z = y.getUint8(0);
        m++;
        var p = Z >> 6, f = p === 0 ? 4 : 3 - p, b = (Z & 32) > 0, u = Z & 31, V = 0;
        if (f === 1)
          V = y.getUint8(m), m++;
        else if (f === 2)
          V = y.getUint16(m, !0), m += 2;
        else if (f === 4)
          V = y.getUint32(m, !0), m += 4;
        else
          throw "Invalid valid pixel count type";
        var M = 2 * a.maxZError, g, x, X, T, I, G, W, Y, w, S = a.numDims > 1 ? a.maxValues[c] : a.zMax;
        if (b) {
          for (t.counter.lut++, Y = y.getUint8(m), m++, T = Math.ceil((Y - 1) * u / 8), I = Math.ceil(T / 4), x = new ArrayBuffer(I * 4), X = new Uint8Array(x), t.ptr += m, X.set(new Uint8Array(e, t.ptr, T)), W = new Uint32Array(x), t.ptr += T, w = 0; Y - 1 >>> w; )
            w++;
          T = Math.ceil(V * w / 8), I = Math.ceil(T / 4), x = new ArrayBuffer(I * 4), X = new Uint8Array(x), X.set(new Uint8Array(e, t.ptr, T)), g = new Uint32Array(x), t.ptr += T, h >= 3 ? G = l.unstuffLUT2(W, u, Y - 1, o, M, S) : G = l.unstuffLUT(W, u, Y - 1, o, M, S), h >= 3 ? l.unstuff2(g, n, w, V, G) : l.unstuff(g, n, w, V, G);
        } else
          t.counter.bitstuffer++, w = u, t.ptr += m, w > 0 && (T = Math.ceil(V * w / 8), I = Math.ceil(T / 4), x = new ArrayBuffer(I * 4), X = new Uint8Array(x), X.set(new Uint8Array(e, t.ptr, T)), g = new Uint32Array(x), t.ptr += T, h >= 3 ? o == null ? l.originalUnstuff2(g, n, w, V) : l.unstuff2(
            g,
            n,
            w,
            V,
            !1,
            o,
            M,
            S
          ) : o == null ? l.originalUnstuff(g, n, w, V) : l.unstuff(g, n, w, V, !1, o, M, S));
      }
    },
    readTiles: function(e, t, n, o) {
      var c = t.headerInfo, a = c.width, h = c.height, m = a * h, d = c.microBlockSize, y = c.imageType, Z = r.getDataTypeSize(y), p = Math.ceil(a / d), f = Math.ceil(h / d);
      t.pixels.numBlocksY = f, t.pixels.numBlocksX = p, t.pixels.ptr = 0;
      var b = 0, u = 0, V = 0, M = 0, g = 0, x = 0, X = 0, T = 0, I = 0, G = 0, W = 0, Y = 0, w = 0, S = 0, z = 0, K = 0, k, v, P, N, F, U, A = new n(d * d), Pe = h % d || d, Ue = a % d || d, ne, Q, ee = c.numDims, B, j = t.pixels.resultMask, H = t.pixels.resultPixels, Re = c.fileVersion, ae = Re >= 5 ? 14 : 15, J, re = c.zMax, E;
      for (V = 0; V < f; V++)
        for (g = V !== f - 1 ? d : Pe, M = 0; M < p; M++)
          for (x = M !== p - 1 ? d : Ue, W = V * a * d + M * d, Y = a - x, B = 0; B < ee; B++) {
            if (ee > 1 ? (E = H, W = V * a * d + M * d, H = new n(
              t.pixels.resultPixels.buffer,
              m * B * Z,
              m
            ), re = c.maxValues[B]) : E = null, X = e.byteLength - t.ptr, k = new DataView(e, t.ptr, Math.min(10, X)), v = {}, K = 0, T = k.getUint8(0), K++, J = c.fileVersion >= 5 ? T & 4 : 0, I = T >> 6 & 255, G = T >> 2 & ae, G !== (M * d >> 3 & ae) || J && B === 0)
              throw "integrity issue";
            if (U = T & 3, U > 3)
              throw t.ptr += K, "Invalid block encoding (" + U + ")";
            if (U === 2) {
              if (J)
                if (j)
                  for (b = 0; b < g; b++)
                    for (u = 0; u < x; u++)
                      j[W] && (H[W] = E[W]), W++;
                else
                  for (b = 0; b < g; b++)
                    for (u = 0; u < x; u++)
                      H[W] = E[W], W++;
              t.counter.constant++, t.ptr += K;
              continue;
            } else if (U === 0) {
              if (J)
                throw "integrity issue";
              if (t.counter.uncompressed++, t.ptr += K, w = g * x * Z, S = e.byteLength - t.ptr, w = w < S ? w : S, P = new ArrayBuffer(
                w % Z === 0 ? w : w + Z - w % Z
              ), N = new Uint8Array(P), N.set(new Uint8Array(e, t.ptr, w)), F = new n(P), z = 0, j)
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    j[W] && (H[W] = F[z++]), W++;
                  W += Y;
                }
              else
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    H[W++] = F[z++];
                  W += Y;
                }
              t.ptr += z * Z;
            } else if (ne = r.getDataTypeUsed(J && y < 6 ? 4 : y, I), Q = r.getOnePixel(v, K, ne, k), K += r.getDataTypeSize(ne), U === 3)
              if (t.ptr += K, t.counter.constantoffset++, j)
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    j[W] && (H[W] = J ? Math.min(re, E[W] + Q) : Q), W++;
                  W += Y;
                }
              else
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    H[W] = J ? Math.min(re, E[W] + Q) : Q, W++;
                  W += Y;
                }
            else if (t.ptr += K, r.decodeBits(e, t, A, Q, B), K = 0, J)
              if (j)
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    j[W] && (H[W] = A[K++] + E[W]), W++;
                  W += Y;
                }
              else
                for (b = 0; b < g; b++) {
                  for (u = 0; u < x; u++)
                    H[W] = A[K++] + E[W], W++;
                  W += Y;
                }
            else if (j)
              for (b = 0; b < g; b++) {
                for (u = 0; u < x; u++)
                  j[W] && (H[W] = A[K++]), W++;
                W += Y;
              }
            else
              for (b = 0; b < g; b++) {
                for (u = 0; u < x; u++)
                  H[W++] = A[K++];
                W += Y;
              }
          }
      ee > 1 && !o && (t.pixels.resultPixels = r.swapDimensionOrder(
        t.pixels.resultPixels,
        m,
        ee,
        n
      ));
    },
    /*****************
     *  private methods (helper methods)
     *****************/
    formatFileInfo: function(e) {
      return {
        fileIdentifierString: e.headerInfo.fileIdentifierString,
        fileVersion: e.headerInfo.fileVersion,
        imageType: e.headerInfo.imageType,
        height: e.headerInfo.height,
        width: e.headerInfo.width,
        numValidPixel: e.headerInfo.numValidPixel,
        microBlockSize: e.headerInfo.microBlockSize,
        blobSize: e.headerInfo.blobSize,
        maxZError: e.headerInfo.maxZError,
        pixelType: r.getPixelType(e.headerInfo.imageType),
        eofOffset: e.eofOffset,
        mask: e.mask ? {
          numBytes: e.mask.numBytes
        } : null,
        pixels: {
          numBlocksX: e.pixels.numBlocksX,
          numBlocksY: e.pixels.numBlocksY,
          //"numBytes": data.pixels.numBytes,
          maxValue: e.headerInfo.zMax,
          minValue: e.headerInfo.zMin,
          noDataValue: e.noDataValue
        }
      };
    },
    constructConstantSurface: function(e, t) {
      var n = e.headerInfo.zMax, o = e.headerInfo.zMin, c = e.headerInfo.maxValues, a = e.headerInfo.numDims, h = e.headerInfo.height * e.headerInfo.width, m = 0, d = 0, y = 0, Z = e.pixels.resultMask, p = e.pixels.resultPixels;
      if (Z)
        if (a > 1) {
          if (t)
            for (m = 0; m < a; m++)
              for (y = m * h, n = c[m], d = 0; d < h; d++)
                Z[d] && (p[y + d] = n);
          else
            for (d = 0; d < h; d++)
              if (Z[d])
                for (y = d * a, m = 0; m < a; m++)
                  p[y + a] = c[m];
        } else
          for (d = 0; d < h; d++)
            Z[d] && (p[d] = n);
      else if (a > 1 && o !== n)
        if (t)
          for (m = 0; m < a; m++)
            for (y = m * h, n = c[m], d = 0; d < h; d++)
              p[y + d] = n;
        else
          for (d = 0; d < h; d++)
            for (y = d * a, m = 0; m < a; m++)
              p[y + m] = c[m];
      else
        for (d = 0; d < h * a; d++)
          p[d] = n;
    },
    getDataTypeArray: function(e) {
      var t;
      switch (e) {
        case 0:
          t = Int8Array;
          break;
        case 1:
          t = Uint8Array;
          break;
        case 2:
          t = Int16Array;
          break;
        case 3:
          t = Uint16Array;
          break;
        case 4:
          t = Int32Array;
          break;
        case 5:
          t = Uint32Array;
          break;
        case 6:
          t = Float32Array;
          break;
        case 7:
          t = Float64Array;
          break;
        default:
          t = Float32Array;
      }
      return t;
    },
    getPixelType: function(e) {
      var t;
      switch (e) {
        case 0:
          t = "S8";
          break;
        case 1:
          t = "U8";
          break;
        case 2:
          t = "S16";
          break;
        case 3:
          t = "U16";
          break;
        case 4:
          t = "S32";
          break;
        case 5:
          t = "U32";
          break;
        case 6:
          t = "F32";
          break;
        case 7:
          t = "F64";
          break;
        default:
          t = "F32";
      }
      return t;
    },
    isValidPixelValue: function(e, t) {
      if (t == null)
        return !1;
      var n;
      switch (e) {
        case 0:
          n = t >= -128 && t <= 127;
          break;
        case 1:
          n = t >= 0 && t <= 255;
          break;
        case 2:
          n = t >= -32768 && t <= 32767;
          break;
        case 3:
          n = t >= 0 && t <= 65536;
          break;
        case 4:
          n = t >= -2147483648 && t <= 2147483647;
          break;
        case 5:
          n = t >= 0 && t <= 4294967296;
          break;
        case 6:
          n = t >= -34027999387901484e22 && t <= 34027999387901484e22;
          break;
        case 7:
          n = t >= -17976931348623157e292 && t <= 17976931348623157e292;
          break;
        default:
          n = !1;
      }
      return n;
    },
    getDataTypeSize: function(e) {
      var t = 0;
      switch (e) {
        case 0:
        case 1:
          t = 1;
          break;
        case 2:
        case 3:
          t = 2;
          break;
        case 4:
        case 5:
        case 6:
          t = 4;
          break;
        case 7:
          t = 8;
          break;
        default:
          t = e;
      }
      return t;
    },
    getDataTypeUsed: function(e, t) {
      var n = e;
      switch (e) {
        case 2:
        case 4:
          n = e - t;
          break;
        case 3:
        case 5:
          n = e - 2 * t;
          break;
        case 6:
          t === 0 ? n = e : t === 1 ? n = 2 : n = 1;
          break;
        case 7:
          t === 0 ? n = e : n = e - 2 * t + 1;
          break;
        default:
          n = e;
          break;
      }
      return n;
    },
    getOnePixel: function(e, t, n, o) {
      var c = 0;
      switch (n) {
        case 0:
          c = o.getInt8(t);
          break;
        case 1:
          c = o.getUint8(t);
          break;
        case 2:
          c = o.getInt16(t, !0);
          break;
        case 3:
          c = o.getUint16(t, !0);
          break;
        case 4:
          c = o.getInt32(t, !0);
          break;
        case 5:
          c = o.getUInt32(t, !0);
          break;
        case 6:
          c = o.getFloat32(t, !0);
          break;
        case 7:
          c = o.getFloat64(t, !0);
          break;
        default:
          throw "the decoder does not understand this pixel type";
      }
      return c;
    },
    swapDimensionOrder: function(e, t, n, o, c) {
      var a = 0, h = 0, m = 0, d = 0, y = e;
      if (n > 1)
        if (y = new o(t * n), c)
          for (a = 0; a < t; a++)
            for (d = a, m = 0; m < n; m++, d += t)
              y[d] = e[h++];
        else
          for (a = 0; a < t; a++)
            for (d = a, m = 0; m < n; m++, d += t)
              y[h++] = e[d];
      return y;
    }
  }, s = function(e, t, n) {
    this.val = e, this.left = t, this.right = n;
  }, i = {
    /*
     * ********removed options compared to LERC1. We can bring some of them back if needed.
     * removed pixel type. LERC2 is typed and doesn't require user to give pixel type
     * changed encodedMaskData to maskData. LERC2 's js version make it faster to use maskData directly.
     * removed returnMask. mask is used by LERC2 internally and is cost free. In case of user input mask, it's returned as well and has neglible cost.
     * removed nodatavalue. Because LERC2 pixels are typed, nodatavalue will sacrify a useful value for many types (8bit, 16bit) etc,
     *       user has to be knowledgable enough about raster and their data to avoid usability issues. so nodata value is simply removed now.
     *       We can add it back later if their's a clear requirement.
     * removed encodedMask. This option was not implemented in LercDecode. It can be done after decoding (less efficient)
     * removed computeUsedBitDepths.
     *
     *
     * response changes compared to LERC1
     * 1. encodedMaskData is not available
     * 2. noDataValue is optional (returns only if user's noDataValue is with in the valid data type range)
     * 3. maskData is always available
     */
    /*****************
     *  public properties
     ******************/
    //HUFFMAN_LUT_BITS_MAX: 12, //use 2^12 lut, not configurable
    /*****************
     *  public methods
     *****************/
    /**
     * Decode a LERC2 byte stream and return an object containing the pixel data and optional metadata.
     *
     * @param {ArrayBuffer} input The LERC input byte stream
     * @param {object} [options] options Decoding options
     * @param {number} [options.inputOffset] The number of bytes to skip in the input byte stream. A valid LERC file is expected at that position
     * @param {boolean} [options.returnFileInfo] If true, the return value will have a fileInfo property that contains metadata obtained from the LERC headers and the decoding process
     * @param {boolean} [options.returnPixelInterleavedDims]  If true, returned dimensions are pixel-interleaved, a.k.a [p1_dim0, p1_dim1, p1_dimn, p2_dim0...], default is [p1_dim0, p2_dim0, ..., p1_dim1, p2_dim1...]
     */
    decode: function(e, t) {
      t = t || {};
      var n = t.noDataValue, o = 0, c = {};
      if (c.ptr = t.inputOffset || 0, c.pixels = {}, !!r.readHeaderInfo(e, c)) {
        var a = c.headerInfo, h = a.fileVersion, m = r.getDataTypeArray(a.imageType);
        if (h > 5)
          throw "unsupported lerc version 2." + h;
        r.readMask(e, c), a.numValidPixel !== a.width * a.height && !c.pixels.resultMask && (c.pixels.resultMask = t.maskData);
        var d = a.width * a.height;
        c.pixels.resultPixels = new m(d * a.numDims), c.counter = {
          onesweep: 0,
          uncompressed: 0,
          lut: 0,
          bitstuffer: 0,
          constant: 0,
          constantoffset: 0
        };
        var y = !t.returnPixelInterleavedDims;
        if (a.numValidPixel !== 0)
          if (a.zMax === a.zMin)
            r.constructConstantSurface(c, y);
          else if (h >= 4 && r.checkMinMaxRanges(e, c))
            r.constructConstantSurface(c, y);
          else {
            var Z = new DataView(e, c.ptr, 2), p = Z.getUint8(0);
            if (c.ptr++, p)
              r.readDataOneSweep(e, c, m, y);
            else if (h > 1 && a.imageType <= 1 && Math.abs(a.maxZError - 0.5) < 1e-5) {
              var f = Z.getUint8(1);
              if (c.ptr++, c.encodeMode = f, f > 2 || h < 4 && f > 1)
                throw "Invalid Huffman flag " + f;
              f ? r.readHuffman(e, c, m, y) : r.readTiles(e, c, m, y);
            } else
              r.readTiles(e, c, m, y);
          }
        c.eofOffset = c.ptr;
        var b;
        t.inputOffset ? (b = c.headerInfo.blobSize + t.inputOffset - c.ptr, Math.abs(b) >= 1 && (c.eofOffset = t.inputOffset + c.headerInfo.blobSize)) : (b = c.headerInfo.blobSize - c.ptr, Math.abs(b) >= 1 && (c.eofOffset = c.headerInfo.blobSize));
        var u = {
          width: a.width,
          height: a.height,
          pixelData: c.pixels.resultPixels,
          minValue: a.zMin,
          maxValue: a.zMax,
          validPixelCount: a.numValidPixel,
          dimCount: a.numDims,
          dimStats: {
            minValues: a.minValues,
            maxValues: a.maxValues
          },
          maskData: c.pixels.resultMask
          //noDataValue: noDataValue
        };
        if (c.pixels.resultMask && r.isValidPixelValue(a.imageType, n)) {
          var V = c.pixels.resultMask;
          for (o = 0; o < d; o++)
            V[o] || (u.pixelData[o] = n);
          u.noDataValue = n;
        }
        return c.noDataValue = n, t.returnFileInfo && (u.fileInfo = r.formatFileInfo(c)), u;
      }
    },
    getBandCount: function(e) {
      var t = 0, n = 0, o = {};
      for (o.ptr = 0, o.pixels = {}; n < e.byteLength - 58; )
        r.readHeaderInfo(e, o), n += o.headerInfo.blobSize, t++, o.ptr = n;
      return t;
    }
  };
  return i;
}();
var ft = function() {
  var l = new ArrayBuffer(4), r = new Uint8Array(l), s = new Uint32Array(l);
  return s[0] = 1, r[0] === 1;
}(), Lt = {
  /************wrapper**********************************************/
  /**
   * A wrapper for decoding both LERC1 and LERC2 byte streams capable of handling multiband pixel blocks for various pixel types.
   *
   * @alias module:Lerc
   * @param {ArrayBuffer} input The LERC input byte stream
   * @param {object} [options] The decoding options below are optional.
   * @param {number} [options.inputOffset] The number of bytes to skip in the input byte stream. A valid Lerc file is expected at that position.
   * @param {string} [options.pixelType] (LERC1 only) Default value is F32. Valid pixel types for input are U8/S8/S16/U16/S32/U32/F32.
   * @param {number} [options.noDataValue] (LERC1 only). It is recommended to use the returned mask instead of setting this value.
   * @param {boolean} [options.returnPixelInterleavedDims] (nDim LERC2 only) If true, returned dimensions are pixel-interleaved, a.k.a [p1_dim0, p1_dim1, p1_dimn, p2_dim0...], default is [p1_dim0, p2_dim0, ..., p1_dim1, p2_dim1...]
   * @returns {{width, height, pixels, pixelType, mask, statistics}}
   * @property {number} width Width of decoded image.
   * @property {number} height Height of decoded image.
   * @property {array} pixels [band1, band2, …] Each band is a typed array of width*height.
   * @property {string} pixelType The type of pixels represented in the output.
   * @property {mask} mask Typed array with a size of width*height, or null if all pixels are valid.
   * @property {array} statistics [statistics_band1, statistics_band2, …] Each element is a statistics object representing min and max values
   **/
  decode: function(l, r) {
    if (!ft)
      throw "Big endian system is not supported.";
    r = r || {};
    var s = r.inputOffset || 0, i = new Uint8Array(l, s, 10), e = String.fromCharCode.apply(null, i), t, n;
    if (e.trim() === "CntZImage")
      t = Wt, n = 1;
    else if (e.substring(0, 5) === "Lerc2")
      t = Vt, n = 2;
    else
      throw "Unexpected file identifier string: " + e;
    for (var o = 0, c = l.byteLength - 10, a, h = [], m, d, y = {
      width: 0,
      height: 0,
      pixels: [],
      pixelType: r.pixelType,
      mask: null,
      statistics: []
    }, Z = 0; s < c; ) {
      var p = t.decode(l, {
        inputOffset: s,
        //for both lerc1 and lerc2
        encodedMaskData: a,
        //lerc1 only
        maskData: d,
        //lerc2 only
        returnMask: o === 0,
        //lerc1 only
        returnEncodedMask: o === 0,
        //lerc1 only
        returnFileInfo: !0,
        //for both lerc1 and lerc2
        returnPixelInterleavedDims: r.returnPixelInterleavedDims,
        //for ndim lerc2 only
        pixelType: r.pixelType || null,
        //lerc1 only
        noDataValue: r.noDataValue || null
        //lerc1 only
      });
      s = p.fileInfo.eofOffset, d = p.maskData, o === 0 && (a = p.encodedMaskData, y.width = p.width, y.height = p.height, y.dimCount = p.dimCount || 1, y.pixelType = p.pixelType || p.fileInfo.pixelType, y.mask = d), n > 1 && (d && h.push(d), p.fileInfo.mask && p.fileInfo.mask.numBytes > 0 && Z++), o++, y.pixels.push(p.pixelData), y.statistics.push({
        minValue: p.minValue,
        maxValue: p.maxValue,
        noDataValue: p.noDataValue,
        dimStats: p.dimStats
      });
    }
    var f, b, u;
    if (n > 1 && Z > 1) {
      for (u = y.width * y.height, y.bandMasks = h, d = new Uint8Array(u), d.set(h[0]), f = 1; f < h.length; f++)
        for (m = h[f], b = 0; b < u; b++)
          d[b] = d[b] & m[b];
      y.maskData = d;
    }
    return y;
  }
};
const xt = {
  0: 7e3,
  1: 6e3,
  2: 5e3,
  3: 4e3,
  4: 3e3,
  5: 2500,
  6: 2e3,
  7: 1500,
  8: 800,
  9: 500,
  10: 200,
  11: 100,
  12: 40,
  13: 12,
  14: 5,
  15: 2,
  16: 1,
  17: 0.5,
  18: 0.2,
  19: 0.1,
  20: 0.01
};
function Gt(l) {
  const { height: r, width: s, pixels: i } = Lt.decode(l), e = new Float32Array(r * s);
  for (let t = 0; t < e.length; t++)
    e[t] = i[0][t];
  return { array: e, width: s, height: r };
}
function Tt(l, r, s) {
  let i = Gt(l);
  s[2] - s[0] < 1 && (i = Mt(i, s));
  const { array: e, width: t } = i, o = new dt(t).createTile(e), c = xt[r] || 0;
  return o.getGeometryData(c);
}
function Mt(l, r) {
  function s(o, c, a, h, m, d, y, Z) {
    const p = new Float32Array(m * d);
    for (let b = 0; b < d; b++)
      for (let u = 0; u < m; u++) {
        const V = (b + h) * c + (u + a), M = b * m + u;
        p[M] = o[V];
      }
    const f = new Float32Array(Z * y);
    for (let b = 0; b < Z; b++)
      for (let u = 0; u < y; u++) {
        const V = b * Z + u, M = Math.round(u * d / Z), x = Math.round(b * m / y) * m + M;
        f[V] = p[x];
      }
    return f;
  }
  const i = Xt(r, l.width), e = i.sw + 1, t = i.sh + 1;
  return { array: s(
    l.array,
    l.width,
    i.sx,
    i.sy,
    i.sw,
    i.sh,
    e,
    t
  ), width: e, height: t };
}
function Xt(l, r) {
  const s = Math.floor(l[0] * r), i = Math.floor(l[1] * r), e = Math.floor((l[2] - l[0]) * r), t = Math.floor((l[3] - l[1]) * r);
  return { sx: s, sy: i, sw: e, sh: t };
}
const gt = 10;
class Yt extends Me {
  constructor() {
    super();
    L(this, "info", {
      version: "0.10.0",
      description: "Tile LERC terrain loader. It can load ArcGis-lerc format terrain data."
    });
    L(this, "dataType", "lerc");
    // 图像加载器
    L(this, "fileLoader", new Be(R.manager));
    L(this, "_workerPool", new ge(0));
    this.fileLoader.setResponseType("arraybuffer"), this._workerPool.setWorkerCreator(() => new pt());
  }
  /**
   * 异步加载并解析数据，返回BufferGeometry对象
   *
   * @param url 数据文件的URL
   * @param params 解析参数，包含瓦片xyz和裁剪边界clipBounds
   * @returns 返回解析后的BufferGeometry对象
   */
  async doLoad(s, i) {
    this._workerPool.pool === 0 && this._workerPool.setWorkerLimit(gt);
    const { z: e, bounds: t } = i, n = await this.fileLoader.loadAsync(s).catch(() => new Float32Array(256 * 256)), o = Tt(n, e, t);
    return new oe().setData(o);
  }
}
ve(new Yt());
const we = "KGZ1bmN0aW9uKCl7InVzZSBzdHJpY3QiO2Z1bmN0aW9uIGModCl7cmV0dXJuIGEodC5kYXRhKX1mdW5jdGlvbiBhKHQpe2Z1bmN0aW9uIG4oZSx1KXtjb25zdCByPXUqNCxbaSxmLGcsbF09ZS5zbGljZShyLHIrNCk7cmV0dXJuIGw9PT0wPzA6LTFlNCsoaTw8MTZ8Zjw8OHxnKSouMX1jb25zdCBvPXQubGVuZ3RoPj4+MixzPW5ldyBGbG9hdDMyQXJyYXkobyk7Zm9yKGxldCBlPTA7ZTxvO2UrKylzW2VdPW4odCxlKTtyZXR1cm4gc31zZWxmLm9ubWVzc2FnZT10PT57Y29uc3Qgbj1jKHQuZGF0YS5pbWdEYXRhKTtzZWxmLnBvc3RNZXNzYWdlKG4pfX0pKCk7Cg==", wt = (l) => Uint8Array.from(atob(l), (r) => r.charCodeAt(0)), he = typeof self < "u" && self.Blob && new Blob([wt(we)], { type: "text/javascript;charset=utf-8" });
function St(l) {
  let r;
  try {
    if (r = he && (self.URL || self.webkitURL).createObjectURL(he), !r) throw "";
    const s = new Worker(r, {
      name: l?.name
    });
    return s.addEventListener("error", () => {
      (self.URL || self.webkitURL).revokeObjectURL(r);
    }), s;
  } catch {
    return new Worker(
      "data:text/javascript;base64," + we,
      {
        name: l?.name
      }
    );
  } finally {
    r && (self.URL || self.webkitURL).revokeObjectURL(r);
  }
}
const Kt = 10;
class It extends Me {
  constructor() {
    super();
    L(this, "info", {
      version: "0.10.0",
      description: "Mapbox-RGB terrain loader, It can load Mapbox-RGB terrain data."
    });
    // 数据类型标识
    L(this, "dataType", "terrain-rgb");
    // 使用imageLoader下载
    L(this, "imageLoader", new pe(R.manager));
    L(this, "_workerPool", new ge(0));
    this._workerPool.setWorkerCreator(() => new St());
  }
  // 下载数据
  /**
   * 异步加载BufferGeometry对象
   *
   * @param url 图片的URL地址
   * @param params 加载参数，包含瓦片xyz和裁剪边界clipBounds
   * @returns 返回解析后的BufferGeometry对象
   */
  async doLoad(s, i) {
    const e = await this.imageLoader.loadAsync(s).catch((a) => new Image()), t = Oe.clamp((i.z + 2) * 3, 2, 64), n = zt(e, i.bounds, t);
    let o;
    this._workerPool.pool === 0 && this._workerPool.setWorkerLimit(Kt), o = (await this._workerPool.postMessage({ imgData: n }, [n.data.buffer])).data;
    const c = new oe();
    return c.setData(o), c;
  }
}
function zt(l, r, s) {
  const i = fe(r, l.width);
  s = Math.min(s, i.sw);
  const t = new OffscreenCanvas(s, s).getContext("2d");
  return t.imageSmoothingEnabled = !1, t.drawImage(l, i.sx, i.sy, i.sw, i.sh, 0, 0, s, s), t.getImageData(0, 0, s, s);
}
ve(new It());
const kt = `{
	"name": "@three-tile/lib",
	"version": "0.10.3",
	"type": "module",
	"files": [
		"dist"
	],
	"main": "./dist/index.umd.cjs",
	"module": "./dist/index.js",
	"types": "./dist/index.d.ts",
	"exports": {
		".": {
			"import": "./dist/index.js",
			"require": "./dist/index.umd.cjs",
			"types": "./dist/index.d.ts"
		}
	},
	"description": "A lightweight tile map using threejs",
	"license": "MIT",
	"author": {
		"name": "GuoJF",
		"email": "hz_gjf@163.com"
	},
	"keywords": [
		"three",
		"gis",
		"tile",
		"map",
		"3D",
		"cesium",
		"mapbox"
	],
	"scripts": {
		"dev": "vite build --watch",
		"build": "tsc && vite build"
	},
	"peerDependencies": {
		"three": "^0.165.0"
	},
	"publishConfig": {
		"registry": "https://registry.npmjs.org/",
		"access": "public"
	},
	"repository": {
		"type": "git",
		"url": "git+https://github.com/sxguojf/three-tile.git"
	},
	"bugs": {
		"url": "https://github.com/sxguojf/three-tile/issues"
	},
	"homepage": "https://github.com/sxguojf/three-tile#readme"
}
`;
var $ = /* @__PURE__ */ ((l) => (l[l.none = 0] = "none", l[l.create = 1] = "create", l[l.remove = 2] = "remove", l))($ || {});
function vt(l, r) {
  const s = l.position.clone().setZ(l.maxZ).applyMatrix4(l.matrixWorld);
  return r.distanceTo(s);
}
function Pt(l) {
  const r = l.scale, s = new C(-r.x, -r.y, 0).applyMatrix4(l.matrixWorld), i = new C(r.x, r.y, 0).applyMatrix4(l.matrixWorld);
  return s.sub(i).length();
}
function Ut(l) {
  return l.distToCamera / l.sizeInWorld * 0.8;
}
function Rt(l, r, s, i) {
  const e = Ut(l);
  if (l.isLeaf) {
    if (l.inFrustum && // Tile is in frustum
    l.z < s && // Tile level < map maxlevel
    (l.z < r || l.showing) && // (Tile level < map minLevel ) || (Parent tile has showed)
    (l.z < r || e < i))
      return 1;
  } else if (l.z >= r && // Tile level >= map minLevel
  (l.z > s || e > i))
    return 2;
  return 0;
}
function Ft(l, r, s, i) {
  const e = [], t = i + 1, n = r * 2, o = 0, c = 0.25, a = l.imgSource[0].projectionID === "4326";
  if (i === 0 && a) {
    const h = s, m = new C(0.5, 1, 1), d = new D(n, h, t), y = new D(n, h, t);
    d.position.set(-0.25, 0, o), d.scale.copy(m), y.position.set(c, 0, o), y.scale.copy(m), e.push(d, y);
  } else {
    const h = s * 2, m = new C(0.5, 0.5, 1), d = new D(n, h, t), y = new D(n + 1, h, t), Z = new D(n, h + 1, t), p = new D(n + 1, h + 1, t);
    d.position.set(-0.25, c, o), d.scale.copy(m), y.position.set(c, c, o), y.scale.copy(m), Z.position.set(-0.25, -0.25, o), Z.scale.copy(m), p.position.set(c, -0.25, o), p.scale.copy(m), e.push(d, y, Z, p);
  }
  return e;
}
const Ht = 10, Dt = new Qe(), Ct = new C(), jt = new Ae(), Jt = new _e(new C(-0.5, -0.5, 0), new C(0.5, 0.5, 1)), ue = new qe(), O = class O extends We {
  /**
   * Constructor for the Tile class.
   * @param x - Tile X-coordinate, default: 0.
   * @param y - Tile Y-coordinate, default: 0.
   * @param z - Tile level, default: 0.
   */
  constructor(s = 0, i = 0, e = 0) {
    super(Dt, []);
    /** Coordinate of tile */
    L(this, "x");
    L(this, "y");
    L(this, "z");
    /** Is a tile? */
    L(this, "isTile", !0);
    /** Tile parent */
    L(this, "parent", null);
    /** Children of tile */
    L(this, "children", []);
    L(this, "_ready", !1);
    /** return this.minLevel < map.minLevel, True mean do not needs load tile data */
    L(this, "_isDummy", !1);
    L(this, "_showing", !1);
    /** Max height of tile */
    L(this, "_maxZ", 0);
    /** Distance to camera */
    L(this, "distToCamera", 0);
    /* Tile size in world */
    L(this, "sizeInWorld", 0);
    L(this, "_loaded", !1);
    L(this, "_inFrustum", !1);
    this.x = s, this.y = i, this.z = e, this.name = `Tile ${e}-${s}-${i}`, this.up.set(0, 0, 1), this.matrixAutoUpdate = !1;
  }
  /**
   * Number of download threads.
   */
  static get downloadThreads() {
    return O._downloadThreads;
  }
  get isDummy() {
    return this._isDummy;
  }
  /**
   * Gets the showing state of the tile.
   */
  get showing() {
    return this._showing;
  }
  /**
   * Sets the showing state of the tile.
   * @param value - The new showing state.
   */
  set showing(s) {
    this._showing = s, this.material.forEach((i) => i.visible = s);
  }
  /**
   * Gets the maximum height of the tile.
   */
  get maxZ() {
    return this._maxZ;
  }
  /**
   * Sets the maximum height of the tile.
   * @param value - The new maximum height.
   */
  set maxZ(s) {
    this._maxZ = s;
  }
  /**
   * Gets the index of the tile in its parent's children array.
   * @returns The index of the tile.
   */
  get index() {
    return this.parent ? this.parent.children.indexOf(this) : -1;
  }
  /**
   * Gets the load state of the tile.
   */
  get loaded() {
    return this._loaded;
  }
  /** Is tile in frustum ?*/
  get inFrustum() {
    return this._inFrustum;
  }
  /**
   * Sets whether the tile is in the frustum.
   * @param value - The new frustum state.
   */
  set inFrustum(s) {
    this._inFrustum = s;
  }
  /** Tile is a leaf ?  */
  get isLeaf() {
    return this.children.filter((s) => s.isTile).length === 0;
  }
  /**
   * Override Object3D.traverse, change the callback param type to "this".
   * @param callback - The callback function.
   */
  traverse(s) {
    s(this), this.children.forEach((i) => {
      i.isTile && i.traverse(s);
    });
  }
  /**
   * Override Object3D.traverseVisible, change the callback param type to "this".
   * @param callback - The callback function.
   */
  traverseVisible(s) {
    this.visible && (s(this), this.children.forEach((i) => {
      i.isTile && i.traverseVisible(s);
    }));
  }
  /**
   * Override Object3D.raycast, only test the tile has loaded.
   * @param raycaster - The raycaster.
   * @param intersects - The array of intersections.
   */
  raycast(s, i) {
    this.showing && this.loaded && this.isTile && super.raycast(s, i);
  }
  /**
   * LOD (Level of Detail).
   * @param loader - The tile loader.
   * @param minLevel - The minimum level.
   * @param maxLevel - The maximum level.
   * @param threshold - The threshold.
   * @returns this
   */
  LOD(s) {
    if (O.downloadThreads > Ht)
      return { action: $.none };
    let i = [];
    const { loader: e, minLevel: t, maxLevel: n, LODThreshold: o } = s, c = Rt(this, t, n, o);
    return c === $.create && (i = Ft(e, this.x, this.y, this.z), this.add(...i)), { action: c, newTiles: i };
  }
  /**
   * Checks the visibility of the tile.
   */
  _checkVisible() {
    const s = this.parent;
    if (s && s.isTile) {
      const i = s.children.filter((t) => t.isTile), e = i.every((t) => t.loaded);
      s.showing = !e, i.forEach((t) => t.showing = e);
    }
    return this;
  }
  /**
   * Asynchronously load tile data
   *
   * @param loader Tile loader
   * @returns this
   */
  async _load(s) {
    O._downloadThreads++;
    const { x: i, y: e, z: t } = this, n = await s.load({
      x: i,
      y: e,
      z: t,
      bounds: [-1 / 0, -1 / 0, 1 / 0, 1 / 0]
    });
    return this.material = n.materials, this.geometry = n.geometry, this.maxZ = this.geometry.boundingBox?.max.z || 0, this._loaded = !0, O._downloadThreads--, this;
  }
  /** New tile init */
  _init() {
    this.updateMatrix(), this.updateMatrixWorld(), this.sizeInWorld = Pt(this);
  }
  /**
   * Updates the tile.
   * @param params - The update parameters.
   * @returns this
   */
  update(s) {
    if (console.assert(this.z === 0), !this.parent)
      return this;
    ue.setFromProjectionMatrix(
      jt.multiplyMatrices(s.camera.projectionMatrix, s.camera.matrixWorldInverse)
    );
    const i = s.camera.getWorldPosition(Ct);
    return this.traverse((e) => {
      e.receiveShadow = this.receiveShadow, e.castShadow = this.castShadow;
      const t = Jt.clone().applyMatrix4(e.matrixWorld);
      t.max.setY(9e3), e.inFrustum = ue.intersectsBox(t), e.distToCamera = vt(e, i);
      const { action: n, newTiles: o } = e.LOD(s);
      this._doAction(e, n, o, s);
    }), this._checkReady(), this;
  }
  _doAction(s, i, e, t) {
    return i === $.create ? e?.forEach((n) => {
      n._init(), n._isDummy = n.z < t.minLevel, this.dispatchEvent({ type: "tile-created", tile: n }), n.isDummy || n._load(t.loader).then(() => {
        n._checkVisible(), this.dispatchEvent({ type: "tile-loaded", tile: n });
      });
    }) : i === $.remove && (s.showing = !0, s._unLoad(!1, t.loader), this.dispatchEvent({ type: "tile-unload", tile: s })), this;
  }
  /**
   * Reloads the tile data.
   * @returns this
   */
  reload(s) {
    return this._unLoad(!0, s), this;
  }
  /**
   * Checks if the tile is ready to render.
   * @returns this
   */
  _checkReady() {
    return this._ready || (this._ready = !0, this.traverse((s) => {
      if (s.isLeaf && s.loaded && !s.isDummy) {
        this._ready = !1;
        return;
      }
    }), this._ready && this.dispatchEvent({ type: "ready" })), this;
  }
  /**
   * UnLoads the tile data.
   * @param unLoadSelf - Whether to unload tile itself.
   * @returns this.
   */
  _unLoad(s, i) {
    return s && this.isTile && !this.isDummy && (this.dispatchEvent({ type: "unload" }), i?.unload?.(this)), this.children.forEach((e) => e._unLoad(!0, i)), this.clear(), this;
  }
};
L(O, "_downloadThreads", 0);
let D = O;
class Se {
  /**
   * constructor
   * @param options SourceOptions
   */
  constructor(r) {
    /** Data type that determines which loader to use for loading and processing data. Default is "image" type */
    L(this, "dataType", "image");
    /** Copyright attribution information for the data source, used for displaying map copyright notices */
    L(this, "attribution", "ThreeTile");
    /** Minimum zoom level supported by the data source. Default is 0 */
    L(this, "minLevel", 0);
    /** Maximum zoom level supported by the data source. Default is 18 */
    L(this, "maxLevel", 18);
    /** Data projection type. Default is "3857" Mercator projection */
    L(this, "projectionID", "3857");
    /** URL template for tile data. Uses variables like {x},{y},{z} to construct tile request URLs */
    L(this, "url", "");
    /** List of URL subdomains for load balancing. Can be an array of strings or a single string */
    L(this, "subdomains", []);
    /** Currently used subdomain. Randomly selected from subdomains when requesting tiles */
    L(this, "s", "");
    /** Layer opacity. Range 0-1, default is 1.0 (completely opaque) */
    L(this, "opacity", 1);
    /** Whether to use TMS tile coordinate system. Default false uses XYZ system, true uses TMS system */
    L(this, "isTMS", !1);
    /** Data bounds in format [minLon, minLat, maxLon, maxLat]. Default covers global range excluding polar regions */
    L(this, "bounds", [-180, -85, 180, 85]);
    /** Projected data bounds */
    L(this, "_projectionBounds", [-1 / 0, -1 / 0, 1 / 0, 1 / 0]);
    Object.assign(this, r);
  }
  /**
   * Get url from tile coordinate, public, overwrite to custom generation tile url from xyz
   * @param x tile x coordinate
   * @param y tile y coordinate
   * @param z tile z coordinate
   * @returns url tile url
   */
  getUrl(r, s, i) {
    const e = { ...this, x: r, y: s, z: i };
    return Et(this.url, e);
  }
  /**
   * Get url from tile coordinate, public，called by TileLoader
   * @param x tile x coordinate
   * @param y tile y coordinate
   * @param z tile z coordinate
   * @returns url tile url
   */
  _getUrl(r, s, i) {
    const e = this.subdomains.length;
    if (e > 0) {
      const n = Math.floor(Math.random() * e);
      this.s = this.subdomains[n];
    }
    const t = this.isTMS ? Math.pow(2, i) - 1 - s : s;
    return this.getUrl(r, t, i);
  }
  /**
   * Create source directly through factoy functions.
   * @param options source options
   * @returns ISource data source instance
   */
  static create(r) {
    return new Se(r);
  }
}
function Et(l, r) {
  const s = /\{ *([\w_-]+) *\}/g;
  return l.replace(s, (i, e) => {
    const t = r[e] ?? (() => {
      throw new Error(`source url template error, No value provided for variable: ${i}`);
    })();
    return typeof t == "function" ? t(r) : t;
  });
}
class Ke {
  /**
   * 构造函数
   * @param centerLon 中央经线
   */
  constructor(r = 0) {
    L(this, "_lon0", 0);
    this._lon0 = r;
  }
  /** 中央经线 */
  get lon0() {
    return this._lon0;
  }
  /**
   * 根据中央经线取得变换后的瓦片X坐标
   * @param x
   * @param z
   * @returns
   */
  getTileXWithCenterLon(r, s) {
    const i = Math.pow(2, s);
    let e = r + Math.round(i / 360 * this._lon0);
    return e >= i ? e -= i : e < 0 && (e += i), e;
  }
  /**
   * 取得瓦片左下角投影坐标
   * @param x
   * @param y
   * @param z
   * @returns
   */
  getTileXYZproj(r, s, i) {
    const e = this.mapWidth, t = this.mapHeight / 2, n = r / Math.pow(2, i) * e - e / 2, o = t - s / Math.pow(2, i) * t * 2;
    return { x: n, y: o };
  }
  /**
   * 取得经纬度范围的投影坐标
   * @param bounds 经纬度边界
   * @returns 投影坐标
   */
  getProjBoundsFromLonLat(r) {
    const s = r[0] === -180 && r[2] === 180, i = this.project(r[0] + (s ? this._lon0 : 0), r[1]), e = this.project(r[2] + (s ? this._lon0 : 0), r[3]);
    return [Math.min(i.x, e.x), Math.min(i.y, e.y), Math.max(i.x, e.x), Math.max(i.y, e.y)];
  }
  /**
  	 * 取得瓦片边界投影坐标范围
  
  	 * @param x 瓦片X坐标
  	 * @param y 瓦片Y坐标
  	 * @param z  瓦片层级
  	 * @returns 
  	 */
  getProjBoundsFromXYZ(r, s, i) {
    const e = this.getTileXYZproj(r, s, i), t = this.getTileXYZproj(r + 1, s + 1, i);
    return [Math.min(e.x, t.x), Math.min(e.y, t.y), Math.max(e.x, t.x), Math.max(e.y, t.y)];
  }
  getLonLatBoundsFromXYZ(r, s, i) {
    const e = this.getProjBoundsFromXYZ(r, s, i), t = this.unProject(e[0], e[1]), n = this.unProject(e[2], e[3]);
    return [t.lon, t.lat, n.lon, n.lat];
  }
}
const _ = 6378e3;
class Ie extends Ke {
  constructor() {
    super(...arguments);
    L(this, "ID", "3857");
    // projeciton ID
    L(this, "mapWidth", 2 * Math.PI * _);
    //E-W scacle Earth's circumference(m)
    L(this, "mapHeight", this.mapWidth);
    //S-N scacle Earth's circumference(m)
    L(this, "mapDepth", 1);
  }
  //Height scale
  /**
   * Latitude and longitude to projected coordinates
   * @param lon longitude
   * @param lat Latitude
   * @returns projected coordinates
   */
  project(s, i) {
    const e = (s - this.lon0) * (Math.PI / 180), t = i * (Math.PI / 180), n = _ * e, o = _ * Math.log(Math.tan(Math.PI / 4 + t / 2));
    return { x: n, y: o };
  }
  /**
   * Projected coordinates to latitude and longitude
   * @param x projection x
   * @param y projection y
   * @returns latitude and longitude
   */
  unProject(s, i) {
    let e = s / _ * (180 / Math.PI) + this.lon0;
    return e > 180 && (e -= 360), { lat: (2 * Math.atan(Math.exp(i / _)) - Math.PI / 2) * (180 / Math.PI), lon: e };
  }
}
class Nt extends Ke {
  constructor() {
    super(...arguments);
    L(this, "ID", "4326");
    L(this, "mapWidth", 36e3);
    //E-W scacle (*0.01°)
    L(this, "mapHeight", 18e3);
    //S-N scale (*0.01°)
    L(this, "mapDepth", 1);
  }
  //height scale
  project(s, i) {
    return { x: (s - this.lon0) * 100, y: i * 100 };
  }
  unProject(s, i) {
    return { lon: s / 100 + this.lon0, lat: i / 100 };
  }
}
const Ze = {
  /**
   * create projection object from projection ID
   *
   * @param id projeciton ID, default: "3857"
   * @returns IProjection instance
   */
  createFromID: (l = "3857", r) => {
    let s;
    switch (l) {
      case "3857":
        s = new Ie(r);
        break;
      case "4326":
        s = new Nt(r);
        break;
      default:
        throw new Error(`Projection ID: ${l} is not supported.`);
    }
    return s;
  }
};
class Bt extends xe {
  constructor() {
    super(...arguments);
    L(this, "_projection");
  }
  attcth(s, i) {
    Object.assign(this, s), this._projection = i;
    const e = s.imgSource, t = s.demSource;
    e.forEach((n) => {
      n._projectionBounds = i.getProjBoundsFromLonLat(n.bounds);
    }), t && (t._projectionBounds = i.getProjBoundsFromLonLat(t.bounds));
  }
  async load(s) {
    if (!this._projection)
      throw new Error("projection is undefined");
    const { x: i, y: e, z: t } = s, n = this._projection.getTileXWithCenterLon(i, t), o = this._projection.getProjBoundsFromXYZ(i, e, t), c = this._projection.getLonLatBoundsFromXYZ(i, e, t);
    return super.load({ x: n, y: e, z: t, bounds: o, lonLatBounds: c });
  }
}
function ze(l, r) {
  const s = r.intersectObjects([l.rootTile]);
  for (const i of s)
    if (i.object instanceof D) {
      const e = l.worldToLocal(i.point.clone()), t = l.map2geo(e);
      return Object.assign(i, {
        location: t
      });
    }
}
function be(l, r) {
  const s = new C(0, -1, 0), i = new C(r.x, 10 * 1e3, r.z), e = new Ve(i, s);
  return ze(l, e);
}
function Ot(l, r, s) {
  const i = new Ve();
  return i.setFromCamera(s, l), ze(r, i);
}
function Qt(l) {
  const r = l.loader.manager, s = (i, e) => {
    l.dispatchEvent({ type: i, ...e });
  };
  r.onStart = (i, e, t) => {
    s("loading-start", { url: i, itemsLoaded: e, itemsTotal: t });
  }, r.onError = (i) => {
    s("loading-error", { url: i });
  }, r.onLoad = () => {
    s("loading-complete");
  }, r.onProgress = (i, e, t) => {
    s("loading-progress", { url: i, itemsLoaded: e, itemsTotal: t });
  }, r.onParseEnd = (i) => {
    s("parsing-end", { url: i });
  }, l.rootTile.addEventListener("ready", () => s("ready")), l.rootTile.addEventListener("tile-created", (i) => {
    s("tile-created", { tile: i.tile });
  }), l.rootTile.addEventListener("tile-loaded", (i) => {
    s("tile-loaded", { tile: i.tile });
  }), l.rootTile.addEventListener("tile-unload", (i) => {
    s("tile-unload", { tile: i.tile });
  });
}
function At(l, r = 128) {
  const s = document.createElement("canvas"), i = s.getContext("2d");
  if (!i)
    throw new Error("Failed to get canvas context");
  s.width = r, s.height = r;
  const e = r / 2, t = r / 2;
  return i.imageSmoothingEnabled = !1, i.fillStyle = "#000022", i.strokeStyle = "DarkGoldenrod", i.lineWidth = 5, i.moveTo(e, 3), i.lineTo(e, r), i.stroke(), i.closePath(), i.lineWidth = 2, i.beginPath(), i.roundRect(2, 2, r - 4, t - 8, 10), i.closePath(), i.fill(), i.stroke(), i.font = "24px Arial", i.fillStyle = "Goldenrod", i.strokeStyle = "black", i.textAlign = "center", i.textBaseline = "top", i.strokeText(l, e, 20), i.fillText(l, e, 20), s;
}
function ns(l, r = 128) {
  const s = new ye(At(l, r)), i = new $e({
    map: s,
    sizeAttenuation: !1
  }), e = new et(i);
  return e.visible = !1, e.center.set(0.5, 0.3), e.scale.setScalar(0.11), e.renderOrder = 999, e;
}
class ke extends We {
  /**
   * Map mesh constructor
   *
   * 地图模型构造函数
   * @param params 地图参数 {@link MapParams}
   * @example
   * ``` typescript
  
    const map = new TileMap({
    		// 加载器
  		loader: new TileLoader(),
             // 影像数据源
             imgSource: [Source.mapBoxImgSource, new TestSource()],
             // 高程数据源
             demSource: source.mapBoxDemSource,
             // 地图投影中心经度
             lon0: 90,
             // 最小缩放级别
             minLevel: 1,
             // 最大缩放级别
             maxLevel: 18,
         });;
   * ```
   */
  constructor(s) {
    super();
    // 名称
    L(this, "name", "map");
    // 瓦片树更新时钟
    L(this, "_clock", new tt());
    // 是否为LOD模型（LOD模型，当autoUpdate为真时渲染时会自动调用update方法）
    L(this, "isLOD", !0);
    /**
     * Whether the LOD object is updated automatically by the renderer per frame or not.
     * If set to false, you have to call LOD.update() in the render loop by yourself. Default is true.
     * 瓦片是否在每帧渲染时自动更新，默认为真
     */
    L(this, "autoUpdate", !0);
    /**
     * Tile tree update interval, unit: ms (default 100ms)
     * 瓦片树更新间隔，单位毫秒（默认100ms）
     */
    L(this, "updateInterval", 100);
    /**
     * Root tile, it is the root node of tile tree.
     * 根瓦片
     */
    L(this, "rootTile");
    /**
     * Map data loader, it used for load tile data and create tile geometry/Material
     * 地图数据加载器
     */
    L(this, "loader");
    L(this, "_loader", new Bt());
    L(this, "_minLevel", 2);
    L(this, "_maxLevel", 19);
    L(this, "_projection", new Ie(0));
    L(this, "_imgSource", []);
    L(this, "_demSource");
    L(this, "_LODThreshold", 1);
    this.up.set(0, 0, 1);
    const {
      loader: i = new xe(),
      rootTile: e = new D(),
      minLevel: t = 2,
      maxLevel: n = 19,
      imgSource: o,
      demSource: c,
      lon0: a = 0
    } = s;
    this.loader = i, e.matrixAutoUpdate = !0, e.scale.set(this.projection.mapWidth, this.projection.mapHeight, this.projection.mapDepth), this.rootTile = e, this.minLevel = t, this.maxLevel = n, this.imgSource = o, this.demSource = c, this.lon0 = a, this.add(e), e.updateMatrix(), Qt(this);
  }
  /**
   * Get min level of map
   * 地图最小缩放级别，小于这个级别瓦片树不再更新
   */
  get minLevel() {
    return this._minLevel;
  }
  /**
   * Set max level of map
   * 设置地图最小缩放级别，小于这个级别瓦片树不再更新
   */
  set minLevel(s) {
    this._minLevel = s;
  }
  /**
   * Get max level of map
   * 地图最大缩放级别，大于这个级别瓦片树不再更新
   */
  get maxLevel() {
    return this._maxLevel;
  }
  /**
   * Set max level of map
   * 设置地图最大缩放级别，大于这个级别瓦片树不再更新
   */
  set maxLevel(s) {
    this._maxLevel = s;
  }
  /**
   * Get central Meridian latidute
   * 取得中央子午线经度
   */
  get lon0() {
    return this.projection.lon0;
  }
  /**
   * Set central Meridian latidute, default:0
   * 设置中央子午线经度，中央子午线决定了地图的投影中心经度，可设置为-90，0，90
   */
  set lon0(s) {
    this.projection.lon0 !== s && (s != 0 && this.minLevel < 1 && console.warn(`Map centralMeridian is ${this.lon0}, minLevel must > 0`), this.projection = Ze.createFromID(this.projection.ID, s), this.reload());
  }
  /**
   * Set the map projection object
   * 取得地图投影对象
   */
  get projection() {
    return this._projection;
  }
  /**
   * Get the map projection object
   * 设置地图投影对象
   */
  set projection(s) {
    (s.ID != this.projection.ID || s.lon0 != this.lon0) && (this.rootTile.scale.set(s.mapWidth, s.mapHeight, s.mapDepth), this._projection = s, this.reload(), this.dispatchEvent({
      type: "projection-changed",
      projection: s
    }));
  }
  /**
   * Get the image data source object
   * 取得影像数据源
   */
  get imgSource() {
    return this._imgSource;
  }
  /**
   * Set the image data source object
   * 设置影像数据源
   */
  set imgSource(s) {
    const i = Array.isArray(s) ? s : [s];
    if (i.length === 0)
      throw new Error("imgSource can not be empty");
    this.projection = Ze.createFromID(i[0].projectionID, this.projection.lon0), this._imgSource = i, this.loader.imgSource = i, this.dispatchEvent({ type: "source-changed", source: s });
  }
  /**
   * Get the terrain data source
   * 设置地形数据源
   */
  get demSource() {
    return this._demSource;
  }
  /**
   * Set the terrain data source
   * 取得地形数据源
   */
  set demSource(s) {
    this._demSource = s, this.loader.demSource = this._demSource, this.dispatchEvent({ type: "source-changed", source: s });
  }
  /**
   * Get LOD threshold
   * 取得LOD阈值
   */
  get LODThreshold() {
    return this._LODThreshold;
  }
  /**
   * Set LOD threshold
   * 设置LOD阈值，LOD阈值越大，瓦片细化，但耗费资源越高，建议取1-2之间
   */
  set LODThreshold(s) {
    this._LODThreshold = s;
  }
  /**
      * Create a map using factory function
      * 地图创建工厂函数
        @param params 地图参数 {@link MapParams}
        @returns map mesh 地图模型
        @example
        ``` typescript
         TileMap.create({
             // 影像数据源
             imgSource: [Source.mapBoxImgSource, new TestSource()],
             // 高程数据源
             demSource: source.mapBoxDemSource,
             // 地图投影中心经度
             lon0: 90,
             // 最小缩放级别
             minLevel: 1,
             // 最大缩放级别
             maxLevel: 18,
         });
        ```
      */
  static create(s) {
    return new ke(s);
  }
  /**
   * Update the map, It is automatically called after mesh adding a scene
   * 模型更新回调函数，地图加入场景后会在每帧更新时被调用，该函数调用根瓦片实现瓦片树更新和数据加载
   * @param camera
   */
  update(s) {
    const i = this._clock.getElapsedTime();
    if (i > this.updateInterval / 1e3) {
      this._loader.attcth(this.loader, this.projection);
      try {
        this.rootTile.update({
          camera: s,
          loader: this._loader,
          minLevel: this.minLevel,
          maxLevel: this.maxLevel,
          LODThreshold: this.LODThreshold
        }), this.rootTile.castShadow = this.castShadow, this.rootTile.receiveShadow = this.receiveShadow;
      } catch (e) {
        console.error("Error on loading tile data.", e);
      }
      this._clock.start(), this.dispatchEvent({ type: "update", delta: i });
    }
  }
  /**
   * reload the map data，muse called after the source has changed
   * 重新加载地图，在改变地图数据源后调用它才能生效
   */
  reload() {
    this.rootTile.reload(this.loader);
  }
  /**
   * dispose map.
   * todo: remve event.
   * 释放地图资源，并移出场景
   */
  dispose() {
    this.removeFromParent(), this.reload();
  }
  /**
   * Geo coordinates converted to map model coordinates
   * 地理坐标转换为地图模型坐标(与geo2map同功能)
   * @param geo 地理坐标（经纬度）
   * @returns 模型坐标
   * @deprecated This method is not recommended. Use geo2map() instead.
   */
  geo2pos(s) {
    return this.geo2map(s);
  }
  /**
   * Geo coordinates converted to map model coordinates
   * 地理坐标转换为地图模型坐标(与geo2pos同功能)
   * @param geo 地理坐标（经纬度）
   * @returns 模型坐标
   */
  geo2map(s) {
    const i = this.projection.project(s.x, s.y);
    return new C(i.x, i.y, s.z);
  }
  /**
   * Geo coordinates converted to world coordinates
   * 地理坐标转换为世界坐标
   *
   * @param geo 地理坐标（经纬度）
   * @returns 世界坐标
   */
  geo2world(s) {
    return this.localToWorld(this.geo2map(s));
  }
  /**
   * Map model coordinates converted to geo coordinates
   * 地图模型坐标转换为地理坐标(与map2geo同功能)
   * @param pos 模型坐标
   * @returns 地理坐标（经纬度）
   *  @deprecated This method is not recommended. Use map2geo() instead.
   */
  pos2geo(s) {
    return this.map2geo(s);
  }
  /**
   * Map model coordinates converted to geo coordinates
   * 地图模型坐标转换为地理坐标(与pos2geo同功能)
   * @param map 模型坐标
   * @returns 地理坐标（经纬度）
   */
  map2geo(s) {
    const i = this.projection.unProject(s.x, s.y);
    return new C(i.lon, i.lat, s.z);
  }
  /**
   * World coordinates converted to geo coordinates
   * 世界坐标转换为地理坐标
   *
   * @param world 世界坐标
   * @returns 地理坐标（经纬度）
   */
  world2geo(s) {
    return this.pos2geo(this.worldToLocal(s.clone()));
  }
  /**
   * Get the ground infomation from latitude and longitude
   * 获取指定经纬度的地面信息（法向量、高度等）
   * @param geo 地理坐标
   * @returns 地面信息
   */
  getLocalInfoFromGeo(s) {
    const i = this.geo2world(s);
    return be(this, i);
  }
  /**
   * Get loacation infomation from world position
   * 获取指定世界坐标的地面信息
   * @param pos 世界坐标
   * @returns 地面信息
   */
  getLocalInfoFromWorld(s) {
    return be(this, s);
  }
  /**
   * Get loacation infomation from screen pointer
   * 获取指定屏幕坐标的地面信息
   * @param camera 摄像机
   * @param pointer 点的屏幕坐标（-0.5~0.5）
   * @returns 位置信息（经纬度、高度等）
   */
  getLocalInfoFromScreen(s, i) {
    return Ot(s, this, i);
  }
  /**
   * Get the number of currently downloading tiles
   * 取得当前正在下载的瓦片数量
   */
  get downloading() {
    return D.downloadThreads;
  }
  getTileCount() {
    let s = 0, i = 0, e = 0, t = 0, n = 0;
    return this.rootTile.traverse((o) => {
      o.isTile && (s++, o.isLeaf && (t++, o.inFrustum && i++), e = Math.max(e, o.z), n = D.downloadThreads);
    }), { total: s, visible: i, leaf: t, maxLevel: e, downloading: n };
  }
}
const { version: rs, author: is } = JSON.parse(kt);
function os(l, r = 100) {
  return new Promise((s) => {
    const i = setInterval(() => {
      l && (clearInterval(i), s());
    }, r);
  });
}
function _t(l) {
  return R.registerMaterialLoader(l), l;
}
function ve(l) {
  return R.registerGeometryLoader(l), l;
}
export {
  R as LoaderFactory,
  dt as Martini,
  es as PromiseWorker,
  D as Tile,
  ss as TileCanvasLoader,
  oe as TileGeometry,
  Me as TileGeometryLoader,
  xe as TileLoader,
  nt as TileLoadingManager,
  ke as TileMap,
  Xe as TileMaterial,
  ut as TileMaterialLoader,
  Se as TileSource,
  q as VectorFeatureTypes,
  ts as VectorTileRender,
  it as addSkirt,
  Qt as attachEvent,
  is as author,
  se as concatenateTypedArrays,
  ns as createBillboards,
  fe as getBoundsCoord,
  ct as getGeometryDataFromDem,
  Ge as getGridIndices,
  ze as getLocalInfoFromRay,
  Ot as getLocalInfoFromScreen,
  be as getLocalInfoFromWorld,
  Te as getNormals,
  Le as getSafeTileUrlAndBounds,
  ve as registerDEMLoader,
  _t as registerImgLoader,
  rs as version,
  os as waitFor
};
