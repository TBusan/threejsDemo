import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

class SceneManager {
    constructor(container) {
        this.container = container;
        this.originalPositions = new Map(); // 存储模型的原始位置
        this.isSpread = false;  // 跟踪当前是否处于分散状态
        this.spreadDistance = 2; // 分散距离
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
            0.00001,
            100000
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

        // 添加选择管理器
        // 假设你已经有了camera和renderer
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        this.scene.add(this.transformControls);

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
        // this.controls.enableZoom = true;
        // this.controls.zoomSpeed = 2.0;
        // this.controls.minDistance = 0.0001;
        // this.controls.maxDistance = 10000;

        // 配置旋转
        // this.controls.enableRotate = true;
        // this.controls.rotateSpeed = 1.0;

        // 配置平移
        // this.controls.enablePan = true;
        // this.controls.panSpeed = 1.0;
        // this.controls.screenSpacePanning = true;


        this.controls.target.set( 0, 0.5, 0 );
        this.controls.update();
        this.controls.enablePan = true;
        this.controls.enableDamping = true;
        this.controls.enableZoom = true;
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

    setTransformControlsModel(model) {
        debugger
        let attachModel = model.children[0];
        this.transformControls.attach(model);
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

    // 添加模型分散方法
    spreadModels(axis = 'x') {
        // 获取场景中的所有模型
        const models = this.scene.children.filter(child => 
            child.type === 'Group' && child !== this.transformControls
        );

        if (models.length === 0) return;

        // 如果还没有存储原始位置，就存储它们
        if (this.originalPositions.size === 0) {
            models.forEach(model => {
                this.originalPositions.set(model, model.position.clone());
            });
        }

        // 根据是否已经分散来决定动作
        if (!this.isSpread) {
            // 计算每个模型的新位置
            models.forEach((model, index) => {
                const offset = new THREE.Vector3();
                const position = index - (models.length - 1) / 2; // 使模型居中分布

                // 根据指定轴设置偏移
                switch(axis.toLowerCase()) {
                    case 'x':
                        offset.x = position * this.spreadDistance;
                        break;
                    case 'y':
                        offset.y = position * this.spreadDistance;
                        break;
                    case 'z':
                        offset.z = position * this.spreadDistance;
                        break;
                }

                // 应用偏移
                model.position.copy(offset);
            });
            this.isSpread = true;
        } else {
            // 恢复原始位置
            models.forEach(model => {
                const originalPos = this.originalPositions.get(model);
                if (originalPos) {
                    model.position.copy(originalPos);
                }
            });
            this.isSpread = false;
        }
    }

    // 获取当前分散状态
    getSpreadState() {
        return this.isSpread;
    }
}

export { SceneManager }; 