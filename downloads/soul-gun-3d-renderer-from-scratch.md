---
name: 3d-renderer-from-scratch
description: Build a 3D Renderer from Scratch
domain: computer-science
language: python
stars: "0"
topics: ["computer-science", "from-scratch", "build-your-own-x", "education"]
version: 0.1.0
author: profit-prime
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Build a 3D Renderer from Scratch

> *"3D graphics is just: project 3D points to 2D, fill triangles, apply shading."*

---

## The Mental Model

```
┌─────────────────────────────────────────────────────────────────┐
│                   3D RENDERING PIPELINE                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   MODEL (3D mesh with vertices, normals)                       │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  1. TRANSFORM                                             │  │
│   │     World → Camera space (view matrix)                   │  │
│   │     Camera → Clip space (projection matrix)              │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  2. CLIPPING & CULLING                                    │  │
│   │     Remove triangles outside view frustum                 │  │
│   │     Backface culling                                       │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  3. RASTERIZE                                             │  │
│   │     Convert triangles to pixels                          │  │
│   │     Interpolate colors, normals, UVs                      │  │
│   └─────────────────────────────────────────────────────────┘  │
│        │                                                        │
│        ▼                                                        │
│   ┌─────────────────────────────────────────────────────────┐  │
│   │  4. SHADE & OUTPUT                                        │  │
│   │     Apply lighting model                                 │  │
│   │     Write to framebuffer                                 │  │
│   └─────────────────────────────────────────────────────────┘  │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Build Steps (5 Steps, ~100 Lines)

### Step 1: Vector and Matrix Math (20 lines)

```python
"""Step 1: Basic vector and matrix operations."""
import math

class Vec3:
    def __init__(self, x=0, y=0, z=0):
        self.x = x
        self.y = y
        self.z = z

    def __add__(self, v):
        return Vec3(self.x + v.x, self.y + v.y, self.z + v.z)

    def __sub__(self, v):
        return Vec3(self.x - v.x, self.y - v.y, self.z - v.z)

    def __mul__(self, s):
        return Vec3(self.x * s, self.y * s, self.z * s)

    def dot(self, v):
        return self.x * v.x + self.y * v.y + self.z * v.z

    def cross(self, v):
        return Vec3(
            self.y * v.z - self.z * v.y,
            self.z * v.x - self.x * v.z,
            self.x * v.y - self.y * v.x
        )

    def length(self):
        return math.sqrt(self.x**2 + self.y**2 + self.z**2)

    def normalize(self):
        l = self.length()
        return Vec3(self.x/l, self.y/l, self.z/l) if l > 0 else Vec3()

class Mat4:
    def __init__(self, data=None):
        self.data = data or [[1,0,0,0],[0,1,0,0],[0,0,1,0],[0,0,0,1]]

    def mul_vec(self, v):
        """Multiply matrix by vec4."""
        x = self.data[0][0]*v.x + self.data[0][1]*v.y + self.data[0][2]*v.z + self.data[0][3]
        y = self.data[1][0]*v.x + self.data[1][1]*v.y + self.data[1][2]*v.z + self.data[1][3]
        z = self.data[2][0]*v.x + self.data[2][1]*v.y + self.data[2][2]*v.z + self.data[2][3]
        w = self.data[3][0]*v.x + self.data[3][1]*v.y + self.data[3][2]*v.z + self.data[3][3]
        return Vec3(x/w, y/w, z/w)
```

---

### Step 2: Perspective Projection (15 lines)

```python
"""Step 2: Camera and perspective projection."""

