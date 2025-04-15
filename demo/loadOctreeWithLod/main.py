import numpy as np
import struct
import os
import time
import collections
import random

class OctreeNode:
    def __init__(self, x_min, y_min, z_min, size):
        self.x_min = x_min
        self.y_min = y_min
        self.z_min = z_min
        self.size = size
        self.children = [None] * 8  # 8 children for octree
        self.value = None
        self.is_leaf = False
        self.depth = 0  # 添加深度信息，用于LOD生成
        self.points = []  # 存储实际点数据，用于LOD生成

    def get_child_index(self, x, y, z):
        # Determine which octant the point belongs to
        mid_x = self.x_min + self.size / 2
        mid_y = self.y_min + self.size / 2
        mid_z = self.z_min + self.size / 2
        
        index = 0
        if x >= mid_x:
            index |= 1
        if y >= mid_y:
            index |= 2
        if z >= mid_z:
            index |= 4
        return index

    def insert(self, x, y, z, value, min_size=0.1, max_depth=18):
        # 添加最大深度控制，确保有足够的LOD层级
        # 降低默认最小尺寸，确保更细致的分割
        
        # 调试输出
        global insert_calls, split_decisions
        insert_calls += 1
        
        # 记录原始点数据，无论是否分裂都保存
        self.points.append((x, y, z, value))
        
        # 强制进行分裂，确保生成足够深度的八叉树
        # 这对LOD非常重要，以便有足够的层级
        force_split = self.depth < max_depth // 3 or (self.size > min_size * 2 and self.depth < max_depth)
            
        # 如果这个节点已经是叶子节点
        if self.is_leaf:
            # 如果值相同，不需要分裂
            if abs(self.value - value) < 1e-6 and not force_split:
                return
            else:
                # 需要分裂并转移现有值
                old_x, old_y, old_z = self.x_min, self.y_min, self.z_min
                old_value = self.value
                self.is_leaf = False
                self.value = None
                
                # 记录分裂决策
                split_decisions += 1
                
                # 仅当我们高于最小尺寸且未达到最大深度时才分裂
                if (self.size > min_size and self.depth < max_depth) or force_split:
                    if random.random() < 0.01:  # 减少日志输出
                        print(f"分裂节点: 深度={self.depth}, 大小={self.size:.2f}, 最小需求={min_size:.2f}, 最大深度={max_depth}")
                    # 为现有值创建子节点
                    self.insert(old_x, old_y, old_z, old_value, min_size, max_depth)
                    # 为新值创建子节点
                    self.insert(x, y, z, value, min_size, max_depth)
                else:
                    # 如果达到最小尺寸或最大深度，使用新值（或平均值）
                    self.value = (old_value + value) / 2  # 使用平均值以保留信息
                    self.is_leaf = True
                return
        
        # 如果达到最小尺寸或最大深度且不强制分裂，设为叶子节点
        if (self.size <= min_size or self.depth >= max_depth) and not force_split:
            self.value = value
            self.is_leaf = True
            return
            
        # 否则，插入到适当的子节点
        child_index = self.get_child_index(x, y, z)
        child_size = self.size / 2
        
        if self.children[child_index] is None:
            # 计算子节点的角落位置
            child_x = self.x_min + (child_index & 1) * child_size
            child_y = self.y_min + ((child_index & 2) >> 1) * child_size
            child_z = self.z_min + ((child_index & 4) >> 2) * child_size
            
            # 创建子节点并设置深度
            self.children[child_index] = OctreeNode(child_x, child_y, child_z, child_size)
            self.children[child_index].depth = self.depth + 1
            
        # 在适当的子节点中插入点
        self.children[child_index].insert(x, y, z, value, min_size, max_depth)

    def get_center_point(self):
        """返回节点的中心点坐标"""
        center_x = self.x_min + self.size / 2
        center_y = self.y_min + self.size / 2
        center_z = self.z_min + self.size / 2
        return center_x, center_y, center_z

    def get_representative_point(self):
        """获取代表性点，优先使用真实数据点"""
        if not self.points:
            # 如果没有真实点，使用节点中心点和平均值
            center = self.get_center_point()
            return (*center, self.get_average_value())
            
        # 使用存储的真实点的中心
        points = np.array(self.points)
        center_idx = len(points) // 2  # 使用中间的点作为代表
        return tuple(points[center_idx])
    
    def get_average_value(self):
        """获取节点的平均值"""
        if self.is_leaf and self.value is not None:
            return self.value
            
        if self.points:
            values = [p[3] for p in self.points]
            return sum(values) / len(values)
            
        # 递归计算子节点的平均值
        values = []
        for child in self.children:
            if child is not None:
                values.append(child.get_average_value())
                
        if values:
            return sum(values) / len(values)
        return 0  # 默认值

    def get_points_for_lod(self, target_depth):
        """获取特定层级的LOD点, 返回格式为 [(x, y, z, value), ...]"""
        if self.depth == target_depth:
            # 在目标深度，返回这个节点的代表点
            return [self.get_representative_point()]
            
        if self.depth > target_depth or self.is_leaf:
            # 如果已经超过目标深度或是叶子节点，不继续向下
            return []
            
        # 如果深度小于目标深度，递归获取子节点的点
        points = []
        for child in self.children:
            if child is not None:
                points.extend(child.get_points_for_lod(target_depth))
                
        return points

