import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import Legend from '@/components/legend/Legend'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

const meta = {
  title: 'Examples/Pie/PieWithLegend',
  component: Pie,
} satisfies Meta<typeof Pie>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { value: 'Luck', percent: 10 },
  { value: 'Skill', percent: 20 },
  { value: 'Concentrated power of will', percent: 15 },
  { value: 'Pleasure', percent: 50 },
  { value: 'Pain', percent: 50 },
  { value: 'Reason to remember the name', percent: 100 },
]

const PieWithLegendWrapper = defineComponent({
  setup() {
    return () => (
      <ResponsiveContainer width="100%" height={500}>
        <PieChart width={400} height={400}>
          <Pie
            dataKey="percent"
            nameKey="value"
            data={data}
            cx="50%"
            cy="50%"
            fill="#8884d8"
            innerRadius={60}
            outerRadius={80}
            label={true}
          />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    )
  },
})

export const PieWithLegend: Story = {
  render: () => <PieWithLegendWrapper />,
}
