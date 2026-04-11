<script setup lang="ts">
import { AreaChart as AreaChartIcon, ArrowRight, BarChart3, CircleDot, Crosshair, Filter, GitBranch, LayoutGrid, LineChart as LineChartIcon, MessageSquare, PencilRuler, PieChart as PieChartIcon, Radar as RadarIcon, Sun } from 'lucide-vue-next'

const routes = [
  {
    path: '/bar-charts',
    name: 'Bar Charts',
    description: 'Basic, horizontal, stacked, labels, interactive and more.',
    icon: BarChart3,
    count: 10,
  },
  {
    path: '/area',
    name: 'Area Charts',
    description: 'Default, linear, step, stacked, gradient, interactive and more.',
    icon: AreaChartIcon,
    count: 10,
  },
  {
    path: '/line-charts',
    name: 'Line Charts',
    description: 'Default, linear, step, dots, labels, legend, interactive and more.',
    icon: LineChartIcon,
    count: 10,
  },
  {
    path: '/pie-charts',
    name: 'Pie Charts',
    description: 'Simple, donut, labels, legend, stacked, interactive and more.',
    icon: PieChartIcon,
    count: 10,
  },
  {
    path: '/radar-charts',
    name: 'Radar Charts',
    description: 'Default, dots, multiple, grid variations, custom label, legend, radius and more.',
    icon: RadarIcon,
    count: 11,
  },
  {
    path: '/radial-charts',
    name: 'Radial Charts',
    description: 'Simple, grid, label, shape, stacked, text and more.',
    icon: CircleDot,
    count: 6,
  },
  {
    path: '/funnel-charts',
    name: 'Funnel Charts',
    description: 'Simple, label, custom colors, rectangle, reversed, legend and more.',
    icon: Filter,
    count: 6,
  },
  {
    path: '/reference-dot-charts',
    name: 'Reference Dot Charts',
    description: 'Basic, multiple, combined with ReferenceLine annotations.',
    icon: Crosshair,
    count: 3,
  },
  {
    path: '/customized-charts',
    name: 'Customized Charts',
    description: 'Render custom SVG elements using chart internal state.',
    icon: PencilRuler,
    count: 2,
  },
  {
    path: '/treemap-charts',
    name: 'Treemap Charts',
    description: 'Hierarchical data as nested rectangles, custom content, nest drill-down.',
    icon: LayoutGrid,
    count: 4,
  },
  {
    path: '/sankey-charts',
    name: 'Sankey Charts',
    description: 'Flow diagrams showing the magnitude of flow between nodes.',
    icon: GitBranch,
    count: 1,
  },
  {
    path: '/sunburst-charts',
    name: 'Sunburst Charts',
    description: 'Hierarchical data displayed as concentric ring sectors.',
    icon: Sun,
    count: 1,
  },
  {
    path: '/tooltip-charts',
    name: 'Tooltip Charts',
    description: 'Default, line indicator, no indicator, custom label, formatter, icons and advanced.',
    icon: MessageSquare,
    count: 9,
  },
]
</script>

<template>
  <div class="container py-10">
    <div class="mb-10 max-w-lg">
      <h1 class="text-3xl font-bold tracking-tight">
        Chart Playground
      </h1>
      <p class="mt-2 text-muted-foreground">
        Explore vccs chart components with live demos.
      </p>
    </div>

    <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <NuxtLink
        v-for="route in routes"
        :key="route.path"
        :to="route.path"
        class="group"
      >
        <Card class="h-full transition-colors hover:border-foreground/25">
          <CardHeader>
            <div class="flex items-center gap-3">
              <component
                :is="route.icon"
                class="size-5 shrink-0 text-muted-foreground"
              />
              <CardTitle class="text-lg">
                {{ route.name }}
              </CardTitle>
              <span class="ml-auto rounded-md bg-muted px-2 py-0.5 text-xs tabular-nums text-muted-foreground">
                {{ route.count }}
              </span>
            </div>
            <CardDescription class="mt-2">
              {{ route.description }}
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <span class="inline-flex items-center gap-1.5 text-sm font-medium group-hover:gap-2.5 transition-all duration-200">
              View demos
              <ArrowRight class="size-3.5" />
            </span>
          </CardFooter>
        </Card>
      </NuxtLink>
    </div>
  </div>
</template>
