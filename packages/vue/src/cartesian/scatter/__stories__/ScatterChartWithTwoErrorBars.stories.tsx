import type { StoryObj } from '@storybook/vue3-vite'
import { ScatterChart } from '@/chart/ScatterChart'
import { Scatter } from '@/cartesian/scatter'
import { ErrorBar } from '@/cartesian/error-bar'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/tooltip/Tooltip'

export default {
  title: 'Examples/ScatterChartWithTwoErrorBars',
  component: ScatterChart,
}

type Story = StoryObj

const data = [
  { x: 100, y: 200, errorY: 30, errorX: 30 },
  { x: 120, y: 100, errorY: [500, 30], errorX: [200, 30] },
  { x: 170, y: 300, errorY: [10, 20], errorX: 20 },
  { x: 140, y: 250, errorY: 30, errorX: 20 },
  { x: 150, y: 400, errorY: [20, 300], errorX: 30 },
  { x: 110, y: 280, errorY: 40, errorX: 40 },
]

export const WithErrorBarsAndExtendedDomain: Story = {
  render: (args: Record<string, any>) => {
    return (
      <ScatterChart
        width={400}
        height={400}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <CartesianGrid />
        <XAxis type="number" dataKey="x" name="stature" unit="cm" />
        <YAxis type="number" dataKey="y" name="weight" unit="kg" />
        <Scatter name="A school" data={[...data]} fill="blue">
          <ErrorBar dataKey="errorX" width={2} strokeWidth={3} stroke="green" direction="x" />
          <ErrorBar dataKey="errorY" width={4} strokeWidth={2} stroke="red" direction="y" />
        </Scatter>
        <Tooltip cursor={{ 'stroke-dasharray': '3 3' }} />
      </ScatterChart>
    )
  },
}
