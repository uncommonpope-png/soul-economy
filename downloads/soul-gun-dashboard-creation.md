---
name: dashboard-creation
description: Build production dashboards with charts and graphics
domain: web-framework
language: typescript
stars: "116000"
topics: ["web-framework"]
version: 0.1.0
author: deerg
input_schema:
  type: object
  properties: {}
  required: []
output_schema:
  type: object
  properties: {}
  required: []
---# Dashboard Creation

## Origin

Researched from 20+ top dashboard repos: shadcn/ui (116k stars), Grafana (74k), Apache Superset (73k), D3.js (113k), Recharts (27k), ECharts (66k), MUI (98k), Ant Design (98k), NocoDB (63k), Metabase (47k), Appsmith (40k), and more.

## Instructions

Use this skill when building:
- **Data dashboards** with charts and metrics
- **Admin panels** with tables and forms
- **Real-time monitoring** with live updates
- **Analytics interfaces** with drill-down
- **BI tools** with SQL-backed visualizations

## Recommended Stack

| Level | Stack | Use Case |
|-------|-------|----------|
| Beginner | shadcn/ui + Recharts + Tailwind CSS | Rapid dashboard development |
| Intermediate | shadcn/ui + Radix + Recharts/ECharts | Custom enterprise dashboards |
| Advanced | D3.js or visx for bespoke visualizations | Complex custom charts |
| Observability | Grafana + Prometheus | DevOps/monitoring dashboards |
| BI Platform | Apache Superset or Metabase | Self-hosted BI tools |

---

## Layout Patterns

### Responsive Grid (Mobile-First)

```tsx
// 2-column responsive grid (mobile: 1 col, desktop: 2 col)
<div className='grid grid-cols-1 gap-4 xl:grid-cols-2'>
  <StatisticsCard />
  <TimelineChartCard />
  <DistributionCard />
  <HeatmapCard />
</div>

// 6-column dashboard grid with colspan
<div className='grid grid-cols-1 gap-3 lg:grid-cols-2 xl:grid-cols-6'>
  <TracesBarListChart className='col-span-1 xl:col-span-2' />
  <ModelCostTable className='col-span-1 xl:col-span-2' />
  <ScoresTable className='col-span-1 xl:col-span-2' />
  <TracesTimeSeries className='col-span-1 xl:col-span-3' />
  <ModelUsageChart className='col-span-1 xl:col-span-3' />
</div>
```

### Dashboard Card Structure

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';

export const DashboardCard = ({
  className,
  title,
  description,
  isLoading,
  children,
  headerRight,
}: {
  title: string;
  description?: string;
  isLoading?: boolean;
  children: React.ReactNode;
  headerRight?: React.ReactNode;
}) => {
  return (
    <Card className={cn('flex flex-col', className)}>
      <CardHeader className='relative'>
        <div className='flex items-top justify-between'>
          <div className='flex flex-col gap-1.5'>
            <CardTitle>{title}</CardTitle>
            {description && <CardDescription>{description}</CardDescription>}
          </div>
          {headerRight}
        </div>
        {isLoading && <div className='absolute top-5 right-5'><Spinner size='md' /></div>}
      </CardHeader>
      <CardContent className='flex flex-1 flex-col gap-4'>
        {children}
      </CardContent>
    </Card>
  );
};
```

---

## Chart Integration (Recharts)

### Chart Container Wrapper

```tsx
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    color?: string;
  };
};

export const ChartContainer = React.forwardRef<HTMLDivElement, 
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<typeof RechartsPrimitive.ResponsiveContainer>['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <div data-chart={chartId} ref={ref} className={cn('w-full h-full min-h-0', className)} {...props}>
      <style>{`
        [data-chart=${chartId}] { }
      `}</style>
      <RechartsPrimitive.ResponsiveContainer width='100%' height='100%' minWidth={0} minHeight={1}>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
});
```

### Line Chart (Time Series)

```tsx
import { CartesianGrid, Line, LineChart, XAxis, YAxis, Tooltip } from 'recharts';

function LineChartTimeSeries({ data, dataKey, color = 'var(--chart-1)' }: Props) {
  return (
    <ChartContainer config={{ [dataKey]: { label: dataKey, color } }}>
      <LineChart accessibilityLayer data={data}>
        <CartesianGrid stroke='hsl(var(--chart-grid))' vertical={false} />
        <XAxis 
          dataKey='time_dimension' 
          stroke='hsl(var(--chart-grid))' 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          interval='preserveStartEnd' 
          minTickGap={24} 
        />
        <YAxis 
          type='number' 
          stroke='hsl(var(--chart-grid))' 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
          niceTicks='auto' 
        />
        <Line 
          type='monotone' 
          dataKey={dataKey} 
          strokeWidth={2.5} 
          dot={false} 
          activeDot={{ r: 5, strokeWidth: 0 }} 
          stroke={color} 
          connectNulls 
        />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
      </LineChart>
    </ChartContainer>
  );
}
```

### Area Chart

```tsx
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';

