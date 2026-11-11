import os
import json
import struct
import math

def create_glb(nodes_info, filename):
    """
    Creates a valid GLB 2.0 file containing meshes defined by nodes_info.
    nodes_info: list of dicts with:
      'name': str
      'vertices': list of [x, y, z]
      'normals': list of [nx, ny, nz]
      'indices': list of [i0, i1, i2]
      'color': [r, g, b, a]
      'metallic': float
      'roughness': float
    """
    bin_data = bytearray()
    buffer_views = []
    accessors = []
    meshes = []
    nodes = []
    materials = []

    for idx, info in enumerate(nodes_info):
        verts = info['vertices']
        normals = info['normals']
        indices = info['indices']
        color = info.get('color', [0.8, 0.8, 0.8, 1.0])
        metallic = info.get('metallic', 0.5)
        roughness = info.get('roughness', 0.5)

        # Pack indices (UNSIGNED_SHORT)
        idx_offset = len(bin_data)
        for tri in indices:
            bin_data.extend(struct.pack('<3H', *tri))
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
        idx_len = len(bin_data) - idx_offset

        # Pack vertices (FLOAT)
        pos_offset = len(bin_data)
        min_pos = [min(v[c] for v in verts) for c in range(3)]
        max_pos = [max(v[c] for v in verts) for c in range(3)]
        for v in verts:
            bin_data.extend(struct.pack('<3f', *v))
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
        pos_len = len(bin_data) - pos_offset

        # Pack normals (FLOAT)
        norm_offset = len(bin_data)
        for n in normals:
            bin_data.extend(struct.pack('<3f', *n))
        while len(bin_data) % 4 != 0:
            bin_data.append(0)
        norm_len = len(bin_data) - norm_offset

        # Buffer views
        bv_idx_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": idx_offset,
            "byteLength": idx_len,
            "target": 34963 # ELEMENT_ARRAY_BUFFER
        })

        bv_pos_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": pos_offset,
            "byteLength": pos_len,
            "target": 34962 # ARRAY_BUFFER
        })

        bv_norm_idx = len(buffer_views)
        buffer_views.append({
            "buffer": 0,
            "byteOffset": norm_offset,
            "byteLength": norm_len,
            "target": 34962 # ARRAY_BUFFER
        })

        # Accessors
        acc_idx_idx = len(accessors)
        accessors.append({
            "bufferView": bv_idx_idx,
            "byteOffset": 0,
            "componentType": 5123, # UNSIGNED_SHORT
            "count": len(indices) * 3,
            "type": "SCALAR"
        })

        acc_pos_idx = len(accessors)
        accessors.append({
            "bufferView": bv_pos_idx,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(verts),
            "type": "VEC3",
            "max": max_pos,
            "min": min_pos
        })

        acc_norm_idx = len(accessors)
        accessors.append({
            "bufferView": bv_norm_idx,
            "byteOffset": 0,
            "componentType": 5126, # FLOAT
            "count": len(normals),
            "type": "VEC3"
        })

        mat_idx = len(materials)
        materials.append({
            "name": f"Mat_{info['name']}",
            "pbrMetallicRoughness": {
                "baseColorFactor": color,
                "metallicFactor": metallic,
                "roughnessFactor": roughness
            }
        })

        mesh_idx = len(meshes)
        meshes.append({
            "name": info['name'],
            "primitives": [{
                "attributes": {
                    "POSITION": acc_pos_idx,
                    "NORMAL": acc_norm_idx
                },
                "indices": acc_idx_idx,
                "material": mat_idx
            }]
        })

        nodes.append({
            "name": info['name'],
            "mesh": mesh_idx
        })

    gltf_dict = {
        "asset": {"version": "2.0", "generator": "CyberForge 3D Engine"},
        "scenes": [{"nodes": list(range(len(nodes)))}],
        "scene": 0,
        "nodes": nodes,
        "meshes": meshes,
        "materials": materials,
        "accessors": accessors,
        "bufferViews": buffer_views,
        "buffers": [{"byteLength": len(bin_data)}]
    }

    json_str = json.dumps(gltf_dict, separators=(',', ':'))
    json_bytes = json_str.encode('utf-8')
    while len(json_bytes) % 4 != 0:
        json_bytes += b' '

    # GLB Header (12 bytes)
    magic = 0x46546C67  # 'glTF'
    version = 2
    total_len = 12 + 8 + len(json_bytes) + 8 + len(bin_data)

    glb = bytearray()
    glb.extend(struct.pack('<3I', magic, version, total_len))

    # JSON Chunk (0x4E4F534A = 'JSON')
    glb.extend(struct.pack('<2I', len(json_bytes), 0x4E4F534A))
    glb.extend(json_bytes)

    # BIN Chunk (0x004E4942 = 'BIN\0')
    glb.extend(struct.pack('<2I', len(bin_data), 0x004E4942))
    glb.extend(bin_data)

    os.makedirs(os.path.dirname(filename), exist_ok=True)
    with open(filename, 'wb') as f:
        f.write(glb)
    print(f"Generated {filename} ({len(glb)} bytes)")

