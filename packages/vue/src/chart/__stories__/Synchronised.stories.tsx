import type { StoryObj } from '@storybook/vue3-vite'
import { AreaChart } from '@/chart/AreaChart'
import { BarChart } from '@/chart/BarChart'
import { LineChart } from '@/chart/LineChart'
import { PieChart } from '@/chart/PieChart'
import { RadarChart } from '@/chart/RadarChart'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { Area } from '@/cartesian/area'
import { Bar } from '@/cartesian/bar'
import { Line } from '@/cartesian/line'
import { Brush } from '@/cartesian/brush'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { Pie } from '@/polar/pie'
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar } from '@/polar/radar'
import { RadialBar } from '@/polar/radial-bar'
import { pageData } from '@/storybook/data'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

export default {
  title: 'Examples/Synchronised',
  component: LineChart,
}

function shift<T>(array: T[], amount: number): T[] {
  return [...array.slice(amount), ...array.slice(0, amount)]
}

const data1 = [...pageData]
const data2 = shift(data1, 1)
const data3 = shift(data1, 2)
const data4 = shift(data1, 3)
const data5 = shift(data1, 4)
const data6 = shift(data1, 5)

const green = '#82ca9d'
const purple = '#8884d8'
const blue = '#2c5097'
const red = '#d71e1e'
const orange = '#ff7300'
const pink = '#dd4a98'

const margin = { top: 10, right: 30, left: 0, bottom: 0 }

export const Synchronised: StoryObj = {
  render: () => {
    return (
      <div class="w-full" style={{ width: '100%', margin: '100px 16px' }}>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart width={500} height={200} data={[...data1]} syncId="my-sync-id" margin={margin}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Area type="monotone" dataKey="uv" stroke={green} fill={green} />
            <Brush />
            <Tooltip />
          </AreaChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={200}>
          <BarChart width={500} height={200} data={[...data2]} syncId="my-sync-id" margin={margin}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="pv" stroke={purple} fill={purple} />
            <Brush />
          </BarChart>
        </ResponsiveContainer>

        <p>Maybe some other content</p>

        <ResponsiveContainer width="100%" height={200}>
          <LineChart width={500} height={200} data={[...data3]} syncId="my-sync-id" margin={margin}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Line type="monotone" dataKey="uv" stroke={blue} fill={blue} />
            <Brush />
            <Tooltip />
          </LineChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={200}>
          <PieChart width={500} height={200} syncId="my-sync-id" margin={margin}>
            <Pie data={[...data4]} dataKey="pv" fill={red} />
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={200}>
          <RadarChart width={500} height={200} data={[...data5]} syncId="my-sync-id" margin={margin}>
            <PolarGrid stroke-dasharray="3 3" />
            <PolarRadiusAxis dataKey="uv" type="number" />
            <PolarAngleAxis dataKey="name" type="category" />
            <Radar dataKey="uv" stroke={orange} fill={orange} />
            <Tooltip />
          </RadarChart>
        </ResponsiveContainer>

        <ResponsiveContainer width="100%" height={200}>
          <RadialBarChart width={500} height={200} data={[...data6]} syncId="my-sync-id" margin={margin}>
            <PolarGrid stroke-dasharray="3 3" />
            <PolarRadiusAxis dataKey="name" type="category" />
            <PolarAngleAxis dataKey="pv" type="number" />
            <RadialBar dataKey="pv" stroke={pink} fill={pink} />
            <Tooltip />
          </RadialBarChart>
        </ResponsiveContainer>
      </div>
    )
  },
}

export const SynchronisedWithDataOnItem: StoryObj = {
  render: () => {
    const series = [
      {
        name: 'Series 1',
        data: [
          { x: 0, y: 0 },
          { x: 1, y: 1 },
          { x: 2, y: 2 },
        ],
      },
    ]

    const series2 = [
      {
        name: 'Series 1',
        data: [
          { x: 1, y: 0 },
          { x: 2, y: 1 },
          { x: 3, y: 2 },
        ],
      },
    ]

    return (
      <div>
        <LineChart width={500} height={300} syncId="my-sync-id" syncMethod="index">
          <XAxis dataKey="x" type="number" domain={[0, 3]} />
          <YAxis dataKey="y" />
          <Tooltip cursor={{ stroke: 'red' }} />
          {series.map(s => (
            <Line dataKey="y" data={s.data} name={s.name} key={s.name} />
          ))}
        </LineChart>
        <LineChart width={500} height={300} syncId="my-sync-id" syncMethod="index">
          <XAxis dataKey="x" type="number" domain={[0, 3]} />
          <YAxis dataKey="y" />
          <Tooltip cursor={{ 'stroke': 'red', 'stroke-width': '5px' }} />
          {series2.map(s => (
            <Line dataKey="y" data={s.data} name={s.name} key={s.name} />
          ))}
          <Brush />
        </LineChart>
      </div>
    )
  },
}
