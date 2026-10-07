import type { StoryObj } from '@storybook/vue3-vite'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import { Tooltip } from '@/components/tooltip/Tooltip'

export default {
  title: 'Examples/ResponsiveProp',
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
]

/**
 * Charts with no numeric dimensions fill their parent via CSS and measure themselves
 * with a ResizeObserver — no `ResponsiveContainer` wrapper needed.
 */
export const Responsive: StoryObj = {
  render: () => {
    return (
      <div style={{ width: '100%', height: '300px' }}>
        <LineChart data={[...data]}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey="uv" stroke="#f97316" activeDot={{ r: 8 }} />
        </LineChart>
      </div>
    )
  },
}