# 用于记录统计信息的全局变量
leaf_count = 0
written_nodes = 0
depth_distribution = {}  # 添加深度分布统计
insert_calls = 0  # 记录insert被调用的次数
split_decisions = 0  # 记录分裂决策的次数
node_count_by_depth = {}  # 记录每个深度的节点数量

def get_node_stats(node, stats=None, depth=0):
    """收集八叉树的详细统计信息"""
    if stats is None:
        stats = {
            'total_nodes': 0,
            'leaf_nodes': 0,
            'max_depth': 0,
            'by_depth': {}
        }
    
    if node is None:
        return stats
    
    # 更新统计信息
    stats['total_nodes'] += 1
    stats['max_depth'] = max(stats['max_depth'], depth)
    
    # 记录每个深度的节点数
    if depth not in stats['by_depth']:
        stats['by_depth'][depth] = {'total': 0, 'leaves': 0}
    stats['by_depth'][depth]['total'] += 1
    
    if node.is_leaf:
        stats['leaf_nodes'] += 1
        stats['by_depth'][depth]['leaves'] += 1
    
    # 递归处理子节点
    for child in node.children:
        if child is not None:
            get_node_stats(child, stats, depth + 1)
    
    return stats

def write_octree_to_binary(node, file, lod_data=None):
    global written_nodes
    written_nodes += 1
    
    # 二进制版本2：添加LOD数据支持
    # 格式：[is_leaf (1 byte)][value (8 bytes, if leaf)][child_pointers (8 pointers if not leaf)]
    if node.is_leaf:
        file.write(struct.pack('?', True))
        file.write(struct.pack('d', node.value))
        
        # 统计深度分布
        global depth_distribution
        if node.depth not in depth_distribution:
            depth_distribution[node.depth] = 0
        depth_distribution[node.depth] += 1
        
        # 调试信息 - 输出叶子节点信息
        if written_nodes % 10000 == 0 or written_nodes < 10:
            print(f"写入叶子节点 #{written_nodes}: 位置=({node.x_min:.2f},{node.y_min:.2f},{node.z_min:.2f}), 大小={node.size:.2f}, 值={node.value:.4f}, 深度={node.depth}")
    else:
        file.write(struct.pack('?', False))
        
        # 记录子节点指针位置
        child_pointer_positions = []
        for i in range(8):
            child_pointer_positions.append(file.tell())
            file.write(struct.pack('Q', 0))  # 8-byte placeholder for pointer
            
        # 依次写入每个子节点
        for i in range(8):
            if node.children[i] is not None:
                # 记录当前位置作为子节点的起始位置
                child_position = file.tell()
                
                # 回退到之前保存的指针位置
                current_position = file.tell()
                file.seek(child_pointer_positions[i])
                
                # 更新指针值为子节点的实际位置
                file.write(struct.pack('Q', child_position))
                
                # 回到当前位置继续写入
                file.seek(current_position)
                
                # 写入子节点
                write_octree_to_binary(node.children[i], file, lod_data)

