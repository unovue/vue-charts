import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

const meta = {
  title: 'Examples/Pie/PieWithStep',
  component: Pie,
} satisfies Meta<typeof Pie>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { value: 'Luck', percent: 10, customRadius: 140 },
  { value: 'Skill', percent: 20, customRadius: 160 },
  { value: 'Concentrated power of will', percent: 15, customRadius: 150 },
  { value: 'Pleasure', percent: 50, customRadius: 190 },
  { value: 'Pain', percent: 50, customRadius: 190 },
  { value: 'Reason to remember the name', percent: 100, customRadius: 220 },
]

const PieWithStepWrapper = defineComponent({
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
            label={true}
            outerRadius={(element: typeof data[number]) => element.customRadius}
          />
        </PieChart>
      </ResponsiveContainer>
    )
  },
})

export const PieWithStep: Story = {
  render: () => <PieWithStepWrapper />,
}
