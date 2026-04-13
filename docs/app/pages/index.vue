<script setup lang="ts">
import { type Component, computed, defineAsyncComponent, defineComponent, h, onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { AnimatePresence, LayoutGroup, motion } from 'motion-v'
import { useColorMode } from '#imports'

useSeoMeta({
  title: 'vccs — Vue 3 Charting Components',
  description: 'Composable charting components for Vue 3, ported from Recharts',
})

const ChartError = defineComponent({ render: () => null })
const ChartLoading = defineComponent({
  render: () => h('div', { style: { height: '300px' } }),
})

function asyncChart(loader: () => Promise<any>) {
  return defineAsyncComponent({ loader, loadingComponent: ChartLoading, delay: 0, errorComponent: ChartError, timeout: 10000 })
}

interface ChartEntry {
  component: ReturnType<typeof asyncChart>
  title: string
  desc: string
  category: string
  trend: string
  trendUp: boolean
}

const allCharts: ChartEntry[] = [
  // Bar charts
  { component: asyncChart(() => import('~/charts/bar-charts/simple-bar-chart.vue')), title: 'Bar Chart', desc: 'January - June 2024', category: 'bar', trend: '+5.2%', trendUp: true },
  { component: asyncChart(() => import('~/charts/bar-charts/stacked-bar-chart.vue')), title: 'Stacked Bar', desc: 'January - June 2024', category: 'bar', trend: '+12.1%', trendUp: true },
  { component: asyncChart(() => import('~/charts/bar-charts/label-bar-chart.vue')), title: 'Label Bar', desc: 'January - June 2024', category: 'bar', trend: '+8.4%', trendUp: true },
  { component: asyncChart(() => import('~/charts/bar-charts/negative-bar-chart.vue')), title: 'Negative Bar', desc: 'January - June 2024', category: 'bar', trend: '-3.1%', trendUp: false },
  { component: asyncChart(() => import('~/charts/bar-charts/horizontal-bar-chart.vue')), title: 'Horizontal Bar', desc: 'Page views ranking', category: 'bar', trend: '+2.7%', trendUp: true },
  // Area charts
  { component: asyncChart(() => import('~/charts/area-charts/simple-area-chart.vue')), title: 'Area Chart', desc: 'January - June 2024', category: 'area', trend: '+7.3%', trendUp: true },
  { component: asyncChart(() => import('~/charts/area-charts/gradient-area-chart.vue')), title: 'Gradient Area', desc: 'January - June 2024', category: 'area', trend: '+15.2%', trendUp: true },
  { component: asyncChart(() => import('~/charts/area-charts/stacked-area-chart.vue')), title: 'Stacked Area', desc: 'January - June 2024', category: 'area', trend: '+9.8%', trendUp: true },
  { component: asyncChart(() => import('~/charts/area-charts/step-area-chart.vue')), title: 'Step Area', desc: 'January - June 2024', category: 'area', trend: '-2.4%', trendUp: false },
  { component: asyncChart(() => import('~/charts/area-charts/legend-area-chart.vue')), title: 'Legend Area', desc: 'January - June 2024', category: 'area', trend: '+4.6%', trendUp: true },
  // Line charts
  { component: asyncChart(() => import('~/charts/line-charts/simple-line-chart.vue')), title: 'Line Chart', desc: 'January - June 2024', category: 'line', trend: '+6.1%', trendUp: true },
  { component: asyncChart(() => import('~/charts/line-charts/multi-line-chart.vue')), title: 'Multi Line', desc: 'January - June 2024', category: 'line', trend: '+3.5%', trendUp: true },
  { component: asyncChart(() => import('~/charts/line-charts/dashed-line-chart.vue')), title: 'Dashed Line', desc: 'January - June 2024', category: 'line', trend: '-5.2%', trendUp: false },
  { component: asyncChart(() => import('~/charts/line-charts/step-line-chart.vue')), title: 'Step Line', desc: 'January - June 2024', category: 'line', trend: '+1.8%', trendUp: true },
  { component: asyncChart(() => import('~/charts/line-charts/dots-line-chart.vue')), title: 'Dots Line', desc: 'January - June 2024', category: 'line', trend: '+11.3%', trendUp: true },
  // Pie charts
  { component: asyncChart(() => import('~/charts/pie-charts/simple-pie-chart.vue')), title: 'Pie Chart', desc: 'Browser market share', category: 'pie', trend: '+2.1%', trendUp: true },
  { component: asyncChart(() => import('~/charts/pie-charts/donut-pie-chart.vue')), title: 'Donut Chart', desc: 'Budget allocation', category: 'pie', trend: '+4.5%', trendUp: true },
  { component: asyncChart(() => import('~/charts/pie-charts/half-pie-chart.vue')), title: 'Half Pie', desc: 'Market share', category: 'pie', trend: '-1.3%', trendUp: false },
  { component: asyncChart(() => import('~/charts/pie-charts/label-pie-chart.vue')), title: 'Label Pie', desc: 'Segment details', category: 'pie', trend: '+6.7%', trendUp: true },
  // Radar charts
  { component: asyncChart(() => import('~/charts/radar-charts/simple-radar-chart.vue')), title: 'Radar', desc: 'Skill assessment', category: 'radar', trend: '+8.2%', trendUp: true },
  { component: asyncChart(() => import('~/charts/radar-charts/dots-radar-chart.vue')), title: 'Radar Dots', desc: 'Performance metrics', category: 'radar', trend: '+3.9%', trendUp: true },
  { component: asyncChart(() => import('~/charts/radar-charts/circle-grid-radar-chart.vue')), title: 'Circle Radar', desc: 'Comparative scores', category: 'radar', trend: '-2.8%', trendUp: false },
  { component: asyncChart(() => import('~/charts/radar-charts/multiple-radar-chart.vue')), title: 'Multi Radar', desc: 'Team comparison', category: 'radar', trend: '+5.4%', trendUp: true },
  // Radial charts
  { component: asyncChart(() => import('~/charts/radial-charts/simple-radial-chart.vue')), title: 'Radial Chart', desc: 'Goal completion', category: 'radial', trend: '+12.5%', trendUp: true },
  { component: asyncChart(() => import('~/charts/radial-charts/stacked-radial-chart.vue')), title: 'Stacked Radial', desc: 'Progress tracking', category: 'radial', trend: '+7.1%', trendUp: true },
  { component: asyncChart(() => import('~/charts/radial-charts/label-radial-chart.vue')), title: 'Label Radial', desc: 'KPI dashboard', category: 'radial', trend: '+9.3%', trendUp: true },
  // Scatter / Composed
  { component: asyncChart(() => import('~/charts/scatter-charts/simple-scatter-chart.vue')), title: 'Scatter Plot', desc: 'Correlation analysis', category: 'bar', trend: '+4.2%', trendUp: true },
  { component: asyncChart(() => import('~/charts/composed-charts/simple-composed-chart.vue')), title: 'Composed Chart', desc: 'January - June 2024', category: 'area', trend: '+6.8%', trendUp: true },
]

// ─── Category tab switching ───
const activeCategory = ref('bar')

const categories = [
  { label: 'Bar Charts', key: 'bar' },
  { label: 'Area Charts', key: 'area' },
  { label: 'Line Charts', key: 'line' },
  { label: 'Pie Charts', key: 'pie' },
  { label: 'Radar Charts', key: 'radar' },
  { label: 'Radial Charts', key: 'radial' },
]

// 2D grid offsets — categories arranged in a 3×2 layout, animate X+Y to pan
const categoryOffsets: Record<string, { x: number, y: number }> = {
  bar: { x: 0, y: -100 },
  area: { x: -760, y: -100 },
  line: { x: -1520, y: -100 },
  pie: { x: 0, y: -950 },
  radar: { x: -760, y: -950 },
  radial: { x: -1520, y: -950 },
}

const gridOffset = computed(() => categoryOffsets[activeCategory.value] ?? categoryOffsets.bar)

// ─── Featured chart (preload + shallowRef = no flicker) ───
const featuredLoaders: Record<string, () => Promise<any>> = {
  bar: () => import('~/charts/bar-charts/simple-bar-chart.vue'),
  area: () => import('~/charts/area-charts/gradient-area-chart.vue'),
  line: () => import('~/charts/line-charts/simple-line-chart.vue'),
  pie: () => import('~/charts/pie-charts/donut-pie-chart.vue'),
  radar: () => import('~/charts/radar-charts/simple-radar-chart.vue'),
  radial: () => import('~/charts/radial-charts/simple-radial-chart.vue'),
}

const featuredMeta: Record<string, { title: string, desc: string, trend: string, trendUp: boolean }> = {
  bar: { title: 'Bar Chart', desc: 'January - June 2024', trend: '+5.2%', trendUp: true },
  area: { title: 'Gradient Area', desc: 'January - June 2024', trend: '+15.2%', trendUp: true },
  line: { title: 'Line Chart', desc: 'January - June 2024', trend: '+6.1%', trendUp: true },
  pie: { title: 'Donut Chart', desc: 'Budget allocation', trend: '+4.5%', trendUp: true },
  radar: { title: 'Radar', desc: 'Skill assessment', trend: '+8.2%', trendUp: true },
  radial: { title: 'Radial Chart', desc: 'Goal completion', trend: '+12.5%', trendUp: true },
}

const featuredComponent = shallowRef<Component | null>(null)
const featuredInfo = computed(() => featuredMeta[activeCategory.value] ?? featuredMeta.bar)

async function switchCategory(key: string) {
  if (key === activeCategory.value)
    return
  const mod = await featuredLoaders[key]?.()
  featuredComponent.value = mod.default
  activeCategory.value = key
}

onMounted(async () => {
  const mod = await featuredLoaders.bar?.()
  featuredComponent.value = mod.default
})

// Group charts by category, each group gets 2 columns arranged in a 3×2 macro grid
const categoryLayout: Record<string, { col: number, row: number }> = {
  bar: { col: 0, row: 0 },
  area: { col: 1, row: 0 },
  line: { col: 2, row: 0 },
  pie: { col: 0, row: 1 },
  radar: { col: 1, row: 1 },
  radial: { col: 2, row: 1 },
}

const categoryGroups = computed(() => {
  return categories.map((cat) => {
    const charts = allCharts.filter(c => c.category === cat.key)
    const col1 = charts.filter((_, i) => i % 2 === 0)
    const col2 = charts.filter((_, i) => i % 2 === 1)
    const layout = categoryLayout[cat.key]
    return { key: cat.key, col1, col2, gridCol: layout.col + 1, gridRow: layout.row + 1 }
  })
})

// ─── Install copy ───
const installCopied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined

function copyInstall() {
  const text = 'npm install vccs'
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text)
  }
  else {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  installCopied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { installCopied.value = false }, 2000)
}

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
})