def write_octree_with_lod(root, filename, max_lod_depth=18, original_point_count=0):
    """将八叉树写入DM文件，包括LOD数据"""
    data = []
    bounds_min = [root.x_min, root.y_min, root.z_min]
    bounds_max = [root.x_min + root.size, root.y_min + root.size, root.z_min + root.size]
    
    # 预先生成LOD数据
    print("正在为各层级生成LOD数据...")
    lod_data = []
    actual_max_depth = -1
    for depth in range(max_lod_depth + 1):
        points = root.get_points_for_lod(depth)
        if points:
            point_count = len(points)
            lod_data.append(points)
            print(f"LOD级别 {depth}: 生成了 {point_count} 个点")
            actual_max_depth = depth
            
            # 如果当前深度的点数接近或等于原始数据点数，则停止生成更高深度的LOD
            # 允许5%的误差
            if original_point_count > 0 and point_count >= original_point_count * 0.95:
                print(f"在深度 {depth} 时点数已接近原始数据点数 ({point_count}/{original_point_count})，停止生成更高深度的LOD")
                break
        else:
            print(f"LOD级别 {depth}: 没有点")
    
    # 更新实际使用的最大LOD深度
    print(f"实际使用的最大LOD深度: {actual_max_depth} (原始设置: {max_lod_depth})")
    
    with open(filename, 'wb') as file:
        # 文件头
        file.write(b'DMOCTREE')  # 魔数
        file.write(struct.pack('I', 2))  # 版本2: 添加LOD支持
        
        # 边界
        for value in bounds_min:
            file.write(struct.pack('d', value))
        for value in bounds_max:
            file.write(struct.pack('d', value))
        
        # 写入LOD数据部分
        lod_section_offset = file.tell() + 8  # 为根节点偏移量留出空间
        file.write(struct.pack('Q', lod_section_offset))
        
        # 写入根节点结构
        write_octree_to_binary(root, file)
        
        # 记录当前位置，用于写入LOD节
        lod_section_start = file.tell()
        
        # 回到LOD部分偏移位置，写入正确的偏移
        file.seek(lod_section_offset - 8)
        file.write(struct.pack('Q', lod_section_start))
        
        # 返回LOD部分开始写入
        file.seek(lod_section_start)
        
        # 写入LOD数据
        file.write(struct.pack('I', len(lod_data)))  # LOD级别数量
        
        for level, points in enumerate(lod_data):
            file.write(struct.pack('I', level))  # LOD级别
            file.write(struct.pack('I', len(points)))  # 此级别的点数量
            
            for point in points:
                x, y, z, value = point
                file.write(struct.pack('dddd', x, y, z, value))  # 写入点数据
        
        print(f"总共写入了 {len(lod_data)} 个LOD级别")
        
    return actual_max_depth

def read_hsp_file(filename):
    data = []
    line_count = 0
    with open(filename, 'r') as file:
        for line in file:
            line_count += 1
            # Parse the four columns: x, y, z, v
            values = line.strip().split()
            if len(values) >= 4:  # Ensure we have at least 4 columns
                try:
                    x = float(values[0])
                    y = float(values[1])
                    z = float(values[2])
                    v = float(values[3])
                    data.append((x, y, z, v))
                    
                    # 打印一些样本数据
                    if line_count <= 5 or line_count % 100000 == 0:
                        print(f"读取点 #{line_count}: ({x}, {y}, {z}) = {v}")
                        
                except ValueError:
                    print(f"警告: 无法解析行: {line.strip()}")
    
    print(f"共读取 {len(data)} 个点")
    return np.array(data)

def count_leaves(node):
    """递归计算八叉树中的叶子节点数量"""
    if node is None:
        return 0
    if node.is_leaf:
        return 1
    return sum(count_leaves(child) for child in node.children if child is not None)

def count_leaves_by_depth(node, stats=None, depth=0):
    """统计每个深度的叶子节点数量"""
    if stats is None:
        stats = {}
    
    if node is None:
        return stats
    
    if node.is_leaf:
        if depth not in stats:
            stats[depth] = 0
        stats[depth] += 1
    else:
        for child in node.children:
            if child is not None:
                count_leaves_by_depth(child, stats, depth + 1)
    
    return stats

