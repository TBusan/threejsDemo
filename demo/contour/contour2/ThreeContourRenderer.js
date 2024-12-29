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

        for (const level of this.data.levels) {
            const lines = this.generateContourLines(level);

            for (const line of lines) {
                const geometry = new THREE.BufferGeometry();

                // 转换点数组为顶点
                const vertices = new Float32Array(line.length * 3);
                for (let i = 0; i < line.length; i++) {
                    vertices[i * 3] = line[i].x;
                    vertices[i * 3 + 1] = line[i].y;
                    vertices[i * 3 + 2] = level;
                }

                geometry.setAttribute(
                    'position',
                    new THREE.BufferAttribute(vertices, 3)
                );

                const material = new THREE.LineBasicMaterial({
                    color: ContourUtils.getColorForValue(
                        level,
                        Math.min(...this.data.levels),
                        Math.max(...this.data.levels),
                        this.options.colorScale
                    ),
                    linewidth: this.options.lineWidth
                });

                const contourLine = new THREE.Line(geometry, material);
                this.contourLines.add(contourLine);

                if (this.options.showLabels) {
                    this.addLabel(
                        line[Math.floor(line.length / 2)],
                        level
                    );
                }
            }
        }

        this.scene.add(this.contourLines);
    }

    generateContourLines(level) {
        const lines = [];
        const rows = this.data.z.length - 1;
        const cols = this.data.z[0].length - 1;

        for (let i = 0; i < rows; i++) {
            for (let j = 0; j < cols; j++) {
                const cell = [
                    this.data.z[i][j],
                    this.data.z[i][j + 1],
                    this.data.z[i + 1][j + 1],
                    this.data.z[i + 1][j]
                ];

                const segments = this.processCell(cell, i, j, level);
                if (segments.length > 0) {
                    lines.push(segments);
                }
            }
        }

        return this.connectLines(lines);
    }

    connectLines(lines) {
        const connected = [];
        const used = new Set();

        const getLineKey = line => line.map(p => `${p.x},${p.y}`).join('|');
        
        const canConnect = (line1, line2) => {
            const last = line1[line1.length - 1];
            const first = line2[0];
            
            const dx = last.x - first.x;
            const dy = last.y - first.y;
            
            // 如果两点距离足够近，认为可以连接
            return Math.sqrt(dx * dx + dy * dy) < 0.1;
        };

        lines.forEach(line => {
            const lineKey = getLineKey(line);
            if (used.has(lineKey)) return;

            const newLine = [...line];
            used.add(lineKey);

            let changed = true;
            while (changed) {
                changed = false;

                for (const candidate of lines) {
                    const candidateKey = getLineKey(candidate);
                    if (used.has(candidateKey)) continue;

                    if (canConnect(newLine, candidate)) {
                        newLine.push(...candidate);
                        used.add(candidateKey);
                        changed = true;
                    }
                }
            }

            connected.push(newLine);
        });

        return connected;
    }

    processCell(cell, row, col, level) {
        // 计算案例索引
        let caseIndex = 0;
        for (let i = 0; i < 4; i++) {
            if (cell[i] >= level) {
                caseIndex |= (1 << i);
            }
        }

        // Marching Squares 查找表
        const CASE_TABLE = {
            0: [],
            1: [[0, 3]],
            2: [[0, 1]],
            3: [[1, 3]],
            4: [[1, 2]],
            5: [[0, 1], [2, 3]],
            6: [[0, 2]],
            7: [[2, 3]],
            8: [[2, 3]],
            9: [[0, 2]],
            10: [[0, 3], [1, 2]],
            11: [[1, 2]],
            12: [[1, 3]],
            13: [[0, 1]],
            14: [[0, 3]],
            15: []
        };

        const edges = CASE_TABLE[caseIndex] || [];
        const points = [];

        // 边的顶点位置
        const edgeVertices = [
            { x: col + 0.5, y: row },      // top
            { x: col + 1, y: row + 0.5 },  // right
            { x: col + 0.5, y: row + 1 },  // bottom
            { x: col, y: row + 0.5 }       // left
        ];

        // 计算每条边的交点
        edges.forEach(([e1, e2]) => {
            const v1 = cell[e1];
            const v2 = cell[e2];
            const t = (level - v1) / (v2 - v1);

            const p1 = edgeVertices[e1];
            const p2 = edgeVertices[e2];

            points.push({
                x: p1.x + t * (p2.x - p1.x),
                y: p1.y + t * (p2.y - p1.y),
                z: level
            });
        });

        return points;
    }

    processCell(cell, row, col, level) {
        // 计算案例索引
        let caseIndex = 0;
        for (let i = 0; i < 4; i++) {
            if (cell[i] >= level) {
                caseIndex |= (1 << i);
            }
        }

        // 获取线段配置
        const segments = [];
        // ... 根据 caseIndex 添加适当的线段
        // 这里需要实现完整的 Marching Squares 算法

        return segments;
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