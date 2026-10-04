import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { RadarChart } from '@/chart/RadarChart'
import { Radar } from '@/polar/radar/Radar'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { PolarRadiusAxis } from '@/polar/radar/PolarRadiusAxis'
import { Legend } from '@/components/legend'
import { Tooltip } from '@/components/Tooltip'
import { ResponsiveContainer } from '@/container'
import { rangeData } from '@/storybook/data'

const meta = {
  title: 'Examples/RadarChart',
  component: RadarChart,
} satisfies Meta<typeof RadarChart>

export default meta
type Story = StoryObj<typeof meta>

const RangedRadarChartWrapper = defineComponent({
  setup() {
    return () => (
      <ResponsiveContainer width="100%" height={400}>
        <RadarChart width={360} height={360} data={rangeData}>
          <PolarGrid />
          <Legend />
          <PolarAngleAxis dataKey="day" />
          <Radar
            name="Temperature"
            dataKey="temperature"
            fill="orange"
            fillOpacity={0.5}
            stroke="blue"
          />
          <Tooltip />
        </RadarChart>
      </ResponsiveContainer>
    )
  },
})

export const RangedRadarChart: Story = {
  render: () => <RangedRadarChartWrapper />,
}

const data = [
  { name: 'A', key1: 15, key2: 5 },
  { name: 'B', key1: 12, key2: 2 },
  { name: 'C', key1: 16, key2: 6 },
  { name: 'D', key1: 6, key2: 12 },
  { name: 'E', key1: 8, key2: 15 },
]

const RadarWithChangingDataKeyWrapper = defineComponent({
  setup() {
    const dataKey = ref('key1')

    return () => (
      <div>
        <form style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              name="dataKey"
              value="key1"
              checked={dataKey.value === 'key1'}
              onChange={() => { dataKey.value = 'key1' }}
            />
            dataKey 1
          </label>
          <label style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              name="dataKey"
              value="key2"
              checked={dataKey.value === 'key2'}
              onChange={() => { dataKey.value = 'key2' }}
            />
            dataKey 2
          </label>
          <label style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              name="dataKey"
              value="hidden"
              checked={dataKey.value === 'hidden'}
              onChange={() => { dataKey.value = 'hidden' }}
            />
            Hidden
          </label>
        </form>
        <RadarChart width={360} height={360} data={data}>
          <Legend />
          <PolarAngleAxis dataKey="name" />
          <PolarRadiusAxis domain={[0, 20]} tick={false} axisLine={false} />
          <Radar
            dataKey={dataKey.value === 'hidden' ? 'key1' : dataKey.value}
            hide={dataKey.value === 'hidden'}
            fill="orange"
            fillOpacity={0.5}
            stroke="blue"
            strokeDasharray="3 3"
            dot={true}
            label={{ fill: 'red' }}
          />
          <Tooltip defaultIndex={2} />
        </RadarChart>
      </div>
    )
  },
})

export const RadarWithChangingDataKey: Story = {
  render: () => <RadarWithChangingDataKeyWrapper />,
}
