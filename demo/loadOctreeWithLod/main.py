import numpy as np
import struct
import os
import time

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

    def insert(self, x, y, z, value, min_size=0.5, max_depth=8):
        # 添加最大深度控制，确保有足够的LOD层级
        # 降低默认最小尺寸，确保更细致的分割
        
        # 调试输出
        global insert_calls, split_decisions
        insert_calls += 1
        
        # 强制进行分裂用于测试
        if self.depth < max_depth and self.size > min_size * 2:  # 确保至少分裂到指定的最小尺寸
            force_split = True
        else:
            force_split = False
            
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
        
        # 如果达到最小尺寸或最大深度，设为叶子节点
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

    def get_average_value_at_depth(self, target_depth):
        """获取特定深度的平均值，用于LOD"""
        if self.depth == target_depth and self.is_leaf:
            return self.value, 1
        
        if self.depth >= target_depth or all(child is None for child in self.children):
            return self.value if self.is_leaf else 0, 1 if self.is_leaf else 0
            
        # 递归计算子节点的平均值
        total_value = 0
        total_count = 0
        
        for child in self.children:
            if child is not None:
                child_value, child_count = child.get_average_value_at_depth(target_depth)
                if child_count > 0:
                    total_value += child_value * child_count
                    total_count += child_count
                    
        if total_count > 0:
            return total_value / total_count, total_count
        return 0, 0

# 用于记录统计信息的全局变量
leaf_count = 0
written_nodes = 0
depth_distribution = {}  # 添加深度分布统计
insert_calls = 0  # 记录insert被调用的次数
split_decisions = 0  # 记录分裂决策的次数

def write_octree_to_binary(node, file):
    global written_nodes
    written_nodes += 1
    
    # Write node structure
    # Format: [is_leaf (1 byte)][value (8 bytes, if leaf)][child_pointers (8 pointers if not leaf)]
    if node.is_leaf:
        file.write(struct.pack('?', True))
        file.write(struct.pack('d', node.value))
        
        # 统计深度分布
        global depth_distribution
        if node.depth not in depth_distribution:
            depth_distribution[node.depth] = 0
        depth_distribution[node.depth] += 1
        
        # 调试信息 - 输出叶子节点信息
        if written_nodes % 1000 == 0 or written_nodes < 20:
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
                write_octree_to_binary(node.children[i], file)

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
                    if line_count <= 5 or line_count % 10000 == 0:
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

def build_octree(data, min_size=0.5, max_depth=8):
    global leaf_count, insert_calls, split_decisions
    insert_calls = 0
    split_decisions = 0
    
    start_time = time.time()
    
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
        if idx % 10000 == 0:
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

def convert_hsp_to_dm(hsp_filename, dm_filename, min_size=0.5, max_depth=8):
    global written_nodes, depth_distribution
    written_nodes = 0
    depth_distribution = {}
    
    print(f"正在从 {hsp_filename} 读取数据...")
    data = read_hsp_file(hsp_filename)
    
    if len(data) == 0:
        print("错误: 未读取到任何数据点")
        return
    
    print(f"正在构建八叉树 (共 {len(data)} 个点)...")
    print(f"使用参数: min_size={min_size}, max_depth={max_depth}")
    octree = build_octree(data, min_size, max_depth)
    
    # 验证八叉树
    valid, total_nodes, valid_leaves = verify_octree(octree)
    print(f"八叉树验证结果: {'有效' if valid else '无效'}")
    print(f"总节点数: {total_nodes}, 有效叶子节点数: {valid_leaves}")
    
    # 检查实际最大深度
    actual_max_depth = get_max_depth(octree)
    print(f"八叉树实际最大深度: {actual_max_depth} (设置的最大深度为: {max_depth})")
    
    if not valid or valid_leaves == 0:
        print("警告: 八叉树结构可能有问题，没有有效的叶子节点")
    
    print(f"正在写入二进制八叉树到 {dm_filename}...")
    with open(dm_filename, 'wb') as file:
        # Write header
        file.write(b'DMOCTREE')  # Magic number
        file.write(struct.pack('I', 1))  # Version
        
        # Write data dimensions
        x_min, y_min, z_min = data[:, 0].min(), data[:, 1].min(), data[:, 2].min()
        x_max, y_max, z_max = data[:, 0].max(), data[:, 1].max(), data[:, 2].max()
        
        file.write(struct.pack('ddd', x_min, y_min, z_min))  # Min bounds
        file.write(struct.pack('ddd', x_max, y_max, z_max))  # Max bounds
        
        # Write the offset to the root node
        root_offset = file.tell() + 8  # 8 bytes for the offset itself
        file.write(struct.pack('Q', root_offset))
        
        # Write the octree structure
        write_octree_to_binary(octree, file)
    
    print(f"转换完成. 输出已保存到 {dm_filename}")
    print(f"总共写入 {written_nodes} 个节点")
    
    # 显示深度分布
    print(f"叶子节点深度分布: {depth_distribution}")
    
    # 显示文件大小
    file_size = os.path.getsize(dm_filename)
    print(f"文件大小: {file_size / (1024*1024):.2f} MB")
    
    return total_nodes, depth_distribution

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("用法: python main.py input.hsp output.dm [min_size] [max_depth]")
        hsp_file = input("请输入.hsp文件的路径: ")
        dm_file = input("请输入输出.dm文件的路径: ")
        min_size_str = input("请输入最小节点尺寸 (默认: 0.5): ").strip()
        min_size = float(min_size_str) if min_size_str else 0.5
        max_depth_str = input("请输入最大深度 (默认: 8): ").strip()
        max_depth = int(max_depth_str) if max_depth_str else 8
    else:
        hsp_file = sys.argv[1]
        dm_file = sys.argv[2]
        min_size = float(sys.argv[3]) if len(sys.argv) > 3 else 0.5
        max_depth = int(sys.argv[4]) if len(sys.argv) > 4 else 8
    
    # 尝试不同参数测试变化
    print("\n==========================================")
    print(f"使用参数 min_size={min_size}, max_depth={max_depth} 生成八叉树")
    convert_hsp_to_dm(hsp_file, dm_file, min_size, max_depth)