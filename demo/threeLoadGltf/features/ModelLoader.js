import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class ModelLoader {
    constructor(sceneManager) {
        this.sceneManager = sceneManager;
        this.models = [];
        this.loader = new GLTFLoader();
    }

    loadModel(modelPath, options = {}) {
        const defaultOptions = {
            position: new THREE.Vector3(0, 0, 0),
            scale: 1.0,
            onProgress: null,
            onComplete: null,
            onError: null
        };

        const finalOptions = { ...defaultOptions, ...options };

        this.loader.load(
            modelPath,
            (gltf) => this.onModelLoaded(gltf, finalOptions),
            (xhr) => this.onProgress(xhr, modelPath, finalOptions),
            (error) => this.onError(error, modelPath, finalOptions)
        );

        return this;
    }

    onModelLoaded(gltf, options) {
        const model = gltf.scene;
        
        model.position.copy(options.position);
        model.scale.setScalar(options.scale);

        this.setupModel(model);
        this.models.push(model);
        this.sceneManager.getScene().add(model);
        this.adjustCameraView();

        if (options.onComplete) {
            options.onComplete(model);
        }
    }

    setupModel(model) {
        model.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }

    onProgress(xhr, modelPath, options) {
        if (options.onProgress) {
            options.onProgress(modelPath, xhr.loaded / xhr.total);
        }
    }

    onError(error, modelPath, options) {
        if (options.onError) {
            options.onError(modelPath, error);
        } else {
            console.error(`Error loading model ${modelPath}:`, error);
        }
    }

    adjustCameraView() {
        const box = new THREE.Box3();
        this.models.forEach(model => box.expandByObject(model));

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);

        const camera = this.sceneManager.getCamera();
        const controls = this.sceneManager.getControls();

        const fov = camera.fov * (Math.PI / 180);
        const cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;

        camera.position.set(center.x, center.y + maxDim / 2, center.z + cameraZ);
        controls.target.copy(center);
        camera.updateProjectionMatrix();
        controls.update();
    }

    clearModels() {
        this.models.forEach(model => {
            this.sceneManager.getScene().remove(model);
            model.traverse((child) => {
                if (child.isMesh) {
                    child.geometry.dispose();
                    child.material.dispose();
                }
            });
        });
        this.models = [];
    }
}

export { ModelLoader }; 