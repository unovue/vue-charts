import type { PropType } from 'vue'
import { Fragment, defineComponent, onBeforeUnmount, ref, watch } from 'vue'
import { Layer } from '@/container/Layer'
import type { Point } from '@/shape/Curve'
import { Curve } from '@/shape/Curve'
import type { LinePointItem } from './type'
import { useLineContext } from './hooks/useLine'
import { Dot } from '@/shape/Dot'
import { animate } from 'motion-v'
import type { AnimationPlaybackControls } from 'motion-dom'
import { interpolate } from '@/utils'
import { LabelList } from '@/components/label'
import { shouldSkipEntrance } from '@/animation/renderPhase'

// Dots component
export const Dots = defineComponent({
  name: 'LineDots',
  props: {
    points: {
      type: Array as PropType<ReadonlyArray<Point>>,
      default: () => [],
    },
  },
  setup(_props) {
    const { clipPathId, clipDot, props, attrs, needClip, dotSlot } = useLineContext()

    return () => {
      const { points } = _props
      if (!shouldRenderDots(points!, props.dot!)) {
        return null
      }
      const dotObjProps = typeof props.dot === 'object' && props.dot !== null ? props.dot : {}
      const dotsProps = {
        'fill': 'var(--v-charts-background, #fff)',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
        ...dotObjProps,
      }
      return (
        <Layer
          class="v-charts-line-dots"
          clip-path={needClip.value ? `url(#clipPath-${clipDot ? '' : 'dots-'}${clipPathId.value})` : undefined}
        >
          {
            points?.map((point, index) => {
              const pointAsLine = point as LinePointItem
              if (dotSlot) {
                return dotSlot({ ...dotsProps, ...attrs, cx: point.x, cy: point.y, index, value: pointAsLine.value, payload: pointAsLine.payload })
              }
              return <Dot r={3} {...dotsProps} {...attrs} cx={point.x} cy={point.y} class="v-charts-line-dot" clipDot={clipDot} />
            })
          }
        </Layer>
      )
    }
  },
})

