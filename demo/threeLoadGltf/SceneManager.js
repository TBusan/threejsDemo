import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

class SceneManager {
    constructor(container) {
        this.container = container;
        this.init();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbfe3dd);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            70,
            this.container.clientWidth / this.container.clientHeight,
            0.001,
            100000000
        );
        this.camera.position.set(0, 5, 1000);
        this.camera.lookAt(0, 0, 0);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.container.appendChild(this.renderer.domElement);

        // 添加轨道控制器并配置
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.setupControls();

        // 添加光源
        this.addLights();

        // 添加窗口大小变化监听
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // 开始动画循环
        this.animate();
    }

    setupControls() {
        // 启用阻尼效果
        // this.controls.enableDamping = true;
        // this.controls.dampingFactor = 0.05;

        // 配置缩放
        this.controls.enableZoom = true;
        // this.controls.zoomSpeed = 1.0;
        // this.controls.minDistance = 1;
        // this.controls.maxDistance = 50;

        // 配置旋转
        this.controls.enableRotate = true;
        // this.controls.rotateSpeed = 1.0;

        // 配置平移
        this.controls.enablePan = true;
        // this.controls.panSpeed = 1.0;
        // this.controls.screenSpacePanning = true;
    }

    addLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 方向光
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        this.scene.add(directionalLight);

        // 半球光
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);
        hemiLight.position.set(0, 20, 0);
        this.scene.add(hemiLight);
    }

    onWindowResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.controls.update();
        this.renderer.render(this.scene, this.camera);
    }

    // 控制器相关方法
    toggleRotate(enable) {
        this.controls.enableRotate = enable;
    }

    toggleZoom(enable) {
        this.controls.enableZoom = enable;
    }

    togglePan(enable) {
        this.controls.enablePan = enable;
    }

    setControlLimits(options = {}) {
        if (options.minDistance !== undefined) this.controls.minDistance = options.minDistance;
        if (options.maxDistance !== undefined) this.controls.maxDistance = options.maxDistance;
        if (options.minPolarAngle !== undefined) this.controls.minPolarAngle = options.minPolarAngle;
        if (options.maxPolarAngle !== undefined) this.controls.maxPolarAngle = options.maxPolarAngle;
        if (options.minAzimuthAngle !== undefined) this.controls.minAzimuthAngle = options.minAzimuthAngle;
        if (options.maxAzimuthAngle !== undefined) this.controls.maxAzimuthAngle = options.maxAzimuthAngle;
    }

    // 资源清理
    dispose() {
        this.renderer.dispose();
        this.controls.dispose();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }

    // 获取场景
    getScene() {
        return this.scene;
    }

    // 获取相机
    getCamera() {
        return this.camera;
    }

    // 获取控制器
    getControls() {
        return this.controls;
    }
}

export { SceneManager }; 