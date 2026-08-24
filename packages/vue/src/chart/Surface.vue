<script setup lang="ts">
import { type StyleValue, computed, ref } from 'vue'
import type { VueClassValue } from '@/types'
import { provideCursorLayerRef } from '@/context/cursorLayerContext'
import { provideGraphicalLayerRef } from '@/context/graphicalLayerContext'
import { provideLabelLayerRef } from '@/context/labelLayerContext'

interface SurfaceProps {
  width: number
  height: number
  viewBox?: {
    x?: number
    y?: number
    width?: number
    height?: number
  }
  class?: VueClassValue
  style?: StyleValue
  title?: string
  desc?: string
}

defineOptions({
  name: 'ChartsSurface',
  inheritAttrs: false,
})

const props = defineProps<SurfaceProps>()

const svgViewBox = computed(() => {
  const svgView = props.viewBox || { width: props.width, height: props.height, x: 0, y: 0 }
  return `${svgView.x} ${svgView.y} ${svgView.width} ${svgView.height}`
})

const cursorLayerRef = ref<SVGGElement | null>(null)
provideCursorLayerRef(cursorLayerRef)

const graphicalLayerRef = ref<SVGGElement | null>(null)
provideGraphicalLayerRef(graphicalLayerRef)

const labelLayerRef = ref<SVGGElement | null>(null)
provideLabelLayerRef(labelLayerRef)
</script>

<template>
  <svg
    v-bind="$attrs"
    class="vcharts-surface"
    :class="[props.class]"
    :width="width"
    :height="height"
    :style="style"
    :viewBox="svgViewBox"
  >
    <title>{{ title }}</title>
    <desc>{{ desc }}</desc>
    <slot />
    <g
      ref="cursorLayerRef"
      class="v-charts-cursor-layer"
    />
    <g
      ref="graphicalLayerRef"
      class="v-charts-graphical-layer"
    />
    <g
      ref="labelLayerRef"
      class="v-charts-label-layer"
    />
  </svg>
</template>
