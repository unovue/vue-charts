<script setup lang="ts">
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis } from 'vccs'
import { useReducedMotion } from 'motion-v'

// Living chart hero background — a real vccs chart with slowly streaming
// random-walk data. The background IS the product demo.
// Reduced motion: static data, no interval, no animation.

const reduced = useReducedMotion()

const POINTS = 48
const UPDATE_MS = 2200

function walk(prev: number) {
  return Math.min(88, Math.max(18, prev + (Math.random() * 12 - 6)))
}

function makeSeries() {
  let a = 55
  let b = 42
  return Array.from({ length: POINTS }, (_, i) => {
    a = walk(a)
    b = walk(b)
    return { i, a, b }
  })
}

const data = ref(makeSeries())
let timer: ReturnType<typeof setInterval> | undefined

onMounted(() => {
  if (reduced.value)
    return
  timer = setInterval(() => {
    const last = data.value[data.value.length - 1]!
    data.value = [...data.value.slice(1), { i: last.i + 1, a: walk(last.a), b: walk(last.b) }]
  }, UPDATE_MS)
})

onBeforeUnmount(() => clearInterval(timer))
</script>

<template>
  <div
    class="hero-chart-bg"
    aria-hidden="true"
  >
    <ResponsiveContainer
      width="100%"
      height="100%"
    >
      <AreaChart
        :data="data"
        :margin="{ top: 0, right: 0, bottom: 0, left: 0 }"
      >
        <defs>
          <linearGradient
            id="heroBgA"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stop-color="#f97316"
              stop-opacity="0.35"
            />
            <stop
              offset="95%"
              stop-color="#f97316"
              stop-opacity="0"
            />
          </linearGradient>
          <linearGradient
            id="heroBgB"
            x1="0"
            y1="0"
            x2="0"
            y2="1"
          >
            <stop
              offset="5%"
              stop-color="var(--ui-text-muted)"
              stop-opacity="0.22"
            />
            <stop
              offset="95%"
              stop-color="var(--ui-text-muted)"
              stop-opacity="0"
            />
          </linearGradient>
        </defs>
        <XAxis
          data-key="i"
          hide
        />
        <YAxis
          :domain="[0, 100]"
          hide
        />
        <Area
          type="monotone"
          data-key="a"
          stroke="#f97316"
          :stroke-width="2"
          stroke-opacity="0.7"
          fill="url(#heroBgA)"
          :is-animation-active="!reduced"
          :transition="{ duration: 1.6, ease: 'easeInOut' }"
        />
        <Area
          type="monotone"
          data-key="b"
          stroke="var(--ui-text-muted)"
          :stroke-width="1.5"
          stroke-opacity="0.5"
          fill="url(#heroBgB)"
          :is-animation-active="!reduced"
          :transition="{ duration: 1.6, ease: 'easeInOut' }"
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
</template>

<style>
.hero-chart-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  pointer-events: none;
  opacity: 0.5;
}

.dark .hero-chart-bg {
  opacity: 0.4;
}
</style>
