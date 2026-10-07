import type { Meta, StoryContext, StoryObj } from '@storybook/vue3-vite'
import { AreaChart } from '@/chart/AreaChart'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { Area, ResponsiveContainer } from '@/index'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { curveCardinal } from 'd3-shape'
import { Fragment, markRaw, ref } from 'vue'
import type { LegendPayload } from '@/components/DefaultLegendContent'
import Legend from '@/components/legend/Legend'
import type { LegendContentProps } from '@/components/legend/type'
import type { ActivePointSlotProps } from '@/cartesian/ActivePoints'
import { getStoryArgsFromArgsTypesObject } from '@/storybook/api/props/utils'
import { CategoricalChartProps } from '@/storybook/api/props/chart-props'
import { pageData } from '@/storybook/data'

const meta = {
  title: 'examples/AreaChart',
  component: AreaChart,
  argTypes: {
    width: { control: 'number' },
    height: { control: 'number' },
    dataKey: { control: 'text' },
    margin: { control: 'object' },
  },
} satisfies Meta<typeof AreaChart>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
  render: (args: Record<string, any>, context: StoryContext) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args as any}>
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
          <Tooltip />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
}

export const StackedAreaChart = {
  render: (args: Record<string, any>, context: StoryContext) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
          <Tooltip active defaultIndex={2} />
          <Legend />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const TinyAreaChart = {
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 200,
    height: 60,
    data: pageData,
    margin: {
      top: 5,
      right: 0,
      left: 0,
      bottom: 5,
    },
  },
}

