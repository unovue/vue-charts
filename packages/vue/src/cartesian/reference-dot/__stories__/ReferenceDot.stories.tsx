import type { Meta, StoryObj } from '@storybook/vue3'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import { ReferenceDot } from '@/cartesian/reference-dot/ReferenceDot'
import { ReferenceLine } from '@/cartesian/reference-line/ReferenceLine'
import { ResponsiveContainer } from '@/index'

const meta = {
  title: 'examples/ReferenceDot',
  component: LineChart,
} satisfies Meta<typeof LineChart>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  { name: 'Page A', uv: 4000, pv: 2400 },
  { name: 'Page B', uv: 3000, pv: 1398 },
  { name: 'Page C', uv: 2000, pv: 9800 },
  { name: 'Page D', uv: 2780, pv: 3908 },
  { name: 'Page E', uv: 1890, pv: 4800 },
  { name: 'Page F', uv: 2390, pv: 3800 },
  { name: 'Page G', uv: 3490, pv: 4300 },
]

export const Simple: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <ReferenceDot x="Page D" y={2780} r={8} fill="#8884d8" stroke="none" label="Peak" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const MultipleDots: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <ReferenceDot x="Page A" y={4000} r={6} fill="#ff7300" stroke="none" label="Max" />
          <ReferenceDot x="Page E" y={1890} r={6} fill="#e74c3c" stroke="none" label="Min" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const WithReferenceLine: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <ReferenceLine y={3000} stroke="#ff7300" stroke-dasharray="3 3" />
          <ReferenceDot x="Page D" y={2780} r={8} fill="#8884d8" stroke="#fff" stroke-width={2} />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const CustomShapeSlot: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <ReferenceDot x="Page D" y={2780} r={12} fill="#ff7300" stroke="#fff">
            {{
              shape: (props: any) => (
                <g>
                  <circle cx={props.cx} cy={props.cy} r={props.r} fill={props.fill} stroke={props.stroke} stroke-width={2} />
                  <text x={props.cx} y={props.cy - props.r - 8} text-anchor="middle" fill="#ff7300" font-size={12}>
                    Target
                  </text>
                </g>
              ),
            }}
          </ReferenceDot>
        </LineChart>
      </ResponsiveContainer>
    )
  },
}

export const IfOverflowModes: Story = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={[...data]} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis domain={[0, 5000]} />
          <Line type="monotone" dataKey="uv" stroke="#8884d8" />
          <ReferenceDot x="Page A" y={6000} r={8} fill="#ff7300" ifOverflow="extendDomain" label="Extend" />
          <ReferenceDot x="Page G" y={4500} r={8} fill="#82ca9d" ifOverflow="visible" label="Visible" />
        </LineChart>
      </ResponsiveContainer>
    )
  },
}