function AreaChartTimeSeries({ data, dataKey, color = 'var(--chart-1)' }: Props) {
  return (
    <ChartContainer config={{ [dataKey]: { label: dataKey, color } }}>
      <AreaChart data={data}>
        <defs>
          <linearGradient id={`gradient-${dataKey}`} x1='0' y1='0' x2='0' y2='1'>
            <stop offset='0%' stopColor={color} stopOpacity={0.75} />
            <stop offset='100%' stopColor={color} stopOpacity={0.1} />
          </linearGradient>
        </defs>
        <CartesianGrid stroke='hsl(var(--chart-grid))' vertical={false} />
        <XAxis dataKey='time_dimension' />
        <YAxis type='number' niceTicks='auto' />
        <Area 
          type='monotone' 
          dataKey={dataKey} 
          fill={`url(#gradient-${dataKey})`} 
          strokeWidth={2.5} 
          connectNulls 
        />
        <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
      </AreaChart>
    </ChartContainer>
  );
}
```

### Bar Chart (Vertical)

```tsx
import { Bar, BarChart, XAxis, YAxis } from 'recharts';

function VerticalBarChart({ data }: { data: { dimension: string; metric: number }[] }) {
  return (
    <ChartContainer config={{}}>
      <BarChart data={data}>
        <XAxis 
          type='category' 
          dataKey='dimension' 
          stroke='hsl(var(--chart-grid))' 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <YAxis 
          type='number' 
          stroke='hsl(var(--chart-grid))' 
          fontSize={12} 
          tickLine={false} 
          axisLine={false} 
        />
        <Bar 
          dataKey='metric' 
          radius={[4, 4, 0, 0]} 
          fill='var(--chart-1)' 
          fillOpacity={0.3} 
        />
        <Tooltip cursor={false} contentStyle={{ backgroundColor: 'hsl(var(--background))' }} />
      </BarChart>
    </ChartContainer>
  );
}
```

### Bar Chart (Horizontal with Dynamic Height)

```tsx
function HorizontalBarChart({ data, showValueLabels = false }: Props) {
  const BAR_ROW_HEIGHT = 36;
  const CHART_AXIS_PADDING = 32;
  const adjustedHeight = Math.max(200, data.length * BAR_ROW_HEIGHT + CHART_AXIS_PADDING);

  return (
    <div style={{ minHeight: adjustedHeight }}>
      <ChartContainer config={{}}>
        <BarChart data={data} layout='vertical' margin={{ top: 4, right: 50, bottom: 4, left: 0 }} barCategoryGap='12%'>
          <XAxis type='number' stroke='hsl(var(--chart-grid))' niceTicks='auto' />
          <YAxis 
            type='category' 
            dataKey='dimension' 
            width={120} 
            tick={({ x, y, payload }) => (
              <text x={x} y={y} dy={4} textAnchor='end'>{payload.value}</text>
            )} 
          />
          <Bar dataKey='metric' radius={[0, 4, 4, 0]} maxBarSize={28} fill='var(--chart-1)'>
            {showValueLabels && (
              <LabelList dataKey='metric' position='right' className='fill-muted-foreground' />
            )}
          </Bar>
        </BarChart>
      </ChartContainer>
    </div>
  );
}
```

### Pie/Donut Chart

```tsx
import { Pie, PieChart, Sector, Label } from 'recharts';

