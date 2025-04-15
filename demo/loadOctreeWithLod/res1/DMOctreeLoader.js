// DMOctreeLoader.js - 用于加载和显示DM格式八叉树数据的Three.js加载器
import * as THREE from 'three';

class DMOctreeLoader {
    constructor() {
        this.octreeData = null;
        this.pointsGeometry = null;
        this.lodLevels = 8; // 最大LOD级别数量
        this.pointSize = 5.0; // 增大点的大小，提高可见性
        this.rootNode = null;
        this.bounds = { // 添加默认边界
            min: { x: 0, y: 0, z: 0 },
            max: { x: 0, y: 0, z: 0 }
        };
        this.pointsMaterial = new THREE.PointsMaterial({
            size: this.pointSize,
            vertexColors: true,
            sizeAttenuation: true
        });
        // 用于跟踪数据范围
        this.minValue = Number.MAX_VALUE;
        this.maxValue = Number.MIN_VALUE;
    }

    // 加载DM格式文件
    load(url, onLoad, onProgress, onError) {
        const loader = new THREE.FileLoader();
        loader.setResponseType('arraybuffer');
        
        loader.load(url, (buffer) => {
            try {
                console.log("文件已加载，正在解析...");
                this.parse(buffer);
                
                // 添加详细的调试信息
                console.log("八叉树数据解析完成:", {
                    boundingBox: {
                        min: this.bounds.min,
                        max: this.bounds.max
                    },
                    lodMeshes: this.lodMeshes ? this.lodMeshes.length : 0,
                    valueRange: {
                        min: this.minValue !== Number.MAX_VALUE ? this.minValue : "未知",
                        max: this.maxValue !== Number.MIN_VALUE ? this.maxValue : "未知"
                    }
                });
                
                // 检查是否有生成的点
                if (this.lodMeshes && this.lodMeshes.length > 0) {
                    this.lodMeshes.forEach((mesh, index) => {
                        const numPoints = mesh.geometry.attributes.position.count;
                        console.log(`LOD ${index}: ${numPoints} 个点`);
                    });
                } else {
                    console.warn("没有生成任何LOD网格");
                }
                
                if (onLoad) onLoad(this);
            } catch (error) {
                console.error("解析八叉树数据时出错:", error);
                if (onError) onError(error);
            }
        }, onProgress, (error) => {
            console.error("加载文件时出错:", error);
            if (onError) onError(error);
        });
    }