// ─── Dot grid colors (canvas can't read CSS vars) ───
const colorMode = useColorMode()
const dotBaseColor = computed(() => colorMode.value === 'dark' ? '#404040' : '#c0c0c0')
const dotActiveColor = computed(() => '#f97316')

// ─── Hero stagger animation ───
const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1, delayChildren: 0.15 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 40, filter: 'blur(4px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: { type: 'spring', stiffness: 120, damping: 20 },
  },
}

// ─── Scroll to showcase ───
function scrollToShowcase() {
  document.getElementById('showcase')?.scrollIntoView({ behavior: 'smooth' })
}
</script>

<template>
  <div>
    <!-- ═══════════ Section 1: Full-screen Hero ═══════════ -->
    <section class="landing-hero">
      <!-- Interactive dot grid background (vue-bits inspired, motion-v powered) -->
      <ClientOnly>
        <DotGrid
          class="landing-hero-dotgrid"
          :dot-size="5"
          :gap="28"
          :base-color="dotBaseColor"
          :active-color="dotActiveColor"
          :proximity="150"
          :speed-trigger="80"
          :shock-radius="250"
          :shock-strength="5"
        />
      </ClientOnly>

      <!-- Floating glow orbs — prime-number durations for organic drift -->
      <motion.div
        class="hero-glow hero-glow-orange"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1, x: [0, 60, -40, 20, 0], y: [0, -30, 50, -20, 0] }"
        :transition="{ opacity: { duration: 1.2, ease: 'easeOut' }, x: { duration: 23, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 19, repeat: Infinity, ease: 'easeInOut' } }"
      />
      <motion.div
        class="hero-glow hero-glow-teal"
        :initial="{ opacity: 0 }"
        :animate="{ opacity: 1, x: [0, -50, 30, -60, 0], y: [0, 40, -30, 50, 0] }"
        :transition="{ opacity: { duration: 1.4, ease: 'easeOut', delay: 0.2 }, x: { duration: 17, repeat: Infinity, ease: 'easeInOut' }, y: { duration: 29, repeat: Infinity, ease: 'easeInOut' } }"
      />

      <!-- Staggered hero content -->
      <motion.div
        class="landing-hero-inner"
        :variants="containerVariants"
        initial="hidden"
        animate="visible"
      >
        <!-- Install snippet -->
        <motion.div :variants="itemVariants">
          <div
            class="landing-install"
            @click="copyInstall"
          >
            <span class="landing-install-dollar">$</span>
            <code class="landing-install-text">npm install vccs</code>
            <button
              class="landing-install-copy"
              :aria-label="installCopied ? 'Copied' : 'Copy install command'"
            >
              <UIcon
                :name="installCopied ? 'i-lucide-check' : 'i-lucide-copy'"
                class="landing-install-icon"
              />
            </button>
          </div>
        </motion.div>

        <!-- Title -->
        <motion.h1
          :variants="itemVariants"
          class="landing-title"
        >
          <span class="landing-title-name">vccs</span>
          <span class="landing-title-version">v0.1</span>
        </motion.h1>

        <!-- Tagline -->
        <motion.div :variants="itemVariants">
          <p class="landing-tagline">
            Composable charting components for Vue 3.
          </p>
          <p class="landing-sub">
            An unofficial port of
            <a
              href="https://recharts.org"
              target="_blank"
              rel="noopener"
            >Recharts</a>
          </p>
        </motion.div>

        <!-- CTA buttons -->
        <motion.div
          :variants="itemVariants"
          class="landing-actions"
        >
          <UButton
            size="xl"
            variant="solid"
            color="neutral"
            to="/getting-started/introduction"
            trailing-icon="i-lucide-arrow-right"
          >
            Get Started
          </UButton>
          <UButton
            size="xl"
            variant="outline"
            color="neutral"
            icon="i-simple-icons-github"
            to="https://github.com/nicepkg/vccs"
            target="_blank"
          >
            GitHub
          </UButton>
        </motion.div>

        <!-- Feature pills -->
        <motion.div
          :variants="itemVariants"
          class="landing-features"
        >
          <span class="landing-pill">Vue 3</span>
          <span class="landing-pill">TypeScript</span>
          <span class="landing-pill">Composable</span>
          <span class="landing-pill">Animated</span>
        </motion.div>
      </motion.div>

      <!-- Scroll indicator -->
      <button
        class="landing-scroll"
        aria-label="Scroll to chart showcase"
        @click="scrollToShowcase"
      >
        <motion.div
          :animate="{ y: [0, 8, 0] }"
          :transition="{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }"
        >
          <UIcon
            name="i-lucide-chevron-down"
            class="landing-scroll-icon"
          />
        </motion.div>
      </button>
    </section>

    <!-- ═══════════ Section 2: Chart Showcase (evilcharts-style) ═══════════ -->
    <section
      id="showcase"
      class="showcase"
    >
      <!-- Showcase content (left side) -->
      <div class="showcase-content">
        <h2 class="showcase-heading">
          Explore Charts
        </h2>
        <p class="showcase-desc">
          30+ chart variants across 7 categories.
        </p>

        <!-- Category tabs — chevron prefix with shared layout animation -->
        <nav class="showcase-categories">
          <ClientOnly>
            <LayoutGroup>
              <button
                v-for="cat in categories"
                :key="cat.key"
                class="showcase-category"
                :class="{ 'showcase-category-active': activeCategory === cat.key }"
                @click="switchCategory(cat.key)"
              >
                <span class="showcase-category-chevron">
                  <motion.div
                    v-if="activeCategory === cat.key"
                    layout-id="category-chevron"
                    class="showcase-category-chevron-icon"
                  >
                    <UIcon name="i-lucide-chevron-right" />
                  </motion.div>
                </span>
                <span>{{ cat.label }}</span>
              </button>
            </LayoutGroup>
          </ClientOnly>
        </nav>
      </div>

      <!-- Chart area (right side) -->
      <div class="showcase-charts">
        <!-- Left fade gradient -->
        <div class="showcase-charts-fade" />

        <!-- Background chart grid — 2D pan with spring animation -->
        <motion.div
          class="chart-grid"
          :animate="{ x: gridOffset.x, y: gridOffset.y }"
          :transition="{ type: 'spring', stiffness: 75, damping: 25 }"
          :style="{ willChange: 'transform' }"
        >
          <div
            v-for="group in categoryGroups"
            :key="group.key"
            class="chart-category-block"
            :style="{ gridColumn: group.gridCol, gridRow: group.gridRow }"
          >
            <div class="chart-block-cols">
              <div class="chart-col">
                <div
                  v-for="(chart, i) in group.col1"
                  :key="`${group.key}-0-${i}`"
                  class="chart-cell"
                >
                  <div class="chart-cell-header">
                    <div class="chart-cell-title-row">
                      <div class="chart-cell-title">
                        {{ chart.title }}
                      </div>
                      <div
                        class="chart-cell-trend"
                        :class="chart.trendUp ? 'trend-up' : 'trend-down'"
                      >
                        <span class="trend-arrow">{{ chart.trendUp ? '↗' : '↘' }}</span>
                        {{ chart.trend }}
                      </div>
                    </div>
                    <div class="chart-cell-desc">
                      {{ chart.desc }}
                    </div>
                  </div>
                  <div class="chart-cell-body">
                    <component :is="chart.component" />
                  </div>
                </div>
              </div>
              <div class="chart-col chart-col-offset">
                <div
                  v-for="(chart, i) in group.col2"
                  :key="`${group.key}-1-${i}`"
                  class="chart-cell"
                >
                  <div class="chart-cell-header">
                    <div class="chart-cell-title-row">
                      <div class="chart-cell-title">
                        {{ chart.title }}
                      </div>
                      <div
                        class="chart-cell-trend"
                        :class="chart.trendUp ? 'trend-up' : 'trend-down'"
                      >
                        <span class="trend-arrow">{{ chart.trendUp ? '↗' : '↘' }}</span>
                        {{ chart.trend }}
                      </div>
                    </div>
                    <div class="chart-cell-desc">
                      {{ chart.desc }}
                    </div>
                  </div>
                  <div class="chart-cell-body">
                    <component :is="chart.component" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <!-- Featured card — elevated at z-10 like evilcharts -->
        <div class="featured-card">
          <AnimatePresence mode="wait">
            <motion.div
              v-if="featuredComponent"
              :key="activeCategory"
              class="featured-card-inner"
              :initial="{ opacity: 0, scale: 0.95 }"
              :animate="{ opacity: 1, scale: 1 }"
              :exit="{ opacity: 0, scale: 0.95 }"
              :transition="{ duration: 0.3, ease: 'easeOut' }"
            >
              <div class="featured-card-header">
                <div class="featured-card-title-row">
                  <div class="featured-card-title">
                    {{ featuredInfo.title }}
                  </div>
                  <div
                    class="featured-card-trend"
                    :class="featuredInfo.trendUp ? 'trend-up' : 'trend-down'"
                  >
                    <span class="trend-arrow">{{ featuredInfo.trendUp ? '↗' : '↘' }}</span>
                    {{ featuredInfo.trend }}
                  </div>
                </div>
                <div class="featured-card-desc">
                  {{ featuredInfo.desc }}
                </div>
              </div>
              <div class="featured-card-body">
                <component :is="featuredComponent" />
              </div>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ─── Scroll-snap on Docus page scroll container ─── */