function PieChartDonut({ chartData, totalValue }: Props) {
  return (
    <ChartContainer config={{}}>
      <PieChart>
        <Pie 
          data={chartData} 
          dataKey='value' 
          nameKey='name' 
          cx='50%' 
          cy='50%' 
          innerRadius={80} 
          outerRadius={120} 
          paddingAngle={2}
        >
          <Label content={({ viewBox }) => (
            <text x={viewBox.cx} y={viewBox.cy} textAnchor='middle'>
              <tspan>{totalValue.toLocaleString()}</tspan>
              <tspan>Total</tspan>
            </text>
          )} />
        </Pie>
        <Tooltip content={<ChartTooltipContent />} />
      </PieChart>
    </ChartContainer>
  );
}
```

### Big Number (Auto-Resizing)

```tsx
function BigNumber({ value, label, format }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [fontSize, setFontSize] = useState('text-4xl');

  useEffect(() => {
    const resizeObserver = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const { width, height } = containerRef.current.getBoundingClientRect();
      const charWidth = 0.55; // approx for proportional fonts
      const textLength = value.toLocaleString().length;
      const estimatedWidth = textLength * charWidth * parseInt(fontSize);
      
      // Auto-select font size based on container
      if (estimatedWidth > width * 0.9 || height < 60) {
        setFontSize('text-2xl');
      } else {
        setFontSize('text-4xl');
      }
    });
    if (containerRef.current) resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, [value]);

  return (
    <div ref={containerRef} className='flex flex-col items-center justify-center'>
      <span className={cn(fontSize, 'font-bold tabular-nums')}>{value.toLocaleString()}</span>
      <span className='text-sm text-muted-foreground'>{label}</span>
    </div>
  );
}
```

---

## Interactive Patterns

### Interactive Legend (Click to Filter)

```tsx
function ChartWithLegend({ data, dimensions }: Props) {
  const [highlightedDimension, setHighlightedDimension] = useState<string | null>(null);

  const handleLegendClick = (dimension: string) => {
    setHighlightedDimension(prev => prev === dimension ? null : dimension);
  };

  return (
    <div>
      {/* Legend */}
      <div className='flex gap-4 mb-4'>
        {dimensions.map(dim => (
          <button
            key={dim}
            onClick={() => handleLegendClick(dim)}
            className={cn(isMuted && 'opacity-40')}
          >
            <div className='h-2 w-2 rounded-sm' style={{ backgroundColor: getColor(dim) }} />
            <span>{dim}</span>
          </button>
        ))}
      </div>

      {/* Chart */}
      <LineChart data={data}>
        {dimensions.map(dim => (
          <Line
            key={dim}
            type='monotone'
            dataKey={dim}
            stroke={getColor(dim)}
            strokeOpacity={isMuted ? 0.2 : 1}
          />
        ))}
      </LineChart>
    </div>
  );
}
```

### Active Reference Line on Hover

```tsx
import { ReferenceLine, useActiveTooltipLabel, useIsTooltipActive } from 'recharts';

function ActiveReferenceLine() {
  const activeLabel = useActiveTooltipLabel();
  const isTooltipActive = useIsTooltipActive();

  if (!isTooltipActive || activeLabel === undefined) return null;

  return (
    <ReferenceLine
      x={activeLabel}
      stroke='hsl(var(--border))'
      strokeDasharray='4 4'
      strokeOpacity={0.8}
    />
  );
}
```

---

## Theming (CSS Variables)

```css
/* Dashboard theme tokens */
:root {
  --background: 0 0% 100%;
  --foreground: 222 47% 11%;
  --card: 0 0% 100%;
  --card-foreground: 222 47% 11%;
  --chart-grid: 220 13% 91%;
  --chart-1: 220 90% 56%;
  --chart-2: 160 60% 45%;
  --chart-3: 30 80% 55%;
  --chart-4: 280 65% 60%;
  --chart-5: 340 75% 55%;
}

.dark {
  --background: 222 47% 8%;
  --foreground: 213 31% 91%;
  --card: 222 47% 11%;
  --chart-grid: 217 33% 20%;
}

/* Chart-specific */
[data-chart] {
  --chart-grid: hsl(var(--chart-grid));
  --chart-1: hsl(var(--chart-1));
}
```

---

## Design Principles

| Principle | Implementation |
|-----------|----------------|
| **Data-ink ratio** | Minimize chart junk, maximize data visibility |
| **Progressive disclosure** | Show summary first, details on hover/click |
| **Consistent colors** | Green = positive, red = negative |
| **Responsive** | Mobile: 1 col, Tablet: 2 col, Desktop: 3+ col |
| **Loading states** | Skeleton loaders, not spinners |
| **Empty states** | Meaningful feedback when no data |
| **Semantic animations** | 200-300ms ease-out for feedback |

## Chart Type Selection

| Data Type | Best Chart |
|-----------|-----------|
| Time series | Line, Area |
| Comparisons | Bar (vertical/horizontal) |
| Proportions | Pie, Donut (< 5 segments) |
| Distributions | Histogram, Bar |
| Correlations | Scatter |
| Flows/Processes | Sankey, Funnel |
| Geographic | Map, Heatmap |
| Multi-dimensional | Radar, Treemap |

## 3D / WebGL Dashboards

### Framework Selection

| Framework | Stars | Score | Best For |
|-----------|-------|-------|----------|
| Three.js | 113k | 9/10 | Gold standard WebGL |
| React-Three-Fiber | 31k | 9.5/10 | Best React+3D (zero overhead) |
| Babylon.js | 25.6k | 8/10 | Enterprise, batteries-included |
| deck.gl | 14.2k | 7.5/10 | Geo/Map dashboards ONLY |
| PixiJS | 47.3k | 6/10 | 2D WebGL only (NOT 3D) |
| Plotly.js 3D | 18.2k | 5.5/10 | Exploratory, heavy bundle |

### Three.js Setup (Vite + TypeScript)

```bash
npm install three @types/three
```

```tsx
// CanvasWrapper.tsx — Full-bleed 3D canvas
export function CanvasWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <div className='relative w-full h-full'>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: true }}
      >
        <color attach='background' args={['#0a0a0f']} />
        <ambientLight intensity={0.5} />
        <pointLight position={[10, 10, 10]} intensity={1} />
        {children}
      </Canvas>
    </div>
  );
}
```

### React-Three-Fiber: Animated Scatter Plot

```tsx
import { Canvas, useFrame } from '@react-three/fiber';
import { Float, Text, MeshTransmissionMaterial } from '@react-three/drei';

