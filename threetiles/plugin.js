var Jn = Object.defineProperty;
var Vn = (t, e, A) => e in t ? Jn(t, e, { enumerable: !0, configurable: !0, writable: !0, value: A }) : t[e] = A;
var D = (t, e, A) => Vn(t, typeof e != "symbol" ? e + "" : e, A);
import { EventDispatcher as Oi, Vector3 as aA, MOUSE as FA, TOUCH as vA, Spherical as Vt, Quaternion as Ht, Vector2 as fA, Ray as Hn, Plane as Kn, MathUtils as Qt, Clock as jn, Scene as Xn, Color as oe, FogExp2 as ot, WebGLRenderer as Zn, PerspectiveCamera as zn, AmbientLight as Wn, DirectionalLight as $n, ShaderMaterial as Ar, UniformsUtils as er, UniformsLib as tr, Mesh as ir, PlaneGeometry as nr, MeshNormalMaterial as rr, MeshBasicMaterial as sr, ImageLoader as or, Texture as wt, SRGBColorSpace as ar, FileLoader as yt, CanvasTexture as Yi, Cache as MA } from "three";
import { TileSource as AA, TileCanvasLoader as qi, LoaderFactory as ve, TileMaterial as lr, TileGeometry as gr, TileMaterialLoader as Pi, VectorTileRender as Ji, VectorFeatureTypes as GA } from "three-tile";
const Kt = { type: "change" }, Ne = { type: "start" }, jt = { type: "end" }, Be = new Hn(), Xt = new Kn(), cr = Math.cos(70 * Qt.DEG2RAD);
class fr extends Oi {
  constructor(e, A) {
    super(), this.object = e, this.domElement = A, this.domElement.style.touchAction = "none", this.enabled = !0, this.target = new aA(), this.cursor = new aA(), this.minDistance = 0, this.maxDistance = 1 / 0, this.minZoom = 0, this.maxZoom = 1 / 0, this.minTargetRadius = 0, this.maxTargetRadius = 1 / 0, this.minPolarAngle = 0, this.maxPolarAngle = Math.PI, this.minAzimuthAngle = -1 / 0, this.maxAzimuthAngle = 1 / 0, this.enableDamping = !1, this.dampingFactor = 0.05, this.enableZoom = !0, this.zoomSpeed = 1, this.enableRotate = !0, this.rotateSpeed = 1, this.enablePan = !0, this.panSpeed = 1, this.screenSpacePanning = !0, this.keyPanSpeed = 7, this.zoomToCursor = !1, this.autoRotate = !1, this.autoRotateSpeed = 2, this.keys = { LEFT: "ArrowLeft", UP: "ArrowUp", RIGHT: "ArrowRight", BOTTOM: "ArrowDown" }, this.mouseButtons = { LEFT: FA.ROTATE, MIDDLE: FA.DOLLY, RIGHT: FA.PAN }, this.touches = { ONE: vA.ROTATE, TWO: vA.DOLLY_PAN }, this.target0 = this.target.clone(), this.position0 = this.object.position.clone(), this.zoom0 = this.object.zoom, this._domElementKeyEvents = null, this.getPolarAngle = function() {
      return a.phi;
    }, this.getAzimuthalAngle = function() {
      return a.theta;
    }, this.getDistance = function() {
      return this.object.position.distanceTo(this.target);
    }, this.listenToKeyEvents = function(m) {
      m.addEventListener("keydown", _e), this._domElementKeyEvents = m;
    }, this.stopListenToKeyEvents = function() {
      this._domElementKeyEvents.removeEventListener("keydown", _e), this._domElementKeyEvents = null;
    }, this.saveState = function() {
      i.target0.copy(i.target), i.position0.copy(i.object.position), i.zoom0 = i.object.zoom;
    }, this.reset = function() {
      i.target.copy(i.target0), i.object.position.copy(i.position0), i.object.zoom = i.zoom0, i.object.updateProjectionMatrix(), i.dispatchEvent(Kt), i.update(), r = n.NONE;
    }, this.update = function() {
      const m = new aA(), G = new Ht().setFromUnitVectors(e.up, new aA(0, 1, 0)), K = G.clone().invert(), Z = new aA(), rA = new Ht(), LA = new aA(), cA = 2 * Math.PI;
      return function(Pn = null) {
        const Pt = i.object.position;
        m.copy(Pt).sub(i.target), m.applyQuaternion(G), a.setFromVector3(m), i.autoRotate && r === n.NONE && v(b(Pn)), i.enableDamping ? (a.theta += h.theta * i.dampingFactor, a.phi += h.phi * i.dampingFactor) : (a.theta += h.theta, a.phi += h.phi);
        let pA = i.minAzimuthAngle, xA = i.maxAzimuthAngle;
        isFinite(pA) && isFinite(xA) && (pA < -Math.PI ? pA += cA : pA > Math.PI && (pA -= cA), xA < -Math.PI ? xA += cA : xA > Math.PI && (xA -= cA), pA <= xA ? a.theta = Math.max(pA, Math.min(xA, a.theta)) : a.theta = a.theta > (pA + xA) / 2 ? Math.max(pA, a.theta) : Math.min(xA, a.theta)), a.phi = Math.max(i.minPolarAngle, Math.min(i.maxPolarAngle, a.phi)), a.makeSafe(), i.enableDamping === !0 ? i.target.addScaledVector(s, i.dampingFactor) : i.target.add(s), i.target.sub(i.cursor), i.target.clampLength(i.minTargetRadius, i.maxTargetRadius), i.target.add(i.cursor);
        let $A = !1;
        if (i.zoomToCursor && C || i.object.isOrthographicCamera)
          a.radius = O(a.radius);
        else {
          const mA = a.radius;
          a.radius = O(a.radius * o), $A = mA != a.radius;
        }
        if (m.setFromSpherical(a), m.applyQuaternion(K), Pt.copy(i.target).add(m), i.object.lookAt(i.target), i.enableDamping === !0 ? (h.theta *= 1 - i.dampingFactor, h.phi *= 1 - i.dampingFactor, s.multiplyScalar(1 - i.dampingFactor)) : (h.set(0, 0, 0), s.set(0, 0, 0)), i.zoomToCursor && C) {
          let mA = null;
          if (i.object.isPerspectiveCamera) {
            const Ae = m.length();
            mA = O(Ae * o);
            const Ie = Ae - mA;
            i.object.position.addScaledVector(d, Ie), i.object.updateMatrixWorld(), $A = !!Ie;
          } else if (i.object.isOrthographicCamera) {
            const Ae = new aA(x.x, x.y, 0);
            Ae.unproject(i.object);
            const Ie = i.object.zoom;
            i.object.zoom = Math.max(i.minZoom, Math.min(i.maxZoom, i.object.zoom / o)), i.object.updateProjectionMatrix(), $A = Ie !== i.object.zoom;
            const Jt = new aA(x.x, x.y, 0);
            Jt.unproject(i.object), i.object.position.sub(Jt).add(Ae), i.object.updateMatrixWorld(), mA = m.length();
          } else
            console.warn("WARNING: OrbitControls.js encountered an unknown camera type - zoom to cursor disabled."), i.zoomToCursor = !1;
          mA !== null && (this.screenSpacePanning ? i.target.set(0, 0, -1).transformDirection(i.object.matrix).multiplyScalar(mA).add(i.object.position) : (Be.origin.copy(i.object.position), Be.direction.set(0, 0, -1).transformDirection(i.object.matrix), Math.abs(i.object.up.dot(Be.direction)) < cr ? e.lookAt(i.target) : (Xt.setFromNormalAndCoplanarPoint(i.object.up, i.target), Be.intersectPlane(Xt, i.target))));
        } else if (i.object.isOrthographicCamera) {
          const mA = i.object.zoom;
          i.object.zoom = Math.max(i.minZoom, Math.min(i.maxZoom, i.object.zoom / o)), mA !== i.object.zoom && (i.object.updateProjectionMatrix(), $A = !0);
        }
        return o = 1, C = !1, $A || Z.distanceToSquared(i.object.position) > l || 8 * (1 - rA.dot(i.object.quaternion)) > l || LA.distanceToSquared(i.target) > l ? (i.dispatchEvent(Kt), Z.copy(i.object.position), rA.copy(i.object.quaternion), LA.copy(i.target), !0) : !1;
      };
    }(), this.dispose = function() {
      i.domElement.removeEventListener("contextmenu", Yt), i.domElement.removeEventListener("pointerdown", IA), i.domElement.removeEventListener("pointercancel", oA), i.domElement.removeEventListener("wheel", Tt), i.domElement.removeEventListener("pointermove", TA), i.domElement.removeEventListener("pointerup", oA), i.domElement.getRootNode().removeEventListener("keydown", _t, { capture: !0 }), i._domElementKeyEvents !== null && (i._domElementKeyEvents.removeEventListener("keydown", _e), i._domElementKeyEvents = null);
    };
    const i = this, n = {
      NONE: -1,
      ROTATE: 0,
      DOLLY: 1,
      PAN: 2,
      TOUCH_ROTATE: 3,
      TOUCH_PAN: 4,
      TOUCH_DOLLY_PAN: 5,
      TOUCH_DOLLY_ROTATE: 6
    };
    let r = n.NONE;
    const l = 1e-6, a = new Vt(), h = new Vt();
    let o = 1;
    const s = new aA(), g = new fA(), I = new fA(), c = new fA(), f = new fA(), w = new fA(), B = new fA(), u = new fA(), E = new fA(), y = new fA(), d = new aA(), x = new fA();
    let C = !1;
    const Q = [], p = {};
    let k = !1;
    function b(m) {
      return m !== null ? 2 * Math.PI / 60 * i.autoRotateSpeed * m : 2 * Math.PI / 60 / 60 * i.autoRotateSpeed;
    }
    function S(m) {
      const G = Math.abs(m * 0.01);
      return Math.pow(0.95, i.zoomSpeed * G);
    }
    function v(m) {
      h.theta -= m;
    }
    function L(m) {
      h.phi -= m;
    }
    const P = function() {
      const m = new aA();
      return function(K, Z) {
        m.setFromMatrixColumn(Z, 0), m.multiplyScalar(-K), s.add(m);
      };
    }(), M = function() {
      const m = new aA();
      return function(K, Z) {
        i.screenSpacePanning === !0 ? m.setFromMatrixColumn(Z, 1) : (m.setFromMatrixColumn(Z, 0), m.crossVectors(i.object.up, m)), m.multiplyScalar(K), s.add(m);
      };
    }(), F = function() {
      const m = new aA();
      return function(K, Z) {
        const rA = i.domElement;
        if (i.object.isPerspectiveCamera) {
          const LA = i.object.position;
          m.copy(LA).sub(i.target);
          let cA = m.length();
          cA *= Math.tan(i.object.fov / 2 * Math.PI / 180), P(2 * K * cA / rA.clientHeight, i.object.matrix), M(2 * Z * cA / rA.clientHeight, i.object.matrix);
        } else i.object.isOrthographicCamera ? (P(K * (i.object.right - i.object.left) / i.object.zoom / rA.clientWidth, i.object.matrix), M(Z * (i.object.top - i.object.bottom) / i.object.zoom / rA.clientHeight, i.object.matrix)) : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - pan disabled."), i.enablePan = !1);
      };
    }();
    function U(m) {
      i.object.isPerspectiveCamera || i.object.isOrthographicCamera ? o /= m : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), i.enableZoom = !1);
    }
    function R(m) {
      i.object.isPerspectiveCamera || i.object.isOrthographicCamera ? o *= m : (console.warn("WARNING: OrbitControls.js encountered an unknown camera type - dolly/zoom disabled."), i.enableZoom = !1);
    }
    function T(m, G) {
      if (!i.zoomToCursor)
        return;
      C = !0;
      const K = i.domElement.getBoundingClientRect(), Z = m - K.left, rA = G - K.top, LA = K.width, cA = K.height;
      x.x = Z / LA * 2 - 1, x.y = -(rA / cA) * 2 + 1, d.set(x.x, x.y, 1).unproject(i.object).sub(i.object.position).normalize();
    }
    function O(m) {
      return Math.max(i.minDistance, Math.min(i.maxDistance, m));
    }
    function N(m) {
      g.set(m.clientX, m.clientY);
    }
    function H(m) {
      T(m.clientX, m.clientX), u.set(m.clientX, m.clientY);
    }
    function X(m) {
      f.set(m.clientX, m.clientY);
    }
    function _(m) {
      I.set(m.clientX, m.clientY), c.subVectors(I, g).multiplyScalar(i.rotateSpeed);
      const G = i.domElement;
      v(2 * Math.PI * c.x / G.clientHeight), L(2 * Math.PI * c.y / G.clientHeight), g.copy(I), i.update();
    }
    function q(m) {
      E.set(m.clientX, m.clientY), y.subVectors(E, u), y.y > 0 ? U(S(y.y)) : y.y < 0 && R(S(y.y)), u.copy(E), i.update();
    }
    function Y(m) {
      w.set(m.clientX, m.clientY), B.subVectors(w, f).multiplyScalar(i.panSpeed), F(B.x, B.y), f.copy(w), i.update();
    }
    function V(m) {
      T(m.clientX, m.clientY), m.deltaY < 0 ? R(S(m.deltaY)) : m.deltaY > 0 && U(S(m.deltaY)), i.update();
    }
    function j(m) {
      let G = !1;
      switch (m.code) {
        case i.keys.UP:
          m.ctrlKey || m.metaKey || m.shiftKey ? L(2 * Math.PI * i.rotateSpeed / i.domElement.clientHeight) : F(0, i.keyPanSpeed), G = !0;
          break;
        case i.keys.BOTTOM:
          m.ctrlKey || m.metaKey || m.shiftKey ? L(-2 * Math.PI * i.rotateSpeed / i.domElement.clientHeight) : F(0, -i.keyPanSpeed), G = !0;
          break;
        case i.keys.LEFT:
          m.ctrlKey || m.metaKey || m.shiftKey ? v(2 * Math.PI * i.rotateSpeed / i.domElement.clientHeight) : F(i.keyPanSpeed, 0), G = !0;
          break;
        case i.keys.RIGHT:
          m.ctrlKey || m.metaKey || m.shiftKey ? v(-2 * Math.PI * i.rotateSpeed / i.domElement.clientHeight) : F(-i.keyPanSpeed, 0), G = !0;
          break;
      }
      G && (m.preventDefault(), i.update());
    }
    function z(m) {
      if (Q.length === 1)
        g.set(m.pageX, m.pageY);
      else {
        const G = qA(m), K = 0.5 * (m.pageX + G.x), Z = 0.5 * (m.pageY + G.y);
        g.set(K, Z);
      }
    }
    function $(m) {
      if (Q.length === 1)
        f.set(m.pageX, m.pageY);
      else {
        const G = qA(m), K = 0.5 * (m.pageX + G.x), Z = 0.5 * (m.pageY + G.y);
        f.set(K, Z);
      }
    }
    function tA(m) {
      const G = qA(m), K = m.pageX - G.x, Z = m.pageY - G.y, rA = Math.sqrt(K * K + Z * Z);
      u.set(0, rA);
    }
    function iA(m) {
      i.enableZoom && tA(m), i.enablePan && $(m);
    }
    function YA(m) {
      i.enableZoom && tA(m), i.enableRotate && z(m);
    }
    function BA(m) {
      if (Q.length == 1)
        I.set(m.pageX, m.pageY);
      else {
        const K = qA(m), Z = 0.5 * (m.pageX + K.x), rA = 0.5 * (m.pageY + K.y);
        I.set(Z, rA);
      }
      c.subVectors(I, g).multiplyScalar(i.rotateSpeed);
      const G = i.domElement;
      v(2 * Math.PI * c.x / G.clientHeight), L(2 * Math.PI * c.y / G.clientHeight), g.copy(I);
    }
    function lA(m) {
      if (Q.length === 1)
        w.set(m.pageX, m.pageY);
      else {
        const G = qA(m), K = 0.5 * (m.pageX + G.x), Z = 0.5 * (m.pageY + G.y);
        w.set(K, Z);
      }
      B.subVectors(w, f).multiplyScalar(i.panSpeed), F(B.x, B.y), f.copy(w);
    }
    function nA(m) {
      const G = qA(m), K = m.pageX - G.x, Z = m.pageY - G.y, rA = Math.sqrt(K * K + Z * Z);
      E.set(0, rA), y.set(0, Math.pow(E.y / u.y, i.zoomSpeed)), U(y.y), u.copy(E);
      const LA = (m.pageX + G.x) * 0.5, cA = (m.pageY + G.y) * 0.5;
      T(LA, cA);
    }
    function Te(m) {
      i.enableZoom && nA(m), i.enablePan && lA(m);
    }
    function he(m) {
      i.enableZoom && nA(m), i.enableRotate && BA(m);
    }
    function IA(m) {
      i.enabled !== !1 && (Q.length === 0 && (i.domElement.setPointerCapture(m.pointerId), i.domElement.addEventListener("pointermove", TA), i.domElement.addEventListener("pointerup", oA)), !qn(m) && (On(m), m.pointerType === "touch" ? Ot(m) : Un(m)));
    }
    function TA(m) {
      i.enabled !== !1 && (m.pointerType === "touch" ? Nn(m) : Tn(m));
    }
    function oA(m) {
      switch (Yn(m), Q.length) {
        case 0:
          i.domElement.releasePointerCapture(m.pointerId), i.domElement.removeEventListener("pointermove", TA), i.domElement.removeEventListener("pointerup", oA), i.dispatchEvent(jt), r = n.NONE;
          break;
        case 1:
          const G = Q[0], K = p[G];
          Ot({ pointerId: G, pageX: K.x, pageY: K.y });
          break;
      }
    }
    function Un(m) {
      let G;
      switch (m.button) {
        case 0:
          G = i.mouseButtons.LEFT;
          break;
        case 1:
          G = i.mouseButtons.MIDDLE;
          break;
        case 2:
          G = i.mouseButtons.RIGHT;
          break;
        default:
          G = -1;
      }
      switch (G) {
        case FA.DOLLY:
          if (i.enableZoom === !1) return;
          H(m), r = n.DOLLY;
          break;
        case FA.ROTATE:
          if (m.ctrlKey || m.metaKey || m.shiftKey) {
            if (i.enablePan === !1) return;
            X(m), r = n.PAN;
          } else {
            if (i.enableRotate === !1) return;
            N(m), r = n.ROTATE;
          }
          break;
        case FA.PAN:
          if (m.ctrlKey || m.metaKey || m.shiftKey) {
            if (i.enableRotate === !1) return;
            N(m), r = n.ROTATE;
          } else {
            if (i.enablePan === !1) return;
            X(m), r = n.PAN;
          }
          break;
        default:
          r = n.NONE;
      }
      r !== n.NONE && i.dispatchEvent(Ne);
    }
    function Tn(m) {
      switch (r) {
        case n.ROTATE:
          if (i.enableRotate === !1) return;
          _(m);
          break;
        case n.DOLLY:
          if (i.enableZoom === !1) return;
          q(m);
          break;
        case n.PAN:
          if (i.enablePan === !1) return;
          Y(m);
          break;
      }
    }
    function Tt(m) {
      i.enabled === !1 || i.enableZoom === !1 || r !== n.NONE || (m.preventDefault(), i.dispatchEvent(Ne), V(_n(m)), i.dispatchEvent(jt));
    }
    function _n(m) {
      const G = m.deltaMode, K = {
        clientX: m.clientX,
        clientY: m.clientY,
        deltaY: m.deltaY
      };
      switch (G) {
        case 1:
          K.deltaY *= 16;
          break;
        case 2:
          K.deltaY *= 100;
          break;
      }
      return m.ctrlKey && !k && (K.deltaY *= 10), K;
    }
    function _t(m) {
      m.key === "Control" && (k = !0, i.domElement.getRootNode().addEventListener("keyup", Nt, { passive: !0, capture: !0 }));
    }
    function Nt(m) {
      m.key === "Control" && (k = !1, i.domElement.getRootNode().removeEventListener("keyup", Nt, { passive: !0, capture: !0 }));
    }
    function _e(m) {
      i.enabled === !1 || i.enablePan === !1 || j(m);
    }
    function Ot(m) {
      switch (qt(m), Q.length) {
        case 1:
          switch (i.touches.ONE) {
            case vA.ROTATE:
              if (i.enableRotate === !1) return;
              z(m), r = n.TOUCH_ROTATE;
              break;
            case vA.PAN:
              if (i.enablePan === !1) return;
              $(m), r = n.TOUCH_PAN;
              break;
            default:
              r = n.NONE;
          }
          break;
        case 2:
          switch (i.touches.TWO) {
            case vA.DOLLY_PAN:
              if (i.enableZoom === !1 && i.enablePan === !1) return;
              iA(m), r = n.TOUCH_DOLLY_PAN;
              break;
            case vA.DOLLY_ROTATE:
              if (i.enableZoom === !1 && i.enableRotate === !1) return;
              YA(m), r = n.TOUCH_DOLLY_ROTATE;
              break;
            default:
              r = n.NONE;
          }
          break;
        default:
          r = n.NONE;
      }
      r !== n.NONE && i.dispatchEvent(Ne);
    }
    function Nn(m) {
      switch (qt(m), r) {
        case n.TOUCH_ROTATE:
          if (i.enableRotate === !1) return;
          BA(m), i.update();
          break;
        case n.TOUCH_PAN:
          if (i.enablePan === !1) return;
          lA(m), i.update();
          break;
        case n.TOUCH_DOLLY_PAN:
          if (i.enableZoom === !1 && i.enablePan === !1) return;
          Te(m), i.update();
          break;
        case n.TOUCH_DOLLY_ROTATE:
          if (i.enableZoom === !1 && i.enableRotate === !1) return;
          he(m), i.update();
          break;
        default:
          r = n.NONE;
      }
    }
    function Yt(m) {
      i.enabled !== !1 && m.preventDefault();
    }
    function On(m) {
      Q.push(m.pointerId);
    }
    function Yn(m) {
      delete p[m.pointerId];
      for (let G = 0; G < Q.length; G++)
        if (Q[G] == m.pointerId) {
          Q.splice(G, 1);
          return;
        }
    }
    function qn(m) {
      for (let G = 0; G < Q.length; G++)
        if (Q[G] == m.pointerId) return !0;
      return !1;
    }
    function qt(m) {
      let G = p[m.pointerId];
      G === void 0 && (G = new fA(), p[m.pointerId] = G), G.set(m.pageX, m.pageY);
    }
    function qA(m) {
      const G = m.pointerId === Q[0] ? Q[1] : Q[0];
      return p[G];
    }
    i.domElement.addEventListener("contextmenu", Yt), i.domElement.addEventListener("pointerdown", IA), i.domElement.addEventListener("pointercancel", oA), i.domElement.addEventListener("wheel", Tt, { passive: !1 }), i.domElement.getRootNode().addEventListener("keydown", _t, { passive: !0, capture: !0 }), this.update();
  }
}
class hr extends fr {
  constructor(e, A) {
    super(e, A), this.screenSpacePanning = !1, this.mouseButtons = { LEFT: FA.PAN, MIDDLE: FA.DOLLY, RIGHT: FA.ROTATE }, this.touches = { ONE: vA.PAN, TWO: vA.DOLLY_ROTATE };
  }
}
var KA = Object.freeze({
  Linear: Object.freeze({
    None: function(t) {
      return t;
    },
    In: function(t) {
      return t;
    },
    Out: function(t) {
      return t;
    },
    InOut: function(t) {
      return t;
    }
  }),
  Quadratic: Object.freeze({
    In: function(t) {
      return t * t;
    },
    Out: function(t) {
      return t * (2 - t);
    },
    InOut: function(t) {
      return (t *= 2) < 1 ? 0.5 * t * t : -0.5 * (--t * (t - 2) - 1);
    }
  }),
  Cubic: Object.freeze({
    In: function(t) {
      return t * t * t;
    },
    Out: function(t) {
      return --t * t * t + 1;
    },
    InOut: function(t) {
      return (t *= 2) < 1 ? 0.5 * t * t * t : 0.5 * ((t -= 2) * t * t + 2);
    }
  }),
  Quartic: Object.freeze({
    In: function(t) {
      return t * t * t * t;
    },
    Out: function(t) {
      return 1 - --t * t * t * t;
    },
    InOut: function(t) {
      return (t *= 2) < 1 ? 0.5 * t * t * t * t : -0.5 * ((t -= 2) * t * t * t - 2);
    }
  }),
  Quintic: Object.freeze({
    In: function(t) {
      return t * t * t * t * t;
    },
    Out: function(t) {
      return --t * t * t * t * t + 1;
    },
    InOut: function(t) {
      return (t *= 2) < 1 ? 0.5 * t * t * t * t * t : 0.5 * ((t -= 2) * t * t * t * t + 2);
    }
  }),
  Sinusoidal: Object.freeze({
    In: function(t) {
      return 1 - Math.sin((1 - t) * Math.PI / 2);
    },
    Out: function(t) {
      return Math.sin(t * Math.PI / 2);
    },
    InOut: function(t) {
      return 0.5 * (1 - Math.sin(Math.PI * (0.5 - t)));
    }
  }),
  Exponential: Object.freeze({
    In: function(t) {
      return t === 0 ? 0 : Math.pow(1024, t - 1);
    },
    Out: function(t) {
      return t === 1 ? 1 : 1 - Math.pow(2, -10 * t);
    },
    InOut: function(t) {
      return t === 0 ? 0 : t === 1 ? 1 : (t *= 2) < 1 ? 0.5 * Math.pow(1024, t - 1) : 0.5 * (-Math.pow(2, -10 * (t - 1)) + 2);
    }
  }),
  Circular: Object.freeze({
    In: function(t) {
      return 1 - Math.sqrt(1 - t * t);
    },
    Out: function(t) {
      return Math.sqrt(1 - --t * t);
    },
    InOut: function(t) {
      return (t *= 2) < 1 ? -0.5 * (Math.sqrt(1 - t * t) - 1) : 0.5 * (Math.sqrt(1 - (t -= 2) * t) + 1);
    }
  }),
  Elastic: Object.freeze({
    In: function(t) {
      return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI);
    },
    Out: function(t) {
      return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t - 0.1) * 5 * Math.PI) + 1;
    },
    InOut: function(t) {
      return t === 0 ? 0 : t === 1 ? 1 : (t *= 2, t < 1 ? -0.5 * Math.pow(2, 10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) : 0.5 * Math.pow(2, -10 * (t - 1)) * Math.sin((t - 1.1) * 5 * Math.PI) + 1);
    }
  }),
  Back: Object.freeze({
    In: function(t) {
      var e = 1.70158;
      return t === 1 ? 1 : t * t * ((e + 1) * t - e);
    },
    Out: function(t) {
      var e = 1.70158;
      return t === 0 ? 0 : --t * t * ((e + 1) * t + e) + 1;
    },
    InOut: function(t) {
      var e = 2.5949095;
      return (t *= 2) < 1 ? 0.5 * (t * t * ((e + 1) * t - e)) : 0.5 * ((t -= 2) * t * ((e + 1) * t + e) + 2);
    }
  }),
  Bounce: Object.freeze({
    In: function(t) {
      return 1 - KA.Bounce.Out(1 - t);
    },
    Out: function(t) {
      return t < 1 / 2.75 ? 7.5625 * t * t : t < 2 / 2.75 ? 7.5625 * (t -= 1.5 / 2.75) * t + 0.75 : t < 2.5 / 2.75 ? 7.5625 * (t -= 2.25 / 2.75) * t + 0.9375 : 7.5625 * (t -= 2.625 / 2.75) * t + 0.984375;
    },
    InOut: function(t) {
      return t < 0.5 ? KA.Bounce.In(t * 2) * 0.5 : KA.Bounce.Out(t * 2 - 1) * 0.5 + 0.5;
    }
  }),
  generatePow: function(t) {
    return t === void 0 && (t = 4), t = t < Number.EPSILON ? Number.EPSILON : t, t = t > 1e4 ? 1e4 : t, {
      In: function(e) {
        return Math.pow(e, t);
      },
      Out: function(e) {
        return 1 - Math.pow(1 - e, t);
      },
      InOut: function(e) {
        return e < 0.5 ? Math.pow(e * 2, t) / 2 : (1 - Math.pow(2 - e * 2, t)) / 2 + 0.5;
      }
    };
  }
}), ie = function() {
  return performance.now();
}, Ir = (
  /** @class */
  function() {
    function t() {
      this._tweens = {}, this._tweensAddedDuringUpdate = {};
    }
    return t.prototype.getAll = function() {
      var e = this;
      return Object.keys(this._tweens).map(function(A) {
        return e._tweens[A];
      });
    }, t.prototype.removeAll = function() {
      this._tweens = {};
    }, t.prototype.add = function(e) {
      this._tweens[e.getId()] = e, this._tweensAddedDuringUpdate[e.getId()] = e;
    }, t.prototype.remove = function(e) {
      delete this._tweens[e.getId()], delete this._tweensAddedDuringUpdate[e.getId()];
    }, t.prototype.update = function(e, A) {
      e === void 0 && (e = ie()), A === void 0 && (A = !1);
      var i = Object.keys(this._tweens);
      if (i.length === 0)
        return !1;
      for (; i.length > 0; ) {
        this._tweensAddedDuringUpdate = {};
        for (var n = 0; n < i.length; n++) {
          var r = this._tweens[i[n]], l = !A;
          r && r.update(e, l) === !1 && !A && delete this._tweens[i[n]];
        }
        i = Object.keys(this._tweensAddedDuringUpdate);
      }
      return !0;
    }, t;
  }()
), at = {
  Linear: function(t, e) {
    var A = t.length - 1, i = A * e, n = Math.floor(i), r = at.Utils.Linear;
    return e < 0 ? r(t[0], t[1], i) : e > 1 ? r(t[A], t[A - 1], A - i) : r(t[n], t[n + 1 > A ? A : n + 1], i - n);
  },
  Utils: {
    Linear: function(t, e, A) {
      return (e - t) * A + t;
    }
  }
}, Vi = (
  /** @class */
  function() {
    function t() {
    }
    return t.nextId = function() {
      return t._nextId++;
    }, t._nextId = 0, t;
  }()
), lt = new Ir(), Zt = (
  /** @class */
  function() {
    function t(e, A) {
      A === void 0 && (A = lt), this._object = e, this._group = A, this._isPaused = !1, this._pauseStart = 0, this._valuesStart = {}, this._valuesEnd = {}, this._valuesStartRepeat = {}, this._duration = 1e3, this._isDynamic = !1, this._initialRepeat = 0, this._repeat = 0, this._yoyo = !1, this._isPlaying = !1, this._reversed = !1, this._delayTime = 0, this._startTime = 0, this._easingFunction = KA.Linear.None, this._interpolationFunction = at.Linear, this._chainedTweens = [], this._onStartCallbackFired = !1, this._onEveryStartCallbackFired = !1, this._id = Vi.nextId(), this._isChainStopped = !1, this._propertiesAreSetUp = !1, this._goToEnd = !1;
    }
    return t.prototype.getId = function() {
      return this._id;
    }, t.prototype.isPlaying = function() {
      return this._isPlaying;
    }, t.prototype.isPaused = function() {
      return this._isPaused;
    }, t.prototype.getDuration = function() {
      return this._duration;
    }, t.prototype.to = function(e, A) {
      if (A === void 0 && (A = 1e3), this._isPlaying)
        throw new Error("Can not call Tween.to() while Tween is already started or paused. Stop the Tween first.");
      return this._valuesEnd = e, this._propertiesAreSetUp = !1, this._duration = A < 0 ? 0 : A, this;
    }, t.prototype.duration = function(e) {
      return e === void 0 && (e = 1e3), this._duration = e < 0 ? 0 : e, this;
    }, t.prototype.dynamic = function(e) {
      return e === void 0 && (e = !1), this._isDynamic = e, this;
    }, t.prototype.start = function(e, A) {
      if (e === void 0 && (e = ie()), A === void 0 && (A = !1), this._isPlaying)
        return this;
      if (this._group && this._group.add(this), this._repeat = this._initialRepeat, this._reversed) {
        this._reversed = !1;
        for (var i in this._valuesStartRepeat)
          this._swapEndStartRepeatValues(i), this._valuesStart[i] = this._valuesStartRepeat[i];
      }
      if (this._isPlaying = !0, this._isPaused = !1, this._onStartCallbackFired = !1, this._onEveryStartCallbackFired = !1, this._isChainStopped = !1, this._startTime = e, this._startTime += this._delayTime, !this._propertiesAreSetUp || A) {
        if (this._propertiesAreSetUp = !0, !this._isDynamic) {
          var n = {};
          for (var r in this._valuesEnd)
            n[r] = this._valuesEnd[r];
          this._valuesEnd = n;
        }
        this._setupProperties(this._object, this._valuesStart, this._valuesEnd, this._valuesStartRepeat, A);
      }
      return this;
    }, t.prototype.startFromCurrentValues = function(e) {
      return this.start(e, !0);
    }, t.prototype._setupProperties = function(e, A, i, n, r) {
      for (var l in i) {
        var a = e[l], h = Array.isArray(a), o = h ? "array" : typeof a, s = !h && Array.isArray(i[l]);
        if (!(o === "undefined" || o === "function")) {
          if (s) {
            var g = i[l];
            if (g.length === 0)
              continue;
            for (var I = [a], c = 0, f = g.length; c < f; c += 1) {
              var w = this._handleRelativeValue(a, g[c]);
              if (isNaN(w)) {
                s = !1, console.warn("Found invalid interpolation list. Skipping.");
                break;
              }
              I.push(w);
            }
            s && (i[l] = I);
          }
          if ((o === "object" || h) && a && !s) {
            A[l] = h ? [] : {};
            var B = a;
            for (var u in B)
              A[l][u] = B[u];
            n[l] = h ? [] : {};
            var g = i[l];
            if (!this._isDynamic) {
              var E = {};
              for (var u in g)
                E[u] = g[u];
              i[l] = g = E;
            }
            this._setupProperties(B, A[l], g, n[l], r);
          } else
            (typeof A[l] > "u" || r) && (A[l] = a), h || (A[l] *= 1), s ? n[l] = i[l].slice().reverse() : n[l] = A[l] || 0;
        }
      }
    }, t.prototype.stop = function() {
      return this._isChainStopped || (this._isChainStopped = !0, this.stopChainedTweens()), this._isPlaying ? (this._group && this._group.remove(this), this._isPlaying = !1, this._isPaused = !1, this._onStopCallback && this._onStopCallback(this._object), this) : this;
    }, t.prototype.end = function() {
      return this._goToEnd = !0, this.update(1 / 0), this;
    }, t.prototype.pause = function(e) {
      return e === void 0 && (e = ie()), this._isPaused || !this._isPlaying ? this : (this._isPaused = !0, this._pauseStart = e, this._group && this._group.remove(this), this);
    }, t.prototype.resume = function(e) {
      return e === void 0 && (e = ie()), !this._isPaused || !this._isPlaying ? this : (this._isPaused = !1, this._startTime += e - this._pauseStart, this._pauseStart = 0, this._group && this._group.add(this), this);
    }, t.prototype.stopChainedTweens = function() {
      for (var e = 0, A = this._chainedTweens.length; e < A; e++)
        this._chainedTweens[e].stop();
      return this;
    }, t.prototype.group = function(e) {
      return e === void 0 && (e = lt), this._group = e, this;
    }, t.prototype.delay = function(e) {
      return e === void 0 && (e = 0), this._delayTime = e, this;
    }, t.prototype.repeat = function(e) {
      return e === void 0 && (e = 0), this._initialRepeat = e, this._repeat = e, this;
    }, t.prototype.repeatDelay = function(e) {
      return this._repeatDelayTime = e, this;
    }, t.prototype.yoyo = function(e) {
      return e === void 0 && (e = !1), this._yoyo = e, this;
    }, t.prototype.easing = function(e) {
      return e === void 0 && (e = KA.Linear.None), this._easingFunction = e, this;
    }, t.prototype.interpolation = function(e) {
      return e === void 0 && (e = at.Linear), this._interpolationFunction = e, this;
    }, t.prototype.chain = function() {
      for (var e = [], A = 0; A < arguments.length; A++)
        e[A] = arguments[A];
      return this._chainedTweens = e, this;
    }, t.prototype.onStart = function(e) {
      return this._onStartCallback = e, this;
    }, t.prototype.onEveryStart = function(e) {
      return this._onEveryStartCallback = e, this;
    }, t.prototype.onUpdate = function(e) {
      return this._onUpdateCallback = e, this;
    }, t.prototype.onRepeat = function(e) {
      return this._onRepeatCallback = e, this;
    }, t.prototype.onComplete = function(e) {
      return this._onCompleteCallback = e, this;
    }, t.prototype.onStop = function(e) {
      return this._onStopCallback = e, this;
    }, t.prototype.update = function(e, A) {
      var i;
      if (e === void 0 && (e = ie()), A === void 0 && (A = !0), this._isPaused)
        return !0;
      var n = this._startTime + this._duration;
      if (!this._goToEnd && !this._isPlaying) {
        if (e > n)
          return !1;
        A && this.start(e, !0);
      }
      if (this._goToEnd = !1, e < this._startTime)
        return !0;
      this._onStartCallbackFired === !1 && (this._onStartCallback && this._onStartCallback(this._object), this._onStartCallbackFired = !0), this._onEveryStartCallbackFired === !1 && (this._onEveryStartCallback && this._onEveryStartCallback(this._object), this._onEveryStartCallbackFired = !0);
      var r = e - this._startTime, l = this._duration + ((i = this._repeatDelayTime) !== null && i !== void 0 ? i : this._delayTime), a = this._duration + this._repeat * l, h = this._calculateElapsedPortion(r, l, a), o = this._easingFunction(h), s = this._calculateCompletionStatus(r, l);
      if (s === "repeat" && this._processRepetition(r, l), this._updateProperties(this._object, this._valuesStart, this._valuesEnd, o), s === "about-to-repeat" && this._processRepetition(r, l), this._onUpdateCallback && this._onUpdateCallback(this._object, h), s === "repeat" || s === "about-to-repeat")
        this._onRepeatCallback && this._onRepeatCallback(this._object), this._onEveryStartCallbackFired = !1;
      else if (s === "completed") {
        this._isPlaying = !1, this._onCompleteCallback && this._onCompleteCallback(this._object);
        for (var g = 0, I = this._chainedTweens.length; g < I; g++)
          this._chainedTweens[g].start(this._startTime + this._duration, !1);
      }
      return s !== "completed";
    }, t.prototype._calculateElapsedPortion = function(e, A, i) {
      if (this._duration === 0 || e > i)
        return 1;
      var n = e % A, r = Math.min(n / this._duration, 1);
      return r === 0 && e !== 0 && e % this._duration === 0 ? 1 : r;
    }, t.prototype._calculateCompletionStatus = function(e, A) {
      return this._duration !== 0 && e < this._duration ? "playing" : this._repeat <= 0 ? "completed" : e === this._duration ? "about-to-repeat" : "repeat";
    }, t.prototype._processRepetition = function(e, A) {
      var i = Math.min(Math.trunc((e - this._duration) / A) + 1, this._repeat);
      isFinite(this._repeat) && (this._repeat -= i);
      for (var n in this._valuesStartRepeat) {
        var r = this._valuesEnd[n];
        !this._yoyo && typeof r == "string" && (this._valuesStartRepeat[n] = this._valuesStartRepeat[n] + parseFloat(r)), this._yoyo && this._swapEndStartRepeatValues(n), this._valuesStart[n] = this._valuesStartRepeat[n];
      }
      this._yoyo && (this._reversed = !this._reversed), this._startTime += A * i;
    }, t.prototype._updateProperties = function(e, A, i, n) {
      for (var r in i)
        if (A[r] !== void 0) {
          var l = A[r] || 0, a = i[r], h = Array.isArray(e[r]), o = Array.isArray(a), s = !h && o;
          s ? e[r] = this._interpolationFunction(a, n) : typeof a == "object" && a ? this._updateProperties(e[r], l, a, n) : (a = this._handleRelativeValue(l, a), typeof a == "number" && (e[r] = l + (a - l) * n));
        }
    }, t.prototype._handleRelativeValue = function(e, A) {
      return typeof A != "string" ? A : A.charAt(0) === "+" || A.charAt(0) === "-" ? e + parseFloat(A) : parseFloat(A);
    }, t.prototype._swapEndStartRepeatValues = function(e) {
      var A = this._valuesStartRepeat[e], i = this._valuesEnd[e];
      typeof i == "string" ? this._valuesStartRepeat[e] = this._valuesStartRepeat[e] + parseFloat(i) : this._valuesStartRepeat[e] = this._valuesEnd[e], this._valuesEnd[e] = A;
    }, t;
  }()
);
Vi.nextId;
var QA = lt;
QA.getAll.bind(QA);
QA.removeAll.bind(QA);
QA.add.bind(QA);
QA.remove.bind(QA);
var Br = QA.update.bind(QA);
class Bl extends Oi {
  /**
   * Constructor
   * @param container container element or selector string
   * @param options GLViewer options
   */
  constructor(A, i = {}) {
    super();
    D(this, "scene");
    D(this, "renderer");
    D(this, "camera");
    D(this, "controls");
    D(this, "ambLight");
    D(this, "dirLight");
    D(this, "container");
    D(this, "_clock", new jn());
    D(this, "_fogFactor", 1);
    const { antialias: n = !1, stencil: r = !0, logarithmicDepthBuffer: l = !0 } = i;
    this.renderer = this._createRenderer(n, r, l), this.scene = this._createScene(), this.camera = this._createCamera(), A && this.addTo(A), this.controls = this._createControls(), this.ambLight = this._createAmbLight(), this.scene.add(this.ambLight), this.dirLight = this._createDirLight(), this.scene.add(this.dirLight), this.scene.add(this.dirLight.target), this.renderer.setAnimationLoop(this.animate.bind(this));
  }
  /** Get fog factor */
  get fogFactor() {
    return this._fogFactor;
  }
  /** Set fog factor, default 1 */
  set fogFactor(A) {
    this._fogFactor = A, this.controls.dispatchEvent({ type: "change" });
  }
  /** Container width */
  get width() {
    return this.container?.clientWidth || 0;
  }
  /** Container height */
  get height() {
    return this.container?.clientHeight || 0;
  }
  /**
   * Add the renderer to a container
   * @param container container element or selector string
   * @returns this
   */
  addTo(A) {
    const i = typeof A == "string" ? document.querySelector(A) : A;
    if (i instanceof HTMLElement)
      this.container = i, i.appendChild(this.renderer.domElement), new ResizeObserver(this.resize.bind(this)).observe(i);
    else
      throw `${A} not found!}`;
    return this;
  }
  /**
   * Create scene
   * @returns scene
   */
  _createScene() {
    const A = new Xn(), i = 14414079;
    return A.background = new oe(i), A.fog = new ot(i, 0), A;
  }
  /**
   * Create WebGL renderer
   * @param antialias
   * @param stencil
   * @param logarithmicDepthBuffer
   * @returns renderer
   */
  _createRenderer(A, i, n) {
    const r = new Zn({
      antialias: A,
      logarithmicDepthBuffer: n,
      stencil: i,
      alpha: !0,
      precision: "highp"
    });
    return r.setPixelRatio(window.devicePixelRatio), r.domElement.tabIndex = 0, r;
  }
  /**
   * Create camera
   * @returns camera
   */
  _createCamera() {
    const A = new zn(70, 1, 100, 5e4);
    return A.position.set(0, 3e4 * 1e3, 0), A;
  }
  /**
   * Create map controls
   * @returns MapControls
   */
  _createControls() {
    const A = new hr(this.camera, this.renderer.domElement), i = 1.2;
    return A.target.set(0, 0, -3e3), A.screenSpacePanning = !1, A.minDistance = 100, A.maxDistance = 3e7, A.maxPolarAngle = i, A.enableDamping = !0, A.dampingFactor = 0.05, A.keyPanSpeed = 5, A.listenToKeyEvents(this.renderer.domElement), A.addEventListener("change", () => {
      const n = Math.max(A.getPolarAngle(), 0.1), r = Math.max(A.getDistance(), 100);
      A.zoomSpeed = Math.max(Math.log(r / 1e3), 0) + 0.5, this.camera.far = Qt.clamp(r / n * 8, 100, 5e4 * 1e3), this.camera.near = this.camera.far / 1e4, this.camera.updateProjectionMatrix(), this.scene.fog instanceof ot && (this.scene.fog.density = n / (r + 5) * this.fogFactor * 0.25);
      const a = r > 8e6;
      A.minAzimuthAngle = a ? 0 : -1 / 0, A.maxAzimuthAngle = a ? 0 : 1 / 0;
      const h = 1e7, o = 4;
      A.maxPolarAngle = Math.min(Math.pow(h / r, o), i);
    }), A;
  }
  /**
   * Create ambient light
   * @returns AmbientLight
   */
  _createAmbLight() {
    return new Wn(16777215, 1);
  }
  /**
   * Create directional light
   * @returns DirectionalLight
   */
  _createDirLight() {
    const A = new $n(16777215, 1);
    return A.position.set(0, 2e3, 1e3), A.target.position.copy(this.controls.target), A;
  }
  /**
   * Container resize
   * @returns this
   */
  resize() {
    const A = this.width, i = this.height;
    return this.renderer.setSize(A, i), this.camera.aspect = A / i, this.camera.updateProjectionMatrix(), this.renderer.render(this.scene, this.camera), this;
  }
  /**
   * Threejs animation loop
   */
  animate() {
    this.controls.update(), this.renderer.render(this.scene, this.camera), Br(), this.dispatchEvent({ type: "update", delta: this._clock.getDelta() });
  }
  /**
   * Fly to a position
   * @param centerPostion Map center target position (world coordinate)
   * @param cameraPostion Camera target position (world coordinate)
   * @param animate animate or not
   */
  flyTo(A, i, n = !0, r) {
    if (this.controls.target.copy(A), n) {
      const l = this.camera.position;
      new Zt(l).to({ y: 2e7, z: 0 }, 500).chain(
        new Zt(l).to(i, 2e3).easing(KA.Quintic.Out).onComplete((a) => r && r(a))
      ).start();
    } else
      this.camera.position.copy(i);
  }
  /**
   * Get current scens state
   * @returns center position and camera position
   */
  getState() {
    return {
      centerPosition: this.controls.target,
      cameraPosition: this.camera.position
    };
  }
}
const ur = `<style>
	#tt-compass {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: 1px solid #fffc;
		filter: drop-shadow(0px 0px 2px black);
		background-color: #0005;
		cursor: pointer;
	}
	#tt-compass > .tt-circle {
		width: 60%;
		height: 60%;
		text-align: center;
		border-radius: 50%;
		border: 1px solid #fffc;
		background-color: #fff4;
		display: flex;
		justify-content: center;
	}

	#tt-compass:hover > .tt-circle {
		background-color: #0f05;
	}

	#tt-compass:active .tt-circle {
		background-color: #000;
	}

	#tt-compass > #tt-compass-text {
		position: absolute;
		top: 0px;
		left: 0px;
		width: 100%;
		height: 100%;
		display: grid;
		align-items: center;
		justify-items: center;
		grid-template-columns: 18% auto 18%;
		grid-template-rows: 18% auto 18%;
		text-shadow: 0px 0px 2px black;
		font-size: 10px;
	}

	#tt-compass > .tt-circle > #tt-compass-plane {
		height: 90%;
		width: 90%;
		fill: #fffc;
		filter: drop-shadow(5px 5px 5px black);
	}
</style>

<div id="tt-compass">
	<div class="tt-circle">
		<svg
			id="tt-compass-plane"
			viewBox="0 0 1024 1024"
			version="1.1"
			xmlns="http://www.w3.org/2000/svg"
		>
			<path
				d="M479.075523 711.254681c0 70.2291 0.083871 114.20878 0.218064 140.734974l-148.360914 106.16768 0 65.842665c0 0 137.164181-31.552144 156.372659-56.247861 19.212672-24.685233 1.369189 45.264997 24.691523 45.264997 23.324432 0 5.476754-69.95023 24.695717-45.264997 19.206382 24.695717 156.372659 56.247861 156.372659 56.247861l0-65.842665-148.375592-106.16768c0.14258-26.526194 0.226451-70.505874 0.226451-140.734974 0-283.942036 460.894459 0 460.894459 0l0-79.555518-115.225712-85.227272 0-65.662343c0-9.083193-13.343823-16.461715-24.685233-16.461715-11.351894 0-24.695717 7.378522-24.695717 16.461715l0 29.119895-85.724206-63.422996c0-178.315322-28.115543-160.490709-28.115543-160.490709s-21.938469 15.094623-24.685233 100.128992c-1.645962 51.108686-52.339488 15.51817-92.547084-21.017988l-22.569596-104.490267-26.182325-14.138497c0-35.590516 0-81.312609 0-129.18179C561.379902 13.064953 511.307019 0 511.307019 0s-48.693211 13.054469-48.693211 117.311994c0 47.240151 0 92.396117 0 127.766473l-28.803283 14.329303-23.194432 106.176067 0.016774 0c3.310794-1.945799 6.558686-4.151598 9.735287-6.470622-3.159827 2.966925-6.407719 5.938043-9.735287 8.919645-39.630985 35.456323-87.693069 67.884915-89.311773 18.12445-2.748861-85.051143-24.691523-100.128992-24.691523-100.128992s-28.115543-17.824613-28.115543 160.490709l-85.724206 63.406222 0-29.119895c0-9.083193-13.335436-16.461715-24.691523-16.461715s-24.691523 7.378522-24.691523 16.461715l0 65.662343L18.187353 631.697066l0 79.555518C18.187353 711.254681 479.075523 427.310549 479.075523 711.254681z"
			></path>
		</svg>
	</div>
	<div id="tt-compass-text">
		<span></span> <span>N</span><span></span> <span>W</span><span></span><span>E</span> <span></span><span>S</span
		><span></span>
	</div>
</div>
`;
class Cr {
  /**
   * 构造函数
   * @param controls 地图控制器
   */
  constructor(e) {
    /** 罗盘顶层dom */
    D(this, "dom", document.createElement("div"));
    /* 罗盘中的小飞机 */
    D(this, "plane");
    /** 罗盘中的文字 */
    D(this, "text");
    /* 地图控制器 */
    D(this, "controls");
    this.controls = e, this.dom.innerHTML = ur, this.dom.style.width = "100%", this.dom.style.height = "100%", this.plane = this.dom.querySelector("#tt-compass-plane"), this.text = this.dom.querySelector("#tt-compass-text"), e.addEventListener("change", () => {
      this.plane && this.text && (this.plane.style.transform = `rotateX(${e.getPolarAngle()}rad)`, this.text.style.transform = `rotate(${e.getAzimuthalAngle()}rad)`);
    }), this.dom.onclick = () => open("https://github.com/sxguojf/three-tile");
  }
}
function ul(t) {
  return new Cr(t);
}
class Cl extends AA {
  constructor(A) {
    super(A);
    D(this, "token", "");
    D(this, "format", "webp");
    D(this, "style", "mapbox.satellite");
    D(this, "attribution", "MapBox");
    D(this, "maxLevel", 19);
    D(this, "url", "https://api.mapbox.com/v4/{style}/{z}/{x}/{y}.{format}?access_token={token}");
    Object.assign(this, A);
  }
}
class El extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "ArcGIS");
    D(this, "style", "World_Imagery");
    D(this, "url", "https://services.arcgisonline.com/arcgis/rest/services/{style}/MapServer/tile/{z}/{y}/{x}");
    Object.assign(this, A);
  }
}
class dl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "lerc");
    D(this, "attribution", "ArcGIS");
    D(this, "minLevel", 6);
    D(this, "maxLevel", 13);
    D(this, "url", "https://elevation3d.arcgis.com/arcgis/rest/services/WorldElevation3D/Terrain3D/ImageServer/tile/{z}/{y}/{x}");
    Object.assign(this, A);
  }
}
class Ql extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "Bing[GS(2021)1731号]");
    D(this, "style", "A");
    D(this, "mkt", "zh-CN");
    D(this, "subdomains", "123");
    Object.assign(this, A);
  }
  getUrl(A, i, n) {
    const r = Er(n, A, i);
    return `https://t${this.s}.dynamic.tiles.ditu.live.com/comp/ch/${r}?mkt=${this.mkt}&ur=CN&it=${this.style}&n=z&og=804&cstl=vb`;
  }
}
function Er(t, e, A) {
  let i = "";
  for (let n = t; n > 0; n--) {
    const r = 1 << n - 1;
    let l = 0;
    e & r && l++, A & r && (l += 2), i += l;
  }
  return i;
}
class wl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "高德[GS(2021)6375号]");
    D(this, "style", "8");
    D(this, "subdomains", "1234");
    D(this, "maxLevel", 18);
    D(this, "url", "https://webst0{s}.is.autonavi.com/appmaptile?style={style}&x={x}&y={y}&z={z}");
    Object.assign(this, A);
  }
}
class yl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "maxLevel", 16);
    D(this, "attribution", "GeoQ[GS(2019)758号]");
    D(this, "style", "ChinaOnlineStreetPurplishBlue");
    D(this, "url", "https://map.geoq.cn/ArcGIS/rest/services/{style}/MapServer/tile/{z}/{y}/{x}");
    Object.assign(this, A);
  }
}
class pl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "Google");
    D(this, "maxLevel", 20);
    D(this, "style", "y");
    D(this, "subdomains", "0123");
    // 已失效
    // public url = "https://gac-geo.googlecnapps.cn/maps/vt?lyrs={style}&x={x}&y={y}&z={z}";
    // 2024年新地址，不知道能坚持多久。 续：坚持不到10天就挂了。
    // public url = "https://gac-geo.googlecnapps.club/maps/vt?lyrs={style}&x={x}&y={y}&z={z}";
    // 访问原版google，你懂的
    D(this, "url", "http://mt{s}.google.com/vt/lyrs={style}&src=app&x={x}&y={y}&z={z}");
    Object.assign(this, A);
  }
}
class xl extends AA {
  constructor(A) {
    super(A);
    D(this, "attribution", "MapTiler");
    D(this, "token", "get_your_own_key_QmavnBrQwNGsQ8YvPzZg");
    D(this, "format", "jpg");
    D(this, "style", "satellite-v2");
    D(this, "url", "https://api.maptiler.com/tiles/{style}/{z}/{x}/{y}.{format}?key={token}");
    Object.assign(this, A);
  }
}
class ml extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "Stadia");
    D(this, "url", "https://tiles.stadiamaps.com/tiles/alidade_satellite/{z}/{x}/{y}.jpg");
    Object.assign(this, A);
  }
}
class Dl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "attribution", "天地图[GS(2023)336号]");
    D(this, "token", "");
    D(this, "style", "img_w");
    D(this, "subdomains", "01234");
    D(this, "url", "https://t{s}.tianditu.gov.cn/DataServer?T={style}&x={x}&y={y}&l={z}&tk={token}");
    Object.assign(this, A);
  }
}
class Sl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "quantized-mesh");
    D(this, "attribution", "天地图[GS(2023)336号]");
    D(this, "token", "");
    D(this, "subdomains", "01234");
    D(this, "url", "https://t{s}.tianditu.gov.cn/mapservice/swdx?T=elv_c&tk={token}&x={x}&y={y}&l={z}");
    Object.assign(this, A);
  }
}
class Fl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "image");
    D(this, "style", "sateTiles");
    D(this, "attribution", "腾讯[GS(2023)1号]");
    D(this, "subdomains", "0123");
    D(this, "maxLevel", 18);
    D(this, "isTMS", !0);
    // public url = "https://webst01.is.autonavi.com/appmaptile?style=6&x={x}&y={y}&z={z}";
    D(this, "sx", 0);
    D(this, "sy", 0);
    D(this, "url", "https://p{s}.map.gtimg.com/{style}/{z}/{sx}/{sy}/{x}_{y}.jpg");
    Object.assign(this, A);
  }
  _getUrl(A, i, n) {
    return this.sx = A >> 4, this.sy = (1 << n) - i >> 4, super._getUrl(A, i, n);
  }
}
class kl extends AA {
  constructor(A) {
    super(A);
    D(this, "attribution", "中科星图[GS(2022)3995号]");
    D(this, "token", "");
    D(this, "style", "img");
    D(this, "format", "webp");
    D(this, "subdomains", "12");
    D(this, "url", "https://tiles{s}.geovisearth.com/base/v1/{style}/{z}/{x}/{y}?format={format}&tmsIds=w&token={token}");
    Object.assign(this, A);
  }
}
class bl extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "quantized-mesh");
    D(this, "attribution", "中科星图[GS(2022)3995号]");
    D(this, "token", "");
    D(this, "subdomains", "012");
    D(this, "url", "https://tiles{s}.geovisearth.com/base/v1/terrain/{z}/{x}/{y}.terrain&token={token}");
    Object.assign(this, A);
  }
}
const dr = `
varying vec2 vUv;
uniform vec3 bkColor;
uniform vec3 airColor;

void main() {  
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);  
}  
`, Qr = `
varying vec2 vUv;
uniform vec3 bkColor;
uniform vec3 airColor;

void main() {   

    // 当前点距中点的距离
    float d = distance(vUv, vec2(0.5f)); 
    d = d * d * 100.0f;
    
    if(d<0.98f){
        // 球体颜色
        float a = smoothstep(0.0f,1.0f,d);     
        gl_FragColor = vec4(vec3(0.0f), a);               
    } else if(d<=1.0f){
        float c = (d-0.98f)/(1.0f-0.98f);        
        gl_FragColor =vec4(mix(vec3(0.0f),airColor,c),1.0f);        
    } else if(d<=1.1f){        
        float c = (d-1.0f)/(1.1f-1.0f);
        gl_FragColor = vec4(mix(airColor,bkColor,sqrt(c)),1.0f);
    } else{
        // 球体外颜色
        gl_FragColor = vec4(bkColor,1.0f);
    }
    
    // #include <tonemapping_fragment>
    // #include <encodings_fragment>    
    #include <colorspace_fragment>
    
}  
`;
class wr extends Ar {
  constructor(e) {
    super({
      uniforms: er.merge([
        tr.fog,
        {
          bkColor: {
            value: e.bkColor
          },
          airColor: {
            value: e.airColor
          }
        }
      ]),
      transparent: !0,
      depthTest: !1,
      vertexShader: dr,
      fragmentShader: Qr,
      lights: !1
    });
  }
}
class yr extends ir {
  get bkColor() {
    return this.material.uniforms.bkColor.value;
  }
  set bkColor(e) {
    this.material.uniforms.bkColor.value.set(e);
  }
  constructor(e, A = new oe(6724044)) {
    super(new nr(5, 5), new wr({ bkColor: e, airColor: A })), this.renderOrder = 999;
  }
}
function Ml(t, e = 14414079, A = 6724044) {
  const i = new yr(new oe(e), new oe(A));
  return i.name = "fakeearth", i.applyMatrix4(t.rootTile.matrix), i;
}
class pr extends ot {
  constructor(A, i) {
    super(i);
    D(this, "_controls");
    D(this, "_factor", 1);
    this._controls = A, A.addEventListener("change", () => {
      const n = Math.max(A.getPolarAngle(), 0.1), r = Math.max(A.getDistance(), 0.1);
      this.density = n / (r + 5) * this.factor * 0.25;
    });
  }
  get factor() {
    return this._factor;
  }
  set factor(A) {
    this._factor = A, this._controls.dispatchEvent({ type: "change" });
  }
}
function Ll(t, e = 14414079) {
  return new pr(t, e);
}
class vl extends qi {
  constructor() {
    super(...arguments);
    /** Loader info */
    D(this, "info", {
      version: "0.10.0",
      description: "Tile debug image loader. It will draw a rectangle and coordinate on the tile."
    });
    /** Source data type */
    D(this, "dataType", "debug");
  }
  /**
   * Draw tile on canvas
   * @param ctx Tile canvas context
   * @param params Tile load params
   */
  drawTile(A, i) {
    const { x: n, y: r, z: l, bounds: a, lonLatBounds: h } = i, o = A.canvas.width, s = A.canvas.height;
    A.strokeStyle = "#ccc", A.lineWidth = 4, A.strokeRect(5, 5, o - 10, s - 10), A.fillStyle = "white", A.shadowColor = "black", A.shadowBlur = 5, A.shadowOffsetX = 1, A.shadowOffsetY = 1, A.font = "bold 20px arial", A.textAlign = "center", A.fillText(`Level: ${l}`, o / 2, 50), A.fillText(`[${n}, ${r}]`, s / 2, 80);
    const g = o / 2;
    A.font = "14px arial", A.fillText(`[${a[0].toFixed(3)}, ${a[1].toFixed(3)}]`, g, s - 50), A.fillText(`[${a[2].toFixed(3)}, ${a[3].toFixed(3)}]`, g, s - 30), h && (A.fillText(`[${h[0].toFixed(3)}, ${h[1].toFixed(3)}]`, g, s - 120), A.fillText(`[${h[2].toFixed(3)}, ${h[3].toFixed(3)}]`, g, s - 100));
  }
}
class Gl extends qi {
  constructor() {
    super(...arguments);
    D(this, "info", {
      version: "0.10.0",
      description: "Tile debug image loader. It will draw a rectangle and coordinate on the tile."
    });
    D(this, "dataType", "logo");
  }
  /**
   * Draw tile on canvas
   * @param ctx Tile canvas context
   * @param params Tile load params
   */
  drawTile(A, i) {
    A.fillStyle = "white", A.shadowColor = "black", A.shadowBlur = 5, A.shadowOffsetX = 1, A.shadowOffsetY = 1, A.font = "bold 14px arial", A.textAlign = "center", A.translate(A.canvas.width / 2, A.canvas.height / 2), A.rotate(30 * Math.PI / 180), A.fillText(`${i.source.attribution}`, 0, 0);
  }
}
class Rl {
  constructor() {
    D(this, "info", {
      version: "0.10.0",
      description: "Tile normal material loader."
    });
    D(this, "dataType", "normal");
  }
  async load(e) {
    return new rr({
      // transparent: true,
      opacity: e.source.opacity,
      flatShading: !0
    });
  }
}
class Ul {
  constructor() {
    D(this, "info", {
      version: "0.10.0",
      description: "Tile wireframe material loader."
    });
    D(this, "dataType", "wireframe");
  }
  async load(e) {
    const A = new oe(`hsl(${e.z * 14}, 100%, 50%)`);
    return new sr({
      transparent: !0,
      wireframe: !0,
      color: A,
      opacity: e.source.opacity,
      depthTest: !1
    });
  }
}
class Tl {
  constructor() {
    D(this, "info", {
      version: "0.10.0",
      description: "Single image loader. It can load single image to bounds and stick to the ground."
    });
    D(this, "dataType", "single-image");
    // private _image?: HTMLImageElement | undefined;
    D(this, "_imageLoader", new or(ve.manager));
  }
  /**
   * 加载材质
   * @param source 数据源
   * @param tile 瓦片
   * @returns 材质
   */
  async load(e) {
    const { source: A, bounds: i, z: n } = e, r = new lr({
      transparent: !0,
      opacity: A.opacity
    }), l = A._getUrl(0, 0, 0);
    return n < A.minLevel || n > A.maxLevel || !l ? r : A._image?.complete ? (this._setTexture(r, A._image, A, i), r) : (console.log("loadi image...", l), A._image = await this._imageLoader.loadAsync(l), this._setTexture(r, A._image, A, i), r);
  }
  _setTexture(e, A, i, n) {
    const r = this._getTileTexture(A, i, n);
    e.setTexture(r), r.needsUpdate = !0;
  }
  _getTileTexture(e, A, i) {
    const n = A, r = 256, l = new OffscreenCanvas(r, r);
    if (e) {
      const h = l.getContext("2d"), o = n._projectionBounds, s = e.width, g = e.height, I = (o[2] - o[0]) / s, c = (o[3] - o[1]) / g, f = (i[0] - o[0]) / I, w = (o[3] - i[3]) / c, B = (i[2] - i[0]) / I, u = (i[3] - i[1]) / c;
      h.drawImage(e, f, w, B, u, 0, 0, r, r);
    }
    const a = new wt(l);
    return a.colorSpace = ar, a;
  }
}
class _l extends AA {
  constructor() {
    super(...arguments);
    /** 该数据源的类型标识 */
    D(this, "dataType", "single-image");
    /** 影像数据，内部使用 */
    D(this, "_image");
  }
}
function eA(t) {
  return (e, ...A) => xr(t, e, A);
}
function ZA(t, e) {
  return eA(
    Hi(
      t,
      e
    ).get
  );
}
const {
  apply: xr,
  getOwnPropertyDescriptor: Hi,
  getPrototypeOf: pt,
  ownKeys: mr
} = Reflect, {
  iterator: fe,
  toStringTag: Dr
} = Symbol, Sr = Object, {
  create: xt,
  defineProperty: Fr
} = Sr, kr = Array, br = kr.prototype, Ki = br[fe], Mr = eA(Ki), ji = ArrayBuffer, Lr = ji.prototype;
ZA(Lr, "byteLength");
const zt = typeof SharedArrayBuffer < "u" ? SharedArrayBuffer : null;
zt && ZA(zt.prototype, "byteLength");
const Xi = pt(Uint8Array);
Xi.from;
const sA = Xi.prototype;
sA[fe];
eA(sA.keys);
eA(
  sA.values
);
eA(
  sA.entries
);
eA(sA.set);
eA(
  sA.reverse
);
eA(sA.fill);
eA(
  sA.copyWithin
);
eA(sA.sort);
eA(sA.slice);
eA(
  sA.subarray
);
ZA(
  sA,
  "buffer"
);
ZA(
  sA,
  "byteOffset"
);
ZA(
  sA,
  "length"
);
ZA(
  sA,
  Dr
);
const vr = Uint8Array, Zi = Uint16Array, mt = Uint32Array, Gr = Float32Array, ae = pt([][fe]()), zi = eA(ae.next), Rr = eA(function* () {
}().next), Ur = pt(ae), Tr = DataView.prototype, _r = eA(
  Tr.getUint16
), Dt = WeakMap, Wi = Dt.prototype, $i = eA(Wi.get), Nr = eA(Wi.set), An = new Dt(), Or = xt(null, {
  next: {
    value: function() {
      const e = $i(An, this);
      return zi(e);
    }
  },
  [fe]: {
    value: function() {
      return this;
    }
  }
});
function Yr(t) {
  if (t[fe] === Ki && ae.next === zi)
    return t;
  const e = xt(Or);
  return Nr(An, e, Mr(t)), e;
}
const qr = new Dt(), Pr = xt(Ur, {
  next: {
    value: function() {
      const e = $i(qr, this);
      return Rr(e);
    },
    writable: !0,
    configurable: !0
  }
});
for (const t of mr(ae))
  t !== "next" && Fr(Pr, t, Hi(ae, t));
