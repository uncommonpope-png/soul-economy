---
name: data-visualization
description: Data visualization libraries for charts and graphs
domain: visualization
language: typescript
stars: "285000"
topics: ["data-visualization", "charts", "d3", "echarts", "recharts", "graph"]
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
---

# Data Visualization

## Origin

Mined from 8 top data visualization repos on GitHub: D3.js (110k★), Apache ECharts (66k★), Chart.js (65k★), Recharts (24k★), Semiotic (2.5k★), Vizzu (2k★), G6/AntV (12k★), ApexCharts (15k★).

## Repos Covered

### D3.js (110k★)
- **Type:** Low-level visualization grammar, SVG/Canvas/HTML
- **Key features:** Maximum flexibility, data-driven documents, 1000s of examples
- **When to use:** Custom visualizations, complex data stories, full control needed

### Apache ECharts (66k★)
- **Type:** High-performance charting with WebGL acceleration
- **Key features:** 20+ chart types, massive datasets (10M+ points), 3D with ECharts GL
- **When to use:** Enterprise dashboards, large datasets, built-in interactivity

### Chart.js (65k★)
- **Type:** Lightweight canvas-based charting
- **Key features:** 11KB min, 8 core chart types, responsive, simple API
- **When to use:** Small dashboards, quick charts, simplest possible API

### Recharts (24k★)
- **Type:** Declarative React charting on D3
- **Key features:** Composable React components, SVG rendering, responsive
- **When to use:** React apps needing simple, composable charts

### Semiotic (2.5k★)
- **Type:** AI-ready React visualization with MCP server
- **Key features:** 38 chart types, network graphs, streaming data, coordinated views, MCP server for AI agents
- **When to use:** AI-native dashboards, complex multi-chart views

### Vizzu (2k★)
- **Type:** Animated data stories with seamless transitions
- **Key features:** C++/WASM core, automatic animation between states, data stories
- **When to use:** Animated presentations, data storytelling

### G6/AntV (12k★)
- **Type:** Graph visualization engine
- **Key features:** 10+ layouts, GPU/Rust acceleration, Canvas/SVG/WebGL
- **When to use:** Network graphs, tree visualization, complex relationships

### ApexCharts (15k★)
- **Type:** Modern SVG charting library
- **Key features:** Interactive, responsive, 15+ chart types, React/Vue/Angular
- **When to use:** Interactive dashboards, feature-rich charts

## Key Patterns

### Choosing Chart Libraries
| Need | Library |
|------|---------|
| Maximum control/customization | D3.js |
| Large datasets (10M+) | ECharts |
| Quick simple charts | Chart.js |
| React declarative | Recharts |
| AI-native / MCP | Semiotic |
| Animated data stories | Vizzu |
| Graph/network | G6 |
| Interactive dashboards | ApexCharts |

### Performance Hierarchy
1. **Canvas rendering** (Chart.js, ECharts) — better for large datasets
2. **SVG rendering** (D3, Recharts) — better for small/medium, crisp at any zoom
3. **WebGL** (ECharts GL, deck.gl) — GPU-accelerated for millions of points
4. **WASM** (Vizzu) — near-native performance for animations
