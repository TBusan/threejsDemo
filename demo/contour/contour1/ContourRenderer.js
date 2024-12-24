import * as THREE from 'three';

export class ContourRenderer {
    constructor(data, options = {}) {
        this.data = this.interpolateData(data, 4);
        this.width = this.data.x.length;
        this.height = this.data.y.length;
        this.group = new THREE.Group();
        this.options = {
            showLabels: false,
            labelSize: 0.3,
            labelColor: '#000000',
            ...options
        };
    }

    interpolateData(data, factor) {
        // 创建更密集的坐标网格
        const newXCount = (data.x.length - 1) * factor + 1;
        const newYCount = (data.y.length - 1) * factor + 1;
        
        const xStep = (data.x[data.x.length - 1] - data.x[0]) / (newXCount - 1);
        const yStep = (data.y[data.y.length - 1] - data.y[0]) / (newYCount - 1);
        
        // 生成新的坐标数组
        const newX = Array.from({ length: newXCount }, (_, i) => data.x[0] + i * xStep);
        const newY = Array.from({ length: newYCount }, (_, i) => data.y[0] + i * yStep);
        
        // 生成新的值网格
        const newZ = Array(newYCount).fill().map(() => Array(newXCount).fill(0));
        
        // 对每个新网格点进行双线性插值
        for (let y = 0; y < newYCount; y++) {
            for (let x = 0; x < newXCount; x++) {
                const xPos = data.x[0] + (x * xStep);
                const yPos = data.y[0] + (y * yStep);
                
                // 找到原始网格中的位置
                const xIndex = (xPos - data.x[0]) / (data.x[1] - data.x[0]);
                const yIndex = (yPos - data.y[0]) / (data.y[1] - data.y[0]);
                
                const x0 = Math.floor(xIndex);
                const x1 = Math.min(x0 + 1, data.x.length - 1);
                const y0 = Math.floor(yIndex);
                const y1 = Math.min(y0 + 1, data.y.length - 1);
                
                const xFrac = xIndex - x0;
                const yFrac = yIndex - y0;
                
                // 双线性插值
                const v00 = data.z[y0][x0];
                const v10 = data.z[y0][x1];
                const v01 = data.z[y1][x0];
                const v11 = data.z[y1][x1];
                
                newZ[y][x] = (1 - xFrac) * (1 - yFrac) * v00 +
                            xFrac * (1 - yFrac) * v10 +
                            (1 - xFrac) * yFrac * v01 +
                            xFrac * yFrac * v11;
            }
        }
        
        return {
            x: newX,
            y: newY,
            z: newZ
        };
    }

    generate() {
        const contours = this.generateContours();
        this.createLines(contours);
        return this.group;
    }

    generateContours() {
        const values = this.data.z.flat();
        const min = Math.min(...values);
        const max = Math.max(...values);
        
        // 增加等值线数量
        const count = 20; // 增加等值线数量
        const step = (max - min) / count;
        const levels = Array.from({ length: count + 1 }, (_, i) => min + i * step);

        return levels.map(level => ({
            level,
            segments: this.findContourSegments(level)
        }));
    }

