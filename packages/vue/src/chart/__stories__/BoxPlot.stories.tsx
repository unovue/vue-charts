import type { StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { ComposedChart } from '@/chart/ComposedChart'
import { Bar } from '@/cartesian/bar/Bar'
import { Scatter } from '@/cartesian/scatter/Scatter'
import { ZAxis } from '@/cartesian/z-axis/ZAxis'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'

export default {
  title: 'examples/ComposedChart',
  component: ComposedChart,
}

interface BoxPlotRaw {
  min: number
  lowerQuartile: number
  median: number
  upperQuartile: number
  max: number
  average: number
}

const boxPlots: BoxPlotRaw[] = [
  { min: 100, lowerQuartile: 200, median: 250, upperQuartile: 450, max: 650, average: 150 },
  { min: 200, lowerQuartile: 400, median: 600, upperQuartile: 700, max: 800, average: 550 },
  { min: 0, lowerQuartile: 200, median: 400, upperQuartile: 600, max: 800, average: 400 },
]

const boxPlotData = boxPlots.map((v, i) => ({
  name: String(i),
  min: v.min,
  bottomWhisker: v.lowerQuartile - v.min,
  bottomBox: v.median - v.lowerQuartile,
  topBox: v.upperQuartile - v.median,
  topWhisker: v.max - v.upperQuartile,
  average: v.average,
  size: 250,
}))

const HorizonBar = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => {
      const { x, y, width } = attrs as any
      if (x == null || y == null || width == null)
        return null
      return <line x1={x} y1={y} x2={Number(x) + Number(width)} y2={y} stroke="#000" stroke-width={3} />
    }
  },
})

const DotBar = defineComponent({
  inheritAttrs: false,
  setup(_, { attrs }) {
    return () => {
      const { x, y, width, height } = attrs as any
      if (x == null || y == null || width == null || height == null)
        return null
      return (
        <line
          x1={Number(x) + Number(width) / 2}
          y1={Number(y) + Number(height)}
          x2={Number(x) + Number(width) / 2}
          y2={y}
          stroke="#000"
          stroke-width={5}
          stroke-dasharray="5"
        />
      )
    }
  },
})

export const BoxPlotChart: StoryObj = {
  render: () => (
    <ResponsiveContainer minHeight={600}>
      <ComposedChart data={boxPlotData}>
        <CartesianGrid stroke-dasharray="3 3" />
        <Bar stackId="a" dataKey="min" fill="none" />
        <Bar stackId="a" dataKey="bar-min">
          {{ shape: (props: any) => <HorizonBar {...props} /> }}
        </Bar>
        <Bar stackId="a" dataKey="bottomWhisker">
          {{ shape: (props: any) => <DotBar {...props} /> }}
        </Bar>
        <Bar stackId="a" dataKey="bottomBox" fill="#8884d8" />
        <Bar stackId="a" dataKey="bar-avg">
          {{ shape: (props: any) => <HorizonBar {...props} /> }}
        </Bar>
        <Bar stackId="a" dataKey="topBox" fill="#8884d8" />
        <Bar stackId="a" dataKey="topWhisker">
          {{ shape: (props: any) => <DotBar {...props} /> }}
        </Bar>
        <Bar stackId="a" dataKey="bar-max">
          {{ shape: (props: any) => <HorizonBar {...props} /> }}
        </Bar>
        <ZAxis type="number" dataKey="size" range={[0, 250]} />
        <Scatter dataKey="average" fill="red" stroke="#FFF" />
        <XAxis />
        <YAxis />
      </ComposedChart>
    </ResponsiveContainer>
  ),
  args: {},
}
