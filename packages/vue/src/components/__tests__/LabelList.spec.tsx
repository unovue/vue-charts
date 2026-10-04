import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { Bar, BarChart, Line, LineChart, XAxis, YAxis } from '@/index'
import { LabelList } from '@/components/label/LabelList'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

describe('labelList', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400 },
    { name: 'Page B', uv: 300, pv: 4567 },
    { name: 'Page C', uv: 300, pv: 1398 },
    { name: 'Page D', uv: 200, pv: 9800 },
    { name: 'Page E', uv: 278, pv: 3908 },
    { name: 'Page F', uv: 189, pv: 4800 },
  ]

  describe('in BarChart', () => {
    it('renders labels on bars', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="top" />
          </Bar>
        </BarChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(data.length)
    })

    it('renders labels with custom dataKey', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="name" position="top" />
          </Bar>
        </BarChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(data.length)
    })

    it('renders labels with offset', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="top" offset={40} />
          </Bar>
        </BarChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(data.length)
      // Offset is used in positioning calculation, labels should be rendered
      expect(labels[0]).toBeTruthy()
    })

    it('renders labels at insideTop position', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="insideTop" />
          </Bar>
        </BarChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(data.length)
    })
  })

  describe('in LineChart', () => {
    it('renders labels on line points', () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="top" />
          </Line>
        </LineChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(data.length)
    })
  })

  describe('label-list wrapper', () => {
    it('renders label-list container', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="top" />
          </Bar>
        </BarChart>
      ))

      const labelList = container.querySelectorAll('.v-charts-label-list')
      expect(labelList.length).toBeGreaterThan(0)
    })
  })

  describe('without data', () => {
    it('renders no labels when chart has no data', () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={[]}>
          <XAxis dataKey="name" />
          <YAxis />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false}>
            <LabelList dataKey="uv" position="top" />
          </Bar>
        </BarChart>
      ))

      const labels = container.querySelectorAll('.v-charts-label')
      expect(labels.length).toBe(0)
    })
  })
})