def build_octree(data, min_size=0.1, max_depth=18):
    global leaf_count, insert_calls, split_decisions
    insert_calls = 0
    split_decisions = 0
    
    start_time = time.time()
    
    # 对点进行随机采样，提高分布均匀性
    if len(data) > 1000000:  # 如果超过百万级点，进行随机采样
        sample_ratio = min(1.0, 1000000 / len(data))
        indices = np.random.choice(len(data), size=int(len(data) * sample_ratio), replace=False)
        data = data[indices]
        print(f"由于点数过多，采样至 {len(data)} 个点")
    
    # Find the bounding box
    x_min, y_min, z_min = data[:, 0].min(), data[:, 1].min(), data[:, 2].min()
    x_max, y_max, z_max = data[:, 0].max(), data[:, 1].max(), data[:, 2].max()
    
    # Calculate required size (power of 2)
    max_range = max(x_max - x_min, y_max - y_min, z_max - z_min)
    size = 1
    while size < max_range:
        size *= 2
    
    print(f"\n八叉树创建信息:")
    print(f"边界范围: ({x_min:.2f},{y_min:.2f},{z_min:.2f}) 到 ({x_max:.2f},{y_max:.2f},{z_max:.2f})")
    print(f"尺寸: {size:.2f}")
    print(f"最小节点尺寸: {min_size}")
    print(f"最大深度: {max_depth}")
    
    # Create root node
    root = OctreeNode(x_min, y_min, z_min, size)
    
    # Insert all points
    leaf_count = 0
    for idx, (x, y, z, v) in enumerate(data):
        root.insert(x, y, z, v, min_size, max_depth)
        leaf_count += 1
        if idx % 50000 == 0:
            print(f"已插入 {idx+1}/{len(data)} 个点")
    
    end_time = time.time()
    build_time = end_time - start_time
    
    # 验证八叉树结构
    total_leaves = count_leaves(root)
    depth_stats = count_leaves_by_depth(root)
    
    print(f"八叉树构建完成: 总计 {total_leaves} 个叶子节点")
    print(f"深度分布: {depth_stats}")
    print(f"构建时间: {build_time:.2f} 秒")
    print(f"Insert调用次数: {insert_calls}")
    print(f"分裂决策次数: {split_decisions}")
    
    return root

def verify_octree(node, depth=0):
    """验证八叉树结构的有效性"""
    if node is None:
        return True, 0, 0
    
    if node.is_leaf:
        return node.value is not None, 1, 1 if node.value is not None else 0
    
    valid = True
    total_nodes = 1
    valid_leaves = 0
    
    for i, child in enumerate(node.children):
        if child is not None:
            child_valid, child_nodes, child_leaves = verify_octree(child, depth + 1)
            valid = valid and child_valid
            total_nodes += child_nodes
            valid_leaves += child_leaves
    
    return valid, total_nodes, valid_leaves

def get_max_depth(node, current_depth=0):
    """获取八叉树的最大深度"""
    if node is None:
        return current_depth
    
    if node.is_leaf:
        return current_depth
    
    max_child_depth = current_depth
    for child in node.children:
        if child is not None:
            child_depth = get_max_depth(child, current_depth + 1)
            max_child_depth = max(max_child_depth, child_depth)
    
    return max_child_depth

def generate_sample_lod_data(octree, max_depth):
    """生成每个深度级别的样本数据，帮助前端调试"""
    lod_samples = []
    
    for depth in range(max_depth + 1):
        # 生成每个深度级别的样本节点
        samples = []
        
        def collect_nodes_at_depth(node, current_depth=0):
            if node is None:
                return
                
            if current_depth == depth:
                # 收集此深度的节点
                center_x, center_y, center_z = node.get_center_point()
                # 优先使用真实点
                if node.points:
                    # 采样节点中的真实点，确保均匀分布
                    if len(node.points) > 1:
                        # 获取均匀分布的样本
                        step = len(node.points) // min(5, len(node.points))
                        step = max(1, step)
                        for i in range(0, len(node.points), step):
                            point = node.points[i]
                            sample = {
                                'position': [point[0], point[1], point[2]],
                                'size': node.size,
                                'isLeaf': node.is_leaf,
                                'value': point[3]
                            }
                            samples.append(sample)
                    else:
                        # 只有一个点的情况
                        point = node.points[0]
                        sample = {
                            'position': [point[0], point[1], point[2]],
                            'size': node.size,
                            'isLeaf': node.is_leaf,
                            'value': point[3]
                        }
                        samples.append(sample)
                else:
                    # 没有真实点，使用节点中心
                    sample = {
                        'position': [center_x, center_y, center_z],
                        'size': node.size,
                        'isLeaf': node.is_leaf,
                        'value': node.get_average_value()
                    }
                    samples.append(sample)
                return  # 不继续向下遍历
                
            # 如果还没到目标深度，继续向下遍历
            if current_depth < depth:
                for child in node.children:
                    if child is not None:
                        collect_nodes_at_depth(child, current_depth + 1)
        
        collect_nodes_at_depth(octree)
        
        if samples:
            print(f"LOD级别 {depth}: 收集了 {len(samples)} 个样本节点")
            lod_samples.append(samples)
        else:
            print(f"LOD级别 {depth}: 没有找到节点")
    
    return lod_samples

