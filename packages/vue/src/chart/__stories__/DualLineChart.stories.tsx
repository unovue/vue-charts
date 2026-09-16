import type { StoryObj } from '@storybook/vue3-vite'
import { scaleTime } from 'd3-scale'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/Tooltip'
import { Legend } from '@/components/legend'
import { ResponsiveContainer } from '@/index'

export default {
  title: 'Examples/LineChart/DualLineChart',
  component: LineChart,
}

// Data for Series 1
const data1 = [
  { x: '2022-12-22', y: 19.4 },
  { x: '2023-01-02', y: 28.1 },
  { x: '2023-01-10', y: 27.3 },
  { x: '2023-01-16', y: 30.5 },
  { x: '2023-01-23', y: 28 },
  { x: '2023-01-31', y: 29.3 },
  { x: '2023-02-08', y: 33.2 },
  { x: '2023-02-13', y: 37.3 },
  { x: '2023-02-21', y: 38.3 },
  { x: '2023-03-10', y: 40 },
]

// Data for Series 2
const data2 = [
  { x: '2023-01-05', y: 22.0 },
  { x: '2023-01-10', y: 24.9 },
  { x: '2023-01-18', y: 27.8 },
  { x: '2023-01-24', y: 31.9 },
  { x: '2023-02-03', y: 32.2 },
  { x: '2023-02-07', y: 31.6 },
  { x: '2023-02-09', y: 36.6 },
  { x: '2023-02-17', y: 33.8 },
  { x: '2023-02-24', y: 37.3 },
  { x: '2023-03-06', y: 45 },
  { x: '2023-03-13', y: 45.6 },
  { x: '2023-03-16', y: 44.5 },
]

const moment = (str: string) => new Date(str).getTime()

// Merge the two data series into one array by timestamp.
function mergeDataSeries(series1: { x: string, y: number }[], series2: { x: string, y: number }[]) {
  const dataMap: Map<number, { x: number, y1?: number, y2?: number }> = new Map()

  series1.forEach((item) => {
    const time = moment(item.x).valueOf()
    if (!dataMap.has(time)) {
      dataMap.set(time, { x: time })
    }
    dataMap.get(time)!.y1 = item.y
  })

  series2.forEach((item) => {
    const time = moment(item.x).valueOf()
    if (!dataMap.has(time)) {
      dataMap.set(time, { x: time })
    }
    dataMap.get(time)!.y2 = item.y
  })

  return Array.from(dataMap.values()).sort((a, b) => a.x - b.x)
}

// Helper to format a date
const monthFormat = (timestamp: number): string => new Date(timestamp).toLocaleString('en-US', { month: 'short' })

// Convert a date string to a timestamp (number)
function convertDateStringToTimeValue(dateString: string): number {
  return new Date(dateString).getTime()
}

function getXAxisArgsForTimeBasedGraph(dateStrings: string[]) {
  if (!dateStrings.length) {
    return {}
  }
  const numericValues = dateStrings.map(convertDateStringToTimeValue)
  const maxValue = Math.max(...numericValues)
  const minValue = Math.min(...numericValues)

  const timeScale = scaleTime().domain([minValue, maxValue]).nice()
  const ticks = timeScale.ticks(5).map(d => d.valueOf())

  return {
    domain: timeScale.domain().map(d => d.valueOf()),
    scale: timeScale as any,
    type: 'number' as const,
    ticks,
    tickFormatter: monthFormat,
  }
}

const mergedGraphData = mergeDataSeries(data1, data2)

// Create a union of all date strings for the X-axis.
const allDatesSet = new Set<string>([
  ...data1.map(d => `${d.x}T00:00:00.000Z`),
  ...data2.map(d => `${d.x}T00:00:00.000Z`),
])
const allDates = Array.from(allDatesSet)

export const DualLineChart: StoryObj = {
  render: () => {
    return (
      <div style={{ width: '100%', height: '400px' }}>
        <ResponsiveContainer>
          <LineChart
            width={500}
            height={300}
            data={mergedGraphData}
            margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
          >
            <CartesianGrid stroke-dasharray="2 5" />
            <XAxis
              axisLine={false}
              stroke="#333"
              dataKey="x"
              fontSize={12}
              dy={10}
              tickLine={false}
              {...getXAxisArgsForTimeBasedGraph(allDates)}
            />
            <YAxis />
            <Legend />
            <Line type="monotone" dataKey="y1" stroke="red" dot name="Series 1" connectNulls activeDot={false} />
            <Line type="monotone" dataKey="y2" stroke="blue" name="Series 2" connectNulls activeDot={false} dot />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  },
}