:global(html) {
  scroll-snap-type: y mandatory;
}

/* ═══════════════════════════════════════════════════════
   Section 1: Full-screen Landing Hero
   ═══════════════════════════════════════════════════════ */
.landing-hero {
  scroll-snap-align: start;
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
  background: var(--ui-bg);
}

/* Interactive dot grid background */
.landing-hero-dotgrid {
  position: absolute;
  inset: 0;
  pointer-events: auto;
  z-index: 0;
}

/* Floating glow orbs */
.hero-glow {
  position: absolute;
  border-radius: 50%;
  filter: blur(10px);
  pointer-events: none;
  z-index: 0;
}

.hero-glow-orange {
  top: 35%;
  left: 45%;
  width: 500px;
  height: 300px;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, var(--glow-orange, rgba(249, 115, 22, 0.12)) 0%, transparent 70%);
}

.hero-glow-teal {
  top: 20%;
  left: 30%;
  width: 400px;
  height: 250px;
  transform: translate(-50%, -50%);
  background: radial-gradient(ellipse at center, var(--glow-teal, rgba(16, 185, 129, 0.10)) 0%, transparent 70%);
}

.landing-hero-inner {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 2rem;
  max-width: 48rem;
}

/* Install snippet */
.landing-install {
  display: inline-flex;
  align-items: center;
  gap: 0.75rem;
  padding: 0.625rem 1.25rem;
  background: var(--ui-bg-elevated);
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  cursor: pointer;
  margin-bottom: 2.5rem;
  transition: background 0.15s, border-color 0.15s;
}

