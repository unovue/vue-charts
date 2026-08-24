import type { StoryObj } from '@storybook/vue3-vite'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/Tooltip'

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
 * The `responsive` prop makes the chart fill its parent via CSS and measure itself
 * with a ResizeObserver — no `ResponsiveContainer` wrapper needed.
 */
export const Responsive: StoryObj = {
  render: () => {
    return (
      <div style={{ width: '100%', height: '300px' }}>
        <LineChart responsive data={[...data]}>
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
