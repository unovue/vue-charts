import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { useChartHeight, useChartWidth } from '@/context/chartLayoutContext'
import { useAppSelector } from '@/state/hooks'
import { selectContainerScale } from '@/state/selectors/containerSelectors'

/**
 * Vue version of ChartSizeDimensions from Recharts storybook.
 * Renders arrows and labels showing chart width and height inside the SVG.
 */
const ChartSizeDimensions = defineComponent({
  setup() {
    const width = useChartWidth()
    const height = useChartHeight()

    return () => {
      if (width.value == null || height.value == null)
        return null
      const w = width.value
      const h = height.value
      const strokeWidth = 2
      const arrowSize = 7
      return (
        <svg width={w} height={h} style={{ pointerEvents: 'none' }}>
          {/* Background pattern */}
          <defs>
            <pattern
              id="pattern-chart"
              x={0}
              y={0}
              width={120}
              height={50}
              patternUnits="userSpaceOnUse"
              patternTransform="rotate(30)"
            >
              <text x={0} y={10} font-size={24} stroke="#eee" fill="#eee" dominant-baseline="hanging">
                CHART
              </text>
            </pattern>
          </defs>
          <rect x={0} y={0} width={w} height={h} fill="url(#pattern-chart)" />
          <rect x={0} y={0} width={w} height={h} fill="none" stroke="green" stroke-width={5} stroke-dasharray="3 3" />

          {/* Horizontal arrow (width) */}
          <line x1={0} y1={h * 0.15} x2={w} y2={h * 0.15} stroke="red" stroke-width={strokeWidth} />
          <line x1={0} y1={h * 0.15} x2={arrowSize} y2={h * 0.15 - arrowSize} stroke="red" stroke-width={strokeWidth} />
          <line x1={0} y1={h * 0.15} x2={arrowSize} y2={h * 0.15 + arrowSize} stroke="red" stroke-width={strokeWidth} />
          <line x1={w} y1={h * 0.15} x2={w - arrowSize} y2={h * 0.15 - arrowSize} stroke="red" stroke-width={strokeWidth} />
          <line x1={w} y1={h * 0.15} x2={w - arrowSize} y2={h * 0.15 + arrowSize} stroke="red" stroke-width={strokeWidth} />
          <text x={w * 0.9} y={h * 0.15 + 8} text-anchor="end" dominant-baseline="hanging" stroke="red">
            {`useChartWidth: ${w}px`}
          </text>

          {/* Vertical arrow (height) */}
          <line x1={w * 0.1} y1={0} x2={w * 0.1} y2={h} stroke="blue" stroke-width={strokeWidth} />
          <line x1={w * 0.1} y1={0} x2={w * 0.1 - arrowSize} y2={arrowSize} stroke="blue" stroke-width={strokeWidth} />
          <line x1={w * 0.1} y1={0} x2={w * 0.1 + arrowSize} y2={arrowSize} stroke="blue" stroke-width={strokeWidth} />
          <line x1={w * 0.1} y1={h} x2={w * 0.1 - arrowSize} y2={h - arrowSize} stroke="blue" stroke-width={strokeWidth} />
          <line x1={w * 0.1} y1={h} x2={w * 0.1 + arrowSize} y2={h - arrowSize} stroke="blue" stroke-width={strokeWidth} />
          <text x={w * 0.1 + 8} y={h * 0.7} text-anchor="start" dominant-baseline="middle" stroke="blue">
            {`useChartHeight: ${h}px`}
          </text>
        </svg>
      )
    }
  },
})

/**
 * Shows the container scale value inside the chart.
 */
const ShowScale = defineComponent({
  setup() {
    const width = useChartWidth()
    const height = useChartHeight()
    const scale = useAppSelector(selectContainerScale)

    return () => {
      if (width.value == null || height.value == null)
        return null
      return (
        <svg width="100%" height="100%" style={{ position: 'absolute', top: 0, left: 0 }}>
          <text
            x={width.value * 0.9}
            y={height.value * 0.9}
            text-anchor="end"
            dominant-baseline="hanging"
            stroke="black"
          >
            {`scale: ${scale.value}`}
          </text>
        </svg>
      )
    }
  },
})

const meta: Meta = {
  title: 'examples/ChartLayout',
}
export default meta

type Story = StoryObj

/**
 * https://github.com/recharts/recharts/issues/5477
 */
export const WithAbsolutePositionAndFlexboxParents: Story = {
  render: (args: Record<string, any>) => (
    <div style={{ display: 'flex', height: '100vh' }}>
      <div
        style={{
          flex: '1',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}
        class="spacer-top"
      >
        <div
          style={{
            position: 'absolute',
            height: '100%',
            width: '100%',
            top: '100px',
          }}
          class="spacer-left"
        >
          <BarChart {...args}>
            <ChartSizeDimensions />
            <ShowScale />
          </BarChart>
        </div>
      </div>
    </div>
  ),
  args: {
    width: 500,
    height: 500,
  },
}
