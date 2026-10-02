<script setup lang="ts">
// Chart background for the landing (ADR-0006) — renders the SAME chart type
// as the hero card's active tab with static data (no data morphing).
// Ambient, axis-less; type switches via AnimatePresence blur morph;
// transitions frozen under reduced motion.
import { computed, ref } from 'vue'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'
import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, PolarAngleAxis, PolarGrid, Radar, RadarChart, XAxis, YAxis } from 'vccs'

const props = defineProps<{ type: string }>()

const reduced = useReducedMotion()

const POINTS = 60

function wave(t: number) {
  return Array.from({ length: POINTS }, (_, i) => ({
    i,
    v: 50 + Math.sin(i / 6 + t) * 14 + Math.sin(i / 2.7 + t * 1.4) * 8,
  }))
}

const RADAR_AXES = ['a', 'b', 'c', 'd', 'e', 'f']
function radarWave(t: number) {
  return RADAR_AXES.map((s, i) => ({
    s,
    v: 55 + Math.sin(t + i * 1.1) * 22 + Math.sin(t * 1.6 + i * 0.7) * 10,
  }))
}

const PIE_SLICES = ['a', 'b', 'c', 'd']
const pieColors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
function pieWave(t: number) {
  return PIE_SLICES.map((name, i) => ({
    name,
    value: 30 + Math.abs(Math.sin(t * 0.8 + i * 1.7)) * 45,
  }))
}

// Static datasets — the background no longer morphs its data
const data = ref(wave(0))
const radarData = ref(radarWave(0))
const pieData = ref(pieWave(0))

const morphEnter = computed(() => reduced.value
  ? { duration: 0 }
  : { duration: 0.32, ease: [0.2, 0, 0, 1] as const })
const morphExit = computed(() => reduced.value
  ? { duration: 0 }
  : { duration: 0.16, ease: [0.2, 0, 0, 1] as const })
</script>

<template>
  <div
    class="lb"
    aria-hidden="true"
  >
    <AnimatePresence mode="wait">
      <motion.div
        :key="props.type"
        class="lb-frame"
        :initial="reduced ? false : { opacity: 0, filter: 'blur(6px)' }"
        :animate="{ opacity: 1, filter: 'blur(0px)' }"
        :exit="{ opacity: 0, filter: 'blur(6px)', transition: morphExit }"
        :transition="morphEnter"
      >
        <!-- Area -->
        <AreaChart
          v-if="props.type === 'area'"
          :data="data"
          responsive
          style="width: 100%; height: 100%"
        >
          <defs>
            <linearGradient
              id="lb-fill"
              x1="0"
              y1="0"
              x2="0"
              y2="1"
            >
              <stop
                offset="0%"
                stop-color="#f97316"
                stop-opacity="0.18"
              />
              <stop
                offset="100%"
                stop-color="#f97316"
                stop-opacity="0"
              />
            </linearGradient>
          </defs>
          <XAxis
            data-key="i"
            :tick="false"
            :axis-line="false"
            :tick-line="false"
          />
          <YAxis
            :tick="false"
            :axis-line="false"
            :tick-line="false"
            :width="0"
            :domain="[0, 100]"
          />
          <Area
            type="monotone"
            data-key="v"
            stroke="#f97316"
            fill="url(#lb-fill)"
            :stroke-width="1.5"
            :dot="false"
          />
        </AreaChart>

        <!-- Bar -->
        <BarChart
          v-else-if="props.type === 'bar'"
          :data="data"
          responsive
          style="width: 100%; height: 100%"
        >
          <XAxis
            data-key="i"
            :tick="false"
            :axis-line="false"
            :tick-line="false"
          />
          <YAxis
            :tick="false"
            :axis-line="false"
            :tick-line="false"
            :width="0"
            :domain="[0, 100]"
          />
          <Bar
            data-key="v"
            fill="#f97316"
            :fill-opacity="0.16"
            :is-animation-active="false"
          />
        </BarChart>

        <!-- Pie -->
        <PieChart
          v-else-if="props.type === 'pie'"
          responsive
          style="width: 100%; height: 100%"
        >
          <Pie
            :data="pieData"
            data-key="value"
            inner-radius="55%"
            outer-radius="85%"
            :is-animation-active="false"
          >
            <Cell
              v-for="(c, i) in pieColors"
              :key="i"
              :fill="c"
              :fill-opacity="0.22"
            />
          </Pie>
        </PieChart>

        <!-- Radar -->
        <RadarChart
          v-else
          :data="radarData"
          responsive
          style="width: 100%; height: 100%"
        >
          <PolarGrid
            stroke="#a1a1aa"
            :stroke-opacity="0.25"
          />
          <PolarAngleAxis
            data-key="s"
            :tick="false"
          />
          <Radar
            data-key="v"
            stroke="#f97316"
            fill="#f97316"
            :fill-opacity="0.14"
            :is-animation-active="false"
          />
        </RadarChart>
      </motion.div>
    </AnimatePresence>
  </div>
</template>

<style scoped>
.lb {
  width: 100%;
  height: 100%;
  opacity: 0.55;
}
.lb-frame {
  width: 100%;
  height: 100%;
}
</style>
