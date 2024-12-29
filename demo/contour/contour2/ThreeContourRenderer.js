import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import {ContourUtils} from './ContourUtils.js';
class ThreeContourRenderer {
    constructor(container, data, options = {}) {
        this.data = data;
        this.options = {
            width: 800,
            height: 600,
            colorScale: 'viridis',
            lineWidth: 2,
            showSurface: true,
            surfaceOpacity: 0.5,
            showLabels: true,
            labelSize: 0.5,
            smoothing: 0.2,
            ...options
        };

        // 初始化 Three.js
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(
            75,
            this.options.width / this.options.height,
            0.1,
            1000
        );

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        container.appendChild(this.renderer.domElement);

        // 添加轨道控制器
        this.controls = new OrbitControls(
            this.camera,
            this.renderer.domElement
        );

        // 初始化组件
        this.contourLines = new THREE.Group();
        this.labels = new THREE.Group();
        this.surface = null;

        // 设置相机位置
        this.camera.position.set(0, 0, 20);

        // 添加光源
        this.addLights();

        // 创建初始内容
        this.createContent();

        // 开始渲染循环
        this.render();
    }

    addLights() {
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(10, 10, 10);
        this.scene.add(directionalLight);
    }

    createContent() {
        if (this.options.showSurface) {
            this.createSurface();
        }
        this.createContourLines();

        if (this.options.showLabels) {
            this.scene.add(this.labels);
        }
    }

    createSurface() {
        const geometry = new THREE.PlaneGeometry(
            this.data.x.length - 1,
            this.data.y.length - 1,
            this.data.x.length - 1,
            this.data.y.length - 1
        );

        // 更新顶点位置和颜色
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        let minZ = Infinity;
        let maxZ = -Infinity;

        for (let i = 0; i < this.data.y.length; i++) {
            for (let j = 0; j < this.data.x.length; j++) {
                const index = (i * this.data.x.length + j) * 3;
                const z = this.data.z[i][j];

                positions[index + 2] = z;
                minZ = Math.min(minZ, z);
                maxZ = Math.max(maxZ, z);
            }
        }

        // 设置颜色
        for (let i = 0; i < positions.length / 3; i++) {
            const z = positions[i * 3 + 2];
            const color = ContourUtils.getColorForValue(
                z,
                minZ,
                maxZ,
                this.options.colorScale
            );

            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute(
            'color',
            new THREE.BufferAttribute(colors, 3)
        );

        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: this.options.surfaceOpacity
        });

        this.surface = new THREE.Mesh(geometry, material);
        this.scene.add(this.surface);
    }

    createContourLines() {
        this.contourLines.clear();

        // 获取数据范围用于颜色映射
        const values = this.data.z.flat();
        const minZ = Math.min(...values);
        const maxZ = Math.max(...values);

        // 计算实际的物理尺寸
        const width = this.data.x[this.data.x.length - 1] - this.data.x[0];
        const height = this.data.y[this.data.y.length - 1] - this.data.y[0];
        const dx = width / (this.data.x.length - 1);
        const dy = height / (this.data.y.length - 1);

        // 为每个等值线级别生成线段
        for (const level of this.data.levels) {
            const segments = [];

            // 遍历网格生成等值线段
            for (let i = 0; i < this.data.y.length - 1; i++) {
                for (let j = 0; j < this.data.x.length - 1; j++) {
                    const cell = [
                        this.data.z[i][j],
                        this.data.z[i][j + 1],
                        this.data.z[i + 1][j + 1],
                        this.data.z[i + 1][j]
                    ];

                    const x = this.data.x[j];
                    const y = this.data.y[i];

                    // 计算等值线与网格边的交点
                    const intersections = this.findIntersections(cell, x, y, dx, dy, level);
                    if (intersections.length === 2) {
                        segments.push(intersections);
                    }
                }
            }

            // 创建等值线几何体
            segments.forEach(([start, end]) => {
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    start.x, start.y, level + 0.01,  // 稍微抬高以避免z-fighting
                    end.x, end.y, level + 0.01
                ]);

                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                const material = new THREE.LineBasicMaterial({
                    color: 0x000000,     // 黑色线条
                    linewidth: 2,        // 线宽
                    transparent: false,
                    depthWrite: true
                });

                const line = new THREE.Line(geometry, material);
                line.renderOrder = 1;    // 确保线条在渐变面之上
                this.contourLines.add(line);
            });
        }

        this.scene.add(this.contourLines);
    }

    findIntersections(cell, x, y, dx, dy, level) {
        const intersections = [];
        const edges = [
            { p1: [x, y], p2: [x + dx, y], v1: cell[0], v2: cell[1] },         // 上边
            { p1: [x + dx, y], p2: [x + dx, y + dy], v1: cell[1], v2: cell[2] },   // 右边
            { p1: [x + dx, y + dy], p2: [x, y + dy], v1: cell[2], v2: cell[3] },   // 下边
            { p1: [x, y + dy], p2: [x, y], v1: cell[3], v2: cell[0] }          // 左边
        ];

        edges.forEach(edge => {
            if ((edge.v1 < level && edge.v2 >= level) || (edge.v1 >= level && edge.v2 < level)) {
                const t = (level - edge.v1) / (edge.v2 - edge.v1);
                intersections.push({
                    x: edge.p1[0] + t * (edge.p2[0] - edge.p1[0]),
                    y: edge.p1[1] + t * (edge.p2[1] - edge.p1[1])
                });
            }
        });

        return intersections;
    }

    addLabel(position, value) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');

        canvas.width = 128;
        canvas.height = 64;

        context.fillStyle = 'white';
        context.font = '24px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(
            value.toFixed(1),
            canvas.width / 2,
            canvas.height / 2
        );

        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.copy(position);
        sprite.scale.set(
            this.options.labelSize,
            this.options.labelSize * 0.5,
            1
        );

        this.labels.add(sprite);
    }

    render = () => {
        requestAnimationFrame(this.render);

        this.controls.update();
        this.renderer.render(this.scene, this.camera);

        // 更新标签朝向
        if (this.options.showLabels) {
            this.labels.children.forEach(label => {
                label.quaternion.copy(this.camera.quaternion);
            });
        }
    }

    update(data) {
        this.data = data;

        if (this.surface) {
            this.scene.remove(this.surface);
        }
        this.scene.remove(this.contourLines);
        this.scene.remove(this.labels);

        this.createContent();
    }

    setOptions(options) {
        this.options = { ...this.options, ...options };
        this.update(this.data);
    }

    resize(width, height) {
        this.options.width = width;
        this.options.height = height;

        this.camera.aspect = width / height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(width, height);
    }

    dispose() {
        this.renderer.dispose();
        this.controls.dispose();

        while (this.scene.children.length > 0) {
            const object = this.scene.children[0];
            if (object instanceof THREE.Mesh) {
                object.geometry.dispose();
                object.material.dispose();
            }
            this.scene.remove(object);
        }
    }
}

export {ThreeContourRenderer};