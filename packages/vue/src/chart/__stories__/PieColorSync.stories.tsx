import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import { Sector } from '@/shape/Sector'
import Legend from '@/components/legend/Legend'
import { Tooltip } from '@/components/tooltip/Tooltip'
import type { PieSectorDataItem } from '@/core/pie'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

const meta = {
  title: 'Examples/Pie/PieColorSync',
  component: Pie,
} satisfies Meta<typeof Pie>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { name: 'Group A', value: 400, fill: '#0088FE' },
  { name: 'Group B', value: 300, fill: '#00C49F' },
  { name: 'Group C', value: 300, fill: '#FFBB28' },
  { name: 'Group D', value: 200, fill: '#FF8042' },
]

function renderSectorWithCustomShapeColor(sector: PieSectorDataItem & { isActive: boolean, stroke?: string }) {
  const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, stroke, payload } = sector
  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={(payload as typeof data[number]).fill}
      stroke={stroke}
    />
  )
}

const PieColorSyncWrapper = defineComponent({
  setup() {
    return () => (
      <ResponsiveContainer width="100%" height={500}>
        <PieChart width={400} height={400}>
          <Pie
            dataKey="value"
            nameKey="name"
            data={data}
            cx="50%"
            cy="50%"
            fill="#8884d8"
            innerRadius={60}
            outerRadius={80}
          >
            {{ shape: renderSectorWithCustomShapeColor }}
          </Pie>
          <Legend />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    )
  },
})

export const PieColorSync: Story = {
  render: () => PieColorSyncWrapper,
}
