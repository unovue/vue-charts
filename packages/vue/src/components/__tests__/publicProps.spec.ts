import { render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { h } from 'vue'
import { Area, Bar, BarChart, Label, Legend, Line } from '@/index'

// Catches internal geometry becoming an accepted public component prop again.
it.each([
  ['Line', Line, ['points', 'path', 'baseLine', 'layout', 'left', 'top', 'width', 'height', 'animationId', 'activePoint', 'needClip', 'activeIndex']],
  ['Area', Area, ['points', 'path', 'baseLine', 'layout', 'left', 'top', 'width', 'height', 'animationId', 'activePoint', 'needClip', 'activeIndex']],
  ['Bar', Bar, ['needClip', 'id']],
  ['Legend', Legend, ['chartWidth', 'chartHeight', 'margin']],
  ['Label', Label, ['parentViewBox', 'index']],
] as const)('%s accepts only public props', (_name, component, removed) => {
  for (const name of removed)
    expect(component.props).not.toHaveProperty(name)
})

// Catches removed Label inputs crossing the public wrapper through SVG attributes.
it('does not pass private Label attributes into its view', () => {
  const content = vi.fn()
  render(() => h(BarChart, { width: 200, height: 200 }, {
    default: () => h(Label, {
      value: 'A',
      viewBox: { x: 0, y: 0, width: 100, height: 100 },
      parentViewBox: { x: 10, y: 10, width: 50, height: 50 },
      index: 3,
    }, {
      content: (props: Record<string, unknown>) => {
        content(props)
        return h('text', 'A')
      },
    }),
  }))
  expect(content).toHaveBeenCalledWith(expect.objectContaining({ parentViewBox: undefined, index: undefined }))
})
