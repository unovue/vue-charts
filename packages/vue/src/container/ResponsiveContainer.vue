<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, onMounted, onUnmounted, ref, toRef } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { normalizeStyle } from '@/utils/style'
import { provideInitialDimension } from '@/container/useSizeContext'

defineOptions({
  name: 'ResponsiveContainer',
  inheritAttrs: false,
})
const props = withDefaults(defineProps<ResponsiveContainerProps>(), {
  width: '100%',
  height: '100%',
  minWidth: 0,
  debounce: 0,
})
export interface ResponsiveContainerProps {
  aspect?: number
  width?: string | number
  height?: string | number
  minWidth?: string | number
  minHeight?: string | number
  initialDimension?: {
    width: number
    height: number
  }
  maxHeight?: number
  debounce?: number
  id?: string | number
  class?: string | number
  style?: Omit<CSSProperties, keyof ResponsiveContainerProps>
  onResize?: (width: number, height: number) => void
}
const debounce = toRef(props, 'debounce')
provideInitialDimension(toRef(props, 'initialDimension'))

const handleResize = useThrottleFn(
  (entries: ResizeObserverEntry[]) => {
    const { width, height } = entries[0].contentRect
    props.onResize?.(width, height)
  },
  debounce,
  true,
  false,
)

const containerRef = ref<HTMLDivElement>()
let observer: ResizeObserver | undefined
onMounted(() => {
  if (!containerRef.value || typeof ResizeObserver === 'undefined')
    return
  observer = new ResizeObserver(handleResize)
  observer.observe(containerRef.value)
})
onUnmounted(() => observer?.disconnect())

const containerStyle = computed(() => ({
  ...props.style,
  aspectRatio: props.aspect,
  ...normalizeStyle({
    width: props.width,
    height: props.aspect ? 'auto' : props.height,
    minWidth: props.minWidth,
    minHeight: props.minHeight,
    maxHeight: props.maxHeight,
  }),
}))
</script>

<template>
  <div
    :id="id ? `${id}` : undefined"
    ref="containerRef"
    class="v-charts-responsive-container"
    :class="[props.class]"
    :style="containerStyle"
  >
    <slot />
  </div>
</template>
