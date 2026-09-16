import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick, ref } from 'vue'
import { Bar, BarChart, XAxis, YAxis } from '@/index'
import { Brush } from '@/cartesian/brush'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

beforeEach(() => {
  mockGetBoundingClientRect({ width: 500, height: 300 })
})

const data = [
  { name: 'A', value: 10 },
  { name: 'B', value: 20 },
  { name: 'C', value: 30 },
  { name: 'D', value: 40 },
]

describe('brush data ownership', () => {
  it('updates the main chart range without narrowing a sibling chart', async () => {
    const startIndex = ref(1)
    const endIndex = ref(2)
    const { container } = render(() => (
      <div>
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="value" isAnimationActive={false} />
          <Brush startIndex={startIndex.value} endIndex={endIndex.value} />
        </BarChart>
        <BarChart width={500} height={300} data={data}>
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      </div>
    ))
    await nextTick()
    await nextTick()
    const wrappers = container.querySelectorAll('.v-charts-wrapper')
    const main = wrappers[0]
    const bars = () => [...main.querySelectorAll('.v-charts-bar-rectangle')]
      .filter(element => !element.closest('.v-charts-brush'))
    expect(bars()).toHaveLength(2)
    expect(wrappers[wrappers.length - 1].querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(4)
    startIndex.value = 0
    endIndex.value = 0
    await nextTick()
    await nextTick()
    expect(bars()).toHaveLength(1)
    expect(wrappers[wrappers.length - 1].querySelectorAll('.v-charts-bar-rectangle')).toHaveLength(4)
  })
})
