import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import { Sector } from '@/shape/Sector'
import type { PieSectorDataItem } from '@/core/pie'

const meta = {
  title: 'Examples/Pie/CustomActiveShapePieChart',
  component: Pie,
} satisfies Meta<typeof Pie>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { name: 'Group A', value: 400 },
  { name: 'Group B', value: 300 },
  { name: 'Group C', value: 300 },
  { name: 'Group D', value: 200 },
]

const RADIAN = Math.PI / 180

function renderActiveShape(sector: PieSectorDataItem & { isActive: boolean, stroke?: string }) {
  const {
    cx = 0,
    cy = 0,
    midAngle = 0,
    innerRadius,
    outerRadius = 0,
    startAngle,
    endAngle,
    fill,
    stroke,
    payload,
    percent = 0,
    value,
    isActive,
  } = sector

  const sin = Math.sin(-RADIAN * midAngle)
  const cos = Math.cos(-RADIAN * midAngle)
  const sx = cx + (outerRadius + 10) * cos
  const sy = cy + (outerRadius + 10) * sin
  const mx = cx + (outerRadius + 30) * cos
  const my = cy + (outerRadius + 30) * sin
  const ex = mx + (cos >= 0 ? 1 : -1) * 22
  const ey = my
  const textAnchor = cos >= 0 ? 'start' : 'end'

  if (isActive) {
    return (
      <g>
        <text x={cx} y={cy} dy={8} text-anchor="middle" fill={fill}>
          {payload.name}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
          stroke={stroke}
        />
        <Sector
          cx={cx}
          cy={cy}
          startAngle={startAngle}
          endAngle={endAngle}
          innerRadius={outerRadius + 6}
          outerRadius={outerRadius + 10}
          fill={fill}
          stroke={stroke}
        />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={2} fill={fill} stroke="none" />
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} text-anchor={textAnchor} fill="#333">
          {`PV ${value}`}
        </text>
        <text x={ex + (cos >= 0 ? 1 : -1) * 12} y={ey} dy={18} text-anchor={textAnchor} fill="#999">
          {`(Rate ${(percent * 100).toFixed(2)}%)`}
        </text>
      </g>
    )
  }

  return (
    <Sector
      cx={cx}
      cy={cy}
      innerRadius={innerRadius}
      outerRadius={outerRadius}
      startAngle={startAngle}
      endAngle={endAngle}
      fill={fill}
      stroke={stroke}
    />
  )
}

const CustomActiveShapePieWrapper = defineComponent({
  setup() {
    return () => (
      <PieChart width={800} height={500}>
        <Pie
          dataKey="value"
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={80}
          fill="#8884d8"
          activeIndex={0}
        >
          {{ shape: renderActiveShape }}
        </Pie>
      </PieChart>
    )
  },
})

export const CustomActiveShapePieChart: Story = {
  render: () => CustomActiveShapePieWrapper,
}
