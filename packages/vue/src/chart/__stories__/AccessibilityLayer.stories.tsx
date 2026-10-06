import type { StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { ComposedChart } from '@/chart/ComposedChart'
import { AreaChart } from '@/chart/AreaChart'
import { Area, ResponsiveContainer } from '@/index'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { Legend } from '@/components/legend'
import { getStoryArgsFromArgsTypesObject } from '@/storybook/api/props/utils'
import { CategoricalChartProps } from '@/storybook/api/props/chart-props'
import { pageData } from '@/storybook/data'

export default {
  title: 'examples/ComposedChart',
  component: ComposedChart,
}

/**
 * https://github.com/recharts/recharts/issues/5477
 */
export const AreaChartWithAccessibilityLayer: StoryObj = {
  render: (args: Record<string, any>) => {
    return (
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart
          margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
          data={pageData}
          {...args}
        >
          <Area isAnimationActive={false} dataKey="uv" />
          <Legend />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
        </ComposedChart>
      </ResponsiveContainer>
    )
  },
  args: getStoryArgsFromArgsTypesObject(CategoricalChartProps),
  parameters: {
    docs: {
      description: {
        story: 'You can tab to this chart. From there, you can use the arrow keys to navigate along the chart.',
      },
    },
  },
}

const AccessibleWithButtonWrapper = defineComponent({
  setup() {
    const toggle = ref(true)

    return () => (
      <div>
        <button type="button" onClick={() => { toggle.value = !toggle.value }}>
          Toggle Tooltip
        </button>
        <AreaChart
          width={500}
          height={400}
          data={pageData}
          margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
        >
          <CartesianGrid stroke-dasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Area type="monotone" dataKey="uv" stackId="1" stroke="#8884d8" fill="#8884d8" />
          <Area type="monotone" dataKey="pv" stackId="1" stroke="#82ca9d" fill="#82ca9d" />
          <Area type="monotone" dataKey="amt" stackId="1" stroke="#ffc658" fill="#ffc658" />
          {toggle.value && <Tooltip />}
        </AreaChart>
      </div>
    )
  },
})

export const AccessibleWithButton: StoryObj = {
  render: () => <AccessibleWithButtonWrapper />,
  args: {},
}
