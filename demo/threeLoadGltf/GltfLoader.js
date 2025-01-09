import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class GltfLoader {
    constructor(scene, camera, controls) {
        this.scene = scene;
        this.camera = camera;
        this.controls = controls;
        this.models = [];
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
        const loader = new GLTFLoader();

        loader.load(
            modelPath,
            (gltf) => {
                const model = gltf.scene;
                
                model.position.copy(finalOptions.position);
                model.scale.set(
                    finalOptions.scale,
                    finalOptions.scale,
                    finalOptions.scale
                );

                model.traverse((child) => {
                    if (child.isMesh) {
                        child.castShadow = true;
                        child.receiveShadow = true;
                    }
                });

                this.models.push(model);
                this.scene.add(model);
                this.adjustCameraView();

                if (finalOptions.onComplete) {
                    finalOptions.onComplete(model);
                }
            },
            (xhr) => {
                if (finalOptions.onProgress) {
                    finalOptions.onProgress(modelPath, xhr.loaded / xhr.total);
                }
            },
            (error) => {
                if (finalOptions.onError) {
                    finalOptions.onError(modelPath, error);
                } else {
                    console.error(`Error loading model ${modelPath}:`, error);
                }
            }
        );

        return this;
    }

    adjustCameraView() {
        const box = new THREE.Box3();
        this.models.forEach(model => {
            box.expandByObject(model);
        });

        const center = box.getCenter(new THREE.Vector3());
        const size = box.getSize(new THREE.Vector3());

        const maxDim = Math.max(size.x, size.y, size.z);
        const fov = this.camera.fov * (Math.PI / 180);
        let cameraZ = Math.abs(maxDim / Math.tan(fov / 2)) * 1.5;

        this.camera.position.set(center.x, center.y + maxDim / 2, center.z + cameraZ);
        this.controls.target.copy(center);
        this.camera.updateProjectionMatrix();
        this.controls.update();
    }

    clearModels() {
        this.models.forEach(model => {
            this.scene.remove(model);
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

export { GltfLoader }; 