function DataPoint({ position, value }: { position: [number, number, number]; value: number }) {
  const ref = useRef<THREE.Mesh>(null);
  const scale = 0.1 + (value / 100) * 0.4;

  useFrame((state) => {
    if (!ref.current) return;
    ref.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + value) * 0.05;
  });

  return (
    <Float speed={2} rotationIntensity={0.5} floatIntensity={0.5}>
      <mesh ref={ref} position={position} scale={scale}>
        <sphereGeometry args={[1, 32, 32]} />
        <MeshTransmissionMaterial
          color={`hsl(${200 + value * 1.5}, 80%, 60%)`}
          roughness={0.1}
          transmission={0.9}
          thickness={1.5}
          chromaticAberration={0.06}
        />
      </mesh>
    </Float>
  );
}

function ScatterPlot3D({ data }: { data: Array<{ x: number; y: number; z: number; value: number }> }) {
  return (
    <CanvasWrapper>
      {data.map((d, i) => (
        <DataPoint
          key={i}
          position={[(d.x - 5) * 0.8, (d.y - 5) * 0.8, (d.z - 5) * 0.8]}
          value={d.value}
        />
      ))}
    </CanvasWrapper>
  );
}
```

### Three.js: Real-Time Line Chart (BufferGeometry)

```tsx
const MAX_POINTS = 500;

function ThreeLineChart({ data }: { data: number[] }) {
  const lineRef = useRef<THREE.Line>(null);

  useEffect(() => {
    if (!lineRef.current) return;
    const positions = new Float32Array(MAX_POINTS * 3);
    const colors = new Float32Array(MAX_POINTS * 3);

    data.forEach((value, i) => {
      positions[i * 3] = (i / MAX_POINTS) * 10 - 5;
      positions[i * 3 + 1] = value * 0.1;
      positions[i * 3 + 2] = 0;

      const t = value / 100;
      colors[i * 3] = 0.2 + t * 0.8;
      colors[i * 3 + 1] = 0.4;
      colors[i * 3 + 2] = 1;
    });

    lineRef.current.geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    lineRef.current.geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  }, [data]);

  return (
    <line ref={lineRef}>
      <bufferGeometry />
      <lineBasicMaterial vertexColors linewidth={2} />
    </line>
  );
}
```

### deck.gl: Geo Heatmap Dashboard

```tsx
import { DeckGL } from 'deck.gl';
import { HeatmapLayer } from '@deck.gl/aggregation-layers';

const geoLayer = new HeatmapLayer({
  id: 'heatmap',
  data: locationData,
  getPosition: d => [d.lng, d.lat],
  getWeight: d => d.intensity,
  radiusPixels: 60,
  colorRange: [
    [255, 255, 178],
    [254, 204, 92],
    [253, 141, 60],
    [240, 59, 32],
    [189, 0, 38],
  ],
});

<DeckGL initialViewState={VIEW_STATE} controller layers={[geoLayer]} />
```

### Post-Processing (Bloom + SSAO)

```bash
npm install @react-three/postprocessing three-stdlib
```

```tsx
import { EffectComposer, Bloom, SSAO, ChromaticAberration } from '@react-three/postprocessing';
import { BlendFunction } from 'postprocessing';

function Scene() {
  return (
    <>
      <SceneContent />
      <EffectComposer>
        <Bloom intensity={1.5} luminanceThreshold={0.8} mipmapBlur />
        <SSAO blendFunction={BlendFunction.MULTIPLY} samples={16} radius={0.1} />
        <ChromaticAberration offset={[0.0005, 0.0005]} />
      </EffectComposer>
    </>
  );
}
```

### 3D Dashboard Controls

```bash
npm install leva zustand
```

```tsx
import { useControls } from 'leva';

