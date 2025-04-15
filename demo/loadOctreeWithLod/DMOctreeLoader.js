// DMOctreeLoader.js - 用于加载和显示DM格式八叉树数据的Three.js加载器
import * as THREE from 'three';

class DMOctreeLoader {
    constructor() {
        this.octreeData = null;
        this.pointsGeometry = null;
        this.lodLevels = 18; // 增加支持的最大LOD级别
        this.pointSize = 5.0; // 点的大小
        this.rootNode = null;
        this.bounds = { // 默认边界
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
        // 收集所有真实节点点
        this.allNodes = [];
        // 存储预先生成的LOD数据
        this.precomputedLOD = [];
        // 视锥剔除功能
        this.frustumCullingEnabled = true;
        this.visibleNodes = {};
        this._lastLODLevel = undefined;
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
                    },
                    totalNodes: this.allNodes.length,
                    precomputedLOD: this.precomputedLOD.length
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
        
        let rootOffset, lodSectionOffset;
        
        if (version === 1) {
            // 版本1: 只有根节点偏移量
            rootOffset = view.getBigUint64(offset, true);
        offset = Number(rootOffset);
            console.log("版本1 - 根节点偏移量:", rootOffset);
        } else if (version === 2) {
            // 版本2: 有LOD数据偏移量和根节点偏移量
            lodSectionOffset = view.getBigUint64(offset, true);
            console.log("版本2 - LOD部分偏移量:", lodSectionOffset);
            
            // 解析正常的八叉树结构
            rootOffset = offset + 8; // 跳过LOD偏移量
            offset = rootOffset;
            
            // 记录LOD偏移量，以便后续解析
            this.lodSectionOffset = Number(lodSectionOffset);
        } else {
            console.warn(`不支持的文件版本: ${version}，尝试以版本1格式解析`);
            rootOffset = view.getBigUint64(offset, true);
            offset = Number(rootOffset);
        }
        
        // 解析八叉树结构
        const rootX = this.bounds.min.x;
        const rootY = this.bounds.min.y;
        const rootZ = this.bounds.min.z;
        
        this.rootNode = this.parseNode(view, offset, rootX, rootY, rootZ, maxSize, 0);
        
        // 如果是版本2，解析LOD数据
        if (version === 2 && this.lodSectionOffset > 0) {
            this.parsePrecomputedLOD(view, this.lodSectionOffset);
        } else {
            // 对于版本1或无LOD数据的情况，收集节点用于自动生成LOD
            this.allNodes = [];
            this.collectAllNodes(this.rootNode);
            console.log(`收集到 ${this.allNodes.length} 个节点用于自动生成LOD`);
        }
        
        // 创建LOD几何体
        this.createLODGeometries();
        
        return this.rootNode;
    }
    
    // 解析预先计算的LOD数据 (版本2格式)
    parsePrecomputedLOD(view, offset) {
        try {
            // 读取LOD级别数量
            const lodLevelCount = view.getUint32(offset, true);
            offset += 4;
            
            console.log(`检测到 ${lodLevelCount} 个预计算LOD级别`);
            
            this.precomputedLOD = [];
            
            // 读取每个LOD级别的数据
            for (let i = 0; i < lodLevelCount; i++) {
                const level = view.getUint32(offset, true);
                offset += 4;
                
                const pointCount = view.getUint32(offset, true);
                offset += 4;
                
                console.log(`LOD级别 ${level}: ${pointCount} 个点`);
                
                const points = [];
                
                // 读取每个点的数据
                for (let j = 0; j < pointCount; j++) {
                    const x = view.getFloat64(offset, true);
                    offset += 8;
                    const y = view.getFloat64(offset, true);
                    offset += 8;
                    const z = view.getFloat64(offset, true);
                    offset += 8;
                    const value = view.getFloat64(offset, true);
                    offset += 8;
                    
                    // 更新全局值范围
                    this.minValue = Math.min(this.minValue, value);
                    this.maxValue = Math.max(this.maxValue, value);
                    
                    points.push({
                        position: { x, y, z },
                        value: value,
                        depth: level
                    });
                }
                
                this.precomputedLOD[level] = points;
            }
        } catch (error) {
            console.error("解析预计算LOD数据时出错:", error);
        }
    }
    
    // 收集所有节点数据，用于LOD生成 (版本1格式或无LOD数据时使用)
    collectAllNodes(node, maxNodes = 50000) {
        if (!node) return;
        
        // 为每个节点添加中心点坐标和值
        const centerX = node.x + node.size / 2;
        const centerY = node.y + node.size / 2;
        const centerZ = node.z + node.size / 2;
        
        // 所有节点都收集，无论是叶子还是非叶子
        this.allNodes.push({
            position: { x: centerX, y: centerY, z: centerZ },
            size: node.size,
            depth: node.depth,
            isLeaf: node.isLeaf,
            value: node.isLeaf ? node.value : this.getNodeAverageValue(node)
        });
        
        // 避免收集过多节点，导致内存问题
        if (this.allNodes.length >= maxNodes) {
            console.warn(`节点数量达到上限 ${maxNodes}，停止收集更多节点`);
            return;
        }
        
        // 递归处理子节点
        for (let i = 0; i < 8; i++) {
            if (node.children[i]) {
                this.collectAllNodes(node.children[i], maxNodes);
            }
        }
    }
    
    // 计算非叶子节点的平均值
    getNodeAverageValue(node) {
        if (node.isLeaf && node.value !== null && node.value !== undefined) {
            return node.value;
        }
        
        let sum = 0;
        let count = 0;
        
        for (let i = 0; i < 8; i++) {
            if (node.children[i]) {
                if (node.children[i].isLeaf && node.children[i].value !== null && node.children[i].value !== undefined) {
                    sum += node.children[i].value;
                    count++;
                } else {
                    // 递归计算非叶子子节点的平均值
                    const childValue = this.getNodeAverageValue(node.children[i]);
                    if (childValue !== null && childValue !== undefined) {
                        sum += childValue;
                        count++;
                    }
                }
            }
        }
        
        if (count > 0) {
            return sum / count;
        }
        
        return (this.minValue + this.maxValue) / 2; // 默认返回值范围的中间值
    }
    
