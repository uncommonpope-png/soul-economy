---
name: image-editor-from-scratch
description: The Mental Model
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
---ame: image-editor-from-scratch
description: Use when user wants to understand how image editors work, build a raster graphics editor, or learn about pixel manipulation, convolution, and layer compositing. Triggers on: "build image editor", "raster graphics", "pixel manipulation", "layer compositing".
---

## The Mental Model
A digital image is a 2D grid of pixels. Each pixel has channels (R, G, B, A). Operations on images are function transforms on this grid: filtering (neighbor pixels), geometric transforms (re-mapping coordinates), color transforms (channel manipulation). Everything is math on matrices.

## Step 1: Image Representation
Represent an image as a 2D array of pixels. Each pixel is RGBA. Load from PPM (simple text format) before tackling PNG/JPEG.

```python
from struct import pack, unpack

class Image:
    def __init__(self, width=0, height=0):
        self.width = width
        self.height = height
        self.pixels = [[(0, 0, 0, 255) for _ in range(width)] for _ in range(height)]

    def load_ppm(self, path):
        with open(path) as f:
            assert f.readline().strip() == 'P3'
            width, height = map(int, f.readline().split())
            maxval = int(f.readline())
            self.width = width
            self.height = height
            self.pixels = []
            for h in range(height):
                row = []
                for w in range(width):
                    r, g, b = map(int, f.readline().split())
                    row.append((r, g, b, 255))
                self.pixels.append(row)

    def save_ppm(self, path):
        with open(path, 'w') as f:
            f.write(f'P3\n{self.width} {self.height}\n255\n')
            for row in self.pixels:
                for r, g, b, _ in row:
                    f.write(f'{r}\n{g}\n{b}\n')
```

## Step 2: Drawing Primitives
Lines, rectangles, circles. Bresenham's line algorithm: step diagonally when accumulated error crosses threshold—no trigonometry needed.

```python
def set_pixel(self, x, y, color):
    if 0 <= x < self.width and 0 <= y < self.height:
        self.pixels[y][x] = color

def draw_line(self, x0, y0, x1, y1, color):
    dx = abs(x1 - x0)
    dy = -abs(y1 - y0)
    sx = 1 if x0 < x1 else -1
    sy = 1 if y0 < y1 else -1
    err = dx + dy
    while True:
        self.set_pixel(x0, y0, color)
        if x0 == x1 and y0 == y1:
            break
        e2 = 2 * err
        if e2 >= dy:
            err += dy
            x0 += sx
        if e2 <= dx:
            err += dx
            y0 += sy

def draw_rect(self, x, y, w, h, color, filled=False):
    if filled:
        for i in range(x, x + w):
            for j in range(y, y + h):
                self.set_pixel(i, j, color)
    else:
        self.draw_line(x, y, x + w - 1, y, color)
        self.draw_line(x + w - 1, y, x + w - 1, y + h - 1, color)
        self.draw_line(x + w - 1, y + h - 1, x, y + h - 1, color)
        self.draw_line(x, y + h - 1, x, y, color)
```

## Step 3: Convolution Filters
Blur, sharpen, edge detect—these are all convolution operations. A kernel (small matrix) slides over the image. Output pixel = dot(kernel, neighborhood).

```python
def convolve(self, kernel):
    kh, kw = len(kernel), len(kernel[0])
    koh, kokw = kh // 2, kw // 2
    out = Image(self.width, self.height)
    for y in range(self.height):
        for x in range(self.width):
            r, g, b = 0, 0, 0
            for ky in range(kh):
                for kx in range(kw):
                    px = min(max(x + kx - kokw, 0), self.width - 1)
                    py = min(max(y + ky - koh, 0), self.height - 1)
                    pr, pg, pb, _ = self.pixels[py][px]
                    k = kernel[ky][kx]
                    r += pr * k; g += pg * k; b += pb * k
            r = int(max(0, min(255, r)))
            g = int(max(0, min(255, g)))
            b = int(max(0, min(255, b)))
            out.pixels[y][x] = (r, g, b, 255)
    return out

# Kernels:
BOX_BLUR = [[1/9, 1/9, 1/9], [1/9, 1/9, 1/9], [1/9, 1/9, 1/9]]
SHARPEN = [[0, -1, 0], [-1, 5, -1], [0, -1, 0]]
EDGE_DETECT = [[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]]
```

## Step 4: Rotation and Affine Transforms
Rotation re-maps every output pixel back to source coordinates (or forward, mapping each source pixel to output). Affine transforms handle scaling, rotation, shearing, translation as a 2x3 matrix.

