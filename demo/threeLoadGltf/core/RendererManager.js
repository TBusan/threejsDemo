import * as THREE from 'three';

class RendererManager {
    constructor(container) {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.setupRenderer(container);
    }

    setupRenderer(container) {
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        container.appendChild(this.renderer.domElement);
    }

    updateSize(container) {
        this.renderer.setSize(container.clientWidth, container.clientHeight);
    }

    render(scene, camera) {
        this.renderer.render(scene, camera);
    }

    get domElement() {
        return this.renderer.domElement;
    }

    dispose() {
        this.renderer.dispose();
    }
}

export { RendererManager }; 