.landing-install:hover {
  background: var(--ui-bg-accented);
  border-color: var(--ui-text-dimmed);
}

.landing-install-dollar {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.875rem;
  color: var(--ui-text-dimmed);
  user-select: none;
}

.landing-install-text {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.875rem;
  color: var(--ui-text-muted);
  user-select: all;
}

.landing-install-copy {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 1.25rem;
  height: 1.25rem;
  border: none;
  background: none;
  cursor: pointer;
  padding: 0;
  color: var(--ui-text-dimmed);
  transition: color 0.15s;
}

.landing-install-copy:hover {
  color: var(--ui-text);
}

.landing-install-icon {
  font-size: 0.8125rem;
}

/* Title */
.landing-title {
  margin: 0 0 1.5rem;
  line-height: 1;
}

.landing-title-name {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: clamp(4rem, 12vw, 8rem);
  font-weight: 800;
  letter-spacing: -0.05em;
  color: var(--ui-text-highlighted);
}

.landing-title-version {
  font-size: 1.125rem;
  font-weight: 400;
  color: var(--ui-text-dimmed);
  margin-left: 0.75rem;
  vertical-align: middle;
}

/* Tagline */
.landing-tagline {
  font-size: clamp(1.25rem, 3vw, 1.75rem);
  font-weight: 500;
  color: var(--ui-text);
  margin: 0 0 0.75rem;
  line-height: 1.4;
}