function DashboardControls() {
  const { speed, count, color } = useControls({
    speed: { value: 1, min: 0.1, max: 5 },
    count: { value: 50, min: 10, max: 500, step: 10 },
    color: '#00ff88',
  });
  return <ScatterPlot3D speed={speed} count={count} color={color} />;
}
```

---

## Real-Time Data Patterns

| Pattern | Score | Latency | Best For |
|---------|-------|---------|----------|
| WebSocket | 9/10 | <10ms | Bi-directional, live trading |
| SSE | 8/10 | <50ms | Monitoring, live feeds |
| Polling | 3/10 | 1-5s | Avoid unless necessary |

### SSE (Server-Sent Events) Pattern

```tsx
// useSSE.ts
export function useSSE(url: string, onMessage: (data: unknown) => void) {
  useEffect(() => {
    const es = new EventSource(url);
    es.onmessage = (e) => onMessage(JSON.parse(e.data));
    es.onerror = () => es.close();
    return () => es.close();
  }, [url, onMessage]);
}

// Component
function LiveMetrics() {
  const [data, setData] = useState<Metric[]>([]);

  useSSE('/api/metrics/stream', (newMetric) => {
    setData(prev => [...prev.slice(-99), newMetric]);
  });

  return <LineChartTimeSeries data={data} dataKey='value' />;
}
```

### WebSocket Pattern (Zustand Store)

```tsx
import { create } from 'zustand';

interface WSMessage {
  type: string;
  payload: unknown;
}

const useWebSocket = create<{
  data: Map<string, unknown>;
  connect: (url: string) => void;
}>((set) => ({
  data: new Map(),
  connect: (url) => {
    const ws = new WebSocket(url);
    ws.onmessage = (e) => {
      const msg: WSMessage = JSON.parse(e.data);
      set(state => {
        const newData = new Map(state.data);
        newData.set(msg.type, msg.payload);
        return { data: newData };
      });
    };
  },
}));

function TradingDashboard() {
  const { data, connect } = useWebSocket();
  useEffect(() => connect('wss://api.example/live'), []);

  return <LiveCandlestick data={data.get('candles') as Candle[]} />;
}
```

---

## Design Systems (Advanced)

### Glassmorphism (8/10 — Production Ready)

```css
.glass-card {
  background: rgba(255, 255, 255, 0.05);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
```

```tsx
function GlassCard({ children }: { children: React.ReactNode }) {
  return (
    <div className='glass-card p-6'>
      <div className='gradient-border-glow' />
      {children}
    </div>
  );
}
```

### Cyberpunk (7/10 — Production Ready)

```css
.cyberpunk-card {
  position: relative;
  background: linear-gradient(135deg, rgba(0, 255, 208, 0.1), rgba(255, 0, 128, 0.1));
  border: 1px solid rgba(0, 255, 208, 0.5);
  clip-path: polygon(0 0, 100% 0, 100% calc(100% - 16px), calc(100% - 16px) 100%, 0 100%);
}

.cyberpunk-card::before {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(90deg, transparent, rgba(0, 255, 208, 0.2), transparent);
  transform: translateX(-100%);
  animation: scanline 3s infinite;
}

@keyframes scanline {
  100% { transform: translateX(100%); }
}
```

### Brutalist (6/10 — Data Dense UIs)

```css
.brutalist-card {
  background: #fff;
  border: 3px solid #000;
  box-shadow: 6px 6px 0 #000;
  font-family: 'Space Mono', monospace;
}

.brutalist-card:hover {
  transform: translate(-3px, -3px);
  box-shadow: 9px 9px 0 #000;
}
```

### Neumorphism (4/10 — AVOID)

Low contrast, fails WCAG accessibility, dated aesthetic. Use glassmorphism instead.

---

## Resources

- shadcn/ui: https://ui.shadcn.com
- Recharts: https://recharts.org
- ECharts: https://echarts.apache.org
- D3.js: https://d3js.org
- Tremor (acquired by Vercel): https://tremor.so
- Grafana: https://grafana.com
- Apache Superset: https://superset.apache.org
- Three.js: https://threejs.org
- React-Three-Fiber: https://docs.pmnd.rs/react-three-fiber
- Babylon.js: https://babylonjs.com
- deck.gl: https://deck.gl
- @react-three/postprocessing: https://github.com/pmndrs/react-three-postprocessing
- Leva controls: https://leva.pmnd.rs
- Zustand: https://zustand-demo.pmnd.rs