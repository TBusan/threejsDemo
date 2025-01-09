import * as THREE from 'three';

class CameraManager {
    constructor(container) {
        this.camera = new THREE.PerspectiveCamera(
            70,
            container.clientWidth / container.clientHeight,
            0.001,
            1000
        );
        this.setupCamera();
    }

    setupCamera() {
        this.camera.position.set(0, 5, 20);
        this.camera.lookAt(0, 0, 0);
    }

    updateAspect(container) {
        this.camera.aspect = container.clientWidth / container.clientHeight;
        this.camera.updateProjectionMatrix();
    }
}

export { CameraManager }; 