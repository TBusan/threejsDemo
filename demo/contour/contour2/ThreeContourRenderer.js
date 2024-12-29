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
        this.scene.background = new THREE.Color(0x000000);  // 黑色背景

        // 使用正交相机代替透视相机
        const aspect = this.options.width / this.options.height;
        const frustumSize = 10;
        this.camera = new THREE.OrthographicCamera(
            -frustumSize * aspect / 2,
            frustumSize * aspect / 2,
            frustumSize / 2,
            -frustumSize / 2,
            0.1,
            1000
        );
        this.camera.position.set(0, 0, 10);
        this.camera.lookAt(0, 0, 0);

        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.options.width, this.options.height);
        container.appendChild(this.renderer.domElement);

        // 修改控制器设置
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        // this.controls.enableRotate = false;  // 禁用旋转
        // this.controls.enableZoom = true;     // 允许缩放
        // this.controls.enablePan = true;      // 允许平移
        // this.controls.screenSpacePanning = true;  // 使用屏幕空间平移

        // 初始化组件
        this.contourLines = new THREE.Group();
        this.labels = new THREE.Group();
        this.surface = null;
        this.group = new THREE.Group();
        this.scene.add(this.group);

        // 创建初始内容
        this.createContent();

        // 开始渲染循环
        this.render();

        // 添加鼠标交互相关的属性
        this.container = container;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.hoveredPoint = null;
        this.hoverLabel = null;

        // 添加鼠标移动事件监听
        this.container.addEventListener('mousemove', this.onMouseMove.bind(this));
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
        this.createColorBar();

        if (this.options.showLabels) {
            this.scene.add(this.labels);
        }
    }

    createSurface() {
        // 计算实际的物理尺寸
        const width = this.data.x[this.data.x.length - 1] - this.data.x[0];
        const height = this.data.y[this.data.y.length - 1] - this.data.y[0];

        const geometry = new THREE.PlaneGeometry(
            width,
            height,
            this.data.x.length - 1,
            this.data.y.length - 1
        );

        // 更新顶点位置和颜色
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        // 获取数据范围
        const values = this.data.z.flat();
        const minZ = Math.min(...values);
        const maxZ = Math.max(...values);

        // 为每个顶点设置位置和初始颜色
        for (let i = 0; i < this.data.y.length; i++) {
            for (let j = 0; j < this.data.x.length; j++) {
                const index = (i * this.data.x.length + j) * 3;
                const z = this.data.z[i][j];

                positions[index] = this.data.x[j] - width/2;
                positions[index + 1] = this.data.y[i] - height/2;
                positions[index + 2] = 0;

                // 找到z值所在的等值线区间
                let level1 = this.data.levels[0];
                let level2 = this.data.levels[this.data.levels.length - 1];
                
                for (let k = 0; k < this.data.levels.length - 1; k++) {
                    if (z >= this.data.levels[k] && z < this.data.levels[k + 1]) {
                        level1 = this.data.levels[k];
                        level2 = this.data.levels[k + 1];
                        break;
                    }
                }

                // 计算在区间内的颜色
                const t = (z - level1) / (level2 - level1);
                const levelIndex1 = this.data.levels.indexOf(level1);
                const levelIndex2 = this.data.levels.indexOf(level2);
                const colorT = (levelIndex1 + t) / (this.data.levels.length - 1);

                const color = ContourUtils.getColorForValue(colorT, 0, 1, this.options.colorScale);
                colors[index] = color.r;
                colors[index + 1] = color.g;
                colors[index + 2] = color.b;
            }
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshBasicMaterial({
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
        this.labels.clear();  // 清除旧的标签

        const width = this.data.x[this.data.x.length - 1] - this.data.x[0];
        const height = this.data.y[this.data.y.length - 1] - this.data.y[0];
        const dx = this.data.x[1] - this.data.x[0];
        const dy = this.data.y[1] - this.data.y[0];

        for (const level of this.data.levels) {
            const segments = [];

            // 生成等值线段
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

                    const cellSegments = this.findIntersections(cell, x, y, dx, dy, level);
                    if (Array.isArray(cellSegments) && cellSegments.length > 0) {
                        segments.push(...cellSegments);
                    }
                }
            }

            const connectedSegments = this.connectSegments(segments);
            
            // 为每个连接的线段组添加标签
            connectedSegments.forEach((segment, index) => {
                // 创建线条
                const geometry = new THREE.BufferGeometry();
                const vertices = new Float32Array([
                    segment[0].x - width/2, segment[0].y - height/2, 0.01,
                    segment[1].x - width/2, segment[1].y - height/2, 0.01
                ]);

                geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

                const material = new THREE.LineBasicMaterial({
                    color: 0xFFFFFF,
                    linewidth: 2,
                    transparent: false,
                    opacity: 1.0,
                    depthTest: false,
                    depthWrite: false,
                    side: THREE.DoubleSide
                });

                const line = new THREE.Line(geometry, material);
                line.renderOrder = 999;
                this.contourLines.add(line);

                // 计算线段长度
                const segmentLength = Math.hypot(
                    segment[1].x - segment[0].x,
                    segment[1].y - segment[0].y
                );

                // 只在较长的线段上添加标签，并且控制标签密度
                const MIN_LENGTH = 0.5;  // 最小线段长度阈值
                if (segmentLength > MIN_LENGTH && index % 3 === 0) {  // 增加间隔，减少标签密度
                    const midPoint = {
                        x: (segment[0].x + segment[1].x) / 2 - width/2,
                        y: (segment[0].y + segment[1].y) / 2 - height/2,
                        z: 0.01
                    };

                    // 创建标签
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 64;
                    canvas.height = 32;

                    // 绘制文本
                    context.fillStyle = 'white';
                    context.font = '16px Arial';
                    context.textAlign = 'center';
                    context.textBaseline = 'middle';
                    context.fillText(level.toFixed(1), canvas.width/2, canvas.height/2);

                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({
                        map: texture,
                        transparent: true,
                        depthTest: false,
                        depthWrite: false
                    });

                    const sprite = new THREE.Sprite(spriteMaterial);
                    sprite.position.set(midPoint.x, midPoint.y, midPoint.z);
                    sprite.scale.set(0.4, 0.2, 1);
                    sprite.renderOrder = 1000;

                    this.labels.add(sprite);
                }
            });
        }

        this.contourLines.renderOrder = 999;
        this.scene.add(this.contourLines);
        this.scene.add(this.labels);
    }

    connectSegments(segments) {
        if (segments.length === 0) return [];
        
        const connected = [];
        const used = new Set();
        
        const TOLERANCE = 0.01;
        
        // 判断两点是否可以连接
        const isClose = (p1, p2) => {
            const dx = p1.x - p2.x;
            const dy = p1.y - p2.y;
            return Math.sqrt(dx * dx + dy * dy) < TOLERANCE;
        };

        // 计算线段方向
        const getDirection = (seg) => {
            return Math.atan2(seg[1].y - seg[0].y, seg[1].x - seg[0].x);
        };

        // 查找最佳连接
        const findBestConnection = (currentSeg) => {
            let bestIdx = -1;
            let bestAngleDiff = Math.PI;
            let shouldReverse = false;
            const currentDir = getDirection(currentSeg);

            segments.forEach((seg, idx) => {
                if (used.has(idx)) return;

                // 检查两个可能的连接方向
                if (isClose(currentSeg[1], seg[0])) {
                    const angleDiff = Math.abs(currentDir - getDirection(seg));
                    if (angleDiff < bestAngleDiff) {
                        bestAngleDiff = angleDiff;
                        bestIdx = idx;
                        shouldReverse = false;
                    }
                }
                if (isClose(currentSeg[1], seg[1])) {
                    const angleDiff = Math.abs(currentDir - getDirection([seg[1], seg[0]]));
                    if (angleDiff < bestAngleDiff) {
                        bestAngleDiff = angleDiff;
                        bestIdx = idx;
                        shouldReverse = true;
                    }
                }
            });

            return bestIdx === -1 ? null : {
                segment: segments[bestIdx],
                index: bestIdx,
                reverse: shouldReverse
            };
        };

        // 构建路径
        while (used.size < segments.length) {
            const startIdx = segments.findIndex((_, i) => !used.has(i));
            if (startIdx === -1) break;

            let currentPath = [segments[startIdx]];
            used.add(startIdx);

            let foundConnection = true;
            while (foundConnection) {
                foundConnection = false;
                const conn = findBestConnection(currentPath[currentPath.length - 1]);
                if (conn) {
                    used.add(conn.index);
                    currentPath.push(conn.reverse ? [conn.segment[1], conn.segment[0]] : conn.segment);
                    foundConnection = true;
                }
            }

            connected.push(...currentPath);
        }

        return connected;
    }

    findIntersections(cell, x, y, dx, dy, level) {
        const intersections = [];
        const edges = [
            { p1: [x, y], p2: [x + dx, y], v1: cell[0], v2: cell[1] },         // 上边
            { p1: [x + dx, y], p2: [x + dx, y + dy], v1: cell[1], v2: cell[2] },   // 右边
            { p1: [x + dx, y + dy], p2: [x, y + dy], v1: cell[2], v2: cell[3] },   // 下边
            { p1: [x, y + dy], p2: [x, y], v1: cell[3], v2: cell[0] }          // 左边
        ];

        // 计算中心点值
        const centerValue = (cell[0] + cell[1] + cell[2] + cell[3]) / 4;

        edges.forEach(edge => {
            if ((edge.v1 < level && edge.v2 >= level) || (edge.v1 >= level && edge.v2 < level)) {
                const t = (level - edge.v1) / (edge.v2 - edge.v1);
                intersections.push({
                    x: edge.p1[0] + t * (edge.p2[0] - edge.p1[0]),
                    y: edge.p1[1] + t * (edge.p2[1] - edge.p1[1]),
                    value: level
                });
            }
        });

        // 处理鞍点情况
        if (intersections.length === 4) {
            // 根据中心点值决定连接方式
            if (centerValue > level) {
                return [
                    [intersections[0], intersections[3]],
                    [intersections[1], intersections[2]]
                ];
            } else {
                return [
                    [intersections[0], intersections[1]],
                    [intersections[2], intersections[3]]
                ];
            }
        }

        return intersections.length === 2 ? [intersections] : [];
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

        this.container.removeEventListener('mousemove', this.onMouseMove);
        this.removeHoverLabel();
    }

    createColorBar() {
        // 色带的尺寸和位置
        const barWidth = 0.5;
        const barHeight = 8;
        const barX = 5;  // 放在右侧
        const barY = 0;

        // 创建色带几何体
        const geometry = new THREE.PlaneGeometry(barWidth, barHeight, 1, this.data.levels.length - 1);
        const positions = geometry.attributes.position.array;
        const colors = new Float32Array(positions.length);

        // 获取数据范围
        const values = this.data.z.flat();
        const minZ = Math.min(...values);
        const maxZ = Math.max(...values);

        // 为每个顶点设置颜色
        for (let i = 0; i < positions.length / 3; i++) {
            const row = Math.floor(i / 2);  // 每行2个顶点
            const t = 1 - (row / (this.data.levels.length - 1));  // 从上到下递减
            const color = ContourUtils.getColorForValue(t, 0, 1, this.options.colorScale);
            
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;
        }

        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

        const material = new THREE.MeshBasicMaterial({
            vertexColors: true,
            side: THREE.DoubleSide
        });

        const colorBar = new THREE.Mesh(geometry, material);
        colorBar.position.set(barX, barY, 0);

        // 添加刻度标签
        for (let i = 0; i < this.data.levels.length; i++) {
            const value = this.data.levels[i];
            const y = barY + barHeight/2 - (i / (this.data.levels.length - 1)) * barHeight;
            
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 32;

            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.textAlign = 'left';
            context.textBaseline = 'middle';
            context.fillText(value.toFixed(1), 4, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true
            });

            const sprite = new THREE.Sprite(spriteMaterial);
            sprite.position.set(barX + barWidth/2 + 0.5, y, 0);
            sprite.scale.set(0.5, 0.25, 1);
            
            this.group.add(sprite);
        }

        this.group.add(colorBar);
    }

    // 添加鼠标移动处理方法
    onMouseMove(event) {
        // 计算鼠标在归一化设备坐标中的位置
        const rect = this.container.getBoundingClientRect();
        this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        // 更新射线
        this.raycaster.setFromCamera(this.mouse, this.camera);

        // 检测与平面的交点
        if (this.surface) {
            const intersects = this.raycaster.intersectObject(this.surface);
            
            if (intersects.length > 0) {
                const point = intersects[0].point;
                
                // 计算对应的数据值
                const width = this.data.x[this.data.x.length - 1] - this.data.x[0];
                const height = this.data.y[this.data.y.length - 1] - this.data.y[0];
                
                const adjustedX = point.x + width/2;
                const adjustedY = point.y + height/2;
                
                // 计算在数据网格中的位置
                const xRatio = (adjustedX - this.data.x[0]) / (this.data.x[this.data.x.length - 1] - this.data.x[0]);
                const yRatio = (adjustedY - this.data.y[0]) / (this.data.y[this.data.y.length - 1] - this.data.y[0]);
                
                // 计算数据索引和插值权重
                const xIndex = Math.min(Math.max(0, Math.floor(xRatio * (this.data.x.length - 1))), this.data.x.length - 2);
                const yIndex = Math.min(Math.max(0, Math.floor(yRatio * (this.data.y.length - 1))), this.data.y.length - 2);
                
                const xFrac = xRatio * (this.data.x.length - 1) - xIndex;
                const yFrac = yRatio * (this.data.y.length - 1) - yIndex;
                
                // 双线性插值计算精确值
                const v00 = this.data.z[yIndex][xIndex];
                const v10 = this.data.z[yIndex][xIndex + 1];
                const v01 = this.data.z[yIndex + 1][xIndex];
                const v11 = this.data.z[yIndex + 1][xIndex + 1];
                
                const value = (1 - xFrac) * (1 - yFrac) * v00 +
                             xFrac * (1 - yFrac) * v10 +
                             (1 - xFrac) * yFrac * v01 +
                             xFrac * yFrac * v11;

                // 找到值所在的等值线区间
                let level1 = this.data.levels[0];
                let level2 = this.data.levels[this.data.levels.length - 1];
                
                for (let i = 0; i < this.data.levels.length - 1; i++) {
                    if (value >= this.data.levels[i] && value < this.data.levels[i + 1]) {
                        level1 = this.data.levels[i];
                        level2 = this.data.levels[i + 1];
                        break;
                    }
                }

                // 确保值在正确的区间内
                const clampedValue = Math.max(level1, Math.min(level2, value));

                // 更新或创建悬停标签
                this.updateHoverLabel(point, clampedValue);
            } else {
                this.removeHoverLabel();
            }
        }
    }

    // 更新悬停标签
    updateHoverLabel(position, value) {
        if (!this.hoverLabel) {
            // 创建标签
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.width = 64;
            canvas.height = 32;

            // 绘制文本
            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(value.toFixed(1), canvas.width/2, canvas.height/2);

            const texture = new THREE.CanvasTexture(canvas);
            const spriteMaterial = new THREE.SpriteMaterial({
                map: texture,
                transparent: true,
                depthTest: false,
                depthWrite: false
            });

            this.hoverLabel = new THREE.Sprite(spriteMaterial);
            this.hoverLabel.scale.set(0.4, 0.2, 1);
            this.hoverLabel.renderOrder = 2000;  // 确保在最上层
            this.scene.add(this.hoverLabel);
        } else {
            // 更新标签内容
            const canvas = this.hoverLabel.material.map.image;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.fillStyle = 'white';
            context.font = '16px Arial';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(value.toFixed(1), canvas.width/2, canvas.height/2);
            this.hoverLabel.material.map.needsUpdate = true;
        }

        // 更新标签位置
        this.hoverLabel.position.copy(position);
        this.hoverLabel.position.z += 0.1;  // 稍微抬高以确保可见
    }

    // 移除悬停标签
    removeHoverLabel() {
        if (this.hoverLabel) {
            this.scene.remove(this.hoverLabel);
            this.hoverLabel.material.dispose();
            this.hoverLabel.material.map.dispose();
            this.hoverLabel = null;
        }
    }
}

export {ThreeContourRenderer};