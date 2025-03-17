import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { TransformControls } from 'three/addons/controls/TransformControls.js';

class SceneManager {
    constructor(container) {
        this.container = container;
        this.originalPositions = new Map(); // 存储模型的原始位置
        this.isSpread = false;  // 跟踪当前是否处于分散状态
        this.spreadDistance = 2; // 分散距离
        this.selectedObject = null;
        this.isSelectMode = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.transformControls = null;
        this.clippingPlane = null;
        this.planeHelper = null;
        this.isClipping = false;
        this.isPlaneVisible = true; // 添加剖切面可见性状态
        this.clippingChangeHandler = null; // 添加变量存储事件处理函数
        this.clippingMode = 'translate'; // 添加剖切面控制模式
        this.initialModelStates = new Map(); // 存储所有模型的初始状态
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
            1000
        );
        this.camera.position.set(0, 5, 20);
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

        // 创建变换控制器
        this.transformControls = new TransformControls(this.camera, this.renderer.domElement);
        // this.transformControls.enabled = false;
        this.scene.add(this.transformControls.getHelper());

        // 防止变换控制器被射线检测到
        // this.transformControls.traverse((obj) => {
        //     obj.layers.set(1);
        // });

        // 当变换控制器在使用时禁用 OrbitControls
        this.transformControls.addEventListener('dragging-changed', (event) => {
            this.controls.enabled = !event.value;
        });

        // 设置射线检测只检测默认层
        this.raycaster.layers.set(0);

        this.setupSelectionControls();

        // 添加光源
        this.addLights();

        // 添加窗口大小变化监听
        window.addEventListener('resize', this.onWindowResize.bind(this));

        // 启用渲染器的剖切功能
        this.renderer.localClippingEnabled = true;

