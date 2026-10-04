import type { PropType } from 'vue'
import { defineComponent, onUnmounted, ref, watch } from 'vue'
import { animate } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import type { ValueAnimationTransition } from 'motion-dom'
import { shouldSkipEntrance } from './renderPhase'

const DEFAULT_TRANSITION: ValueAnimationTransition<number> = {
  duration: 0.4,
  ease: 'easeOut',
}

const Animate = defineComponent({
  name: 'Animate',
  props: {
    // 是否激活动画
    isActive: {
      type: Boolean,
      default: true,
    },
    // 动画配置选项
    transition: {
      type: Object as PropType<ValueAnimationTransition<number>>,
      default: undefined,
    },
    // 动画开始回调
    onAnimationStart: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    // 动画结束回调
    onAnimationEnd: {
      type: Function as PropType<() => void>,
      default: undefined,
    },
    // 动画更新回调
    onUpdate: {
      type: Function as PropType<(latest: any) => void>,
      default: undefined,
    },
    // 动画开始值
    from: {
      type: Number,
      default: 0,
    },
    // 动画结束值
    to: {
      type: Number,
      default: 1,
    },
  },
  setup(props, { slots }) {
    let animationControls: any = null
    // Server render and hydration show the final state; see entranceGate.ts.
    let skipNext = shouldSkipEntrance()
    const currentValue = ref(skipNext ? props.to : props.from)
    const reducedMotion = usePreferredReducedMotion()

    // 开始动画
    const startAnimation = () => {
      if (animationControls) {
        animationControls.stop()
      }

      if (props.onAnimationStart) {
        props.onAnimationStart()
      }

      animationControls = animate(props.from, props.to, {
        ...DEFAULT_TRANSITION,
        ...props.transition,
        onUpdate: (latest: number) => {
          currentValue.value = latest
          if (props.onUpdate) {
            props.onUpdate(latest)
          }
        },
        onComplete: () => {
          currentValue.value = props.to
          if (props.onAnimationEnd) {
            props.onAnimationEnd()
          }
        },
      })
    }

    // 停止动画
    const stopAnimation = () => {
      if (animationControls) {
        animationControls.stop()
        animationControls = null
      }
    }

    // 监听isActive变化
    watch([() => props.isActive, reducedMotion] as const, ([isActive, motion]) => {
      const skipEntrance = skipNext
      skipNext = false
      if (isActive) {
        if (motion === 'reduce' || skipEntrance) {
          // Skip animation — snap to final value
          stopAnimation()
          if (props.onAnimationStart) {
            props.onAnimationStart()
          }
          currentValue.value = props.to
          if (props.onAnimationEnd) {
            props.onAnimationEnd()
          }
        }
        else {
          startAnimation()
        }
      }
      else {
        stopAnimation()
        currentValue.value = props.to
      }
    }, { immediate: true })

    onUnmounted(() => {
      stopAnimation()
    })

    return () => {
      if (!slots.default) {
        return null
      }

      // 始终传递当前动画值
      return slots.default(currentValue.value)
    }
  },
})

export { Animate }