.landing-sub {
  font-size: clamp(0.9375rem, 2vw, 1.0625rem);
  color: var(--ui-text-muted);
  margin: 0 0 2.5rem;
  line-height: 1.6;
  max-width: 32rem;
}

.landing-sub a {
  color: var(--ui-text);
  text-decoration: underline;
  text-underline-offset: 3px;
  transition: color 0.15s;
}

.landing-sub a:hover {
  color: var(--ui-text-highlighted);
}

/* CTA buttons */
.landing-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
  justify-content: center;
  margin-bottom: 2.5rem;
}

/* Feature pills */
.landing-features {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
  justify-content: center;
}

.landing-pill {
  font-size: 0.75rem;
  font-weight: 500;
  color: var(--ui-text-muted);
  padding: 0.25rem 0.75rem;
  border: 1px solid var(--ui-border);
  border-radius: 9999px;
  background: var(--ui-bg-elevated);
}

/* Scroll indicator */
.landing-scroll {
  position: absolute;
  bottom: 2rem;
  left: 50%;
  transform: translateX(-50%);
  z-index: 1;
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: var(--ui-text-dimmed);
  transition: color 0.15s;
}

.landing-scroll:hover {
  color: var(--ui-text);
}

.landing-scroll-icon {
  font-size: 1.5rem;
}