        // 开始动画循环
        this.animate();
    }

    setupControls() {
        // 启用阻尼效果
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;

        // 配置缩放
        this.controls.enableZoom = true;
        this.controls.zoomSpeed = 2.0;
        // this.controls.minDistance = 0.0001;
        // this.controls.maxDistance = 10000;

        // 配置旋转
        this.controls.enableRotate = true;
        this.controls.rotateSpeed = 1.0;

        // 配置平移
        this.controls.enablePan = true;
        this.controls.panSpeed = 1.0;
        this.controls.screenSpacePanning = true;

        this.controls.update();


        // this.controls.target.set( 0, 0.5, 0 );
        // this.controls.update();
        // this.controls.enablePan = true;
        // this.controls.enableDamping = true;
        // this.controls.enableZoom = true;
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

    setupSelectionControls() {
        this.renderer.domElement.addEventListener('click', (event) => {
            
            if (!this.isSelectMode) return;
            

            // 计算鼠标位置
            const rect = this.renderer.domElement.getBoundingClientRect();
            this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            // 发射射线
            this.raycaster.setFromCamera(this.mouse, this.camera);

            // 只获取场景中的模型，排除 TransformControls
            // const models = this.scene.children.filter(child => 
            //     child.type === 'Group' && child !== this.transformControls
            // );

            const models = this.scene.children.filter(child => 
                child.type === 'Group'
            );

            // 获取相交的物体
            const intersects = this.raycaster.intersectObjects(models, true);

            if (intersects.length > 0) {
                const selectedMesh = intersects[0].object;
                
                // 查找模型根节点
                let modelRoot = selectedMesh;
                while (modelRoot.parent && modelRoot.parent !== this.scene) {
                    modelRoot = modelRoot.parent;
                }

                // 如果点击了已选中的物体，则取消选择
                if (this.selectedObject === modelRoot) {
                    this.transformControls.enabled = false;
                    this.transformControls.detach();
                    this.selectedObject = null;
                } else {
                    // 先分离之前的物体
                    if (this.selectedObject) {
                        this.transformControls.detach();
                    }
                    
                    // 延迟一帧再附加新物体
                    requestAnimationFrame(() => {
                        this.selectedObject = modelRoot;
                        this.transformControls.enabled = true;
                        this.transformControls.attach(this.selectedObject);
                    });
                }
            } else if (this.selectedObject) {
                this.transformControls.enabled = false;
                this.transformControls.detach();
                this.selectedObject = null;
            }
        });
    }

    toggleSelectMode(isSelectMode) {
        this.isSelectMode = isSelectMode;
        if (!this.isSelectMode && this.selectedObject) {
            this.transformControls.enabled = false;
            this.transformControls.detach();
            this.selectedObject = null;
        }
    }

    setTransformMode(mode) {
        if (this.selectedObject && this.transformControls.enabled) {
            this.transformControls.setMode(mode);
        }
    }

    // 添加剖切功能
    toggleClipping() {
        this.isClipping = !this.isClipping;

        if (this.isClipping) {
            // 创建剖切平面，使用平面的法向量
            this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);

            // 创建可视化平面
            const planeGeometry = new THREE.PlaneGeometry(5, 5);
            const planeMaterial = new THREE.MeshBasicMaterial({
                color: 0xff0000,
                side: THREE.DoubleSide,
                transparent: true,
                opacity: 0.5,
                depthTest: false,
                depthWrite: false
            });
            this.planeHelper = new THREE.Mesh(planeGeometry, planeMaterial);
            
            // 设置平面初始位置
            this.planeHelper.position.set(0, 0, 0);
            this.scene.add(this.planeHelper);

            // 为所有模型添加剖切平面
            this.scene.traverse((node) => {
                if (node.isMesh && node !== this.planeHelper) { // 排除剖切平面自身
                    node.material = node.material.clone();
                    node.material.clippingPlanes = [this.clippingPlane];
                    node.material.clipShadows = true;
                    node.material.needsUpdate = true;
                }
            });

            this.transformControls.enabled = true;
            // 使用现有的变换控制器
            this.transformControls.attach(this.planeHelper);
            this.transformControls.setMode(this.clippingMode);

            // 创建事件处理函数并保存引用
            this.clippingChangeHandler = () => {
                this.updateClippingPlane();
            };

            // 添加事件监听
            this.transformControls.addEventListener('change', this.clippingChangeHandler);

            // 初始更新一次剖切平面
            this.updateClippingPlane();
        } else {
            // 移除事件监听
            if (this.clippingChangeHandler) {
                this.transformControls.enabled = false;
                this.transformControls.removeEventListener('change', this.clippingChangeHandler);
                this.clippingChangeHandler = null;
            }

            // 移除剖切平面
            if (this.planeHelper) {
                this.scene.remove(this.planeHelper);
                this.transformControls.detach();
                this.planeHelper = null;
            }

            // 移除所有模型的剖切平面
            this.scene.traverse((node) => {
                if (node.isMesh) {
                    node.material.clippingPlanes = [];
                    node.material.needsUpdate = true;
                }
            });
        }
    }

    updateClippingPlane() {
        if (!this.planeHelper || !this.clippingPlane) return;

        // 获取平面的位置
        const position = new THREE.Vector3();
        this.planeHelper.getWorldPosition(position);
        
        // 计算平面的法向量（垂直于平面的方向）
        const normal = new THREE.Vector3(0, 0, 1);  // 平面的默认法向量
        normal.transformDirection(this.planeHelper.matrixWorld);  // 应用平面的世界变换

        // 更新剖切平面
        this.clippingPlane.normal.copy(normal);
        this.clippingPlane.constant = -position.dot(normal);

        // 遍历场景中的所有网格
        this.scene.traverse((node) => {
            if (node.isMesh && node !== this.planeHelper) {
                // 确保材质已经设置了剖切平面
                if (!node.material.clippingPlanes || node.material.clippingPlanes.length === 0) {
                    node.material.clippingPlanes = [this.clippingPlane];
                    node.material.clipShadows = true;
                    node.material.needsUpdate = true;
                }
            }
        });
    }

    // 获取当前剖切状态
    getClippingState() {
        return this.isClipping;
    }

    // 切换剖切面的可见性
    togglePlaneVisibility() {
        if (!this.planeHelper) return;
        
        this.isPlaneVisible = !this.isPlaneVisible;
        this.planeHelper.visible = this.isPlaneVisible;
    }

    // 获取剖切面可见性状态
    getPlaneVisibility() {
        return this.isPlaneVisible;
    }

    // 添加设置剖切面控制模式的方法
    setClippingMode(mode) {
        if (!this.planeHelper || !this.isClipping) return;
        
        this.clippingMode = mode;
        this.transformControls.setMode(mode);
    }

    // 获取当前剖切面控制模式
    getClippingMode() {
        return this.clippingMode;
    }

    // 记录模型的初始状态
    recordInitialState(model) {
        if (!this.initialModelStates.has(model)) {
            model.updateMatrix();
            model.updateMatrixWorld(true);
            
            this.initialModelStates.set(model, {
                position: model.position.clone(),
                rotation: model.rotation.clone(),
                scale: model.scale.clone()
            });
        }
    }

    // 重置所有模型到初始状态
    resetAllModels() {
        // 先取消当前选择
        if (this.selectedObject) {
            this.transformControls.detach();
            this.selectedObject = null;
        }

        // 遍历场景中的所有模型
        this.scene.children.forEach(child => {
            if (child.type === 'Group') {
                const initialState = this.initialModelStates.get(child);
                if (initialState) {
                    child.position.copy(initialState.position);
                    child.rotation.copy(initialState.rotation);
                    child.scale.copy(initialState.scale);
                    child.updateMatrix();
                    child.updateMatrixWorld(true);
                }
            }
        });
    }
}

export { SceneManager }; 