    findContourSegments(level) {
        const segments = [];
        const dx = this.data.x[1] - this.data.x[0];
        const dy = this.data.y[1] - this.data.y[0];

        // 遍历每个网格单元
        for (let y = 0; y < this.height - 1; y++) {
            for (let x = 0; x < this.width - 1; x++) {
                // 获取单元格四个角的值
                const cell = [
                    this.data.z[y][x],        // 左上
                    this.data.z[y][x + 1],    // 右上
                    this.data.z[y + 1][x + 1],// 右下
                    this.data.z[y + 1][x]     // 左下
                ];

                // 计算每个角相对于level的状态（0或1）
                const cellCode = cell.map(v => v >= level ? 1 : 0)
                                   .reduce((acc, val, i) => acc | (val << i), 0);

                // 如果单元格内没有等值线，跳过
                if (cellCode === 0 || cellCode === 15) continue;

                // 计算插值
                const points = [];
                if ((cellCode & 1) !== ((cellCode >> 1) & 1)) {
                    // 上边有交点
                    const t = (level - cell[0]) / (cell[1] - cell[0]);
                    points.push([
                        x * dx + t * dx,
                        y * dy
                    ]);
                }
                if ((cellCode >> 1 & 1) !== ((cellCode >> 2) & 1)) {
                    // 右边有交点
                    const t = (level - cell[1]) / (cell[2] - cell[1]);
                    points.push([
                        (x + 1) * dx,
                        y * dy + t * dy
                    ]);
                }
                if ((cellCode >> 2 & 1) !== ((cellCode >> 3) & 1)) {
                    // 下边有交点
                    const t = (level - cell[2]) / (cell[3] - cell[2]);
                    points.push([
                        (x + 1) * dx - t * dx,
                        (y + 1) * dy
                    ]);
                }
                if ((cellCode >> 3 & 1) !== (cellCode & 1)) {
                    // 左边有交点
                    const t = (level - cell[3]) / (cell[0] - cell[3]);
                    points.push([
                        x * dx,
                        (y + 1) * dy - t * dy
                    ]);
                }

                // 根据情况连接点
                if (points.length === 2) {
                    segments.push(points);
                } else if (points.length === 4) {
                    // 处理鞍点情况
                    const midX = (points[0][0] + points[2][0]) / 2;
                    const midY = (points[0][1] + points[2][1]) / 2;
                    const centerValue = this.interpolateValue(x + 0.5, y + 0.5);
                    
                    if (centerValue >= level) {
                        segments.push([points[0], points[3]]);
                        segments.push([points[1], points[2]]);
                    } else {
                        segments.push([points[0], points[1]]);
                        segments.push([points[2], points[3]]);
                    }
                }
            }
        }

        return segments;
    }

    interpolateValue(x, y) {
        // 双线性插值计算网格内部的值
        const ix = Math.floor(x);
        const iy = Math.floor(y);
        const fx = x - ix;
        const fy = y - iy;

        const v00 = this.data.z[iy][ix];
        const v10 = this.data.z[iy][ix + 1];
        const v01 = this.data.z[iy + 1][ix];
        const v11 = this.data.z[iy + 1][ix + 1];

        return (1 - fx) * (1 - fy) * v00 +
               fx * (1 - fy) * v10 +
               (1 - fx) * fy * v01 +
               fx * fy * v11;
    }

    createLines(contours) {
        contours.forEach(contour => {
            // 找出最长的线段作为标注位置
            let longestSegment = null;
            let maxLength = 0;

            // 创建所有线段
            contour.segments.forEach(segment => {
                const points = segment.map(p => new THREE.Vector3(p[0], p[1], 0));
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    linewidth: 1
                });
                const line = new THREE.Line(geometry, material);
                this.group.add(line);

                // 计算线段长度
                const length = Math.hypot(
                    segment[1][0] - segment[0][0],
                    segment[1][1] - segment[0][1]
                );
                if (length > maxLength) {
                    maxLength = length;
                    longestSegment = segment;
                }
            });

            // 只在最长的线段上添加标签
            if (this.options.showLabels && longestSegment) {
                this.addLabel(longestSegment, contour.level);
            }
        });
    }

    addLabel(segment, value) {
        // 计算线段中点
        const midPoint = [
            (segment[0][0] + segment[1][0]) / 2,
            (segment[0][1] + segment[1][1]) / 2
        ];

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;

        // 设置文本样式
        ctx.fillStyle = this.options.labelColor;
        ctx.font = 'bold 28px Arial';  // 稍微减小字体大小
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // 添加白色背景
        const text = value.toFixed(1);
        const textWidth = ctx.measureText(text).width;
        const padding = 4;
        
        ctx.fillStyle = 'white';
        ctx.fillRect(
            (canvas.width - textWidth) / 2 - padding,
            canvas.height / 2 - 14,
            textWidth + padding * 2,
            28
        );

        // 绘制文本
        ctx.fillStyle = this.options.labelColor;
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;

        const spriteMaterial = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            depthTest: false,
            depthWrite: false
        });

        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.position.set(midPoint[0], midPoint[1], 0.1);
        sprite.scale.set(this.options.labelSize * 0.8, this.options.labelSize * 0.4, 1);  // 稍微减小标签尺寸
        sprite.renderOrder = 1;

        this.group.add(sprite);
    }
} 