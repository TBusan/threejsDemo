import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class OrbitControlManager {
    constructor(camera, domElement) {
        this.controls = new OrbitControls(camera, domElement);
        this.setupControls();
    }

    setupControls() {
        // 基础配置
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.screenSpacePanning = true;

        // 缩放配置
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 2.0;

        // 旋转配置
        this.controls.enableRotate = true;
        this.controls.rotateSpeed = 1.0;

        // 平移配置
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.0;

        this.controls.update();
    }

    update() {
        this.controls.update();
    }

    setLimits(options = {}) {
        const {
            minDistance,
            maxDistance,
            minPolarAngle,
            maxPolarAngle,
            minAzimuthAngle,
            maxAzimuthAngle
        } = options;

        if (minDistance !== undefined) this.controls.minDistance = minDistance;
        if (maxDistance !== undefined) this.controls.maxDistance = maxDistance;
        if (minPolarAngle !== undefined) this.controls.minPolarAngle = minPolarAngle;
        if (maxPolarAngle !== undefined) this.controls.maxPolarAngle = maxPolarAngle;
        if (minAzimuthAngle !== undefined) this.controls.minAzimuthAngle = minAzimuthAngle;
        if (maxAzimuthAngle !== undefined) this.controls.maxAzimuthAngle = maxAzimuthAngle;
    }

    dispose() {
        this.controls.dispose();
    }
}

export { OrbitControlManager }; 