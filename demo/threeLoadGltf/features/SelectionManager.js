import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

class SelectionManager extends EventEmitter {
    constructor(sceneManager) {
        super();
        this.sceneManager = sceneManager;
        this.selectedObject = null;
        this.isSelectMode = false;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        
        this.setupEventListeners();
    }

    setupEventListeners() {
        const renderer = this.sceneManager.getRenderer();
        renderer.domElement.addEventListener('click', this.onClick.bind(this));
    }

    onClick(event) {
        if (!this.isSelectMode) return;

        const rect = this.sceneManager.getRenderer().domElement.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        this.raycaster.setFromCamera(this.mouse, this.sceneManager.getCamera());

        const models = this.sceneManager.getScene().children.filter(
            child => child.type === 'Group'
        );

        const intersects = this.raycaster.intersectObjects(models, true);
        this.handleIntersection(intersects);
    }

    handleIntersection(intersects) {
        if (intersects.length > 0) {
            const selectedMesh = intersects[0].object;
            let modelRoot = this.findModelRoot(selectedMesh);

            if (this.selectedObject === modelRoot) {
                this.deselectObject();
            } else {
                this.selectObject(modelRoot);
            }
        } else if (this.selectedObject) {
            this.deselectObject();
        }
    }

    findModelRoot(object) {
        let modelRoot = object;
        while (modelRoot.parent && modelRoot.parent !== this.sceneManager.getScene()) {
            modelRoot = modelRoot.parent;
        }
        return modelRoot;
    }

    selectObject(object) {
        if (this.selectedObject) {
            this.deselectObject();
        }
        this.selectedObject = object;
        this.emit('objectSelected', object);
    }

    deselectObject() {
        const previousObject = this.selectedObject;
        this.selectedObject = null;
        this.emit('objectDeselected', previousObject);
    }

    toggleSelectMode(enabled) {
        this.isSelectMode = enabled;
        if (!this.isSelectMode && this.selectedObject) {
            this.deselectObject();
        }
        this.emit('selectModeChanged', enabled);
    }

    getSelectedObject() {
        return this.selectedObject;
    }

    isSelectionMode() {
        return this.isSelectMode;
    }

    dispose() {
        const renderer = this.sceneManager.getRenderer();
        renderer.domElement.removeEventListener('click', this.onClick.bind(this));
        this.clear(); // 清除所有事件监听
    }
}

export { SelectionManager }; 