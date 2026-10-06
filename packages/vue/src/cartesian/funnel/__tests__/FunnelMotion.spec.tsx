import { clock } from '@/test/motionClock'
import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Funnel, FunnelChart } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 400, height: 300 })
})

it('keeps the stack closed while middle rows leave', async () => {
  const rows = ref([50, 40, 30, 20, 10].map((value, i) => ({ name: `R${i}`, value })))
  const { container } = render(() => (
    <FunnelChart width={400} height={300}>
      <Funnel data={rows.value} dataKey="value" nameKey="name" />
    </FunnelChart>
  ))
  await nextTick()
  clock.update(clock.to)
  await nextTick()
  rows.value = rows.value.filter((_, i) => i !== 1 && i !== 2)
  await nextTick()
  clock.update(clock.to / 4)
  await nextTick()
  // Each trapezoid's bottom edge is the next one's top edge: no gaps open up.
  const edges = [...container.querySelectorAll('.v-charts-trapezoid')].map((path) => {
    const ys = [...path.getAttribute('d')!.matchAll(/,(-?[\d.]+)/g)].map(match => Number(match[1]))
    return { top: ys[0], bottom: ys[2] }
  })
  expect(edges).toHaveLength(5)
  for (let i = 1; i < edges.length; i++)
    expect(edges[i].top).toBeCloseTo(edges[i - 1].bottom, 3)
})

vi.mock('motion-v', async original => (await import('@/test/motionClock')).mockMotion(await original<typeof import('motion-v')>()))
vi.mock('@vueuse/core', async original => (await import('@/test/motionClock')).mockVueUse(await original<typeof import('@vueuse/core')>()))
