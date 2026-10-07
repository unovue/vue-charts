import type { StoryObj } from '@storybook/vue3-vite'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { ResponsiveContainer } from '@/index'

export default {
  title: 'Examples/EquidistantPreserveEnd',
  component: LineChart,
}

const data = [
  { name: 'Page A', uv: 4000 },
  { name: 'Page B', uv: 3000 },
  { name: 'Page C', uv: 2000 },
  { name: 'Page D', uv: 2780 },
  { name: 'Page E', uv: 1890 },
  { name: 'Page F', uv: 2390 },
  { name: 'Page G', uv: 3490 },
  { name: 'Page H', uv: 2000 },
  { name: 'Page I', uv: 2780 },
  { name: 'Page J', uv: 1890 },
]

export const PreserveEndInterval: StoryObj = {
  render: () => {
    return (
      <div style={{ width: '100%', height: '300px' }}>
        <ResponsiveContainer>
          <LineChart data={data}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" interval="equidistantPreserveEnd" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="uv" stroke="#8884d8" activeDot={{ r: 8 }} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  },
}
