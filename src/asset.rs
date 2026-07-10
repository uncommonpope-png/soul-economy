use std::collections::HashMap;

#[derive(Debug, Clone)]
pub struct MeshData {
    pub vertices: Vec<f32>,
    pub indices: Vec<u32>,
}

pub struct AssetManager {
    meshes: HashMap<String, MeshData>,
}

impl AssetManager {
    pub fn new() -> Self {
        Self {
            meshes: HashMap::new(),
        }
    }

    pub fn register_mesh(&mut self, name: &str, data: MeshData) {
        self.meshes.insert(name.to_string(), data);
    }

    pub fn get_mesh(&self, name: &str) -> Option<&MeshData> {
        self.meshes.get(name)
    }

    pub fn has_mesh(&self, name: &str) -> bool {
        self.meshes.contains_key(name)
    }

    pub fn mesh_count(&self) -> usize {
        self.meshes.len()
    }
}

pub fn create_cube_mesh() -> MeshData {
    // A simple cube with 24 vertices (4 per face, 6 faces)
    // Position (3) + Normal (3) + UV (2) = 8 floats per vertex
    let mut vertices = Vec::new();
    let mut indices = Vec::new();

    let positions: &[[f32; 3]; 8] = &[
        [-0.5, -0.5, -0.5],
        [0.5, -0.5, -0.5],
        [0.5, 0.5, -0.5],
        [-0.5, 0.5, -0.5],
        [-0.5, -0.5, 0.5],
        [0.5, -0.5, 0.5],
        [0.5, 0.5, 0.5],
        [-0.5, 0.5, 0.5],
    ];

    let faces: &[[u32; 6]; 6] = &[
        [0, 1, 2, 2, 3, 0], // -Z
        [5, 4, 7, 7, 6, 5], // +Z
        [4, 0, 3, 3, 7, 4], // -X
        [1, 5, 6, 6, 2, 1], // +X
        [3, 2, 6, 6, 7, 3], // +Y
        [4, 5, 1, 1, 0, 4], // -Y
    ];

    let normals: &[[f32; 3]; 6] = &[
        [0.0, 0.0, -1.0],
        [0.0, 0.0, 1.0],
        [-1.0, 0.0, 0.0],
        [1.0, 0.0, 0.0],
        [0.0, 1.0, 0.0],
        [0.0, -1.0, 0.0],
    ];

    for (face_idx, face) in faces.iter().enumerate() {
        let normal = normals[face_idx];
        for &vert_idx in face.iter() {
            let pos = positions[vert_idx as usize];
            vertices.extend_from_slice(&pos);
            vertices.extend_from_slice(&normal);
            vertices.extend_from_slice(&[0.0, 0.0]); // UV placeholder
        }
        let base = (face_idx * 6) as u32;
        indices.extend_from_slice(&[base, base + 1, base + 2, base + 3, base + 4, base + 5]);
    }

    MeshData { vertices, indices }
}

pub fn create_plane_mesh() -> MeshData {
    let mut vertices = Vec::new();
    let size = 5.0;
    let verts: &[[f32; 3]; 4] = &[
        [-size, 0.0, -size],
        [size, 0.0, -size],
        [size, 0.0, size],
        [-size, 0.0, size],
    ];
    let normal = [0.0, 1.0, 0.0];
    let uvs: &[[f32; 2]; 4] = &[[0.0, 0.0], [1.0, 0.0], [1.0, 1.0], [0.0, 1.0]];

    let idxs: &[u32; 6] = &[0, 1, 2, 0, 2, 3];
    for &i in idxs.iter() {
        let p = verts[i as usize];
        let uv = uvs[i as usize];
        vertices.extend_from_slice(&p);
        vertices.extend_from_slice(&normal);
        vertices.extend_from_slice(&uv);
    }

    MeshData {
        vertices,
        indices: idxs.to_vec(),
    }
}

// Generate city building data as flat position+color arrays for the renderer
pub fn generate_city_vertices() -> (Vec<[f32; 3]>, Vec<[f32; 3]>) {
    let mut positions: Vec<[f32; 3]> = Vec::new();
    let mut colors: Vec<[f32; 3]> = Vec::new();

    // DEBUG: big triangle at origin, R=red, G=green, B=blue at corners
    positions.push([0.0, 5.0, 0.0]); colors.push([1.0, 0.0, 0.0]); // top red
    positions.push([5.0, 0.0, 0.0]); colors.push([0.0, 1.0, 0.0]); // right green
    positions.push([-5.0, 0.0, 0.0]); colors.push([0.0, 0.0, 1.0]); // left blue

    // Ground plane
    let ground_size = 30.0;
    let ground_verts: &[[f32; 3]; 4] = &[
        [-ground_size, -0.1, -ground_size],
        [ground_size, -0.1, -ground_size],
        [ground_size, -0.1, ground_size],
        [-ground_size, -0.1, ground_size],
    ];
    let ground_quad: &[u32; 6] = &[0, 1, 2, 0, 2, 3];
    let ground_color = [0.05, 0.05, 0.15];
    for &i in ground_quad.iter() {
        positions.push(ground_verts[i as usize]);
        colors.push(ground_color);
    }

    // Building palette — neon Dark City colors
    let palette: &[[f32; 3]; 8] = &[
        [1.00, 0.30, 0.60],  // hot pink
        [0.10, 0.90, 1.00],  // cyan
        [1.00, 0.90, 0.20],  // gold
        [0.20, 1.00, 0.60],  // emerald
        [0.70, 0.30, 1.00],  // violet
        [1.00, 0.50, 0.00],  // orange
        [0.30, 0.60, 1.00],  // blue
        [0.00, 1.00, 0.40],  // lime
    ];

    // Generate buildings in a wider grid
    let grid_size = 8;
    let spacing = 4.0;
    let offset = -(grid_size as f32 * spacing) / 2.0;

    for x in 0..grid_size {
        for z in 0..grid_size {
            let bx = offset + x as f32 * spacing;
            let bz = offset + z as f32 * spacing;
            let height = 1.0 + ((x * 7 + z * 13) % 6) as f32 * 1.0;
            let col_idx = (x * 3 + z * 7) % 8;
            let color = palette[col_idx];

            // Building
            let h = height;
            let s = 1.2;
            let verts: &[[f32; 3]; 8] = &[
                [bx - s, 0.0, bz - s],
                [bx + s, 0.0, bz - s],
                [bx + s, h, bz - s],
                [bx - s, h, bz - s],
                [bx - s, 0.0, bz + s],
                [bx + s, 0.0, bz + s],
                [bx + s, h, bz + s],
                [bx - s, h, bz + s],
            ];

            let faces: &[[u32; 6]; 6] = &[
                [0, 1, 2, 2, 3, 0],
                [5, 4, 7, 7, 6, 5],
                [4, 0, 3, 3, 7, 4],
                [1, 5, 6, 6, 2, 1],
                [3, 2, 6, 6, 7, 3],
                [4, 5, 1, 1, 0, 4],
            ];

            for face in faces.iter() {
                for &vi in face.iter() {
                    positions.push(verts[vi as usize]);
                    colors.push(color);
                }
            }
        }
    }

    (positions, colors)
}