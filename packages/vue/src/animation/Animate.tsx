import type { PropType } from 'vue'
import { defineComponent, onUnmounted, ref, watch } from 'vue'
import { animate } from 'motion-v'
import { usePreferredReducedMotion } from '@vueuse/core'
import type { AnimationOptions } from 'motion-v'

const DEFAULT_TRANSITION: AnimationOptions = {
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
      type: Object as PropType<AnimationOptions>,
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
    const currentValue = ref(0)
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
        onUpdate: (latest) => {
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
      if (isActive) {
        if (motion === 'reduce') {
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