    // 解析二进制DM数据
    parse(buffer) {
        if (!buffer || buffer.byteLength === 0) {
            throw new Error("无效的缓冲区数据");
        }
        
        const view = new DataView(buffer);
        let offset = 0;
        
        // 检查文件头魔数
        const magicBytes = new Uint8Array(buffer, offset, 8);
        const magic = new TextDecoder().decode(magicBytes);
        offset += 8;
        
        console.log("文件魔数:", magic);
        
        if (magic !== 'DMOCTREE') {
            throw new Error('不是有效的DM octree文件');
        }
        
        // 读取版本号
        const version = view.getUint32(offset, true);
        offset += 4;
        
        console.log("文件版本:", version);
        
        if (version !== 1) {
            console.warn(`检测到非标准版本: ${version}，尝试以版本1格式解析`);
        }
        
        // 读取边界
        this.bounds = {
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
        
        console.log("模型边界:", this.bounds);
        
        // 计算模型尺寸
        const sizeX = this.bounds.max.x - this.bounds.min.x;
        const sizeY = this.bounds.max.y - this.bounds.min.y;
        const sizeZ = this.bounds.max.z - this.bounds.min.z;
        const maxSize = Math.max(sizeX, sizeY, sizeZ);
        
        // 读取根节点偏移量
        const rootOffset = view.getBigUint64(offset, true);
        offset = Number(rootOffset);
        
        console.log("根节点偏移量:", rootOffset);
        
        // 解析八叉树结构
        const rootX = this.bounds.min.x;
        const rootY = this.bounds.min.y;
        const rootZ = this.bounds.min.z;
        
        this.rootNode = this.parseNode(view, offset, rootX, rootY, rootZ, maxSize, 0); // 添加深度参数0
        
        // 创建每一级LOD的几何体
        this.createLODGeometries();
        
        return this.rootNode;
    }
    
    // 递归解析八叉树节点
    parseNode(view, offset, x, y, z, size, depth) { // 添加深度参数
        if (offset <= 0 || offset >= view.byteLength) {
            console.warn("无效的节点偏移量:", offset);
            return null;
        }
        
        const isLeaf = view.getUint8(offset) !== 0;
        offset += 1;
        
        const node = {
            isLeaf: isLeaf,
            children: [],
            value: null,
            x: x,
            y: y,
            z: z,
            size: size,
            depth: depth // 存储节点深度
        };
        
        try {
            if (isLeaf) {
                // 叶子节点有值
                node.value = view.getFloat64(offset, true);
                offset += 8;
                
                // 更新全局值范围
                this.minValue = Math.min(this.minValue, node.value);
                this.maxValue = Math.max(this.maxValue, node.value);
                
                // 添加调试输出，但限制数量以避免日志过多
                if (depth <= 2 || Math.random() < 0.001) {
                    console.debug(`解析叶子节点: 位置(${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}), 大小=${size.toFixed(2)}, 值=${node.value}, 深度=${depth}`);
                }
            } else {
                // 非叶子节点有子节点指针
                const childOffsets = [];
                for (let i = 0; i < 8; i++) {
                    const childOffset = view.getBigUint64(offset, true);
                    offset += 8;
                    childOffsets.push(Number(childOffset));
                }
                
                // 解析子节点
                const childSize = size / 2;
                for (let i = 0; i < 8; i++) {
                    if (childOffsets[i] > 0) {
                        // 计算子节点的空间位置
                        const childX = x + (i & 1 ? childSize : 0);
                        const childY = y + (i & 2 ? childSize : 0);
                        const childZ = z + (i & 4 ? childSize : 0);
                        
                        node.children[i] = this.parseNode(
                            view, 
                            childOffsets[i], 
                            childX, 
                            childY, 
                            childZ, 
                            childSize,
                            depth + 1 // 增加深度
                        );
                    } else {
                        node.children[i] = null;
                    }
                }
            }
        } catch (error) {
            console.error("解析节点时出错:", error, "偏移量:", offset);
            return node;
        }
        
        return node;
    }
    
    // 获取最大节点深度
    getMaxDepth(node, currentDepth = 0) {
        if (!node) return currentDepth - 1;
        
        if (node.isLeaf) return currentDepth;
        
        let maxChildDepth = currentDepth;
        for (let i = 0; i < 8; i++) {
            if (node.children[i]) {
                const childDepth = this.getMaxDepth(node.children[i], currentDepth + 1);
                maxChildDepth = Math.max(maxChildDepth, childDepth);
            }
        }
        
        return maxChildDepth;
    }
    
    // 为不同LOD级别创建几何体
    createLODGeometries() {
        this.lodMeshes = [];
        
        // 检查根节点
        if (!this.rootNode) {
            console.error("无法创建LOD几何体: 根节点为空");
            return;
        }
        
        // 计算最大深度
        const maxDepth = this.getMaxDepth(this.rootNode);
        console.log(`检测到八叉树最大深度: ${maxDepth}`);
        
        // 调整LOD级别以匹配实际深度
        this.lodLevels = Math.min(this.lodLevels, maxDepth + 1);
        
        // 调试输出根节点信息
        console.debug("根节点信息:", {
            position: {x: this.rootNode.x, y: this.rootNode.y, z: this.rootNode.z},
            size: this.rootNode.size,
            isLeaf: this.rootNode.isLeaf,
            hasValue: this.rootNode.value !== null && this.rootNode.value !== undefined,
            childrenCount: this.rootNode.children.filter(c => c !== null).length
        });

        // 对每个LOD级别提取点
        for (let level = 0; level < this.lodLevels; level++) {
            const points = [];
            const colors = [];
            
            // 决定当前LOD级别需要使用的最大深度
            // LOD 0为最低细节级别（使用最小深度），最高级别号码为最高细节
            const targetDepth = Math.floor(level * (maxDepth / (this.lodLevels - 1 || 1)));
            
            console.log(`创建LOD ${level}: 目标深度=${targetDepth}, 最大深度=${maxDepth}`);
            
            this.extractPointsForLOD(this.rootNode, points, colors, 0, targetDepth);
            
            if (points.length > 0) {
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                
                const material = this.pointsMaterial.clone();
                const pointsMesh = new THREE.Points(geometry, material);
                pointsMesh.name = `LOD_${level}`;
                this.lodMeshes.push(pointsMesh);
                
                console.log(`创建了LOD ${level} 几何体，包含 ${points.length / 3} 个点`);
            } else {
                console.warn(`LOD ${level} 没有提取到任何点`);
            }
        }
    }
    
    // 根据LOD级别递归提取点
    extractPointsForLOD(node, points, colors, currentDepth, targetDepth) {
        if (!node) return;
        
        // 添加节点的点到几何体
        if (node.isLeaf || currentDepth >= targetDepth) {
            // 叶子节点或达到目标深度，添加点
            const centerX = node.x + node.size/2;
            const centerY = node.y + node.size/2;
            const centerZ = node.z + node.size/2;
            
            let value = 0;
            
            if (node.value !== null && node.value !== undefined) {
                value = node.value;
            } else if (!node.isLeaf) {
                // 如果不是叶子节点且没有值，计算子节点的平均值
                let sum = 0;
                let count = 0;
                
                for (let i = 0; i < 8; i++) {
                    if (node.children[i] && node.children[i].isLeaf) {
                        if (node.children[i].value !== null && node.children[i].value !== undefined) {
                            sum += node.children[i].value;
                            count++;
                        }
                    }
                }
                
                if (count > 0) {
                    value = sum / count;
                }
            }
            
            // 只有当我们有有效值时才添加点
            if (value !== undefined && value !== null) {
                // 输出一些节点值进行调试
                if (points.length === 0 || points.length / 3 < 5) {
                    console.debug(`添加点 位置=(${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)}), 值=${value}, 节点深度=${node.depth}`);
                }
                
                // 根据值生成颜色
                const normalizedValue = this.normalizeValue(value);
                const color = this.getColorFromValue(normalizedValue);
                
                points.push(centerX, centerY, centerZ);
                colors.push(color.r, color.g, color.b);
            }
            
            return; // 不需要进一步递归
        }
        
        // 如果未达到目标深度，继续遍历子节点
        for (let i = 0; i < 8; i++) {
            if (node.children[i]) {
                this.extractPointsForLOD(node.children[i], points, colors, currentDepth + 1, targetDepth);
            }
        }
    }
    
    // 归一化值到0-1范围
    normalizeValue(value) {
        // 使用计算出的数据范围
        if (this.minValue === Number.MAX_VALUE || this.maxValue === Number.MIN_VALUE) {
            // 如果没有正确检测到范围，使用默认值
            return 0.5;
        }
        
        const range = this.maxValue - this.minValue;
        if (range === 0) return 0.5; // 避免除零错误
        
        return Math.max(0, Math.min(1, (value - this.minValue) / range));
    }
    
    // 根据归一化值生成颜色
    getColorFromValue(normalizedValue) {
        // 实现渐变色映射
        // 从蓝色(0)到绿色(0.5)到红色(1)
        let r, g, b;
        
        if (normalizedValue < 0.5) {
            // 蓝到绿
            b = 1 - 2 * normalizedValue;
            g = 2 * normalizedValue;
            r = 0;
        } else {
            // 绿到红
            b = 0;
            g = 2 - 2 * normalizedValue;
            r = 2 * normalizedValue - 1;
        }
        
        return { r, g, b };
    }
    
    // 获取适合当前相机距离的LOD级别
    getLODLevelForDistance(camera, boundingRadius) {
        // 计算相机到场景中心的距离
        const cameraPosition = new THREE.Vector3().copy(camera.position);
        const sceneCenter = new THREE.Vector3(
            (this.bounds.min.x + this.bounds.max.x) / 2,
            (this.bounds.min.y + this.bounds.max.y) / 2,
            (this.bounds.min.z + this.bounds.max.z) / 2
        );
        
        const distance = cameraPosition.distanceTo(sceneCenter);
        
        // 根据距离选择LOD级别
        const normalizedDistance = Math.min(distance / (boundingRadius * 3), 1);
        const level = Math.floor(normalizedDistance * (this.lodMeshes.length - 1));
        
        return this.lodMeshes.length - 1 - level; // 反转，使近距离是最高精度
    }
    
    // 更新LOD显示
    updateLOD(camera, scene, boundingRadius) {
        if (!this.lodMeshes || this.lodMeshes.length === 0) return;
        
        // 获取当前应显示的LOD级别
        const currentLevel = this.getLODLevelForDistance(camera, boundingRadius);
        
        // 更新场景中的可见性
        for (let i = 0; i < this.lodMeshes.length; i++) {
            const mesh = this.lodMeshes[i];
            if (scene.children.includes(mesh)) {
                if (i !== currentLevel) {
                    scene.remove(mesh);
                }
            } else if (i === currentLevel) {
                scene.add(mesh);
            }
        }
    }
    
    // 辅助方法：自动设置相机位置以查看整个模型
    setupCamera(camera, controls) {
        // 计算模型中心
        const centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
        const centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
        const centerZ = (this.bounds.min.z + this.bounds.max.z) / 2;
        
        // 计算模型尺寸
        const sizeX = this.bounds.max.x - this.bounds.min.x;
        const sizeY = this.bounds.max.y - this.bounds.min.y;
        const sizeZ = this.bounds.max.z - this.bounds.min.z;
        const maxSize = Math.max(sizeX, sizeY, sizeZ);
        
        // 设置相机位置
        const distance = maxSize * 2;
        camera.position.set(
            centerX + distance,
            centerY + distance,
            centerZ + distance
        );
        camera.lookAt(centerX, centerY, centerZ);
        
        // 调整控制器
        if (controls) {
            controls.target.set(centerX, centerY, centerZ);
            controls.update();
        }
        
        return {
            center: new THREE.Vector3(centerX, centerY, centerZ),
            size: maxSize
        };
    }
}

// 示例用法
export function loadAndDisplayDMOctree(url, scene, camera, renderer, controls) {
    const loader = new DMOctreeLoader();
    let boundingRadius = 200; // 初始估计值
    
    loader.load(url, () => {
        // 调整相机位置
        const modelInfo = loader.setupCamera(camera, controls);
        boundingRadius = modelInfo.size / 2;
        
        console.log("模型信息:", modelInfo);
        
        // 添加参考几何体帮助调试
        const centerSphere = new THREE.Mesh(
            new THREE.SphereGeometry(5, 16, 16),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        centerSphere.position.copy(modelInfo.center);
        scene.add(centerSphere);
        
        // 添加边界框帮助调试
        const boxGeometry = new THREE.BoxGeometry(
            loader.bounds.max.x - loader.bounds.min.x,
            loader.bounds.max.y - loader.bounds.min.y,
            loader.bounds.max.z - loader.bounds.min.z
        );
        const boxMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xffff00, 
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
        boundingBox.position.set(
            (loader.bounds.min.x + loader.bounds.max.x) / 2,
            (loader.bounds.min.y + loader.bounds.max.y) / 2,
            (loader.bounds.min.z + loader.bounds.max.z) / 2
        );
        scene.add(boundingBox);
        
        // 初始加载时添加到场景
        if (loader.lodMeshes && loader.lodMeshes.length > 0) {
            scene.add(loader.lodMeshes[0]);
            console.log("添加了初始LOD网格到场景");
        } else {
            console.warn("没有可用的LOD网格添加到场景");
        }
        
        // 添加动画函数
        function animate() {
            requestAnimationFrame(animate);
            
            // 在每一帧更新LOD
            loader.updateLOD(camera, scene, boundingRadius);
            
            if (controls) controls.update();
            renderer.render(scene, camera);
        }
        
        animate();
    }, 
    (progress) => {
        console.log("加载进度:", progress);
    },
    (error) => {
        console.error("加载失败:", error);
        // 添加一个简单的参考对象，以确认渲染系统正常工作
        const cube = new THREE.Mesh(
            new THREE.BoxGeometry(50, 50, 50),
            new THREE.MeshBasicMaterial({ color: 0xff0000 })
        );
        scene.add(cube);
        renderer.render(scene, camera);
    });
    
    return loader;
}