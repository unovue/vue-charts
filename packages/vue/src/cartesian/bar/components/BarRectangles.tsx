import { useChartTooltip } from '@/state/chartContext'
import { defineComponent } from 'vue'
import { useAppSelector } from '@/state/hooks'
import {
  selectActiveTooltipDataKey,
  selectActiveTooltipIndex,
} from '@/state/selectors/tooltipSelectors'
import { filterProps } from '@/utils/VueUtils'
import { Layer } from '@/container/Layer'
import { Rectangle } from '@/shape/Rectangle'
import { useBarContext } from '../hooks/useBar'
import { Animate } from '@/animation/Animate'
import type { BarRectangleItem } from '@/types/bar'

export const BarRectangles = defineComponent({
  name: 'BarRectangles',
  inheritAttrs: false,

  setup(_) {
    const tooltip = useChartTooltip()
    const activeIndex = useAppSelector(selectActiveTooltipIndex)
    const activeDataKey = useAppSelector(selectActiveTooltipDataKey)
    let previousRectangles: ReadonlyArray<BarRectangleItem> | null = null
    let animationId = 0

    const { props, data: barData, layout, isAnimating, shapeSlot, activeBarSlot, cellProps } = useBarContext()

    const {
      dataKey,
      isAnimationActive,
      onAnimationStart,
      onAnimationEnd,
      activeBar,
      activeIndex: activeIndexProp,
    } = props

    // 事件处理函数
    const onMouseEnterFromContext = (entry: BarRectangleItem, index: number) => (e: MouseEvent) => {
      tooltip.setActiveMouseOverItemIndex({
        activeDataKey: dataKey,
        activeIndex: String(index),
        activeCoordinate: {
          x: entry.tooltipPosition.x,
          y: entry.tooltipPosition.y,
        },
      })
    }
    const onMouseLeaveFromContext = (entry: BarRectangleItem, index: number) => (e: MouseEvent) => {
      tooltip.mouseLeaveItem()
    }
    const onClickFromContext = (entry: BarRectangleItem, index: number) => (e: MouseEvent) => {
      tooltip.setActiveClickItemIndex({
        activeDataKey: dataKey,
        activeIndex: String(index),
        activeCoordinate: {
          x: entry.tooltipPosition.x,
          y: entry.tooltipPosition.y,
        },
      })
    }

    const baseProps = filterProps(props, false)

    // 插值函数
    const interpolateNumber = (from: number, to: number) => (t: number) => from + (to - from) * t

    const renderRectangles = (data: ReadonlyArray<BarRectangleItem>) => {
      if (!data)
        return null

      return (
        <>
          {data.map((entry: BarRectangleItem, i: number) => {
            // activeIndex prop takes priority (independent of tooltip hover)
            // When activeIndex is set or #activeBar slot exists, active is enabled implicitly
            const activeEnabled = activeBar !== false || activeIndexProp != null || !!activeBarSlot
            const isActive = activeIndexProp != null
              ? activeEnabled && i === activeIndexProp
              : activeEnabled && String(i) === activeIndex.value && (activeDataKey.value == null || dataKey === activeDataKey.value)

            const activeBarProps = isActive && typeof activeBar === 'object' ? activeBar : {}

            // Auto-merge payload.fill into props so per-entry fill works
            // without requiring a #shape slot (matches Recharts behavior)
            const entryFill = entry.payload?.fill
            // Cell props override per-index (like Recharts Cell component)
            const cellPropsForIndex = cellProps.value?.[i]
            const barRectangleProps = {
              ...baseProps,
              ...(entryFill ? { fill: entryFill } : {}),
              ...entry,
              ...(cellPropsForIndex ?? {}),
              ...(isActive ? activeBarProps : {}),
              isActive,
              index: i,
              dataKey,
            }

            // Determine which renderer to use:
            // 1. If active and activeBar slot exists, use it
            // 2. Otherwise use shape slot or default Rectangle
            const renderShape = () => {
              if (isActive && activeBarSlot) {
                return activeBarSlot(barRectangleProps)
              }
              if (shapeSlot) {
                return shapeSlot(barRectangleProps)
              }
              return <Rectangle {...barRectangleProps} />
            }

            return (
              <Layer
                key={`rectangle-${entry?.x}-${entry?.y}-${entry?.value}-${i}`}
                class="v-charts-bar-rectangle"
                onMouseenter={onMouseEnterFromContext(entry, i)}
                onMouseleave={onMouseLeaveFromContext(entry, i)}
                onClick={onClickFromContext(entry, i)}
              >
                {renderShape()}
              </Layer>
            )
          })}
        </>
      )
    }

    return () => {
      const data = barData.value
      if (!data) {
        return null
      }

      if (isAnimationActive && previousRectangles !== data) {
        const prevData = previousRectangles
        // Increment animationId on every data change so the Animate component
        // remounts and restarts its 0→1 animation. This matches React Recharts'
        // useAnimationId(props) which generates a new key per render.
        // The key difference from naively restarting: previousRectangles is
        // updated at t>0 with interpolated step data, so rapid restarts during
        // Brush drag interpolate from the current visual position (not the
        // original start), creating a smooth "chase" effect.
        animationId++
        isAnimating.value = true
        return (
          <Animate
            key={animationId}
            transition={props.transition}
            isActive={isAnimationActive}
            onAnimationStart={onAnimationStart}
            onAnimationEnd={() => { isAnimating.value = false; onAnimationEnd?.() }}
          >
            {
              (t) => {
                const stepData = t === 1
                  ? data
                  : data.map((entry, index) => {
                      const prev = prevData?.[index]
                      // Only interpolate from previous if the coordinate space hasn't changed.
                      // When the chart re-layouts (e.g. axis scale change), stackedBarStart shifts
                      // and the old positions are in a stale coordinate system — animating from
                      // them would place bars outside the current chart area.
                      if (prev && prev.stackedBarStart === entry.stackedBarStart) {
                        const interpolatorX = interpolateNumber(prev.x || 0, entry.x || 0)
                        const interpolatorY = interpolateNumber(prev.y || 0, entry.y || 0)
                        const interpolatorWidth = interpolateNumber(prev.width, entry.width)
                        const interpolatorHeight = interpolateNumber(prev.height, entry.height)
                        return {
                          ...entry,
                          x: interpolatorX(t),
                          y: interpolatorY(t),
                          width: interpolatorWidth(t),
                          height: interpolatorHeight(t),
                        }
                      }

                      // 新出现的柱子（或坐标系变更后）：从堆叠基线开始动画
                      if (layout.value === 'horizontal') {
                        const h = interpolateNumber(0, entry.height)(t)
                        const y = interpolateNumber(entry.stackedBarStart, entry.y!)(t)

                        return { ...entry, y, height: h }
                      }

                      // 垂直布局
                      const w = interpolateNumber(0, entry.width!)(t)
                      const x = interpolateNumber(entry.stackedBarStart, entry.x!)(t)

                      return { ...entry, width: w, x }
                    })

                if (t > 0) {
                  previousRectangles = stepData
                }

                return (
                  <g>
                    {renderRectangles(stepData)}
                  </g>
                )
              }
            }
          </Animate>
        )
      }

      // 无动画或数据未变化时直接渲染
      isAnimating.value = false
      previousRectangles = data
      return (
        <g>
          {renderRectangles(data)}
        </g>
      )
    }
  },
})
