import { TransformControls } from 'three/addons/controls/TransformControls.js';
import { EventEmitter } from '../utils/EventEmitter.js';

class TransformManager extends EventEmitter {
    constructor(camera, domElement, scene) {
        super();
        this.camera = camera;
        this.domElement = domElement;
        this.scene = scene;
        this.controls = new TransformControls(camera, domElement);
        this.scene.add(this.controls);
        this.currentMode = 'translate';
        this.currentTarget = null;
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        this.controls.addEventListener('dragging-changed', (event) => {
            this.emit('transformDragging', event.value);
        });
    }

    attach(object) {
        if (this.currentTarget === object) return;
        
        this.detach();
        this.currentTarget = object;
        this.controls.attach(object);
        this.emit('objectAttached', object);
    }

    detach() {
        if (this.currentTarget) {
            const previousTarget = this.currentTarget;
            this.currentTarget = null;
            this.controls.detach();
            this.emit('objectDetached', previousTarget);
        }
    }

    setMode(mode) {
        if (this.currentMode !== mode) {
            this.currentMode = mode;
            this.controls.setMode(mode);
            this.emit('modeChanged', mode);
        }
    }

    setEnabled(enabled) {
        if (this.controls.enabled !== enabled) {
            this.controls.enabled = enabled;
            this.emit('enabledChanged', enabled);
        }
    }

    // 重置变换控制器状态
    reset() {
        this.detach();
        this.setMode('translate');
        this.setEnabled(true);
    }

    // 获取当前控制的对象
    getCurrentTarget() {
        return this.currentTarget;
    }

    // 获取当前模式
    getCurrentMode() {
        return this.currentMode;
    }

    // 获取是否启用
    isEnabled() {
        return this.controls.enabled;
    }

    dispose() {
        this.detach();
        this.controls.dispose();
        this.clear();
    }
}

export { TransformManager }; 