/* ═══════════════════════════════════════════════════════
   Section 2: Chart Showcase (evilcharts-style)
   ═══════════════════════════════════════════════════════ */
.showcase {
  scroll-snap-align: start;
  position: relative;
  display: flex;
  height: calc(100vh - 64px);
  height: calc(100dvh - 64px);
  overflow: hidden;
  background: var(--ui-bg);
}

/* ─── Showcase content — left side ─── */
.showcase-content {
  position: relative;
  z-index: 10;
  width: 40%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  padding: 4rem 3rem 4rem 10rem;
  gap: 0;
}

.showcase-heading {
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: clamp(2rem, 5vw, 3rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  color: var(--ui-text-highlighted);
  margin: 0 0 0.75rem;
  line-height: 1.1;
}

.showcase-desc {
  font-size: clamp(0.9375rem, 2vw, 1.0625rem);
  color: var(--ui-text-muted);
  margin: 0 0 2rem;
  line-height: 1.6;
  max-width: 24rem;
}

/* Category tabs — chevron prefix like evilcharts */
.showcase-categories {
  display: flex;
  flex-direction: column;
  gap: 0.125rem;
}

.showcase-category {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 0;
  color: var(--ui-text-dimmed);
  font-family: ui-monospace, SFMono-Regular, 'SF Mono', Menlo, Consolas, 'Liberation Mono', monospace;
  font-size: 0.875rem;
  text-decoration: none;
  transition: color 0.15s;
  cursor: pointer;
  background: none;
  border: none;
  text-align: left;
}

.showcase-category-active {
  color: var(--ui-text-highlighted);
  font-weight: 600;
}

.showcase-category:hover {
  color: var(--ui-text-highlighted);
}

.showcase-category-chevron {
  width: 1rem;
  height: 1rem;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  position: relative;
}

.showcase-category-chevron-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1rem;
  color: var(--ui-text-highlighted);
}

