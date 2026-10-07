import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Treemap } from '@/chart/Treemap'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

const meta = {
  title: 'Examples/Treemap',
  component: Treemap,
} satisfies Meta<typeof Treemap>

export default meta
type Story = StoryObj<typeof meta>

const data = [
  {
    name: 'axis',
    children: [
      { name: 'Axes', value: 1302 },
      { name: 'Axis', value: 24593 },
      { name: 'AxisGridLine', value: 652 },
      { name: 'AxisLabel', value: 636 },
    ],
  },
  {
    name: 'controls',
    children: [
      { name: 'AnchorControl', value: 2138 },
      { name: 'ClickControl', value: 3824 },
      { name: 'Control', value: 1353 },
      { name: 'ControlList', value: 4665 },
      { name: 'DragControl', value: 2649 },
      { name: 'ExpandControl', value: 2832 },
    ],
  },
  {
    name: 'data',
    children: [
      { name: 'Data', value: 20544 },
      { name: 'DataList', value: 19788 },
      { name: 'DataSprite', value: 10349 },
      { name: 'EdgeSprite', value: 3301 },
      { name: 'NodeSprite', value: 19382 },
    ],
  },
  {
    name: 'events',
    children: [
      { name: 'DataEvent', value: 7313 },
      { name: 'SelectionEvent', value: 6880 },
      { name: 'TooltipEvent', value: 3701 },
      { name: 'VisualizationEvent', value: 2117 },
    ],
  },
]

export const Simple: Story = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        width={400}
        height={400}
        data={[...data]}
        dataKey="value"
        stroke="#fff"
        isAnimationActive={false}
      />
    </ResponsiveContainer>
  ),
}

export const CustomColors: Story = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        width={400}
        height={400}
        data={[...data]}
        dataKey="value"
        stroke="#fff"
        colors={['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']}
        isAnimationActive={false}
      />
    </ResponsiveContainer>
  ),
}

export const CustomContent: Story = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        width={400}
        height={400}
        data={[...data]}
        dataKey="value"
        stroke="#fff"
        isAnimationActive={false}
      >
        {{
          content: (props) => {
            const { x, y, width, height, fill, name } = props
            const rx = Math.min(6, width / 2, height / 2)
            return (
              <g>
                <rect
                  x={x}
                  y={y}
                  width={width}
                  height={height}
                  rx={rx}
                  ry={rx}
                  fill={fill}
                  stroke="#fff"
                  stroke-width={2}
                  fill-opacity={0.85}
                />
                {width > 50 && height > 24 && (
                  <text
                    x={x + width / 2}
                    y={y + height / 2}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill="#fff"
                    font-size={11}
                    font-weight="bold"
                  >
                    {name}
                  </text>
                )}
              </g>
            )
          },
        }}
      </Treemap>
    </ResponsiveContainer>
  ),
}

export const NestMode: Story = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <Treemap
        width={400}
        height={400}
        data={[...data]}
        dataKey="value"
        type="nest"
        stroke="#fff"
        colors={['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']}
        isAnimationActive={false}
      />
    </ResponsiveContainer>
  ),
}
