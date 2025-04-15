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
        
        // 生成累积的节点集合，确保高LOD包含所有低LOD的点
        const cumulativeNodes = {};
        let previousNodes = [];
        
        // 对每个LOD级别创建几何体
        for (let level = 0; level < this.lodLevels; level++) {
            // 计算当前LOD级别对应的最大深度
            // 确保较低的LOD使用较浅的深度，较高的LOD使用较深的深度
            const depthThreshold = Math.floor((level * maxDepth) / (this.lodLevels - 1));
            
            console.log(`创建LOD ${level}: 使用深度 <= ${depthThreshold} 的节点`);
            
            // 选择当前LOD级别的节点
            let currentLevelNodes = [];
            
            // 为LOD 0特殊处理，确保包含八个象限的代表点
            if (level === 0) {
                currentLevelNodes = this.selectCornerNodes();
            } else {
                // 为其他级别选择节点
                for (let depth = 0; depth <= depthThreshold; depth++) {
                    if (nodesByDepth[depth]) {
                        // 采样当前深度的节点，确保点数随LOD级别增加
                        // 对于较低的LOD级别，需要更少的点
                        const samplingFactor = level === 1 ? 0.1 : 
                                             level === 2 ? 0.2 : 
                                             level === 3 ? 0.3 : 1.0;
                        
                        const sampled = this.sampleNodes(nodesByDepth[depth], samplingFactor);
                        currentLevelNodes = currentLevelNodes.concat(sampled);
                    }
                }
            }
            
            // 合并当前级别和之前级别的所有节点，确保高LOD包含所有低LOD的点
            cumulativeNodes[level] = [...previousNodes, ...currentLevelNodes];
            previousNodes = cumulativeNodes[level];
            
            this.createGeometryForLOD(level, cumulativeNodes[level]);
        }
    }
    
    // 从预计算的LOD数据创建几何体
    createLODFromPrecomputed() {
        // 处理预计算的LOD数据
        const cumulativeNodes = {};
        let previousNodes = [];
        
        // 确保LOD级别从0开始且连续
        for (let level = 0; level < this.precomputedLOD.length; level++) {
            if (!this.precomputedLOD[level]) continue;
            
            const currentLevelNodes = this.precomputedLOD[level];
            console.log(`LOD ${level}: 有 ${currentLevelNodes.length} 个预计算点`);
            
            // 合并当前级别和之前级别的所有节点，确保高LOD包含所有低LOD的点
            cumulativeNodes[level] = [...previousNodes, ...currentLevelNodes];
            previousNodes = cumulativeNodes[level];
            
            this.createGeometryForLOD(level, cumulativeNodes[level]);
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
    
    // 添加视锥剔除功能
    performFrustumCulling(camera) {
        if (!this.frustumCullingEnabled) return;

        // 创建视锥对象
        const frustum = new THREE.Frustum();
        const projScreenMatrix = new THREE.Matrix4();
        
        // 计算视锥体
        projScreenMatrix.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
        frustum.setFromProjectionMatrix(projScreenMatrix);
        
        // 为每个LOD级别执行视锥剔除
        this.visibleNodes = {};
        
        // 检查LOD节点是否在视锥内
        for (let level = 0; level < this.lodMeshes.length; level++) {
            if (!this.lodMeshes[level]) continue;
            
            const mesh = this.lodMeshes[level];
            const geometry = mesh.geometry;
            const positions = geometry.attributes.position;
            const count = positions.count;
            
            if (!this.visibleNodes[level]) {
                this.visibleNodes[level] = new Set();
            }
            
            // 获取当前LOD级别的点
            const nodes = this.precomputedLOD && this.precomputedLOD[level] ? 
                this.precomputedLOD[level] : 
                (level < this.allNodes.length ? this.allNodes.filter(n => n.depth <= level) : []);
            
            if (nodes.length === 0) continue;
            
            // 为每组点使用八叉树节点边界进行快速剔除
            const groups = this.groupNodesByRegion(nodes);
            
            for (const [regionKey, nodeGroup] of Object.entries(groups)) {
                // 计算该组节点的边界球
                const boundingSphere = this.calculateBoundingSphere(nodeGroup);
                
                // 检查边界球是否在视锥体内
                if (frustum.intersectsSphere(boundingSphere)) {
                    // 如果在，添加所有节点索引
                    for (const node of nodeGroup) {
                        const index = nodes.indexOf(node);
                        if (index >= 0 && index < count) {
                            this.visibleNodes[level].add(index);
                        }
                    }
                }
            }
            
            console.log(`LOD ${level}: ${this.visibleNodes[level].size}/${count} 个点在视锥内`);
        }
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
    
    // 应用视锥剔除结果到几何体上
    applyFrustumCulling(scene) {
        if (!this.frustumCullingEnabled || !this.visibleNodes) return;
        
        for (let level = 0; level < this.lodMeshes.length; level++) {
            const mesh = this.lodMeshes[level];
            if (!mesh || !scene.children.includes(mesh)) continue;
            
            const visibleIndices = this.visibleNodes[level];
            if (!visibleIndices || visibleIndices.size === 0) continue;
            
            const geometry = mesh.geometry;
            const positions = geometry.attributes.position;
            const colors = geometry.attributes.color;
            
            // 使用点隐藏而不是完全重建几何体可以提高性能
            // 通过将不可见点移到远离相机的位置来"隐藏"它们
            const posArray = positions.array;
            
            for (let i = 0; i < positions.count; i++) {
                const idx = i * 3;
                const visible = visibleIndices.has(i);
                
                if (!visible) {
                    // 将点移到非常远的地方，实际上是"隐藏"它
                    posArray[idx] = 1e10;
                    posArray[idx+1] = 1e10;
                    posArray[idx+2] = 1e10;
                }
            }
            
            // 更新几何体
            positions.needsUpdate = true;
        }
    }

    // 更新LOD显示，包含视锥剔除
    updateLOD(camera, scene, boundingRadius) {
        if (!this.lodMeshes || this.lodMeshes.length === 0) return;
        
        // 执行视锥剔除
        this.performFrustumCulling(camera);
        
        // 获取当前应显示的LOD级别
        const currentLevel = this.getLODLevelForDistance(camera, boundingRadius);
        
        // 更新场景中的可见性
        for (let i = 0; i < this.lodMeshes.length; i++) {
            const mesh = this.lodMeshes[i];
            if (scene.children.includes(mesh)) {
                if (i !== currentLevel) {
                    scene.remove(mesh);
                } else {
                    // 应用视锥剔除
                    this.applyFrustumCulling(scene);
                }
            } else if (i === currentLevel) {
                scene.add(mesh);
                // 应用视锥剔除
                this.applyFrustumCulling(scene);
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