class Camera:
    def __init__(self, pos, target):
        self.pos = pos
        self.forward = (target - pos).normalize()
        self.up = Vec3(0, 1, 0)
        self.right = self.forward.cross(self.up).normalize()
        self.up = self.right.cross(self.forward)

    def project(self, point, width, height, fov=60):
        """Project 3D point to 2D screen coordinates."""
        # Transform to camera space
        p = point - self.pos
        x = p.dot(self.right)
        y = p.dot(self.up)
        z = p.dot(self.forward) * -1

        if z <= 0:
            return None  # Behind camera

        # Perspective divide
        fov_rad = math.radians(fov)
        scale = 1 / math.tan(fov_rad / 2)
        sx = (x / z) * scale * (width / 2) + width / 2
        sy = -(y / z) * scale * (height / 2) + height / 2

        return (sx, sy, z)

# Test
cam = Camera(Vec3(0, 0, -5), Vec3(0, 0, 0))
p = Vec3(1, 1, 0)
screen = cam.project(p, 800, 600)
print(f"Screen: {screen}")
```

---

### Step 3: Rasterizer (30 lines)

```python
"""Step 3: Simple rasterizer - draw triangles."""

class Rasterizer:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.framebuffer = [[(255,255,255) for _ in range(width)] for _ in range(height)]
        self.zbuffer = [[float('inf') for _ in range(width)] for _ in range(height)]

    def clear(self, color=(255,255,255)):
        for y in range(self.height):
            for x in range(self.width):
                self.framebuffer[y][x] = color
        for y in range(self.height):
            for x in range(self.width):
                self.zbuffer[y][x] = float('inf')

    def draw_triangle(self, p1, p2, p3, color):
        """Draw filled triangle using scanline algorithm."""
        # Sort by y
        vertices = sorted([p1, p2, p3], key=lambda v: v[1])

        def interpolate(y, p1, p2):
            t = (y - p1[1]) / (p2[1] - p1[1]) if p2[1] != p1[1] else 0
            x = p1[0] + t * (p2[0] - p1[0])
            z = p1[2] + t * (p2[2] - p1[2])
            return x, z

        # Top to bottom
        for y in range(int(vertices[0][1]), int(vertices[2][1])):
            # Left intersection
            if y < vertices[1][1]:
                xl, zl = interpolate(y, vertices[0], vertices[2])
            else:
                xl, zl = interpolate(y, vertices[1], vertices[2])

            # Right intersection
            xr, zr = interpolate(y, vertices[0], vertices[1]) if y < vertices[1][1] else interpolate(y, vertices[1], vertices[2])

            # Scanline fill
            if xl > xr:
                xl, xr = xr, xl
                zl, zr = zr, zl

            for x in range(int(xl), int(xr) + 1):
                t = (x - xl) / (xr - xl) if xr != xl else 0
                z = zl + t * (zr - zl)
                if 0 <= x < self.width and z < self.zbuffer[y][x]:
                    self.zbuffer[y][x] = z
                    self.framebuffer[y][x] = color

# Test
rast = Rasterizer(100, 100)
rast.draw_triangle((10, 10, 1), (50, 80, 1), (90, 10, 1), (255, 0, 0))
print("Triangle drawn")
```

---

### Step 4: Simple Ray Tracer (20 lines)

```python
"""Step 4: Simple ray tracer."""

import math

class Ray:
    def __init__(self, origin, direction):
        self.origin = origin
        self.direction = direction.normalize()

    def intersect_sphere(self, center, radius):
        """Intersect ray with sphere."""
        oc = self.origin - center
        a = self.direction.dot(self.direction)
        b = 2 * oc.dot(self.direction)
        c = oc.dot(oc) - radius * radius
        discriminant = b*b - 4*a*c

        if discriminant < 0:
            return None

        t = (-b - math.sqrt(discriminant)) / (2*a)
        if t > 0:
            point = self.origin + self.direction * t
            return t, point, (point - center).normalize()
        return None

