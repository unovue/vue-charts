<script setup lang="ts">
// InstallCommand — the landing's install pill (ADR-0007). Rotates through
// package managers every 2.6s (pause on hover, click to switch), the
// pm+verb segment flips character-by-character (split-flap), the pill
// container FLIP-animates its width via motion `layout`, and copy copies
// the CURRENT command.
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { AnimatePresence, LayoutGroup, motion } from 'motion-v'

const managers = [
  { pm: 'npm', verb: 'install' },
  { pm: 'pnpm', verb: 'add' },
  { pm: 'yarn', verb: 'add' },
  { pm: 'bun', verb: 'add' },
]
const idx = ref(0)
const current = computed(() => managers[idx.value]!)
const command = computed(() => `${current.value.pm} ${current.value.verb} vccs`)
const chars = computed(() => `${current.value.pm} ${current.value.verb}`.split(''))

// Auto-rotate; pauses on hover
const paused = ref(false)
let timer: ReturnType<typeof setInterval> | undefined
onMounted(() => {
  timer = setInterval(() => {
    if (!paused.value)
      idx.value = (idx.value + 1) % managers.length
  }, 2600)
})
onBeforeUnmount(() => clearInterval(timer))

function cycle() {
  idx.value = (idx.value + 1) % managers.length
}

// Copy the CURRENT command, with face-crossfade feedback
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
function copy() {
  navigator.clipboard?.writeText(command.value)
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
}
onBeforeUnmount(() => clearTimeout(copyTimer))

function flapEnter(i: number) {
  return { duration: 0.35, ease: [0.2, 0, 0, 1] as const, delay: i * 0.028 }
}
function flapExit(i: number) {
  return { duration: 0.18, ease: [0.2, 0, 0, 1] as const, delay: i * 0.014 }
}

const layoutTransition = { duration: 0.3, ease: [0.2, 0, 0, 1] as const }
</script>

<template>
  <LayoutGroup>
    <motion.div
      class="ds-pill"
      :layout="true"
      :transition="layoutTransition"
      @mouseenter="paused = true"
      @mouseleave="paused = false"
    >
      <i>$</i>
      <motion.button
        class="inline-flex cursor-pointer touch-manipulation items-baseline gap-1.5 border-0 bg-transparent p-0 text-inherit [-webkit-tap-highlight-color:transparent] [font:inherit] focus-visible:rounded focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)"
        :aria-label="`Install with ${current.pm}: ${command}. Click to switch package manager`"
        @click="cycle"
      >
        <span class="inline-block [perspective:400px]">
          <AnimatePresence mode="wait">
            <span
              :key="`${current.pm}-${current.verb}`"
              class="inline-block whitespace-pre [transform-style:preserve-3d]"
            >
              <motion.span
                v-for="(ch, i) in chars"
                :key="`${i}-${ch}`"
                layout="size"
                class="inline-block will-change-transform [transform-origin:50%_100%]"
                :initial="{ rotateX: 90, opacity: 0 }"
                :animate="{ rotateX: 0, opacity: 1 }"
                :exit="{ rotateX: -90, opacity: 0, transition: flapExit(i) }"
                :transition="flapEnter(i)"
              >{{ ch === ' ' ? ' ' : ch }}</motion.span>
            </span>
          </AnimatePresence>
        </span>
        <span class="select-all">vccs</span>
      </motion.button>
      <button
        class="ds-copy"
        :aria-label="copied ? 'Copied' : `Copy ${command}`"
        @click="copy"
      >
        <span class="relative grid h-3 w-3 place-items-center">
          <UIcon
            name="i-lucide-copy"
            class="absolute inset-0 transition-[opacity,transform] duration-(--ds-t-colour) ease-(--ds-ease)"
            :class="{ 'scale-60 opacity-0': copied }"
          />
          <UIcon
            name="i-lucide-check"
            class="absolute inset-0 text-(--ds-accent-strong) transition-[opacity,transform] duration-(--ds-t-colour) ease-(--ds-ease)"
            :class="{ 'scale-60 opacity-0': !copied }"
          />
        </span>
      </button>
    </motion.div>
  </LayoutGroup>
</template>
