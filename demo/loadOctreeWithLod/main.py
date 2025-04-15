import numpy as np
import struct
import os

class OctreeNode:
    def __init__(self, x_min, y_min, z_min, size):
        self.x_min = x_min
        self.y_min = y_min
        self.z_min = z_min
        self.size = size
        self.children = [None] * 8  # 8 children for octree
        self.value = None
        self.is_leaf = False

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

    def insert(self, x, y, z, value, min_size=1.0):
        # If this is a leaf node with a value already, we may need to split
        if self.is_leaf:
            if abs(self.value - value) < 1e-6:  # Same value, no need to split
                return
            else:
                # Need to split and transfer existing value
                old_x, old_y, old_z = self.x_min, self.y_min, self.z_min
                old_value = self.value
                self.is_leaf = False
                self.value = None
                
                # Only split if we're above minimum size
                if self.size > min_size:
                    self.insert(old_x, old_y, old_z, old_value, min_size)
                    self.insert(x, y, z, value, min_size)
                else:
                    # At minimum size, just overwrite with new value
                    self.value = value
                    self.is_leaf = True
                return
        
        # If we're at minimum size, make this a leaf
        if self.size <= min_size:
            self.value = value
            self.is_leaf = True
            return
            
        # Otherwise, insert into appropriate child
        child_index = self.get_child_index(x, y, z)
        child_size = self.size / 2
        
        if self.children[child_index] is None:
            # Calculate child's corner
            child_x = self.x_min + (child_index & 1) * child_size
            child_y = self.y_min + ((child_index & 2) >> 1) * child_size
            child_z = self.z_min + ((child_index & 4) >> 2) * child_size
            
            self.children[child_index] = OctreeNode(child_x, child_y, child_z, child_size)
            
        self.children[child_index].insert(x, y, z, value, min_size)

def write_octree_to_binary(node, file):
    # Write node structure
    # Format: [is_leaf (1 byte)][value (8 bytes, if leaf)][child_pointers (8 pointers if not leaf)]
    if node.is_leaf:
        file.write(struct.pack('?', True))
        file.write(struct.pack('d', node.value))
    else:
        file.write(struct.pack('?', False))
        
        # Placeholder for child pointers
        child_pointer_positions = []
        for i in range(8):
            child_pointer_positions.append(file.tell())
            file.write(struct.pack('Q', 0))  # 8-byte placeholder for pointer
            
        # Write children and update pointers
        for i in range(8):
            if node.children[i] is not None:
                # Record current position
                child_position = file.tell()
                
                # Go back and update the pointer
                current_position = file.tell()
                file.seek(child_pointer_positions[i])
                file.write(struct.pack('Q', child_position))
                file.seek(current_position)
                
                # Write child node
                write_octree_to_binary(node.children[i], file)

def read_hsp_file(filename):
    data = []
    with open(filename, 'r') as file:
        for line in file:
            # Parse the four columns: x, y, z, v
            values = line.strip().split()
            if len(values) >= 4:  # Ensure we have at least 4 columns
                try:
                    x = float(values[0])
                    y = float(values[1])
                    z = float(values[2])
                    v = float(values[3])
                    data.append((x, y, z, v))
                except ValueError:
                    print(f"Warning: Could not parse line: {line.strip()}")
    return np.array(data)

def build_octree(data):
    # Find the bounding box
    x_min, y_min, z_min = data[:, 0].min(), data[:, 1].min(), data[:, 2].min()
    x_max, y_max, z_max = data[:, 0].max(), data[:, 1].max(), data[:, 2].max()
    
    # Calculate required size (power of 2)
    max_range = max(x_max - x_min, y_max - y_min, z_max - z_min)
    size = 1
    while size < max_range:
        size *= 2
    
    # Create root node
    root = OctreeNode(x_min, y_min, z_min, size)
    
    # Insert all points
    for x, y, z, v in data:
        root.insert(x, y, z, v)
    
    return root

def convert_hsp_to_dm(hsp_filename, dm_filename):
    print(f"Reading data from {hsp_filename}...")
    data = read_hsp_file(hsp_filename)
    
    print(f"Building octree with {len(data)} points...")
    octree = build_octree(data)
    
    print(f"Writing binary octree to {dm_filename}...")
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
    
    print(f"Conversion complete. Output saved to {dm_filename}")

if __name__ == "__main__":
    import sys
    
    if len(sys.argv) < 3:
        print("Usage: python hsp_to_dm.py input.hsp output.dm")
        hsp_file = input("Enter the path to the .hsp file: ")
        dm_file = input("Enter the path for the output .dm file: ")
    else:
        hsp_file = sys.argv[1]
        dm_file = sys.argv[2]
    
    convert_hsp_to_dm(hsp_file, dm_file)