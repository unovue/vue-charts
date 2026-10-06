import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { Legend } from '@/components/legend'
import { Brush } from '@/cartesian/brush'
import { ReferenceArea } from '@/cartesian/reference-area'
import { ReferenceLine } from '@/cartesian/reference-line'
import { ResponsiveContainer } from '@/index'
import { getStoryArgsFromArgsTypesObject } from '@/storybook/api/props/utils'
import { CategoricalChartProps } from '@/storybook/api/props/chart-props'
import { logData, pageData } from '@/storybook/data'
import type { ChartData } from '@/types/chartData'

const meta = {
  title: 'examples/LineChart',
  component: LineChart,
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Tooltip cursor={{ 'stroke': 'gold', 'stroke-width': 2 }} defaultIndex={3} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const Dashed: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={500}
          height={300}
          data={pageData}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Tooltip defaultIndex={3} active />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" stroke-dasharray="5 5" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" stroke-dasharray="3 4 5 2" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const Vertical: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    layout: 'vertical',
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Legend />
          <Tooltip defaultIndex={4} active />
          <Line dataKey="pv" stroke="#8884d8" />
          <Line dataKey="uv" stroke="#82ca9d" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const BiAxial: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid yAxisId="left" stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis yAxisId="left" />
          <YAxis yAxisId="right" orientation="right" />
          <Legend />
          <Line yAxisId="left" type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line yAxisId="right" type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const VerticalWithSpecifiedDomain: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    layout: 'vertical',
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 20, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis type="number" domain={[0, 'dataMax + 1000']} />
          <YAxis dataKey="name" type="category" />
          <Legend />
          <Line dataKey="pv" stroke="#8884d8" />
          <Line dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

const connectNullsData = [
  { name: 'Page A', uv: 4000 },
  { name: 'Page B', uv: 3000 },
  { name: 'Page C', uv: 2000 },
  { name: 'Page D' },
  { name: 'Page E', uv: 1890 },
  { name: 'Page F', uv: 2390 },
  { name: 'Page G', uv: 3490 },
]

export const ConnectNulls: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 200,
    data: connectNullsData,
    margin: { top: 10, right: 30, left: 0, bottom: 0 },
  },
  render: (args: Record<string, any>) => {
    return (
      <div style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart {...args}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart {...args}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Line connectNulls type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  },
}