// StaticLine component with animation
export const StaticLine = defineComponent({
  name: 'StaticLine',
  setup() {
    const { points, clipPathId, layout, attrs, lineData, props, isAnimating, needClip, shapeSlot, labelSlot } = useLineContext()
    const currentPoints = ref<ReadonlyArray<LinePointItem>>([])

    // stroke-dashoffset ratio: 1 = fully hidden, 0 = fully revealed
    const strokeDashRatio = ref(1)
    let isFirstRender = true
    // Server render and hydration show the final line; see entranceGate.ts.
    const skipEntrance = shouldSkipEntrance()
    let prevPoints: ReadonlyArray<LinePointItem> = []
    // The target that the current animation is heading toward.
    // Used by the duplicate guard so that mid-animation arrivals matching the
    // animation START (prevPoints) are not incorrectly skipped.
    let animationTarget: ReadonlyArray<LinePointItem> = []

    // Manage animation lifecycle manually (not via onCleanup, which kills it on re-trigger)
    let currentAnimation: AnimationPlaybackControls | null = null
    let revealAnimationRunning = false

    function stopCurrentAnimation() {
      if (currentAnimation) {
        currentAnimation.stop()
        currentAnimation = null
      }
    }

    onBeforeUnmount(() => {
      stopCurrentAnimation()
    })

    watch(points, (newPoints) => {
      // Skip if points haven't actually changed (selector may return new reference with same values)
      // Compare against the animation TARGET (not the start position) so that new points matching
      // the start of an in-flight animation are correctly processed and interrupt the animation.
      if (newPoints && animationTarget.length === newPoints.length
        && newPoints.every((p, i) => p.x === animationTarget[i].x && p.y === animationTarget[i].y)) {
        return
      }

      if (newPoints && newPoints.length > 0) {
        if (!props.isAnimationActive || (isFirstRender && skipEntrance)) {
          // Animation disabled or entrance skipped — set points directly without animation
          isFirstRender = false
          stopCurrentAnimation()
          revealAnimationRunning = false
          isAnimating.value = false
          currentPoints.value = newPoints
          prevPoints = newPoints
          animationTarget = newPoints
          strokeDashRatio.value = 0
          return
        }

        if (isFirstRender) {
          // First render: use pathLength reveal animation (stroke-dashoffset 1→0)
          isFirstRender = false
          revealAnimationRunning = true
          isAnimating.value = true
          currentPoints.value = newPoints
          animationTarget = newPoints
          strokeDashRatio.value = 1

          stopCurrentAnimation()
          currentAnimation = animate(1 as number, 0, {
            ...props.transition,
            onUpdate(v: number) {
              if (!revealAnimationRunning)
                return
              strokeDashRatio.value = v
            },
            onPlay() {
              props.onAnimationStart?.()
            },
            onComplete() {
              strokeDashRatio.value = 0
              isAnimating.value = false
              revealAnimationRunning = false
              currentAnimation = null
              prevPoints = currentPoints.value as ReadonlyArray<LinePointItem>
              animationTarget = prevPoints
              props.onAnimationEnd?.()
            },
          })
        }
        else if (revealAnimationRunning) {
          // Reveal animation still in progress — just update the target points
          // so the final shape is correct, but don't interrupt the reveal.
          currentPoints.value = newPoints
          animationTarget = newPoints
        }
        else {
          // Subsequent updates: interpolate points
          isAnimating.value = true
          strokeDashRatio.value = 0

          // Capture current visual position so next animation chases from where the line is now,
          // not from where it was before the previous animation started (prevents flash on rapid changes)
          if (currentPoints.value.length) {
            prevPoints = currentPoints.value as ReadonlyArray<LinePointItem>
          }
          animationTarget = newPoints
          stopCurrentAnimation()
          currentAnimation = animate(0 as number, 1, {
            ...props.transition,
            onUpdate(t: number) {
              if (prevPoints.length) {
                const prevPointsDiffFactor = prevPoints.length / newPoints.length
                const stepPoints = t === 1
                  ? newPoints
                  : newPoints.map((entry, index): LinePointItem => {
                      const prevPointIndex = Math.floor(index * prevPointsDiffFactor)
                      if (prevPoints[prevPointIndex]) {
                        const prev: LinePointItem = prevPoints[prevPointIndex]
                        return {
                          ...entry,
                          x: interpolate(prev.x, entry.x, t),
                          y: interpolate(prev.y, entry.y, t),
                        }
                      }
                      return entry
                    })
                currentPoints.value = stepPoints
              }
              else {
                currentPoints.value = newPoints
              }
            },
            onPlay() {
              props.onAnimationStart?.()
            },
            onComplete() {
              isAnimating.value = false
              prevPoints = newPoints
              animationTarget = newPoints
              currentAnimation = null
              props.onAnimationEnd?.()
            },
          })
        }
      }
      else {
        stopCurrentAnimation()
        revealAnimationRunning = false
        isAnimating.value = false
        currentPoints.value = newPoints || []
        prevPoints = currentPoints.value as ReadonlyArray<LinePointItem>
        animationTarget = prevPoints
        strokeDashRatio.value = 0
      }
    }, { immediate: true })

    return () => {
      const curveAttrs = {
        ...attrs,
        'fill': 'none',
        'stroke': props.stroke,
        'stroke-width': props.strokeWidth,
      }

      const dashRatio = strokeDashRatio.value

      const showLabels = !isAnimating.value && (props.label || labelSlot)
      const labelProps = typeof props.label === 'object' ? props.label : {}

      // Build the curve/shape content
      let curveContent: any = null
      if (currentPoints.value && currentPoints.value.length > 1) {
        if (shapeSlot) {
          curveContent = shapeSlot({
            ...curveAttrs,
            points: currentPoints.value,
            connectNulls: props.connectNulls,
            type: props.type,
            layout: layout.value,
            class: 'v-charts-line-curve',
          })
        }
        else {
          // Apply pathLength-based stroke-dash animation only when user has no custom stroke-dasharray
          const hasCustomDashArray = attrs['stroke-dasharray'] != null
          const pathAttrs = !hasCustomDashArray && dashRatio > 0
            ? { 'pathLength': 1, 'stroke-dasharray': 1, 'stroke-dashoffset': dashRatio }
            : {}
          curveContent = (
            <Curve
              {...curveAttrs}
              {...pathAttrs}
              points={currentPoints.value}
              connectNulls={props.connectNulls}
              type={props.type}
              layout={layout.value as any}
              class="v-charts-line-curve"
            />
          )
        }
      }

      // Use clipRect reveal when pathLength animation can't be used:
      // - shape slot (pathLength only works on single <path>)
      // - custom stroke-dasharray (pathLength animation overrides it)
      const hasCustomDashArray = attrs['stroke-dasharray'] != null
      const needClipAnim = (shapeSlot || hasCustomDashArray) && dashRatio > 0 && curveContent

      return (
        <Fragment>
          {curveContent && (
            <Layer clip-path={needClip.value ? `url(#clipPath-${clipPathId.value})` : undefined}>
              {needClipAnim
                ? (
                    <g>
                      <defs>
                        <clipPath id={`line-anim-${clipPathId.value}`}>
                          <rect x="0" y="0" width={`${(1 - dashRatio) * 100}%`} height="100%" />
                        </clipPath>
                      </defs>
                      <g clip-path={`url(#line-anim-${clipPathId.value})`}>
                        {curveContent}
                      </g>
                    </g>
                  )
                : curveContent}
            </Layer>
          )}
          <Dots points={currentPoints.value} />
          {
            showLabels && (
              <LabelList
                {...labelProps}
                data={lineData.value ?? []}
                dataKey={props.dataKey}
                v-slots={labelSlot ? { label: labelSlot } : undefined}
              />
            )
          }
        </Fragment>
      )
    }
  },
})

function shouldRenderDots(points: ReadonlyArray<LinePointItem>, dot: any): boolean {
  if (points == null || !points.length) {
    return false
  }
  if (dot) {
    return true
  }
  return points.length === 1
}
