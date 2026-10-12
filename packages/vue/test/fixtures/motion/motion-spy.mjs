// Observe real motion values; do not replace the animation engine or its clock.
export * from 'motion-v-original'
import { useSpring as originalUseSpring } from 'motion-v-original'

window.motionSprings = []
export function useSpring(...args) {
  const value = originalUseSpring(...args)
  window.motionSprings.push(value)
  return value
}