    // 递归解析八叉树节点
    parseNode(view, offset, x, y, z, size, depth) {
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
            depth: depth
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
                            depth + 1
                        );
                    } else {
                        node.children[i] = null;
                    }
                }
            }
        } catch (error) {
            console.error("解析节点时出错:", error);
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
        
        // 检查是否有预计算的LOD数据
        if (this.precomputedLOD && this.precomputedLOD.length > 0) {
            console.log("使用预计算的LOD数据创建几何体");
            this.createLODFromPrecomputed();
            return;
        }
        
        // 检查根节点
        if (!this.rootNode) {
            console.error("无法创建LOD几何体: 根节点为空");
            return;
        }
        
        // 确保我们有收集到节点
        if (!this.allNodes || this.allNodes.length === 0) {
            console.error("没有收集到节点数据，无法创建LOD几何体");
            return;
        }
        
        console.log("使用自动生成的LOD数据创建几何体");
        
        // 计算最大深度
        const maxDepth = this.getMaxDepth(this.rootNode);
        console.log(`检测到八叉树最大深度: ${maxDepth}`);
        
        // 调整LOD级别以匹配实际深度
        this.lodLevels = Math.min(this.lodLevels, maxDepth + 1);
        
        // 按深度对节点进行排序
        this.allNodes.sort((a, b) => a.depth - b.depth);
        
        // 计算每个深度的节点数
        const nodesByDepth = {};
        for (const node of this.allNodes) {
            if (!nodesByDepth[node.depth]) {
                nodesByDepth[node.depth] = [];
            }
            nodesByDepth[node.depth].push(node);
        }
        
        // 输出节点深度分布
        console.log("节点深度分布:");
        Object.keys(nodesByDepth).sort((a, b) => parseInt(a) - parseInt(b)).forEach(depth => {
            console.log(`  深度 ${depth}: ${nodesByDepth[depth].length} 个节点`);
        });
        
        // 对每个LOD级别创建几何体
        for (let level = 0; level < this.lodLevels; level++) {
            // 计算当前LOD级别对应的最大深度
            const depthThreshold = Math.floor((level * maxDepth) / (this.lodLevels - 1));
            
            console.log(`创建LOD ${level}: 使用深度 = ${depthThreshold} 的节点`);
            
            // 选择当前LOD级别的节点 - 只使用当前深度的节点，不累积
            let currentLevelNodes = [];
            
            // 为LOD 0特殊处理，确保包含八个象限的代表点
            if (level === 0) {
                currentLevelNodes = this.selectCornerNodes();
                console.log(`LOD ${level} (特殊级别): 使用 ${currentLevelNodes.length} 个代表点`);
            } else {
                // 直接获取当前深度的所有节点
                const exactDepth = depthThreshold;
                
                if (nodesByDepth[exactDepth]) {
                    currentLevelNodes = nodesByDepth[exactDepth];
                    console.log(`LOD ${level}: 使用深度 ${exactDepth} 的 ${currentLevelNodes.length} 个节点`);
                } else {
                    console.warn(`LOD ${level}: 深度 ${exactDepth} 没有节点，尝试查找最近的深度`);
                    
                    // 找到存在节点的最近深度
                    let closestDepth = null;
                    let minDiff = Number.MAX_VALUE;
                    
                    for (const depth in nodesByDepth) {
                        const diff = Math.abs(parseInt(depth) - exactDepth);
                        if (diff < minDiff && nodesByDepth[depth].length > 0) {
                            minDiff = diff;
                            closestDepth = parseInt(depth);
                        }
                    }
                    
                    if (closestDepth !== null) {
                        currentLevelNodes = nodesByDepth[closestDepth];
                        console.log(`LOD ${level}: 使用最近的深度 ${closestDepth} 的 ${currentLevelNodes.length} 个节点`);
                    }
                }
            }
            
            // 为该LOD级别创建几何体 - 直接使用当前级别的节点，不累积
            if (currentLevelNodes.length > 0) {
                this.createGeometryForLOD(level, currentLevelNodes);
            } else {
                console.warn(`LOD ${level}: 未找到合适的节点，创建备用几何体`);
                this.createFallbackLOD(level);
            }
        }
    }
    
    // 从预计算的LOD数据创建几何体
    createLODFromPrecomputed() {
        // 处理预计算的LOD数据
        console.log("使用预计算的LOD数据创建几何体，不进行累积");
        
        // 确保LOD级别从0开始且连续
        for (let level = 0; level < this.precomputedLOD.length; level++) {
            if (!this.precomputedLOD[level]) {
                console.warn(`LOD ${level}: 没有预计算数据，跳过`);
                continue;
            }
            
            const currentLevelNodes = this.precomputedLOD[level];
            console.log(`LOD ${level}: 使用 ${currentLevelNodes.length} 个预计算点，完全按照DM文件中的定义`);
            
            // 直接使用当前级别的节点创建几何体，不进行累积
            this.createGeometryForLOD(level, currentLevelNodes);
        }
    }
    
    // 为指定的LOD级别创建几何体
    createGeometryForLOD(level, nodes) {
        if (!nodes || nodes.length === 0) {
            console.warn(`LOD ${level} 没有提取到任何点`);
            
            // 如果是第一个级别且没有点，创建一个备用模型
            if (level === 0) {
                this.createFallbackLOD(level);
            }
            return;
        }
        
            const points = [];
            const colors = [];
            
        for (const node of nodes) {
            // 添加节点位置和颜色
            points.push(node.position.x, node.position.y, node.position.z);
            
            // 计算颜色
            const normalizedValue = this.normalizeValue(node.value);
            const color = this.getColorFromValue(normalizedValue);
            colors.push(color.r, color.g, color.b);
        }
        
                const geometry = new THREE.BufferGeometry();
                geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
                geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
                
                const material = this.pointsMaterial.clone();
                const pointsMesh = new THREE.Points(geometry, material);
                pointsMesh.name = `LOD_${level}`;
                this.lodMeshes.push(pointsMesh);
                
                console.log(`创建了LOD ${level} 几何体，包含 ${points.length / 3} 个点`);
    }
    
    // 选择八个象限和中心的代表点，用于最低级别的LOD
    selectCornerNodes() {
        const cornerNodes = [];
        
        // 确保我们有收集到节点
        if ((!this.allNodes || this.allNodes.length === 0) && 
            (!this.precomputedLOD || this.precomputedLOD.length === 0)) {
            return cornerNodes;
        }
        
        // 计算模型中心
        const centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
        const centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
        const centerZ = (this.bounds.min.z + this.bounds.max.z) / 2;
        
        // 添加中心点
        let centerNode = this.findNearestNode(centerX, centerY, centerZ);
        if (centerNode) {
            cornerNodes.push(centerNode);
            } else {
            // 如果找不到最近的节点，创建一个虚拟中心节点
            cornerNodes.push({
                position: { x: centerX, y: centerY, z: centerZ },
                size: 1,
                depth: 0,
                isLeaf: true,
                value: (this.minValue + this.maxValue) / 2
            });
        }
        
        // 计算八个角的坐标
        const xRange = this.bounds.max.x - this.bounds.min.x;
        const yRange = this.bounds.max.y - this.bounds.min.y;
        const zRange = this.bounds.max.z - this.bounds.min.z;
        
        for (let i = 0; i < 8; i++) {
            // 计算象限中心
            const x = centerX + (i & 1 ? 0.25 : -0.25) * xRange;
            const y = centerY + (i & 2 ? 0.25 : -0.25) * yRange;
            const z = centerZ + (i & 4 ? 0.25 : -0.25) * zRange;
            
            // 找到最近的实际节点
            const cornerNode = this.findNearestNode(x, y, z);
            if (cornerNode && !cornerNodes.includes(cornerNode)) {
                cornerNodes.push(cornerNode);
            }
        }
        
        console.log(`选择了 ${cornerNodes.length} 个角点用于LOD 0`);
        return cornerNodes;
    }
    
    // 采样节点，按照给定的比例
    sampleNodes(nodes, samplingFactor = 1.0) {
        if (samplingFactor >= 1.0) return nodes;
        
        const targetCount = Math.max(1, Math.ceil(nodes.length * samplingFactor));
        if (nodes.length <= targetCount) return nodes;
        
        // 优先选择较大的节点
        nodes.sort((a, b) => b.size - a.size);
        
        const sampled = [];
        const stride = Math.max(1, Math.floor(nodes.length / targetCount));
        
        for (let i = 0; i < nodes.length; i += stride) {
            sampled.push(nodes[i]);
            if (sampled.length >= targetCount) break;
        }
        
        return sampled;
    }
    
    // 找到最近的实际节点
    findNearestNode(x, y, z) {
        // 尝试从预计算的LOD数据中查找
        if (this.precomputedLOD && this.precomputedLOD.length > 0) {
            // 从第一个LOD级别找最近的点
            let minDistance = Number.MAX_VALUE;
            let nearestNode = null;
            
            for (let level = 0; level < this.precomputedLOD.length; level++) {
                if (!this.precomputedLOD[level]) continue;
                
                for (const node of this.precomputedLOD[level]) {
                    const dx = node.position.x - x;
                    const dy = node.position.y - y;
                    const dz = node.position.z - z;
                    const distance = dx*dx + dy*dy + dz*dz;
                    
                    if (distance < minDistance) {
                        minDistance = distance;
                        nearestNode = node;
                    }
                }
                
                // 如果找到了节点，就不再查找更高级别
                if (nearestNode) break;
            }
            
            return nearestNode;
        }
        
        // 从自动收集的节点中查找
        if (!this.allNodes || this.allNodes.length === 0) return null;
        
        let nearestNode = null;
        let minDistance = Number.MAX_VALUE;
        
        for (const node of this.allNodes) {
            const dx = node.position.x - x;
            const dy = node.position.y - y;
            const dz = node.position.z - z;
            const distance = dx*dx + dy*dy + dz*dz;
            
            if (distance < minDistance) {
                minDistance = distance;
                nearestNode = node;
            }
        }
        
        return nearestNode;
    }
    
    // 创建备用LOD，当没有足够的实际点时使用
    createFallbackLOD(level) {
        // 模型中心点
        const centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
        const centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
        const centerZ = (this.bounds.min.z + this.bounds.max.z) / 2;
        
        const points = [centerX, centerY, centerZ];
        
        // 使用平均值颜色
        const normalizedValue = 0.5; // 中性值
        const color = this.getColorFromValue(normalizedValue);
        const colors = [color.r, color.g, color.b];
        
        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(points, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        const material = this.pointsMaterial.clone();
        const pointsMesh = new THREE.Points(geometry, material);
        pointsMesh.name = `LOD_${level}_fallback`;
        this.lodMeshes.push(pointsMesh);
        
        console.log(`创建了LOD ${level} 备用几何体，使用模型中心点`);
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
        if (!camera) {
            console.warn("未提供相机对象，无法计算LOD级别");
            return this._lastLODLevel !== undefined ? this._lastLODLevel : 0;
        }

        // 使用实际边界而不是文件边界
        const bounds = this.actualBounds || this.bounds;
        
        // 计算相机到数据边界框中心的距离
        const cameraPosition = new THREE.Vector3().copy(camera.position);
        const boundingBoxCenter = new THREE.Vector3(
            (bounds.min.x + bounds.max.x) / 2,
            (bounds.min.y + bounds.max.y) / 2,
            (bounds.min.z + bounds.max.z) / 2
        );
        
        // 计算相机实际距离，考虑相机的缩放因子和视锥体
        // 1. 相机到中心的直线距离
        const distance = cameraPosition.distanceTo(boundingBoxCenter);
        
        // 2. 考虑相机的朝向 - 计算相机视线方向上的投影距离
        const lookDirection = new THREE.Vector3(0, 0, -1).applyQuaternion(camera.quaternion);
        const centerToCamera = new THREE.Vector3().subVectors(cameraPosition, boundingBoxCenter);
        const projectedDistance = Math.abs(centerToCamera.dot(lookDirection));
        
        // 结合两种距离，确保在任何角度都能正确计算LOD
        const effectiveDistance = Math.min(distance, projectedDistance);
        
        // 添加相机的缩放因子影响
        // 检查是否有缩放属性，某些控制器可能会修改相机的zoom属性
        const zoomFactor = camera.zoom !== undefined ? 1 / camera.zoom : 1;
        
        // 计算数据的对角线长度，作为参考尺度
        const diagonalLength = Math.sqrt(
            Math.pow(bounds.max.x - bounds.min.x, 2) +
            Math.pow(bounds.max.y - bounds.min.y, 2) +
            Math.pow(bounds.max.z - bounds.min.z, 2)
        );
        
        // 调整距离，考虑缩放因子
        const adjustedDistance = effectiveDistance * zoomFactor;
        
        // 定义各LOD级别的距离阈值 - 使用线性映射，确保距离增加时LOD级别减少
        const maxLevels = this.lodMeshes.length;
        if (maxLevels <= 1) return 0;
        
        // 计算基础距离单位和最大距离
        const baseDistance = diagonalLength * 0.25;  // 基础单位距离
        const maxDistance = baseDistance * 8;        // 最大考虑距离
        
        // 规范化距离，超过最大距离则视为最远
        const normalizedDistance = Math.min(adjustedDistance, maxDistance) / maxDistance;
        
        // 计算LOD级别：近距离 → 高LOD(大值)，远距离 → 低LOD(小值)
        // 使用反向映射：normalizedDistance接近0(近)时得到maxLevels-1，接近1(远)时得到0
        let newLevel = Math.floor((1 - normalizedDistance) * (maxLevels - 1));
        
        // 确保LOD级别在合法范围内
        newLevel = Math.max(0, Math.min(maxLevels - 1, newLevel));
        
        // 添加滞后逻辑避免频繁切换
        if (this._lastLODLevel !== undefined) {
            const hysteresis = 0.1; // 滞后因子
            const levelDiff = newLevel - this._lastLODLevel;
            
            if (Math.abs(levelDiff) <= hysteresis) {
                // 小变化，保持当前级别
                newLevel = this._lastLODLevel;
            } else if (Math.abs(levelDiff) > 1) {
                // 限制大变化
                newLevel = this._lastLODLevel + (levelDiff > 0 ? 1 : -1);
            }
        }
        
        // 调试输出，帮助诊断LOD选择问题
        if (newLevel !== this._lastLODLevel) {
            console.log(`LOD更新: ${this._lastLODLevel} → ${newLevel}, 距离=${adjustedDistance.toFixed(2)}, 比例=${normalizedDistance.toFixed(2)}`);
        }
        
        // 更新历史记录
        this._lastLODLevel = newLevel;
        
        return newLevel;
    }
    
    // 添加视锥剔除功能
    performFrustumCulling(camera) {
        if (!this.frustumCullingEnabled) return;
        
        // 仅处理当前LOD级别，减少不必要的计算
        const currentLevel = this._lastLODLevel !== undefined ? this._lastLODLevel : 0;
        if (!this.lodMeshes[currentLevel]) return;

        // 创建视锥对象
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        
        // 计算视锥体
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);
        
        // 清除当前LOD级别的可见节点记录
        this.visibleNodes = {};
        this.visibleNodes[currentLevel] = new Set();
        
        const mesh = this.lodMeshes[currentLevel];
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        const count = positions.count;
        
        // 如果点数量少，进行精确剔除
        if (count <= 5000) {
            this.performPreciseCulling(currentLevel, frustum);
        } 
        // 点数量中等，使用改进的分块剔除
        else if (count <= 50000) {
            this.performBlockCulling(currentLevel, frustum, positions, camera);
        } 
        // 点数量大，使用高效剔除或禁用剔除
        else {
            this.performSimplifiedCulling(currentLevel, frustum, positions);
        }
    }
    
    // 精确剔除 - 适用于点数量少的情况
    performPreciseCulling(level, frustum) {
        const nodes = this.precomputedLOD && this.precomputedLOD[level] ? 
            this.precomputedLOD[level] : 
            (level < this.allNodes.length ? this.allNodes.filter(n => n.depth <= level) : []);
        
        if (nodes.length === 0) return;
        
        // 创建节点索引映射，避免多次调用indexOf
        const nodeIndexMap = new Map();
        const positions = this.lodMeshes[level].geometry.attributes.position;
        const count = positions.count;
        
        for (let i = 0; i < Math.min(nodes.length, count); i++) {
            nodeIndexMap.set(nodes[i], i);
        }
        
        // 空间划分优化
        const divisionSize = nodes.length > 2000 ? 2 : 4; // 少分割，减少开销
        const groups = this.groupNodesByRegion(nodes, divisionSize);
        
        for (const [regionKey, nodeGroup] of Object.entries(groups)) {
            // 计算该组节点的边界球
            const boundingSphere = this.calculateBoundingSphere(nodeGroup);
            
            // 检查边界球是否在视锥体内
            if (frustum.intersectsSphere(boundingSphere)) {
                // 如果在，添加所有节点索引
                for (const node of nodeGroup) {
                    const index = nodeIndexMap.get(node);
                    if (index !== undefined && index < count) {
                        this.visibleNodes[level].add(index);
                    }
                }
            }
        }
    }
    
    // 计算一组节点的边界球
    calculateBoundingSphere(nodes) {
        if (nodes.length === 0) {
            return new THREE.Sphere(new THREE.Vector3(), 0);
        }
        
        // 找出中心点
        let centerX = 0, centerY = 0, centerZ = 0;
        for (const node of nodes) {
            centerX += node.position.x;
            centerY += node.position.y;
            centerZ += node.position.z;
        }
        
        centerX /= nodes.length;
        centerY /= nodes.length;
        centerZ /= nodes.length;
        
        // 找出最远距离作为半径
        let maxDistSq = 0;
        for (const node of nodes) {
            const dx = node.position.x - centerX;
            const dy = node.position.y - centerY;
            const dz = node.position.z - centerZ;
            const distSq = dx*dx + dy*dy + dz*dz;
            maxDistSq = Math.max(maxDistSq, distSq);
        }
        
        return new THREE.Sphere(
            new THREE.Vector3(centerX, centerY, centerZ),
            Math.sqrt(maxDistSq)
        );
    }

    // 使用分块方式进行剔除 - 适用于中等数量的点
    performBlockCulling(level, frustum, positions, camera) {
        const blockSize = 200; // 每个区块的点数
        const posArray = positions.array;
        const count = positions.count;
        
        // 计算整个点云的边界框
        const sceneCenter = new THREE.Vector3(
            (this.bounds.min.x + this.bounds.max.x) / 2,
            (this.bounds.min.y + this.bounds.max.y) / 2,
            (this.bounds.min.z + this.bounds.max.z) / 2
        );
        
        // 安全获取相机位置
        let distanceToCenter = 0;
        try {
            // 尝试获取当前函数作用域的相机
            const currentCamera = camera || window.camera;
            if (currentCamera && currentCamera.position) {
                const cameraPosition = new THREE.Vector3().copy(currentCamera.position);
                distanceToCenter = cameraPosition.distanceTo(sceneCenter);
            } else {
                // 如果无法获取相机，使用默认逻辑
                distanceToCenter = this.getBoundingSphereRadius() * 2;
            }
        } catch (e) {
            console.warn("无法获取相机位置，使用默认剔除逻辑");
            distanceToCenter = this.getBoundingSphereRadius() * 2;
        }
        
        // 如果相机离模型太远，可能大部分点都会被剔除，应用细粒度剔除
        if (distanceToCenter > this.getBoundingSphereRadius() * 3) {
            // 每个区块大小需要更大，以减少计算量
            for (let blockStart = 0; blockStart < count; blockStart += blockSize) {
                this.processCullingBlock(level, frustum, posArray, blockStart, 
                    Math.min(blockStart + blockSize, count), camera);
            }
        } else {
            // 处理所有点为一个大区块，提高性能
            this.processCullingBlock(level, frustum, posArray, 0, count, camera);
        }
    }
    
    // 处理一个点分块的剔除
    processCullingBlock(level, frustum, posArray, blockStart, blockEnd, camera) {
        // 计算区块的边界盒
        let minX = Infinity, minY = Infinity, minZ = Infinity;
        let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
        
        // 首先找出这个区块的边界
        for (let i = blockStart; i < blockEnd; i++) {
            const idx = i * 3;
            const x = posArray[idx];
            const y = posArray[idx + 1];
            const z = posArray[idx + 2];
            
            // 跳过之前被"隐藏"的点
            if (Math.abs(x) > 1e9) continue;
            
            minX = Math.min(minX, x);
            minY = Math.min(minY, y);
            minZ = Math.min(minZ, z);
            maxX = Math.max(maxX, x);
            maxY = Math.max(maxY, y);
            maxZ = Math.max(maxZ, z);
        }
        
        // 如果区块为空，跳过
        if (minX === Infinity) return;
        
        // 计算边界球中心
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const centerZ = (minZ + maxZ) / 2;
        
        // 计算半径 - 使用边界盒对角线的一半
        const radius = Math.sqrt(
            Math.pow(maxX - minX, 2) +
            Math.pow(maxY - minY, 2) +
            Math.pow(maxZ - minZ, 2)
        ) / 2;
        
        const boundingSphere = new THREE.Sphere(
            new THREE.Vector3(centerX, centerY, centerZ),
            radius
        );
        
        // 检查边界球是否在视锥体内
        if (frustum.intersectsSphere(boundingSphere)) {
            // 添加区块中的所有点
            for (let i = blockStart; i < blockEnd; i++) {
                this.visibleNodes[level].add(i);
            }
        }
    }
    
    // 简化的视锥剔除方法，用于大量点
    performSimplifiedCulling(level, frustum, positions) {
        const posArray = positions.array;
        const count = positions.count;
        
        // 计算整个点云的边界球 - 使用实际计算的中心点
        const bounds = this.actualBounds || this.bounds;
        const center = new THREE.Vector3(
            (bounds.min.x + bounds.max.x) / 2,
            (bounds.min.y + bounds.max.y) / 2,
            (bounds.min.z + bounds.max.z) / 2
        );
        
        const radius = this.getBoundingSphereRadius();
        const boundingSphere = new THREE.Sphere(center, radius);
        
        // 检查整个模型是否在视锥内
        if (frustum.intersectsSphere(boundingSphere)) {
            // 如果整个模型在视锥内，考虑所有点可见
            for (let i = 0; i < count; i++) {
                this.visibleNodes[level].add(i);
            }
            return;
        }
        
        // 如果模型很大，采用更粗粒度的剔除方式，将模型分成8个象限
        const octants = this.divideIntoOctants(posArray, count);
        
        for (let octantIndex = 0; octantIndex < octants.length; octantIndex++) {
            const octant = octants[octantIndex];
            if (octant.count === 0) continue;
            
            const octantSphere = new THREE.Sphere(
                new THREE.Vector3(octant.center.x, octant.center.y, octant.center.z),
                octant.radius
            );
            
            if (frustum.intersectsSphere(octantSphere)) {
                // 将这个象限的所有点标记为可见
                for (let i = 0; i < octant.indices.length; i++) {
                    this.visibleNodes[level].add(octant.indices[i]);
                }
            }
        }
    }
    
    // 将点云分成8个象限，用于高效剔除
    divideIntoOctants(posArray, count) {
        const octants = [];
        for (let i = 0; i < 8; i++) {
            octants.push({
                indices: [],
                center: {x: 0, y: 0, z: 0},
                count: 0,
                radius: 0
            });
        }
        
        // 使用实际数据中心，而不是可能不准确的边界框中心
        const bounds = this.actualBounds || this.bounds;
        const centerX = (bounds.min.x + bounds.max.x) / 2;
        const centerY = (bounds.min.y + bounds.max.y) / 2;
        const centerZ = (bounds.min.z + bounds.max.z) / 2;
        
        // 第一遍：收集每个象限的点
        for (let i = 0; i < count; i++) {
            const idx = i * 3;
            const x = posArray[idx];
            const y = posArray[idx + 1];
            const z = posArray[idx + 2];
            
            // 跳过之前被"隐藏"的点
            if (Math.abs(x) > 1e9) continue;
            
            // 确定点属于哪个象限
            const octantIndex = (x > centerX ? 1 : 0) +
                               (y > centerY ? 2 : 0) +
                               (z > centerZ ? 4 : 0);
            
            octants[octantIndex].indices.push(i);
            octants[octantIndex].count++;
        }
        
        // 第二遍：计算每个象限的中心和半径
        for (let i = 0; i < 8; i++) {
            const octant = octants[i];
            if (octant.count === 0) continue;
            
            let sumX = 0, sumY = 0, sumZ = 0;
            let minX = Infinity, minY = Infinity, minZ = Infinity;
            let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
            
            for (const pointIndex of octant.indices) {
                const idx = pointIndex * 3;
                const x = posArray[idx];
                const y = posArray[idx + 1];
                const z = posArray[idx + 2];
                
                sumX += x;
                sumY += y;
                sumZ += z;
                
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                minZ = Math.min(minZ, z);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
                maxZ = Math.max(maxZ, z);
            }
            
            // 计算平均中心点
            octant.center.x = sumX / octant.count;
            octant.center.y = sumY / octant.count;
            octant.center.z = sumZ / octant.count;
            
            // 计算最大半径
            octant.radius = Math.sqrt(
                Math.pow(maxX - minX, 2) +
                Math.pow(maxY - minY, 2) +
                Math.pow(maxZ - minZ, 2)
            ) / 2;
        }
        
        return octants;
    }
    
    // 获取边界球半径
    getBoundingSphereRadius() {
        // 优先使用实际数据计算的边界
        const bounds = this.actualBounds || this.bounds;
        
        const sizeX = bounds.max.x - bounds.min.x;
        const sizeY = bounds.max.y - bounds.min.y;
        const sizeZ = bounds.max.z - bounds.min.z;
        return Math.sqrt(sizeX*sizeX + sizeY*sizeY + sizeZ*sizeZ) / 2;
    }
    
    // 应用视锥剔除结果到几何体上 - 优化性能
    applyFrustumCulling(scene, camera) {
        if (!this.frustumCullingEnabled || !this.visibleNodes) return;
        
        // 只处理当前LOD级别
        const currentLevel = this._lastLODLevel !== undefined ? this._lastLODLevel : 0;
        const mesh = this.lodMeshes[currentLevel];
        
        if (!mesh || !scene.children.includes(mesh)) return;
        
        const visibleIndices = this.visibleNodes[currentLevel];
        if (!visibleIndices) return;
        
        const geometry = mesh.geometry;
        const positions = geometry.attributes.position;
        
        // 缓存原始位置，避免重复计算
        if (!this._originalPositions) {
            this._originalPositions = {};
        }
        
        // 如果几乎所有点都可见，跳过剔除以提高性能
        if (visibleIndices.size > positions.count * 0.9) {
            // 恢复所有点的位置
            if (this._originalPositions[currentLevel]) {
                this.resetPositions(currentLevel, positions);
            }
            return;
        }
        
        // 为当前LOD级别保存原始位置
        if (!this._originalPositions[currentLevel]) {
            this._originalPositions[currentLevel] = new Float32Array(positions.array);
        }
        
        const posArray = positions.array;
        const originalPos = this._originalPositions[currentLevel];
        
        // 如果可见点数量很少，使用优化的剔除方法
        if (visibleIndices.size < positions.count * 0.1) {
            // 先隐藏所有点
            for (let i = 0; i < positions.count; i++) {
                const idx = i * 3;
                posArray[idx] = 1e10;
                posArray[idx+1] = 1e10;
                posArray[idx+2] = 1e10;
            }
            
            // 只恢复可见点
            for (const i of visibleIndices) {
                const idx = i * 3;
                posArray[idx] = originalPos[idx];
                posArray[idx+1] = originalPos[idx+1];
                posArray[idx+2] = originalPos[idx+2];
            }
        } else {
            // 如果可见点数量较多，只隐藏不可见点
            for (let i = 0; i < positions.count; i++) {
                const idx = i * 3;
                if (visibleIndices.has(i)) {
                    // 恢复可见点的原始位置
                    posArray[idx] = originalPos[idx];
                    posArray[idx+1] = originalPos[idx+1];
                    posArray[idx+2] = originalPos[idx+2];
                } else {
                    // 隐藏不可见点
                    posArray[idx] = 1e10;
                    posArray[idx+1] = 1e10;
                    posArray[idx+2] = 1e10;
                }
            }
        }
        
        // 更新几何体
        positions.needsUpdate = true;
    }
    
    // 重置点位置到原始状态
    resetPositions(level, positions) {
        if (!this._originalPositions || !this._originalPositions[level]) return;
        
        const posArray = positions.array;
        const originalPos = this._originalPositions[level];
        
        for (let i = 0; i < Math.min(posArray.length, originalPos.length); i++) {
            posArray[i] = originalPos[i];
        }
        
        positions.needsUpdate = true;
    }

    // 更新LOD显示，包含视锥剔除
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
                } else if (this.frustumCullingEnabled) {
                    // 只在当前级别执行视锥剔除
                    this.performFrustumCulling(camera);
                    this.applyFrustumCulling(scene, camera);
                }
            } else if (i === currentLevel) {
                scene.add(mesh);
                if (this.frustumCullingEnabled) {
                    // 添加新级别时执行视锥剔除
                    this.performFrustumCulling(camera);
                    this.applyFrustumCulling(scene, camera);
                }
            }
        }
    }
    
    // 辅助方法：自动设置相机位置以查看整个模型
    setupCamera(camera, controls) {
        // 初始化中心点和边界计算值
        let centerX = 0, centerY = 0, centerZ = 0;
        let totalPoints = 0;
        let minX = Number.MAX_VALUE, minY = Number.MAX_VALUE, minZ = Number.MAX_VALUE;
        let maxX = Number.MIN_VALUE, maxY = Number.MIN_VALUE, maxZ = Number.MIN_VALUE;
        
        // 使用LOD网格中的实际点数据计算中心和边界
        // 这比使用allNodes更准确，因为它只包含实际渲染的点
        let actualPointsUsed = false;
        if (this.lodMeshes && this.lodMeshes.length > 0) {
            // 使用级别最高的LOD（通常是最后一个，包含最多的点）
            const highestLODIndex = this.lodMeshes.length - 1;
            const highestLOD = this.lodMeshes[highestLODIndex];
            
            if (highestLOD && highestLOD.geometry && highestLOD.geometry.attributes.position) {
                const positions = highestLOD.geometry.attributes.position.array;
                const count = highestLOD.geometry.attributes.position.count;
                
                console.log(`使用LOD ${highestLODIndex} 的 ${count} 个实际渲染点计算中心和边界`);
                
                // 遍历所有实际渲染的点
                for (let i = 0; i < count; i++) {
                    const idx = i * 3;
                    const x = positions[idx];
                    const y = positions[idx+1];
                    const z = positions[idx+2];
                    
                    // 跳过隐藏的点 (通常被设置到很远的位置)
                    if (Math.abs(x) > 1e5 || Math.abs(y) > 1e5 || Math.abs(z) > 1e5) continue;
                    
                    centerX += x;
                    centerY += y;
                    centerZ += z;
                    totalPoints++;
                    
                    minX = Math.min(minX, x);
                    minY = Math.min(minY, y);
                    minZ = Math.min(minZ, z);
                    maxX = Math.max(maxX, x);
                    maxY = Math.max(maxY, y);
                    maxZ = Math.max(maxZ, z);
                }
                
                actualPointsUsed = true;
            }
        }
        
        // 如果无法从LOD网格获取点数据，尝试使用allNodes
        if (!actualPointsUsed && this.allNodes && this.allNodes.length > 0) {
            console.log("使用allNodes计算中心和边界");
            
            // 重置计数器
            centerX = 0; centerY = 0; centerZ = 0;
            totalPoints = 0;
            minX = Number.MAX_VALUE; minY = Number.MAX_VALUE; minZ = Number.MAX_VALUE;
            maxX = Number.MIN_VALUE; maxY = Number.MIN_VALUE; maxZ = Number.MIN_VALUE;
            
            // 过滤出有实际数据的节点
            const validNodes = this.allNodes.filter(node => 
                node && node.position && 
                (node.isLeaf === true || node.value !== undefined)
            );
            
            for (const node of validNodes) {
                // 确保位置在合理范围内
                if (Math.abs(node.position.x) > 1e5 || 
                    Math.abs(node.position.y) > 1e5 || 
                    Math.abs(node.position.z) > 1e5) continue;
                
                centerX += node.position.x;
                centerY += node.position.y;
                centerZ += node.position.z;
                totalPoints++;
                
                minX = Math.min(minX, node.position.x);
                minY = Math.min(minY, node.position.y);
                minZ = Math.min(minZ, node.position.z);
                maxX = Math.max(maxX, node.position.x);
                maxY = Math.max(maxY, node.position.y);
                maxZ = Math.max(maxZ, node.position.z);
            }
        }
        
        // 如果有足够的点计算中心点
        if (totalPoints > 0) {
            // 计算平均中心
            centerX /= totalPoints;
            centerY /= totalPoints;
            centerZ /= totalPoints;
            
            console.log(`计算得到的数据中心点: (${centerX.toFixed(2)}, ${centerY.toFixed(2)}, ${centerZ.toFixed(2)}), 使用了 ${totalPoints} 个点`);
            
            // 更新实际使用的边界 - 几乎不添加额外边距
            const padding = 0.01; // 仅添加1%的边距
            const sizeX = maxX - minX;
            const sizeY = maxY - minY;
            const sizeZ = maxZ - minZ;
            
            this.actualBounds = {
                min: { 
                    x: minX - sizeX * padding, 
                    y: minY - sizeY * padding, 
                    z: minZ - sizeZ * padding 
                },
                max: { 
                    x: maxX + sizeX * padding, 
                    y: maxY + sizeY * padding, 
                    z: maxZ + sizeZ * padding 
                }
            };
            
            console.log("计算得到的实际数据边界:", {
                min: { 
                    x: this.actualBounds.min.x.toFixed(2), 
                    y: this.actualBounds.min.y.toFixed(2), 
                    z: this.actualBounds.min.z.toFixed(2) 
                },
                max: { 
                    x: this.actualBounds.max.x.toFixed(2), 
                    y: this.actualBounds.max.y.toFixed(2), 
                    z: this.actualBounds.max.z.toFixed(2) 
                },
                size: { 
                    x: sizeX.toFixed(2), 
                    y: sizeY.toFixed(2), 
                    z: sizeZ.toFixed(2) 
                }
            });
        } else {
            // 无法计算实际中心，回退到使用文件中的边界
            console.warn("无法计算实际数据中心，回退到使用边界框中心");
            centerX = (this.bounds.min.x + this.bounds.max.x) / 2;
            centerY = (this.bounds.min.y + this.bounds.max.y) / 2;
            centerZ = (this.bounds.min.z + this.bounds.max.z) / 2;
            this.actualBounds = this.bounds;
        }
        
        // 计算模型尺寸
        const sizeX = this.actualBounds.max.x - this.actualBounds.min.x;
        const sizeY = this.actualBounds.max.y - this.actualBounds.min.y;
        const sizeZ = this.actualBounds.max.z - this.actualBounds.min.z;
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

    // 按区域分组节点，用于加速视锥剔除
    groupNodesByRegion(nodes, divisionSize = 4) {
        const groups = {};
        const bounds = this.bounds;
        const sizeX = bounds.max.x - bounds.min.x;
        const sizeY = bounds.max.y - bounds.min.y;
        const sizeZ = bounds.max.z - bounds.min.z;
        const cellSizeX = sizeX / divisionSize;
        const cellSizeY = sizeY / divisionSize;
        const cellSizeZ = sizeZ / divisionSize;
        
        for (const node of nodes) {
            // 确定节点所在的空间区域
            const x = Math.floor((node.position.x - bounds.min.x) / cellSizeX);
            const y = Math.floor((node.position.y - bounds.min.y) / cellSizeY);
            const z = Math.floor((node.position.z - bounds.min.z) / cellSizeZ);
            
            // 区域key
            const regionKey = `${x},${y},${z}`;
            
            if (!groups[regionKey]) {
                groups[regionKey] = [];
            }
            
            groups[regionKey].push(node);
        }
        
        return groups;
    }
}