```python
def rotate(self, angle_deg):
    angle = math.radians(angle_deg)
    cos_a, sin_a = math.cos(angle), math.sin(angle)
    new = Image(self.width, self.height)
    cx, cy = self.width / 2, self.height / 2
    for y in range(new.height):
        for x in range(new.width):
            dx = x - cx
            dy = y - cy
            sx = int(dx * cos_a - dy * sin_a + cx)
            sy = int(dx * sin_a + dy * cos_a + cy)
            if 0 <= sx < self.width and 0 <= sy < self.height:
                new.pixels[y][x] = self.pixels[sy][sx]
    return new

def affine_transform(self, matrix):
    """matrix: 2x3 list of lists [[a,b,tx],[c,d,ty]]"""
    new = Image(self.width, self.height)
    for y in range(new.height):
        for x in range(new.width):
            sx = int(matrix[0][0] * x + matrix[0][1] * y + matrix[0][2])
            sy = int(matrix[1][0] * x + matrix[1][1] * y + matrix[1][2])
            if 0 <= sx < self.width and 0 <= sy < self.height:
                new.pixels[y][x] = self.pixels[sy][sx]
    return new
```

## Step 5: Layer Compositing
Photoshop-style layers are composited bottom-to-top using alpha blending. The compositing formula: `out = top * alpha + bottom * (1 - alpha)`.

```python
def alpha_blend(bottom, top):
    """Blend two pixels (as RGBA tuples) using alpha compositing."""
    br, bg, bb, ba = bottom
    tr, tg, tb, ta = top
    # Top alpha normalized to [0, 1]
    a_top = ta / 255.0
    a_bot = (ba / 255.0) * (1.0 - a_top)
    a_out = a_top + a_bot
    if a_out < 1e-9:
        return (br, bg, bb, 0)
    out_r = int((tr * a_top + br * a_bot) / a_out)
    out_g = int((tg * a_top + bg * a_bot) / a_out)
    out_b = int((tb * a_top + bb * a_bot) / a_out)
    out_a = int(a_out * 255)
    return (out_r, out_g, out_b, out_a)

class Layer:
    def __init__(self, image, opacity=1.0, visible=True):
        self.image = image
        self.opacity = opacity
        self.visible = visible

def composite(layers):
    """Composite a list of Layer objects bottom-to-top."""
    result = Image(layers[0].image.width, layers[0].image.height)
    for layer in layers:
        if not layer.visible:
            continue
        for y in range(result.height):
            for x in range(result.width):
                blended = alpha_blend(result.pixels[y][x], layer.image.pixels[y][x])
                result.pixels[y][x] = blended
    return result
```

## Architecture
```
Image grid (2D array of RGBA pixels)
  → Load (PPM, PNG, JPEG decoders)
  → Core operations:
      → Drawing (Bresenham line, flood fill, bezier)
      → Filters (convolution: blur, sharpen, edge detect)
      → Geometric (rotate, scale, shear, mirror)
      → Color (levels, curves, hue/saturation, gradients)
      → Selection (marching squares, 2D polygon)
  → Layers (alpha compositing)
  → Export (PPM, PNG encoders)
```

## Bridge to Production
- **Mini version**: Pure Python pixel arrays, O(n²) convolution, basic compositing. Production image editors (Photoshop, GIMP, Lightroom) use GPU-accelerated rendering, ICC color profiles, 16-bit/channel HDR, non-destructive editing, history panels, vector tools, intelligent selection with AI, DICOM/CINEON/EXR support.
- **Production concerns**: GPU-based rasterization, ICC color management, floating point precision (32-bit float), layer group masks, vector paths / pen tools, smart objects, parametric filters, non-destructive adjustments, RAW file decoding (debayering), tone mapping, film grain simulation, ICC profile embedding.

## Reference Tutorials
- [Image Manipulation Part I: Projecting and Composing](https://blog.wearencol.info/code/)
- [Build an image editor from scratch (v3 - v2.2)](https://github.com/mdlee/image-editor-from-scratch)
- [Image Processing 101: The Transform Matrix](https://www.founderess.com/blog/2018-08-08-image-processing-101-the-transform-matrix.html)
- [Coding a Basic Image Editor in Python](https://medium.com/%40williamblevins/coding-a-basic-image-editor-in-python-33bc394340de)

## Checklist
- [ ] Step 1: Image representation (PPM load/save)
- [ ] Step 2: Drawing primitives (Bresenham line)
- [ ] Step 3: Convolution filters (blur, sharpen, edge)
- [ ] Step 4: Rotation and affine transforms
- [ ] Step 5: Layer compositing with alpha blending
