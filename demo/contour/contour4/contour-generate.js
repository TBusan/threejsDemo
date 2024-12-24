import * as THREE from 'three';
export default class ContourGenerator {
    constructor(data, width, height) {
        this.data = data;      // z值矩阵
        this.width = width;    // 数据宽度
        this.height = height;  // 数据高度
    }

    // 在两点之间进行线性插值
    interpolate(v1, v2, level) {
        if (v2 - v1 === 0) return 0.5;
        return (level - v1) / (v2 - v1);
    }

    // 生成指定level的等值线
    generateContours(level) {
        const lines = [];
        
        for(let i = 0; i < this.height - 1; i++) {
            for(let j = 0; j < this.width - 1; j++) {
                const cell = [
                    this.data[i][j],        // z1
                    this.data[i][j + 1],    // z2
                    this.data[i + 1][j],    // z3
                    this.data[i + 1][j + 1] // z4
                ];
                
                const segments = this.marchingSquares(cell, level, i, j);
                if(segments) lines.push(...segments);
            }
        }
        
        return lines;
    }

    // Marching Squares 算法实现
    marchingSquares(cell, level, row, col) {
        const code = cell.map(z => z > level ? 1 : 0)
                        .reduce((acc, val, idx) => acc | (val << idx), 0);
        
        return this.getContourSegments(code, cell, level, row, col);
    }

    // 根据状态码返回对应的线段
    getContourSegments(code, cell, level, row, col) {
        // 网格单元的四条边
        const edges = {
            top: { p1: [0, 0], p2: [1, 0] },
            right: { p1: [1, 0], p2: [1, 1] },
            bottom: { p1: [0, 1], p2: [1, 1] },
            left: { p1: [0, 0], p2: [0, 1] }
        };

        // 根据marching squares查找表获取线段配置
        const segments = this.getSegmentConfiguration(code);
        if (!segments) return null;

        // 转换成实际坐标
        return segments.map(seg => {
            const start = this.getIntersectionPoint(
                cell, 
                level, 
                edges[seg[0]],
                row,
                col
            );
            const end = this.getIntersectionPoint(
                cell,
                level,
                edges[seg[1]],
                row,
                col
            );

            return {
                start: new THREE.Vector2(start.x, start.y),
                end: new THREE.Vector2(end.x, end.y)
            };
        });
    }

    // 获取线段配置
    getSegmentConfiguration(code) {
        // Marching Squares 查找表
        const SEGMENT_TABLE = {
            0: null,
            1: [['left', 'bottom']],
            2: [['bottom', 'right']],
            3: [['left', 'right']],
            4: [['top', 'right']],
            5: [['left', 'top'], ['bottom', 'right']],
            6: [['top', 'bottom']],
            7: [['left', 'top']],
            8: [['left', 'top']],
            9: [['top', 'bottom']],
            10: [['top', 'right'], ['left', 'bottom']],
            11: [['top', 'right']],
            12: [['left', 'right']],
            13: [['bottom', 'right']],
            14: [['left', 'bottom']],
            15: null
        };

        return SEGMENT_TABLE[code];
    }

    // 计算等值线与网格边的交点
    getIntersectionPoint(cell, level, edge, row, col) {
        const [x1, y1] = edge.p1;
        const [x2, y2] = edge.p2;

        // 获取边上两个顶点的值
        const v1 = cell[y1 * 2 + x1];
        const v2 = cell[y2 * 2 + x2];

        // 计算插值
        const t = this.interpolate(v1, v2, level);

        // 计算实际坐标
        return {
            x: (col + x1 + (x2 - x1) * t),
            y: (row + y1 + (y2 - y1) * t)
        };
    }
}