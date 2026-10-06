import { clock } from '@/test/motionClock'
import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Area, AreaChart, Line, LineChart, XAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

it('uses target row indices and disables exiting dots in Line and Area', async () => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
  for (const kind of ['line', 'area']) {
    clock.runs = []
    const rows = ref([{ name: 'A', value: 20 }, { name: 'B', value: 40 }, { name: 'C', value: 60 }])
    const click = vi.fn()
    const { container, unmount } = render(() => kind === 'line'
      ? (
          <LineChart width={400} height={300} data={rows.value}>
            <XAxis dataKey="name" />
            <Line dot dataKey="value" onClick={click} />
          </LineChart>
        )
      : (
          <AreaChart width={400} height={300} data={rows.value}>
            <XAxis dataKey="name" />
            <Area dot dataKey="value" onClick={click} />
          </AreaChart>
        ))
    await nextTick()
    clock.runs.forEach(run => run.complete())
    await nextTick()
    rows.value = [rows.value[0], rows.value[2]]
    await nextTick()
    const dots = container.querySelectorAll(`.v-charts-${kind}-dots > g`)
    expect(dots).toHaveLength(3)
    await fireEvent.click(dots[2])
    expect(click.mock.calls[0][0].payload.name).toBe('C')
    expect(click.mock.calls[0][1]).toBe(1)
    click.mockClear()
    expect(dots[1].getAttribute('pointer-events')).toBe('none')
    await fireEvent.click(dots[1])
    await fireEvent.mouseEnter(dots[1])
    expect(click).not.toHaveBeenCalled()
    unmount()
  }
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
