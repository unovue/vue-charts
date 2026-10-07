import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { Bar } from '@/cartesian/bar/Bar'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { ResponsiveContainer } from '@/index'
import { Tooltip } from '@/components/tooltip/Tooltip'
import Legend from '@/components/legend/Legend'
import type { LegendPayload } from '@/types/legend'
import { getStoryArgsFromArgsTypesObject } from '@/storybook/api/props/utils'
import { CategoricalChartProps } from '@/storybook/api/props/chart-props'
import { ErrorBar } from '@/cartesian/error-bar/ErrorBar'
import { Brush } from '@/cartesian/brush/Brush'
import { Rectangle } from '@/shape/Rectangle'
import { LabelList } from '@/components/label/LabelList'
import { numberData, pageData, rangeData } from '@/storybook/data'
import type { ChartData } from '@/types/chartData'

const meta = {
  title: 'examples/BarChart',
  component: BarChart,
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
  },
} satisfies Meta<typeof BarChart>

export default meta
type Story = StoryObj<typeof meta>

const StackedAndDynamicWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const focusedDataKey = ref<string | null>(null)
    const locked = ref(false)

    const onLegendMouseEnter = (payload: LegendPayload) => {
      if (!locked.value) {
        focusedDataKey.value = String(payload.dataKey)
      }
    }

    const onLegendMouseLeave = () => {
      if (!locked.value) {
        focusedDataKey.value = null
      }
    }

    const onLegendClick = (payload: LegendPayload) => {
      if (focusedDataKey.value === String(payload.dataKey)) {
        if (locked.value) {
          focusedDataKey.value = null
          locked.value = false
        }
        else {
          locked.value = true
        }
      }
      else {
        focusedDataKey.value = String(payload.dataKey)
        locked.value = true
      }
    }

    return () => (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...props.args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend onMouseenter={onLegendMouseEnter} onMouseleave={onLegendMouseLeave} onClick={onLegendClick} />
          <Bar
            hide={focusedDataKey.value != null && focusedDataKey.value !== 'pv'}
            dataKey="pv"
            stackId="a"
            fill="#8884d8"
            activeBar={{ fill: 'gold' }}
          />
          <Bar
            hide={focusedDataKey.value != null && focusedDataKey.value !== 'uv'}
            dataKey="uv"
            stackId="a"
            fill="#82ca9d"
            activeBar={{ fill: 'silver' }}
          />
          <Tooltip shared={false} defaultIndex={1} />
        </BarChart>
      </ResponsiveContainer>
    )
  },
})

export const StackedWithErrorBar: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 20,
      right: 30,
      left: 20,
      bottom: 5,
    },
    layout: 'vertical',
  },
  render: (args: Record<string, any>) => {
    // Build pvError data inside render to avoid Storybook freezing the array values in args,
    // which causes Vue proxy invariant errors during deep watch traversal
    const data = (args.data as typeof pageData).map(d => ({ ...d, pvError: [100, 200] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args} data={data}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis type="number" />
          <YAxis dataKey="name" type="category" />
          <Legend />
          <Tooltip />
          <Bar dataKey="pv" stackId="a" fill="#8884d8" />
          <Bar dataKey="uv" stackId="a" fill="#82ca9d">
            <ErrorBar dataKey="pvError" width={5} stroke="red" direction="x" />
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const XAxisTickMarginWithBrushDy: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: numberData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 35,
    },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" tickMargin={30} />
          <YAxis />
          <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
          <Tooltip />
          <Brush dataKey="name" height={30} dy={30} stroke="#8884d8" />
          <Bar dataKey="pv" fill="#8884d8" />
          <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const StackedWithBrush: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 20,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend verticalAlign="top" wrapperStyle={{ lineHeight: '40px' }} />
          <Tooltip defaultIndex={1} />
          <Bar dataKey="pv" stackId="a" fill="#8884d8" activeBar={{ fill: 'gold' }} />
          <Bar dataKey="uv" stackId="a" fill="#82ca9d" activeBar={{ fill: 'silver' }} />
          <Brush dataKey="name" height={30} stroke="#8884d8" />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const HasLabelBasedOnSeparateDataKey: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => {
    const dataWithLabel = (args.data as typeof pageData).map(({ name, uv, pv }) => ({
      name,
      uv,
      pv,
      label: uv > pv ? 'UV greater' : 'PV greater',
    }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args} data={dataWithLabel}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Legend />
          <Tooltip />
          <Bar dataKey="pv" fill="#8884d8" label={{ dataKey: 'label', position: 'top', fill: '#111' }} />
          <Bar dataKey="uv" fill="#82ca9d" />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const NoPadding: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
    barSize: 20,
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <XAxis dataKey="name" scale="point" padding={{ left: 10, right: 10 }} />
          <YAxis />
          <Legend />
          <CartesianGrid stroke-dasharray="3 3" />
          <Bar dataKey="pv" fill="#8884d8" background={{ fill: '#eee' }} />
          <Tooltip />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

const dataWithSmallValuesAndZero = [
  { name: 'Page D', uv: 1397, pv: 0 },
  { name: 'Page E', uv: 0, pv: 1 },
  { name: 'Page F', uv: 1520, pv: 1108 },
  { name: 'Page G', uv: 2, pv: 680 },
]

export const WithMinPointSize: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: dataWithSmallValuesAndZero,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Tooltip />
          <Bar dataKey="pv" fill="purple" minPointSize={(value: number) => (value === 0 ? 0 : 2)} stackId="a" />
          <Bar dataKey="uv" fill="green" minPointSize={(value: number) => (value === 0 ? 0 : 2)} stackId="a" />
          <Bar dataKey="uv" fill="blue" minPointSize={(value: number) => (value === 0 ? 0 : 2)} />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const OneDataPointPercentSize: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: [[4.5, 10]],
    /* When there's only one data point on a numerical domain, we cannot automatically calculate the bar size */
    barSize: '30%',
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <XAxis dataKey={(v: number[]) => v[0]} type="number" domain={[0, 10]} />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Bar dataKey={(v: number[]) => v[1]} />
          <Tooltip />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const RangedBarChart: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
    barSize: '30%',
  },
  render: (args: Record<string, any>) => {
    // Build data inside render to avoid Storybook freezing array values in args,
    // which causes Vue proxy invariant errors during deep watch traversal
    const data = rangeData.map(d => ({ ...d, temperature: [...d.temperature] }))
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args} data={data}>
          <XAxis dataKey="day" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Tooltip />
          <Bar dataKey="temperature" fill="violet" stroke="indigo" />
        </BarChart>
      </ResponsiveContainer>
    )
  },
}

