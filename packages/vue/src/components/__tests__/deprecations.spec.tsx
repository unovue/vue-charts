import { render } from '@testing-library/vue'
import { describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Customized, LineChart, ResponsiveContainer } from '@/index'

const cases = [
  {
    name: 'ResponsiveContainer',
    message: '[vccs] ResponsiveContainer is deprecated and will be removed in 2.0. Charts are responsive by default: remove the wrapper and set width, height or aspect on the chart.',
    content: (visible: boolean) => (
      <div>
        {visible && (
          <>
            <ResponsiveContainer />
            <ResponsiveContainer />
          </>
        )}
      </div>
    ),
  },
  {
    name: 'Customized',
    message: '[vccs] Customized is deprecated and will be removed in 2.0. Use the chart\'s default slot with usePlotArea() and the other chart composables.',
    content: (visible: boolean) => (
      <LineChart width={100} height={100}>
        {visible && (
          <>
            <Customized />
            <Customized />
          </>
        )}
      </LineChart>
    ),
  },
]

describe('development deprecation warnings', () => {
  it.each(cases)('warns exactly once per app for $name, including remounts', async ({ message, content }) => {
    const warn = vi.spyOn(console, 'warn')
    const visible = ref(true)
    const first = render(() => content(visible.value))
    expect(warn.mock.calls).toEqual([[message]])

    visible.value = false
    await nextTick()
    visible.value = true
    await nextTick()
    expect(warn.mock.calls).toEqual([[message]])
    first.unmount()

    render(() => content(true))
    expect(warn.mock.calls).toEqual([[message], [message]])
  })
})
