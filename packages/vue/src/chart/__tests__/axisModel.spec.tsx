import { render } from '@testing-library/vue'
import { beforeEach, expect, it, vi } from 'vitest'
import { defineComponent, nextTick, ref } from 'vue'
import type { PropType } from 'vue'
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ReferenceLine,
  XAxis,
  YAxis,
  useXAxisDomain,
  useXAxisScale,
  useYAxisDomain,
  useYAxisScale,
} from '@/index'
import type { AxisDomain } from '@/types/axis'
import * as scaleMath from '@/core/axis/scale'
import * as domainMath from '@/core/axis/domain'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => mockGetBoundingClientRect({ width: 400, height: 200 }))

const DomainProbe = defineComponent({
  props: {
    kind: { type: String as PropType<'x' | 'y'>, default: 'y' },
    name: { type: String, default: 'domain' },
  },
  setup(props) {
    const domain = props.kind === 'x' ? useXAxisDomain() : useYAxisDomain()
    const scale = props.kind === 'x' ? useXAxisScale() : useYAxisScale()
    return () => (
      <text data-domain={props.name} data-upper={scale.value?.(domain.value?.at(-1))}>
        {JSON.stringify(domain.value)}
      </text>
    )
  },
})

// Catch lost domain rules when selector inputs become shared chart computeds.
it.each<{ name: string, domain: AxisDomain, overflow: boolean, reference: number | undefined, expected: string }>([
  { name: 'expression', domain: ['dataMin - 10', 'dataMax + 10'], overflow: false, reference: undefined, expected: '[0,50]' },
  { name: 'expand for data', domain: [0, 20], overflow: false, reference: undefined, expected: '[0,40]' },
  { name: 'allow overflow', domain: [0, 20], overflow: true, reference: undefined, expected: '[0,20]' },
  { name: 'extend for a reference line', domain: [0, 50], overflow: false, reference: 100, expected: '[0,100]' },
])('preserves the numerical domain: $name', async ({ domain, overflow, reference, expected }) => {
  const { container } = render(() => (
    <LineChart width={400} height={200} data={[{ value: 10 }, { value: 40 }]}>
      <YAxis domain={domain} allowDataOverflow={overflow} />
      <Line dataKey="value" isAnimationActive={false} />
      {reference !== undefined && <ReferenceLine y={reference} ifOverflow="extendDomain" />}
      <DomainProbe />
    </LineChart>
  ))
  await nextTick()
  await nextTick()
  expect(container.querySelector('[data-domain]')?.textContent).toBe(expected)
})

it.each([
  { duplicated: true, expected: '[0,1,2]' },
  { duplicated: false, expected: '["A","B"]' },
])('preserves the categorical domain with allowDuplicatedCategory=$duplicated', async ({ duplicated, expected }) => {
  const { container } = render(() => (
    <BarChart width={400} height={200} data={[{ name: 'A', value: 10 }, { name: 'A', value: 20 }, { name: 'B', value: 30 }]}>
      <XAxis dataKey="name" allowDuplicatedCategory={duplicated} />
      <Bar dataKey="value" isAnimationActive={false} />
      <DomainProbe kind="x" />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect(container.querySelector('[data-domain]')?.textContent).toBe(expected)
})

// Output alone cannot detect independent repeated calculations in sibling consumers.
it('shares the domain after the first consumer unmounts and stops work on chart teardown', async () => {
  const combine = vi.spyOn(domainMath, 'combineAxisDomain')
  const scale = vi.spyOn(scaleMath, 'combineScaleFunction')
  const first = ref(true)
  const rows = ref([{ first: 20, second: 100 }])
  const { container, unmount } = render(() => (
    <BarChart width={400} height={200} data={rows.value}>
      {first.value && <DomainProbe name="first" />}
      <DomainProbe name="second" />
      <YAxis domain={['dataMin - 10', 'dataMax + 10']} />
      {first.value && <Line dataKey="first" isAnimationActive={false} />}
      <Bar dataKey="second" isAnimationActive={false} />
    </BarChart>
  ))
  await nextTick()
  await nextTick()
  expect([...container.querySelectorAll('[data-domain]')].map(node => node.textContent)).toEqual(['[10,110]', '[10,110]'])
  combine.mockClear()
  scale.mockClear()
  rows.value = [{ first: 30, second: 200 }]
  await nextTick()
  await nextTick()
  expect([...container.querySelectorAll('[data-domain]')].map(node => node.textContent)).toEqual(['[20,210]', '[20,210]'])
  expect(combine.mock.calls.filter(call => call[5] === 'yAxis')).toHaveLength(1)
  expect(scale.mock.calls.filter(call => call[0]?.type === 'number')).toHaveLength(1)
  expect(container.querySelector('[data-domain="second"]')?.getAttribute('data-upper')).toBe('5')
  first.value = false
  await nextTick()
  await nextTick()
  expect(container.querySelectorAll('[data-domain]')).toHaveLength(1)
  expect(container.querySelector('[data-domain="second"]')?.textContent).toBe('[190,210]')
  combine.mockClear()
  scale.mockClear()
  rows.value[0].second = 300
  await nextTick()
  await nextTick()
  expect(container.querySelector('[data-domain="second"]')?.textContent).toBe('[290,310]')
  expect(combine.mock.calls.filter(call => call[5] === 'yAxis')).toHaveLength(1)
  expect(scale.mock.calls.filter(call => call[0]?.type === 'number')).toHaveLength(1)
  expect(container.querySelector('[data-domain="second"]')?.getAttribute('data-upper')).toBe('5')
  unmount()
  combine.mockClear()
  scale.mockClear()
  rows.value[0].second = 400
  await nextTick()
  await nextTick()
  expect(combine).not.toHaveBeenCalled()
  expect(scale).not.toHaveBeenCalled()
})