export const PercentAreaChart = {
  render: (args: Record<string, any>) => {
    const toPercent = (decimal: number, fixed = 0) => {
      return `${(decimal * 100).toFixed(fixed)}%`
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis tickFormatter={toPercent} />
          <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
          <Tooltip defaultIndex={3} active />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    stackOffset: 'expand',
    margin: {
      top: 10,
      right: 30,
      left: 20,
      bottom: 20,
    },
  },
}

export const CardinalAreaChart = {
  render: (args: Record<string, any>) => {
    const cardinal = curveCardinal.tension(0.2)

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
          <Area type={cardinal} dataKey="uv" stroke="#82ca9d" fill="#82ca9d" fillOpacity={0.3} />
          <Tooltip />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const AreaChartConnectNulls = {
  render: (args: Record<string, any>) => {
    return (
      <div style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Area connectNulls type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 200,
    data: [
      {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
      },
      {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
      },
      {
        name: 'Page C',
        uv: 2000,
        pv: 9800,
        amt: 2290,
      },
      {
        name: 'Page D',
        pv: 3908,
        amt: 2000,
      },
      {
        name: 'Page E',
        uv: 1890,
        pv: 4800,
        amt: 2181,
      },
      {
        name: 'Page F',
        uv: 2390,
        pv: 3800,
        amt: 2500,
      },
      {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
      },
    ],
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const StackedAreaChartConnectNulls = {
  render: (args: Record<string, any>) => {
    return (
      <div style={{ width: '100%' }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            <Area type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
          </AreaChart>
        </ResponsiveContainer>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Area connectNulls type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
            <Area connectNulls type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
            <Area connectNulls type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 200,
    data: [
      {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
      },
      {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
      },
      {
        name: 'Page C',
        uv: 2000,
        pv: 9800,
        amt: 2290,
      },
      {
        name: 'Page D',
        pv: 3908,
        amt: 2000,
      },
      {
        name: 'Page E',
        uv: 1890,
        pv: 4800,
        amt: 2181,
      },
      {
        name: 'Page F',
        uv: 2390,
        pv: 3800,
        amt: 2500,
      },
      {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
      },
    ],
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const SynchronisedAreaChart = {
  render: (args: Record<string, any>) => {
    return (
      <div style={{ width: '100%' }}>
        <h4>A demo of synchronized AreaCharts</h4>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Area type="monotone" dataKey="uv" stroke="#8884d8" fill="#8884d8" />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
        <p>Maybe some other content</p>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart {...args}>
            <CartesianGrid
              stroke-dasharray="3 3"
            />
            <XAxis dataKey="name" />
            <YAxis />
            <Area type="monotone" dataKey="pv" stroke="#82ca9d" fill="#82ca9d" />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 200,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
    syncId: 'anyId',
  },
}

export const AreaChartFillByValue = {
  render: (args: Record<string, any>) => {
    const gradientOffset = () => {
      const dataMax = Math.max(...args.data.map((i: any) => i.uv))
      const dataMin = Math.min(...args.data.map((i: any) => i.uv))

      if (dataMax <= 0) {
        return 0
      }
      if (dataMin >= 0) {
        return 1
      }

      return dataMax / (dataMax - dataMin)
    }

    const off = gradientOffset()

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <defs>
            <linearGradient id="splitColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset={off} stop-color="green" stop-opacity={1} />
              <stop offset={off} stop-color="red" stop-opacity={1} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="uv" stroke="#000" fill="url(#splitColor)" />
          <Tooltip />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: [
      {
        name: 'Page A',
        uv: 4000,
        pv: 2400,
        amt: 2400,
      },
      {
        name: 'Page B',
        uv: 3000,
        pv: 1398,
        amt: 2210,
      },
      {
        name: 'Page C',
        uv: -1000,
        pv: 9800,
        amt: 2290,
      },
      {
        name: 'Page D',
        uv: 500,
        pv: 3908,
        amt: 2000,
      },
      {
        name: 'Page E',
        uv: -2000,
        pv: 4800,
        amt: 2181,
      },
      {
        name: 'Page F',
        uv: -250,
        pv: 3800,
        amt: 2500,
      },
      {
        name: 'Page G',
        uv: 3490,
        pv: 4300,
        amt: 2100,
      },
    ],
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

const rangeData = markRaw([
  {
    day: '05-01',
    temperature: [-1, 10],
  },
  {
    day: '05-02',
    temperature: [2, 15],
  },
  {
    day: '05-03',
    temperature: [3, 12],
  },
  {
    day: '05-04',
    temperature: [4, 12],
  },
  {
    day: '05-05',
    temperature: [12, 16],
  },
  {
    day: '05-06',
    temperature: [5, 16],
  },
  {
    day: '05-07',
    temperature: [3, 12],
  },
  {
    day: '05-08',
    temperature: [0, 8],
  },
  {
    day: '05-09',
    temperature: [-3, 5],
  },
])
export const RangedAreaChart = {
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <XAxis dataKey="day" />
          <YAxis />
          <Area dataKey="temperature" stroke="#d82428" fill="#8884d8" />
          <Tooltip defaultIndex={4} active />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: rangeData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

const rangeData2 = [
  { timeHorizon: 1, range: [-2.1, 12.6] },
  { timeHorizon: 3, range: [1, 9.5] },
  { timeHorizon: 5, range: [2, 8.5] },
  { timeHorizon: 10, range: [2.9, 7.6] },
  { timeHorizon: 15, range: [3.4, 7.1] },
]

export const RangedAreaChartWithGradient = {
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={rangeData2} width={1000} height={600} margin={{ top: 20, right: 200, bottom: 20, left: 20 }}>
          <defs>
            <linearGradient id="fill-gradient" gradientTransform="rotate(90)">
              <stop offset="5%" stop-color="green" stop-opacity={1} />
              <stop offset={0.86} stop-color="green" stop-opacity={0.1} />
              <stop offset={0.86} stop-color="red" stop-opacity={0.1} />
              <stop offset="95%" stop-color="red" stop-opacity={1} />
            </linearGradient>
          </defs>
          <Area type="monotone" dataKey="range" fill="url(#fill-gradient)" stroke="none" />
          <XAxis
            dataKey="timeHorizon"
            type="number"
            domain={[1, 'dataMax']}
            axisLine={false}
            ticks={[1, 3, 5, 10, 15]}
            unit=" yr"
          />
          <YAxis
            domain={[-5, 15]}
            tickCount={5}
            unit="%"
          />
          <Tooltip />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
  },
}

export const WithChangingDataKeyAndAnimations = {
  render: (args: Record<string, any>) => {
    const currentValue = ref('uv')
    const setCurrentValue = (value: string) => {
      currentValue.value = value
    }

    return (
      <Fragment>
        <form
          style={{ display: 'flex', flexDirection: 'column' }}
          onChange={(e: Event) => {
            const target = e.target as HTMLInputElement
            if ('value' in target && typeof target.value === 'string') {
              setCurrentValue(target.value)
            }
          }}
        >
          <label for="dataKey-uv" style={{ display: 'flex', flexDirection: 'row' }}>
            <input type="radio" id="dataKey-uv" name="dataKey" value="uv" default-checked={currentValue.value === 'uv'} />
            dataKey=uv
          </label>
          <label for="dataKey-pv" style={{ display: 'flex', flexDirection: 'row' }}>
            <input type="radio" id="dataKey-pv" name="dataKey" value="pv" default-checked={currentValue.value === 'pv'} />
            dataKey=pv
          </label>
          <label for="dataKey-empty" style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              type="radio"
              id="dataKey-empty"
              name="dataKey"
              value="hidden"
              default-checked={currentValue.value === 'hidden'}
            />
            Hidden
          </label>
        </form>
        <ResponsiveContainer width="100%">
          <AreaChart {...args}>
            <Legend />
            <XAxis dataKey="name" />
            <YAxis />
            <Area dataKey={currentValue.value} label={{ fill: 'green' }} dot={true} />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>
      </Fragment>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const StackedAreaWithCustomLegend = {
  // Reproducing https://github.com/recharts/recharts/issues/5992
  render: (args: Record<string, any>) => {
    const hiddenItems = ref<ReadonlyArray<string>>([])
    const handleClick = ({ dataKey }: LegendPayload) => {
      if (typeof dataKey !== 'string') {
        return
      }
      hiddenItems.value = hiddenItems.value.includes(dataKey) ? hiddenItems.value.filter(key => key !== dataKey) : [...hiddenItems.value, dataKey]
    }

    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args} stackOffset="silhouette">
          <CartesianGrid
            stroke-dasharray="3 3"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <Area
            type="monotone"
            dataKey="uv"
            stackId="1"
            stroke="#8884d8"
            strokeWidth={3}
            fill="rgba(136,132,216,0.47)"
            hide={hiddenItems.value.includes('uv')}
          />
          <Area
            type="monotone"
            dataKey="pv"
            stackId="1"
            stroke="#82ca9d"
            strokeWidth={3}
            fill="rgba(130,202,157,0.47)"
            hide={hiddenItems.value.includes('pv')}
          />
          <Area
            type="monotone"
            dataKey="amt"
            stackId="1"
            stroke="#ffc658"
            strokeWidth={3}
            fill="rgba(255,198,88,0.47)"
            hide={hiddenItems.value.includes('amt')}
          />
          <Legend>
            {{
              content: ({ payload }: LegendContentProps) => {
                return (
                  <ul style={{ display: 'flex', flexDirection: 'row', listStyleType: 'none', padding: 0 }}>
                    {payload.map((entry, index) => (
                      <li key={`item-${index}`} style={{ color: entry.color }}>
                        <button
                          type="button"
                          onClick={() => handleClick(entry)}
                          style={{
                            background: 'none',
                            border: entry.inactive ? '3px solid #ccc' : `3px solid ${entry.color}`,
                            borderRadius: '20%',
                            padding: '10px',
                            cursor: 'pointer',
                            opacity: typeof entry.dataKey === 'string' && hiddenItems.value.includes(entry.dataKey) ? 0.2 : 1,
                          }}
                        >
                          {entry.value}
                        </button>
                      </li>
                    ))}
                  </ul>
                )
              },
            }}
          </Legend>
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const CustomizedActiveDot = {
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart {...args}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Area
            type="monotone"
            dataKey="uv"
            stroke="#ff7300"
            fill="#ff7300"
            fillOpacity={0.6}
          >
            {{
              activeDot: ({ cx, cy }: ActivePointSlotProps) => <circle cx={cx} cy={cy} r={10} class="customized-active-dot" fill="#ff7300" />,
            }}
          </Area>
          {/* activeDot={({ cx, cy }) => <ActiveDot cx={cx} cy={cy} />} */}
          <Tooltip />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 400,
    data: pageData,
    margin: {
      top: 10,
      right: 30,
      left: 0,
      bottom: 0,
    },
  },
}

export const Test = {
  render: (args: Record<string, any>) => {
    const toPercent = (decimal: number, fixed = 0) => `${(decimal * 100).toFixed(fixed)}%`

    return (
      <ResponsiveContainer width="100%" height={200}>
        <AreaChart width={100} height={50} data={args.data}>
          <Area isAnimationActive={false} type="monotone" dot label dataKey="uv" stroke="#ff7300" fill="#ff7300" />
        </AreaChart>
      </ResponsiveContainer>
    )
  },
  args: {
    ...getStoryArgsFromArgsTypesObject(CategoricalChartProps),
    width: 500,
    height: 500,
    data: [
      { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
      { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
      { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
      { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
      { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
      { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
    ],
  },
}