// 示例用法
export function loadAndDisplayDMOctree(url, scene, camera, renderer, controls) {
    const loader = new DMOctreeLoader();
    let boundingRadius = 200; // 初始估计值
    debugger
    loader.load(url, () => {
        // 调整相机位置
        const modelInfo = loader.setupCamera(camera, controls);
        boundingRadius = modelInfo.size / 2;
        
        console.log("模型信息:", modelInfo);
        
        // 创建和添加可视化调试辅助工具
        generateLODDebugVisuals(loader, scene, modelInfo);
        
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
            
            // 在每一帧更新LOD和视锥剔除
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

// 创建调试可视化辅助工具
function generateLODDebugVisuals(loader, scene, modelInfo) {
    // 清除已有的辅助工具
    scene.children.forEach(child => {
        if (child.name && (
            child.name.startsWith('centerMarker') || 
            child.name.startsWith('boundingBox') ||
            child.name.startsWith('dataPoint')
        )) {
            scene.remove(child);
        }
    });
    
    // 1. 添加数据中心点标记 - 红色球体
    const centerSphere = new THREE.Mesh(
        new THREE.SphereGeometry(5, 16, 16),
        new THREE.MeshBasicMaterial({ color: 0xff0000 })
    );
    centerSphere.name = 'centerMarker';
    centerSphere.position.copy(modelInfo.center);
    scene.add(centerSphere);
    
    // 2. 添加实际数据边界框 - 黄色线框
    const actualBounds = loader.actualBounds || loader.bounds;
    const boxGeometry = new THREE.BoxGeometry(
        actualBounds.max.x - actualBounds.min.x,
        actualBounds.max.y - actualBounds.min.y,
        actualBounds.max.z - actualBounds.min.z
    );
    const boxMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffff00, 
        wireframe: true,
        transparent: true,
        opacity: 0.3
    });
    const boundingBox = new THREE.Mesh(boxGeometry, boxMaterial);
    boundingBox.name = 'boundingBox';
    boundingBox.position.set(
        (actualBounds.min.x + actualBounds.max.x) / 2,
        (actualBounds.min.y + actualBounds.max.y) / 2,
        (actualBounds.min.z + actualBounds.max.z) / 2  // 修正：使用max.z而不是min.z
    );
    scene.add(boundingBox);
    
    // 3. 边界框线框 - 更清晰的黄色线
    const boxLines = new THREE.Box3Helper(
        new THREE.Box3(
            new THREE.Vector3(actualBounds.min.x, actualBounds.min.y, actualBounds.min.z),
            new THREE.Vector3(actualBounds.max.x, actualBounds.max.y, actualBounds.max.z)
        ),
        0xffff00
    );
    boxLines.name = 'boundingBoxLines';
    scene.add(boxLines);
    
    // 4. 可选：显示原始文件边界框（如果与实际边界不同）
    if (loader.bounds !== loader.actualBounds) {
        const originalBoxLines = new THREE.Box3Helper(
            new THREE.Box3(
                new THREE.Vector3(loader.bounds.min.x, loader.bounds.min.y, loader.bounds.min.z),
                new THREE.Vector3(loader.bounds.max.x, loader.bounds.max.y, loader.bounds.max.z)
            ),
            0x0000ff // 蓝色
        );
        originalBoxLines.name = 'originalBoundingBoxLines';
        originalBoxLines.material.transparent = true;
        originalBoxLines.material.opacity = 0.2;
        scene.add(originalBoxLines);
    }
    
    // // 5. 可选：为数据点添加明显标记
    // if (loader.lodMeshes && loader.lodMeshes.length > 0) {
    //     // 使用最详细的LOD级别
    //     const highestLOD = loader.lodMeshes[loader.lodMeshes.length - 1];
    //     if (highestLOD && highestLOD.geometry && highestLOD.geometry.attributes.position) {
    //         // 只标记一小部分点，避免性能问题
    //         const positions = highestLOD.geometry.attributes.position;
    //         const step = Math.ceil(positions.count / 10); // 只显示约1/10的点
            
    //         for (let i = 0; i < positions.count; i += step) {
    //             const x = positions.array[i * 3];
    //             const y = positions.array[i * 3 + 1];
    //             const z = positions.array[i * 3 + 2];
                
    //             // 跳过被隐藏的点
    //             if (Math.abs(x) > 1e5 || Math.abs(y) > 1e5 || Math.abs(z) > 1e5) continue;
                
    //             const pointMarker = new THREE.Mesh(
    //                 new THREE.SphereGeometry(2, 8, 8),
    //                 new THREE.MeshBasicMaterial({ color: 0x00ff00 }) // 绿色
    //             );
    //             pointMarker.name = `dataPoint_${i}`;
    //             pointMarker.position.set(x, y, z);
    //             scene.add(pointMarker);
    //         }
    //     }
    // }
    
    console.log("已添加调试可视化辅助工具");
}