const en = new ji(4), Jr = new Gr(en), Vr = new mt(en), uA = new Zi(512), CA = new vr(512);
for (let t = 0; t < 256; ++t) {
  const e = t - 127;
  e < -24 ? (uA[t] = 0, uA[t | 256] = 32768, CA[t] = 24, CA[t | 256] = 24) : e < -14 ? (uA[t] = 1024 >> -e - 14, uA[t | 256] = 1024 >> -e - 14 | 32768, CA[t] = -e - 1, CA[t | 256] = -e - 1) : e <= 15 ? (uA[t] = e + 15 << 10, uA[t | 256] = e + 15 << 10 | 32768, CA[t] = 13, CA[t | 256] = 13) : e < 128 ? (uA[t] = 31744, uA[t | 256] = 64512, CA[t] = 24, CA[t | 256] = 24) : (uA[t] = 31744, uA[t | 256] = 64512, CA[t] = 13, CA[t | 256] = 13);
}
const St = new mt(2048);
for (let t = 1; t < 1024; ++t) {
  let e = t << 13, A = 0;
  for (; !(e & 8388608); )
    e <<= 1, A -= 8388608;
  e &= -8388609, A += 947912704, St[t] = e | A;
}
for (let t = 1024; t < 2048; ++t)
  St[t] = 939524096 + (t - 1024 << 13);
const zA = new mt(64);
for (let t = 1; t < 31; ++t)
  zA[t] = t << 23;
zA[31] = 1199570944;
zA[32] = 2147483648;
for (let t = 33; t < 63; ++t)
  zA[t] = 2147483648 + (t - 32 << 23);
zA[63] = 3347054592;
const tn = new Zi(64);
for (let t = 1; t < 64; ++t)
  t !== 32 && (tn[t] = 1024);
function Hr(t) {
  const e = t >> 10;
  return Vr[0] = St[tn[e] + (t & 1023)] + zA[e], Jr[0];
}
function nn(t, e, ...A) {
  return Hr(
    _r(t, e, ...Yr(A))
  );
}
function Ft(t) {
  return t && t.__esModule && Object.prototype.hasOwnProperty.call(t, "default") ? t.default : t;
}
var kt = { exports: {} };
function rn(t, e, A) {
  const i = A && A.debug || !1;
  i && console.log("[xml-utils] getting " + e + " in " + t);
  const n = typeof t == "object" ? t.outer : t, r = n.slice(0, n.indexOf(">") + 1), l = ['"', "'"];
  for (let a = 0; a < l.length; a++) {
    const h = l[a], o = e + "\\=" + h + "([^" + h + "]*)" + h;
    i && console.log("[xml-utils] pattern:", o);
    const g = new RegExp(o).exec(r);
    if (i && console.log("[xml-utils] match:", g), g) return g[1];
  }
}
kt.exports = rn;
kt.exports.default = rn;
var Kr = kt.exports;
const Oe = /* @__PURE__ */ Ft(Kr);
var bt = { exports: {} }, Mt = { exports: {} }, Lt = { exports: {} };
function sn(t, e, A) {
  const n = new RegExp(e).exec(t.slice(A));
  return n ? A + n.index : -1;
}
Lt.exports = sn;
Lt.exports.default = sn;
var jr = Lt.exports, vt = { exports: {} };
function on(t, e, A) {
  const n = new RegExp(e).exec(t.slice(A));
  return n ? A + n.index + n[0].length - 1 : -1;
}
vt.exports = on;
vt.exports.default = on;
var Xr = vt.exports, Gt = { exports: {} };
function an(t, e) {
  const A = new RegExp(e, "g"), i = t.match(A);
  return i ? i.length : 0;
}
Gt.exports = an;
Gt.exports.default = an;
var Zr = Gt.exports;
const zr = jr, Ye = Xr, Wt = Zr;
function ln(t, e, A) {
  const i = A && A.debug || !1, n = !(A && typeof A.nested === !1), r = A && A.startIndex || 0;
  i && console.log("[xml-utils] starting findTagByName with", e, " and ", A);
  const l = zr(t, `<${e}[ 
>/]`, r);
  if (i && console.log("[xml-utils] start:", l), l === -1) return;
  const a = t.slice(l + e.length);
  let h = Ye(a, "^[^<]*[ /]>", 0);
  const o = h !== -1 && a[h - 1] === "/";
  if (i && console.log("[xml-utils] selfClosing:", o), o === !1)
    if (n) {
      let c = 0, f = 1, w = 0;
      for (; (h = Ye(a, "[ /]" + e + ">", c)) !== -1; ) {
        const B = a.substring(c, h + 1);
        if (f += Wt(B, "<" + e + `[ 
	>]`), w += Wt(B, "</" + e + ">"), w >= f) break;
        c = h;
      }
    } else
      h = Ye(a, "[ /]" + e + ">", 0);
  const s = l + e.length + h + 1;
  if (i && console.log("[xml-utils] end:", s), s === -1) return;
  const g = t.slice(l, s);
  let I;
  return o ? I = null : I = g.slice(g.indexOf(">") + 1, g.lastIndexOf("<")), { inner: I, outer: g, start: l, end: s };
}
Mt.exports = ln;
Mt.exports.default = ln;
var Wr = Mt.exports;
const $r = Wr;
function gn(t, e, A) {
  const i = [], n = A && A.debug || !1, r = A && typeof A.nested == "boolean" ? A.nested : !0;
  let l = A && A.startIndex || 0, a;
  for (; a = $r(t, e, { debug: n, startIndex: l }); )
    r ? l = a.start + 1 + e.length : l = a.end, i.push(a);
  return n && console.log("findTagsByName found", i.length, "tags"), i;
}
bt.exports = gn;
bt.exports.default = gn;
var As = bt.exports;
const es = /* @__PURE__ */ Ft(As), ne = {
  // TIFF Baseline
  315: "Artist",
  258: "BitsPerSample",
  265: "CellLength",
  264: "CellWidth",
  320: "ColorMap",
  259: "Compression",
  33432: "Copyright",
  306: "DateTime",
  338: "ExtraSamples",
  266: "FillOrder",
  289: "FreeByteCounts",
  288: "FreeOffsets",
  291: "GrayResponseCurve",
  290: "GrayResponseUnit",
  316: "HostComputer",
  270: "ImageDescription",
  257: "ImageLength",
  256: "ImageWidth",
  271: "Make",
  281: "MaxSampleValue",
  280: "MinSampleValue",
  272: "Model",
  254: "NewSubfileType",
  274: "Orientation",
  262: "PhotometricInterpretation",
  284: "PlanarConfiguration",
  296: "ResolutionUnit",
  278: "RowsPerStrip",
  277: "SamplesPerPixel",
  305: "Software",
  279: "StripByteCounts",
  273: "StripOffsets",
  255: "SubfileType",
  263: "Threshholding",
  282: "XResolution",
  283: "YResolution",
  // TIFF Extended
  326: "BadFaxLines",
  327: "CleanFaxData",
  343: "ClipPath",
  328: "ConsecutiveBadFaxLines",
  433: "Decode",
  434: "DefaultImageColor",
  269: "DocumentName",
  336: "DotRange",
  321: "HalftoneHints",
  346: "Indexed",
  347: "JPEGTables",
  285: "PageName",
  297: "PageNumber",
  317: "Predictor",
  319: "PrimaryChromaticities",
  532: "ReferenceBlackWhite",
  339: "SampleFormat",
  340: "SMinSampleValue",
  341: "SMaxSampleValue",
  559: "StripRowCounts",
  330: "SubIFDs",
  292: "T4Options",
  293: "T6Options",
  325: "TileByteCounts",
  323: "TileLength",
  324: "TileOffsets",
  322: "TileWidth",
  301: "TransferFunction",
  318: "WhitePoint",
  344: "XClipPathUnits",
  286: "XPosition",
  529: "YCbCrCoefficients",
  531: "YCbCrPositioning",
  530: "YCbCrSubSampling",
  345: "YClipPathUnits",
  287: "YPosition",
  // EXIF
  37378: "ApertureValue",
  40961: "ColorSpace",
  36868: "DateTimeDigitized",
  36867: "DateTimeOriginal",
  34665: "Exif IFD",
  36864: "ExifVersion",
  33434: "ExposureTime",
  41728: "FileSource",
  37385: "Flash",
  40960: "FlashpixVersion",
  33437: "FNumber",
  42016: "ImageUniqueID",
  37384: "LightSource",
  37500: "MakerNote",
  37377: "ShutterSpeedValue",
  37510: "UserComment",
  // IPTC
  33723: "IPTC",
  // ICC
  34675: "ICC Profile",
  // XMP
  700: "XMP",
  // GDAL
  42112: "GDAL_METADATA",
  42113: "GDAL_NODATA",
  // Photoshop
  34377: "Photoshop",
  // GeoTiff
  33550: "ModelPixelScale",
  33922: "ModelTiepoint",
  34264: "ModelTransformation",
  34735: "GeoKeyDirectory",
  34736: "GeoDoubleParams",
  34737: "GeoAsciiParams",
  // LERC
  50674: "LercParameters"
}, dA = {};
for (const t in ne)
  ne.hasOwnProperty(t) && (dA[ne[t]] = parseInt(t, 10));
const ts = [
  dA.BitsPerSample,
  dA.ExtraSamples,
  dA.SampleFormat,
  dA.StripByteCounts,
  dA.StripOffsets,
  dA.StripRowCounts,
  dA.TileByteCounts,
  dA.TileOffsets,
  dA.SubIFDs
], qe = {
  1: "BYTE",
  2: "ASCII",
  3: "SHORT",
  4: "LONG",
  5: "RATIONAL",
  6: "SBYTE",
  7: "UNDEFINED",
  8: "SSHORT",
  9: "SLONG",
  10: "SRATIONAL",
  11: "FLOAT",
  12: "DOUBLE",
  // IFD offset, suggested by https://owl.phy.queensu.ca/~phil/exiftool/standards.html
  13: "IFD",
  // introduced by BigTIFF
  16: "LONG8",
  17: "SLONG8",
  18: "IFD8"
}, J = {};
for (const t in qe)
  qe.hasOwnProperty(t) && (J[qe[t]] = parseInt(t, 10));
