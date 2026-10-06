import type { StoryObj } from '@storybook/vue3-vite'
import { LineChart } from '@/chart/LineChart'
import { Line } from '@/cartesian/line'
import { XAxis, YAxis } from '@/cartesian/axis'
import { CartesianGrid } from '@/cartesian/cartesian-grid'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { Legend } from '@/components/legend'
import { ResponsiveContainer } from '@/index'
import { pageData } from '@/storybook/data'
import type { CurveProps } from '@/shape/Curve'
import { Curve } from '@/shape/Curve'
import { isWellBehavedNumber } from '@/utils/validate'

export default {
  title: 'Examples/LineChart/CustomLineShapeChart',
  component: LineChart,
}

interface CustomLineShapeProps extends CurveProps {
  tick: any
  tickInterval?: number
}

function CustomLineShape(props: CustomLineShapeProps) {
  const { tick, tickInterval = 30, ...restProps } = props
  const { points } = restProps

  const ticks: any[] = []

  if (points) {
    for (let i = 1, c = points.length; i < c; ++i) {
      let counter = 0

      const p1 = points[i - 1]!
      const p2 = points[i]!

      if (
        isWellBehavedNumber(p1.x)
        && isWellBehavedNumber(p1.y)
        && isWellBehavedNumber(p2.x)
        && isWellBehavedNumber(p2.y)
      ) {
        let l = Math.abs(p1.x - p2.x)
        const dx = (p2.x - p1.x) / l
        const dy = (p2.y - p1.y) / l
        const a = (Math.atan2(dy, dx) * 180) / Math.PI

        const tickCount = Math.abs(Math.floor(l / tickInterval - 1))
        const tickLength = l / tickCount
        let tickRemaining = tickInterval / 2

        let { x, y } = p1
        while (l - tickRemaining > 0) {
          l -= tickRemaining

          x += dx * tickRemaining
          y += dy * tickRemaining

          ticks.push(
            <g key={`${i}-${++counter}`} transform={`translate(${x} ${y}) rotate(${a})`}>
              {tick}
            </g>,
          )

          tickRemaining = tickLength
        }
      }
    }
  }

  return (
    <g style={{ color: restProps.stroke }}>
      <Curve {...restProps} />
      {ticks}
    </g>
  )
}

export const CustomLineShapeChart: StoryObj = {
  render: (args: Record<string, any>) => {
    return (
      <div style={{ width: '100%', height: '100%' }}>
        <ResponsiveContainer>
          <LineChart {...args}>
            <CartesianGrid stroke-dasharray="3 3" />
            <XAxis dataKey="name" />
            <YAxis />
            <Legend />
            <Tooltip cursor={{ 'stroke': 'gold', 'stroke-width': 2 }} defaultIndex={3} />
            <Line
              type="linear"
              dataKey="pv"
              stroke="#8884d8"
              activeDot={{ r: 8 }}
            >
              {{
                shape: (payload: CurveProps) => (
                  <CustomLineShape {...payload} tick={<circle r={5} fill="currentColor" />} />
                ),
              }}
            </Line>
            <Line
              type="linear"
              dataKey="uv"
              stroke="#82ca9d"
            >
              {{
                shape: (payload: CurveProps) => (
                  <CustomLineShape
                    {...payload}
                    tick={<rect x={-5} y={-5} width={10} height={10} fill="currentColor" />}
                  />
                ),
              }}
            </Line>
          </LineChart>
        </ResponsiveContainer>
      </div>
    )
  },
  args: {
    width: 500,
    height: 300,
    data: pageData,
    margin: {
      top: 5,
      right: 30,
      left: 20,
      bottom: 5,
    },
  },
}
