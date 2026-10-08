import { fireEvent, render } from '@testing-library/vue'
import { expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { Area, Bar, ComposedChart, Funnel, FunnelChart, Legend, Line, Pie, PieChart, Radar, RadarChart, RadialBar, RadialBarChart, Scatter, ScatterChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const data = [{ name: 'A', value: 10, x: 1 }, { name: 'B', value: 20, x: 2 }, { name: 'C', value: 30, x: 3 }]

// Catches series rendering or registration ignoring the shared hidden set.
it.each([
  ['line', (hide: boolean) => <Line dataKey="value" hide={hide} isAnimationActive={false} />, ComposedChart],
  ['area', (hide: boolean) => <Area dataKey="value" hide={hide} isAnimationActive={false} />, ComposedChart],
  ['bar', (hide: boolean) => <Bar dataKey="value" hide={hide} isAnimationActive={false} />, ComposedChart],
  ['scatter', (hide: boolean) => <Scatter dataKey="value" data={data} hide={hide} isAnimationActive={false} />, ScatterChart],
  ['funnel', (hide: boolean) => <Funnel dataKey="value" data={data} hide={hide} isAnimationActive={false} />, FunnelChart],
  ['pie', (hide: boolean) => <Pie dataKey="value" data={data} hide={hide} isAnimationActive={false} />, PieChart],
  ['radar', (hide: boolean) => <Radar dataKey="value" hide={hide} isAnimationActive={false} />, RadarChart],
  ['radial-bar', (hide: boolean) => <RadialBar dataKey="value" hide={hide} isAnimationActive={false} />, RadialBarChart],
] as const)('applies legend hidden to %s and preserves explicit hide', async (name, series, Chart) => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
  const hidden = ref<string[]>(['value'])
  const hide = ref(false)
  const { container } = render(() => (
    <Chart width={500} height={300} data={data}>
      {name === 'scatter' && <XAxis dataKey="x" type="number" />}
      {name === 'scatter' && <YAxis dataKey="value" />}
      {series(hide.value)}
      <Legend hidden={hidden.value} />
    </Chart>
  ))
  // A hidden series may keep an empty layer (so it can animate out), but draws nothing.
  const drawn = () => [...container.querySelectorAll(`.v-charts-${name} path, .v-charts-${name} circle, .v-charts-${name} rect, .v-charts-${name} polygon`)]
    .find(el => !el.closest('defs') && (el.tagName !== 'path' || el.getAttribute('d'))) ?? null
  await nextTick()
  expect(drawn()).toBeNull()
  expect(container.querySelector('.v-charts-legend-item-text')).not.toBeNull()
  expect(container.querySelector<HTMLElement>('.v-charts-legend-item-text')!.style.color).toBe('var(--v-charts-text, #666)')
  hidden.value = []
  await nextTick()
  await nextTick()
  expect(drawn()).not.toBeNull()
  hide.value = true
  await nextTick()
  expect(drawn()).toBeNull()
})

// Catches invalid list markup and a pressed state that does not follow series visibility.
it('toggles the pressed state through a native legend button', async () => {
  const hidden = ref<string[]>([])
  const { container } = render(() => (
    <ComposedChart width={500} height={300} data={data}>
      <Line dataKey="value" isAnimationActive={false} />
      <Legend
        hidden={hidden.value}
        {...{
          'onUpdate:hidden': (value: string[]) => { hidden.value = value },
        }}
      />
    </ComposedChart>
  ))
  await nextTick()
  const button = container.querySelector('ul.v-charts-default-legend > li > button')!
  expect(button.getAttribute('aria-pressed')).toBe('true')
  await fireEvent.click(button)
  expect(button.getAttribute('aria-pressed')).toBe('false')
  await fireEvent.click(button)
  expect(button.getAttribute('aria-pressed')).toBe('true')
})