class RayTracer:
    def __init__(self, width, height):
        self.width = width
        self.height = height
        self.framebuffer = [[(0,0,0) for _ in range(width)] for _ in range(height)]

    def render(self, camera, spheres):
        for y in range(self.height):
            for x in range(self.width):
                # Ray direction
                nx = (x - self.width/2) / self.width
                ny = (y - self.height/2) / self.height
                dir_ = Vec3(nx, ny, -1).normalize()

                ray = Ray(camera, dir_)

                # Find closest hit
                closest = None
                for sphere in spheres:
                    center = sphere['center']
                    hit = ray.intersect_sphere(Vec3(center[0], center[1], center[2]), sphere['radius'])
                    if hit and (closest is None or hit[0] < closest[0]):
                        closest = hit
                        color = sphere['color']

                if closest:
                    self.framebuffer[y][x] = color
                else:
                    self.framebuffer[y][x] = (50, 50, 100)

# Test
tracer = RayTracer(100, 100)
spheres = [{'center': [50, 50, 200], 'radius': 30, 'color': (255, 0, 0)}]
tracer.render(Vec3(50, 50, 0), spheres)
print("Ray traced!")
```

---

### Step 5: Shading (15 lines)

```python
"""Step 5: Add lighting and shading."""

class Light:
    def __init__(self, pos, color=(255, 255, 255), intensity=1):
        self.pos = pos
        self.color = color
        self.intensity = intensity

class PhongShading:
    def shade(self, normal, view, light):
        # Ambient
        ambient = 0.1

        # Diffuse
        light_dir = (light.pos - view).normalize()
        diff = max(normal.dot(light_dir), 0)

        # Specular
        reflect = 2 * normal.dot(light_dir) * normal - light_dir
        spec = max(reflect.dot((Vec3(0,0,-1)).normalize()), 0) ** 32

        intensity = ambient + diff * light.intensity + spec * 0.5

        return tuple(int(min(c * intensity, 255) for c in light.color))

# Apply shading to rasterizer
def shade_triangle(raster, p1, p2, p3, normal1, normal2, normal3, lights, camera):
    """Per-vertex lighting with Phong interpolation."""
    # Compute lighting at each vertex
    colors = []
    for p, n in [(p1, normal1), (p2, normal2), (p3, normal3)]:
        ambient = 0.1
        diffuse = 0.0
        specular = 0.0
        for light in lights:
            light_dir = (light.pos - Vec3(*p)).normalize()
            diff = max(n.dot(light_dir), 0)
            view = (camera.pos - Vec3(*p)).normalize()
            reflect = 2 * n.dot(light_dir) * n - light_dir
            spec = max(reflect.dot(view), 0) ** 32
            diffuse += diff * light.intensity
            specular += spec * 0.5 * light.intensity
        intensity = min(ambient + diffuse + specular, 1.0)
        colors.append(tuple(int(c * intensity) for c in light.color))
    # Draw triangle with interpolated color (simplified: use average)
    avg_color = (
        (colors[0][0] + colors[1][0] + colors[2][0]) // 3,
        (colors[0][1] + colors[1][1] + colors[2][1]) // 3,
        (colors[0][2] + colors[1][2] + colors[2][2]) // 3
    )
    raster.draw_triangle(p1, p2, p3, avg_color)
```

---

## Bridge to Production

| Our Renderer | OpenGL/DirectX |
|--------------|-----------------|
| Software | GPU hardware |
| No textures | Texture mapping |
| No depth testing | Z-buffer |
| No shaders | GLSL/HLSL |
| Flat color | PBR materials |

**Production systems to study:**
- [Scratchapixel Ray Tracing](https://www.scratchapixel.com/)
- [Tiny Renderer](https://github.com/ssloy/tinyrenderer)
- [Ray Tracing in One Weekend](https://raytracing.github.io/)

---

## Checklist

- [ ] Step 1: Vector math
- [ ] Step 2: Camera projection
- [ ] Step 3: Rasterizer
- [ ] Step 4: Ray tracer
- [ ] Step 5: Phong shading
- [ ] Add: texture mapping
- [ ] Add: shadows