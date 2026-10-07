import type { StoryObj } from '@storybook/vue3-vite'
import { defineComponent } from 'vue'
import { ComposedChart } from '@/chart/ComposedChart'
import { LineChart } from '@/chart/LineChart'
import { BarChart } from '@/chart/BarChart'
import { RadialBarChart } from '@/chart/RadialBarChart'
import { Area } from '@/cartesian/area/Area'
import { Bar } from '@/cartesian/bar/Bar'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { CartesianGrid } from '@/cartesian/cartesian-grid/CartesianGrid'
import Legend from '@/components/legend/Legend'
import { Tooltip } from '@/components/tooltip/Tooltip'
import { RadialBar } from '@/polar/radial-bar/RadialBar'
import { pageData } from '@/storybook/data'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

export default {
  title: 'Examples/Tooltip',
  component: Tooltip,
}

export const SettingTooltipIndex: StoryObj = {
  render: () => (
    <LineChart
      width={500}
      height={300}
      data={[...pageData]}
      margin={{ top: 5, right: 5, bottom: 5, left: 0 }}
    >
      <CartesianGrid stroke="#eee" stroke-dasharray="5 5" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip defaultIndex={2} />
      <Line type="monotone" dataKey="uv" stroke="#8884d8" />
      <Line type="monotone" dataKey="pv" stroke="#82ca9d" />
    </LineChart>
  ),
}

export const TriggerTooltipByClick: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={[...pageData]}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip trigger="click" />
        <Line dataKey="uv" />
      </ComposedChart>
    </ResponsiveContainer>
  ),
}

const CustomContent = defineComponent({
  name: 'CustomContent',
  props: {
    active: Boolean,
    payload: Array,
  },
  setup(props) {
    return () => (
      <div
        style={{
          backgroundColor: '#5b63ffe7',
          padding: '10px',
          borderRadius: '10px',
          boxShadow: '1px 2px 10px -2px #7873ffb1',
          visibility: props.active ? 'visible' : 'hidden',
        }}
      >
        {props.payload?.map((pld: any) => (
          <p
            key={pld.name}
            style={{
              borderStyle: 'solid 1px',
              fontSize: '13px',
              fontWeight: '600',
              fontFamily: 'sans-serif',
              color: '#fff',
            }}
          >
            {`${pld.name} : ${pld.value}`}
          </p>
        ))}
      </div>
    )
  },
})

export const CustomContentExample: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={[...pageData]}>
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip content={CustomContent} />
        <Line dataKey="uv" />
      </ComposedChart>
    </ResponsiveContainer>
  ),
}

const areaData = [
  { category: 'A', value: 0.2 },
  { category: 'B', value: 0.3 },
  { category: 'B', value: 0.5 },
  { category: 'C', value: 0.6 },
  { category: 'C', value: 0.7 },
  { category: 'D', value: 0.4 },
]

const lineData = [
  { category: 'A', value: null },
  { category: 'B', value: null },
  { category: 'B', value: null },
  { category: 'C', value: 0.2 },
  { category: 'C', value: 0.4 },
  { category: 'D', value: 0.6 },
]

export const SeparateDataSetsForChart: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={500}>
      <ComposedChart data={[...areaData]}>
        <XAxis dataKey="category" type="category" />
        <YAxis dataKey="value" />
        <Tooltip />
        <Area dataKey="value" />
        <Line dataKey="value" data={lineData} />
      </ComposedChart>
    </ResponsiveContainer>
  ),
}

export const IncludeHidden: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={300}>
      <ComposedChart
        width={600}
        height={300}
        data={[...pageData]}
        margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
      >
        <Tooltip includeHidden />
        <Line dataKey="uv" />
        <Line dataKey="pv" hide />
      </ComposedChart>
    </ResponsiveContainer>
  ),
}

export const SharedTooltipInBarChart: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <BarChart data={[...pageData]}>
        <Bar dataKey="uv" fill="green" />
        <Bar dataKey="pv" fill="red" />
        <Tooltip shared={false} defaultIndex={2} active />
      </BarChart>
    </ResponsiveContainer>
  ),
}

export const SharedTooltipInRadialBarChart: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <RadialBarChart data={[...pageData]}>
        {/* <PolarRadiusAxis dataKey="name" type="category" /> */}
        {/* <PolarAngleAxis dataKey="pv" type="number" /> */}
        <RadialBar dataKey="uv" fill="green" />
        <RadialBar dataKey="pv" fill="red" />
        <Tooltip shared={false} defaultIndex={2} active />
      </RadialBarChart>
    </ResponsiveContainer>
  ),
}

export const TallTooltipInNarrowChart: StoryObj = {
  render: () => (
    <LineChart width={500} height={50} data={[...pageData]}>
      <Tooltip defaultIndex={2} active />
      <Line dataKey="uv" fill="green" />
      <Line dataKey="pv" fill="red" />
      <Line dataKey="amt" fill="blue" />
    </LineChart>
  ),
}

export const TooltipWithNegativeOffset: StoryObj = {
  render: () => (
    <ResponsiveContainer width="100%" height={400}>
      <ComposedChart data={[...pageData]}>
        <XAxis dataKey="name" />
        <YAxis />
        <Line dataKey="uv" />
        <Tooltip offset={-50} style={{ width: '100px' }} />
      </ComposedChart>
    </ResponsiveContainer>
  ),
}

export const TooltipInBarChartWithLegend: StoryObj = {
  render: () => (
    <BarChart width={730} height={250} data={[...pageData]}>
      <CartesianGrid stroke-dasharray="3 3" />
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip cursor={false} />
      <Legend />
      <Bar dataKey="pv" fill="#8884d8" />
      <Bar dataKey="uv" fill="#82ca9d" />
    </BarChart>
  ),
}