export const CustomCursorBarChart: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <BarChart {...args}>
          <XAxis dataKey="name" />
          <YAxis />
          <CartesianGrid stroke-dasharray="3 3" />
          <Bar dataKey="uv" fill="violet" stroke="indigo" />
          <Tooltip>
            {{
              cursor: (props: any) => <Rectangle {...props} fill="red" fill-opacity={0.6} stroke="#111" />,
            }}
          </Tooltip>
        </BarChart>
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
        <BarChart {...props.args} data={useData2.value ? data2 as unknown as ChartData : data1 as unknown as ChartData}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
          <YAxis dataKey={useData2.value ? dataKey2 : dataKey1} />
          <Tooltip />
          <Legend />
          <Bar
            name="Animated Bar"
            hide={!visible.value}
            type="monotone"
            dataKey={useData2.value ? dataKey2 : dataKey1}
            stroke="#8884d8"
            stroke-dasharray="5 5"
            label={{ fill: 'red' }}
            transition={{ duration: 1 }}
          />
        </BarChart>
      </div>
    )
  },
})

const ChangingDataKeyAndStackedWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
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
        <BarChart {...props.args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" padding={{ left: 30, right: 30 }} />
          <YAxis dataKey="uv" />
          <Tooltip />
          <Legend />
          <Bar
            name="Animated Bar 1"
            hide={!visible.value}
            dataKey={useData2.value ? 'uv' : 'pv'}
            stackId="1"
            stroke="green"
            stroke-dasharray="5 5"
            label={{ fill: 'red' }}
            transition={{
              duration: 3,
            }}
          />
          <Bar
            name="Animated Bar 2"
            hide={!visible.value}
            dataKey={useData2.value ? 'pv' : 'amt'}
            stackId="1"
            stroke="yellow"
            stroke-dasharray="5 5"
            label={{ fill: 'red' }}
            transition={{
              duration: 1,
            }}
          />
        </BarChart>
      </div>
    )
  },
})

export const ChangingDataKeyAndStacked: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 30,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => <ChangingDataKeyAndStackedWrapper args={args} />,
}

export const ChangingDataKey: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    margin: {
      top: 30,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => <ChangingDataKeyWrapper args={args} />,
}

const ChangingDataWrapper = defineComponent({
  props: {
    args: { type: Object, default: () => ({}) },
  },
  setup(props) {
    const data = ref([{ number: 10 }])

    const reset = () => { data.value = [{ number: 10 }] }
    const changeSynchronously = () => { data.value = [{ number: 50 }] }
    const changeAsynchronously = () => {
      data.value = [{ number: 90 }]
      setTimeout(() => { data.value = [{ number: 30 }] }, 150)
    }

    return () => (
      <div style={{ display: 'flex', gap: '4rem', alignItems: 'center' }}>
        <BarChart {...props.args} data={data.value}>
          <YAxis hide domain={[0, 100]} />
          <Bar dataKey="number" fill="chocolate" background={{ fill: 'bisque' }} />
        </BarChart>
        <button type="button" onClick={changeSynchronously}>Change data synchronously</button>
        <button type="button" onClick={changeAsynchronously}>Change data with setTimeout</button>
        <button type="button" onClick={reset}>Reset</button>
      </div>
    )
  },
})

export const ChangingData: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 100,
    height: 100,
  },
  render: (args: Record<string, any>) => <ChangingDataWrapper args={args} />,
}

export const StackedAndDynamic: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 20,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => <StackedAndDynamicWrapper args={args} />,
}

const verticalLabelListData = [
  { label: 'World Trade Organization', value: 74 },
  { label: 'African Development Bank', value: 8 },
  { label: 'International Bank for Reconstruction and Development', value: 5 },
]

export const VerticalWithLabelLists: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 300,
    data: verticalLabelListData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
  render: (args: Record<string, any>) => (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart {...args} layout="vertical">
        <Bar dataKey="value" fill="#aebbae" isAnimationActive={false}>
          <LabelList dataKey="value" position="insideLeft" />
          <LabelList dataKey="label" position="right" />
        </Bar>
        <XAxis dataKey="value" type="number" />
        <YAxis dataKey="label" hide type="category" />
      </BarChart>
    </ResponsiveContainer>
  ),
}
