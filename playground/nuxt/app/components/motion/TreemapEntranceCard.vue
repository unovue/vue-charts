<script setup lang="ts">
import { Treemap } from 'vccs'
import { RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'
import { type Entrance, type Leaf, type Scene, sceneOf } from './treemapEntrances'
import { treemapColors, treemapData } from './treemapData'

const props = defineProps<{
  entrance: Entrance
  /** Time stretch: 1 is real speed. */
  slow: number
  /** Changes to replay every card at once. */
  replayAll: number
}>()

// The library draws the final layout (animation off); the card moves it through the variant.
const leaves = new Map<string, Leaf>()
function register(node: Leaf) {
  leaves.set(node.name, { x: node.x, y: node.y, width: node.width, height: node.height, name: node.name, root: node.root, fill: node.fill })
  return node
}

const t = ref(0)
const scene = shallowRef<Scene>()
let frame = 0
function play() {
  cancelAnimationFrame(frame)
  scene.value = sceneOf([...leaves.values()])
  const start = performance.now()
  const tick = (now: number) => {
    t.value = Math.min(1, (now - start) / (props.entrance.duration * 1000 * props.slow))
    if (t.value < 1)
      frame = requestAnimationFrame(tick)
  }
  t.value = 0
  frame = requestAnimationFrame(tick)
}
watch(() => props.replayAll, play)

// Like the library, the entrance waits until half the card is on screen.
const card = ref<HTMLElement>()
let observer: IntersectionObserver | undefined
onMounted(() => {
  observer = new IntersectionObserver(([entry]) => {
    if (entry!.intersectionRatio >= 0.5) {
      observer?.disconnect()
      play()
    }
  }, { threshold: [0, 0.5, 1] })
  observer.observe(card.value!)
})
onUnmounted(() => {
  observer?.disconnect()
  cancelAnimationFrame(frame)
})

// Like the library, a label shows only when it fits its cell (about 6.2 px per character at 11 px).
const fits = (node: Leaf) => node.height > 22 && node.name.length * 6.2 + 12 < node.width

// Before the first play nothing is drawn: the entrance starts from empty.
function draw(node: Leaf) {
  register(node)
  return scene.value ? [{ ...props.entrance.draw(node, t.value, scene.value), key: node.name }] : []
}
</script>

<template>
  <article
    ref="card"
    class="flex min-w-0 flex-col gap-3 rounded-xl border p-4"
  >
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="flex items-center gap-2 text-sm font-semibold">
          {{ entrance.name }}
          <span
            v-if="entrance.current"
            class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
          >current</span>
        </h3>
        <p class="mt-1 text-xs text-muted-foreground text-pretty">
          {{ entrance.description }}
        </p>
      </div>
      <Button
        size="icon"
        variant="ghost"
        class="size-8 shrink-0"
        :aria-label="`Replay ${entrance.name}`"
        @click="play"
      >
        <RotateCcw class="size-4" />
      </Button>
    </header>
    <Treemap
      :data="treemapData"
      data-key="value"
      :color-panel="treemapColors"
      :aspect="1.75"
      :is-animation-active="false"
    >
      <template #content="node">
        <g
          v-for="f in draw(node)"
          :key="f.key"
          :opacity="f.opacity"
        >
          <rect
            :x="f.x"
            :y="f.y"
            :width="Math.max(0, f.width)"
            :height="Math.max(0, f.height)"
            :fill="node.fill"
            stroke="var(--background)"
          />
          <text
            v-if="fits(node) && f.label > 0"
            :x="f.x + 6"
            :y="f.y + 15"
            :opacity="f.label"
            fill="#fff"
            font-size="11"
          >
            {{ node.name }}
          </text>
        </g>
      </template>
    </Treemap>
  </article>
</template>
