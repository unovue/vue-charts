import type { StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { ComposedChart } from '@/chart/ComposedChart'
import { ScatterChart } from '@/chart/ScatterChart'
import { Scatter } from '@/cartesian/scatter'
import { ZAxis } from '@/cartesian/z-axis'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/Tooltip'
import { Legend } from '@/components/legend'
import { ResponsiveContainer } from '@/container'
import { getStoryArgsFromArgsTypesObject } from '@/storybook/api/props/utils'
import { CategoricalChartProps } from '@/storybook/api/props/chart-props'
import type { ChartData } from '@/types/chartData'
import { ReferenceArea } from '@/cartesian/reference-area'
import { babiesAndVideosCorrelation } from '@/storybook/data/spurriousCorrelations'

export default {
  title: 'Examples/ScatterChart',
  component: ComposedChart,
}

type Story = StoryObj

export const SpurriousCorrelation: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 800,
    height: 400,
    margin: { top: 0, right: 20, bottom: 0, left: 20 },
    data: [...babiesAndVideosCorrelation],
  },
  render: (args: Record<string, any>) => {
    return (
      <ComposedChart {...args}>
        <CartesianGrid vertical={false} yAxisId="axis-babies" />
        <XAxis type="category" dataKey="year" name="Year" />
        <YAxis
          yAxisId="axis-babies"
          type="number"
          dataKey="babies"
          label={{ value: 'Babies born', position: 'center', angle: -90, stroke: 'black', dx: -20 }}
          domain={['dataMin', 'dataMax']}
          stroke="black"
          name="Babies born"
          unit=""
          orientation="left"
          axisLine={false}
          tickLine={false}
          tickCount={5}
        />
        <YAxis
          yAxisId="axis-youtube"
          type="number"
          dataKey="length"
          stroke="red"
          orientation="right"
          name="Video length"
          unit=""
          domain={['dataMin', 'dataMax']}
          label={{ value: 'Length in seconds', position: 'center', angle: 90, stroke: 'red', dx: 30 }}
          tickCount={5}
          axisLine={false}
          tickLine={false}
        />
        <Legend />
        <Scatter
          lineType="joint"
          line
          name="Babies of all sexes born in the US named Mara"
          yAxisId="axis-babies"
          fill="black"
          shape="diamond"
          stroke-width={2}
          stroke-dasharray="3 1"
        />
        <Scatter
          line
          lineType="joint"
          name="Average length of Stand-up Maths YouTube videos"
          yAxisId="axis-youtube"
          fill="red"
          stroke-width={2}
          shape="circle"
        />
        <Tooltip cursor={{ 'stroke-dasharray': '3 3' }} />
      </ComposedChart>
    )
  },
}

export const WithDuplicatedCategory: Story = {
  render: (args: Record<string, any>) => {
    const data = [
      { x: 100, y: 100, z: 200 },
      { x: 100, y: 200, z: 200 },
      { x: 100, y: 300, z: 200 },
    ]
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ScatterChart>
          <CartesianGrid />
          <XAxis type="category" allowDuplicatedCategory={false} dataKey="x" name="stature" unit="cm" />
          <YAxis type="category" allowDuplicatedCategory={false} dataKey="y" name="weight" unit="kg" />
          <Scatter name="A school" data={data} />
          <Tooltip cursor={{ 'stroke-dasharray': '3 3' }} />
          <Legend />
        </ScatterChart>
      </ResponsiveContainer>
    )
  },
}

const ChangingDataKeyWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    type MockDataType = {
      x?: { value: number }
      y?: { value: number }
      name: string
    }
    const data1: ReadonlyArray<MockDataType> = [
      { x: { value: 1 }, name: 'x1' },
      { x: { value: 2 }, name: 'x2' },
      { x: { value: 3 }, name: 'x3' },
    ]
    const data2: ReadonlyArray<MockDataType> = [
      { y: { value: 3 }, name: 'y1' },
      { y: { value: 2 }, name: 'y2' },
      { y: { value: 1 }, name: 'y3' },
    ]

    const dataKey1 = (d: MockDataType) => d.x?.value ?? 0
    const dataKey2 = (d: MockDataType) => d.y?.value ?? 0

    const useData2 = ref(false)
    const visible = ref(true)

    return () => (
      <div>
        <div>
          <button type="button" onClick={() => { useData2.value = false; visible.value = true }}>
            Use data1
          </button>
          <button type="button" onClick={() => { useData2.value = true; visible.value = true }}>
            Use data2
          </button>
          <button type="button" onClick={() => { visible.value = false }}>
            Hide
          </button>
        </div>
        <ComposedChart {...props.args} data={useData2.value ? data2 as unknown as ChartData : data1 as unknown as ChartData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
          <YAxis dataKey={useData2.value ? dataKey2 : dataKey1} />
          <ZAxis range={[200, 200]} />
          <Tooltip />
          <Legend />
          <Scatter
            name="Animated Scatter"
            lineType="joint"
            line
            hide={!visible.value}
            dataKey={useData2.value ? dataKey2 : dataKey1}
            stroke="#8884d8"
            fill="#8884d8"
            stroke-width={3}
            stroke-dasharray="2 2"
            label={{ fill: 'red', dy: -25, dataKey: useData2.value ? dataKey2 : dataKey1 }}
          />
        </ComposedChart>
      </div>
    )
  },
})

export const ChangingDataKey: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    margin: { top: 30, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => <ChangingDataKeyWrapper args={args} />,
}

function getHourFromTimestamp(value: number) {
  const data = new Date(value)
  let hour = data.getHours()
  const minute = data.getMinutes()
  const meridiem = hour >= 12 ? 'PM' : 'AM'
  hour %= 12
  hour = hour === 0 ? 12 : hour
  if (minute > 0)
    return `${hour}:${minute.toString().padStart(2, '0')} ${meridiem}`
  return `${hour} ${meridiem}`
}

export const EmptyChart: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
        >
          <CartesianGrid />
          <ReferenceArea y1={70} y2={150} />
          <XAxis
            type="number"
            allowDataOverflow
            ticks={[
              new Date('2025-05-06T00:00:00').getTime(),
              new Date('2025-05-06T03:00:00').getTime(),
              new Date('2025-05-06T06:00:00').getTime(),
              new Date('2025-05-06T09:00:00').getTime(),
              new Date('2025-05-06T12:00:00').getTime(),
              new Date('2025-05-06T15:00:00').getTime(),
              new Date('2025-05-06T18:00:00').getTime(),
              new Date('2025-05-06T21:00:00').getTime(),
              new Date('2025-05-07T00:00:00').getTime(),
            ]}
            tickFormatter={(tickValue: any) => {
              if (typeof tickValue !== 'number')
                return String(tickValue)
              return getHourFromTimestamp(tickValue)
            }}
            dataKey="hour"
            domain={[new Date('2025-05-06T00:00:00').getTime(), new Date('2025-05-07T00:00:00').getTime()]}
          />
          <YAxis allowDataOverflow type="number" ticks={[0, 80, 180, 220]} />
          <Tooltip cursor={{ 'stroke-dasharray': '3 3' }} />
          <Scatter name="A school" data={[]} fill="#8884d8" />
        </ComposedChart>
      </ResponsiveContainer>
    )
  },
}