def create_box(w, h, d, ox=0, oy=0, oz=0):
    hw, hh, hd = w / 2, h / 2, d / 2
    # 6 faces * 4 verts = 24 verts
    faces = [
        # +Z Front
        ([(-hw, -hh, hd), (hw, -hh, hd), (hw, hh, hd), (-hw, hh, hd)], (0, 0, 1)),
        # -Z Back
        ([(hw, -hh, -hd), (-hw, -hh, -hd), (-hw, hh, -hd), (hw, hh, -hd)], (0, 0, -1)),
        # +Y Top
        ([(-hw, hh, hd), (hw, hh, hd), (hw, hh, -hd), (-hw, hh, -hd)], (0, 1, 0)),
        # -Y Bottom
        ([(-hw, -hh, -hd), (hw, -hh, -hd), (hw, -hh, hd), (-hw, -hh, hd)], (0, -1, 0)),
        # +X Right
        ([(hw, -hh, hd), (hw, -hh, -hd), (hw, hh, -hd), (hw, hh, hd)], (1, 0, 0)),
        # -X Left
        ([(-hw, -hh, -hd), (-hw, -hh, hd), (-hw, hh, hd), (-hw, hh, -hd)], (-1, 0, 0)),
    ]

    verts = []
    normals = []
    indices = []

    for f_verts, norm in faces:
        base_idx = len(verts)
        for vx, vy, vz in f_verts:
            verts.append([vx + ox, vy + oy, vz + oz])
            normals.append(list(norm))
        indices.append([base_idx, base_idx + 1, base_idx + 2])
        indices.append([base_idx, base_idx + 2, base_idx + 3])

    return verts, normals, indices

