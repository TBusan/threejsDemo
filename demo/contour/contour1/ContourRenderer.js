import * as THREE from 'three';

export class ContourRenderer {
    constructor(data) {
        this.data = data;
        this.width = data.x.length;
        this.height = data.y.length;
        this.group = new THREE.Group();
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
        
        // 生成等值线级别
        const count = 10;
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

                // 计算插值点
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
            contour.segments.forEach(segment => {
                const points = segment.map(p => new THREE.Vector3(p[0], p[1], 0));
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x000000,
                    linewidth: 1
                });
                const line = new THREE.Line(geometry, material);
                this.group.add(line);
            });
        });
    }
} 