def convert_hsp_to_dm(hsp_filename, dm_filename, min_size=0.1, max_depth=18):
    global written_nodes, depth_distribution
    written_nodes = 0
    depth_distribution = {}
    
    print(f"正在从 {hsp_filename} 读取数据...")
    data = read_hsp_file(hsp_filename)
    
    if len(data) == 0:
        print("错误: 未读取到任何数据点")
        return
    
    # 记录原始数据的点数量，用于后续LOD生成时的比较
    original_point_count = len(data)
    
    print(f"正在构建八叉树 (共 {original_point_count} 个点)...")
    print(f"使用参数: min_size={min_size}, max_depth={max_depth}")
    octree = build_octree(data, min_size, max_depth)
    
    # 验证八叉树
    valid, total_nodes, valid_leaves = verify_octree(octree)
    print(f"八叉树验证结果: {'有效' if valid else '无效'}")
    print(f"总节点数: {total_nodes}, 有效叶子节点数: {valid_leaves}")
    
    # 检查实际最大深度
    actual_max_depth = get_max_depth(octree)
    print(f"八叉树实际最大深度: {actual_max_depth} (设置的最大深度为: {max_depth})")
    
    # 获取详细的八叉树统计数据
    tree_stats = get_node_stats(octree)
    print("\n八叉树详细统计:")
    print(f"总节点数: {tree_stats['total_nodes']}")
    print(f"叶子节点数: {tree_stats['leaf_nodes']}")
    print(f"最大深度: {tree_stats['max_depth']}")
    print("\n按深度分布:")
    
    # 打印每个深度的节点统计
    for depth in sorted(tree_stats['by_depth'].keys()):
        depth_data = tree_stats['by_depth'][depth]
        print(f"  深度 {depth}: 总计 {depth_data['total']} 个节点, 其中叶子节点 {depth_data['leaves']} 个")
    
    # 生成LOD样本数据用于调试
    proposed_max_depth = min(actual_max_depth, max_depth)
    lod_samples = generate_sample_lod_data(octree, proposed_max_depth)
    print(f"\n生成了 {len(lod_samples)} 个LOD级别的样本数据")
    
    if not valid or valid_leaves == 0:
        print("警告: 八叉树结构可能有问题，没有有效的叶子节点")
    
    print(f"\n正在写入增强版二进制八叉树(含LOD数据)到 {dm_filename}...")
    # 使用新的写入函数，支持LOD数据，并传入原始点数用于判断最大LOD深度
    used_max_depth = write_octree_with_lod(octree, dm_filename, proposed_max_depth, original_point_count)
    
    print(f"转换完成. 输出已保存到 {dm_filename}")
    print(f"总共写入 {written_nodes} 个节点")
    print(f"最终使用的LOD深度: {used_max_depth} (原始设置: {max_depth}, 八叉树实际深度: {actual_max_depth})")
    
    # 显示深度分布
    print(f"叶子节点深度分布: {depth_distribution}")
    
    # 显示文件大小
    file_size = os.path.getsize(dm_filename)
    print(f"文件大小: {file_size / (1024*1024):.2f} MB")
    
    return total_nodes, depth_distribution, used_max_depth

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python main.py input.hsp output.dm [min_size] [max_depth]")
        hsp_file = input("请输入.hsp文件的路径: ")
        dm_file = input("请输入输出.dm文件的路径: ")
        min_size_str = input("请输入最小节点尺寸 (默认: 0.1): ").strip()
        min_size = float(min_size_str) if min_size_str else 0.1
        max_depth_str = input("请输入最大深度 (默认: 18): ").strip()
        max_depth = int(max_depth_str) if max_depth_str else 18
    else:
        hsp_file = sys.argv[1]
        dm_file = sys.argv[2]
        min_size = float(sys.argv[3]) if len(sys.argv) > 3 else 0.1
        max_depth = int(sys.argv[4]) if len(sys.argv) > 4 else 18
    
    # 尝试不同参数测试变化
    print("\n==========================================")
    print(f"使用参数 min_size={min_size}, max_depth={max_depth} 生成八叉树")
    convert_hsp_to_dm(hsp_file, dm_file, min_size, max_depth)