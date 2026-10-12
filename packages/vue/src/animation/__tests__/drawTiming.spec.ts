import { expect, it } from 'vitest'
import { drawTiming } from '@/animation/motion'

// A line's tip travels its whole length: a fixed duration made dense lines race past the eye.
it.each([
  [300, 1.2],
  [500, 1.2],
  [1500, 1.4],
  [4000, 1.9],
  [20000, 2],
])('draws a %ipx line in %fs', (length, seconds) => {
  expect(drawTiming(length).duration).toBeCloseTo(seconds, 5)
})
