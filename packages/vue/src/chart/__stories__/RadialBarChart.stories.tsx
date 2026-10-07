import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { RadialBar } from '@/polar/radial-bar/RadialBar'
import { PolarGrid } from '@/polar/radar/PolarGrid'
import { PolarAngleAxis } from '@/polar/radar/PolarAngleAxis'
import { PolarRadiusAxis } from '@/polar/radar/PolarRadiusAxis'
import Legend from '@/components/legend/Legend'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { pageData, pageDataWithFillColor } from '@/storybook/data'

const meta = {
  title: 'Examples/RadialBarChart',
  component: RadialBarChart,
} satisfies Meta<typeof RadialBarChart>

export default meta
type Story = StoryObj<typeof meta>

const SimpleRadialBarChartWrapper = defineComponent({
  setup() {
    return () => (
      <div>
        <RadialBarChart width={500} height={500} data={pageData}>
          <RadialBar dataKey="pv" />
          <Legend />
          <Tooltip />
        </RadialBarChart>
      </div>
    )
  },
})

export const SimpleRadialBarChart: Story = {
  render: () => <SimpleRadialBarChartWrapper />,
}

const RadialBarWithColorsWrapper = defineComponent({
  setup() {
    return () => (
      <div>
        <RadialBarChart width={500} height={500} data={pageDataWithFillColor}>
          <RadialBar dataKey="pv" />
          <Legend />
          <Tooltip />
        </RadialBarChart>
      </div>
    )
  },
})

export const RadialBarWithColors: Story = {
  render: () => <RadialBarWithColorsWrapper />,
}

const RadialBarWithAxesAndGridWrapper = defineComponent({
  setup() {
    return () => (
      <div>
        <RadialBarChart width={500} height={500} data={pageDataWithFillColor}>
          <RadialBar dataKey="pv" />
          <Legend />
          <PolarGrid gridType="circle" />
          <PolarAngleAxis dataKey="pv" type="number" axisLineType="circle" stroke="red" />
          <PolarRadiusAxis dataKey="name" orientation="middle" type="category" angle={90} stroke="black" />
          <Tooltip cursor={{ 'stroke-width': 3, 'stroke': 'black', 'stroke-dasharray': '4 4' }} />
        </RadialBarChart>
      </div>
    )
  },
})

export const RadialBarWithAxesAndGrid: Story = {
  render: () => <RadialBarWithAxesAndGridWrapper />,
}

const RadialBarChartWithChangingDataKeyWrapper = defineComponent({
  setup() {
    const dataKey = ref('amt')

    return () => (
      <div>
        <form style={{ display: 'flex', flexDirection: 'column' }}>
          <label style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              name="dataKey"
              value="amt"
              checked={dataKey.value === 'amt'}
              onChange={() => { dataKey.value = 'amt' }}
            />
            dataKey 1
          </label>
          <label style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              name="dataKey"
              value="pv"
              checked={dataKey.value === 'pv'}
              onChange={() => { dataKey.value = 'pv' }}
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
        <RadialBarChart width={360} height={360} data={pageDataWithFillColor}>
          <Legend />
          <PolarAngleAxis type="number" domain={[0, 10000]} />
          <PolarRadiusAxis type="category" dataKey="name" />
          <RadialBar
            dataKey={dataKey.value === 'hidden' ? 'amt' : dataKey.value}
            hide={dataKey.value === 'hidden'}
            fill="orange"
            fillOpacity={0.5}
            stroke="blue"
            strokeDasharray="3 3"
            label={true}
          />
          <Tooltip />
        </RadialBarChart>
      </div>
    )
  },
})

export const RadialBarChartWithChangingDataKey: Story = {
  render: () => <RadialBarChartWithChangingDataKeyWrapper />,
}

const RadialBarChartWithMultipleAxesWrapper = defineComponent({
  setup() {
    return () => (
      <RadialBarChart
        width={500}
        height={500}
        data={pageDataWithFillColor}
        innerRadius="10%"
        outerRadius="80%"
        barSize={10}
      >
        <RadialBar angleAxisId="axis-pv" radiusAxisId="axis-name" dataKey="pv" fillOpacity={0.3} fill="purple" />
        <Legend />
        <Tooltip defaultIndex={3} axisId="axis-name" />
        <PolarAngleAxis
          angleAxisId="axis-uv"
          dataKey="uv"
          tickFormatter={(value: number) => `uv: ${value}`}
          tickCount={6}
          type="number"
          stroke="blue"
          axisLineType="circle"
        />
        <PolarAngleAxis
          angleAxisId="axis-pv"
          dataKey="pv"
          stroke="red"
          tickFormatter={(value: number) => `pv: ${value}`}
          type="number"
        />
        <PolarRadiusAxis radiusAxisId="axis-name" dataKey="name" type="category" stroke="green" />
        <PolarRadiusAxis radiusAxisId="axis-amt" dataKey="amt" type="number" angle={180} stroke="black" />
        <PolarGrid stroke="red" stroke-opacity={0.5} angleAxisId="axis-pv" radiusAxisId="axis-name" />
        <PolarGrid stroke="blue" stroke-opacity={0.5} angleAxisId="axis-uv" radiusAxisId="axis-amt" />
      </RadialBarChart>
    )
  },
})

export const RadialBarChartWithMultipleAxes: Story = {
  render: () => <RadialBarChartWithMultipleAxesWrapper />,
}
