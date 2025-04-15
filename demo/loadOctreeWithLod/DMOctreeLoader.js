// DMOctreeLoader.js - 用于加载和显示DM格式八叉树数据的Three.js加载器
import * as THREE from 'three';

class DMOctreeLoader {
    constructor() {
        this.octreeData = null;
        this.pointsGeometry = null;
        this.lodLevels = 8; // 最大LOD级别数量
        this.pointSize = 1.0;
        this.rootNode = null;
        this.pointsMaterial = new THREE.PointsMaterial({
            size: this.pointSize,
            vertexColors: true,
            sizeAttenuation: true
        });
    }

    // 加载DM格式文件
    load(url, onLoad, onProgress, onError) {
        const loader = new THREE.FileLoader();
        loader.setResponseType('arraybuffer');
        debugger
        loader.load(url, (buffer) => {
            this.parse(buffer);
            if (onLoad) onLoad(this);
        }, onProgress, onError);
    }

    // 解析二进制DM数据
    parse(buffer) {
        const view = new DataView(buffer);
        let offset = 0;
        
        // 检查文件头魔数
        const magicBytes = new Uint8Array(buffer, offset, 8);
        const magic = new TextDecoder().decode(magicBytes);
        offset += 8;
        
        if (magic !== 'DMOCTREE') {
            throw new Error('不是有效的DM octree文件');
        }
        
        // 读取版本号
        const version = view.getUint32(offset, true);
        offset += 4;
        
        if (version !== 1) {
            throw new Error(`不支持的DM octree版本: ${version}`);
        }
        
        // 读取边界
        const bounds = {
            min: {
                x: view.getFloat64(offset, true),
                y: view.getFloat64(offset + 8, true),
                z: view.getFloat64(offset + 16, true),
            },
            max: {
                x: view.getFloat64(offset + 24, true),
                y: view.getFloat64(offset + 32, true),
                z: view.getFloat64(offset + 40, true),
            }
        };
        offset += 48;
        
        // 读取根节点偏移量
        const rootOffset = view.getBigUint64(offset, true);
        offset = Number(rootOffset);
        
        // 解析八叉树结构
        this.rootNode = this.parseNode(view, offset);
        
        // 创建每一级LOD的几何体
        this.createLODGeometries();
        
        return this.rootNode;
    }
    
    // 递归解析八叉树节点
    parseNode(view, offset) {
        const isLeaf = view.getUint8(offset) !== 0;
        offset += 1;
        
        const node = {
            isLeaf: isLeaf,
            children: [],
            value: null,
            points: []
        };
        
        if (isLeaf) {
            // 叶子节点有值
            node.value = view.getFloat64(offset, true);
            offset += 8;
        } else {
            // 非叶子节点有子节点指针
            const childOffsets = [];
            for (let i = 0; i < 8; i++) {
                const childOffset = view.getBigUint64(offset, true);
                offset += 8;
                childOffsets.push(Number(childOffset));
            }
            
            // 解析子节点
            for (let i = 0; i < 8; i++) {
                if (childOffsets[i] > 0) {
                    node.children[i] = this.parseNode(view, childOffsets[i]);
                } else {
                    node.children[i] = null;
                }
            }
        }
        
        return node;
    }
    
    // 为不同LOD级别创建几何体
    createLODGeometries() {
        this.lodMeshes = [];
        
        // 对每个LOD级别提取点
        for (let level = 0; level < this.lodLevels; level++) {
            const points = [];
            const colors = [];
            
            this.extractPointsForLOD(this.rootNode, points, colors, 0, level);
            
            if (points.length > 0) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                
                const pointsMesh = new THREE.Points(geometry, this.pointsMaterial.clone());
                this.lodMeshes.push(pointsMesh);
            }
        }
    }
    
    // 根据LOD级别递归提取点
    extractPointsForLOD(node, points, colors, currentDepth, maxDepth) {
        if (!node) return;
        
        if (node.isLeaf || currentDepth >= maxDepth) {
            // 到达LOD级别或叶子节点，添加点
            if (node.isLeaf) {
                const value = node.value;
                
                // 这里根据value值生成颜色
                // 这可以根据你的值范围进行调整
                const normalizedValue = (value + 200) / 400; // 假设值在-200到200之间
                const color = this.getColorFromValue(normalizedValue);
                
                // 为简单起见，我们在这里只添加节点的中心点
                // 实际应用中可能需要根据节点大小生成更多点
                points.push(node.x || 0, node.y || 0, node.z || 0);
                colors.push(color.r, color.g, color.b);
            }
            return;
        }
        
        // 继续遍历子节点
        for (let i = 0; i < 8; i++) {
            if (node.children[i]) {
                this.extractPointsForLOD(node.children[i], points, colors, currentDepth + 1, maxDepth);
            }
        }
    }
    
    // 根据值生成颜色
    getColorFromValue(normalizedValue) {
        // 使用一个简单的色谱映射
        const r = normalizedValue < 0.5 ? 0 : (normalizedValue - 0.5) * 2;
        const g = normalizedValue < 0.5 ? normalizedValue * 2 : (1 - normalizedValue) * 2;
        const b = normalizedValue > 0.5 ? 0 : 1 - normalizedValue * 2;
        
        return { r, g, b };
    }
    
    // 获取适合当前相机距离的LOD级别
    getLODLevelForDistance(camera, boundingRadius) {
        // 计算相机到场景中心的距离
        const distance = camera.position.length();
        
        // 根据距离选择LOD级别
        // 越远使用越低的精度
        const normalizedDistance = Math.min(distance / (boundingRadius * 5), 1);
        const level = Math.floor(normalizedDistance * (this.lodLevels - 1));
        
        return this.lodLevels - 1 - level; // 反转，使近距离是最高精度
    }
    
    // 更新LOD显示
    updateLOD(camera, scene, boundingRadius) {
        if (!this.lodMeshes || this.lodMeshes.length === 0) return;
        
        // 获取当前应显示的LOD级别
        const currentLevel = this.getLODLevelForDistance(camera, boundingRadius);
        
        // 更新场景中的可见性
        for (let i = 0; i < this.lodMeshes.length; i++) {
            if (scene.children.includes(this.lodMeshes[i])) {
                scene.remove(this.lodMeshes[i]);
            }
        }
        
        // 添加当前级别
        if (this.lodMeshes[currentLevel]) {
            scene.add(this.lodMeshes[currentLevel]);
        }
    }
}

// 示例用法
export function loadAndDisplayDMOctree(url, scene, camera, renderer) {
    const loader = new DMOctreeLoader();
    const boundingRadius = 200; // 估计的模型半径，应根据实际数据调整
    
    debugger

    loader.load(url, () => {
        // 初始加载时添加到场景
        if (loader.lodMeshes && loader.lodMeshes.length > 0) {
            scene.add(loader.lodMeshes[0]);
        }
        
        // 添加相机移动时的LOD更新
        function animate() {
            requestAnimationFrame(animate);
            
            // 在每一帧更新LOD
            loader.updateLOD(camera, scene, boundingRadius);
            
            renderer.render(scene, camera);
        }
        
        animate();
    });
    
    return loader;
}