/* ─── Chart area (right side) ─── */
.showcase-charts {
  position: absolute;
  top: 0;
  right: 0;
  width: 55%;
  height: 100%;
  overflow: hidden;
}

/* Left fade gradient */
.showcase-charts-fade {
  position: absolute;
  top: 0;
  left: 0;
  width: 150px;
  height: 100%;
  background: linear-gradient(to right, var(--ui-bg), transparent);
  z-index: 15;
  pointer-events: none;
}

/* Grid — 3×2 macro grid of category blocks */
.chart-grid {
  display: grid;
  grid-template-columns: repeat(3, auto);
  grid-template-rows: repeat(2, auto);
  gap: 2rem;
  padding: 5rem 2.5rem;
  user-select: none;
}

.chart-category-block {
  /* Each category block */
}

.chart-block-cols {
  display: flex;
  gap: 1rem;
}

.chart-col {
  flex-shrink: 0;
  width: 22rem;
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.chart-col-offset {
  margin-top: 4.5rem;
}

/* Chart card — background grid cards (more faded for depth like evilcharts) */
.chart-cell {
  width: 100%;
  overflow: hidden;
  border-radius: 0.75rem;
  border: 1px solid var(--cell-border, rgba(0, 0, 0, 0.03));
  background: var(--cell-bg, rgba(255, 255, 255, 0.15));
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.01);
  opacity: var(--cell-opacity, 0.65);
}

.chart-cell-header {
  padding: 1rem 1.25rem 0;
}

.chart-cell-title {
  font-size: 0.8125rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  line-height: 1.4;
}

.chart-cell-desc {
  font-size: 0.6875rem;
  color: var(--ui-text-dimmed);
  margin-top: 0.125rem;
}

.chart-cell-body {
  flex: 1;
  padding: 0.5rem 0.5rem 0.75rem;
}

/* Chart style overrides */
.chart-cell-body :deep(.v-charts-cartesian-axis-tick text) {
  fill: var(--ui-text-dimmed);
  font-size: 0.625rem;
}

.chart-cell-body :deep(.v-charts-cartesian-grid line) {
  stroke: var(--ui-border);
  opacity: 0.5;
}

/* ─── Featured card — elevated, z-10, centered in chart area ─── */
.featured-card {
  position: absolute;
  z-index: 10;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 26rem;
  background: var(--ui-bg-elevated);
  border-radius: 1rem;
  border: 1px solid var(--ui-border);
  box-shadow: var(--featured-shadow, 0 4px 6px -1px rgba(0, 0, 0, 0.08), 0 10px 15px -3px rgba(0, 0, 0, 0.12), 0 20px 40px -4px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.02));
  overflow: visible;
}

/* Large frosted glow behind featured card */
.featured-card::before {
  content: '';
  position: absolute;
  z-index: -1;
  top: -100%;
  left: -80%;
  width: 260%;
  height: 300%;
  background: var(--featured-glow, radial-gradient(ellipse at center, rgba(250, 250, 250, 0.95) 0%, rgba(250, 250, 250, 0.85) 30%, rgba(250, 250, 250, 0.5) 55%, rgba(250, 250, 250, 0) 75%));
  pointer-events: none;
}