def build_models():
    out_dir = os.path.join(os.path.dirname(__file__), '..', 'public', 'models')

    # 1. CASE: Outer chassis frame + interior shelf
    v1, n1, i1 = create_box(4.4, 5.0, 2.2, 0, 0, 0)
    v2, n2, i2 = create_box(4.2, 1.2, 2.0, 0, -1.8, 0)
    create_glb([
        {'name': 'CaseFrame', 'vertices': v1, 'normals': n1, 'indices': i1, 'color': [0.1, 0.12, 0.15, 1.0], 'metallic': 0.8, 'roughness': 0.3},
        {'name': 'PSUShroud', 'vertices': v2, 'normals': n2, 'indices': i2, 'color': [0.05, 0.06, 0.08, 1.0], 'metallic': 0.9, 'roughness': 0.2}
    ], os.path.join(out_dir, 'case.glb'))

    # 2. MOTHERBOARD: ATX board + VRM heatsinks + PCIe slots
    v_mb, n_mb, i_mb = create_box(3.05, 3.05, 0.08, 0, 0.5, -0.8)
    v_vrm, n_vrm, i_vrm = create_box(1.2, 0.5, 0.3, -0.6, 1.7, -0.65)
    v_pcie, n_pcie, i_pcie = create_box(2.2, 0.1, 0.2, 0.2, -0.3, -0.7)
    create_glb([
        {'name': 'PCB', 'vertices': v_mb, 'normals': n_mb, 'indices': i_mb, 'color': [0.08, 0.1, 0.14, 1.0], 'metallic': 0.3, 'roughness': 0.6},
        {'name': 'VRMHeatsink', 'vertices': v_vrm, 'normals': n_vrm, 'indices': i_vrm, 'color': [0.2, 0.22, 0.28, 1.0], 'metallic': 0.9, 'roughness': 0.2},
        {'name': 'PCIeSlot', 'vertices': v_pcie, 'normals': n_pcie, 'indices': i_pcie, 'color': [0.15, 0.15, 0.15, 1.0], 'metallic': 0.2, 'roughness': 0.5}
    ], os.path.join(out_dir, 'motherboard.glb'))

    # 3. CPU: Socket base + Metallic Heatspreader (IHS)
    v_cpu1, n_cpu1, i_cpu1 = create_box(0.8, 0.8, 0.04, 0, 1.1, -0.74)
    v_cpu2, n_cpu2, i_cpu2 = create_box(0.68, 0.68, 0.06, 0, 1.1, -0.7)
    create_glb([
        {'name': 'CpuSubstrate', 'vertices': v_cpu1, 'normals': n_cpu1, 'indices': i_cpu1, 'color': [0.02, 0.35, 0.15, 1.0], 'metallic': 0.2, 'roughness': 0.7},
        {'name': 'CpuIHS', 'vertices': v_cpu2, 'normals': n_cpu2, 'indices': i_cpu2, 'color': [0.85, 0.88, 0.9, 1.0], 'metallic': 0.95, 'roughness': 0.15}
    ], os.path.join(out_dir, 'cpu.glb'))

    # 4. COOLER: Dual Tower Heatsink + Central ARGB Fan
    v_c1, n_c1, i_c1 = create_box(1.2, 1.2, 0.8, 0, 1.1, -0.2)
    v_fan, n_fan, i_fan = create_box(1.1, 1.1, 0.15, 0, 1.1, 0.25)
    create_glb([
        {'name': 'TowerHeatsink', 'vertices': v_c1, 'normals': n_c1, 'indices': i_c1, 'color': [0.75, 0.77, 0.8, 1.0], 'metallic': 0.85, 'roughness': 0.25},
        {'name': 'RGBFan', 'vertices': v_fan, 'normals': n_fan, 'indices': i_fan, 'color': [0.0, 0.94, 1.0, 1.0], 'metallic': 0.1, 'roughness': 0.2}
    ], os.path.join(out_dir, 'cooler.glb'))

    # 5. RAM: Dual RGB sticks
    v_r1, n_r1, i_r1 = create_box(0.06, 0.8, 0.2, 0.7, 1.1, -0.65)
    v_r2, n_r2, i_r2 = create_box(0.06, 0.8, 0.2, 0.85, 1.1, -0.65)
    create_glb([
        {'name': 'RAMStick1', 'vertices': v_r1, 'normals': n_r1, 'indices': i_r1, 'color': [0.0, 0.94, 1.0, 1.0], 'metallic': 0.8, 'roughness': 0.2},
        {'name': 'RAMStick2', 'vertices': v_r2, 'normals': n_r2, 'indices': i_r2, 'color': [0.0, 0.94, 1.0, 1.0], 'metallic': 0.8, 'roughness': 0.2}
    ], os.path.join(out_dir, 'ram.glb'))

    # 6. GPU: Triple fan gaming graphics card
    v_gpu, n_gpu, i_gpu = create_box(3.2, 0.8, 1.3, 0.3, -0.3, 0.0)
    v_backplate, n_backplate, i_backplate = create_box(3.2, 0.04, 1.3, 0.3, 0.12, 0.0)
    create_glb([
        {'name': 'GpuShroud', 'vertices': v_gpu, 'normals': n_gpu, 'indices': i_gpu, 'color': [0.12, 0.14, 0.18, 1.0], 'metallic': 0.85, 'roughness': 0.3},
        {'name': 'GpuBackplate', 'vertices': v_backplate, 'normals': n_backplate, 'indices': i_backplate, 'color': [0.25, 0.27, 0.32, 1.0], 'metallic': 0.95, 'roughness': 0.2}
    ], os.path.join(out_dir, 'gpu.glb'))

    # 7. STORAGE: M.2 NVMe SSD
    v_ssd, n_ssd, i_ssd = create_box(0.8, 0.22, 0.04, 0.2, 0.2, -0.73)
    create_glb([
        {'name': 'NVMeSSD', 'vertices': v_ssd, 'normals': n_ssd, 'indices': i_ssd, 'color': [0.0, 0.7, 0.9, 1.0], 'metallic': 0.9, 'roughness': 0.2}
    ], os.path.join(out_dir, 'storage.glb'))

    # 8. PSU: Power Supply Unit with Fan Intake
    v_psu, n_psu, i_psu = create_box(1.8, 1.0, 1.6, -0.8, -1.8, 0.0)
    create_glb([
        {'name': 'PSUUnit', 'vertices': v_psu, 'normals': n_psu, 'indices': i_psu, 'color': [0.15, 0.15, 0.18, 1.0], 'metallic': 0.7, 'roughness': 0.4}
    ], os.path.join(out_dir, 'psu.glb'))

    print("All 8 PC hardware 3D models generated successfully!")

if __name__ == '__main__':
    build_models()
