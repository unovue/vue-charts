<script setup lang="ts">
// Landing hero card (ADR-0006): tabbed chart + its real code. Tab chip slides
// via motion layoutId; chart switches are a clip-path wipe — the previous
// chart stays mounted underneath while the new one sweeps in over it;
// the code animates via shiki-magic-move token-level shared layout.
// Auto-rotates every 3.2s (pause on hover); all motion frozen under reduced motion.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
// Fine-grained shiki imports + the JavaScript regex engine: avoids the
// 652KB Oniguruma WASM and keeps only the vue lang + 2 themes in the graph.
import { type HighlighterCore, createHighlighterCore } from 'shiki/core'
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript'
import langVue from '@shikijs/langs/vue'
import themeGithubLight from '@shikijs/themes/github-light'
import themeGithubDark from '@shikijs/themes/github-dark'
import { ShikiMagicMove } from 'shiki-magic-move/vue'
import 'shiki-magic-move/dist/style.css'
import { AnimatePresence, motion, useReducedMotion } from 'motion-v'

const charts = [
  {
    key: 'area',
    label: 'Area',
    desc: '',
    code: `<template>
  <AreaChart
    :data="data"
  >
    <Area
      type="monotone"
      data-key="value"
      stroke="#f97316"
      fill="url(#fill)"
    />
  </AreaChart>
</template>`,
  },
  {
    key: 'bar',
    label: 'Bar',
    desc: '',
    code: `<template>
  <BarChart
    :data="data"
  >
    <Bar
      data-key="value"
      fill="#f97316"
      :radius="[4, 4, 0, 0]"
    />
  </BarChart>
</template>`,
  },
  {
    key: 'pie',
    label: 'Pie',
    desc: '',
    code: `<template>
  <PieChart>
    <Pie
      :data="data"
      data-key="value"
      :inner-radius="50"
      :outer-radius="80"
    >
      <Cell
        v-for="c in colors"
        :fill="c"
      />
    </Pie>
  </PieChart>
</template>`,
  },
  {
    key: 'radar',
    label: 'Radar',
    desc: '',
    code: `<template>
  <RadarChart
    :data="data"
  >
    <Radar
      data-key="value"
      stroke="#f97316"
      fill="#f97316"
      :fill-opacity="0.3"
    />
  </RadarChart>
</template>`,
  },
]

// v-model:active — the landing lifts this so the background can follow
const active = defineModel<string>('active', { default: 'area' })
const current = computed(() => charts.find(c => c.key === active.value)!)

// Shared highlighter instance; theme follows the site color mode
const colorMode = useColorMode()
const theme = computed(() => colorMode.value === 'dark' ? 'github-dark' : 'github-light')
const highlighter = ref<HighlighterCore>()
onMounted(async () => {
  highlighter.value = await createHighlighterCore({
    themes: [themeGithubLight, themeGithubDark],
    langs: [langVue],
    engine: createJavaScriptRegexEngine(),
  })
})

// Entrance transition; frozen under reduced motion.
// No motion `layout` here on purpose: height changes are eliminated at the
// source (fixed chart heights) and the code pane's height is animated by
// shiki-magic-move's own container animation — FLIP scaleY would squash text.
const reduced = useReducedMotion()
const enterTransition = computed(() => reduced.value
  ? { duration: 0 }
  : { duration: 0.64, ease: [0.2, 0, 0, 1] as const, delay: 0.28 })

const tabBase = 'relative inline-flex h-7 cursor-pointer touch-manipulation items-center rounded-full px-3 font-mono text-[13px] font-medium transition-colors duration-(--ds-t-colour) ease-(--ds-ease) [-webkit-tap-highlight-color:transparent] [corner-shape:squircle] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)'

// The old chart fades out; the new one appears at once and plays its own entrance, which a
// fade on top would hide.
const chartExit = computed(() => reduced.value
  ? { duration: 0 }
  : { duration: 0.16, ease: [0.2, 0, 0, 1] as const })

// Tab underline slides between tabs via shared layout (layoutId)
const lineTransition = computed(() => reduced.value
  ? { duration: 0 }
  : { duration: 0.3, ease: [0.2, 0, 0, 1] as const })

// Auto-rotate through chart types; pauses on hover, stops once a tab is picked, off under reduced motion
const keys = charts.map(c => c.key)
const paused = ref(false)
let rotateTimer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  if (reduced.value)
    return
  rotateTimer = setInterval(() => {
    if (!paused.value) {
      const i = keys.indexOf(active.value)
      active.value = keys[(i + 1) % keys.length]!
    }
  }, 3200)
})
onBeforeUnmount(() => clearInterval(rotateTimer))

// A tab the visitor picks stays: rotating on would replace it mid-entrance.
function pick(key: string) {
  clearInterval(rotateTimer)
  active.value = key
}
</script>

<template>
  <motion.figure
    class="m-0 rounded-(--ds-radius-card) bg-(--ds-surface) p-(--ds-card-pad) shadow-(--ds-shadow-card)"
    :initial="reduced ? false : { opacity: 0, y: 12 }"
    :animate="{ opacity: 1, y: 0 }"
    :transition="enterTransition"
    @mouseenter="paused = true"
    @mouseleave="paused = false"
  >
    <div
      class="flex gap-0.5 px-1 pb-2.5 pt-1"
      role="tablist"
      aria-label="Chart type"
    >
      <button
        v-for="c in charts"
        :key="c.key"
        :class="[tabBase, active === c.key ? 'text-(--ds-text)' : 'text-(--ds-muted) hover:text-(--ds-text)']"
        role="tab"
        :aria-selected="active === c.key"
        @click="pick(c.key)"
      >
        <motion.span
          v-if="active === c.key"
          layout-id="cd-tab-line"
          class="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-(--ds-text)"
          :transition="lineTransition"
        />
        <span class="relative">{{ c.label }}</span>
      </button>
    </div>

    <div class="grid grid-cols-2 gap-2 max-[520px]:grid-cols-1">
      <!-- pane background stays static; only the chart content morphs -->
      <div class="relative flex items-center overflow-hidden rounded-(--ds-radius-inner) bg-(--ds-block) px-1 py-2">
        <AnimatePresence mode="wait">
          <motion.div
            :key="active"
            class="w-full"
            :initial="false"
            :animate="{ opacity: 1, filter: 'blur(0px)' }"
            :exit="{ opacity: 0, filter: 'blur(4px)', transition: chartExit }"
          >
            <LandingCodeCardChart
              :type="active"
              class="w-full"
            />
          </motion.div>
        </AnimatePresence>
      </div>

      <div class="overflow-auto rounded-(--ds-radius-inner) bg-(--ds-block) [&_pre]:m-0 [&_pre]:!bg-transparent [&_pre]:px-4 [&_pre]:py-3 [&_pre]:font-mono [&_pre]:text-[11.5px] [&_pre]:leading-[1.6]">
        <ShikiMagicMove
          v-if="highlighter"
          :highlighter="highlighter"
          lang="vue"
          :theme="theme"
          :code="current.code"
          :options="{ duration: 600 }"
        />
      </div>
    </div>

    <figcaption class="px-3 pb-1.5 pt-3 font-mono text-xs text-(--ds-dim)">
      {{ current.label }}{{ current.desc ? ` · ${current.desc}` : '' }}
    </figcaption>
  </motion.figure>
</template>
