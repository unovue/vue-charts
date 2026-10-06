<script setup lang="ts">
import type { CSSProperties } from 'vue'
import { computed, ref, toRef } from 'vue'
import { useMounted, useResizeObserver, useThrottleFn } from '@vueuse/core'
import { normalizeStyle } from '@/utils/style'
import { provideInitialDimension } from '@/container/useSizeContext'
import { warnOnce } from '@/utils/log'

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

const emit = defineEmits<{ resize: [width: number, height: number] }>()

warnOnce('[vccs] ResponsiveContainer is deprecated and will be removed in 2.0. Charts are responsive by default: remove the wrapper and set width, height or aspect on the chart.')

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
}
const debounce = toRef(props, 'debounce')
provideInitialDimension(toRef(props, 'initialDimension'))

const handleResize = useThrottleFn(
  (entries: readonly ResizeObserverEntry[]) => {
    const { width, height } = entries[0].contentRect
    emit('resize', width, height)
  },
  debounce,
  true,
  false,
)

const containerRef = ref<HTMLDivElement>()
const mounted = useMounted()
useResizeObserver(() => mounted.value ? containerRef.value : undefined, handleResize)

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
