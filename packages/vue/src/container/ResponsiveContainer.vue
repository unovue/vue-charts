<script setup lang="ts">
import type { CSSProperties, VNode } from 'vue'
import { Fragment, cloneVNode, computed, onMounted, onUnmounted, ref, toRef } from 'vue'
import { useThrottleFn } from '@vueuse/core'
import { isPercent } from '../utils/validate'
import { normalizeStyle } from '@/utils/style'
import { provideSizeContext } from '@/container/useSizeContext'
import { useRoundedSize } from '@/hooks/useRoundedSize'

defineOptions({
  name: 'ResponsiveContainer',
  inheritAttrs: false,
})
const props = withDefaults(defineProps<ResponsiveContainerProps>(), {
  initialDimension: () => ({ width: -1, height: -1 }),
  width: '100%',
  height: '100%',
  minWidth: 0,
  debounce: 0,
})
const slots = defineSlots<{
  default: () => VNode[]
}>()

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
const { size: sizes, setSize: setContainerSize } = useRoundedSize({
  width: props.initialDimension.width,
  height: props.initialDimension.height,
})

// Computed calculated dimensions to prevent recalculation
const calculatedWidth = computed(() => {
  return isPercent(props.width) ? sizes.value.width : (props.width as number)
})

const calculatedHeight = computed(() => {
  let height = isPercent(props.height) ? sizes.value.height : (props.height as number)

  if (props.aspect && props.aspect > 0) {
    // Preserve the desired aspect ratio
    if (props.width && (props.height == null || props.height === 'auto')) {
      height = calculatedWidth.value / props.aspect
    }
    else if (props.height && (props.width == null || props.width === 'auto')) {
      // calculatedWidth will be computed based on height and aspect
    }
  }

  return height
})

// Update calculatedWidth when aspect ratio affects it
const finalCalculatedWidth = computed(() => {
  let width = calculatedWidth.value

  if (props.aspect && props.aspect > 0) {
    if (props.height && (props.width == null || props.width === 'auto')) {
      width = calculatedHeight.value * props.aspect
    }
  }

  return width
})

// Provide context with all values
provideSizeContext({
  sizes,
  calculatedWidth: finalCalculatedWidth,
  calculatedHeight,
})

const handleResize = useThrottleFn(
  (entries: ResizeObserverEntry[]) => {
    const { width: containerWidth, height: containerHeight } = entries[0].contentRect

    setContainerSize(containerWidth, containerHeight)
    props.onResize?.(containerWidth, containerHeight)
  },
  debounce,
  true,
  false,
)

const containerRef = ref<HTMLDivElement>()
let observer: ResizeObserver | null = null
onMounted(() => {
  observer = new ResizeObserver(handleResize)
  const { width: containerWidth, height: containerHeight }
    = containerRef.value!.getBoundingClientRect() ?? { width: 0, height: 0 }
  setContainerSize(containerWidth, containerHeight)
  observer.observe(containerRef.value!)
})
onUnmounted(() => {
  observer?.disconnect()
})

const isReady = computed(() => {
  const { width: containerWidth, height: containerHeight } = sizes.value
  return containerWidth >= 0 && containerHeight >= 0
})

function flattenSlotChildren(vnodes: VNode[]): VNode[] {
  const result: VNode[] = []
  for (const vnode of vnodes) {
    if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      result.push(...flattenSlotChildren(vnode.children as VNode[]))
    }
    else {
      result.push(vnode)
    }
  }
  return result
}

function renderChildren() {
  if (!isReady.value) {
    return undefined
  }

  const calculatedWidthValue = finalCalculatedWidth.value
  const calculatedHeightValue = calculatedHeight.value
  const rawChildren = slots.default?.()
  if (!rawChildren)
    return undefined

  const children = flattenSlotChildren(rawChildren)

  return children.map((child, index) => {
    return cloneVNode(child, {
      width: calculatedWidthValue,
      height: calculatedHeightValue,
      key: child.key || `responsive-child-${index}`,
      style: {
        ...normalizeStyle({
          maxHeight: sizes.value.height,
          maxWidth: sizes.value.width,
        }),
        height: '100%',
        width: '100%',
        ...child.props?.style,
      },
    })
  })
}

/**
 * Rendering the children through `<component :is="() => renderChildren()" />` would
 * create a new component type on every render, so Vue unmounts and remounts the whole
 * chart subtree each time. Charts that dispatch on `mouseenter` (radial bar, radar) then
 * loop forever: the remount recreates the element under the cursor, which fires
 * `mouseenter` again. This renderer keeps a stable type, so the subtree is patched.
 */
const ChildrenRenderer = (rendererProps: { nodes: VNode[] }) => rendererProps.nodes
ChildrenRenderer.props = { nodes: { type: Array, required: true } }
ChildrenRenderer.inheritAttrs = false

const containerStyle = computed(() => ({
  ...props.style,
  ...normalizeStyle({
    width: props.width,
    height: props.height,
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
    class="vcharts-responsive-container"
    :class="[props.class]"
    :style="containerStyle"
  >
    <ChildrenRenderer :nodes="renderChildren() ?? []" />
  </div>
</template>
