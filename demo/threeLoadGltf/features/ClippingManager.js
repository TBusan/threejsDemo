import * as THREE from 'three';
import { EventEmitter } from '../utils/EventEmitter.js';

class ClippingManager extends EventEmitter {
    constructor(sceneManager) {
        super();
        this.sceneManager = sceneManager;
        this.clippingPlane = null;
        this.planeHelper = null;
        this.isClipping = false;
        this.isPlaneVisible = true;
        
        this.setupRenderer();
    }

    setupRenderer() {
        this.sceneManager.getRenderer().localClippingEnabled = true;
    }

    toggleClipping() {
        this.isClipping = !this.isClipping;

        if (this.isClipping) {
            this.createClippingPlane();
            this.createPlaneHelper();
            this.applyClippingToModels();
            this.emit('clippingEnabled', true);
        } else {
            this.removeClipping();
            this.emit('clippingEnabled', false);
        }

        return this.isClipping;
    }

    createClippingPlane() {
        this.clippingPlane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0);
    }

    createPlaneHelper() {
        const geometry = new THREE.PlaneGeometry(5, 5);
        const material = new THREE.MeshBasicMaterial({
            color: 0xff0000,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.5,
            depthTest: false,
            depthWrite: false
        });

        this.planeHelper = new THREE.Mesh(geometry, material);
        this.planeHelper.position.set(0, 0, 0);
        this.sceneManager.getScene().add(this.planeHelper);
    }

    applyClippingToModels() {
        this.sceneManager.getScene().traverse((node) => {
            if (node.isMesh && node !== this.planeHelper) {
                node.material = node.material.clone();
                node.material.clippingPlanes = [this.clippingPlane];
                node.material.clipShadows = true;
                node.material.needsUpdate = true;
            }
        });
    }

    removeClipping() {
        if (this.planeHelper) {
            this.sceneManager.getScene().remove(this.planeHelper);
            this.planeHelper = null;
        }

        this.sceneManager.getScene().traverse((node) => {
            if (node.isMesh) {
                node.material.clippingPlanes = [];
                node.material.needsUpdate = true;
            }
        });

        this.clippingPlane = null;
    }

    updateClippingPlane() {
        if (!this.planeHelper || !this.clippingPlane) return;

        const position = new THREE.Vector3();
        this.planeHelper.getWorldPosition(position);
        
        const normal = new THREE.Vector3(0, 0, 1);
        normal.transformDirection(this.planeHelper.matrixWorld);

        this.clippingPlane.normal.copy(normal);
        this.clippingPlane.constant = -position.dot(normal);
    }

    togglePlaneVisibility() {
        if (!this.planeHelper) return;
        
        this.isPlaneVisible = !this.isPlaneVisible;
        this.planeHelper.visible = this.isPlaneVisible;
        return this.isPlaneVisible;
    }

    getPlaneHelper() {
        return this.planeHelper;
    }

    dispose() {
        if (this.isClipping) {
            this.removeClipping();
        }
        this.clear(); // 清除所有事件监听
    }
}

export { ClippingManager }; 