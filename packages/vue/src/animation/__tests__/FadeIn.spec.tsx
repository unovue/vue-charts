import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { FadeIn } from '../FadeIn'

// The fade's first keyframe is applied on the next frame, after the browser has painted.
vi.mock('motion-v', async original => ({ ...await original<typeof import('motion-v')>(), animate: () => ({ stop() {} }) }))

it('hides its content before the first paint instead of flashing it at full opacity', async () => {
  const { container } = render(() => <svg><FadeIn><text>label</text></FadeIn></svg>)
  await nextTick()
  expect(container.querySelector('g')!.style.opacity).toBe('0')
})
