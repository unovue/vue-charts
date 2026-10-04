import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Area, AreaChart, Line, LineChart, Tooltip } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const clock = vi.hoisted(() => ({ reduced: false, updates: [] as Array<(t: number) => void>, durations: [] as number[] }))
vi.mock('motion-v', async original => ({ ...await original<typeof import('motion-v')>(), animate: (from: unknown, _to: unknown, options: { onUpdate: (t: number) => void, duration: number }) => {
  if (typeof from === 'number') {
    clock.updates.push(options.onUpdate)
    clock.durations.push(options.duration)
  }
  return { stop() {} }
} }))
vi.mock('@vueuse/core', async original => ({ ...await original<typeof import('@vueuse/core')>(), usePreferredReducedMotion: () => ref(clock.reduced ? 'reduce' : 'no-preference') }))
beforeEach(() => {
  clock.reduced = false
  clock.updates = []
  clock.durations = []
  mockGetBoundingClientRect({ width: 400, height: 300 })
})
for (const kind of ['line', 'area']) {
  async function setup() {
    const data = [{ name: 'A', value: 40 }, { name: 'B', value: 80 }]
    const { container } = render(() => kind === 'line'
      ? (
          <LineChart width={400} height={300} data={data}>
            <Line dataKey="value" isAnimationActive={false} />
            <Tooltip defaultIndex={0} isAnimationActive={false} />
          </LineChart>
        )
      : (
          <AreaChart width={400} height={300} data={data}>
            <Area dataKey="value" isAnimationActive={false} />
            <Tooltip defaultIndex={0} isAnimationActive={false} />
          </AreaChart>
        ))
    await nextTick()
    await nextTick()
    return container.querySelector('.v-charts-active-dot circle')!
  }
  it(`${kind} active dot grows radius and opacity over 0.15 seconds`, async () => {
    const dot = await setup()
    expect(dot).not.toBeNull()
    expect(dot.getAttribute('r')).toBe('0')
    expect(clock.durations).toContain(0.15)
    clock.updates.at(-1)!(0.5)
    expect(dot.getAttribute('r')).toBe('2')
    expect(dot.parentElement!.style.opacity).toBe('0.5')
    clock.updates.at(-1)!(1)
    expect(dot.getAttribute('r')).toBe('4')
  })
  it(`${kind} active dot is instant with reduced motion`, async () => {
    clock.reduced = true
    const dot = await setup()
    expect(dot.getAttribute('r')).toBe('4')
    expect(clock.updates).toHaveLength(0)
  })
}
