import * as THREE from 'three';
export default class ContourMesh {
    constructor(lines) {
        // 创建线条几何体
        const geometry = new THREE.BufferGeometry();
        
        // 将线段转换为顶点数组
        const vertices = [];
        lines.forEach(line => {
            vertices.push(line.start.x, line.start.y, 0);
            vertices.push(line.end.x, line.end.y, 0);
        });
        
        // 设置顶点属性
        geometry.setAttribute('position', 
            new THREE.Float32BufferAttribute(vertices, 3));
        
        // 创建线条材质
        const material = new THREE.LineBasicMaterial({
            color: 0xffffff,
            linewidth: 1
        });
        
        // 创建线条mesh
        this.mesh = new THREE.LineSegments(geometry, material);
    }
}