export const WithXAxisPadding: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
          <YAxis />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const LineChartHasMultiSeries: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Line dataKey="uv" />
          <Line dataKey="pv" />
          <Line dataKey="amt" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const LineChartAxisInterval: Story = {
  render: () => {
    return (
      <div style={{ width: '100%' }}>
        <LineChart width={200} height={100} data={pageData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" interval="preserveEnd" />
          <YAxis interval="preserveEnd" />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>

        <LineChart width={200} height={100} data={pageData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" interval="preserveStart" />
          <YAxis interval="preserveStart" />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>

        <LineChart width={200} height={100} data={pageData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" interval="preserveStartEnd" />
          <YAxis interval="preserveStartEnd" />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>

        <LineChart width={200} height={100} data={pageData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" interval={0} angle={30} dx={20} />
          <YAxis />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
        </LineChart>
      </div>
    )
  },
}

export const WithBrush: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    data: pageData,
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer>
        <LineChart {...args}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Legend />
          <Brush dataKey="name" startIndex={2} height={30} stroke="#8884d8" />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

const HideOnLegendClickWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const activeSeries = ref<string[]>([])

    const handleLegendClick = (dataKey: any) => {
      if (typeof dataKey !== 'string')
        return
      if (activeSeries.value.includes(dataKey)) {
        activeSeries.value = activeSeries.value.filter(el => el !== dataKey)
      }
      else {
        activeSeries.value = [...activeSeries.value, dataKey]
      }
    }

    return () => (
      <ResponsiveContainer height={400}>
        <LineChart {...props.args}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Legend height={36} iconType="circle" onClick={(p: any) => handleLegendClick(p.dataKey)} />
          <Line hide={activeSeries.value.includes('uv')} type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
          <Line hide={activeSeries.value.includes('pv')} type="monotone" dataKey="pv" stroke="#987" fill="#8884d8" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
})

export const HideOnLegendClick: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    data: pageData,
  },
  render: (args: Record<string, any>) => <HideOnLegendClickWrapper args={args} />,
}

export const LineTrailingIcon: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    data: pageData.map((entry, index) => ({
      ...entry,
      lastDot: index === pageData.length - 1 ? entry.pv : undefined,
    })),
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer>
        <LineChart {...args}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" />
          <Line
            type="monotone"
            dataKey="lastDot"
            legendType="none"
            tooltipType="none"
            dot={{ 'stroke': 'red', 'stroke-width': 1, 'r': 4 }}
          />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const ReversedXAxis: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" reversed />
          <YAxis />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" activeDot={{ r: 8 }} />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
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
        <LineChart {...props.args} data={useData2.value ? data2 as unknown as ChartData : data1 as unknown as ChartData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
          <YAxis dataKey={useData2.value ? dataKey2 : dataKey1} />
          <Tooltip />
          <Legend />
          <Line
            name="Animated line"
            hide={!visible.value}
            type="monotone"
            dataKey={useData2.value ? dataKey2 : dataKey1}
            stroke="#8884d8"
            stroke-dasharray="5 5"
            activeDot={{ r: 8 }}
            label={{ fill: 'red', dy: -25 }}
          />
        </LineChart>
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

const ToggleBetweenDataKeysWrapper = defineComponent({
  setup() {
    const dataKey = ref('pv')

    return () => (
      <div style={{ display: 'flex', flexDirection: 'column', width: '100%', height: '100%' }}>
        <button
          type="button"
          onClick={() => {
            dataKey.value = dataKey.value === 'pv' ? 'uv' : 'pv'
          }}
        >
          Change Data Key
        </button>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart width={500} height={400} data={pageData}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Line type="monotone" dataKey={dataKey.value} stroke="#8884d8" activeDot={{ r: 8 }} />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  },
})

export const ToggleBetweenDataKeys: Story = {
  render: () => <ToggleBetweenDataKeysWrapper />,
}

export const WithReferenceLines: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    data: pageData,
    width: 500,
    height: 300,
    margin: { top: 20, right: 50, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <ReferenceLine x="Page C" stroke="red" label="Anything" />
          <ReferenceLine y={1600} label="Something" stroke="red" />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const WithCustomizedDot: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    const CustomizedDot = (props: any) => {
      const { cx, cy, value } = props

      if (value >= 800) {
        return (
          <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="red" viewBox="0 0 1024 1024">
            <path
              d={
                'M512 1009.984c-274.912 0-497.76-222.848-497.76-497.76s222.848-497.76 497.76-497.76'
                + 'c274.912 0 497.76 222.848 497.76 497.76s-222.848 497.76-497.76 497.76zM340.768 '
                + '295.936c-39.488 0-71.52 32.8-71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-'
                + '32.8 71.52-73.248s-32.032-73.248-71.52-73.248zM686.176 296.704c-39.488 0-71.52 32.8-'
                + '71.52 73.248s32.032 73.248 71.52 73.248c39.488 0 71.52-32.8 71.52-73.248s-32.032-'
                + '73.248-71.52-73.248zM772.928 555.392c-18.752-8.864-40.928-0.576-49.632 18.528-40.224 '
                + '88.576-120.256 143.552-208.832 143.552-85.952 0-164.864-52.64-205.952-137.376-9.184-'
                + '18.912-31.648-26.592-50.08-17.28-18.464 9.408-21.216 21.472-15.936 32.64 52.8 111.424 '
                + '155.232 186.784 269.76 186.784 117.984 0 217.12-70.944 269.76-186.784 8.672-19.136 '
                + '9.568-31.2-9.12-40.096z'
              }
            />
          </svg>
        )
      }

      return (
        <svg x={cx - 10} y={cy - 10} width={20} height={20} fill="green" viewBox="0 0 1024 1024">
          <path
            d={
              'M517.12 53.248q95.232 0 179.2 36.352t145.92 98.304 98.304 145.92 36.352 179.2-36.352 179.2'
              + '-98.304 145.92-145.92 98.304-179.2 36.352-179.2-36.352-145.92-98.304-98.304-145.92-36.352-'
              + '179.2 36.352-179.2 98.304-145.92 145.92-98.304 179.2-36.352zM663.552 261.12q-15.36 0-28.16 '
              + '6.656t-23.04 18.432-15.872 27.648-5.632 33.28q0 35.84 21.504 61.44t51.2 25.6 51.2-25.6 21.504'
              + '-61.44q0-17.408-5.632-33.28t-15.872-27.648-23.04-18.432-28.16-6.656zM373.76 261.12q-29.696 0-'
              + '50.688 25.088t-20.992 60.928 20.992 61.44 50.688 25.6 50.176-25.6 20.48-61.44-20.48-60.928-'
              + '50.176-25.088zM520.192 602.112q-51.2 0-97.28 9.728t-82.944 27.648-62.464 41.472-35.84 51.2q-'
              + '1.024 1.024-1.024 2.048-1.024 3.072-1.024 8.704t2.56 11.776 7.168 11.264 12.8 6.144q25.6-27.648'
              + ' 62.464-50.176 31.744-19.456 79.36-35.328t114.176-15.872q67.584 0 116.736 15.872t81.92 35.328q'
              + '37.888 22.528 63.488 50.176 17.408-5.12 19.968-18.944t0.512-18.944-3.072-7.168-1.024-3.072q-'
              + '26.624-55.296-100.352-88.576t-176.128-33.28z'
            }
          />
        </svg>
      )
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8">
            {{ dot: (props: any) => <CustomizedDot {...props} /> }}
          </Line>
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const ClipDot: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    clipDot: false,
  },
  render: (args: Record<string, any>) => {
    const clipDotData = [...pageData, { name: 'Page H', pv: 0 }, { name: 'Page I', uv: 0 }]
    return (
      <ResponsiveContainer width="100%" height={300}>
        <LineChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          data={clipDotData}
        >
          <Line
            isAnimationActive={false}
            dataKey="uv"
            dot={{ 'clipDot': args.clipDot, 'r': 4, 'stroke-width': 2, 'fill': '#ffffff', 'fill-opacity': 1 }}
          />
          <Line
            isAnimationActive={false}
            dataKey="pv"
            dot={{ clipDot: args.clipDot, r: 10 }}
          />
          <XAxis dataKey="name" allowDataOverflow />
          <YAxis allowDataOverflow />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const LogarithmicYAxis: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: logData,
    margin: { top: 20, right: 30, left: 50, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="year" />
          <YAxis
            scale="symlog"
            ticks={[0, 10, 100, 1000, 10000, 100000, 1000000, 10000000, 100000000, 1000000000, 10000000000]}
          />
          <Tooltip defaultIndex={1} />
          <Line
            type="monotone"
            dataKey="performance"
            name="Performance"
            stroke="#75ABBC"
            stroke-width={3}
            activeDot={{ r: 8 }}
            unit=" KFLOPS"
          />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const NegativeValuesWithReferenceLines: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    const data = [
      { x: -50, y: -50 },
      { x: 0, y: 0 },
      { x: 50, y: 50 },
      { x: 100, y: 100 },
      { x: 150, y: 150 },
      { x: 200, y: 200 },
      { x: 250, y: 250 },
      { x: 350, y: 350 },
      { x: 400, y: 400 },
      { x: 450, y: 450 },
      { x: 500, y: 500 },
    ]

    const minX = Math.min(...data.map(d => d.x))
    const minY = Math.min(...data.map(d => d.y))

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />

          <YAxis
            dataKey="y"
            domain={['auto', 'auto']}
            type="number"
            interval={0}
            label={{
              value: 'y',
              style: { textAnchor: 'middle' },
              angle: -90,
              position: 'left',
              offset: 0,
            }}
            allowDataOverflow
            stroke-width={minX < 0 ? 0 : 1}
          />

          <XAxis
            dataKey="x"
            domain={['auto', 'auto']}
            interval={0}
            type="number"
            label={{
              key: 'xAxisLabel',
              value: 'x',
              position: 'bottom',
            }}
            allowDataOverflow
            stroke-width={minY < 0 ? 0 : 1}
          />

          {minY < 0 && <ReferenceLine y={0} stroke="gray" stroke-width={1.5} stroke-opacity={0.65} />}
          {minX < 0 && <ReferenceLine x={0} stroke="gray" stroke-width={1.5} stroke-opacity={0.65} />}

          <Line stroke-width={2} data={data} dot={false} type="monotone" dataKey="y" stroke="black" tooltipType="none" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const UndefinedEventHandlers: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 5, right: 30, left: 20, bottom: 5 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Line
            type="monotone"
            dataKey="pv"
            stroke="#8884d8"
            activeDot={{ r: 8 }}
            onMouseenter={undefined}
            onMouseleave={undefined}
          />
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

const activeDotExcludedDomainData = [
  { timestamp: 0.9, pv: 120 },
  { timestamp: 1.3, pv: 160 },
]

export const ActiveDotExcludedFromDomain: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 480,
    height: 260,
    data: activeDotExcludedDomainData,
    margin: { top: 20, right: 36, left: 36, bottom: 16 },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={[1.01, 1.15]}
            allowDataOverflow
          />
          <YAxis type="number" domain={[80, 200]} allowDataOverflow />
          <Tooltip cursor={{ 'stroke': '#999', 'stroke-width': 1 }} />
          <Line type="monotone" dataKey="pv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const WithCustomizedLabel: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: { top: 20, right: 30, left: 20, bottom: 10 },
  },
  render: (args: Record<string, any>) => {
    const CustomizedLabel = (props: any) => {
      const { x, y, stroke, value } = props
      return (
        <text x={x} y={y} dy={-4} fill={stroke} font-size={10} text-anchor="middle">
          {value}
        </text>
      )
    }

    const CustomizedAxisTick = (props: any) => {
      const { x, y, value } = props
      return (
        <g transform={`translate(${x},${y})`}>
          <text x={0} y={0} dy={16} text-anchor="end" fill="#666" transform="rotate(-35)">
            {value}
          </text>
        </g>
      )
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" height={60}>
            {{ tick: (tickProps: any) => <CustomizedAxisTick {...tickProps} /> }}
          </XAxis>
          <YAxis />
          <Legend />
          <Line type="monotone" dataKey="pv" stroke="#8884d8">
            {{ label: (labelProps: any) => <CustomizedLabel {...labelProps} stroke="#8884d8" /> }}
          </Line>
          <Line type="monotone" dataKey="uv" stroke="#82ca9d" />
          <Tooltip />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

const impressionsData = [
  { name: 1, cost: 4.11, impression: 100 },
  { name: 2, cost: 2.39, impression: 120 },
  { name: 3, cost: 1.37, impression: 150 },
  { name: 4, cost: 1.16, impression: 180 },
  { name: 5, cost: 2.29, impression: 200 },
  { name: 6, cost: 3, impression: 499 },
  { name: 7, cost: 0.53, impression: 50 },
  { name: 8, cost: 2.52, impression: 100 },
  { name: 9, cost: 1.79, impression: 200 },
  { name: 10, cost: 2.94, impression: 222 },
  { name: 11, cost: 4.3, impression: 210 },
  { name: 12, cost: 4.41, impression: 300 },
  { name: 13, cost: 2.1, impression: 50 },
  { name: 14, cost: 8, impression: 190 },
  { name: 15, cost: 0, impression: 300 },
  { name: 16, cost: 9, impression: 400 },
  { name: 17, cost: 3, impression: 200 },
  { name: 18, cost: 2, impression: 50 },
  { name: 19, cost: 3, impression: 100 },
  { name: 20, cost: 7, impression: 100 },
]

type HighlightAndZoomState = {
  left: string | number
  right: string | number
  refAreaLeft: string | number | undefined
  refAreaRight: string | number | undefined
  top: string | number
  bottom: string | number
  top2: string | number
  bottom2: string | number
}

const highlightInitialState: HighlightAndZoomState = {
  left: 'dataMin',
  right: 'dataMax',
  refAreaLeft: undefined,
  refAreaRight: undefined,
  top: 'dataMax+1',
  bottom: 'dataMin-1',
  top2: 'dataMax+20',
  bottom2: 'dataMin-20',
}

function getAxisYDomain(
  from: string | number | undefined,
  to: string | number | undefined,
  ref: 'cost' | 'impression',
  offset: number,
): (number | string)[] {
  if (from != null && to != null) {
    const refData = impressionsData.slice(Number(from) - 1, Number(to))
    let [bottom, top] = [refData[0][ref], refData[0][ref]]
    refData.forEach((d) => {
      if (d[ref] > top)
        top = d[ref]
      if (d[ref] < bottom)
        bottom = d[ref]
    })
    return [(bottom | 0) - offset, (top | 0) + offset]
  }
  return [highlightInitialState.bottom, highlightInitialState.top]
}

const HighlightAndZoomWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const state = ref<HighlightAndZoomState>({ ...highlightInitialState })

    const zoom = () => {
      let { refAreaLeft, refAreaRight } = state.value
      if (refAreaLeft === refAreaRight || refAreaRight === '') {
        state.value = { ...state.value, refAreaLeft: undefined, refAreaRight: undefined }
        return
      }
      if (refAreaLeft && refAreaRight && refAreaLeft > refAreaRight) {
        ;[refAreaLeft, refAreaRight] = [refAreaRight, refAreaLeft]
      }
      const [bottom, top] = getAxisYDomain(refAreaLeft, refAreaRight, 'cost', 1)
      const [bottom2, top2] = getAxisYDomain(refAreaLeft, refAreaRight, 'impression', 50)
      state.value = {
        ...state.value,
        refAreaLeft: undefined,
        refAreaRight: undefined,
        left: refAreaLeft ?? highlightInitialState.left,
        right: refAreaRight ?? highlightInitialState.right,
        bottom,
        top,
        bottom2,
        top2,
      }
    }

    const zoomOut = () => {
      state.value = { ...highlightInitialState }
    }

    return () => {
      const { left, right, refAreaLeft, refAreaRight, top, bottom, top2, bottom2 } = state.value
      return (
        <div style={{ userSelect: 'none', width: '100%' }}>
          <button type="button" onClick={zoomOut}>
            Zoom Out
          </button>
          <ResponsiveContainer minHeight={500}>
            <LineChart
              {...props.args}
              data={impressionsData}
              onMousedown={(e: any) => {
                if (e?.activeLabel != null) {
                  state.value = { ...state.value, refAreaLeft: e.activeLabel }
                }
              }}
              onMousemove={(e: any) => {
                if (state.value.refAreaLeft && e?.activeLabel != null) {
                  state.value = { ...state.value, refAreaRight: e.activeLabel }
                }
              }}
              onMouseup={zoom}
            >
              <CartesianGrid yAxisId="1" stroke-dasharray="3 3" />
              <XAxis allowDataOverflow dataKey="name" domain={left && right ? [left, right] : undefined} type="number" />
              <YAxis allowDataOverflow domain={[bottom, top]} type="number" yAxisId="1" />
              <YAxis orientation="right" allowDataOverflow domain={[bottom2, top2]} type="number" yAxisId="2" />
              <Line yAxisId="1" type="natural" dataKey="cost" stroke="#8884d8" transition={{ duration: 0.3 }} />
              <Line yAxisId="2" type="natural" dataKey="impression" stroke="#82ca9d" transition={{ duration: 0.3 }} />
              {refAreaLeft && refAreaRight
                ? (
                    <ReferenceArea yAxisId="1" x1={refAreaLeft} x2={refAreaRight} stroke-opacity={0.3} />
                  )
                : null}
              <Tooltip />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )
    }
  },
})

export const HighlightAndZoom: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 800,
    height: 400,
  },
  render: (args: Record<string, any>) => <HighlightAndZoomWrapper args={args} />,
}

const ToggleChildrenWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const isBtnClicked = ref(false)

    return () => (
      <div>
        <button data-testid="toggle" type="button" onClick={() => { isBtnClicked.value = !isBtnClicked.value }}>
          Click Me to Simulate Legend
        </button>
        <LineChart {...props.args} data={pageData}>
          <CartesianGrid stroke-dasharray="3 3" />
          {isBtnClicked.value
            ? null
            : (
                <>
                  <XAxis
                    dataKey="name"
                    type="category"
                    allowDuplicatedCategory={false}
                    interval={0}
                    ticks={['Page A', 'Page C', 'Page F']}
                    tick={{ fontSize: 14 }}
                    tickMargin={25}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    orientation="left"
                    dataKey="pv"
                    yAxisId="one"
                    tick={{ fill: '#555', fontSize: 16 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    orientation="left"
                    dataKey="uv"
                    yAxisId="two"
                    tick={{ fill: '#555', fontSize: 16 }}
                  />
                  <Line
                    name="PV"
                    type="monotone"
                    dataKey="pv"
                    stroke="#8884d8"
                    activeDot={{ r: 8 }}
                    yAxisId="one"
                    dot={false}
                  />
                  <Line
                    name="UV"
                    type="monotone"
                    dataKey="uv"
                    stroke="#82ca9d"
                    yAxisId="two"
                    dot={false}
                  />
                  <Tooltip />
                  <Legend />
                </>
              )}
        </LineChart>
      </div>
    )
  },
})

export const ToggleChildrenComponentsExceptCartesianGrid: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    data: pageData,
    width: 1300,
    height: 400,
    margin: { right: 30, bottom: 40 },
    layout: 'horizontal',
  },
  render: (args: Record<string, any>) => <ToggleChildrenWrapper args={args} />,
}
