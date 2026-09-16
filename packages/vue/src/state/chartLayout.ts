import { computed, shallowRef } from 'vue'
import type { LayoutType, Margin, Size } from '@/types'

export interface ChartLayoutState {
  layoutType: LayoutType
  width: number
  height: number
  margin: Margin
  scale: number
}

export function createChartLayout() {
  const state = shallowRef<ChartLayoutState>({
    layoutType: 'horizontal',
    width: 0,
    height: 0,
    margin: { top: 5, right: 5, bottom: 5, left: 5 },
    scale: 1,
  })

  function setProps(layoutType: LayoutType, size: Size, margin: Margin) {
    const current = state.value
    const sameMargin = current.margin.top === margin.top && current.margin.right === margin.right
      && current.margin.bottom === margin.bottom && current.margin.left === margin.left
    if (current.layoutType === layoutType && current.width === size.width && current.height === size.height && sameMargin)
      return
    state.value = {
      ...current,
      layoutType,
      width: size.width,
      height: size.height,
      margin: sameMargin ? current.margin : { top: margin.top, right: margin.right, bottom: margin.bottom, left: margin.left },
    }
  }

  function setScale(scale: number) {
    if (state.value.scale !== scale)
      state.value = { ...state.value, scale }
  }

  return { state: computed(() => state.value), setProps, setScale }
}