const gA = {
  WhiteIsZero: 0,
  BlackIsZero: 1,
  RGB: 2,
  Palette: 3,
  CMYK: 5,
  YCbCr: 6,
  CIELab: 8
}, is = {
  Unspecified: 0
}, ns = {
  AddCompression: 1
}, Pe = {
  None: 0,
  Deflate: 1,
  Zstandard: 2
}, rs = {
  1024: "GTModelTypeGeoKey",
  1025: "GTRasterTypeGeoKey",
  1026: "GTCitationGeoKey",
  2048: "GeographicTypeGeoKey",
  2049: "GeogCitationGeoKey",
  2050: "GeogGeodeticDatumGeoKey",
  2051: "GeogPrimeMeridianGeoKey",
  2052: "GeogLinearUnitsGeoKey",
  2053: "GeogLinearUnitSizeGeoKey",
  2054: "GeogAngularUnitsGeoKey",
  2055: "GeogAngularUnitSizeGeoKey",
  2056: "GeogEllipsoidGeoKey",
  2057: "GeogSemiMajorAxisGeoKey",
  2058: "GeogSemiMinorAxisGeoKey",
  2059: "GeogInvFlatteningGeoKey",
  2060: "GeogAzimuthUnitsGeoKey",
  2061: "GeogPrimeMeridianLongGeoKey",
  2062: "GeogTOWGS84GeoKey",
  3072: "ProjectedCSTypeGeoKey",
  3073: "PCSCitationGeoKey",
  3074: "ProjectionGeoKey",
  3075: "ProjCoordTransGeoKey",
  3076: "ProjLinearUnitsGeoKey",
  3077: "ProjLinearUnitSizeGeoKey",
  3078: "ProjStdParallel1GeoKey",
  3079: "ProjStdParallel2GeoKey",
  3080: "ProjNatOriginLongGeoKey",
  3081: "ProjNatOriginLatGeoKey",
  3082: "ProjFalseEastingGeoKey",
  3083: "ProjFalseNorthingGeoKey",
  3084: "ProjFalseOriginLongGeoKey",
  3085: "ProjFalseOriginLatGeoKey",
  3086: "ProjFalseOriginEastingGeoKey",
  3087: "ProjFalseOriginNorthingGeoKey",
  3088: "ProjCenterLongGeoKey",
  3089: "ProjCenterLatGeoKey",
  3090: "ProjCenterEastingGeoKey",
  3091: "ProjCenterNorthingGeoKey",
  3092: "ProjScaleAtNatOriginGeoKey",
  3093: "ProjScaleAtCenterGeoKey",
  3094: "ProjAzimuthAngleGeoKey",
  3095: "ProjStraightVertPoleLongGeoKey",
  3096: "ProjRectifiedGridAngleGeoKey",
  4096: "VerticalCSTypeGeoKey",
  4097: "VerticalCitationGeoKey",
  4098: "VerticalDatumGeoKey",
  4099: "VerticalUnitsGeoKey"
};
function ss(t, e) {
  const { width: A, height: i } = t, n = new Uint8Array(A * i * 3);
  let r;
  for (let l = 0, a = 0; l < t.length; ++l, a += 3)
    r = 256 - t[l] / e * 256, n[a] = r, n[a + 1] = r, n[a + 2] = r;
  return n;
}
function os(t, e) {
  const { width: A, height: i } = t, n = new Uint8Array(A * i * 3);
  let r;
  for (let l = 0, a = 0; l < t.length; ++l, a += 3)
    r = t[l] / e * 256, n[a] = r, n[a + 1] = r, n[a + 2] = r;
  return n;
}
function as(t, e) {
  const { width: A, height: i } = t, n = new Uint8Array(A * i * 3), r = e.length / 3, l = e.length / 3 * 2;
  for (let a = 0, h = 0; a < t.length; ++a, h += 3) {
    const o = t[a];
    n[h] = e[o] / 65536 * 256, n[h + 1] = e[o + r] / 65536 * 256, n[h + 2] = e[o + l] / 65536 * 256;
  }
  return n;
}
function ls(t) {
  const { width: e, height: A } = t, i = new Uint8Array(e * A * 3);
  for (let n = 0, r = 0; n < t.length; n += 4, r += 3) {
    const l = t[n], a = t[n + 1], h = t[n + 2], o = t[n + 3];
    i[r] = 255 * ((255 - l) / 256) * ((255 - o) / 256), i[r + 1] = 255 * ((255 - a) / 256) * ((255 - o) / 256), i[r + 2] = 255 * ((255 - h) / 256) * ((255 - o) / 256);
  }
  return i;
}
function gs(t) {
  const { width: e, height: A } = t, i = new Uint8ClampedArray(e * A * 3);
  for (let n = 0, r = 0; n < t.length; n += 3, r += 3) {
    const l = t[n], a = t[n + 1], h = t[n + 2];
    i[r] = l + 1.402 * (h - 128), i[r + 1] = l - 0.34414 * (a - 128) - 0.71414 * (h - 128), i[r + 2] = l + 1.772 * (a - 128);
  }
  return i;
}
const cs = 0.95047, fs = 1, hs = 1.08883;
function Is(t) {
  const { width: e, height: A } = t, i = new Uint8Array(e * A * 3);
  for (let n = 0, r = 0; n < t.length; n += 3, r += 3) {
    const l = t[n + 0], a = t[n + 1] << 24 >> 24, h = t[n + 2] << 24 >> 24;
    let o = (l + 16) / 116, s = a / 500 + o, g = o - h / 200, I, c, f;
    s = cs * (s * s * s > 8856e-6 ? s * s * s : (s - 16 / 116) / 7.787), o = fs * (o * o * o > 8856e-6 ? o * o * o : (o - 16 / 116) / 7.787), g = hs * (g * g * g > 8856e-6 ? g * g * g : (g - 16 / 116) / 7.787), I = s * 3.2406 + o * -1.5372 + g * -0.4986, c = s * -0.9689 + o * 1.8758 + g * 0.0415, f = s * 0.0557 + o * -0.204 + g * 1.057, I = I > 31308e-7 ? 1.055 * I ** (1 / 2.4) - 0.055 : 12.92 * I, c = c > 31308e-7 ? 1.055 * c ** (1 / 2.4) - 0.055 : 12.92 * c, f = f > 31308e-7 ? 1.055 * f ** (1 / 2.4) - 0.055 : 12.92 * f, i[r] = Math.max(0, Math.min(1, I)) * 255, i[r + 1] = Math.max(0, Math.min(1, c)) * 255, i[r + 2] = Math.max(0, Math.min(1, f)) * 255;
  }
  return i;
}
const cn = /* @__PURE__ */ new Map();
function UA(t, e) {
  Array.isArray(t) || (t = [t]), t.forEach((A) => cn.set(A, e));
}
async function Bs(t) {
  const e = cn.get(t.Compression);
  if (!e)
    throw new Error(`Unknown compression method identifier: ${t.Compression}`);
  const A = await e();
  return new A(t);
}
UA([void 0, 1], () => Promise.resolve().then(() => ko).then((t) => t.default));
UA(5, () => Promise.resolve().then(() => Go).then((t) => t.default));
UA(6, () => {
  throw new Error("old style JPEG compression is not supported.");
});
UA(7, () => Promise.resolve().then(() => No).then((t) => t.default));
UA([8, 32946], () => Promise.resolve().then(() => Al).then((t) => t.default));
UA(32773, () => Promise.resolve().then(() => tl).then((t) => t.default));
UA(
  34887,
  () => Promise.resolve().then(() => ol).then(async (t) => (await t.zstd.init(), t)).then((t) => t.default)
);
UA(50001, () => Promise.resolve().then(() => ll).then((t) => t.default));
function Ge(t, e, A, i = 1) {
  return new (Object.getPrototypeOf(t)).constructor(e * A * i);
}
function us(t, e, A, i, n) {
  const r = e / i, l = A / n;
  return t.map((a) => {
    const h = Ge(a, i, n);
    for (let o = 0; o < n; ++o) {
      const s = Math.min(Math.round(l * o), A - 1);
      for (let g = 0; g < i; ++g) {
        const I = Math.min(Math.round(r * g), e - 1), c = a[s * e + I];
        h[o * i + g] = c;
      }
    }
    return h;
  });
}
function jA(t, e, A) {
  return (1 - A) * t + A * e;
}
function Cs(t, e, A, i, n) {
  const r = e / i, l = A / n;
  return t.map((a) => {
    const h = Ge(a, i, n);
    for (let o = 0; o < n; ++o) {
      const s = l * o, g = Math.floor(s), I = Math.min(Math.ceil(s), A - 1);
      for (let c = 0; c < i; ++c) {
        const f = r * c, w = f % 1, B = Math.floor(f), u = Math.min(Math.ceil(f), e - 1), E = a[g * e + B], y = a[g * e + u], d = a[I * e + B], x = a[I * e + u], C = jA(
          jA(E, y, w),
          jA(d, x, w),
          s % 1
        );
        h[o * i + c] = C;
      }
    }
    return h;
  });
}
function Es(t, e, A, i, n, r = "nearest") {
  switch (r.toLowerCase()) {
    case "nearest":
      return us(t, e, A, i, n);
    case "bilinear":
    case "linear":
      return Cs(t, e, A, i, n);
    default:
      throw new Error(`Unsupported resampling method: '${r}'`);
  }
}
function ds(t, e, A, i, n, r) {
  const l = e / i, a = A / n, h = Ge(t, i, n, r);
  for (let o = 0; o < n; ++o) {
    const s = Math.min(Math.round(a * o), A - 1);
    for (let g = 0; g < i; ++g) {
      const I = Math.min(Math.round(l * g), e - 1);
      for (let c = 0; c < r; ++c) {
        const f = t[s * e * r + I * r + c];
        h[o * i * r + g * r + c] = f;
      }
    }
  }
  return h;
}
function Qs(t, e, A, i, n, r) {
  const l = e / i, a = A / n, h = Ge(t, i, n, r);
  for (let o = 0; o < n; ++o) {
    const s = a * o, g = Math.floor(s), I = Math.min(Math.ceil(s), A - 1);
    for (let c = 0; c < i; ++c) {
      const f = l * c, w = f % 1, B = Math.floor(f), u = Math.min(Math.ceil(f), e - 1);
      for (let E = 0; E < r; ++E) {
        const y = t[g * e * r + B * r + E], d = t[g * e * r + u * r + E], x = t[I * e * r + B * r + E], C = t[I * e * r + u * r + E], Q = jA(
          jA(y, d, w),
          jA(x, C, w),
          s % 1
        );
        h[o * i * r + c * r + E] = Q;
      }
    }
  }
  return h;
}
function ws(t, e, A, i, n, r, l = "nearest") {
  switch (l.toLowerCase()) {
    case "nearest":
      return ds(
        t,
        e,
        A,
        i,
        n,
        r
      );
    case "bilinear":
    case "linear":
      return Qs(
        t,
        e,
        A,
        i,
        n,
        r
      );
    default:
      throw new Error(`Unsupported resampling method: '${l}'`);
  }
}
function ys(t, e, A) {
  let i = 0;
  for (let n = e; n < A; ++n)
    i += t[n];
  return i;
}
function gt(t, e, A) {
  switch (t) {
    case 1:
      if (e <= 8)
        return new Uint8Array(A);
      if (e <= 16)
        return new Uint16Array(A);
      if (e <= 32)
        return new Uint32Array(A);
      break;
    case 2:
      if (e === 8)
        return new Int8Array(A);
      if (e === 16)
        return new Int16Array(A);
      if (e === 32)
        return new Int32Array(A);
      break;
    case 3:
      switch (e) {
        case 16:
        case 32:
          return new Float32Array(A);
        case 64:
          return new Float64Array(A);
      }
      break;
  }
  throw Error("Unsupported data format/bitsPerSample");
}
function ps(t, e) {
  return (t === 1 || t === 2) && e <= 32 && e % 8 === 0 ? !1 : !(t === 3 && (e === 16 || e === 32 || e === 64));
}
function xs(t, e, A, i, n, r, l) {
  const a = new DataView(t), h = A === 2 ? l * r : l * r * i, o = A === 2 ? 1 : i, s = gt(e, n, h), g = parseInt("1".repeat(n), 2);
  if (e === 1) {
    let I;
    A === 1 ? I = i * n : I = n;
    let c = r * I;
    c & 7 && (c = c + 7 & -8);
    for (let f = 0; f < l; ++f) {
      const w = f * c;
      for (let B = 0; B < r; ++B) {
        const u = w + B * o * n;
        for (let E = 0; E < o; ++E) {
          const y = u + E * n, d = (f * r + B) * o + E, x = Math.floor(y / 8), C = y % 8;
          if (C + n <= 8)
            s[d] = a.getUint8(x) >> 8 - n - C & g;
          else if (C + n <= 16)
            s[d] = a.getUint16(x) >> 16 - n - C & g;
          else if (C + n <= 24) {
            const Q = a.getUint16(x) << 8 | a.getUint8(x + 2);
            s[d] = Q >> 24 - n - C & g;
          } else
            s[d] = a.getUint32(x) >> 32 - n - C & g;
        }
      }
    }
  }
  return s.buffer;
}
class ms {
  /**
   * @constructor
   * @param {Object} fileDirectory The parsed file directory
   * @param {Object} geoKeys The parsed geo-keys
   * @param {DataView} dataView The DataView for the underlying file.
   * @param {Boolean} littleEndian Whether the file is encoded in little or big endian
   * @param {Boolean} cache Whether or not decoded tiles shall be cached
   * @param {import('./source/basesource').BaseSource} source The datasource to read from
   */
  constructor(e, A, i, n, r, l) {
    this.fileDirectory = e, this.geoKeys = A, this.dataView = i, this.littleEndian = n, this.tiles = r ? {} : null, this.isTiled = !e.StripOffsets;
    const a = e.PlanarConfiguration;
    if (this.planarConfiguration = typeof a > "u" ? 1 : a, this.planarConfiguration !== 1 && this.planarConfiguration !== 2)
      throw new Error("Invalid planar configuration.");
    this.source = l;
  }
  /**
   * Returns the associated parsed file directory.
   * @returns {Object} the parsed file directory
   */
  getFileDirectory() {
    return this.fileDirectory;
  }
  /**
   * Returns the associated parsed geo keys.
   * @returns {Object} the parsed geo keys
   */
  getGeoKeys() {
    return this.geoKeys;
  }
  /**
   * Returns the width of the image.
   * @returns {Number} the width of the image
   */
  getWidth() {
    return this.fileDirectory.ImageWidth;
  }
  /**
   * Returns the height of the image.
   * @returns {Number} the height of the image
   */
  getHeight() {
    return this.fileDirectory.ImageLength;
  }
  /**
   * Returns the number of samples per pixel.
   * @returns {Number} the number of samples per pixel
   */
  getSamplesPerPixel() {
    return typeof this.fileDirectory.SamplesPerPixel < "u" ? this.fileDirectory.SamplesPerPixel : 1;
  }
  /**
   * Returns the width of each tile.
   * @returns {Number} the width of each tile
   */
  getTileWidth() {
    return this.isTiled ? this.fileDirectory.TileWidth : this.getWidth();
  }
  /**
   * Returns the height of each tile.
   * @returns {Number} the height of each tile
   */
  getTileHeight() {
    return this.isTiled ? this.fileDirectory.TileLength : typeof this.fileDirectory.RowsPerStrip < "u" ? Math.min(this.fileDirectory.RowsPerStrip, this.getHeight()) : this.getHeight();
  }
  getBlockWidth() {
    return this.getTileWidth();
  }
  getBlockHeight(e) {
    return this.isTiled || (e + 1) * this.getTileHeight() <= this.getHeight() ? this.getTileHeight() : this.getHeight() - e * this.getTileHeight();
  }
  /**
   * Calculates the number of bytes for each pixel across all samples. Only full
   * bytes are supported, an exception is thrown when this is not the case.
   * @returns {Number} the bytes per pixel
   */
  getBytesPerPixel() {
    let e = 0;
    for (let A = 0; A < this.fileDirectory.BitsPerSample.length; ++A)
      e += this.getSampleByteSize(A);
    return e;
  }
  getSampleByteSize(e) {
    if (e >= this.fileDirectory.BitsPerSample.length)
      throw new RangeError(`Sample index ${e} is out of range.`);
    return Math.ceil(this.fileDirectory.BitsPerSample[e] / 8);
  }
  getReaderForSample(e) {
    const A = this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[e] : 1, i = this.fileDirectory.BitsPerSample[e];
    switch (A) {
      case 1:
        if (i <= 8)
          return DataView.prototype.getUint8;
        if (i <= 16)
          return DataView.prototype.getUint16;
        if (i <= 32)
          return DataView.prototype.getUint32;
        break;
      case 2:
        if (i <= 8)
          return DataView.prototype.getInt8;
        if (i <= 16)
          return DataView.prototype.getInt16;
        if (i <= 32)
          return DataView.prototype.getInt32;
        break;
      case 3:
        switch (i) {
          case 16:
            return function(n, r) {
              return nn(this, n, r);
            };
          case 32:
            return DataView.prototype.getFloat32;
          case 64:
            return DataView.prototype.getFloat64;
        }
        break;
    }
    throw Error("Unsupported data format/bitsPerSample");
  }
  getSampleFormat(e = 0) {
    return this.fileDirectory.SampleFormat ? this.fileDirectory.SampleFormat[e] : 1;
  }
  getBitsPerSample(e = 0) {
    return this.fileDirectory.BitsPerSample[e];
  }
  getArrayForSample(e, A) {
    const i = this.getSampleFormat(e), n = this.getBitsPerSample(e);
    return gt(i, n, A);
  }
  /**
   * Returns the decoded strip or tile.
   * @param {Number} x the strip or tile x-offset
   * @param {Number} y the tile y-offset (0 for stripped images)
   * @param {Number} sample the sample to get for separated samples
   * @param {import("./geotiff").Pool|import("./geotiff").BaseDecoder} poolOrDecoder the decoder or decoder pool
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   * @returns {Promise.<ArrayBuffer>}
   */
  async getTileOrStrip(e, A, i, n, r) {
    const l = Math.ceil(this.getWidth() / this.getTileWidth()), a = Math.ceil(this.getHeight() / this.getTileHeight());
    let h;
    const { tiles: o } = this;
    this.planarConfiguration === 1 ? h = A * l + e : this.planarConfiguration === 2 && (h = i * l * a + A * l + e);
    let s, g;
    this.isTiled ? (s = this.fileDirectory.TileOffsets[h], g = this.fileDirectory.TileByteCounts[h]) : (s = this.fileDirectory.StripOffsets[h], g = this.fileDirectory.StripByteCounts[h]);
    const I = (await this.source.fetch([{ offset: s, length: g }], r))[0];
    let c;
    return o === null || !o[h] ? (c = (async () => {
      let f = await n.decode(this.fileDirectory, I);
      const w = this.getSampleFormat(), B = this.getBitsPerSample();
      return ps(w, B) && (f = xs(
        f,
        w,
        this.planarConfiguration,
        this.getSamplesPerPixel(),
        B,
        this.getTileWidth(),
        this.getBlockHeight(A)
      )), f;
    })(), o !== null && (o[h] = c)) : c = o[h], { x: e, y: A, sample: i, data: await c };
  }
  /**
   * Internal read function.
   * @private
   * @param {Array} imageWindow The image window in pixel coordinates
   * @param {Array} samples The selected samples (0-based indices)
   * @param {TypedArray|TypedArray[]} valueArrays The array(s) to write into
   * @param {Boolean} interleave Whether or not to write in an interleaved manner
   * @param {import("./geotiff").Pool|AbstractDecoder} poolOrDecoder the decoder or decoder pool
   * @param {number} width the width of window to be read into
   * @param {number} height the height of window to be read into
   * @param {number} resampleMethod the resampling method to be used when interpolating
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   * @returns {Promise<ReadRasterResult>}
   */
  async _readRaster(e, A, i, n, r, l, a, h, o) {
    const s = this.getTileWidth(), g = this.getTileHeight(), I = this.getWidth(), c = this.getHeight(), f = Math.max(Math.floor(e[0] / s), 0), w = Math.min(
      Math.ceil(e[2] / s),
      Math.ceil(I / s)
    ), B = Math.max(Math.floor(e[1] / g), 0), u = Math.min(
      Math.ceil(e[3] / g),
      Math.ceil(c / g)
    ), E = e[2] - e[0];
    let y = this.getBytesPerPixel();
    const d = [], x = [];
    for (let p = 0; p < A.length; ++p)
      this.planarConfiguration === 1 ? d.push(ys(this.fileDirectory.BitsPerSample, 0, A[p]) / 8) : d.push(0), x.push(this.getReaderForSample(A[p]));
    const C = [], { littleEndian: Q } = this;
    for (let p = B; p < u; ++p)
      for (let k = f; k < w; ++k) {
        let b;
        this.planarConfiguration === 1 && (b = this.getTileOrStrip(k, p, 0, r, o));
        for (let S = 0; S < A.length; ++S) {
          const v = S, L = A[S];
          this.planarConfiguration === 2 && (y = this.getSampleByteSize(L), b = this.getTileOrStrip(k, p, L, r, o));
          const P = b.then((M) => {
            const F = M.data, U = new DataView(F), R = this.getBlockHeight(M.y), T = M.y * g, O = M.x * s, N = T + R, H = (M.x + 1) * s, X = x[v], _ = Math.min(R, R - (N - e[3]), c - T), q = Math.min(s, s - (H - e[2]), I - O);
            for (let Y = Math.max(0, e[1] - T); Y < _; ++Y)
              for (let V = Math.max(0, e[0] - O); V < q; ++V) {
                const j = (Y * s + V) * y, z = X.call(
                  U,
                  j + d[v],
                  Q
                );
                let $;
                n ? ($ = (Y + T - e[1]) * E * A.length + (V + O - e[0]) * A.length + v, i[$] = z) : ($ = (Y + T - e[1]) * E + V + O - e[0], i[v][$] = z);
              }
          });
          C.push(P);
        }
      }
    if (await Promise.all(C), l && e[2] - e[0] !== l || a && e[3] - e[1] !== a) {
      let p;
      return n ? p = ws(
        i,
        e[2] - e[0],
        e[3] - e[1],
        l,
        a,
        A.length,
        h
      ) : p = Es(
        i,
        e[2] - e[0],
        e[3] - e[1],
        l,
        a,
        h
      ), p.width = l, p.height = a, p;
    }
    return i.width = l || e[2] - e[0], i.height = a || e[3] - e[1], i;
  }
  /**
   * Reads raster data from the image. This function reads all selected samples
   * into separate arrays of the correct type for that sample or into a single
   * combined array when `interleave` is set. When provided, only a subset
   * of the raster is read for each sample.
   *
   * @param {ReadRasterOptions} [options={}] optional parameters
   * @returns {Promise<ReadRasterResult>} the decoded arrays as a promise
   */
  async readRasters({
    window: e,
    samples: A = [],
    interleave: i,
    pool: n = null,
    width: r,
    height: l,
    resampleMethod: a,
    fillValue: h,
    signal: o
  } = {}) {
    const s = e || [0, 0, this.getWidth(), this.getHeight()];
    if (s[0] > s[2] || s[1] > s[3])
      throw new Error("Invalid subsets");
    const g = s[2] - s[0], I = s[3] - s[1], c = g * I, f = this.getSamplesPerPixel();
    if (!A || !A.length)
      for (let E = 0; E < f; ++E)
        A.push(E);
    else
      for (let E = 0; E < A.length; ++E)
        if (A[E] >= f)
          return Promise.reject(new RangeError(`Invalid sample index '${A[E]}'.`));
    let w;
    if (i) {
      const E = this.fileDirectory.SampleFormat ? Math.max.apply(null, this.fileDirectory.SampleFormat) : 1, y = Math.max.apply(null, this.fileDirectory.BitsPerSample);
      w = gt(E, y, c * A.length), h && w.fill(h);
    } else {
      w = [];
      for (let E = 0; E < A.length; ++E) {
        const y = this.getArrayForSample(A[E], c);
        Array.isArray(h) && E < h.length ? y.fill(h[E]) : h && !Array.isArray(h) && y.fill(h), w.push(y);
      }
    }
    const B = n || await Bs(this.fileDirectory);
    return await this._readRaster(
      s,
      A,
      w,
      i,
      B,
      r,
      l,
      a,
      o
    );
  }
  /**
   * Reads raster data from the image as RGB. The result is always an
   * interleaved typed array.
   * Colorspaces other than RGB will be transformed to RGB, color maps expanded.
   * When no other method is applicable, the first sample is used to produce a
   * grayscale image.
   * When provided, only a subset of the raster is read for each sample.
   *
   * @param {Object} [options] optional parameters
   * @param {Array<number>} [options.window] the subset to read data from in pixels.
   * @param {boolean} [options.interleave=true] whether the data shall be read
   *                                             in one single array or separate
   *                                             arrays.
   * @param {import("./geotiff").Pool} [options.pool=null] The optional decoder pool to use.
   * @param {number} [options.width] The desired width of the output. When the width is no the
   *                                 same as the images, resampling will be performed.
   * @param {number} [options.height] The desired height of the output. When the width is no the
   *                                  same as the images, resampling will be performed.
   * @param {string} [options.resampleMethod='nearest'] The desired resampling method.
   * @param {boolean} [options.enableAlpha=false] Enable reading alpha channel if present.
   * @param {AbortSignal} [options.signal] An AbortSignal that may be signalled if the request is
   *                                       to be aborted
   * @returns {Promise<ReadRasterResult>} the RGB array as a Promise
   */
  async readRGB({
    window: e,
    interleave: A = !0,
    pool: i = null,
    width: n,
    height: r,
    resampleMethod: l,
    enableAlpha: a = !1,
    signal: h
  } = {}) {
    const o = e || [0, 0, this.getWidth(), this.getHeight()];
    if (o[0] > o[2] || o[1] > o[3])
      throw new Error("Invalid subsets");
    const s = this.fileDirectory.PhotometricInterpretation;
    if (s === gA.RGB) {
      let u = [0, 1, 2];
      if (this.fileDirectory.ExtraSamples !== is.Unspecified && a) {
        u = [];
        for (let E = 0; E < this.fileDirectory.BitsPerSample.length; E += 1)
          u.push(E);
      }
      return this.readRasters({
        window: e,
        interleave: A,
        samples: u,
        pool: i,
        width: n,
        height: r,
        resampleMethod: l,
        signal: h
      });
    }
    let g;
    switch (s) {
      case gA.WhiteIsZero:
      case gA.BlackIsZero:
      case gA.Palette:
        g = [0];
        break;
      case gA.CMYK:
        g = [0, 1, 2, 3];
        break;
      case gA.YCbCr:
      case gA.CIELab:
        g = [0, 1, 2];
        break;
      default:
        throw new Error("Invalid or unsupported photometric interpretation.");
    }
    const I = {
      window: o,
      interleave: !0,
      samples: g,
      pool: i,
      width: n,
      height: r,
      resampleMethod: l,
      signal: h
    }, { fileDirectory: c } = this, f = await this.readRasters(I), w = 2 ** this.fileDirectory.BitsPerSample[0];
    let B;
    switch (s) {
      case gA.WhiteIsZero:
        B = ss(f, w);
        break;
      case gA.BlackIsZero:
        B = os(f, w);
        break;
      case gA.Palette:
        B = as(f, c.ColorMap);
        break;
      case gA.CMYK:
        B = ls(f);
        break;
      case gA.YCbCr:
        B = gs(f);
        break;
      case gA.CIELab:
        B = Is(f);
        break;
      default:
        throw new Error("Unsupported photometric interpretation.");
    }
    if (!A) {
      const u = new Uint8Array(B.length / 3), E = new Uint8Array(B.length / 3), y = new Uint8Array(B.length / 3);
      for (let d = 0, x = 0; d < B.length; d += 3, ++x)
        u[x] = B[d], E[x] = B[d + 1], y[x] = B[d + 2];
      B = [u, E, y];
    }
    return B.width = f.width, B.height = f.height, B;
  }
  /**
   * Returns an array of tiepoints.
   * @returns {Object[]}
   */
  getTiePoints() {
    if (!this.fileDirectory.ModelTiepoint)
      return [];
    const e = [];
    for (let A = 0; A < this.fileDirectory.ModelTiepoint.length; A += 6)
      e.push({
        i: this.fileDirectory.ModelTiepoint[A],
        j: this.fileDirectory.ModelTiepoint[A + 1],
        k: this.fileDirectory.ModelTiepoint[A + 2],
        x: this.fileDirectory.ModelTiepoint[A + 3],
        y: this.fileDirectory.ModelTiepoint[A + 4],
        z: this.fileDirectory.ModelTiepoint[A + 5]
      });
    return e;
  }
  /**
   * Returns the parsed GDAL metadata items.
   *
   * If sample is passed to null, dataset-level metadata will be returned.
   * Otherwise only metadata specific to the provided sample will be returned.
   *
   * @param {number} [sample=null] The sample index.
   * @returns {Object}
   */
  getGDALMetadata(e = null) {
    const A = {};
    if (!this.fileDirectory.GDAL_METADATA)
      return null;
    const i = this.fileDirectory.GDAL_METADATA;
    let n = es(i, "Item");
    e === null ? n = n.filter((r) => Oe(r, "sample") === void 0) : n = n.filter((r) => Number(Oe(r, "sample")) === e);
    for (let r = 0; r < n.length; ++r) {
      const l = n[r];
      A[Oe(l, "name")] = l.inner;
    }
    return A;
  }
  /**
   * Returns the GDAL nodata value
   * @returns {number|null}
   */
  getGDALNoData() {
    if (!this.fileDirectory.GDAL_NODATA)
      return null;
    const e = this.fileDirectory.GDAL_NODATA;
    return Number(e.substring(0, e.length - 1));
  }
  /**
   * Returns the image origin as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @returns {Array<number>} The origin as a vector
   */
  getOrigin() {
    const e = this.fileDirectory.ModelTiepoint, A = this.fileDirectory.ModelTransformation;
    if (e && e.length === 6)
      return [
        e[3],
        e[4],
        e[5]
      ];
    if (A)
      return [
        A[3],
        A[7],
        A[11]
      ];
    throw new Error("The image does not have an affine transformation.");
  }
  /**
   * Returns the image resolution as a XYZ-vector. When the image has no affine
   * transformation, then an exception is thrown.
   * @param {GeoTIFFImage} [referenceImage=null] A reference image to calculate the resolution from
   *                                             in cases when the current image does not have the
   *                                             required tags on its own.
   * @returns {Array<number>} The resolution as a vector
   */
  getResolution(e = null) {
    const A = this.fileDirectory.ModelPixelScale, i = this.fileDirectory.ModelTransformation;
    if (A)
      return [
        A[0],
        -A[1],
        A[2]
      ];
    if (i)
      return i[1] === 0 && i[4] === 0 ? [
        i[0],
        -i[5],
        i[10]
      ] : [
        Math.sqrt(i[0] * i[0] + i[4] * i[4]),
        -Math.sqrt(i[1] * i[1] + i[5] * i[5]),
        i[10]
      ];
    if (e) {
      const [n, r, l] = e.getResolution();
      return [
        n * e.getWidth() / this.getWidth(),
        r * e.getHeight() / this.getHeight(),
        l * e.getWidth() / this.getWidth()
      ];
    }
    throw new Error("The image does not have an affine transformation.");
  }
  /**
   * Returns whether or not the pixels of the image depict an area (or point).
   * @returns {Boolean} Whether the pixels are a point
   */
  pixelIsArea() {
    return this.geoKeys.GTRasterTypeGeoKey === 1;
  }
  /**
   * Returns the image bounding box as an array of 4 values: min-x, min-y,
   * max-x and max-y. When the image has no affine transformation, then an
   * exception is thrown.
   * @param {boolean} [tilegrid=false] If true return extent for a tilegrid
   *                                   without adjustment for ModelTransformation.
   * @returns {Array<number>} The bounding box
   */
  getBoundingBox(e = !1) {
    const A = this.getHeight(), i = this.getWidth();
    if (this.fileDirectory.ModelTransformation && !e) {
      const [n, r, l, a, h, o, s, g] = this.fileDirectory.ModelTransformation, c = [
        [0, 0],
        [0, A],
        [i, 0],
        [i, A]
      ].map(([B, u]) => [
        a + n * B + r * u,
        g + h * B + o * u
      ]), f = c.map((B) => B[0]), w = c.map((B) => B[1]);
      return [
        Math.min(...f),
        Math.min(...w),
        Math.max(...f),
        Math.max(...w)
      ];
    } else {
      const n = this.getOrigin(), r = this.getResolution(), l = n[0], a = n[1], h = l + r[0] * i, o = a + r[1] * A;
      return [
        Math.min(l, h),
        Math.min(a, o),
        Math.max(l, h),
        Math.max(a, o)
      ];
    }
  }
}
class Ds {
  constructor(e) {
    this._dataView = new DataView(e);
  }
  get buffer() {
    return this._dataView.buffer;
  }
  getUint64(e, A) {
    const i = this.getUint32(e, A), n = this.getUint32(e + 4, A);
    let r;
    if (A) {
      if (r = i + 2 ** 32 * n, !Number.isSafeInteger(r))
        throw new Error(
          `${r} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
        );
      return r;
    }
    if (r = 2 ** 32 * i + n, !Number.isSafeInteger(r))
      throw new Error(
        `${r} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
      );
    return r;
  }
  // adapted from https://stackoverflow.com/a/55338384/8060591
  getInt64(e, A) {
    let i = 0;
    const n = (this._dataView.getUint8(e + (A ? 7 : 0)) & 128) > 0;
    let r = !0;
    for (let l = 0; l < 8; l++) {
      let a = this._dataView.getUint8(e + (A ? l : 7 - l));
      n && (r ? a !== 0 && (a = ~(a - 1) & 255, r = !1) : a = ~a & 255), i += a * 256 ** l;
    }
    return n && (i = -i), i;
  }
  getUint8(e, A) {
    return this._dataView.getUint8(e, A);
  }
  getInt8(e, A) {
    return this._dataView.getInt8(e, A);
  }
  getUint16(e, A) {
    return this._dataView.getUint16(e, A);
  }
  getInt16(e, A) {
    return this._dataView.getInt16(e, A);
  }
  getUint32(e, A) {
    return this._dataView.getUint32(e, A);
  }
  getInt32(e, A) {
    return this._dataView.getInt32(e, A);
  }
  getFloat16(e, A) {
    return nn(this._dataView, e, A);
  }
  getFloat32(e, A) {
    return this._dataView.getFloat32(e, A);
  }
  getFloat64(e, A) {
    return this._dataView.getFloat64(e, A);
  }
}
class Ss {
  constructor(e, A, i, n) {
    this._dataView = new DataView(e), this._sliceOffset = A, this._littleEndian = i, this._bigTiff = n;
  }
  get sliceOffset() {
    return this._sliceOffset;
  }
  get sliceTop() {
    return this._sliceOffset + this.buffer.byteLength;
  }
  get littleEndian() {
    return this._littleEndian;
  }
  get bigTiff() {
    return this._bigTiff;
  }
  get buffer() {
    return this._dataView.buffer;
  }
  covers(e, A) {
    return this.sliceOffset <= e && this.sliceTop >= e + A;
  }
  readUint8(e) {
    return this._dataView.getUint8(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readInt8(e) {
    return this._dataView.getInt8(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readUint16(e) {
    return this._dataView.getUint16(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readInt16(e) {
    return this._dataView.getInt16(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readUint32(e) {
    return this._dataView.getUint32(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readInt32(e) {
    return this._dataView.getInt32(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readFloat32(e) {
    return this._dataView.getFloat32(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readFloat64(e) {
    return this._dataView.getFloat64(
      e - this._sliceOffset,
      this._littleEndian
    );
  }
  readUint64(e) {
    const A = this.readUint32(e), i = this.readUint32(e + 4);
    let n;
    if (this._littleEndian) {
      if (n = A + 2 ** 32 * i, !Number.isSafeInteger(n))
        throw new Error(
          `${n} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
        );
      return n;
    }
    if (n = 2 ** 32 * A + i, !Number.isSafeInteger(n))
      throw new Error(
        `${n} exceeds MAX_SAFE_INTEGER. Precision may be lost. Please report if you get this message to https://github.com/geotiffjs/geotiff.js/issues`
      );
    return n;
  }
  // adapted from https://stackoverflow.com/a/55338384/8060591
  readInt64(e) {
    let A = 0;
    const i = (this._dataView.getUint8(e + (this._littleEndian ? 7 : 0)) & 128) > 0;
    let n = !0;
    for (let r = 0; r < 8; r++) {
      let l = this._dataView.getUint8(
        e + (this._littleEndian ? r : 7 - r)
      );
      i && (n ? l !== 0 && (l = ~(l - 1) & 255, n = !1) : l = ~l & 255), A += l * 256 ** r;
    }
    return i && (A = -A), A;
  }
  readOffset(e) {
    return this._bigTiff ? this.readUint64(e) : this.readUint32(e);
  }
}
class Fs {
  /**
   *
   * @param {Slice[]} slices
   * @returns {ArrayBuffer[]}
   */
  async fetch(e, A = void 0) {
    return Promise.all(
      e.map((i) => this.fetchSlice(i, A))
    );
  }
  /**
   *
   * @param {Slice} slice
   * @returns {ArrayBuffer}
   */
  async fetchSlice(e) {
    throw new Error(`fetching of slice ${e} not possible, not implemented`);
  }
  /**
   * Returns the filesize if already determined and null otherwise
   */
  get fileSize() {
    return null;
  }
  async close() {
  }
}
class Rt extends Error {
  constructor(e) {
    super(e), Error.captureStackTrace && Error.captureStackTrace(this, Rt), this.name = "AbortError";
  }
}
class ks extends Fs {
  constructor(e) {
    super(), this.arrayBuffer = e;
  }
  fetchSlice(e, A) {
    if (A && A.aborted)
      throw new Rt("Request aborted");
    return this.arrayBuffer.slice(e.offset, e.offset + e.length);
  }
}
function bs(t) {
  return new ks(t);
}
function Ms(t, e) {
  let A = t.length - e, i = 0;
  do {
    for (let n = e; n > 0; n--)
      t[i + e] += t[i], i++;
    A -= e;
  } while (A > 0);
}
function Ls(t, e, A) {
  let i = 0, n = t.length;
  const r = n / A;
  for (; n > e; ) {
    for (let a = e; a > 0; --a)
      t[i + e] += t[i], ++i;
    n -= e;
  }
  const l = t.slice();
  for (let a = 0; a < r; ++a)
    for (let h = 0; h < A; ++h)
      t[A * a + h] = l[(A - h - 1) * r + a];
}
function vs(t, e, A, i, n, r) {
  if (e === 1)
    return t;
  for (let h = 0; h < n.length; ++h) {
    if (n[h] % 8 !== 0)
      throw new Error("When decoding with predictor, only multiple of 8 bits are supported.");
    if (n[h] !== n[0])
      throw new Error("When decoding with predictor, all samples must have the same size.");
  }
  const l = n[0] / 8, a = r === 2 ? 1 : n.length;
  for (let h = 0; h < i && !(h * a * A * l >= t.byteLength); ++h) {
    let o;
    if (e === 2) {
      switch (n[0]) {
        case 8:
          o = new Uint8Array(
            t,
            h * a * A * l,
            a * A * l
          );
          break;
        case 16:
          o = new Uint16Array(
            t,
            h * a * A * l,
            a * A * l / 2
          );
          break;
        case 32:
          o = new Uint32Array(
            t,
            h * a * A * l,
            a * A * l / 4
          );
          break;
        default:
          throw new Error(`Predictor 2 not allowed with ${n[0]} bits per sample.`);
      }
      Ms(o, a);
    } else e === 3 && (o = new Uint8Array(
      t,
      h * a * A * l,
      a * A * l
    ), Ls(o, a, l));
  }
  return t;
}
class NA {
  async decode(e, A) {
    const i = await this.decodeBlock(A), n = e.Predictor || 1;
    if (n !== 1) {
      const r = !e.StripOffsets, l = r ? e.TileWidth : e.ImageWidth, a = r ? e.TileLength : e.RowsPerStrip || e.ImageLength;
      return vs(
        i,
        n,
        l,
        a,
        e.BitsPerSample,
        e.PlanarConfiguration
      );
    }
    return i;
  }
}
function ct(t) {
  switch (t) {
    case J.BYTE:
    case J.ASCII:
    case J.SBYTE:
    case J.UNDEFINED:
      return 1;
    case J.SHORT:
    case J.SSHORT:
      return 2;
    case J.LONG:
    case J.SLONG:
    case J.FLOAT:
    case J.IFD:
      return 4;
    case J.RATIONAL:
    case J.SRATIONAL:
    case J.DOUBLE:
    case J.LONG8:
    case J.SLONG8:
    case J.IFD8:
      return 8;
    default:
      throw new RangeError(`Invalid field type: ${t}`);
  }
}
function Gs(t) {
  const e = t.GeoKeyDirectory;
  if (!e)
    return null;
  const A = {};
  for (let i = 4; i <= e[3] * 4; i += 4) {
    const n = rs[e[i]], r = e[i + 1] ? ne[e[i + 1]] : null, l = e[i + 2], a = e[i + 3];
    let h = null;
    if (!r)
      h = a;
    else {
      if (h = t[r], typeof h > "u" || h === null)
        throw new Error(`Could not get value of geoKey '${n}'.`);
      typeof h == "string" ? h = h.substring(a, a + l - 1) : h.subarray && (h = h.subarray(a, a + l), l === 1 && (h = h[0]));
    }
    A[n] = h;
  }
  return A;
}
function PA(t, e, A, i) {
  let n = null, r = null;
  const l = ct(e);
  switch (e) {
    case J.BYTE:
    case J.ASCII:
    case J.UNDEFINED:
      n = new Uint8Array(A), r = t.readUint8;
      break;
    case J.SBYTE:
      n = new Int8Array(A), r = t.readInt8;
      break;
    case J.SHORT:
      n = new Uint16Array(A), r = t.readUint16;
      break;
    case J.SSHORT:
      n = new Int16Array(A), r = t.readInt16;
      break;
    case J.LONG:
    case J.IFD:
      n = new Uint32Array(A), r = t.readUint32;
      break;
    case J.SLONG:
      n = new Int32Array(A), r = t.readInt32;
      break;
    case J.LONG8:
    case J.IFD8:
      n = new Array(A), r = t.readUint64;
      break;
    case J.SLONG8:
      n = new Array(A), r = t.readInt64;
      break;
    case J.RATIONAL:
      n = new Uint32Array(A * 2), r = t.readUint32;
      break;
    case J.SRATIONAL:
      n = new Int32Array(A * 2), r = t.readInt32;
      break;
    case J.FLOAT:
      n = new Float32Array(A), r = t.readFloat32;
      break;
    case J.DOUBLE:
      n = new Float64Array(A), r = t.readFloat64;
      break;
    default:
      throw new RangeError(`Invalid field type: ${e}`);
  }
  if (e === J.RATIONAL || e === J.SRATIONAL)
    for (let a = 0; a < A; a += 2)
      n[a] = r.call(
        t,
        i + a * l
      ), n[a + 1] = r.call(
        t,
        i + (a * l + 4)
      );
  else
    for (let a = 0; a < A; ++a)
      n[a] = r.call(
        t,
        i + a * l
      );
  return e === J.ASCII ? new TextDecoder("utf-8").decode(n) : n;
}
class Rs {
  constructor(e, A, i) {
    this.fileDirectory = e, this.geoKeyDirectory = A, this.nextIFDByteOffset = i;
  }
}
class ue extends Error {
  constructor(e) {
    super(`No image at index ${e}`), this.index = e;
  }
}
class Us {
  /**
   * (experimental) Reads raster data from the best fitting image. This function uses
   * the image with the lowest resolution that is still a higher resolution than the
   * requested resolution.
   * When specified, the `bbox` option is translated to the `window` option and the
   * `resX` and `resY` to `width` and `height` respectively.
   * Then, the [readRasters]{@link GeoTIFFImage#readRasters} method of the selected
   * image is called and the result returned.
   * @see GeoTIFFImage.readRasters
   * @param {import('./geotiffimage').ReadRasterOptions} [options={}] optional parameters
   * @returns {Promise<ReadRasterResult>} the decoded array(s), with `height` and `width`, as a promise
   */
  async readRasters(e = {}) {
    const { window: A, width: i, height: n } = e;
    let { resX: r, resY: l, bbox: a } = e;
    const h = await this.getImage();
    let o = h;
    const s = await this.getImageCount(), g = h.getBoundingBox();
    if (A && a)
      throw new Error('Both "bbox" and "window" passed.');
    if (i || n) {
      if (A) {
        const [f, w] = h.getOrigin(), [B, u] = h.getResolution();
        a = [
          f + A[0] * B,
          w + A[1] * u,
          f + A[2] * B,
          w + A[3] * u
        ];
      }
      const c = a || g;
      if (i) {
        if (r)
          throw new Error("Both width and resX passed");
        r = (c[2] - c[0]) / i;
      }
      if (n) {
        if (l)
          throw new Error("Both width and resY passed");
        l = (c[3] - c[1]) / n;
      }
    }
    if (r || l) {
      const c = [];
      for (let f = 0; f < s; ++f) {
        const w = await this.getImage(f), { SubfileType: B, NewSubfileType: u } = w.fileDirectory;
        (f === 0 || B === 2 || u & 1) && c.push(w);
      }
      c.sort((f, w) => f.getWidth() - w.getWidth());
      for (let f = 0; f < c.length; ++f) {
        const w = c[f], B = (g[2] - g[0]) / w.getWidth(), u = (g[3] - g[1]) / w.getHeight();
        if (o = w, r && r > B || l && l > u)
          break;
      }
    }
    let I = A;
    if (a) {
      const [c, f] = h.getOrigin(), [w, B] = o.getResolution(h);
      I = [
        Math.round((a[0] - c) / w),
        Math.round((a[1] - f) / B),
        Math.round((a[2] - c) / w),
        Math.round((a[3] - f) / B)
      ], I = [
        Math.min(I[0], I[2]),
        Math.min(I[1], I[3]),
        Math.max(I[0], I[2]),
        Math.max(I[1], I[3])
      ];
    }
    return o.readRasters({ ...e, window: I });
  }
}
class Ut extends Us {
  /**
   * @constructor
   * @param {*} source The datasource to read from.
   * @param {boolean} littleEndian Whether the image uses little endian.
   * @param {boolean} bigTiff Whether the image uses bigTIFF conventions.
   * @param {number} firstIFDOffset The numeric byte-offset from the start of the image
   *                                to the first IFD.
   * @param {GeoTIFFOptions} [options] further options.
   */
  constructor(e, A, i, n, r = {}) {
    super(), this.source = e, this.littleEndian = A, this.bigTiff = i, this.firstIFDOffset = n, this.cache = r.cache || !1, this.ifdRequests = [], this.ghostValues = null;
  }
  async getSlice(e, A) {
    const i = this.bigTiff ? 4048 : 1024;
    return new Ss(
      (await this.source.fetch([{
        offset: e,
        length: typeof A < "u" ? A : i
      }]))[0],
      e,
      this.littleEndian,
      this.bigTiff
    );
  }
  /**
   * Instructs to parse an image file directory at the given file offset.
   * As there is no way to ensure that a location is indeed the start of an IFD,
   * this function must be called with caution (e.g only using the IFD offsets from
   * the headers or other IFDs).
   * @param {number} offset the offset to parse the IFD at
   * @returns {Promise<ImageFileDirectory>} the parsed IFD
   */
  async parseFileDirectoryAt(e) {
    const A = this.bigTiff ? 20 : 12, i = this.bigTiff ? 8 : 2;
    let n = await this.getSlice(e);
    const r = this.bigTiff ? n.readUint64(e) : n.readUint16(e), l = r * A + (this.bigTiff ? 16 : 6);
    n.covers(e, l) || (n = await this.getSlice(e, l));
    const a = {};
    let h = e + (this.bigTiff ? 8 : 2);
    for (let g = 0; g < r; h += A, ++g) {
      const I = n.readUint16(h), c = n.readUint16(h + 2), f = this.bigTiff ? n.readUint64(h + 4) : n.readUint32(h + 4);
      let w, B;
      const u = ct(c), E = h + (this.bigTiff ? 12 : 8);
      if (u * f <= (this.bigTiff ? 8 : 4))
        w = PA(n, c, f, E);
      else {
        const y = n.readOffset(E), d = ct(c) * f;
        if (n.covers(y, d))
          w = PA(n, c, f, y);
        else {
          const x = await this.getSlice(y, d);
          w = PA(x, c, f, y);
        }
      }
      f === 1 && ts.indexOf(I) === -1 && !(c === J.RATIONAL || c === J.SRATIONAL) ? B = w[0] : B = w, a[ne[I]] = B;
    }
    const o = Gs(a), s = n.readOffset(
      e + i + A * r
    );
    return new Rs(
      a,
      o,
      s
    );
  }
  async requestIFD(e) {
    if (this.ifdRequests[e])
      return this.ifdRequests[e];
    if (e === 0)
      return this.ifdRequests[e] = this.parseFileDirectoryAt(this.firstIFDOffset), this.ifdRequests[e];
    if (!this.ifdRequests[e - 1])
      try {
        this.ifdRequests[e - 1] = this.requestIFD(e - 1);
      } catch (A) {
        throw A instanceof ue ? new ue(e) : A;
      }
    return this.ifdRequests[e] = (async () => {
      const A = await this.ifdRequests[e - 1];
      if (A.nextIFDByteOffset === 0)
        throw new ue(e);
      return this.parseFileDirectoryAt(A.nextIFDByteOffset);
    })(), this.ifdRequests[e];
  }
  /**
   * Get the n-th internal subfile of an image. By default, the first is returned.
   *
   * @param {number} [index=0] the index of the image to return.
   * @returns {Promise<GeoTIFFImage>} the image at the given index
   */
  async getImage(e = 0) {
    const A = await this.requestIFD(e);
    return new ms(
      A.fileDirectory,
      A.geoKeyDirectory,
      this.dataView,
      this.littleEndian,
      this.cache,
      this.source
    );
  }
  /**
   * Returns the count of the internal subfiles.
   *
   * @returns {Promise<number>} the number of internal subfile images
   */
  async getImageCount() {
    let e = 0, A = !0;
    for (; A; )
      try {
        await this.requestIFD(e), ++e;
      } catch (i) {
        if (i instanceof ue)
          A = !1;
        else
          throw i;
      }
    return e;
  }
  /**
   * Get the values of the COG ghost area as a parsed map.
   * See https://gdal.org/drivers/raster/cog.html#header-ghost-area for reference
   * @returns {Promise<Object>} the parsed ghost area or null, if no such area was found
   */
  async getGhostValues() {
    const e = this.bigTiff ? 16 : 8;
    if (this.ghostValues)
      return this.ghostValues;
    const A = "GDAL_STRUCTURAL_METADATA_SIZE=", i = A.length + 100;
    let n = await this.getSlice(e, i);
    if (A === PA(n, J.ASCII, A.length, e)) {
      const l = PA(n, J.ASCII, i, e).split(`
`)[0], a = Number(l.split("=")[1].split(" ")[0]) + l.length;
      a > i && (n = await this.getSlice(e, a));
      const h = PA(n, J.ASCII, a, e);
      this.ghostValues = {}, h.split(`
`).filter((o) => o.length > 0).map((o) => o.split("=")).forEach(([o, s]) => {
        this.ghostValues[o] = s;
      });
    }
    return this.ghostValues;
  }
  /**
   * Parse a (Geo)TIFF file from the given source.
   *
   * @param {*} source The source of data to parse from.
   * @param {GeoTIFFOptions} [options] Additional options.
   * @param {AbortSignal} [signal] An AbortSignal that may be signalled if the request is
   *                               to be aborted
   */
  static async fromSource(e, A, i) {
    const n = (await e.fetch([{ offset: 0, length: 1024 }], i))[0], r = new Ds(n), l = r.getUint16(0, 0);
    let a;
    if (l === 18761)
      a = !0;
    else if (l === 19789)
      a = !1;
    else
      throw new TypeError("Invalid byte order value.");
    const h = r.getUint16(2, a);
    let o;
    if (h === 42)
      o = !1;
    else if (h === 43) {
      if (o = !0, r.getUint16(4, a) !== 8)
        throw new Error("Unsupported offset byte-size.");
    } else
      throw new TypeError("Invalid magic number.");
    const s = o ? r.getUint64(8, a) : r.getUint32(4, a);
    return new Ut(e, a, o, s, A);
  }
  /**
   * Closes the underlying file buffer
   * N.B. After the GeoTIFF has been completely processed it needs
   * to be closed but only if it has been constructed from a file.
   */
  close() {
    return typeof this.source.close == "function" ? this.source.close() : !1;
  }
}
async function Ts(t, e) {
  return Ut.fromSource(bs(t), e);
}
function _s(t, e, A, i = 64, n = 64) {
  const [r, l, a, h] = e, [o, s, g, I] = A, c = t.width / (a - r), f = t.height / (h - l), w = (o - r) * c, B = (h - I) * f, u = (g - r) * c, E = (h - s) * f, y = [w, B, u, E];
  return Ns(t.buffer, t.width, t.height, y, i, n, 0);
}
function Ns(t, e, A, i, n, r, l = 0) {
  if (t.length !== e * A)
    throw new Error("Buffer size does not match width and height");
  const [a, h, o, s] = i, g = Math.min(a, o), I = Math.max(a, o), c = Math.min(h, s), f = Math.max(h, s), w = new Float32Array(n * r), B = (I - g) / n, u = (f - c) / r;
  for (let E = 0; E < r; E++)
    for (let y = 0; y < n; y++) {
      const d = g + y * B, x = c + E * u, C = E * n + y;
      if (d < 0 || d >= e || x < 0 || x >= A) {
        w[C] = l;
        continue;
      }
      const Q = Math.floor(d), p = Math.floor(x), k = Math.min(Q + 1, e - 1), b = Math.min(p + 1, A - 1), S = d - Q, v = x - p, L = t[p * e + Q], P = t[b * e + Q], M = t[p * e + k], F = t[b * e + k], U = L * (1 - S) * (1 - v) + M * S * (1 - v) + P * (1 - S) * v + F * S * v;
      console.assert(!isNaN(U)), w[C] = U;
    }
  return w;
}
class Nl {
  /**
   * 构造函数，初始化 TifDEMLoder 实例
   */
  constructor() {
    D(this, "info", {
      author: "chaoxl",
      version: "0.10.0",
      description: "TIF DEM terrain loader. It can load single tif dem."
    });
    // 数据标识
    D(this, "dataType", "single-tif");
    // 数据加载器
    D(this, "_loader", new yt(ve.manager));
    this._loader.setResponseType("arraybuffer");
  }
  /**
   * 加载瓦片的几何体数据
   * @param params 包含加载瓦片所需的参数，类型为 TileSourceLoadParamsType<TifDemSource>
   * @returns 加载完成后返回一个 BufferGeometry 对象
   */
  async load(e) {
    const { source: A, z: i, bounds: n } = e, r = new gr(), l = A._getUrl(0, 0, 0);
    if (i < A.minLevel || i > A.maxLevel || !l)
      return r;
    const a = Qt.clamp((e.z + 2) * 3, 2, 128);
    if (!A._data) {
      console.log("load image...", l);
      const o = await this._loader.loadAsync(l);
      A._data = await this.getTIFFRaster(o);
    }
    const h = _s(A._data, A._projectionBounds, n, a, a);
    return console.log(A.skirtHeight), r.setData(h, A.skirtHeight);
  }
  /**
   * 从 ArrayBuffer 中读取 TIFF 图像的栅格数据
   * @param buffer 包含 TIFF 图像数据的 ArrayBuffer
   * @returns 包含栅格数据的对象，包含 buffer、width 和 height 属性
   */
  async getTIFFRaster(e) {
    const i = await (await (await Ts(e)).getImage(0)).readRasters();
    return {
      // 第一个波段的栅格数据，强制转换为 Float32Array 类型
      buffer: i[0],
      // 栅格数据的宽度
      width: i.width,
      // 栅格数据的高度
      height: i.height
    };
  }
}
class Ol extends AA {
  constructor() {
    super(...arguments);
    /** 该数据源的类型标识 */
    D(this, "dataType", "single-tif");
    /** 瓦片裙边高度(m) */
    D(this, "skirtHeight", 1e3);
    /** 高程数据，内部使用 */
    D(this, "_data");
  }
}
function ft(t, e, A, i) {
  let n = i;
  const r = e + (A - e >> 1);
  let l = A - e, a;
  const h = t[e], o = t[e + 1], s = t[A], g = t[A + 1];
  for (let I = e + 3; I < A; I += 3) {
    const c = Os(t[I], t[I + 1], h, o, s, g);
    if (c > n)
      a = I, n = c;
    else if (c === n) {
      const f = Math.abs(I - r);
      f < l && (a = I, l = f);
    }
  }
  n > i && (a - e > 3 && ft(t, e, a, i), t[a + 2] = n, A - a > 3 && ft(t, a, A, i));
}
function Os(t, e, A, i, n, r) {
  let l = n - A, a = r - i;
  if (l !== 0 || a !== 0) {
    const h = ((t - A) * l + (e - i) * a) / (l * l + a * a);
    h > 1 ? (A = n, i = r) : h > 0 && (A += l * h, i += a * h);
  }
  return l = t - A, a = e - i, l * l + a * a;
}
function le(t, e, A, i) {
  const n = {
    id: t ?? null,
    type: e,
    geometry: A,
    tags: i,
    minX: 1 / 0,
    minY: 1 / 0,
    maxX: -1 / 0,
    maxY: -1 / 0
  };
  if (e === "Point" || e === "MultiPoint" || e === "LineString")
    Ce(n, A);
  else if (e === "Polygon")
    Ce(n, A[0]);
  else if (e === "MultiLineString")
    for (const r of A)
      Ce(n, r);
  else if (e === "MultiPolygon")
    for (const r of A)
      Ce(n, r[0]);
  return n;
}
function Ce(t, e) {
  for (let A = 0; A < e.length; A += 3)
    t.minX = Math.min(t.minX, e[A]), t.minY = Math.min(t.minY, e[A + 1]), t.maxX = Math.max(t.maxX, e[A]), t.maxY = Math.max(t.maxY, e[A + 1]);
}
function Ys(t, e) {
  const A = [];
  if (t.type === "FeatureCollection")
    for (let i = 0; i < t.features.length; i++)
      Me(A, t.features[i], e, i);
  else t.type === "Feature" ? Me(A, t, e) : Me(A, { geometry: t }, e);
  return A;
}
function Me(t, e, A, i) {
  if (!e.geometry) return;
  const n = e.geometry.coordinates;
  if (n && n.length === 0) return;
  const r = e.geometry.type, l = Math.pow(A.tolerance / ((1 << A.maxZoom) * A.extent), 2);
  let a = [], h = e.id;
  if (A.promoteId ? h = e.properties[A.promoteId] : A.generateId && (h = i || 0), r === "Point")
    $t(n, a);
  else if (r === "MultiPoint")
    for (const o of n)
      $t(o, a);
  else if (r === "LineString")
    ht(n, a, l, !1);
  else if (r === "MultiLineString")
    if (A.lineMetrics) {
      for (const o of n)
        a = [], ht(o, a, l, !1), t.push(le(h, "LineString", a, e.properties));
      return;
    } else
      Je(n, a, l, !1);
  else if (r === "Polygon")
    Je(n, a, l, !0);
  else if (r === "MultiPolygon")
    for (const o of n) {
      const s = [];
      Je(o, s, l, !0), a.push(s);
    }
  else if (r === "GeometryCollection") {
    for (const o of e.geometry.geometries)
      Me(t, {
        id: h,
        geometry: o,
        properties: e.properties
      }, A, i);
    return;
  } else
    throw new Error("Input data is not a valid GeoJSON object.");
  t.push(le(h, r, a, e.properties));
}
function $t(t, e) {
  e.push(fn(t[0]), hn(t[1]), 0);
}
function ht(t, e, A, i) {
  let n, r, l = 0;
  for (let h = 0; h < t.length; h++) {
    const o = fn(t[h][0]), s = hn(t[h][1]);
    e.push(o, s, 0), h > 0 && (i ? l += (n * s - o * r) / 2 : l += Math.sqrt(Math.pow(o - n, 2) + Math.pow(s - r, 2))), n = o, r = s;
  }
  const a = e.length - 3;
  e[2] = 1, ft(e, 0, a, A), e[a + 2] = 1, e.size = Math.abs(l), e.start = 0, e.end = e.size;
}
function Je(t, e, A, i) {
  for (let n = 0; n < t.length; n++) {
    const r = [];
    ht(t[n], r, A, i), e.push(r);
  }
}
function fn(t) {
  return t / 360 + 0.5;
}
function hn(t) {
  const e = Math.sin(t * Math.PI / 180), A = 0.5 - 0.25 * Math.log((1 + e) / (1 - e)) / Math.PI;
  return A < 0 ? 0 : A > 1 ? 1 : A;
}
function kA(t, e, A, i, n, r, l, a) {
  if (A /= e, i /= e, r >= A && l < i) return t;
  if (l < A || r >= i) return null;
  const h = [];
  for (const o of t) {
    const s = o.geometry;
    let g = o.type;
    const I = n === 0 ? o.minX : o.minY, c = n === 0 ? o.maxX : o.maxY;
    if (I >= A && c < i) {
      h.push(o);
      continue;
    } else if (c < A || I >= i)
      continue;
    let f = [];
    if (g === "Point" || g === "MultiPoint")
      qs(s, f, A, i, n);
    else if (g === "LineString")
      In(s, f, A, i, n, !1, a.lineMetrics);
    else if (g === "MultiLineString")
      Ve(s, f, A, i, n, !1);
    else if (g === "Polygon")
      Ve(s, f, A, i, n, !0);
    else if (g === "MultiPolygon")
      for (const w of s) {
        const B = [];
        Ve(w, B, A, i, n, !0), B.length && f.push(B);
      }
    if (f.length) {
      if (a.lineMetrics && g === "LineString") {
        for (const w of f)
          h.push(le(o.id, g, w, o.tags));
        continue;
      }
      (g === "LineString" || g === "MultiLineString") && (f.length === 1 ? (g = "LineString", f = f[0]) : g = "MultiLineString"), (g === "Point" || g === "MultiPoint") && (g = f.length === 3 ? "Point" : "MultiPoint"), h.push(le(o.id, g, f, o.tags));
    }
  }
  return h.length ? h : null;
}
function qs(t, e, A, i, n) {
  for (let r = 0; r < t.length; r += 3) {
    const l = t[r + n];
    l >= A && l <= i && XA(e, t[r], t[r + 1], t[r + 2]);
  }
}
function In(t, e, A, i, n, r, l) {
  let a = Ai(t);
  const h = n === 0 ? Ps : Js;
  let o = t.start, s, g;
  for (let u = 0; u < t.length - 3; u += 3) {
    const E = t[u], y = t[u + 1], d = t[u + 2], x = t[u + 3], C = t[u + 4], Q = n === 0 ? E : y, p = n === 0 ? x : C;
    let k = !1;
    l && (s = Math.sqrt(Math.pow(E - x, 2) + Math.pow(y - C, 2))), Q < A ? p > A && (g = h(a, E, y, x, C, A), l && (a.start = o + s * g)) : Q > i ? p < i && (g = h(a, E, y, x, C, i), l && (a.start = o + s * g)) : XA(a, E, y, d), p < A && Q >= A && (g = h(a, E, y, x, C, A), k = !0), p > i && Q <= i && (g = h(a, E, y, x, C, i), k = !0), !r && k && (l && (a.end = o + s * g), e.push(a), a = Ai(t)), l && (o += s);
  }
  let I = t.length - 3;
  const c = t[I], f = t[I + 1], w = t[I + 2], B = n === 0 ? c : f;
  B >= A && B <= i && XA(a, c, f, w), I = a.length - 3, r && I >= 3 && (a[I] !== a[0] || a[I + 1] !== a[1]) && XA(a, a[0], a[1], a[2]), a.length && e.push(a);
}
function Ai(t) {
  const e = [];
  return e.size = t.size, e.start = t.start, e.end = t.end, e;
}
function Ve(t, e, A, i, n, r) {
  for (const l of t)
    In(l, e, A, i, n, r, !1);
}
function XA(t, e, A, i) {
  t.push(e, A, i);
}
function Ps(t, e, A, i, n, r) {
  const l = (r - e) / (i - e);
  return XA(t, r, A + (n - A) * l, 1), l;
}
function Js(t, e, A, i, n, r) {
  const l = (r - A) / (n - A);
  return XA(t, e + (i - e) * l, r, 1), l;
}
function Vs(t, e) {
  const A = e.buffer / e.extent;
  let i = t;
  const n = kA(t, 1, -1 - A, A, 0, -1, 2, e), r = kA(t, 1, 1 - A, 2 + A, 0, -1, 2, e);
  return (n || r) && (i = kA(t, 1, -A, 1 + A, 0, -1, 2, e) || [], n && (i = ei(n, 1).concat(i)), r && (i = i.concat(ei(r, -1)))), i;
}
function ei(t, e) {
  const A = [];
  for (let i = 0; i < t.length; i++) {
    const n = t[i], r = n.type;
    let l;
    if (r === "Point" || r === "MultiPoint" || r === "LineString")
      l = He(n.geometry, e);
    else if (r === "MultiLineString" || r === "Polygon") {
      l = [];
      for (const a of n.geometry)
        l.push(He(a, e));
    } else if (r === "MultiPolygon") {
      l = [];
      for (const a of n.geometry) {
        const h = [];
        for (const o of a)
          h.push(He(o, e));
        l.push(h);
      }
    }
    A.push(le(n.id, r, l, n.tags));
  }
  return A;
}
function He(t, e) {
  const A = [];
  A.size = t.size, t.start !== void 0 && (A.start = t.start, A.end = t.end);
  for (let i = 0; i < t.length; i += 3)
    A.push(t[i] + e, t[i + 1], t[i + 2]);
  return A;
}
function ti(t, e) {
  if (t.transformed) return t;
  const A = 1 << t.z, i = t.x, n = t.y;
  for (const r of t.features) {
    const l = r.geometry, a = r.type;
    if (r.geometry = [], a === 1)
      for (let h = 0; h < l.length; h += 2)
        r.geometry.push(ii(l[h], l[h + 1], e, A, i, n));
    else
      for (let h = 0; h < l.length; h++) {
        const o = [];
        for (let s = 0; s < l[h].length; s += 2)
          o.push(ii(l[h][s], l[h][s + 1], e, A, i, n));
        r.geometry.push(o);
      }
  }
  return t.transformed = !0, t;
}
function ii(t, e, A, i, n, r) {
  return [
    Math.round(A * (t * i - n)),
    Math.round(A * (e * i - r))
  ];
}
function Hs(t, e, A, i, n) {
  const r = e === n.maxZoom ? 0 : n.tolerance / ((1 << e) * n.extent), l = {
    features: [],
    numPoints: 0,
    numSimplified: 0,
    numFeatures: t.length,
    source: null,
    x: A,
    y: i,
    z: e,
    transformed: !1,
    minX: 2,
    minY: 1,
    maxX: -1,
    maxY: 0
  };
  for (const a of t)
    Ks(l, a, r, n);
  return l;
}
function Ks(t, e, A, i) {
  const n = e.geometry, r = e.type, l = [];
  if (t.minX = Math.min(t.minX, e.minX), t.minY = Math.min(t.minY, e.minY), t.maxX = Math.max(t.maxX, e.maxX), t.maxY = Math.max(t.maxY, e.maxY), r === "Point" || r === "MultiPoint")
    for (let a = 0; a < n.length; a += 3)
      l.push(n[a], n[a + 1]), t.numPoints++, t.numSimplified++;
  else if (r === "LineString")
    Ke(l, n, t, A, !1, !1);
  else if (r === "MultiLineString" || r === "Polygon")
    for (let a = 0; a < n.length; a++)
      Ke(l, n[a], t, A, r === "Polygon", a === 0);
  else if (r === "MultiPolygon")
    for (let a = 0; a < n.length; a++) {
      const h = n[a];
      for (let o = 0; o < h.length; o++)
        Ke(l, h[o], t, A, !0, o === 0);
    }
  if (l.length) {
    let a = e.tags || null;
    if (r === "LineString" && i.lineMetrics) {
      a = {};
      for (const o in e.tags) a[o] = e.tags[o];
      a.mapbox_clip_start = n.start / n.size, a.mapbox_clip_end = n.end / n.size;
    }
    const h = {
      geometry: l,
      type: r === "Polygon" || r === "MultiPolygon" ? 3 : r === "LineString" || r === "MultiLineString" ? 2 : 1,
      tags: a
    };
    e.id !== null && (h.id = e.id), t.features.push(h);
  }
}
function Ke(t, e, A, i, n, r) {
  const l = i * i;
  if (i > 0 && e.size < (n ? l : i)) {
    A.numPoints += e.length / 3;
    return;
  }
  const a = [];
  for (let h = 0; h < e.length; h += 3)
    (i === 0 || e[h + 2] > l) && (A.numSimplified++, a.push(e[h], e[h + 1])), A.numPoints++;
  n && js(a, r), t.push(a);
}
function js(t, e) {
  let A = 0;
  for (let i = 0, n = t.length, r = n - 2; i < n; r = i, i += 2)
    A += (t[i] - t[r]) * (t[i + 1] + t[r + 1]);
  if (A > 0 === e)
    for (let i = 0, n = t.length; i < n / 2; i += 2) {
      const r = t[i], l = t[i + 1];
      t[i] = t[n - 2 - i], t[i + 1] = t[n - 1 - i], t[n - 2 - i] = r, t[n - 1 - i] = l;
    }
}
const Xs = {
  maxZoom: 14,
  // max zoom to preserve detail on
  indexMaxZoom: 5,
  // max zoom in the tile index
  indexMaxPoints: 1e5,
  // max number of points per tile in the tile index
  tolerance: 3,
  // simplification tolerance (higher means simpler)
  extent: 4096,
  // tile extent
  buffer: 64,
  // tile buffer on each side
  lineMetrics: !1,
  // whether to calculate line metrics
  promoteId: null,
  // name of a feature property to be promoted to feature.id
  generateId: !1,
  // whether to generate feature ids. Cannot be used with promoteId
  debug: 0
  // logging level (0, 1 or 2)
};
class Zs {
  constructor(e, A) {
    A = this.options = zs(Object.create(Xs), A);
    const i = A.debug;
    if (i && console.time("preprocess data"), A.maxZoom < 0 || A.maxZoom > 24) throw new Error("maxZoom should be in the 0-24 range");
    if (A.promoteId && A.generateId) throw new Error("promoteId and generateId cannot be used together.");
    let n = Ys(e, A);
    this.tiles = {}, this.tileCoords = [], i && (console.timeEnd("preprocess data"), console.log("index: maxZoom: %d, maxPoints: %d", A.indexMaxZoom, A.indexMaxPoints), console.time("generate tiles"), this.stats = {}, this.total = 0), n = Vs(n, A), n.length && this.splitTile(n, 0, 0, 0), i && (n.length && console.log("features: %d, points: %d", this.tiles[0].numFeatures, this.tiles[0].numPoints), console.timeEnd("generate tiles"), console.log("tiles generated:", this.total, JSON.stringify(this.stats)));
  }
  // splits features from a parent tile to sub-tiles.
  // z, x, and y are the coordinates of the parent tile
  // cz, cx, and cy are the coordinates of the target tile
  //
  // If no target tile is specified, splitting stops when we reach the maximum
  // zoom or the number of points is low as specified in the options.
  splitTile(e, A, i, n, r, l, a) {
    const h = [e, A, i, n], o = this.options, s = o.debug;
    for (; h.length; ) {
      n = h.pop(), i = h.pop(), A = h.pop(), e = h.pop();
      const g = 1 << A, I = je(A, i, n);
      let c = this.tiles[I];
      if (!c && (s > 1 && console.time("creation"), c = this.tiles[I] = Hs(e, A, i, n, o), this.tileCoords.push({ z: A, x: i, y: n }), s)) {
        s > 1 && (console.log(
          "tile z%d-%d-%d (features: %d, points: %d, simplified: %d)",
          A,
          i,
          n,
          c.numFeatures,
          c.numPoints,
          c.numSimplified
        ), console.timeEnd("creation"));
        const p = `z${A}`;
        this.stats[p] = (this.stats[p] || 0) + 1, this.total++;
      }
      if (c.source = e, r == null) {
        if (A === o.indexMaxZoom || c.numPoints <= o.indexMaxPoints) continue;
      } else {
        if (A === o.maxZoom || A === r)
          continue;
        if (r != null) {
          const p = r - A;
          if (i !== l >> p || n !== a >> p) continue;
        }
      }
      if (c.source = null, e.length === 0) continue;
      s > 1 && console.time("clipping");
      const f = 0.5 * o.buffer / o.extent, w = 0.5 - f, B = 0.5 + f, u = 1 + f;
      let E = null, y = null, d = null, x = null, C = kA(e, g, i - f, i + B, 0, c.minX, c.maxX, o), Q = kA(e, g, i + w, i + u, 0, c.minX, c.maxX, o);
      e = null, C && (E = kA(C, g, n - f, n + B, 1, c.minY, c.maxY, o), y = kA(C, g, n + w, n + u, 1, c.minY, c.maxY, o), C = null), Q && (d = kA(Q, g, n - f, n + B, 1, c.minY, c.maxY, o), x = kA(Q, g, n + w, n + u, 1, c.minY, c.maxY, o), Q = null), s > 1 && console.timeEnd("clipping"), h.push(E || [], A + 1, i * 2, n * 2), h.push(y || [], A + 1, i * 2, n * 2 + 1), h.push(d || [], A + 1, i * 2 + 1, n * 2), h.push(x || [], A + 1, i * 2 + 1, n * 2 + 1);
    }
  }
  getTile(e, A, i) {
    e = +e, A = +A, i = +i;
    const n = this.options, { extent: r, debug: l } = n;
    if (e < 0 || e > 24) return null;
    const a = 1 << e;
    A = A + a & a - 1;
    const h = je(e, A, i);
    if (this.tiles[h]) return ti(this.tiles[h], r);
    l > 1 && console.log("drilling down to z%d-%d-%d", e, A, i);
    let o = e, s = A, g = i, I;
    for (; !I && o > 0; )
      o--, s = s >> 1, g = g >> 1, I = this.tiles[je(o, s, g)];
    return !I || !I.source ? null : (l > 1 && (console.log("found parent tile z%d-%d-%d", o, s, g), console.time("drilling down")), this.splitTile(I.source, o, s, g, e, A, i), l > 1 && console.timeEnd("drilling down"), this.tiles[h] ? ti(this.tiles[h], r) : null);
  }
}
function je(t, e, A) {
  return ((1 << t) * A + e) * 32 + t;
}
function zs(t, e) {
  for (const A in e) t[A] = e[A];
  return t;
}
function Ws(t, e) {
  return new Zs(t, e);
}
class Yl extends Pi {
  /**
   * 构造函数
   */
  constructor() {
    super();
    // 加载器信息
    D(this, "info", {
      version: "0.10.0",
      author: "GuoJF",
      description: "GeoJSON 加载器"
    });
    /** 数据类型标识 */
    D(this, "dataType", "geojson");
    /** 文件加载器 */
    D(this, "_loader", new yt(ve.manager));
    /** 瓦片渲染器 */
    D(this, "_render", new Ji());
    this._loader.setResponseType("json");
  }
  /**
   * 异步加载瓦片纹理,该方法在瓦片创建后被调用
   *
   * @param url GeoJSON的URL地址
   * @param params 加载参数，包括数据源、瓦片坐标等
   * @returns 瓦片纹理
   */
  async doLoad(A, i) {
    const { x: n, y: r, z: l, source: a } = i, h = ("style" in a, a.style);
    return a.gv ? this._getTileTexture(a.gv, n, r, l, h) : (a.loading || (a.loading = !0, a.gv = await this.loadJSON(A), a.loading = !1), await (async () => {
      for (; !a.gv; )
        await new Promise((o) => setTimeout(o, 100));
    })(), console.assert(a.gv), this._getTileTexture(a.gv, n, r, l, h));
  }
  /**
   * 异步加载 JSON 文件，创建 geojson-vt 实例返回。
   *
   * @param url JSON 文件的 URL 地址
   * @returns 返回 geojsonvt 实例
   */
  async loadJSON(A) {
    console.log("load geoJSON", A);
    const i = await this._loader.loadAsync(A).catch((r) => {
      console.error("GeoJSON load error: ", A, r.message);
    });
    return Ws(i, {
      tolerance: 2,
      // buffer: 10,
      extent: 256,
      maxZoom: 20,
      indexMaxZoom: 4
    });
  }
  drawTile(A, i) {
    const l = new OffscreenCanvas(256, 256), a = l.getContext("2d");
    if (a) {
      a.scale(1, -1), a.translate(0, -256), a.save();
      const h = A.features;
      for (let o = 0; o < h.length; o++)
        this._renderFeature(a, h[o], i);
      a.restore();
    }
    return l.transferToImageBitmap();
  }
  // 渲染单个要素
  _renderFeature(A, i, n = {}) {
    const r = [
      GA.Unknown,
      GA.Point,
      GA.Linestring,
      GA.Polygon
    ][i.type], l = {
      geometry: [],
      properties: {}
    };
    for (let a = 0; a < i.geometry.length; a++) {
      let h;
      Array.isArray(i.geometry[a][0]) ? h = i.geometry[a].map((o) => ({ x: o[0], y: o[1] })) : h = [{ x: i.geometry[a][0], y: i.geometry[a][1] }], l.geometry.push(h);
    }
    l.properties = i.tags, this._render.render(A, r, l, n);
  }
  /**
   * 根据给定的坐标和样式绘制瓦片纹理
   *
   * @param gv 地图视图对象
   * @param x 瓦片的 x 坐标
   * @param y 瓦片的 y 坐标
   * @param z 瓦片的层级
   * @param style 可选的 GeoJSON 样式类型
   * @returns 返回瓦片的纹理对象，如果瓦片不存在则返回空纹理对象
   */
  _getTileTexture(A, i, n, r, l) {
    const a = A.getTile(r, i, n);
    if (!a)
      return new wt(new Image());
    const h = this.drawTile(a, l);
    return new Yi(h);
  }
}
class ql extends AA {
  constructor(A) {
    super(A);
    D(this, "dataType", "geojson");
    D(this, "style", {});
    Object.assign(this, A);
  }
}
function RA(t, e) {
  this.x = t, this.y = e;
}
RA.prototype = {
  /**
   * Clone this point, returning a new point that can be modified
   * without affecting the old one.
   * @return {Point} the clone
   */
  clone() {
    return new RA(this.x, this.y);
  },
  /**
   * Add this point's x & y coordinates to another point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  add(t) {
    return this.clone()._add(t);
  },
  /**
   * Subtract this point's x & y coordinates to from point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  sub(t) {
    return this.clone()._sub(t);
  },
  /**
   * Multiply this point's x & y coordinates by point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  multByPoint(t) {
    return this.clone()._multByPoint(t);
  },
  /**
   * Divide this point's x & y coordinates by point,
   * yielding a new point.
   * @param {Point} p the other point
   * @return {Point} output point
   */
  divByPoint(t) {
    return this.clone()._divByPoint(t);
  },
  /**
   * Multiply this point's x & y coordinates by a factor,
   * yielding a new point.
   * @param {number} k factor
   * @return {Point} output point
   */
  mult(t) {
    return this.clone()._mult(t);
  },
  /**
   * Divide this point's x & y coordinates by a factor,
   * yielding a new point.
   * @param {number} k factor
   * @return {Point} output point
   */
  div(t) {
    return this.clone()._div(t);
  },
  /**
   * Rotate this point around the 0, 0 origin by an angle a,
   * given in radians
   * @param {number} a angle to rotate around, in radians
   * @return {Point} output point
   */
  rotate(t) {
    return this.clone()._rotate(t);
  },
  /**
   * Rotate this point around p point by an angle a,
   * given in radians
   * @param {number} a angle to rotate around, in radians
   * @param {Point} p Point to rotate around
   * @return {Point} output point
   */
  rotateAround(t, e) {
    return this.clone()._rotateAround(t, e);
  },
  /**
   * Multiply this point by a 4x1 transformation matrix
   * @param {[number, number, number, number]} m transformation matrix
   * @return {Point} output point
   */
  matMult(t) {
    return this.clone()._matMult(t);
  },
  /**
   * Calculate this point but as a unit vector from 0, 0, meaning
   * that the distance from the resulting point to the 0, 0
   * coordinate will be equal to 1 and the angle from the resulting
   * point to the 0, 0 coordinate will be the same as before.
   * @return {Point} unit vector point
   */
  unit() {
    return this.clone()._unit();
  },
  /**
   * Compute a perpendicular point, where the new y coordinate
   * is the old x coordinate and the new x coordinate is the old y
   * coordinate multiplied by -1
   * @return {Point} perpendicular point
   */
  perp() {
    return this.clone()._perp();
  },
  /**
   * Return a version of this point with the x & y coordinates
   * rounded to integers.
   * @return {Point} rounded point
   */
  round() {
    return this.clone()._round();
  },
  /**
   * Return the magnitude of this point: this is the Euclidean
   * distance from the 0, 0 coordinate to this point's x and y
   * coordinates.
   * @return {number} magnitude
   */
  mag() {
    return Math.sqrt(this.x * this.x + this.y * this.y);
  },
  /**
   * Judge whether this point is equal to another point, returning
   * true or false.
   * @param {Point} other the other point
   * @return {boolean} whether the points are equal
   */
  equals(t) {
    return this.x === t.x && this.y === t.y;
  },
  /**
   * Calculate the distance from this point to another point
   * @param {Point} p the other point
   * @return {number} distance
   */
  dist(t) {
    return Math.sqrt(this.distSqr(t));
  },
  /**
   * Calculate the distance from this point to another point,
   * without the square root step. Useful if you're comparing
   * relative distances.
   * @param {Point} p the other point
   * @return {number} distance
   */
  distSqr(t) {
    const e = t.x - this.x, A = t.y - this.y;
    return e * e + A * A;
  },
  /**
   * Get the angle from the 0, 0 coordinate to this point, in radians
   * coordinates.
   * @return {number} angle
   */
  angle() {
    return Math.atan2(this.y, this.x);
  },
  /**
   * Get the angle from this point to another point, in radians
   * @param {Point} b the other point
   * @return {number} angle
   */
  angleTo(t) {
    return Math.atan2(this.y - t.y, this.x - t.x);
  },
  /**
   * Get the angle between this point and another point, in radians
   * @param {Point} b the other point
   * @return {number} angle
   */
  angleWith(t) {
    return this.angleWithSep(t.x, t.y);
  },
  /**
   * Find the angle of the two vectors, solving the formula for
   * the cross product a x b = |a||b|sin(θ) for θ.
   * @param {number} x the x-coordinate
   * @param {number} y the y-coordinate
   * @return {number} the angle in radians
   */
  angleWithSep(t, e) {
    return Math.atan2(
      this.x * e - this.y * t,
      this.x * t + this.y * e
    );
  },
  /** @param {[number, number, number, number]} m */
  _matMult(t) {
    const e = t[0] * this.x + t[1] * this.y, A = t[2] * this.x + t[3] * this.y;
    return this.x = e, this.y = A, this;
  },
  /** @param {Point} p */
  _add(t) {
    return this.x += t.x, this.y += t.y, this;
  },
  /** @param {Point} p */
  _sub(t) {
    return this.x -= t.x, this.y -= t.y, this;
  },
  /** @param {number} k */
  _mult(t) {
    return this.x *= t, this.y *= t, this;
  },
  /** @param {number} k */
  _div(t) {
    return this.x /= t, this.y /= t, this;
  },
  /** @param {Point} p */
  _multByPoint(t) {
    return this.x *= t.x, this.y *= t.y, this;
  },
  /** @param {Point} p */
  _divByPoint(t) {
    return this.x /= t.x, this.y /= t.y, this;
  },
  _unit() {
    return this._div(this.mag()), this;
  },
  _perp() {
    const t = this.y;
    return this.y = this.x, this.x = -t, this;
  },
  /** @param {number} angle */
  _rotate(t) {
    const e = Math.cos(t), A = Math.sin(t), i = e * this.x - A * this.y, n = A * this.x + e * this.y;
    return this.x = i, this.y = n, this;
  },
  /**
   * @param {number} angle
   * @param {Point} p
   */
  _rotateAround(t, e) {
    const A = Math.cos(t), i = Math.sin(t), n = e.x + A * (this.x - e.x) - i * (this.y - e.y), r = e.y + i * (this.x - e.x) + A * (this.y - e.y);
    return this.x = n, this.y = r, this;
  },
  _round() {
    return this.x = Math.round(this.x), this.y = Math.round(this.y), this;
  },
  constructor: RA
};
RA.convert = function(t) {
  if (t instanceof RA)
    return (
      /** @type {Point} */
      t
    );
  if (Array.isArray(t))
    return new RA(+t[0], +t[1]);
  if (t.x !== void 0 && t.y !== void 0)
    return new RA(+t.x, +t.y);
  throw new Error("Expected [x, y] or {x, y} point format");
};
class Bn {
  /**
   * @param {Pbf} pbf
   * @param {number} end
   * @param {number} extent
   * @param {string[]} keys
   * @param {unknown[]} values
   */
  constructor(e, A, i, n, r) {
    this.properties = {}, this.extent = i, this.type = 0, this.id = void 0, this._pbf = e, this._geometry = -1, this._keys = n, this._values = r, e.readFields($s, this, A);
  }
  loadGeometry() {
    const e = this._pbf;
    e.pos = this._geometry;
    const A = e.readVarint() + e.pos, i = [];
    let n, r = 1, l = 0, a = 0, h = 0;
    for (; e.pos < A; ) {
      if (l <= 0) {
        const o = e.readVarint();
        r = o & 7, l = o >> 3;
      }
      if (l--, r === 1 || r === 2)
        a += e.readSVarint(), h += e.readSVarint(), r === 1 && (n && i.push(n), n = []), n && n.push(new RA(a, h));
      else if (r === 7)
        n && n.push(n[0].clone());
      else
        throw new Error(`unknown command ${r}`);
    }
    return n && i.push(n), i;
  }
  bbox() {
    const e = this._pbf;
    e.pos = this._geometry;
    const A = e.readVarint() + e.pos;
    let i = 1, n = 0, r = 0, l = 0, a = 1 / 0, h = -1 / 0, o = 1 / 0, s = -1 / 0;
    for (; e.pos < A; ) {
      if (n <= 0) {
        const g = e.readVarint();
        i = g & 7, n = g >> 3;
      }
      if (n--, i === 1 || i === 2)
        r += e.readSVarint(), l += e.readSVarint(), r < a && (a = r), r > h && (h = r), l < o && (o = l), l > s && (s = l);
      else if (i !== 7)
        throw new Error(`unknown command ${i}`);
    }
    return [a, o, h, s];
  }
  /**
   * @param {number} x
   * @param {number} y
   * @param {number} z
   * @return {Feature}
   */
  toGeoJSON(e, A, i) {
    const n = this.extent * Math.pow(2, i), r = this.extent * e, l = this.extent * A, a = this.loadGeometry();
    function h(I) {
      return [
        (I.x + r) * 360 / n - 180,
        360 / Math.PI * Math.atan(Math.exp((1 - (I.y + l) * 2 / n) * Math.PI)) - 90
      ];
    }
    function o(I) {
      return I.map(h);
    }
    let s;
    if (this.type === 1) {
      const I = [];
      for (const f of a)
        I.push(f[0]);
      const c = o(I);
      s = I.length === 1 ? { type: "Point", coordinates: c[0] } : { type: "MultiPoint", coordinates: c };
    } else if (this.type === 2) {
      const I = a.map(o);
      s = I.length === 1 ? { type: "LineString", coordinates: I[0] } : { type: "MultiLineString", coordinates: I };
    } else if (this.type === 3) {
      const I = eo(a), c = [];
      for (const f of I)
        c.push(f.map(o));
      s = c.length === 1 ? { type: "Polygon", coordinates: c[0] } : { type: "MultiPolygon", coordinates: c };
    } else
      throw new Error("unknown feature type");
    const g = {
      type: "Feature",
      geometry: s,
      properties: this.properties
    };
    return this.id != null && (g.id = this.id), g;
  }
}
Bn.types = ["Unknown", "Point", "LineString", "Polygon"];
function $s(t, e, A) {
  t === 1 ? e.id = A.readVarint() : t === 2 ? Ao(A, e) : t === 3 ? e.type = /** @type {0 | 1 | 2 | 3} */
  A.readVarint() : t === 4 && (e._geometry = A.pos);
}
function Ao(t, e) {
  const A = t.readVarint() + t.pos;
  for (; t.pos < A; ) {
    const i = e._keys[t.readVarint()], n = e._values[t.readVarint()];
    e.properties[i] = n;
  }
}
function eo(t) {
  const e = t.length;
  if (e <= 1) return [t];
  const A = [];
  let i, n;
  for (let r = 0; r < e; r++) {
    const l = to(t[r]);
    l !== 0 && (n === void 0 && (n = l < 0), n === l < 0 ? (i && A.push(i), i = [t[r]]) : i && i.push(t[r]));
  }
  return i && A.push(i), A;
}
function to(t) {
  let e = 0;
  for (let A = 0, i = t.length, n = i - 1, r, l; A < i; n = A++)
    r = t[A], l = t[n], e += (l.x - r.x) * (r.y + l.y);
  return e;
}
class io {
  /**
   * @param {Pbf} pbf
   * @param {number} [end]
   */
  constructor(e, A) {
    this.version = 1, this.name = "", this.extent = 4096, this.length = 0, this._pbf = e, this._keys = [], this._values = [], this._features = [], e.readFields(no, this, A), this.length = this._features.length;
  }
  /** return feature `i` from this layer as a `VectorTileFeature`
   * @param {number} i
   */
  feature(e) {
    if (e < 0 || e >= this._features.length) throw new Error("feature index out of bounds");
    this._pbf.pos = this._features[e];
    const A = this._pbf.readVarint() + this._pbf.pos;
    return new Bn(this._pbf, A, this.extent, this._keys, this._values);
  }
}
function no(t, e, A) {
  t === 15 ? e.version = A.readVarint() : t === 1 ? e.name = A.readString() : t === 5 ? e.extent = A.readVarint() : t === 2 ? e._features.push(A.pos) : t === 3 ? e._keys.push(A.readString()) : t === 4 && e._values.push(ro(A));
}
function ro(t) {
  let e = null;
  const A = t.readVarint() + t.pos;
  for (; t.pos < A; ) {
    const i = t.readVarint() >> 3;
    e = i === 1 ? t.readString() : i === 2 ? t.readFloat() : i === 3 ? t.readDouble() : i === 4 ? t.readVarint64() : i === 5 ? t.readVarint() : i === 6 ? t.readSVarint() : i === 7 ? t.readBoolean() : null;
  }
  return e;
}
class so {
  /**
   * @param {Pbf} pbf
   * @param {number} [end]
   */
  constructor(e, A) {
    this.layers = e.readFields(oo, {}, A);
  }
}
function oo(t, e, A) {
  if (t === 3) {
    const i = new io(A, A.readVarint() + A.pos);
    i.length && (e[i.name] = i);
  }
}
const It = 65536 * 65536, ni = 1 / It, ao = 12, ri = typeof TextDecoder > "u" ? null : new TextDecoder("utf-8"), Xe = 0, Ee = 1, ee = 2, de = 5;
class lo {
  /**
   * @param {Uint8Array | ArrayBuffer} [buf]
   */
  constructor(e = new Uint8Array(16)) {
    this.buf = ArrayBuffer.isView(e) ? e : new Uint8Array(e), this.dataView = new DataView(this.buf.buffer), this.pos = 0, this.type = 0, this.length = this.buf.length;
  }
  // === READING =================================================================
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: Pbf) => void} readField
   * @param {T} result
   * @param {number} [end]
   */
  readFields(e, A, i = this.length) {
    for (; this.pos < i; ) {
      const n = this.readVarint(), r = n >> 3, l = this.pos;
      this.type = n & 7, e(r, A, this), this.pos === l && this.skip(n);
    }
    return A;
  }
  /**
   * @template T
   * @param {(tag: number, result: T, pbf: Pbf) => void} readField
   * @param {T} result
   */
  readMessage(e, A) {
    return this.readFields(e, A, this.readVarint() + this.pos);
  }
  readFixed32() {
    const e = this.dataView.getUint32(this.pos, !0);
    return this.pos += 4, e;
  }
  readSFixed32() {
    const e = this.dataView.getInt32(this.pos, !0);
    return this.pos += 4, e;
  }
  // 64-bit int handling is based on github.com/dpw/node-buffer-more-ints (MIT-licensed)
  readFixed64() {
    const e = this.dataView.getUint32(this.pos, !0) + this.dataView.getUint32(this.pos + 4, !0) * It;
    return this.pos += 8, e;
  }
  readSFixed64() {
    const e = this.dataView.getUint32(this.pos, !0) + this.dataView.getInt32(this.pos + 4, !0) * It;
    return this.pos += 8, e;
  }
  readFloat() {
    const e = this.dataView.getFloat32(this.pos, !0);
    return this.pos += 4, e;
  }
  readDouble() {
    const e = this.dataView.getFloat64(this.pos, !0);
    return this.pos += 8, e;
  }
  /**
   * @param {boolean} [isSigned]
   */
  readVarint(e) {
    const A = this.buf;
    let i, n;
    return n = A[this.pos++], i = n & 127, n < 128 || (n = A[this.pos++], i |= (n & 127) << 7, n < 128) || (n = A[this.pos++], i |= (n & 127) << 14, n < 128) || (n = A[this.pos++], i |= (n & 127) << 21, n < 128) ? i : (n = A[this.pos], i |= (n & 15) << 28, go(i, e, this));
  }
  readVarint64() {
    return this.readVarint(!0);
  }
  readSVarint() {
    const e = this.readVarint();
    return e % 2 === 1 ? (e + 1) / -2 : e / 2;
  }
  readBoolean() {
    return !!this.readVarint();
  }
  readString() {
    const e = this.readVarint() + this.pos, A = this.pos;
    return this.pos = e, e - A >= ao && ri ? ri.decode(this.buf.subarray(A, e)) : xo(this.buf, A, e);
  }
  readBytes() {
    const e = this.readVarint() + this.pos, A = this.buf.subarray(this.pos, e);
    return this.pos = e, A;
  }
  // verbose for performance reasons; doesn't affect gzipped size
  /**
   * @param {number[]} [arr]
   * @param {boolean} [isSigned]
   */
  readPackedVarint(e = [], A) {
    const i = this.readPackedEnd();
    for (; this.pos < i; ) e.push(this.readVarint(A));
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedSVarint(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readSVarint());
    return e;
  }
  /** @param {boolean[]} [arr] */
  readPackedBoolean(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readBoolean());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedFloat(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readFloat());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedDouble(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readDouble());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedFixed32(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readFixed32());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed32(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readSFixed32());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedFixed64(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readFixed64());
    return e;
  }
  /** @param {number[]} [arr] */
  readPackedSFixed64(e = []) {
    const A = this.readPackedEnd();
    for (; this.pos < A; ) e.push(this.readSFixed64());
    return e;
  }
  readPackedEnd() {
    return this.type === ee ? this.readVarint() + this.pos : this.pos + 1;
  }
  /** @param {number} val */
  skip(e) {
    const A = e & 7;
    if (A === Xe) for (; this.buf[this.pos++] > 127; )
      ;
    else if (A === ee) this.pos = this.readVarint() + this.pos;
    else if (A === de) this.pos += 4;
    else if (A === Ee) this.pos += 8;
    else throw new Error(`Unimplemented type: ${A}`);
  }
  // === WRITING =================================================================
  /**
   * @param {number} tag
   * @param {number} type
   */
  writeTag(e, A) {
    this.writeVarint(e << 3 | A);
  }
  /** @param {number} min */
  realloc(e) {
    let A = this.length || 16;
    for (; A < this.pos + e; ) A *= 2;
    if (A !== this.length) {
      const i = new Uint8Array(A);
      i.set(this.buf), this.buf = i, this.dataView = new DataView(i.buffer), this.length = A;
    }
  }
  finish() {
    return this.length = this.pos, this.pos = 0, this.buf.subarray(0, this.length);
  }
  /** @param {number} val */
  writeFixed32(e) {
    this.realloc(4), this.dataView.setInt32(this.pos, e, !0), this.pos += 4;
  }
  /** @param {number} val */
  writeSFixed32(e) {
    this.realloc(4), this.dataView.setInt32(this.pos, e, !0), this.pos += 4;
  }
  /** @param {number} val */
  writeFixed64(e) {
    this.realloc(8), this.dataView.setInt32(this.pos, e & -1, !0), this.dataView.setInt32(this.pos + 4, Math.floor(e * ni), !0), this.pos += 8;
  }
  /** @param {number} val */
  writeSFixed64(e) {
    this.realloc(8), this.dataView.setInt32(this.pos, e & -1, !0), this.dataView.setInt32(this.pos + 4, Math.floor(e * ni), !0), this.pos += 8;
  }
  /** @param {number} val */
  writeVarint(e) {
    if (e = +e || 0, e > 268435455 || e < 0) {
      co(e, this);
      return;
    }
    this.realloc(4), this.buf[this.pos++] = e & 127 | (e > 127 ? 128 : 0), !(e <= 127) && (this.buf[this.pos++] = (e >>>= 7) & 127 | (e > 127 ? 128 : 0), !(e <= 127) && (this.buf[this.pos++] = (e >>>= 7) & 127 | (e > 127 ? 128 : 0), !(e <= 127) && (this.buf[this.pos++] = e >>> 7 & 127)));
  }
  /** @param {number} val */
  writeSVarint(e) {
    this.writeVarint(e < 0 ? -e * 2 - 1 : e * 2);
  }
  /** @param {boolean} val */
  writeBoolean(e) {
    this.writeVarint(+e);
  }
  /** @param {string} str */
  writeString(e) {
    e = String(e), this.realloc(e.length * 4), this.pos++;
    const A = this.pos;
    this.pos = mo(this.buf, e, this.pos);
    const i = this.pos - A;
    i >= 128 && si(A, i, this), this.pos = A - 1, this.writeVarint(i), this.pos += i;
  }
  /** @param {number} val */
  writeFloat(e) {
    this.realloc(4), this.dataView.setFloat32(this.pos, e, !0), this.pos += 4;
  }
  /** @param {number} val */
  writeDouble(e) {
    this.realloc(8), this.dataView.setFloat64(this.pos, e, !0), this.pos += 8;
  }
  /** @param {Uint8Array} buffer */
  writeBytes(e) {
    const A = e.length;
    this.writeVarint(A), this.realloc(A);
    for (let i = 0; i < A; i++) this.buf[this.pos++] = e[i];
  }
  /**
   * @template T
   * @param {(obj: T, pbf: Pbf) => void} fn
   * @param {T} obj
   */
  writeRawMessage(e, A) {
    this.pos++;
    const i = this.pos;
    e(A, this);
    const n = this.pos - i;
    n >= 128 && si(i, n, this), this.pos = i - 1, this.writeVarint(n), this.pos += n;
  }
  /**
   * @template T
   * @param {number} tag
   * @param {(obj: T, pbf: Pbf) => void} fn
   * @param {T} obj
   */
  writeMessage(e, A, i) {
    this.writeTag(e, ee), this.writeRawMessage(A, i);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedVarint(e, A) {
    A.length && this.writeMessage(e, Io, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSVarint(e, A) {
    A.length && this.writeMessage(e, Bo, A);
  }
  /**
   * @param {number} tag
   * @param {boolean[]} arr
   */
  writePackedBoolean(e, A) {
    A.length && this.writeMessage(e, Eo, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFloat(e, A) {
    A.length && this.writeMessage(e, uo, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedDouble(e, A) {
    A.length && this.writeMessage(e, Co, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFixed32(e, A) {
    A.length && this.writeMessage(e, Qo, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSFixed32(e, A) {
    A.length && this.writeMessage(e, wo, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedFixed64(e, A) {
    A.length && this.writeMessage(e, yo, A);
  }
  /**
   * @param {number} tag
   * @param {number[]} arr
   */
  writePackedSFixed64(e, A) {
    A.length && this.writeMessage(e, po, A);
  }
  /**
   * @param {number} tag
   * @param {Uint8Array} buffer
   */
  writeBytesField(e, A) {
    this.writeTag(e, ee), this.writeBytes(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFixed32Field(e, A) {
    this.writeTag(e, de), this.writeFixed32(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSFixed32Field(e, A) {
    this.writeTag(e, de), this.writeSFixed32(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFixed64Field(e, A) {
    this.writeTag(e, Ee), this.writeFixed64(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSFixed64Field(e, A) {
    this.writeTag(e, Ee), this.writeSFixed64(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeVarintField(e, A) {
    this.writeTag(e, Xe), this.writeVarint(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeSVarintField(e, A) {
    this.writeTag(e, Xe), this.writeSVarint(A);
  }
  /**
   * @param {number} tag
   * @param {string} str
   */
  writeStringField(e, A) {
    this.writeTag(e, ee), this.writeString(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeFloatField(e, A) {
    this.writeTag(e, de), this.writeFloat(A);
  }
  /**
   * @param {number} tag
   * @param {number} val
   */
  writeDoubleField(e, A) {
    this.writeTag(e, Ee), this.writeDouble(A);
  }
  /**
   * @param {number} tag
   * @param {boolean} val
   */
  writeBooleanField(e, A) {
    this.writeVarintField(e, +A);
  }
}
function go(t, e, A) {
  const i = A.buf;
  let n, r;
  if (r = i[A.pos++], n = (r & 112) >> 4, r < 128 || (r = i[A.pos++], n |= (r & 127) << 3, r < 128) || (r = i[A.pos++], n |= (r & 127) << 10, r < 128) || (r = i[A.pos++], n |= (r & 127) << 17, r < 128) || (r = i[A.pos++], n |= (r & 127) << 24, r < 128) || (r = i[A.pos++], n |= (r & 1) << 31, r < 128)) return JA(t, n, e);
  throw new Error("Expected varint not more than 10 bytes");
}
function JA(t, e, A) {
  return A ? e * 4294967296 + (t >>> 0) : (e >>> 0) * 4294967296 + (t >>> 0);
}
function co(t, e) {
  let A, i;
  if (t >= 0 ? (A = t % 4294967296 | 0, i = t / 4294967296 | 0) : (A = ~(-t % 4294967296), i = ~(-t / 4294967296), A ^ 4294967295 ? A = A + 1 | 0 : (A = 0, i = i + 1 | 0)), t >= 18446744073709552e3 || t < -18446744073709552e3)
    throw new Error("Given varint doesn't fit into 10 bytes");
  e.realloc(10), fo(A, i, e), ho(i, e);
}
function fo(t, e, A) {
  A.buf[A.pos++] = t & 127 | 128, t >>>= 7, A.buf[A.pos++] = t & 127 | 128, t >>>= 7, A.buf[A.pos++] = t & 127 | 128, t >>>= 7, A.buf[A.pos++] = t & 127 | 128, t >>>= 7, A.buf[A.pos] = t & 127;
}
function ho(t, e) {
  const A = (t & 7) << 4;
  e.buf[e.pos++] |= A | ((t >>>= 3) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127 | ((t >>>= 7) ? 128 : 0), t && (e.buf[e.pos++] = t & 127)))));
}
function si(t, e, A) {
  const i = e <= 16383 ? 1 : e <= 2097151 ? 2 : e <= 268435455 ? 3 : Math.floor(Math.log(e) / (Math.LN2 * 7));
  A.realloc(i);
  for (let n = A.pos - 1; n >= t; n--) A.buf[n + i] = A.buf[n];
}
function Io(t, e) {
  for (let A = 0; A < t.length; A++) e.writeVarint(t[A]);
}
function Bo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeSVarint(t[A]);
}
function uo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeFloat(t[A]);
}
function Co(t, e) {
  for (let A = 0; A < t.length; A++) e.writeDouble(t[A]);
}
function Eo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeBoolean(t[A]);
}
function Qo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeFixed32(t[A]);
}
function wo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeSFixed32(t[A]);
}
function yo(t, e) {
  for (let A = 0; A < t.length; A++) e.writeFixed64(t[A]);
}
function po(t, e) {
  for (let A = 0; A < t.length; A++) e.writeSFixed64(t[A]);
}
function xo(t, e, A) {
  let i = "", n = e;
  for (; n < A; ) {
    const r = t[n];
    let l = null, a = r > 239 ? 4 : r > 223 ? 3 : r > 191 ? 2 : 1;
    if (n + a > A) break;
    let h, o, s;
    a === 1 ? r < 128 && (l = r) : a === 2 ? (h = t[n + 1], (h & 192) === 128 && (l = (r & 31) << 6 | h & 63, l <= 127 && (l = null))) : a === 3 ? (h = t[n + 1], o = t[n + 2], (h & 192) === 128 && (o & 192) === 128 && (l = (r & 15) << 12 | (h & 63) << 6 | o & 63, (l <= 2047 || l >= 55296 && l <= 57343) && (l = null))) : a === 4 && (h = t[n + 1], o = t[n + 2], s = t[n + 3], (h & 192) === 128 && (o & 192) === 128 && (s & 192) === 128 && (l = (r & 15) << 18 | (h & 63) << 12 | (o & 63) << 6 | s & 63, (l <= 65535 || l >= 1114112) && (l = null))), l === null ? (l = 65533, a = 1) : l > 65535 && (l -= 65536, i += String.fromCharCode(l >>> 10 & 1023 | 55296), l = 56320 | l & 1023), i += String.fromCharCode(l), n += a;
  }
  return i;
}
function mo(t, e, A) {
  for (let i = 0, n, r; i < e.length; i++) {
    if (n = e.charCodeAt(i), n > 55295 && n < 57344)
      if (r)
        if (n < 56320) {
          t[A++] = 239, t[A++] = 191, t[A++] = 189, r = n;
          continue;
        } else
          n = r - 55296 << 10 | n - 56320 | 65536, r = null;
      else {
        n > 56319 || i + 1 === e.length ? (t[A++] = 239, t[A++] = 191, t[A++] = 189) : r = n;
        continue;
      }
    else r && (t[A++] = 239, t[A++] = 191, t[A++] = 189, r = null);
    n < 128 ? t[A++] = n : (n < 2048 ? t[A++] = n >> 6 | 192 : (n < 65536 ? t[A++] = n >> 12 | 224 : (t[A++] = n >> 18 | 240, t[A++] = n >> 12 & 63 | 128), t[A++] = n >> 6 & 63 | 128), t[A++] = n & 63 | 128);
  }
  return A;
}
class Pl extends Pi {
  constructor() {
    super();
    D(this, "dataType", "mvt");
    // 加载器信息
    D(this, "info", {
      version: "0.10.0",
      author: "GuoJF",
      description: "MVT瓦片加载器"
    });
    D(this, "_loader", new yt(ve.manager));
    D(this, "_render", new Ji());
    this._loader.setResponseType("arraybuffer");
  }
  async doLoad(A, i) {
    const n = i.source, r = ("style" in n, n.style), l = await this._loader.loadAsync(A).catch(() => new wt()), a = new so(new lo(l)), h = this.drawTile(a, r, i.z);
    return new Yi(h);
  }
  /**
   * 在离屏画布上绘制矢量瓦片
   *
   * @param vectorTile 待绘制的矢量瓦片对象
   * @returns 绘制完成的图像位图
   * @throws 如果画布上下文不可用，则抛出错误
   */
  drawTile(A, i, n) {
    const h = new OffscreenCanvas(256, 256).getContext("2d");
    if (h) {
      if (h.scale(1, -1), h.translate(0, -256), i)
        for (const o in i.layer) {
          const s = i.layer[o];
          if (i && (n < (s.minLevel ?? 1) || n > (s.maxLevel ?? 20)))
            continue;
          const g = A.layers[o];
          if (g) {
            const I = 256 / g.extent;
            this._renderLayer(h, g, s, I);
          }
        }
      else
        for (const o in A.layers) {
          const s = A.layers[o], g = 256 / s.extent;
          this._renderLayer(h, s, void 0, g);
        }
      return h.canvas.transferToImageBitmap();
    } else
      throw new Error("Canvas context is not available");
  }
  _renderLayer(A, i, n, r = 1) {
    A.save();
    for (let l = 0; l < i.length; l++) {
      const a = i.feature(l);
      this._renderFeature(A, a, n, r);
    }
    return A.restore(), this;
  }
  // 渲染单个要素
  _renderFeature(A, i, n = {}, r = 1) {
    const l = [
      GA.Unknown,
      GA.Point,
      GA.Linestring,
      GA.Polygon
    ][i.type], a = {
      geometry: i.loadGeometry(),
      properties: i.properties
    };
    this._render.render(A, l, a, n, r);
  }
}
class Jl extends AA {
  //  "https://demotiles.maplibre.org/style.json";
  constructor(A) {
    super(A);
    D(this, "dataType", "mvt");
    Object.assign(this, A);
  }
}
const Do = "three_cache", wA = "files";
let yA = null;
async function Vl() {
  return yA = await So(), MA.enabled = !0, yA;
}
const So = () => new Promise((t, e) => {
  const A = indexedDB.open(Do, 1);
  A.onupgradeneeded = (i) => {
    const n = i.target.result;
    n.objectStoreNames.contains(wA) || n.createObjectStore(wA, { keyPath: "key" });
  }, A.onsuccess = () => t(A.result), A.onerror = () => e(A.error);
});
MA.add = async function(t, e) {
  if (!MA.enabled || yA === null) return;
  let A = e;
  if (e instanceof HTMLImageElement) {
    const r = document.createElement("canvas");
    r.width = e.naturalWidth, r.height = e.naturalHeight, r.getContext("2d").drawImage(e, 0, 0), A = {
      __type: "HTMLImageElement",
      dataURL: r.toDataURL()
    };
  }
  const n = yA.transaction(wA, "readwrite").objectStore(wA);
  return new Promise((r, l) => {
    const a = n.put({ key: t, file: A });
    a.onsuccess = () => r(), a.onerror = () => l(a.error);
  });
};
MA.get = function(t) {
  if (!MA.enabled || yA === null) return;
  const i = yA.transaction(wA, "readonly").objectStore(wA).get(t);
  let n;
  if (i.onsuccess = () => {
    n = i.result;
  }, i.onerror = (r) => {
    n = void 0, console.error("Error retrieving data:", r);
  }, n?.__type === "HTMLImageElement") {
    const r = new Image();
    return r.src = n.dataURL, r;
  }
  return n;
};
MA.remove = async function(t) {
  if (!MA.enabled || yA === null) return;
  const A = yA.transaction(wA, "readwrite").objectStore(wA);
  return new Promise((i, n) => {
    const r = A.delete(t);
    r.onsuccess = () => i(), r.onerror = () => n(r.error);
  });
};
MA.clear = async function() {
  if (!MA.enabled || yA === null) return;
  const e = yA.transaction(wA, "readwrite").objectStore(wA);
  return new Promise((A, i) => {
    const n = e.clear();
    n.onsuccess = () => A(), n.onerror = () => i(n.error);
  });
};
function Hl(t, e, A) {
  const { currentTarget: i, clientX: n, clientY: r } = t;
  if (i instanceof HTMLElement) {
    const l = i.clientWidth, a = i.clientHeight, h = new fA(n / l * 2 - 1, -(r / a) * 2 + 1);
    return e.getLocalInfoFromScreen(A, h)?.location;
  } else
    return;
}
function Kl(t) {
  const e = /* @__PURE__ */ new Set();
  if ((Array.isArray(t.imgSource) ? t.imgSource : [t.imgSource]).forEach((i) => {
    const n = i.attribution;
    n && e.add(n);
  }), t.demSource) {
    const i = t.demSource.attribution;
    i && e.add(i);
  }
  return Array.from(e);
}
function jl(t, e, A = 100) {
  const i = e.localToWorld(new aA(0, 0, -e.near - 100)), n = t.getLocalInfoFromWorld(i);
  if (n) {
    const r = i.y - n.point.y;
    if (r < A) {
      const l = r < 0 ? -r * 1.1 : r / 10, a = t.localToWorld(t.up.clone()).multiplyScalar(l);
      return e.position.add(a), !0;
    }
  }
  return !1;
}
class Fo extends NA {
  decodeBlock(e) {
    return e;
  }
}
const ko = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: Fo
}, Symbol.toStringTag, { value: "Module" })), oi = 9, Ze = 256, Bt = 257, bo = 12;
function Mo(t, e, A) {
  const i = e % 8, n = Math.floor(e / 8), r = 8 - i, l = e + A - (n + 1) * 8;
  let a = 8 * (n + 2) - (e + A);
  const h = (n + 2) * 8 - e;
  if (a = Math.max(0, a), n >= t.length)
    return console.warn("ran off the end of the buffer before finding EOI_CODE (end on input code)"), Bt;
  let o = t[n] & 2 ** (8 - i) - 1;
  o <<= A - r;
  let s = o;
  if (n + 1 < t.length) {
    let g = t[n + 1] >>> a;
    g <<= Math.max(0, A - h), s += g;
  }
  if (l > 8 && n + 2 < t.length) {
    const g = (n + 3) * 8 - (e + A), I = t[n + 2] >>> g;
    s += I;
  }
  return s;
}
function ze(t, e) {
  for (let A = e.length - 1; A >= 0; A--)
    t.push(e[A]);
  return t;
}
function Lo(t) {
  const e = new Uint16Array(4093), A = new Uint8Array(4093);
  for (let f = 0; f <= 257; f++)
    e[f] = 4096, A[f] = f;
  let i = 258, n = oi, r = 0;
  function l() {
    i = 258, n = oi;
  }
  function a(f) {
    const w = Mo(f, r, n);
    return r += n, w;
  }
  function h(f, w) {
    return A[i] = w, e[i] = f, i++, i - 1;
  }
  function o(f) {
    const w = [];
    for (let B = f; B !== 4096; B = e[B])
      w.push(A[B]);
    return w;
  }
  const s = [];
  l();
  const g = new Uint8Array(t);
  let I = a(g), c;
  for (; I !== Bt; ) {
    if (I === Ze) {
      for (l(), I = a(g); I === Ze; )
        I = a(g);
      if (I === Bt)
        break;
      if (I > Ze)
        throw new Error(`corrupted code at scanline ${I}`);
      {
        const f = o(I);
        ze(s, f), c = I;
      }
    } else if (I < i) {
      const f = o(I);
      ze(s, f), h(c, f[f.length - 1]), c = I;
    } else {
      const f = o(c);
      if (!f)
        throw new Error(`Bogus entry. Not in dictionary, ${c} / ${i}, position: ${r}`);
      ze(s, f), s.push(f[f.length - 1]), h(c, f[f.length - 1]), c = I;
    }
    i + 1 >= 2 ** n && (n === bo ? c = void 0 : n++), I = a(g);
  }
  return new Uint8Array(s);
}
class vo extends NA {
  decodeBlock(e) {
    return Lo(e).buffer;
  }
}
const Go = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: vo
}, Symbol.toStringTag, { value: "Module" })), re = new Int32Array([
  0,
  1,
  8,
  16,
  9,
  2,
  3,
  10,
  17,
  24,
  32,
  25,
  18,
  11,
  4,
  5,
  12,
  19,
  26,
  33,
  40,
  48,
  41,
  34,
  27,
  20,
  13,
  6,
  7,
  14,
  21,
  28,
  35,
  42,
  49,
  56,
  57,
  50,
  43,
  36,
  29,
  22,
  15,
  23,
  30,
  37,
  44,
  51,
  58,
  59,
  52,
  45,
  38,
  31,
  39,
  46,
  53,
  60,
  61,
  54,
  47,
  55,
  62,
  63
]), Qe = 4017, we = 799, ye = 3406, pe = 2276, xe = 1567, me = 3784, VA = 5793, De = 2896;
function ai(t, e) {
  let A = 0;
  const i = [];
  let n = 16;
  for (; n > 0 && !t[n - 1]; )
    --n;
  i.push({ children: [], index: 0 });
  let r = i[0], l;
  for (let a = 0; a < n; a++) {
    for (let h = 0; h < t[a]; h++) {
      for (r = i.pop(), r.children[r.index] = e[A]; r.index > 0; )
        r = i.pop();
      for (r.index++, i.push(r); i.length <= a; )
        i.push(l = { children: [], index: 0 }), r.children[r.index] = l.children, r = l;
      A++;
    }
    a + 1 < n && (i.push(l = { children: [], index: 0 }), r.children[r.index] = l.children, r = l);
  }
  return i[0].children;
}
function Ro(t, e, A, i, n, r, l, a, h) {
  const { mcusPerLine: o, progressive: s } = A, g = e;
  let I = e, c = 0, f = 0;
  function w() {
    if (f > 0)
      return f--, c >> f & 1;
    if (c = t[I++], c === 255) {
      const _ = t[I++];
      if (_)
        throw new Error(`unexpected marker: ${(c << 8 | _).toString(16)}`);
    }
    return f = 7, c >>> 7;
  }
  function B(_) {
    let q = _, Y;
    for (; (Y = w()) !== null; ) {
      if (q = q[Y], typeof q == "number")
        return q;
      if (typeof q != "object")
        throw new Error("invalid huffman sequence");
    }
    return null;
  }
  function u(_) {
    let q = _, Y = 0;
    for (; q > 0; ) {
      const V = w();
      if (V === null)
        return;
      Y = Y << 1 | V, --q;
    }
    return Y;
  }
  function E(_) {
    const q = u(_);
    return q >= 1 << _ - 1 ? q : q + (-1 << _) + 1;
  }
  function y(_, q) {
    const Y = B(_.huffmanTableDC), V = Y === 0 ? 0 : E(Y);
    _.pred += V, q[0] = _.pred;
    let j = 1;
    for (; j < 64; ) {
      const z = B(_.huffmanTableAC), $ = z & 15, tA = z >> 4;
      if ($ === 0) {
        if (tA < 15)
          break;
        j += 16;
      } else {
        j += tA;
        const iA = re[j];
        q[iA] = E($), j++;
      }
    }
  }
  function d(_, q) {
    const Y = B(_.huffmanTableDC), V = Y === 0 ? 0 : E(Y) << h;
    _.pred += V, q[0] = _.pred;
  }
  function x(_, q) {
    q[0] |= w() << h;
  }
  let C = 0;
  function Q(_, q) {
    if (C > 0) {
      C--;
      return;
    }
    let Y = r;
    const V = l;
    for (; Y <= V; ) {
      const j = B(_.huffmanTableAC), z = j & 15, $ = j >> 4;
      if (z === 0) {
        if ($ < 15) {
          C = u($) + (1 << $) - 1;
          break;
        }
        Y += 16;
      } else {
        Y += $;
        const tA = re[Y];
        q[tA] = E(z) * (1 << h), Y++;
      }
    }
  }
  let p = 0, k;
  function b(_, q) {
    let Y = r;
    const V = l;
    let j = 0;
    for (; Y <= V; ) {
      const z = re[Y], $ = q[z] < 0 ? -1 : 1;
      switch (p) {
        case 0: {
          const tA = B(_.huffmanTableAC), iA = tA & 15;
          if (j = tA >> 4, iA === 0)
            j < 15 ? (C = u(j) + (1 << j), p = 4) : (j = 16, p = 1);
          else {
            if (iA !== 1)
              throw new Error("invalid ACn encoding");
            k = E(iA), p = j ? 2 : 3;
          }
          continue;
        }
        case 1:
        case 2:
          q[z] ? q[z] += (w() << h) * $ : (j--, j === 0 && (p = p === 2 ? 3 : 0));
          break;
        case 3:
          q[z] ? q[z] += (w() << h) * $ : (q[z] = k << h, p = 0);
          break;
        case 4:
          q[z] && (q[z] += (w() << h) * $);
          break;
      }
      Y++;
    }
    p === 4 && (C--, C === 0 && (p = 0));
  }
  function S(_, q, Y, V, j) {
    const z = Y / o | 0, $ = Y % o, tA = z * _.v + V, iA = $ * _.h + j;
    q(_, _.blocks[tA][iA]);
  }
  function v(_, q, Y) {
    const V = Y / _.blocksPerLine | 0, j = Y % _.blocksPerLine;
    q(_, _.blocks[V][j]);
  }
  const L = i.length;
  let P, M, F, U, R, T;
  s ? r === 0 ? T = a === 0 ? d : x : T = a === 0 ? Q : b : T = y;
  let O = 0, N, H;
  L === 1 ? H = i[0].blocksPerLine * i[0].blocksPerColumn : H = o * A.mcusPerColumn;
  const X = n || H;
  for (; O < H; ) {
    for (M = 0; M < L; M++)
      i[M].pred = 0;
    if (C = 0, L === 1)
      for (P = i[0], R = 0; R < X; R++)
        v(P, T, O), O++;
    else
      for (R = 0; R < X; R++) {
        for (M = 0; M < L; M++) {
          P = i[M];
          const { h: _, v: q } = P;
          for (F = 0; F < q; F++)
            for (U = 0; U < _; U++)
              S(P, T, O, F, U);
        }
        if (O++, O === H)
          break;
      }
    if (f = 0, N = t[I] << 8 | t[I + 1], N < 65280)
      throw new Error("marker was not found");
    if (N >= 65488 && N <= 65495)
      I += 2;
    else
      break;
  }
  return I - g;
}
function Uo(t, e) {
  const A = [], { blocksPerLine: i, blocksPerColumn: n } = e, r = i << 3, l = new Int32Array(64), a = new Uint8Array(64);
  function h(o, s, g) {
    const I = e.quantizationTable;
    let c, f, w, B, u, E, y, d, x;
    const C = g;
    let Q;
    for (Q = 0; Q < 64; Q++)
      C[Q] = o[Q] * I[Q];
    for (Q = 0; Q < 8; ++Q) {
      const p = 8 * Q;
      if (C[1 + p] === 0 && C[2 + p] === 0 && C[3 + p] === 0 && C[4 + p] === 0 && C[5 + p] === 0 && C[6 + p] === 0 && C[7 + p] === 0) {
        x = VA * C[0 + p] + 512 >> 10, C[0 + p] = x, C[1 + p] = x, C[2 + p] = x, C[3 + p] = x, C[4 + p] = x, C[5 + p] = x, C[6 + p] = x, C[7 + p] = x;
        continue;
      }
      c = VA * C[0 + p] + 128 >> 8, f = VA * C[4 + p] + 128 >> 8, w = C[2 + p], B = C[6 + p], u = De * (C[1 + p] - C[7 + p]) + 128 >> 8, d = De * (C[1 + p] + C[7 + p]) + 128 >> 8, E = C[3 + p] << 4, y = C[5 + p] << 4, x = c - f + 1 >> 1, c = c + f + 1 >> 1, f = x, x = w * me + B * xe + 128 >> 8, w = w * xe - B * me + 128 >> 8, B = x, x = u - y + 1 >> 1, u = u + y + 1 >> 1, y = x, x = d + E + 1 >> 1, E = d - E + 1 >> 1, d = x, x = c - B + 1 >> 1, c = c + B + 1 >> 1, B = x, x = f - w + 1 >> 1, f = f + w + 1 >> 1, w = x, x = u * pe + d * ye + 2048 >> 12, u = u * ye - d * pe + 2048 >> 12, d = x, x = E * we + y * Qe + 2048 >> 12, E = E * Qe - y * we + 2048 >> 12, y = x, C[0 + p] = c + d, C[7 + p] = c - d, C[1 + p] = f + y, C[6 + p] = f - y, C[2 + p] = w + E, C[5 + p] = w - E, C[3 + p] = B + u, C[4 + p] = B - u;
    }
    for (Q = 0; Q < 8; ++Q) {
      const p = Q;
      if (C[1 * 8 + p] === 0 && C[2 * 8 + p] === 0 && C[3 * 8 + p] === 0 && C[4 * 8 + p] === 0 && C[5 * 8 + p] === 0 && C[6 * 8 + p] === 0 && C[7 * 8 + p] === 0) {
        x = VA * g[Q + 0] + 8192 >> 14, C[0 * 8 + p] = x, C[1 * 8 + p] = x, C[2 * 8 + p] = x, C[3 * 8 + p] = x, C[4 * 8 + p] = x, C[5 * 8 + p] = x, C[6 * 8 + p] = x, C[7 * 8 + p] = x;
        continue;
      }
      c = VA * C[0 * 8 + p] + 2048 >> 12, f = VA * C[4 * 8 + p] + 2048 >> 12, w = C[2 * 8 + p], B = C[6 * 8 + p], u = De * (C[1 * 8 + p] - C[7 * 8 + p]) + 2048 >> 12, d = De * (C[1 * 8 + p] + C[7 * 8 + p]) + 2048 >> 12, E = C[3 * 8 + p], y = C[5 * 8 + p], x = c - f + 1 >> 1, c = c + f + 1 >> 1, f = x, x = w * me + B * xe + 2048 >> 12, w = w * xe - B * me + 2048 >> 12, B = x, x = u - y + 1 >> 1, u = u + y + 1 >> 1, y = x, x = d + E + 1 >> 1, E = d - E + 1 >> 1, d = x, x = c - B + 1 >> 1, c = c + B + 1 >> 1, B = x, x = f - w + 1 >> 1, f = f + w + 1 >> 1, w = x, x = u * pe + d * ye + 2048 >> 12, u = u * ye - d * pe + 2048 >> 12, d = x, x = E * we + y * Qe + 2048 >> 12, E = E * Qe - y * we + 2048 >> 12, y = x, C[0 * 8 + p] = c + d, C[7 * 8 + p] = c - d, C[1 * 8 + p] = f + y, C[6 * 8 + p] = f - y, C[2 * 8 + p] = w + E, C[5 * 8 + p] = w - E, C[3 * 8 + p] = B + u, C[4 * 8 + p] = B - u;
    }
    for (Q = 0; Q < 64; ++Q) {
      const p = 128 + (C[Q] + 8 >> 4);
      p < 0 ? s[Q] = 0 : p > 255 ? s[Q] = 255 : s[Q] = p;
    }
  }
  for (let o = 0; o < n; o++) {
    const s = o << 3;
    for (let g = 0; g < 8; g++)
      A.push(new Uint8Array(r));
    for (let g = 0; g < i; g++) {
      h(e.blocks[o][g], a, l);
      let I = 0;
      const c = g << 3;
      for (let f = 0; f < 8; f++) {
        const w = A[s + f];
        for (let B = 0; B < 8; B++)
          w[c + B] = a[I++];
      }
    }
  }
  return A;
}
class To {
  constructor() {
    this.jfif = null, this.adobe = null, this.quantizationTables = [], this.huffmanTablesAC = [], this.huffmanTablesDC = [], this.resetFrames();
  }
  resetFrames() {
    this.frames = [];
  }
  parse(e) {
    let A = 0;
    function i() {
      const a = e[A] << 8 | e[A + 1];
      return A += 2, a;
    }
    function n() {
      const a = i(), h = e.subarray(A, A + a - 2);
      return A += h.length, h;
    }
    function r(a) {
      let h = 0, o = 0, s, g;
      for (g in a.components)
        a.components.hasOwnProperty(g) && (s = a.components[g], h < s.h && (h = s.h), o < s.v && (o = s.v));
      const I = Math.ceil(a.samplesPerLine / 8 / h), c = Math.ceil(a.scanLines / 8 / o);
      for (g in a.components)
        if (a.components.hasOwnProperty(g)) {
          s = a.components[g];
          const f = Math.ceil(Math.ceil(a.samplesPerLine / 8) * s.h / h), w = Math.ceil(Math.ceil(a.scanLines / 8) * s.v / o), B = I * s.h, u = c * s.v, E = [];
          for (let y = 0; y < u; y++) {
            const d = [];
            for (let x = 0; x < B; x++)
              d.push(new Int32Array(64));
            E.push(d);
          }
          s.blocksPerLine = f, s.blocksPerColumn = w, s.blocks = E;
        }
      a.maxH = h, a.maxV = o, a.mcusPerLine = I, a.mcusPerColumn = c;
    }
    let l = i();
    if (l !== 65496)
      throw new Error("SOI not found");
    for (l = i(); l !== 65497; ) {
      switch (l) {
        case 65280:
          break;
        case 65504:
        case 65505:
        case 65506:
        case 65507:
        case 65508:
        case 65509:
        case 65510:
        case 65511:
        case 65512:
        case 65513:
        case 65514:
        case 65515:
        case 65516:
        case 65517:
        case 65518:
        case 65519:
        case 65534: {
          const a = n();
          l === 65504 && a[0] === 74 && a[1] === 70 && a[2] === 73 && a[3] === 70 && a[4] === 0 && (this.jfif = {
            version: { major: a[5], minor: a[6] },
            densityUnits: a[7],
            xDensity: a[8] << 8 | a[9],
            yDensity: a[10] << 8 | a[11],
            thumbWidth: a[12],
            thumbHeight: a[13],
            thumbData: a.subarray(14, 14 + 3 * a[12] * a[13])
          }), l === 65518 && a[0] === 65 && a[1] === 100 && a[2] === 111 && a[3] === 98 && a[4] === 101 && a[5] === 0 && (this.adobe = {
            version: a[6],
            flags0: a[7] << 8 | a[8],
            flags1: a[9] << 8 | a[10],
            transformCode: a[11]
          });
          break;
        }
        case 65499: {
          const h = i() + A - 2;
          for (; A < h; ) {
            const o = e[A++], s = new Int32Array(64);
            if (o >> 4)
              if (o >> 4 === 1)
                for (let g = 0; g < 64; g++) {
                  const I = re[g];
                  s[I] = i();
                }
              else
                throw new Error("DQT: invalid table spec");
            else for (let g = 0; g < 64; g++) {
              const I = re[g];
              s[I] = e[A++];
            }
            this.quantizationTables[o & 15] = s;
          }
          break;
        }
        case 65472:
        case 65473:
        case 65474: {
          i();
          const a = {
            extended: l === 65473,
            progressive: l === 65474,
            precision: e[A++],
            scanLines: i(),
            samplesPerLine: i(),
            components: {},
            componentsOrder: []
          }, h = e[A++];
          let o;
          for (let s = 0; s < h; s++) {
            o = e[A];
            const g = e[A + 1] >> 4, I = e[A + 1] & 15, c = e[A + 2];
            a.componentsOrder.push(o), a.components[o] = {
              h: g,
              v: I,
              quantizationIdx: c
            }, A += 3;
          }
          r(a), this.frames.push(a);
          break;
        }
        case 65476: {
          const a = i();
          for (let h = 2; h < a; ) {
            const o = e[A++], s = new Uint8Array(16);
            let g = 0;
            for (let c = 0; c < 16; c++, A++)
              s[c] = e[A], g += s[c];
            const I = new Uint8Array(g);
            for (let c = 0; c < g; c++, A++)
              I[c] = e[A];
            h += 17 + g, o >> 4 ? this.huffmanTablesAC[o & 15] = ai(
              s,
              I
            ) : this.huffmanTablesDC[o & 15] = ai(
              s,
              I
            );
          }
          break;
        }
        case 65501:
          i(), this.resetInterval = i();
          break;
        case 65498: {
          i();
          const a = e[A++], h = [], o = this.frames[0];
          for (let f = 0; f < a; f++) {
            const w = o.components[e[A++]], B = e[A++];
            w.huffmanTableDC = this.huffmanTablesDC[B >> 4], w.huffmanTableAC = this.huffmanTablesAC[B & 15], h.push(w);
          }
          const s = e[A++], g = e[A++], I = e[A++], c = Ro(
            e,
            A,
            o,
            h,
            this.resetInterval,
            s,
            g,
            I >> 4,
            I & 15
          );
          A += c;
          break;
        }
        case 65535:
          e[A] !== 255 && A--;
          break;
        default:
          if (e[A - 3] === 255 && e[A - 2] >= 192 && e[A - 2] <= 254) {
            A -= 3;
            break;
          }
          throw new Error(`unknown JPEG marker ${l.toString(16)}`);
      }
      l = i();
    }
  }
  getResult() {
    const { frames: e } = this;
    if (this.frames.length === 0)
      throw new Error("no frames were decoded");
    this.frames.length > 1 && console.warn("more than one frame is not supported");
    for (let s = 0; s < this.frames.length; s++) {
      const g = this.frames[s].components;
      for (const I of Object.keys(g))
        g[I].quantizationTable = this.quantizationTables[g[I].quantizationIdx], delete g[I].quantizationIdx;
    }
    const A = e[0], { components: i, componentsOrder: n } = A, r = [], l = A.samplesPerLine, a = A.scanLines;
    for (let s = 0; s < n.length; s++) {
      const g = i[n[s]];
      r.push({
        lines: Uo(A, g),
        scaleX: g.h / A.maxH,
        scaleY: g.v / A.maxV
      });
    }
    const h = new Uint8Array(l * a * r.length);
    let o = 0;
    for (let s = 0; s < a; ++s)
      for (let g = 0; g < l; ++g)
        for (let I = 0; I < r.length; ++I) {
          const c = r[I];
          h[o] = c.lines[0 | s * c.scaleY][0 | g * c.scaleX], ++o;
        }
    return h;
  }
}
class _o extends NA {
  constructor(e) {
    super(), this.reader = new To(), e.JPEGTables && this.reader.parse(e.JPEGTables);
  }
  decodeBlock(e) {
    return this.reader.resetFrames(), this.reader.parse(new Uint8Array(e)), this.reader.getResult().buffer;
  }
}
const No = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: _o
}, Symbol.toStringTag, { value: "Module" }));
function WA(t) {
  let e = t.length;
  for (; --e >= 0; )
    t[e] = 0;
}
const Oo = 3, Yo = 258, un = 29, qo = 256, Po = qo + 1 + un, Cn = 30, Jo = 512, Vo = new Array((Po + 2) * 2);
WA(Vo);
const Ho = new Array(Cn * 2);
WA(Ho);
const Ko = new Array(Jo);
WA(Ko);
const jo = new Array(Yo - Oo + 1);
WA(jo);
const Xo = new Array(un);
WA(Xo);
const Zo = new Array(Cn);
WA(Zo);
const zo = (t, e, A, i) => {
  let n = t & 65535 | 0, r = t >>> 16 & 65535 | 0, l = 0;
  for (; A !== 0; ) {
    l = A > 2e3 ? 2e3 : A, A -= l;
    do
      n = n + e[i++] | 0, r = r + n | 0;
    while (--l);
    n %= 65521, r %= 65521;
  }
  return n | r << 16 | 0;
};
var ut = zo;
const Wo = () => {
  let t, e = [];
  for (var A = 0; A < 256; A++) {
    t = A;
    for (var i = 0; i < 8; i++)
      t = t & 1 ? 3988292384 ^ t >>> 1 : t >>> 1;
    e[A] = t;
  }
  return e;
}, $o = new Uint32Array(Wo()), Aa = (t, e, A, i) => {
  const n = $o, r = i + A;
  t ^= -1;
  for (let l = i; l < r; l++)
    t = t >>> 8 ^ n[(t ^ e[l]) & 255];
  return t ^ -1;
};
var EA = Aa, Ct = {
  2: "need dictionary",
  /* Z_NEED_DICT       2  */
  1: "stream end",
  /* Z_STREAM_END      1  */
  0: "",
  /* Z_OK              0  */
  "-1": "file error",
  /* Z_ERRNO         (-1) */
  "-2": "stream error",
  /* Z_STREAM_ERROR  (-2) */
  "-3": "data error",
  /* Z_DATA_ERROR    (-3) */
  "-4": "insufficient memory",
  /* Z_MEM_ERROR     (-4) */
  "-5": "buffer error",
  /* Z_BUF_ERROR     (-5) */
  "-6": "incompatible version"
  /* Z_VERSION_ERROR (-6) */
}, En = {
  /* Allowed flush values; see deflate() and inflate() below for details */
  Z_NO_FLUSH: 0,
  Z_FINISH: 4,
  Z_BLOCK: 5,
  Z_TREES: 6,
  /* Return codes for the compression/decompression functions. Negative values
  * are errors, positive values are used for special but normal events.
  */
  Z_OK: 0,
  Z_STREAM_END: 1,
  Z_NEED_DICT: 2,
  Z_STREAM_ERROR: -2,
  Z_DATA_ERROR: -3,
  Z_MEM_ERROR: -4,
  Z_BUF_ERROR: -5,
  /* The deflate compression method */
  Z_DEFLATED: 8
  //Z_NULL:                 null // Use -1 or null inline, depending on var type
};
const ea = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
var ta = function(t) {
  const e = Array.prototype.slice.call(arguments, 1);
  for (; e.length; ) {
    const A = e.shift();
    if (A) {
      if (typeof A != "object")
        throw new TypeError(A + "must be non-object");
      for (const i in A)
        ea(A, i) && (t[i] = A[i]);
    }
  }
  return t;
}, ia = (t) => {
  let e = 0;
  for (let i = 0, n = t.length; i < n; i++)
    e += t[i].length;
  const A = new Uint8Array(e);
  for (let i = 0, n = 0, r = t.length; i < r; i++) {
    let l = t[i];
    A.set(l, n), n += l.length;
  }
  return A;
}, dn = {
  assign: ta,
  flattenChunks: ia
};
let Qn = !0;
try {
  String.fromCharCode.apply(null, new Uint8Array(1));
} catch {
  Qn = !1;
}
const ge = new Uint8Array(256);
for (let t = 0; t < 256; t++)
  ge[t] = t >= 252 ? 6 : t >= 248 ? 5 : t >= 240 ? 4 : t >= 224 ? 3 : t >= 192 ? 2 : 1;
ge[254] = ge[254] = 1;
var na = (t) => {
  if (typeof TextEncoder == "function" && TextEncoder.prototype.encode)
    return new TextEncoder().encode(t);
  let e, A, i, n, r, l = t.length, a = 0;
  for (n = 0; n < l; n++)
    A = t.charCodeAt(n), (A & 64512) === 55296 && n + 1 < l && (i = t.charCodeAt(n + 1), (i & 64512) === 56320 && (A = 65536 + (A - 55296 << 10) + (i - 56320), n++)), a += A < 128 ? 1 : A < 2048 ? 2 : A < 65536 ? 3 : 4;
  for (e = new Uint8Array(a), r = 0, n = 0; r < a; n++)
    A = t.charCodeAt(n), (A & 64512) === 55296 && n + 1 < l && (i = t.charCodeAt(n + 1), (i & 64512) === 56320 && (A = 65536 + (A - 55296 << 10) + (i - 56320), n++)), A < 128 ? e[r++] = A : A < 2048 ? (e[r++] = 192 | A >>> 6, e[r++] = 128 | A & 63) : A < 65536 ? (e[r++] = 224 | A >>> 12, e[r++] = 128 | A >>> 6 & 63, e[r++] = 128 | A & 63) : (e[r++] = 240 | A >>> 18, e[r++] = 128 | A >>> 12 & 63, e[r++] = 128 | A >>> 6 & 63, e[r++] = 128 | A & 63);
  return e;
};
const ra = (t, e) => {
  if (e < 65534 && t.subarray && Qn)
    return String.fromCharCode.apply(null, t.length === e ? t : t.subarray(0, e));
  let A = "";
  for (let i = 0; i < e; i++)
    A += String.fromCharCode(t[i]);
  return A;
};
var sa = (t, e) => {
  const A = e || t.length;
  if (typeof TextDecoder == "function" && TextDecoder.prototype.decode)
    return new TextDecoder().decode(t.subarray(0, e));
  let i, n;
  const r = new Array(A * 2);
  for (n = 0, i = 0; i < A; ) {
    let l = t[i++];
    if (l < 128) {
      r[n++] = l;
      continue;
    }
    let a = ge[l];
    if (a > 4) {
      r[n++] = 65533, i += a - 1;
      continue;
    }
    for (l &= a === 2 ? 31 : a === 3 ? 15 : 7; a > 1 && i < A; )
      l = l << 6 | t[i++] & 63, a--;
    if (a > 1) {
      r[n++] = 65533;
      continue;
    }
    l < 65536 ? r[n++] = l : (l -= 65536, r[n++] = 55296 | l >> 10 & 1023, r[n++] = 56320 | l & 1023);
  }
  return ra(r, n);
}, oa = (t, e) => {
  e = e || t.length, e > t.length && (e = t.length);
  let A = e - 1;
  for (; A >= 0 && (t[A] & 192) === 128; )
    A--;
  return A < 0 || A === 0 ? e : A + ge[t[A]] > e ? A : e;
}, Et = {
  string2buf: na,
  buf2string: sa,
  utf8border: oa
};
function aa() {
  this.input = null, this.next_in = 0, this.avail_in = 0, this.total_in = 0, this.output = null, this.next_out = 0, this.avail_out = 0, this.total_out = 0, this.msg = "", this.state = null, this.data_type = 2, this.adler = 0;
}
var la = aa;
const Se = 16209, ga = 16191;
var ca = function(e, A) {
  let i, n, r, l, a, h, o, s, g, I, c, f, w, B, u, E, y, d, x, C, Q, p, k, b;
  const S = e.state;
  i = e.next_in, k = e.input, n = i + (e.avail_in - 5), r = e.next_out, b = e.output, l = r - (A - e.avail_out), a = r + (e.avail_out - 257), h = S.dmax, o = S.wsize, s = S.whave, g = S.wnext, I = S.window, c = S.hold, f = S.bits, w = S.lencode, B = S.distcode, u = (1 << S.lenbits) - 1, E = (1 << S.distbits) - 1;
  A:
    do {
      f < 15 && (c += k[i++] << f, f += 8, c += k[i++] << f, f += 8), y = w[c & u];
      e:
        for (; ; ) {
          if (d = y >>> 24, c >>>= d, f -= d, d = y >>> 16 & 255, d === 0)
            b[r++] = y & 65535;
          else if (d & 16) {
            x = y & 65535, d &= 15, d && (f < d && (c += k[i++] << f, f += 8), x += c & (1 << d) - 1, c >>>= d, f -= d), f < 15 && (c += k[i++] << f, f += 8, c += k[i++] << f, f += 8), y = B[c & E];
            t:
              for (; ; ) {
                if (d = y >>> 24, c >>>= d, f -= d, d = y >>> 16 & 255, d & 16) {
                  if (C = y & 65535, d &= 15, f < d && (c += k[i++] << f, f += 8, f < d && (c += k[i++] << f, f += 8)), C += c & (1 << d) - 1, C > h) {
                    e.msg = "invalid distance too far back", S.mode = Se;
                    break A;
                  }
                  if (c >>>= d, f -= d, d = r - l, C > d) {
                    if (d = C - d, d > s && S.sane) {
                      e.msg = "invalid distance too far back", S.mode = Se;
                      break A;
                    }
                    if (Q = 0, p = I, g === 0) {
                      if (Q += o - d, d < x) {
                        x -= d;
                        do
                          b[r++] = I[Q++];
                        while (--d);
                        Q = r - C, p = b;
                      }
                    } else if (g < d) {
                      if (Q += o + g - d, d -= g, d < x) {
                        x -= d;
                        do
                          b[r++] = I[Q++];
                        while (--d);
                        if (Q = 0, g < x) {
                          d = g, x -= d;
                          do
                            b[r++] = I[Q++];
                          while (--d);
                          Q = r - C, p = b;
                        }
                      }
                    } else if (Q += g - d, d < x) {
                      x -= d;
                      do
                        b[r++] = I[Q++];
                      while (--d);
                      Q = r - C, p = b;
                    }
                    for (; x > 2; )
                      b[r++] = p[Q++], b[r++] = p[Q++], b[r++] = p[Q++], x -= 3;
                    x && (b[r++] = p[Q++], x > 1 && (b[r++] = p[Q++]));
                  } else {
                    Q = r - C;
                    do
                      b[r++] = b[Q++], b[r++] = b[Q++], b[r++] = b[Q++], x -= 3;
                    while (x > 2);
                    x && (b[r++] = b[Q++], x > 1 && (b[r++] = b[Q++]));
                  }
                } else if (d & 64) {
                  e.msg = "invalid distance code", S.mode = Se;
                  break A;
                } else {
                  y = B[(y & 65535) + (c & (1 << d) - 1)];
                  continue t;
                }
                break;
              }
          } else if (d & 64)
            if (d & 32) {
              S.mode = ga;
              break A;
            } else {
              e.msg = "invalid literal/length code", S.mode = Se;
              break A;
            }
          else {
            y = w[(y & 65535) + (c & (1 << d) - 1)];
            continue e;
          }
          break;
        }
    } while (i < n && r < a);
  x = f >> 3, i -= x, f -= x << 3, c &= (1 << f) - 1, e.next_in = i, e.next_out = r, e.avail_in = i < n ? 5 + (n - i) : 5 - (i - n), e.avail_out = r < a ? 257 + (a - r) : 257 - (r - a), S.hold = c, S.bits = f;
};
const HA = 15, li = 852, gi = 592, ci = 0, We = 1, fi = 2, fa = new Uint16Array([
  /* Length codes 257..285 base */
  3,
  4,
  5,
  6,
  7,
  8,
  9,
  10,
  11,
  13,
  15,
  17,
  19,
  23,
  27,
  31,
  35,
  43,
  51,
  59,
  67,
  83,
  99,
  115,
  131,
  163,
  195,
  227,
  258,
  0,
  0
]), ha = new Uint8Array([
  /* Length codes 257..285 extra */
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  16,
  17,
  17,
  17,
  17,
  18,
  18,
  18,
  18,
  19,
  19,
  19,
  19,
  20,
  20,
  20,
  20,
  21,
  21,
  21,
  21,
  16,
  72,
  78
]), Ia = new Uint16Array([
  /* Distance codes 0..29 base */
  1,
  2,
  3,
  4,
  5,
  7,
  9,
  13,
  17,
  25,
  33,
  49,
  65,
  97,
  129,
  193,
  257,
  385,
  513,
  769,
  1025,
  1537,
  2049,
  3073,
  4097,
  6145,
  8193,
  12289,
  16385,
  24577,
  0,
  0
]), Ba = new Uint8Array([
  /* Distance codes 0..29 extra */
  16,
  16,
  16,
  16,
  17,
  17,
  18,
  18,
  19,
  19,
  20,
  20,
  21,
  21,
  22,
  22,
  23,
  23,
  24,
  24,
  25,
  25,
  26,
  26,
  27,
  27,
  28,
  28,
  29,
  29,
  64,
  64
]), ua = (t, e, A, i, n, r, l, a) => {
  const h = a.bits;
  let o = 0, s = 0, g = 0, I = 0, c = 0, f = 0, w = 0, B = 0, u = 0, E = 0, y, d, x, C, Q, p = null, k;
  const b = new Uint16Array(HA + 1), S = new Uint16Array(HA + 1);
  let v = null, L, P, M;
  for (o = 0; o <= HA; o++)
    b[o] = 0;
  for (s = 0; s < i; s++)
    b[e[A + s]]++;
  for (c = h, I = HA; I >= 1 && b[I] === 0; I--)
    ;
  if (c > I && (c = I), I === 0)
    return n[r++] = 1 << 24 | 64 << 16 | 0, n[r++] = 1 << 24 | 64 << 16 | 0, a.bits = 1, 0;
  for (g = 1; g < I && b[g] === 0; g++)
    ;
  for (c < g && (c = g), B = 1, o = 1; o <= HA; o++)
    if (B <<= 1, B -= b[o], B < 0)
      return -1;
  if (B > 0 && (t === ci || I !== 1))
    return -1;
  for (S[1] = 0, o = 1; o < HA; o++)
    S[o + 1] = S[o] + b[o];
  for (s = 0; s < i; s++)
    e[A + s] !== 0 && (l[S[e[A + s]]++] = s);
  if (t === ci ? (p = v = l, k = 20) : t === We ? (p = fa, v = ha, k = 257) : (p = Ia, v = Ba, k = 0), E = 0, s = 0, o = g, Q = r, f = c, w = 0, x = -1, u = 1 << c, C = u - 1, t === We && u > li || t === fi && u > gi)
    return 1;
  for (; ; ) {
    L = o - w, l[s] + 1 < k ? (P = 0, M = l[s]) : l[s] >= k ? (P = v[l[s] - k], M = p[l[s] - k]) : (P = 96, M = 0), y = 1 << o - w, d = 1 << f, g = d;
    do
      d -= y, n[Q + (E >> w) + d] = L << 24 | P << 16 | M | 0;
    while (d !== 0);
    for (y = 1 << o - 1; E & y; )
      y >>= 1;
    if (y !== 0 ? (E &= y - 1, E += y) : E = 0, s++, --b[o] === 0) {
      if (o === I)
        break;
      o = e[A + l[s]];
    }
    if (o > c && (E & C) !== x) {
      for (w === 0 && (w = c), Q += g, f = o - w, B = 1 << f; f + w < I && (B -= b[f + w], !(B <= 0)); )
        f++, B <<= 1;
      if (u += 1 << f, t === We && u > li || t === fi && u > gi)
        return 1;
      x = E & C, n[x] = c << 24 | f << 16 | Q - r | 0;
    }
  }
  return E !== 0 && (n[Q + E] = o - w << 24 | 64 << 16 | 0), a.bits = c, 0;
};
var se = ua;
const Ca = 0, wn = 1, yn = 2, {
  Z_FINISH: hi,
  Z_BLOCK: Ea,
  Z_TREES: Fe,
  Z_OK: _A,
  Z_STREAM_END: da,
  Z_NEED_DICT: Qa,
  Z_STREAM_ERROR: hA,
  Z_DATA_ERROR: pn,
  Z_MEM_ERROR: xn,
  Z_BUF_ERROR: wa,
  Z_DEFLATED: Ii
} = En, Re = 16180, Bi = 16181, ui = 16182, Ci = 16183, Ei = 16184, di = 16185, Qi = 16186, wi = 16187, yi = 16188, pi = 16189, Le = 16190, DA = 16191, $e = 16192, xi = 16193, At = 16194, mi = 16195, Di = 16196, Si = 16197, Fi = 16198, ke = 16199, be = 16200, ki = 16201, bi = 16202, Mi = 16203, Li = 16204, vi = 16205, et = 16206, Gi = 16207, Ri = 16208, W = 16209, mn = 16210, Dn = 16211, ya = 852, pa = 592, xa = 15, ma = xa, Ui = (t) => (t >>> 24 & 255) + (t >>> 8 & 65280) + ((t & 65280) << 8) + ((t & 255) << 24);
function Da() {
  this.strm = null, this.mode = 0, this.last = !1, this.wrap = 0, this.havedict = !1, this.flags = 0, this.dmax = 0, this.check = 0, this.total = 0, this.head = null, this.wbits = 0, this.wsize = 0, this.whave = 0, this.wnext = 0, this.window = null, this.hold = 0, this.bits = 0, this.length = 0, this.offset = 0, this.extra = 0, this.lencode = null, this.distcode = null, this.lenbits = 0, this.distbits = 0, this.ncode = 0, this.nlen = 0, this.ndist = 0, this.have = 0, this.next = null, this.lens = new Uint16Array(320), this.work = new Uint16Array(288), this.lendyn = null, this.distdyn = null, this.sane = 0, this.back = 0, this.was = 0;
}
const OA = (t) => {
  if (!t)
    return 1;
  const e = t.state;
  return !e || e.strm !== t || e.mode < Re || e.mode > Dn ? 1 : 0;
}, Sn = (t) => {
  if (OA(t))
    return hA;
  const e = t.state;
  return t.total_in = t.total_out = e.total = 0, t.msg = "", e.wrap && (t.adler = e.wrap & 1), e.mode = Re, e.last = 0, e.havedict = 0, e.flags = -1, e.dmax = 32768, e.head = null, e.hold = 0, e.bits = 0, e.lencode = e.lendyn = new Int32Array(ya), e.distcode = e.distdyn = new Int32Array(pa), e.sane = 1, e.back = -1, _A;
}, Fn = (t) => {
  if (OA(t))
    return hA;
  const e = t.state;
  return e.wsize = 0, e.whave = 0, e.wnext = 0, Sn(t);
}, kn = (t, e) => {
  let A;
  if (OA(t))
    return hA;
  const i = t.state;
  return e < 0 ? (A = 0, e = -e) : (A = (e >> 4) + 5, e < 48 && (e &= 15)), e && (e < 8 || e > 15) ? hA : (i.window !== null && i.wbits !== e && (i.window = null), i.wrap = A, i.wbits = e, Fn(t));
}, bn = (t, e) => {
  if (!t)
    return hA;
  const A = new Da();
  t.state = A, A.strm = t, A.window = null, A.mode = Re;
  const i = kn(t, e);
  return i !== _A && (t.state = null), i;
}, Sa = (t) => bn(t, ma);
let Ti = !0, tt, it;
const Fa = (t) => {
  if (Ti) {
    tt = new Int32Array(512), it = new Int32Array(32);
    let e = 0;
    for (; e < 144; )
      t.lens[e++] = 8;
    for (; e < 256; )
      t.lens[e++] = 9;
    for (; e < 280; )
      t.lens[e++] = 7;
    for (; e < 288; )
      t.lens[e++] = 8;
    for (se(wn, t.lens, 0, 288, tt, 0, t.work, { bits: 9 }), e = 0; e < 32; )
      t.lens[e++] = 5;
    se(yn, t.lens, 0, 32, it, 0, t.work, { bits: 5 }), Ti = !1;
  }
  t.lencode = tt, t.lenbits = 9, t.distcode = it, t.distbits = 5;
}, Mn = (t, e, A, i) => {
  let n;
  const r = t.state;
  return r.window === null && (r.wsize = 1 << r.wbits, r.wnext = 0, r.whave = 0, r.window = new Uint8Array(r.wsize)), i >= r.wsize ? (r.window.set(e.subarray(A - r.wsize, A), 0), r.wnext = 0, r.whave = r.wsize) : (n = r.wsize - r.wnext, n > i && (n = i), r.window.set(e.subarray(A - i, A - i + n), r.wnext), i -= n, i ? (r.window.set(e.subarray(A - i, A), 0), r.wnext = i, r.whave = r.wsize) : (r.wnext += n, r.wnext === r.wsize && (r.wnext = 0), r.whave < r.wsize && (r.whave += n))), 0;
}, ka = (t, e) => {
  let A, i, n, r, l, a, h, o, s, g, I, c, f, w, B = 0, u, E, y, d, x, C, Q, p;
  const k = new Uint8Array(4);
  let b, S;
  const v = (
    /* permutation of code lengths */
    new Uint8Array([16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15])
  );
  if (OA(t) || !t.output || !t.input && t.avail_in !== 0)
    return hA;
  A = t.state, A.mode === DA && (A.mode = $e), l = t.next_out, n = t.output, h = t.avail_out, r = t.next_in, i = t.input, a = t.avail_in, o = A.hold, s = A.bits, g = a, I = h, p = _A;
  A:
    for (; ; )
      switch (A.mode) {
        case Re:
          if (A.wrap === 0) {
            A.mode = $e;
            break;
          }
          for (; s < 16; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if (A.wrap & 2 && o === 35615) {
            A.wbits === 0 && (A.wbits = 15), A.check = 0, k[0] = o & 255, k[1] = o >>> 8 & 255, A.check = EA(A.check, k, 2, 0), o = 0, s = 0, A.mode = Bi;
            break;
          }
          if (A.head && (A.head.done = !1), !(A.wrap & 1) || /* check if zlib header allowed */
          (((o & 255) << 8) + (o >> 8)) % 31) {
            t.msg = "incorrect header check", A.mode = W;
            break;
          }
          if ((o & 15) !== Ii) {
            t.msg = "unknown compression method", A.mode = W;
            break;
          }
          if (o >>>= 4, s -= 4, Q = (o & 15) + 8, A.wbits === 0 && (A.wbits = Q), Q > 15 || Q > A.wbits) {
            t.msg = "invalid window size", A.mode = W;
            break;
          }
          A.dmax = 1 << A.wbits, A.flags = 0, t.adler = A.check = 1, A.mode = o & 512 ? pi : DA, o = 0, s = 0;
          break;
        case Bi:
          for (; s < 16; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if (A.flags = o, (A.flags & 255) !== Ii) {
            t.msg = "unknown compression method", A.mode = W;
            break;
          }
          if (A.flags & 57344) {
            t.msg = "unknown header flags set", A.mode = W;
            break;
          }
          A.head && (A.head.text = o >> 8 & 1), A.flags & 512 && A.wrap & 4 && (k[0] = o & 255, k[1] = o >>> 8 & 255, A.check = EA(A.check, k, 2, 0)), o = 0, s = 0, A.mode = ui;
        case ui:
          for (; s < 32; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          A.head && (A.head.time = o), A.flags & 512 && A.wrap & 4 && (k[0] = o & 255, k[1] = o >>> 8 & 255, k[2] = o >>> 16 & 255, k[3] = o >>> 24 & 255, A.check = EA(A.check, k, 4, 0)), o = 0, s = 0, A.mode = Ci;
        case Ci:
          for (; s < 16; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          A.head && (A.head.xflags = o & 255, A.head.os = o >> 8), A.flags & 512 && A.wrap & 4 && (k[0] = o & 255, k[1] = o >>> 8 & 255, A.check = EA(A.check, k, 2, 0)), o = 0, s = 0, A.mode = Ei;
        case Ei:
          if (A.flags & 1024) {
            for (; s < 16; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            A.length = o, A.head && (A.head.extra_len = o), A.flags & 512 && A.wrap & 4 && (k[0] = o & 255, k[1] = o >>> 8 & 255, A.check = EA(A.check, k, 2, 0)), o = 0, s = 0;
          } else A.head && (A.head.extra = null);
          A.mode = di;
        case di:
          if (A.flags & 1024 && (c = A.length, c > a && (c = a), c && (A.head && (Q = A.head.extra_len - A.length, A.head.extra || (A.head.extra = new Uint8Array(A.head.extra_len)), A.head.extra.set(
            i.subarray(
              r,
              // extra field is limited to 65536 bytes
              // - no need for additional size check
              r + c
            ),
            /*len + copy > state.head.extra_max - len ? state.head.extra_max : copy,*/
            Q
          )), A.flags & 512 && A.wrap & 4 && (A.check = EA(A.check, i, c, r)), a -= c, r += c, A.length -= c), A.length))
            break A;
          A.length = 0, A.mode = Qi;
        case Qi:
          if (A.flags & 2048) {
            if (a === 0)
              break A;
            c = 0;
            do
              Q = i[r + c++], A.head && Q && A.length < 65536 && (A.head.name += String.fromCharCode(Q));
            while (Q && c < a);
            if (A.flags & 512 && A.wrap & 4 && (A.check = EA(A.check, i, c, r)), a -= c, r += c, Q)
              break A;
          } else A.head && (A.head.name = null);
          A.length = 0, A.mode = wi;
        case wi:
          if (A.flags & 4096) {
            if (a === 0)
              break A;
            c = 0;
            do
              Q = i[r + c++], A.head && Q && A.length < 65536 && (A.head.comment += String.fromCharCode(Q));
            while (Q && c < a);
            if (A.flags & 512 && A.wrap & 4 && (A.check = EA(A.check, i, c, r)), a -= c, r += c, Q)
              break A;
          } else A.head && (A.head.comment = null);
          A.mode = yi;
        case yi:
          if (A.flags & 512) {
            for (; s < 16; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            if (A.wrap & 4 && o !== (A.check & 65535)) {
              t.msg = "header crc mismatch", A.mode = W;
              break;
            }
            o = 0, s = 0;
          }
          A.head && (A.head.hcrc = A.flags >> 9 & 1, A.head.done = !0), t.adler = A.check = 0, A.mode = DA;
          break;
        case pi:
          for (; s < 32; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          t.adler = A.check = Ui(o), o = 0, s = 0, A.mode = Le;
        case Le:
          if (A.havedict === 0)
            return t.next_out = l, t.avail_out = h, t.next_in = r, t.avail_in = a, A.hold = o, A.bits = s, Qa;
          t.adler = A.check = 1, A.mode = DA;
        case DA:
          if (e === Ea || e === Fe)
            break A;
        case $e:
          if (A.last) {
            o >>>= s & 7, s -= s & 7, A.mode = et;
            break;
          }
          for (; s < 3; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          switch (A.last = o & 1, o >>>= 1, s -= 1, o & 3) {
            case 0:
              A.mode = xi;
              break;
            case 1:
              if (Fa(A), A.mode = ke, e === Fe) {
                o >>>= 2, s -= 2;
                break A;
              }
              break;
            case 2:
              A.mode = Di;
              break;
            case 3:
              t.msg = "invalid block type", A.mode = W;
          }
          o >>>= 2, s -= 2;
          break;
        case xi:
          for (o >>>= s & 7, s -= s & 7; s < 32; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if ((o & 65535) !== (o >>> 16 ^ 65535)) {
            t.msg = "invalid stored block lengths", A.mode = W;
            break;
          }
          if (A.length = o & 65535, o = 0, s = 0, A.mode = At, e === Fe)
            break A;
        case At:
          A.mode = mi;
        case mi:
          if (c = A.length, c) {
            if (c > a && (c = a), c > h && (c = h), c === 0)
              break A;
            n.set(i.subarray(r, r + c), l), a -= c, r += c, h -= c, l += c, A.length -= c;
            break;
          }
          A.mode = DA;
          break;
        case Di:
          for (; s < 14; ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if (A.nlen = (o & 31) + 257, o >>>= 5, s -= 5, A.ndist = (o & 31) + 1, o >>>= 5, s -= 5, A.ncode = (o & 15) + 4, o >>>= 4, s -= 4, A.nlen > 286 || A.ndist > 30) {
            t.msg = "too many length or distance symbols", A.mode = W;
            break;
          }
          A.have = 0, A.mode = Si;
        case Si:
          for (; A.have < A.ncode; ) {
            for (; s < 3; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            A.lens[v[A.have++]] = o & 7, o >>>= 3, s -= 3;
          }
          for (; A.have < 19; )
            A.lens[v[A.have++]] = 0;
          if (A.lencode = A.lendyn, A.lenbits = 7, b = { bits: A.lenbits }, p = se(Ca, A.lens, 0, 19, A.lencode, 0, A.work, b), A.lenbits = b.bits, p) {
            t.msg = "invalid code lengths set", A.mode = W;
            break;
          }
          A.have = 0, A.mode = Fi;
        case Fi:
          for (; A.have < A.nlen + A.ndist; ) {
            for (; B = A.lencode[o & (1 << A.lenbits) - 1], u = B >>> 24, E = B >>> 16 & 255, y = B & 65535, !(u <= s); ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            if (y < 16)
              o >>>= u, s -= u, A.lens[A.have++] = y;
            else {
              if (y === 16) {
                for (S = u + 2; s < S; ) {
                  if (a === 0)
                    break A;
                  a--, o += i[r++] << s, s += 8;
                }
                if (o >>>= u, s -= u, A.have === 0) {
                  t.msg = "invalid bit length repeat", A.mode = W;
                  break;
                }
                Q = A.lens[A.have - 1], c = 3 + (o & 3), o >>>= 2, s -= 2;
              } else if (y === 17) {
                for (S = u + 3; s < S; ) {
                  if (a === 0)
                    break A;
                  a--, o += i[r++] << s, s += 8;
                }
                o >>>= u, s -= u, Q = 0, c = 3 + (o & 7), o >>>= 3, s -= 3;
              } else {
                for (S = u + 7; s < S; ) {
                  if (a === 0)
                    break A;
                  a--, o += i[r++] << s, s += 8;
                }
                o >>>= u, s -= u, Q = 0, c = 11 + (o & 127), o >>>= 7, s -= 7;
              }
              if (A.have + c > A.nlen + A.ndist) {
                t.msg = "invalid bit length repeat", A.mode = W;
                break;
              }
              for (; c--; )
                A.lens[A.have++] = Q;
            }
          }
          if (A.mode === W)
            break;
          if (A.lens[256] === 0) {
            t.msg = "invalid code -- missing end-of-block", A.mode = W;
            break;
          }
          if (A.lenbits = 9, b = { bits: A.lenbits }, p = se(wn, A.lens, 0, A.nlen, A.lencode, 0, A.work, b), A.lenbits = b.bits, p) {
            t.msg = "invalid literal/lengths set", A.mode = W;
            break;
          }
          if (A.distbits = 6, A.distcode = A.distdyn, b = { bits: A.distbits }, p = se(yn, A.lens, A.nlen, A.ndist, A.distcode, 0, A.work, b), A.distbits = b.bits, p) {
            t.msg = "invalid distances set", A.mode = W;
            break;
          }
          if (A.mode = ke, e === Fe)
            break A;
        case ke:
          A.mode = be;
        case be:
          if (a >= 6 && h >= 258) {
            t.next_out = l, t.avail_out = h, t.next_in = r, t.avail_in = a, A.hold = o, A.bits = s, ca(t, I), l = t.next_out, n = t.output, h = t.avail_out, r = t.next_in, i = t.input, a = t.avail_in, o = A.hold, s = A.bits, A.mode === DA && (A.back = -1);
            break;
          }
          for (A.back = 0; B = A.lencode[o & (1 << A.lenbits) - 1], u = B >>> 24, E = B >>> 16 & 255, y = B & 65535, !(u <= s); ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if (E && !(E & 240)) {
            for (d = u, x = E, C = y; B = A.lencode[C + ((o & (1 << d + x) - 1) >> d)], u = B >>> 24, E = B >>> 16 & 255, y = B & 65535, !(d + u <= s); ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            o >>>= d, s -= d, A.back += d;
          }
          if (o >>>= u, s -= u, A.back += u, A.length = y, E === 0) {
            A.mode = vi;
            break;
          }
          if (E & 32) {
            A.back = -1, A.mode = DA;
            break;
          }
          if (E & 64) {
            t.msg = "invalid literal/length code", A.mode = W;
            break;
          }
          A.extra = E & 15, A.mode = ki;
        case ki:
          if (A.extra) {
            for (S = A.extra; s < S; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            A.length += o & (1 << A.extra) - 1, o >>>= A.extra, s -= A.extra, A.back += A.extra;
          }
          A.was = A.length, A.mode = bi;
        case bi:
          for (; B = A.distcode[o & (1 << A.distbits) - 1], u = B >>> 24, E = B >>> 16 & 255, y = B & 65535, !(u <= s); ) {
            if (a === 0)
              break A;
            a--, o += i[r++] << s, s += 8;
          }
          if (!(E & 240)) {
            for (d = u, x = E, C = y; B = A.distcode[C + ((o & (1 << d + x) - 1) >> d)], u = B >>> 24, E = B >>> 16 & 255, y = B & 65535, !(d + u <= s); ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            o >>>= d, s -= d, A.back += d;
          }
          if (o >>>= u, s -= u, A.back += u, E & 64) {
            t.msg = "invalid distance code", A.mode = W;
            break;
          }
          A.offset = y, A.extra = E & 15, A.mode = Mi;
        case Mi:
          if (A.extra) {
            for (S = A.extra; s < S; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            A.offset += o & (1 << A.extra) - 1, o >>>= A.extra, s -= A.extra, A.back += A.extra;
          }
          if (A.offset > A.dmax) {
            t.msg = "invalid distance too far back", A.mode = W;
            break;
          }
          A.mode = Li;
        case Li:
          if (h === 0)
            break A;
          if (c = I - h, A.offset > c) {
            if (c = A.offset - c, c > A.whave && A.sane) {
              t.msg = "invalid distance too far back", A.mode = W;
              break;
            }
            c > A.wnext ? (c -= A.wnext, f = A.wsize - c) : f = A.wnext - c, c > A.length && (c = A.length), w = A.window;
          } else
            w = n, f = l - A.offset, c = A.length;
          c > h && (c = h), h -= c, A.length -= c;
          do
            n[l++] = w[f++];
          while (--c);
          A.length === 0 && (A.mode = be);
          break;
        case vi:
          if (h === 0)
            break A;
          n[l++] = A.length, h--, A.mode = be;
          break;
        case et:
          if (A.wrap) {
            for (; s < 32; ) {
              if (a === 0)
                break A;
              a--, o |= i[r++] << s, s += 8;
            }
            if (I -= h, t.total_out += I, A.total += I, A.wrap & 4 && I && (t.adler = A.check = /*UPDATE_CHECK(state.check, put - _out, _out);*/
            A.flags ? EA(A.check, n, I, l - I) : ut(A.check, n, I, l - I)), I = h, A.wrap & 4 && (A.flags ? o : Ui(o)) !== A.check) {
              t.msg = "incorrect data check", A.mode = W;
              break;
            }
            o = 0, s = 0;
          }
          A.mode = Gi;
        case Gi:
          if (A.wrap && A.flags) {
            for (; s < 32; ) {
              if (a === 0)
                break A;
              a--, o += i[r++] << s, s += 8;
            }
            if (A.wrap & 4 && o !== (A.total & 4294967295)) {
              t.msg = "incorrect length check", A.mode = W;
              break;
            }
            o = 0, s = 0;
          }
          A.mode = Ri;
        case Ri:
          p = da;
          break A;
        case W:
          p = pn;
          break A;
        case mn:
          return xn;
        case Dn:
        default:
          return hA;
      }
  return t.next_out = l, t.avail_out = h, t.next_in = r, t.avail_in = a, A.hold = o, A.bits = s, (A.wsize || I !== t.avail_out && A.mode < W && (A.mode < et || e !== hi)) && Mn(t, t.output, t.next_out, I - t.avail_out), g -= t.avail_in, I -= t.avail_out, t.total_in += g, t.total_out += I, A.total += I, A.wrap & 4 && I && (t.adler = A.check = /*UPDATE_CHECK(state.check, strm.next_out - _out, _out);*/
  A.flags ? EA(A.check, n, I, t.next_out - I) : ut(A.check, n, I, t.next_out - I)), t.data_type = A.bits + (A.last ? 64 : 0) + (A.mode === DA ? 128 : 0) + (A.mode === ke || A.mode === At ? 256 : 0), (g === 0 && I === 0 || e === hi) && p === _A && (p = wa), p;
}, ba = (t) => {
  if (OA(t))
    return hA;
  let e = t.state;
  return e.window && (e.window = null), t.state = null, _A;
}, Ma = (t, e) => {
  if (OA(t))
    return hA;
  const A = t.state;
  return A.wrap & 2 ? (A.head = e, e.done = !1, _A) : hA;
}, La = (t, e) => {
  const A = e.length;
  let i, n, r;
  return OA(t) || (i = t.state, i.wrap !== 0 && i.mode !== Le) ? hA : i.mode === Le && (n = 1, n = ut(n, e, A, 0), n !== i.check) ? pn : (r = Mn(t, e, A, A), r ? (i.mode = mn, xn) : (i.havedict = 1, _A));
};
var va = Fn, Ga = kn, Ra = Sn, Ua = Sa, Ta = bn, _a = ka, Na = ba, Oa = Ma, Ya = La, qa = "pako inflate (from Nodeca project)", bA = {
  inflateReset: va,
  inflateReset2: Ga,
  inflateResetKeep: Ra,
  inflateInit: Ua,
  inflateInit2: Ta,
  inflate: _a,
  inflateEnd: Na,
  inflateGetHeader: Oa,
  inflateSetDictionary: Ya,
  inflateInfo: qa
};
function Pa() {
  this.text = 0, this.time = 0, this.xflags = 0, this.os = 0, this.extra = null, this.extra_len = 0, this.name = "", this.comment = "", this.hcrc = 0, this.done = !1;
}
var Ja = Pa;
const Ln = Object.prototype.toString, {
  Z_NO_FLUSH: Va,
  Z_FINISH: Ha,
  Z_OK: ce,
  Z_STREAM_END: nt,
  Z_NEED_DICT: rt,
  Z_STREAM_ERROR: Ka,
  Z_DATA_ERROR: _i,
  Z_MEM_ERROR: ja
} = En;
function Ue(t) {
  this.options = dn.assign({
    chunkSize: 1024 * 64,
    windowBits: 15,
    to: ""
  }, t || {});
  const e = this.options;
  e.raw && e.windowBits >= 0 && e.windowBits < 16 && (e.windowBits = -e.windowBits, e.windowBits === 0 && (e.windowBits = -15)), e.windowBits >= 0 && e.windowBits < 16 && !(t && t.windowBits) && (e.windowBits += 32), e.windowBits > 15 && e.windowBits < 48 && (e.windowBits & 15 || (e.windowBits |= 15)), this.err = 0, this.msg = "", this.ended = !1, this.chunks = [], this.strm = new la(), this.strm.avail_out = 0;
  let A = bA.inflateInit2(
    this.strm,
    e.windowBits
  );
  if (A !== ce)
    throw new Error(Ct[A]);
  if (this.header = new Ja(), bA.inflateGetHeader(this.strm, this.header), e.dictionary && (typeof e.dictionary == "string" ? e.dictionary = Et.string2buf(e.dictionary) : Ln.call(e.dictionary) === "[object ArrayBuffer]" && (e.dictionary = new Uint8Array(e.dictionary)), e.raw && (A = bA.inflateSetDictionary(this.strm, e.dictionary), A !== ce)))
    throw new Error(Ct[A]);
}
Ue.prototype.push = function(t, e) {
  const A = this.strm, i = this.options.chunkSize, n = this.options.dictionary;
  let r, l, a;
  if (this.ended) return !1;
  for (e === ~~e ? l = e : l = e === !0 ? Ha : Va, Ln.call(t) === "[object ArrayBuffer]" ? A.input = new Uint8Array(t) : A.input = t, A.next_in = 0, A.avail_in = A.input.length; ; ) {
    for (A.avail_out === 0 && (A.output = new Uint8Array(i), A.next_out = 0, A.avail_out = i), r = bA.inflate(A, l), r === rt && n && (r = bA.inflateSetDictionary(A, n), r === ce ? r = bA.inflate(A, l) : r === _i && (r = rt)); A.avail_in > 0 && r === nt && A.state.wrap > 0 && t[A.next_in] !== 0; )
      bA.inflateReset(A), r = bA.inflate(A, l);
    switch (r) {
      case Ka:
      case _i:
      case rt:
      case ja:
        return this.onEnd(r), this.ended = !0, !1;
    }
    if (a = A.avail_out, A.next_out && (A.avail_out === 0 || r === nt))
      if (this.options.to === "string") {
        let h = Et.utf8border(A.output, A.next_out), o = A.next_out - h, s = Et.buf2string(A.output, h);
        A.next_out = o, A.avail_out = i - o, o && A.output.set(A.output.subarray(h, h + o), 0), this.onData(s);
      } else
        this.onData(A.output.length === A.next_out ? A.output : A.output.subarray(0, A.next_out));
    if (!(r === ce && a === 0)) {
      if (r === nt)
        return r = bA.inflateEnd(this.strm), this.onEnd(r), this.ended = !0, !0;
      if (A.avail_in === 0) break;
    }
  }
  return !0;
};
Ue.prototype.onData = function(t) {
  this.chunks.push(t);
};
Ue.prototype.onEnd = function(t) {
  t === ce && (this.options.to === "string" ? this.result = this.chunks.join("") : this.result = dn.flattenChunks(this.chunks)), this.chunks = [], this.err = t, this.msg = this.strm.msg;
};
function Xa(t, e) {
  const A = new Ue(e);
  if (A.push(t), A.err) throw A.msg || Ct[A.err];
  return A.result;
}
var Za = Xa, za = {
  inflate: Za
};
const { inflate: Wa } = za;
var vn = Wa;
class $a extends NA {
  decodeBlock(e) {
    return vn(new Uint8Array(e)).buffer;
  }
}
const Al = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: $a
}, Symbol.toStringTag, { value: "Module" }));
class el extends NA {
  decodeBlock(e) {
    const A = new DataView(e), i = [];
    for (let n = 0; n < e.byteLength; ++n) {
      let r = A.getInt8(n);
      if (r < 0) {
        const l = A.getUint8(n + 1);
        r = -r;
        for (let a = 0; a <= r; ++a)
          i.push(l);
        n += 1;
      } else {
        for (let l = 0; l <= r; ++l)
          i.push(A.getUint8(n + l + 1));
        n += r + 1;
      }
    }
    return new Uint8Array(i).buffer;
  }
}
const tl = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: el
}, Symbol.toStringTag, { value: "Module" }));
var Gn = { exports: {} };
(function(t) {
  /* Copyright 2015-2021 Esri. Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except in compliance with the License. You may obtain a copy of the License at http://www.apache.org/licenses/LICENSE-2.0 @preserve */
  (function() {
    var e = function() {
      var r = {};
      r.defaultNoDataValue = -34027999387901484e22, r.decode = function(g, I) {
        I = I || {};
        var c = I.encodedMaskData || I.encodedMaskData === null, f = o(g, I.inputOffset || 0, c), w = I.noDataValue !== null ? I.noDataValue : r.defaultNoDataValue, B = l(
          f,
          I.pixelType || Float32Array,
          I.encodedMaskData,
          w,
          I.returnMask
        ), u = {
          width: f.width,
          height: f.height,
          pixelData: B.resultPixels,
          minValue: B.minValue,
          maxValue: f.pixels.maxValue,
          noDataValue: w
        };
        return B.resultMask && (u.maskData = B.resultMask), I.returnEncodedMask && f.mask && (u.encodedMaskData = f.mask.bitset ? f.mask.bitset : null), I.returnFileInfo && (u.fileInfo = a(f), I.computeUsedBitDepths && (u.fileInfo.bitDepths = h(f))), u;
      };
      var l = function(g, I, c, f, w) {
        var B = 0, u = g.pixels.numBlocksX, E = g.pixels.numBlocksY, y = Math.floor(g.width / u), d = Math.floor(g.height / E), x = 2 * g.maxZError, C = Number.MAX_VALUE, Q;
        c = c || (g.mask ? g.mask.bitset : null);
        var p, k;
        p = new I(g.width * g.height), w && c && (k = new Uint8Array(g.width * g.height));
        for (var b = new Float32Array(y * d), S, v, L = 0; L <= E; L++) {
          var P = L !== E ? d : g.height % E;
          if (P !== 0)
            for (var M = 0; M <= u; M++) {
              var F = M !== u ? y : g.width % u;
              if (F !== 0) {
                var U = L * g.width * d + M * y, R = g.width - F, T = g.pixels.blocks[B], O, N, H;
                T.encoding < 2 ? (T.encoding === 0 ? O = T.rawData : (s(T.stuffedData, T.bitsPerPixel, T.numValidPixels, T.offset, x, b, g.pixels.maxValue), O = b), N = 0) : T.encoding === 2 ? H = 0 : H = T.offset;
                var X;
                if (c)
                  for (v = 0; v < P; v++) {
                    for (U & 7 && (X = c[U >> 3], X <<= U & 7), S = 0; S < F; S++)
                      U & 7 || (X = c[U >> 3]), X & 128 ? (k && (k[U] = 1), Q = T.encoding < 2 ? O[N++] : H, C = C > Q ? Q : C, p[U++] = Q) : (k && (k[U] = 0), p[U++] = f), X <<= 1;
                    U += R;
                  }
                else if (T.encoding < 2)
                  for (v = 0; v < P; v++) {
                    for (S = 0; S < F; S++)
                      Q = O[N++], C = C > Q ? Q : C, p[U++] = Q;
                    U += R;
                  }
                else
                  for (C = C > H ? H : C, v = 0; v < P; v++) {
                    for (S = 0; S < F; S++)
                      p[U++] = H;
                    U += R;
                  }
                if (T.encoding === 1 && N !== T.numValidPixels)
                  throw "Block and Mask do not match";
                B++;
              }
            }
        }
        return {
          resultPixels: p,
          resultMask: k,
          minValue: C
        };
      }, a = function(g) {
        return {
          fileIdentifierString: g.fileIdentifierString,
          fileVersion: g.fileVersion,
          imageType: g.imageType,
          height: g.height,
          width: g.width,
          maxZError: g.maxZError,
          eofOffset: g.eofOffset,
          mask: g.mask ? {
            numBlocksX: g.mask.numBlocksX,
            numBlocksY: g.mask.numBlocksY,
            numBytes: g.mask.numBytes,
            maxValue: g.mask.maxValue
          } : null,
          pixels: {
            numBlocksX: g.pixels.numBlocksX,
            numBlocksY: g.pixels.numBlocksY,
            numBytes: g.pixels.numBytes,
            maxValue: g.pixels.maxValue,
            noDataValue: g.noDataValue
          }
        };
      }, h = function(g) {
        for (var I = g.pixels.numBlocksX * g.pixels.numBlocksY, c = {}, f = 0; f < I; f++) {
          var w = g.pixels.blocks[f];
          w.encoding === 0 ? c.float32 = !0 : w.encoding === 1 ? c[w.bitsPerPixel] = !0 : c[0] = !0;
        }
        return Object.keys(c);
      }, o = function(g, I, c) {
        var f = {}, w = new Uint8Array(g, I, 10);
        if (f.fileIdentifierString = String.fromCharCode.apply(null, w), f.fileIdentifierString.trim() !== "CntZImage")
          throw "Unexpected file identifier string: " + f.fileIdentifierString;
        I += 10;
        var B = new DataView(g, I, 24);
        if (f.fileVersion = B.getInt32(0, !0), f.imageType = B.getInt32(4, !0), f.height = B.getUint32(8, !0), f.width = B.getUint32(12, !0), f.maxZError = B.getFloat64(16, !0), I += 24, !c)
          if (B = new DataView(g, I, 16), f.mask = {}, f.mask.numBlocksY = B.getUint32(0, !0), f.mask.numBlocksX = B.getUint32(4, !0), f.mask.numBytes = B.getUint32(8, !0), f.mask.maxValue = B.getFloat32(12, !0), I += 16, f.mask.numBytes > 0) {
            var u = new Uint8Array(Math.ceil(f.width * f.height / 8));
            B = new DataView(g, I, f.mask.numBytes);
            var E = B.getInt16(0, !0), y = 2, d = 0;
            do {
              if (E > 0)
                for (; E--; )
                  u[d++] = B.getUint8(y++);
              else {
                var x = B.getUint8(y++);
                for (E = -E; E--; )
                  u[d++] = x;
              }
              E = B.getInt16(y, !0), y += 2;
            } while (y < f.mask.numBytes);
            if (E !== -32768 || d < u.length)
              throw "Unexpected end of mask RLE encoding";
            f.mask.bitset = u, I += f.mask.numBytes;
          } else f.mask.numBytes | f.mask.numBlocksY | f.mask.maxValue || (f.mask.bitset = new Uint8Array(Math.ceil(f.width * f.height / 8)));
        B = new DataView(g, I, 16), f.pixels = {}, f.pixels.numBlocksY = B.getUint32(0, !0), f.pixels.numBlocksX = B.getUint32(4, !0), f.pixels.numBytes = B.getUint32(8, !0), f.pixels.maxValue = B.getFloat32(12, !0), I += 16;
        var C = f.pixels.numBlocksX, Q = f.pixels.numBlocksY, p = C + (f.width % C > 0 ? 1 : 0), k = Q + (f.height % Q > 0 ? 1 : 0);
        f.pixels.blocks = new Array(p * k);
        for (var b = 0, S = 0; S < k; S++)
          for (var v = 0; v < p; v++) {
            var L = 0, P = g.byteLength - I;
            B = new DataView(g, I, Math.min(10, P));
            var M = {};
            f.pixels.blocks[b++] = M;
            var F = B.getUint8(0);
            if (L++, M.encoding = F & 63, M.encoding > 3)
              throw "Invalid block encoding (" + M.encoding + ")";
            if (M.encoding === 2) {
              I++;
              continue;
            }
            if (F !== 0 && F !== 2) {
              if (F >>= 6, M.offsetType = F, F === 2)
                M.offset = B.getInt8(1), L++;
              else if (F === 1)
                M.offset = B.getInt16(1, !0), L += 2;
              else if (F === 0)
                M.offset = B.getFloat32(1, !0), L += 4;
              else
                throw "Invalid block offset type";
              if (M.encoding === 1)
                if (F = B.getUint8(L), L++, M.bitsPerPixel = F & 63, F >>= 6, M.numValidPixelsType = F, F === 2)
                  M.numValidPixels = B.getUint8(L), L++;
                else if (F === 1)
                  M.numValidPixels = B.getUint16(L, !0), L += 2;
                else if (F === 0)
                  M.numValidPixels = B.getUint32(L, !0), L += 4;
                else
                  throw "Invalid valid pixel count type";
            }
            if (I += L, M.encoding !== 3) {
              var U, R;
              if (M.encoding === 0) {
                var T = (f.pixels.numBytes - 1) / 4;
                if (T !== Math.floor(T))
                  throw "uncompressed block has invalid length";
                U = new ArrayBuffer(T * 4), R = new Uint8Array(U), R.set(new Uint8Array(g, I, T * 4));
                var O = new Float32Array(U);
                M.rawData = O, I += T * 4;
              } else if (M.encoding === 1) {
                var N = Math.ceil(M.numValidPixels * M.bitsPerPixel / 8), H = Math.ceil(N / 4);
                U = new ArrayBuffer(H * 4), R = new Uint8Array(U), R.set(new Uint8Array(g, I, N)), M.stuffedData = new Uint32Array(U), I += N;
              }
            }
          }
        return f.eofOffset = I, f;
      }, s = function(g, I, c, f, w, B, u) {
        var E = (1 << I) - 1, y = 0, d, x = 0, C, Q, p = Math.ceil((u - f) / w), k = g.length * 4 - Math.ceil(I * c / 8);
        for (g[g.length - 1] <<= 8 * k, d = 0; d < c; d++) {
          if (x === 0 && (Q = g[y++], x = 32), x >= I)
            C = Q >>> x - I & E, x -= I;
          else {
            var b = I - x;
            C = (Q & E) << b & E, Q = g[y++], x = 32 - b, C += Q >>> x;
          }
          B[d] = C < p ? f + C * w : u;
        }
        return B;
      };
      return r;
    }(), A = /* @__PURE__ */ function() {
      var r = {
        //methods ending with 2 are for the new byte order used by Lerc2.3 and above.
        //originalUnstuff is used to unpack Huffman code table. code is duplicated to unstuffx for performance reasons.
        unstuff: function(o, s, g, I, c, f, w, B) {
          var u = (1 << g) - 1, E = 0, y, d = 0, x, C, Q, p, k = o.length * 4 - Math.ceil(g * I / 8);
          if (o[o.length - 1] <<= 8 * k, c)
            for (y = 0; y < I; y++)
              d === 0 && (C = o[E++], d = 32), d >= g ? (x = C >>> d - g & u, d -= g) : (Q = g - d, x = (C & u) << Q & u, C = o[E++], d = 32 - Q, x += C >>> d), s[y] = c[x];
          else
            for (p = Math.ceil((B - f) / w), y = 0; y < I; y++)
              d === 0 && (C = o[E++], d = 32), d >= g ? (x = C >>> d - g & u, d -= g) : (Q = g - d, x = (C & u) << Q & u, C = o[E++], d = 32 - Q, x += C >>> d), s[y] = x < p ? f + x * w : B;
        },
        unstuffLUT: function(o, s, g, I, c, f) {
          var w = (1 << s) - 1, B = 0, u = 0, E = 0, y = 0, d = 0, x, C = [], Q = o.length * 4 - Math.ceil(s * g / 8);
          o[o.length - 1] <<= 8 * Q;
          var p = Math.ceil((f - I) / c);
          for (u = 0; u < g; u++)
            y === 0 && (x = o[B++], y = 32), y >= s ? (d = x >>> y - s & w, y -= s) : (E = s - y, d = (x & w) << E & w, x = o[B++], y = 32 - E, d += x >>> y), C[u] = d < p ? I + d * c : f;
          return C.unshift(I), C;
        },
        unstuff2: function(o, s, g, I, c, f, w, B) {
          var u = (1 << g) - 1, E = 0, y, d = 0, x = 0, C, Q, p;
          if (c)
            for (y = 0; y < I; y++)
              d === 0 && (Q = o[E++], d = 32, x = 0), d >= g ? (C = Q >>> x & u, d -= g, x += g) : (p = g - d, C = Q >>> x & u, Q = o[E++], d = 32 - p, C |= (Q & (1 << p) - 1) << g - p, x = p), s[y] = c[C];
          else {
            var k = Math.ceil((B - f) / w);
            for (y = 0; y < I; y++)
              d === 0 && (Q = o[E++], d = 32, x = 0), d >= g ? (C = Q >>> x & u, d -= g, x += g) : (p = g - d, C = Q >>> x & u, Q = o[E++], d = 32 - p, C |= (Q & (1 << p) - 1) << g - p, x = p), s[y] = C < k ? f + C * w : B;
          }
          return s;
        },
        unstuffLUT2: function(o, s, g, I, c, f) {
          var w = (1 << s) - 1, B = 0, u = 0, E = 0, y = 0, d = 0, x = 0, C, Q = [], p = Math.ceil((f - I) / c);
          for (u = 0; u < g; u++)
            y === 0 && (C = o[B++], y = 32, x = 0), y >= s ? (d = C >>> x & w, y -= s, x += s) : (E = s - y, d = C >>> x & w, C = o[B++], y = 32 - E, d |= (C & (1 << E) - 1) << s - E, x = E), Q[u] = d < p ? I + d * c : f;
          return Q.unshift(I), Q;
        },
        originalUnstuff: function(o, s, g, I) {
          var c = (1 << g) - 1, f = 0, w, B = 0, u, E, y, d = o.length * 4 - Math.ceil(g * I / 8);
          for (o[o.length - 1] <<= 8 * d, w = 0; w < I; w++)
            B === 0 && (E = o[f++], B = 32), B >= g ? (u = E >>> B - g & c, B -= g) : (y = g - B, u = (E & c) << y & c, E = o[f++], B = 32 - y, u += E >>> B), s[w] = u;
          return s;
        },
        originalUnstuff2: function(o, s, g, I) {
          var c = (1 << g) - 1, f = 0, w, B = 0, u = 0, E, y, d;
          for (w = 0; w < I; w++)
            B === 0 && (y = o[f++], B = 32, u = 0), B >= g ? (E = y >>> u & c, B -= g, u += g) : (d = g - B, E = y >>> u & c, y = o[f++], B = 32 - d, E |= (y & (1 << d) - 1) << g - d, u = d), s[w] = E;
          return s;
        }
      }, l = {
        HUFFMAN_LUT_BITS_MAX: 12,
        //use 2^12 lut, treat it like constant
        computeChecksumFletcher32: function(o) {
          for (var s = 65535, g = 65535, I = o.length, c = Math.floor(I / 2), f = 0; c; ) {
            var w = c >= 359 ? 359 : c;
            c -= w;
            do
              s += o[f++] << 8, g += s += o[f++];
            while (--w);
            s = (s & 65535) + (s >>> 16), g = (g & 65535) + (g >>> 16);
          }
          return I & 1 && (g += s += o[f] << 8), s = (s & 65535) + (s >>> 16), g = (g & 65535) + (g >>> 16), (g << 16 | s) >>> 0;
        },
        readHeaderInfo: function(o, s) {
          var g = s.ptr, I = new Uint8Array(o, g, 6), c = {};
          if (c.fileIdentifierString = String.fromCharCode.apply(null, I), c.fileIdentifierString.lastIndexOf("Lerc2", 0) !== 0)
            throw "Unexpected file identifier string (expect Lerc2 ): " + c.fileIdentifierString;
          g += 6;
          var f = new DataView(o, g, 8), w = f.getInt32(0, !0);
          c.fileVersion = w, g += 4, w >= 3 && (c.checksum = f.getUint32(4, !0), g += 4), f = new DataView(o, g, 12), c.height = f.getUint32(0, !0), c.width = f.getUint32(4, !0), g += 8, w >= 4 ? (c.numDims = f.getUint32(8, !0), g += 4) : c.numDims = 1, f = new DataView(o, g, 40), c.numValidPixel = f.getUint32(0, !0), c.microBlockSize = f.getInt32(4, !0), c.blobSize = f.getInt32(8, !0), c.imageType = f.getInt32(12, !0), c.maxZError = f.getFloat64(16, !0), c.zMin = f.getFloat64(24, !0), c.zMax = f.getFloat64(32, !0), g += 40, s.headerInfo = c, s.ptr = g;
          var B, u;
          if (w >= 3 && (u = w >= 4 ? 52 : 48, B = this.computeChecksumFletcher32(new Uint8Array(o, g - u, c.blobSize - 14)), B !== c.checksum))
            throw "Checksum failed.";
          return !0;
        },
        checkMinMaxRanges: function(o, s) {
          var g = s.headerInfo, I = this.getDataTypeArray(g.imageType), c = g.numDims * this.getDataTypeSize(g.imageType), f = this.readSubArray(o, s.ptr, I, c), w = this.readSubArray(o, s.ptr + c, I, c);
          s.ptr += 2 * c;
          var B, u = !0;
          for (B = 0; B < g.numDims; B++)
            if (f[B] !== w[B]) {
              u = !1;
              break;
            }
          return g.minValues = f, g.maxValues = w, u;
        },
        readSubArray: function(o, s, g, I) {
          var c;
          if (g === Uint8Array)
            c = new Uint8Array(o, s, I);
          else {
            var f = new ArrayBuffer(I), w = new Uint8Array(f);
            w.set(new Uint8Array(o, s, I)), c = new g(f);
          }
          return c;
        },
        readMask: function(o, s) {
          var g = s.ptr, I = s.headerInfo, c = I.width * I.height, f = I.numValidPixel, w = new DataView(o, g, 4), B = {};
          if (B.numBytes = w.getUint32(0, !0), g += 4, (f === 0 || c === f) && B.numBytes !== 0)
            throw "invalid mask";
          var u, E;
          if (f === 0)
            u = new Uint8Array(Math.ceil(c / 8)), B.bitset = u, E = new Uint8Array(c), s.pixels.resultMask = E, g += B.numBytes;
          else if (B.numBytes > 0) {
            u = new Uint8Array(Math.ceil(c / 8)), w = new DataView(o, g, B.numBytes);
            var y = w.getInt16(0, !0), d = 2, x = 0, C = 0;
            do {
              if (y > 0)
                for (; y--; )
                  u[x++] = w.getUint8(d++);
              else
                for (C = w.getUint8(d++), y = -y; y--; )
                  u[x++] = C;
              y = w.getInt16(d, !0), d += 2;
            } while (d < B.numBytes);
            if (y !== -32768 || x < u.length)
              throw "Unexpected end of mask RLE encoding";
            E = new Uint8Array(c);
            var Q = 0, p = 0;
            for (p = 0; p < c; p++)
              p & 7 ? (Q = u[p >> 3], Q <<= p & 7) : Q = u[p >> 3], Q & 128 && (E[p] = 1);
            s.pixels.resultMask = E, B.bitset = u, g += B.numBytes;
          }
          return s.ptr = g, s.mask = B, !0;
        },
        readDataOneSweep: function(o, s, g, I) {
          var c = s.ptr, f = s.headerInfo, w = f.numDims, B = f.width * f.height, u = f.imageType, E = f.numValidPixel * l.getDataTypeSize(u) * w, y, d = s.pixels.resultMask;
          if (g === Uint8Array)
            y = new Uint8Array(o, c, E);
          else {
            var x = new ArrayBuffer(E), C = new Uint8Array(x);
            C.set(new Uint8Array(o, c, E)), y = new g(x);
          }
          if (y.length === B * w)
            I ? s.pixels.resultPixels = l.swapDimensionOrder(y, B, w, g, !0) : s.pixels.resultPixels = y;
          else {
            s.pixels.resultPixels = new g(B * w);
            var Q = 0, p = 0, k = 0, b = 0;
            if (w > 1) {
              if (I) {
                for (p = 0; p < B; p++)
                  if (d[p])
                    for (b = p, k = 0; k < w; k++, b += B)
                      s.pixels.resultPixels[b] = y[Q++];
              } else
                for (p = 0; p < B; p++)
                  if (d[p])
                    for (b = p * w, k = 0; k < w; k++)
                      s.pixels.resultPixels[b + k] = y[Q++];
            } else
              for (p = 0; p < B; p++)
                d[p] && (s.pixels.resultPixels[p] = y[Q++]);
          }
          return c += E, s.ptr = c, !0;
        },
        readHuffmanTree: function(o, s) {
          var g = this.HUFFMAN_LUT_BITS_MAX, I = new DataView(o, s.ptr, 16);
          s.ptr += 16;
          var c = I.getInt32(0, !0);
          if (c < 2)
            throw "unsupported Huffman version";
          var f = I.getInt32(4, !0), w = I.getInt32(8, !0), B = I.getInt32(12, !0);
          if (w >= B)
            return !1;
          var u = new Uint32Array(B - w);
          l.decodeBits(o, s, u);
          var E = [], y, d, x, C;
          for (y = w; y < B; y++)
            d = y - (y < f ? 0 : f), E[d] = { first: u[y - w], second: null };
          var Q = o.byteLength - s.ptr, p = Math.ceil(Q / 4), k = new ArrayBuffer(p * 4), b = new Uint8Array(k);
          b.set(new Uint8Array(o, s.ptr, Q));
          var S = new Uint32Array(k), v = 0, L, P = 0;
          for (L = S[0], y = w; y < B; y++)
            d = y - (y < f ? 0 : f), C = E[d].first, C > 0 && (E[d].second = L << v >>> 32 - C, 32 - v >= C ? (v += C, v === 32 && (v = 0, P++, L = S[P])) : (v += C - 32, P++, L = S[P], E[d].second |= L >>> 32 - v));
          var M = 0, F = 0, U = new a();
          for (y = 0; y < E.length; y++)
            E[y] !== void 0 && (M = Math.max(M, E[y].first));
          M >= g ? F = g : F = M;
          var R = [], T, O, N, H, X, _;
          for (y = w; y < B; y++)
            if (d = y - (y < f ? 0 : f), C = E[d].first, C > 0)
              if (T = [C, d], C <= F)
                for (O = E[d].second << F - C, N = 1 << F - C, x = 0; x < N; x++)
                  R[O | x] = T;
              else
                for (O = E[d].second, _ = U, H = C - 1; H >= 0; H--)
                  X = O >>> H & 1, X ? (_.right || (_.right = new a()), _ = _.right) : (_.left || (_.left = new a()), _ = _.left), H === 0 && !_.val && (_.val = T[1]);
          return {
            decodeLut: R,
            numBitsLUTQick: F,
            numBitsLUT: M,
            tree: U,
            stuffedData: S,
            srcPtr: P,
            bitPos: v
          };
        },
        readHuffman: function(o, s, g, I) {
          var c = s.headerInfo, f = c.numDims, w = s.headerInfo.height, B = s.headerInfo.width, u = B * w, E = this.readHuffmanTree(o, s), y = E.decodeLut, d = E.tree, x = E.stuffedData, C = E.srcPtr, Q = E.bitPos, p = E.numBitsLUTQick, k = E.numBitsLUT, b = s.headerInfo.imageType === 0 ? 128 : 0, S, v, L, P = s.pixels.resultMask, M, F, U, R, T, O, N, H = 0;
          Q > 0 && (C++, Q = 0);
          var X = x[C], _ = s.encodeMode === 1, q = new g(u * f), Y = q, V;
          if (f < 2 || _) {
            for (V = 0; V < f; V++)
              if (f > 1 && (Y = new g(q.buffer, u * V, u), H = 0), s.headerInfo.numValidPixel === B * w)
                for (O = 0, R = 0; R < w; R++)
                  for (T = 0; T < B; T++, O++) {
                    if (v = 0, M = X << Q >>> 32 - p, F = M, 32 - Q < p && (M |= x[C + 1] >>> 64 - Q - p, F = M), y[F])
                      v = y[F][1], Q += y[F][0];
                    else
                      for (M = X << Q >>> 32 - k, F = M, 32 - Q < k && (M |= x[C + 1] >>> 64 - Q - k, F = M), S = d, N = 0; N < k; N++)
                        if (U = M >>> k - N - 1 & 1, S = U ? S.right : S.left, !(S.left || S.right)) {
                          v = S.val, Q = Q + N + 1;
                          break;
                        }
                    Q >= 32 && (Q -= 32, C++, X = x[C]), L = v - b, _ ? (T > 0 ? L += H : R > 0 ? L += Y[O - B] : L += H, L &= 255, Y[O] = L, H = L) : Y[O] = L;
                  }
              else
                for (O = 0, R = 0; R < w; R++)
                  for (T = 0; T < B; T++, O++)
                    if (P[O]) {
                      if (v = 0, M = X << Q >>> 32 - p, F = M, 32 - Q < p && (M |= x[C + 1] >>> 64 - Q - p, F = M), y[F])
                        v = y[F][1], Q += y[F][0];
                      else
                        for (M = X << Q >>> 32 - k, F = M, 32 - Q < k && (M |= x[C + 1] >>> 64 - Q - k, F = M), S = d, N = 0; N < k; N++)
                          if (U = M >>> k - N - 1 & 1, S = U ? S.right : S.left, !(S.left || S.right)) {
                            v = S.val, Q = Q + N + 1;
                            break;
                          }
                      Q >= 32 && (Q -= 32, C++, X = x[C]), L = v - b, _ ? (T > 0 && P[O - 1] ? L += H : R > 0 && P[O - B] ? L += Y[O - B] : L += H, L &= 255, Y[O] = L, H = L) : Y[O] = L;
                    }
          } else
            for (O = 0, R = 0; R < w; R++)
              for (T = 0; T < B; T++)
                if (O = R * B + T, !P || P[O])
                  for (V = 0; V < f; V++, O += u) {
                    if (v = 0, M = X << Q >>> 32 - p, F = M, 32 - Q < p && (M |= x[C + 1] >>> 64 - Q - p, F = M), y[F])
                      v = y[F][1], Q += y[F][0];
                    else
                      for (M = X << Q >>> 32 - k, F = M, 32 - Q < k && (M |= x[C + 1] >>> 64 - Q - k, F = M), S = d, N = 0; N < k; N++)
                        if (U = M >>> k - N - 1 & 1, S = U ? S.right : S.left, !(S.left || S.right)) {
                          v = S.val, Q = Q + N + 1;
                          break;
                        }
                    Q >= 32 && (Q -= 32, C++, X = x[C]), L = v - b, Y[O] = L;
                  }
          s.ptr = s.ptr + (C + 1) * 4 + (Q > 0 ? 4 : 0), s.pixels.resultPixels = q, f > 1 && !I && (s.pixels.resultPixels = l.swapDimensionOrder(q, u, f, g));
        },
        decodeBits: function(o, s, g, I, c) {
          {
            var f = s.headerInfo, w = f.fileVersion, B = 0, u = o.byteLength - s.ptr >= 5 ? 5 : o.byteLength - s.ptr, E = new DataView(o, s.ptr, u), y = E.getUint8(0);
            B++;
            var d = y >> 6, x = d === 0 ? 4 : 3 - d, C = (y & 32) > 0, Q = y & 31, p = 0;
            if (x === 1)
              p = E.getUint8(B), B++;
            else if (x === 2)
              p = E.getUint16(B, !0), B += 2;
            else if (x === 4)
              p = E.getUint32(B, !0), B += 4;
            else
              throw "Invalid valid pixel count type";
            var k = 2 * f.maxZError, b, S, v, L, P, M, F, U, R, T = f.numDims > 1 ? f.maxValues[c] : f.zMax;
            if (C) {
              for (s.counter.lut++, U = E.getUint8(B), B++, L = Math.ceil((U - 1) * Q / 8), P = Math.ceil(L / 4), S = new ArrayBuffer(P * 4), v = new Uint8Array(S), s.ptr += B, v.set(new Uint8Array(o, s.ptr, L)), F = new Uint32Array(S), s.ptr += L, R = 0; U - 1 >>> R; )
                R++;
              L = Math.ceil(p * R / 8), P = Math.ceil(L / 4), S = new ArrayBuffer(P * 4), v = new Uint8Array(S), v.set(new Uint8Array(o, s.ptr, L)), b = new Uint32Array(S), s.ptr += L, w >= 3 ? M = r.unstuffLUT2(F, Q, U - 1, I, k, T) : M = r.unstuffLUT(F, Q, U - 1, I, k, T), w >= 3 ? r.unstuff2(b, g, R, p, M) : r.unstuff(b, g, R, p, M);
            } else
              s.counter.bitstuffer++, R = Q, s.ptr += B, R > 0 && (L = Math.ceil(p * R / 8), P = Math.ceil(L / 4), S = new ArrayBuffer(P * 4), v = new Uint8Array(S), v.set(new Uint8Array(o, s.ptr, L)), b = new Uint32Array(S), s.ptr += L, w >= 3 ? I == null ? r.originalUnstuff2(b, g, R, p) : r.unstuff2(b, g, R, p, !1, I, k, T) : I == null ? r.originalUnstuff(b, g, R, p) : r.unstuff(b, g, R, p, !1, I, k, T));
          }
        },
        readTiles: function(o, s, g, I) {
          var c = s.headerInfo, f = c.width, w = c.height, B = f * w, u = c.microBlockSize, E = c.imageType, y = l.getDataTypeSize(E), d = Math.ceil(f / u), x = Math.ceil(w / u);
          s.pixels.numBlocksY = x, s.pixels.numBlocksX = d, s.pixels.ptr = 0;
          var C = 0, Q = 0, p = 0, k = 0, b = 0, S = 0, v = 0, L = 0, P = 0, M = 0, F = 0, U = 0, R = 0, T = 0, O = 0, N = 0, H, X, _, q, Y, V, j = new g(u * u), z = w % u || u, $ = f % u || u, tA, iA, YA = c.numDims, BA, lA = s.pixels.resultMask, nA = s.pixels.resultPixels, Te = c.fileVersion, he = Te >= 5 ? 14 : 15, IA, TA = c.zMax, oA;
          for (p = 0; p < x; p++)
            for (b = p !== x - 1 ? u : z, k = 0; k < d; k++)
              for (S = k !== d - 1 ? u : $, F = p * f * u + k * u, U = f - S, BA = 0; BA < YA; BA++) {
                if (YA > 1 ? (oA = nA, F = p * f * u + k * u, nA = new g(s.pixels.resultPixels.buffer, B * BA * y, B), TA = c.maxValues[BA]) : oA = null, v = o.byteLength - s.ptr, H = new DataView(o, s.ptr, Math.min(10, v)), X = {}, N = 0, L = H.getUint8(0), N++, IA = c.fileVersion >= 5 ? L & 4 : 0, P = L >> 6 & 255, M = L >> 2 & he, M !== (k * u >> 3 & he) || IA && BA === 0)
                  throw "integrity issue";
                if (V = L & 3, V > 3)
                  throw s.ptr += N, "Invalid block encoding (" + V + ")";
                if (V === 2) {
                  if (IA)
                    if (lA)
                      for (C = 0; C < b; C++)
                        for (Q = 0; Q < S; Q++)
                          lA[F] && (nA[F] = oA[F]), F++;
                    else
                      for (C = 0; C < b; C++)
                        for (Q = 0; Q < S; Q++)
                          nA[F] = oA[F], F++;
                  s.counter.constant++, s.ptr += N;
                  continue;
                } else if (V === 0) {
                  if (IA)
                    throw "integrity issue";
                  if (s.counter.uncompressed++, s.ptr += N, R = b * S * y, T = o.byteLength - s.ptr, R = R < T ? R : T, _ = new ArrayBuffer(R % y === 0 ? R : R + y - R % y), q = new Uint8Array(_), q.set(new Uint8Array(o, s.ptr, R)), Y = new g(_), O = 0, lA)
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        lA[F] && (nA[F] = Y[O++]), F++;
                      F += U;
                    }
                  else
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        nA[F++] = Y[O++];
                      F += U;
                    }
                  s.ptr += O * y;
                } else if (tA = l.getDataTypeUsed(IA && E < 6 ? 4 : E, P), iA = l.getOnePixel(X, N, tA, H), N += l.getDataTypeSize(tA), V === 3)
                  if (s.ptr += N, s.counter.constantoffset++, lA)
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        lA[F] && (nA[F] = IA ? Math.min(TA, oA[F] + iA) : iA), F++;
                      F += U;
                    }
                  else
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        nA[F] = IA ? Math.min(TA, oA[F] + iA) : iA, F++;
                      F += U;
                    }
                else if (s.ptr += N, l.decodeBits(o, s, j, iA, BA), N = 0, IA)
                  if (lA)
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        lA[F] && (nA[F] = j[N++] + oA[F]), F++;
                      F += U;
                    }
                  else
                    for (C = 0; C < b; C++) {
                      for (Q = 0; Q < S; Q++)
                        nA[F] = j[N++] + oA[F], F++;
                      F += U;
                    }
                else if (lA)
                  for (C = 0; C < b; C++) {
                    for (Q = 0; Q < S; Q++)
                      lA[F] && (nA[F] = j[N++]), F++;
                    F += U;
                  }
                else
                  for (C = 0; C < b; C++) {
                    for (Q = 0; Q < S; Q++)
                      nA[F++] = j[N++];
                    F += U;
                  }
              }
          YA > 1 && !I && (s.pixels.resultPixels = l.swapDimensionOrder(s.pixels.resultPixels, B, YA, g));
        },
        /*****************
        *  private methods (helper methods)
        *****************/
        formatFileInfo: function(o) {
          return {
            fileIdentifierString: o.headerInfo.fileIdentifierString,
            fileVersion: o.headerInfo.fileVersion,
            imageType: o.headerInfo.imageType,
            height: o.headerInfo.height,
            width: o.headerInfo.width,
            numValidPixel: o.headerInfo.numValidPixel,
            microBlockSize: o.headerInfo.microBlockSize,
            blobSize: o.headerInfo.blobSize,
            maxZError: o.headerInfo.maxZError,
            pixelType: l.getPixelType(o.headerInfo.imageType),
            eofOffset: o.eofOffset,
            mask: o.mask ? {
              numBytes: o.mask.numBytes
            } : null,
            pixels: {
              numBlocksX: o.pixels.numBlocksX,
              numBlocksY: o.pixels.numBlocksY,
              //"numBytes": data.pixels.numBytes,
              maxValue: o.headerInfo.zMax,
              minValue: o.headerInfo.zMin,
              noDataValue: o.noDataValue
            }
          };
        },
        constructConstantSurface: function(o, s) {
          var g = o.headerInfo.zMax, I = o.headerInfo.zMin, c = o.headerInfo.maxValues, f = o.headerInfo.numDims, w = o.headerInfo.height * o.headerInfo.width, B = 0, u = 0, E = 0, y = o.pixels.resultMask, d = o.pixels.resultPixels;
          if (y)
            if (f > 1) {
              if (s)
                for (B = 0; B < f; B++)
                  for (E = B * w, g = c[B], u = 0; u < w; u++)
                    y[u] && (d[E + u] = g);
              else
                for (u = 0; u < w; u++)
                  if (y[u])
                    for (E = u * f, B = 0; B < f; B++)
                      d[E + f] = c[B];
            } else
              for (u = 0; u < w; u++)
                y[u] && (d[u] = g);
          else if (f > 1 && I !== g)
            if (s)
              for (B = 0; B < f; B++)
                for (E = B * w, g = c[B], u = 0; u < w; u++)
                  d[E + u] = g;
            else
              for (u = 0; u < w; u++)
                for (E = u * f, B = 0; B < f; B++)
                  d[E + B] = c[B];
          else
            for (u = 0; u < w * f; u++)
              d[u] = g;
        },
        getDataTypeArray: function(o) {
          var s;
          switch (o) {
            case 0:
              s = Int8Array;
              break;
            case 1:
              s = Uint8Array;
              break;
            case 2:
              s = Int16Array;
              break;
            case 3:
              s = Uint16Array;
              break;
            case 4:
              s = Int32Array;
              break;
            case 5:
              s = Uint32Array;
              break;
            case 6:
              s = Float32Array;
              break;
            case 7:
              s = Float64Array;
              break;
            default:
              s = Float32Array;
          }
          return s;
        },
        getPixelType: function(o) {
          var s;
          switch (o) {
            case 0:
              s = "S8";
              break;
            case 1:
              s = "U8";
              break;
            case 2:
              s = "S16";
              break;
            case 3:
              s = "U16";
              break;
            case 4:
              s = "S32";
              break;
            case 5:
              s = "U32";
              break;
            case 6:
              s = "F32";
              break;
            case 7:
              s = "F64";
              break;
            default:
              s = "F32";
          }
          return s;
        },
        isValidPixelValue: function(o, s) {
          if (s == null)
            return !1;
          var g;
          switch (o) {
            case 0:
              g = s >= -128 && s <= 127;
              break;
            case 1:
              g = s >= 0 && s <= 255;
              break;
            case 2:
              g = s >= -32768 && s <= 32767;
              break;
            case 3:
              g = s >= 0 && s <= 65536;
              break;
            case 4:
              g = s >= -2147483648 && s <= 2147483647;
              break;
            case 5:
              g = s >= 0 && s <= 4294967296;
              break;
            case 6:
              g = s >= -34027999387901484e22 && s <= 34027999387901484e22;
              break;
            case 7:
              g = s >= -17976931348623157e292 && s <= 17976931348623157e292;
              break;
            default:
              g = !1;
          }
          return g;
        },
        getDataTypeSize: function(o) {
          var s = 0;
          switch (o) {
            case 0:
            case 1:
              s = 1;
              break;
            case 2:
            case 3:
              s = 2;
              break;
            case 4:
            case 5:
            case 6:
              s = 4;
              break;
            case 7:
              s = 8;
              break;
            default:
              s = o;
          }
          return s;
        },
        getDataTypeUsed: function(o, s) {
          var g = o;
          switch (o) {
            case 2:
            case 4:
              g = o - s;
              break;
            case 3:
            case 5:
              g = o - 2 * s;
              break;
            case 6:
              s === 0 ? g = o : s === 1 ? g = 2 : g = 1;
              break;
            case 7:
              s === 0 ? g = o : g = o - 2 * s + 1;
              break;
            default:
              g = o;
              break;
          }
          return g;
        },
        getOnePixel: function(o, s, g, I) {
          var c = 0;
          switch (g) {
            case 0:
              c = I.getInt8(s);
              break;
            case 1:
              c = I.getUint8(s);
              break;
            case 2:
              c = I.getInt16(s, !0);
              break;
            case 3:
              c = I.getUint16(s, !0);
              break;
            case 4:
              c = I.getInt32(s, !0);
              break;
            case 5:
              c = I.getUInt32(s, !0);
              break;
            case 6:
              c = I.getFloat32(s, !0);
              break;
            case 7:
              c = I.getFloat64(s, !0);
              break;
            default:
              throw "the decoder does not understand this pixel type";
          }
          return c;
        },
        swapDimensionOrder: function(o, s, g, I, c) {
          var f = 0, w = 0, B = 0, u = 0, E = o;
          if (g > 1)
            if (E = new I(s * g), c)
              for (f = 0; f < s; f++)
                for (u = f, B = 0; B < g; B++, u += s)
                  E[u] = o[w++];
            else
              for (f = 0; f < s; f++)
                for (u = f, B = 0; B < g; B++, u += s)
                  E[w++] = o[u];
          return E;
        }
      }, a = function(o, s, g) {
        this.val = o, this.left = s, this.right = g;
      }, h = {
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
        decode: function(o, s) {
          s = s || {};
          var g = s.noDataValue, I = 0, c = {};
          if (c.ptr = s.inputOffset || 0, c.pixels = {}, !!l.readHeaderInfo(o, c)) {
            var f = c.headerInfo, w = f.fileVersion, B = l.getDataTypeArray(f.imageType);
            if (w > 5)
              throw "unsupported lerc version 2." + w;
            l.readMask(o, c), f.numValidPixel !== f.width * f.height && !c.pixels.resultMask && (c.pixels.resultMask = s.maskData);
            var u = f.width * f.height;
            c.pixels.resultPixels = new B(u * f.numDims), c.counter = {
              onesweep: 0,
              uncompressed: 0,
              lut: 0,
              bitstuffer: 0,
              constant: 0,
              constantoffset: 0
            };
            var E = !s.returnPixelInterleavedDims;
            if (f.numValidPixel !== 0)
              if (f.zMax === f.zMin)
                l.constructConstantSurface(c, E);
              else if (w >= 4 && l.checkMinMaxRanges(o, c))
                l.constructConstantSurface(c, E);
              else {
                var y = new DataView(o, c.ptr, 2), d = y.getUint8(0);
                if (c.ptr++, d)
                  l.readDataOneSweep(o, c, B, E);
                else if (w > 1 && f.imageType <= 1 && Math.abs(f.maxZError - 0.5) < 1e-5) {
                  var x = y.getUint8(1);
                  if (c.ptr++, c.encodeMode = x, x > 2 || w < 4 && x > 1)
                    throw "Invalid Huffman flag " + x;
                  x ? l.readHuffman(o, c, B, E) : l.readTiles(o, c, B, E);
                } else
                  l.readTiles(o, c, B, E);
              }
            c.eofOffset = c.ptr;
            var C;
            s.inputOffset ? (C = c.headerInfo.blobSize + s.inputOffset - c.ptr, Math.abs(C) >= 1 && (c.eofOffset = s.inputOffset + c.headerInfo.blobSize)) : (C = c.headerInfo.blobSize - c.ptr, Math.abs(C) >= 1 && (c.eofOffset = c.headerInfo.blobSize));
            var Q = {
              width: f.width,
              height: f.height,
              pixelData: c.pixels.resultPixels,
              minValue: f.zMin,
              maxValue: f.zMax,
              validPixelCount: f.numValidPixel,
              dimCount: f.numDims,
              dimStats: {
                minValues: f.minValues,
                maxValues: f.maxValues
              },
              maskData: c.pixels.resultMask
              //noDataValue: noDataValue
            };
            if (c.pixels.resultMask && l.isValidPixelValue(f.imageType, g)) {
              var p = c.pixels.resultMask;
              for (I = 0; I < u; I++)
                p[I] || (Q.pixelData[I] = g);
              Q.noDataValue = g;
            }
            return c.noDataValue = g, s.returnFileInfo && (Q.fileInfo = l.formatFileInfo(c)), Q;
          }
        },
        getBandCount: function(o) {
          var s = 0, g = 0, I = {};
          for (I.ptr = 0, I.pixels = {}; g < o.byteLength - 58; )
            l.readHeaderInfo(o, I), g += I.headerInfo.blobSize, s++, I.ptr = g;
          return s;
        }
      };
      return h;
    }(), i = function() {
      var r = new ArrayBuffer(4), l = new Uint8Array(r), a = new Uint32Array(r);
      return a[0] = 1, l[0] === 1;
    }(), n = {
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
      decode: function(r, l) {
        if (!i)
          throw "Big endian system is not supported.";
        l = l || {};
        var a = l.inputOffset || 0, h = new Uint8Array(r, a, 10), o = String.fromCharCode.apply(null, h), s, g;
        if (o.trim() === "CntZImage")
          s = e, g = 1;
        else if (o.substring(0, 5) === "Lerc2")
          s = A, g = 2;
        else
          throw "Unexpected file identifier string: " + o;
        for (var I = 0, c = r.byteLength - 10, f, w = [], B, u, E = {
          width: 0,
          height: 0,
          pixels: [],
          pixelType: l.pixelType,
          mask: null,
          statistics: []
        }, y = 0; a < c; ) {
          var d = s.decode(r, {
            inputOffset: a,
            //for both lerc1 and lerc2
            encodedMaskData: f,
            //lerc1 only
            maskData: u,
            //lerc2 only
            returnMask: I === 0,
            //lerc1 only
            returnEncodedMask: I === 0,
            //lerc1 only
            returnFileInfo: !0,
            //for both lerc1 and lerc2
            returnPixelInterleavedDims: l.returnPixelInterleavedDims,
            //for ndim lerc2 only
            pixelType: l.pixelType || null,
            //lerc1 only
            noDataValue: l.noDataValue || null
            //lerc1 only
          });
          a = d.fileInfo.eofOffset, u = d.maskData, I === 0 && (f = d.encodedMaskData, E.width = d.width, E.height = d.height, E.dimCount = d.dimCount || 1, E.pixelType = d.pixelType || d.fileInfo.pixelType, E.mask = u), g > 1 && (u && w.push(u), d.fileInfo.mask && d.fileInfo.mask.numBytes > 0 && y++), I++, E.pixels.push(d.pixelData), E.statistics.push({
            minValue: d.minValue,
            maxValue: d.maxValue,
            noDataValue: d.noDataValue,
            dimStats: d.dimStats
          });
        }
        var x, C, Q;
        if (g > 1 && y > 1) {
          for (Q = E.width * E.height, E.bandMasks = w, u = new Uint8Array(Q), u.set(w[0]), x = 1; x < w.length; x++)
            for (B = w[x], C = 0; C < Q; C++)
              u[C] = u[C] & B[C];
          E.maskData = u;
        }
        return E;
      }
    };
    t.exports ? t.exports = n : this.Lerc = n;
  })();
})(Gn);
var il = Gn.exports;
const nl = /* @__PURE__ */ Ft(il);
let te, SA, dt;
const st = {
  env: {
    emscripten_notify_memory_growth: function(t) {
      dt = new Uint8Array(SA.exports.memory.buffer);
    }
  }
};
class rl {
  init() {
    return te || (typeof fetch < "u" ? te = fetch("data:application/wasm;base64," + Ni).then((e) => e.arrayBuffer()).then((e) => WebAssembly.instantiate(e, st)).then(this._init) : te = WebAssembly.instantiate(Buffer.from(Ni, "base64"), st).then(this._init), te);
  }
  _init(e) {
    SA = e.instance, st.env.emscripten_notify_memory_growth(0);
  }
  decode(e, A = 0) {
    if (!SA) throw new Error("ZSTDDecoder: Await .init() before decoding.");
    const i = e.byteLength, n = SA.exports.malloc(i);
    dt.set(e, n), A = A || Number(SA.exports.ZSTD_findDecompressedSize(n, i));
    const r = SA.exports.malloc(A), l = SA.exports.ZSTD_decompress(r, A, n, i), a = dt.slice(r, r + l);
    return SA.exports.free(n), SA.exports.free(r), a;
  }
}
const Ni = "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IAMNACAEQQNxBEADQCACRQ0FIAAgAkF/aiICaiIDIAEgAmotAAA6AAAgA0EDcQ0ACwsgAkEDTQ0AA0AgACACQXxqIgJqIAEgAmooAgA2AgAgAkEDSw0ACwsgAkUNAgNAIAAgAkF/aiICaiABIAJqLQAAOgAAIAINAAsMAgsgAkEDTQ0AIAIhBANAIAMgASgCADYCACABQQRqIQEgA0EEaiEDIARBfGoiBEEDSw0ACyACQQNxIQILIAJFDQADQCADIAEtAAA6AAAgA0EBaiEDIAFBAWohASACQX9qIgINAAsLIAAL8wICAn8BfgJAIAJFDQAgACACaiIDQX9qIAE6AAAgACABOgAAIAJBA0kNACADQX5qIAE6AAAgACABOgABIANBfWogAToAACAAIAE6AAIgAkEHSQ0AIANBfGogAToAACAAIAE6AAMgAkEJSQ0AIABBACAAa0EDcSIEaiIDIAFB/wFxQYGChAhsIgE2AgAgAyACIARrQXxxIgRqIgJBfGogATYCACAEQQlJDQAgAyABNgIIIAMgATYCBCACQXhqIAE2AgAgAkF0aiABNgIAIARBGUkNACADIAE2AhggAyABNgIUIAMgATYCECADIAE2AgwgAkFwaiABNgIAIAJBbGogATYCACACQWhqIAE2AgAgAkFkaiABNgIAIAQgA0EEcUEYciIEayICQSBJDQAgAa0iBUIghiAFhCEFIAMgBGohAQNAIAEgBTcDGCABIAU3AxAgASAFNwMIIAEgBTcDACABQSBqIQEgAkFgaiICQR9LDQALCyAACy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAIajYCACADCy8BAn8gACgCBCAAKAIAQQJ0aiICLQACIQMgACACLwEAIAEgAi0AAxAFajYCACADCx8AIAAgASACKAIEEAg2AgAgARAEGiAAIAJBCGo2AgQLCAAgAGdBH3MLugUBDX8jAEEQayIKJAACfyAEQQNNBEAgCkEANgIMIApBDGogAyAEEAsaIAAgASACIApBDGpBBBAVIgBBbCAAEAMbIAAgACAESxsMAQsgAEEAIAEoAgBBAXRBAmoQECENQVQgAygAACIGQQ9xIgBBCksNABogAiAAQQVqNgIAIAMgBGoiAkF8aiEMIAJBeWohDiACQXtqIRAgAEEGaiELQQQh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ASIDNgLE4AEgACgCvOABIQQgACABNgK84AEgACABIAJqNgK44AEgACABIAQgA2tqNgLA4AELpgEBAX8gACAAKALs4QEQFjYCyOABIABCADcD+OABIABCADcDuOABIABBwOABakIANwMAIABBqNAAaiIBQYyAgOAANgIAIABBADYCmOIBIABCADcDiOEBIABCAzcDgOEBIABBrNABakHgEikCADcCACAAQbTQAWpB6BIoAgA2AgAgACABNgIMIAAgAEGYIGo2AgggACAAQaAwajYCBCAAIABBEGo2AgALYQEBf0G4fyEDAkAgAUEDSQ0AIAIgABAhIgFBA3YiADYCCCACIAFBAXE2AgQgAiABQQF2QQNxIgM2AgACQCADQX9qIgFBAksNAAJAIAFBAWsOAgEAAgtBbA8LIAAhAwsgAwsMACAAIAEgAkEAEC4LiAQCA38CfiADEBYhBCAAQQBBKBAQIQAgBCACSwRAIAQPCyABRQRAQX8PCwJAAkAgA0EBRg0AIAEoAAAiBkGo6r5pRg0AQXYhAyAGQXBxQdDUtMIBRw0BQQghAyACQQhJDQEgAEEAQSgQECEAIAEoAAQhASAAQQE2AhQgACABrTcDAEEADwsgASACIAMQLyIDIAJLDQAgACADNgIYQXIhAyABIARqIgVBf2otAAAiAkEIcQ0AIAJBIHEiBkUEQEFwIQMgBS0AACIFQacBSw0BIAVBB3GtQgEgBUEDdkEKaq2GIgdCA4h+IAd8IQggBEEBaiEECyACQQZ2IQMgAkECdiEFAkAgAkEDcUF/aiICQQJLBEBBACECDAELAkACQAJAIAJBAWsOAgECAAsgASAEai0AACECIARBAWohBAwCCyABIARqLwAAIQIgBEECaiEEDAELIAEgBGooAAAhAiAEQQRqIQQLIAVBAXEhBQJ+AkACQAJAIANBf2oiA0ECTQRAIANBAWsOAgIDAQtCfyAGRQ0DGiABIARqMQAADAMLIAEgBGovAACtQoACfAwCCyABIARqKAAArQwBCyABIARqKQAACyEHIAAgBTYCICAAIAI2AhwgACAHNwMAQQAhAyAAQQA2AhQgACAHIAggBhsiBzcDCCAAIAdCgIAIIAdCgIAIVBs+AhALIAMLWwEBf0G4fyEDIAIQFiICIAFNBH8gACACakF/ai0AACIAQQNxQQJ0QaAeaigC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C0Egak8NAQsgByAHKQNoNwMQIAcgBykDYDcDCCAEIA0gB0EIaiAHQdwAaiAPIA4gESAQEB4hCwwBCyACIARqIQggBCAKEAcgAkERTwRAIARBEGohAgNAIAIgCkEQaiIKEAcgAkEQaiICIAhJDQALCyAIIAlrIQIgByATNgJcIAkgCCAOa0sEQCAJIAggEWtLBEBBbCELDAILIBAgAiAOayICaiIKIANqIBBNBEAgCCAKIAMQDxoMAgsgCCAKQQAgAmsQDyEIIAcgAiADaiIDNgJkIAggAmshCCAOIQILIAlBEE8EQCADIAhqIQMDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALDAELAkAgCUEHTQRAIAggAi0AADoAACAIIAItAAE6AAEgCCACLQACOgACIAggAi0AAzoAAyAIQQRqIAIgCUECdCIDQcAeaigCAGoiAhAXIAIgA0HgHmooAgBrIQIgBygCZCEDDAELIAggAhAMCyADQQlJDQAgAyAIaiEDIAhBCGoiCCACQQhqIgJrQQ9MBEADQCAIIAIQDCACQQhqIQIgCEEIaiIIIANJDQAMAgALAAsDQCAIIAIQByACQRBqIQIgCEEQaiIIIANJDQALCyAHQRhqEAQaIAsgDCALEAMiAhshDCAEIAQgC2ogAhshBCAFQX9qIgUNAAsgDBADDQFBbCEMIAdBGGoQBEECSQ0BQQAhCANAIAhBA0cEQCAAIAhBAnQiAmpBrNABaiACIAdqKAJENgIAIAhBAWohCAwBCwsgBygCXCEIC0G6fyEMIA8gCGsiACANIARrSw0AIAQEfyAEIAggABALIABqBUEACyABayEMCyAHQfAAaiQAIAwLkRcCFn8FfiMAQdABayIHJAAgByAAKALw4QEiCDYCvAEgASACaiESIAggACgCgOIBaiETAkACQCAFRQRAIAEhAwwBCyAAKALE4AEhESAAKALA4AEhFSAAKAK84AEhDyAAQQE2AozhAUEAIQgDQCAIQQNHBEAgByAIQQJ0IgJqIAAgAmpBrNABaigCADYCVCAIQQFqIQgMAQsLIAcgETYCZCAHIA82AmAgByABIA9rNgJoQWwhECAHQShqIAMgBBAGEAMNASAFQQQgBUEESBshFyAHQTxqIAdBKGogACgCABATIAdBxABqIAdBKGogACgCCBATIAdBzABqIAdB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IAdB0AFqJAAgEAslACAAQgA3AgAgAEEAOwEIIABBADoACyAAIAE2AgwgACACOgAKC7QFAQN/IwBBMGsiBCQAIABB/wFqIgVBfWohBgJAIAMvAQIEQCAEQRhqIAEgAhAGIgIQAw0BIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahASOgAAIAMgBEEIaiAEQRhqEBI6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0FIAEgBEEQaiAEQRhqEBI6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBSABIARBCGogBEEYahASOgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEjoAACABIAJqIABrIQIMAwsgAyAEQRBqIARBGGoQEjoAAiADIARBCGogBEEYahASOgADIANBBGohAwwAAAsACyAEQRhqIAEgAhAGIgIQAw0AIARBEGogBEEYaiADEBwgBEEIaiAEQRhqIAMQHCAAIQMDQAJAIARBGGoQBCADIAZPckUEQCADIARBEGogBEEYahAROgAAIAMgBEEIaiAEQRhqEBE6AAEgBEEYahAERQ0BIANBAmohAwsgBUF+aiEFAn8DQEG6fyECIAMiASAFSw0EIAEgBEEQaiAEQRhqEBE6AAAgAUEBaiEDIARBGGoQBEEDRgRAQQIhAiAEQQhqDAILIAMgBUsNBCABIARBCGogBEEYahAROgABIAFBAmohA0EDIQIgBEEYahAEQQNHDQALIARBEGoLIQUgAyAFIARBGGoQEToAACABIAJqIABrIQIMAgsgAyAEQRBqIARBGGoQEToAAiADIARBCGogBEEYahAROgADIANBBGohAwwAAAsACyAEQTBqJAAgAgtpAQF/An8CQAJAIAJBB00NACABKAAAQbfIwuF+Rw0AIAAgASgABDYCmOIBQWIgAEEQaiABIAIQPiIDEAMNAhogAEKBgICAEDcDiOEBIAAgASADaiACIANrECoMAQsgACABIAIQKgtBAAsLrQMBBn8jAEGAAWsiAyQAQWIhCAJAIAJBCUkNACAAQZjQAGogAUEIaiIEIAJBeGogAEGY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wOABCwutAgIEfwF+IwBBQGoiBCQAAkACQCACQQhJDQAgASgAAEFwcUHQ1LTCAUcNACABIAIQIiEBIABCADcDCCAAQQA2AgQgACABNgIADAELIARBGGogASACEC0iAxADBEAgACADEBoMAQsgAwRAIABBuH8QGgwBCyACIAQoAjAiA2shAiABIANqIQMDQAJAIAAgAyACIARBCGoQLCIFEAMEfyAFBSACIAVBA2oiBU8NAUG4fwsQGgwCCyAGQQFqIQYgAiAFayECIAMgBWohAyAEKAIMRQ0ACyAEKAI4BEAgAkEDTQRAIABBuH8QGgwCCyADQQRqIQMLIAQoAighAiAEKQMYIQcgAEEANgIEIAAgAyABazYCACAAIAIgBmytIAcgB0J/URs3AwgLIARBQGskAAslAQF/IwBBEGsiAiQAIAIgACABEFEgAigCACEAIAJBEGokACAAC30BBH8jAEGQBGsiBCQAIARB/wE2AggCQCAEQRBqIARBCGogBEEMaiABIAIQFSIGEAMEQCAGIQUMAQtBVCEFIAQoAgwiB0EGSw0AIAMgBEEQaiAEKAIIIAcQQSIFEAMNACAAIAEgBmogAiAGayADEDwhBQsgBEGQBGokACAFC4cBAgJ/An5BABAWIQMCQANAIAEgA08EQAJAIAAoAABBcHFB0NS0wgFGBEAgACABECIiAhADRQ0BQn4PCyAAIAEQVSIEQn1WDQMgBCAFfCIFIARUIQJCfiEEIAINAyAAIAEQUiICEAMNAwsgASACayEBIAAgAmohAAwBCwtCfiAFIAEbIQQLIAQLPwIBfwF+IwBBMGsiAiQAAn5CfiACQQhqIAAgARAtDQAaQgAgAigCHEEBRg0AGiACKQMICyEDIAJBMGokACADC40BAQJ/IwBBMGsiASQAAkAgAEUNACAAKAKI4gENACABIABB/OEBaigCADYCKCABIAApAvThATcDICAAEDAgACgCqOIBIQIgASABKAIoNgIYIAEgASkDIDcDECACIAFBEGoQGyAAQQA2AqjiASABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALKgECfyMAQRBrIgAkACAAQQA2AgggAEIANwMAIAAQWCEBIABBEGokACABC4cBAQN/IwBBEGsiAiQAAkAgACgCAEUgACgCBEVzDQAgAiAAKAIINgIIIAIgACkCADcDAAJ/IAIoAgAiAQRAIAIoAghBqOMJIAERBQAMAQtBqOMJECgLIgFFDQAgASAAKQIANwL04QEgAUH84QFqIAAoAgg2AgAgARBZIAEhAwsgAkEQaiQAIAMLywEBAn8jAEEgayIBJAAgAEGBgIDAADYCtOIBIABBADYCiOIBIABBADYC7OEBIABCADcDkOIBIABBADYCpOMJIABBADYC3OIBIABCADcCzOIBIABBADYCvOIBIABBADYCxOABIABCADcCnOIBIABBpOIBakIANwIAIABBrOIBakEANgIAIAFCADcCECABQgA3AhggASABKQMYNwMIIAEgASkDEDcDACABKAIIQQh2QQFxIQIgAEEANgLg4gEgACACNgKM4gEgAUEgaiQAC3YBA38jAEEwayIBJAAgAARAIAEgAEHE0AFqIgIoAgA2AiggASAAKQK80AE3AyAgACgCACEDIAEgAigCADYCGCABIAApArzQATcDECADIAFBEGoQGyABIAEoAig2AgggASABKQMgNwMAIAAgARAbCyABQTBqJAALzAEBAX8gACABKAK00AE2ApjiASAAIAEoAgQiAjYCwOABIAAgAjYCvOABIAAgAiABKAIIaiICNgK44AEgACACNgLE4AEgASgCuNABBEAgAEKBgICAEDcDiOEBIAAgAUGk0ABqNgIMIAAgAUGUIGo2AgggACABQZwwajYCBCAAIAFBDGo2AgAgAEGs0AFqIAFBqNABaigCADYCACAAQbDQAWogAUGs0AFqKAIANgIAIABBtNABaiABQbDQAWooAgA2AgAPCyAAQgA3A4jhAQs7ACACRQRAQbp/DwsgBEUEQEFsDwsgAiAEEGAEQCAAIAEgAiADIAQgBRBhDwsgACABIAIgAyAEIAUQZQtGAQF/IwBBEGsiBSQAIAVBCGogBBAOAn8gBS0ACQRAIAAgASACIAMgBBAyDAELIAAgASACIAMgBBA0CyEAIAVBEGokACAACzQAIAAgAyAEIAUQNiIFEAMEQCAFDwsgBSAESQR/IAEgAiADIAVqIAQgBWsgABA1BUG4fwsLRgEBfyMAQRBrIgUkACAFQQhqIAQQDgJ/IAUtAAkEQCAAIAEgAiADIAQQYgwBCyAAIAEgAiADIAQQNQshACAFQRBqJAAgAAtZAQF/QQ8hAiABIABJBEAgAUEE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", Rn = new rl();
class sl extends NA {
  constructor(e) {
    super(), this.planarConfiguration = typeof e.PlanarConfiguration < "u" ? e.PlanarConfiguration : 1, this.samplesPerPixel = typeof e.SamplesPerPixel < "u" ? e.SamplesPerPixel : 1, this.addCompression = e.LercParameters[ns.AddCompression];
  }
  decodeBlock(e) {
    switch (this.addCompression) {
      case Pe.None:
        break;
      case Pe.Deflate:
        e = vn(new Uint8Array(e)).buffer;
        break;
      case Pe.Zstandard:
        e = Rn.decode(new Uint8Array(e)).buffer;
        break;
      default:
        throw new Error(`Unsupported LERC additional compression method identifier: ${this.addCompression}`);
    }
    return nl.decode(e, { returnPixelInterleavedDims: this.planarConfiguration === 1 }).pixels[0].buffer;
  }
}
const ol = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: sl,
  zstd: Rn
}, Symbol.toStringTag, { value: "Module" }));
class al extends NA {
  constructor() {
    if (super(), typeof createImageBitmap > "u")
      throw new Error("Cannot decode WebImage as `createImageBitmap` is not available");
    if (typeof document > "u" && typeof OffscreenCanvas > "u")
      throw new Error("Cannot decode WebImage as neither `document` nor `OffscreenCanvas` is not available");
  }
  async decode(e, A) {
    const i = new Blob([A]), n = await createImageBitmap(i);
    let r;
    typeof document < "u" ? (r = document.createElement("canvas"), r.width = n.width, r.height = n.height) : r = new OffscreenCanvas(n.width, n.height);
    const l = r.getContext("2d");
    return l.drawImage(n, 0, 0), l.getImageData(0, 0, n.width, n.height).data.buffer;
  }
}
const ll = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  default: al
}, Symbol.toStringTag, { value: "Module" }));
export {
  dl as ArcGisDemSource,
  El as ArcGisSource,
  Ql as BingSource,
  Cr as Compass,
  wr as EarthMaskMaterial,
  yr as FakeEarth,
  wl as GDSource,
  Bl as GLViewer,
  Yl as GeoJSONLoader,
  ql as GeoJSONSource,
  yl as GeoqSource,
  pl as GoogleSource,
  Vl as IndexDBCacheEable,
  Pl as MVTLoader,
  Jl as MVTSource,
  Cl as MapBoxSource,
  pr as MapFog,
  xl as MapTilerSource,
  Tl as SingleImageLoader,
  _l as SingleImageSource,
  Nl as SingleTifDEMLoader,
  Ol as SingleTifDEMSource,
  ml as StadiaSource,
  Sl as TDTQMSource,
  Dl as TDTSource,
  Fl as TXSource,
  Rl as TileMateriaNormalLoader,
  vl as TileMaterialDebugeLoader,
  Gl as TileMaterialLogoLoader,
  Ul as TileMaterialWrieLoader,
  bl as ZKXTQMSource,
  kl as ZKXTSource,
  ul as createCompass,
  Ll as createFog,
  Ml as createFrakEarth,
  Kl as getAttributions,
  Hl as getLocalFromMouse,
  jl as limitCameraHeight
};