.featured-card-header {
  padding: 1.25rem 1.5rem 0;
}

.featured-card-title {
  font-size: 1rem;
  font-weight: 600;
  color: var(--ui-text-highlighted);
  line-height: 1.4;
}

.featured-card-desc {
  font-size: 0.8125rem;
  color: var(--ui-text-dimmed);
  margin-top: 0.25rem;
}

.featured-card-body {
  padding: 0.75rem 0.75rem 1rem;
}

.featured-card-body :deep(.v-charts-cartesian-axis-tick text) {
  fill: var(--ui-text-dimmed);
  font-size: 0.6875rem;
}

.featured-card-body :deep(.v-charts-cartesian-grid line) {
  stroke: var(--ui-border);
  opacity: 0.5;
}

/* ─── Title row with trend badge ─── */
.chart-cell-title-row,
.featured-card-title-row {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.chart-cell-trend,
.featured-card-trend {
  font-size: 0.6875rem;
  font-weight: 500;
  padding: 0.125rem 0.5rem;
  border-radius: 9999px;
  display: inline-flex;
  align-items: center;
  gap: 0.125rem;
  white-space: nowrap;
}

.featured-card-trend {
  font-size: 0.75rem;
  padding: 0.1875rem 0.625rem;
}

.trend-up {
  background: var(--trend-up-bg, #dcfce7);
  color: var(--trend-up-color, #16a34a);
}

.trend-down {
  background: var(--trend-down-bg, #fee2e2);
  color: var(--trend-down-color, #ef4444);
}

.trend-arrow {
  font-size: 0.75em;
}

.featured-card-inner {
  width: 100%;
  overflow: hidden;
  border-radius: 1rem;
}

/* ═══════════════════════════════════════════════════════
   Responsive
   ═══════════════════════════════════════════════════════ */
@media (max-width: 768px) {
  .landing-hero-inner {
    padding: 2rem 1.5rem;
  }

  .landing-title-name {
    font-size: 4rem;
  }

  .showcase {
    flex-direction: column;
    min-height: auto;
  }

  .showcase-content {
    width: 100%;
    padding: 3rem 2rem 2rem;
    text-align: center;
    align-items: center;
  }

  .showcase-categories {
    align-items: center;
  }

  .showcase-charts {
    position: relative;
    width: 100%;
    height: 400px;
  }

  .showcase-charts-fade {
    display: none;
  }

  .featured-card {
    width: 80%;
    max-width: 20rem;
  }
}

@media (prefers-reduced-motion: reduce) {
  .chart-grid {
    transform: translateY(-850px) !important;
  }
  .hero-glow {
    animation: none !important;
    transition: none !important;
  }
  .landing-scroll,
  .landing-scroll-icon {
    animation: none !important;
    transition: none !important;
  }
  .landing-hero-inner,
  .landing-hero-inner * {
    animation: none !important;
    transition: none !important;
    opacity: 1 !important;
    transform: none !important;
    filter: none !important;
  }
}
</style>

<!-- Unscoped dark mode overrides — :global(.dark) in scoped <style> is stripped by Nuxt/Vite -->
<style>
.dark .hero-glow-orange {
  --glow-orange: rgba(249, 115, 22, 0.08);
}

.dark .hero-glow-teal {
  --glow-teal: rgba(16, 185, 129, 0.06);
}

.dark .chart-cell {
  --cell-bg: rgba(255, 255, 255, 0.03);
  --cell-border: rgba(255, 255, 255, 0.04);
  --cell-opacity: 0.5;
}

.dark .featured-card {
  --featured-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.2), 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 20px 40px -4px rgba(0, 0, 0, 0.2);
  --featured-glow: radial-gradient(ellipse at center, rgba(15, 15, 15, 0.97) 0%, rgba(15, 15, 15, 0.85) 30%, rgba(15, 15, 15, 0.5) 55%, rgba(15, 15, 15, 0) 75%);
}

.dark .trend-up {
  --trend-up-bg: rgba(22, 163, 74, 0.15);
  --trend-up-color: #4ade80;
}

.dark .trend-down {
  --trend-down-bg: rgba(239, 68, 68, 0.15);
  --trend-down-color: #f87171;
}
</style>
