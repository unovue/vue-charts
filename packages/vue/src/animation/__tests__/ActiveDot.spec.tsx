import { clock } from '@/test/motionClock'
import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'
import { Area, AreaChart, Line, LineChart, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, Tooltip } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
})
for (const kind of ['line', 'area']) {
  async function setup(active = true) {
    const data = [{ name: 'A', value: 40 }, { name: 'B', value: 80 }]
    const { container } = render(() => kind === 'line'
      ? (
          <LineChart width={400} height={300} data={data}>
            <Line dataKey="value" isAnimationActive={active} />
            <Tooltip defaultIndex={0} isAnimationActive={false} />
          </LineChart>
        )
      : (
          <AreaChart width={400} height={300} data={data}>
            <Area dataKey="value" isAnimationActive={active} />
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
    expect(clock.runs.map(run => run.duration)).toContain(0.15)
    clock.runs.at(-1)!.update(0.5)
    expect(dot.getAttribute('r')).toBe('2')
    expect(dot.parentElement!.style.opacity).toBe('0.5')
    clock.runs.at(-1)!.update(1)
    expect(dot.getAttribute('r')).toBe('4')
  })
  it(`${kind} active dot is instant with reduced motion`, async () => {
    clock.reduced = true
    const dot = await setup()
    expect(dot.getAttribute('r')).toBe('4')
    expect(clock.runs).toHaveLength(0)
  })
}

it('renders final active dots immediately when Line, Area, or Radar disables animation', async () => {
  const data = [{ name: 'A', value: 40 }, { name: 'B', value: 80 }]
  for (const kind of ['line', 'area', 'radar']) {
    const { container, unmount } = render(() => kind === 'line'
      ? (
          <LineChart width={400} height={300} data={data}>
            <Line dataKey="value" isAnimationActive={false} />
            <Tooltip defaultIndex={0} isAnimationActive={false} />
          </LineChart>
        )
      : kind === 'area'
        ? (
            <AreaChart width={400} height={300} data={data}>
              <Area dataKey="value" isAnimationActive={false} />
              <Tooltip defaultIndex={0} isAnimationActive={false} />
            </AreaChart>
          )
        : (
            <RadarChart width={400} height={300} data={data}>
              <PolarAngleAxis dataKey="name" />
              <PolarRadiusAxis />
              <Radar dataKey="value" isAnimationActive={false} />
              <Tooltip defaultIndex={0} isAnimationActive={false} />
            </RadarChart>
          ))
    await nextTick()
    await nextTick()
    const dot = container.querySelector('.v-charts-active-dot circle')!
    expect(dot).not.toBeNull()
    expect(dot.getAttribute('r')).toBe('4')
    expect(dot.parentElement!.style.opacity).not.toBe('0')
    expect(clock.runs).toHaveLength(0)
    unmount()
  }
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
