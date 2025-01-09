import * as THREE from 'three';
import { CameraManager } from './CameraManager.js';
import { RendererManager } from './RendererManager.js';
import { OrbitControlManager } from '../controls/OrbitControlManager.js';
import { TransformManager } from '../controls/TransformManager.js';
import { SelectionManager } from '../features/SelectionManager.js';
import { ClippingManager } from '../features/ClippingManager.js';
import { SpreadManager } from '../features/SpreadManager.js';
import { EventEmitter } from '../utils/EventEmitter.js';

class SceneManager extends EventEmitter {
    constructor(container) {
        super();
        this.container = container;
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0xbfe3dd);

        this.initManagers();
        this.setupLights();
        this.setupEventListeners();
        this.animate();

        // 添加选择管理器的事件监听
        this.selectionManager.on('objectSelected', (object) => {
            this.transformManager.attach(object);
        });

        this.selectionManager.on('objectDeselected', () => {
            this.transformManager.detach();
        });

        // 添加变换控制器和轨道控制器的联动
        this.transformManager.on('transformDragging', (isDragging) => {
            this.orbitControls.controls.enabled = !isDragging;
        });
    }

    initManagers() {
        // 初始化各个管理器
        this.cameraManager = new CameraManager(this.container);
        this.rendererManager = new RendererManager(this.container);
        this.orbitControls = new OrbitControlManager(
            this.cameraManager.camera,
            this.rendererManager.domElement
        );
        this.transformManager = new TransformManager(
            this.cameraManager.camera,
            this.rendererManager.domElement,
            this.scene
        );

        // 初始化功能管理器
        this.selectionManager = new SelectionManager(this);
        this.clippingManager = new ClippingManager(this);
        this.spreadManager = new SpreadManager(this);
    }

    setupLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444444, 0.5);

        directionalLight.position.set(5, 5, 5);
        directionalLight.castShadow = true;
        hemiLight.position.set(0, 20, 0);

        this.scene.add(ambientLight, directionalLight, hemiLight);
    }

    setupEventListeners() {
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }

    onWindowResize() {
        this.cameraManager.updateAspect(this.container);
        this.rendererManager.updateSize(this.container);
    }

    animate() {
        requestAnimationFrame(this.animate.bind(this));
        this.orbitControls.update();
        this.rendererManager.render(this.scene, this.cameraManager.camera);
    }

    // 公共访问方法
    getScene() { return this.scene; }
    getCamera() { return this.cameraManager.camera; }
    getRenderer() { return this.rendererManager.renderer; }
    getControls() { return this.orbitControls.controls; }

    // 在切换选择模式时重置变换控制器
    toggleSelectMode(enabled) {
        if (!enabled) {
            this.transformManager.detach();
        }
        this.selectionManager.toggleSelectMode(enabled);
    }

    // 在切换剖切模式时重置变换控制器并重新设置
    toggleClipping() {
        const isEnabled = this.clippingManager.toggleClipping();
        
        // 确保先分离当前控制的对象
        this.transformManager.detach();
        
        if (isEnabled) {
            const planeHelper = this.clippingManager.getPlaneHelper();
            if (planeHelper) {
                // 重新设置变换控制器状态
                this.transformManager.setEnabled(true);
                this.transformManager.setMode('translate');
                this.transformManager.attach(planeHelper);
            }
        }
        
        return isEnabled;
    }

    // 设置变换模式（用于选择和剖切）
    setTransformMode(mode) {
        if (this.transformManager.getCurrentTarget()) {
            this.transformManager.setMode(mode);
        }
    }

    // 资源清理
    dispose() {
        this.rendererManager.dispose();
        this.orbitControls.dispose();
        this.transformManager.dispose();
        this.selectionManager.dispose();
        this.clippingManager.dispose();
        this.spreadManager.dispose();
        window.removeEventListener('resize', this.onWindowResize.bind(this));
    }
}

export { SceneManager }; 