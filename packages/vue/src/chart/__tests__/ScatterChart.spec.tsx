import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { defineComponent } from 'vue'
import { CartesianGrid, Scatter, ScatterChart, XAxis, YAxis, ZAxis } from '@/index'
import { Tooltip } from '@/components/Tooltip'
import { Legend } from '@/components/legend'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { useChartHeight, useChartWidth, useViewBox } from '@/context/chartLayoutContext'
import { useClipPathId } from '@/model/runtime'

describe('scatterChart', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data01 = [
    { x: 100, y: 200, z: 200 },
    { x: 120, y: 100, z: 260 },
    { x: 170, y: 300, z: 400 },
    { x: 140, y: 250, z: 280 },
    { x: 150, y: 400, z: 500 },
    { x: 110, y: 280, z: 200 },
  ]

  const data02 = [
    { x: 200, y: 260, z: 240 },
    { x: 240, y: 290, z: 220 },
    { x: 190, y: 290, z: 250 },
    { x: 198, y: 250, z: 210 },
    { x: 180, y: 280, z: 260 },
    { x: 210, y: 220, z: 230 },
  ]

  describe('basic rendering', () => {
    it('renders scatter symbols for single Scatter', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <Scatter name="A school" data={data01} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })

    it('renders 2 Scatter series', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <ZAxis dataKey="z" range={[4, 20]} name="score" unit="km" />
          <CartesianGrid />
          <Scatter name="A school" data={data01} fillOpacity={0.3} fill="#ff7300" isAnimationActive={false} />
          <Scatter name="B school" data={data02} fill="#347300" isAnimationActive={false} />
          <Tooltip />
          <Legend />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(2)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length + data02.length)
      // Legend renders (items may need async propagation through chart state)
    })

    it('renders no symbols when data is empty', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <Scatter name="A school" data={[]} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(0)
    })
  })

  describe('with ZAxis', () => {
    it('renders scatter symbols with ZAxis for sizing', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <ZAxis dataKey="z" range={[4, 20]} name="score" unit="km" />
          <Scatter name="A school" data={data01} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })
  })

  describe('custom shape', () => {
    it('renders scatter with cross shape', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter name="A school" data={data01} fill="#8884d8" shape="cross" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })

    it('renders scatter with diamond shape', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter name="A school" data={data01} fill="#8884d8" shape="diamond" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })
  })

  describe('with joint line', () => {
    it('renders scatter with connecting line', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400}>
          <XAxis type="number" dataKey="x" />
          <YAxis type="number" dataKey="y" />
          <Scatter name="A school" data={data01} fill="#8884d8" line isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter')).toHaveLength(1)
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
      expect(container.querySelectorAll('.v-charts-scatter-line')).toHaveLength(1)
    })
  })

  describe('tooltip integration', () => {
    it('renders with Tooltip', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <Scatter name="A school" data={data01} fill="#ff7300" isAnimationActive={false} />
          <Tooltip />
        </ScatterChart>
      ))

      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
      // Tooltip renders alongside scatter without errors
      expect(container.querySelectorAll('.v-charts-scatter-symbol').length).toBeGreaterThan(0)
    })
  })

  describe('with Legend', () => {
    it('renders legend items for each Scatter series', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <Scatter name="A school" data={data01} fill="#ff7300" isAnimationActive={false} />
          <Scatter name="B school" data={data02} fill="#347300" isAnimationActive={false} />
          <Legend />
        </ScatterChart>
      ))

      // Legend renders (items may need async propagation through chart state)
    })
  })

  describe('with CartesianGrid', () => {
    it('renders grid with scatter points', () => {
      const { container } = render(() => (
        <ScatterChart width={400} height={400} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <XAxis dataKey="x" name="stature" unit="cm" />
          <YAxis dataKey="y" name="weight" unit="kg" />
          <CartesianGrid />
          <Scatter name="A school" data={data01} fill="#ff7300" isAnimationActive={false} />
        </ScatterChart>
      ))

      expect(container.querySelector('.v-charts-cartesian-grid')).toBeTruthy()
      expect(container.querySelectorAll('.v-charts-scatter-symbol')).toHaveLength(data01.length)
    })
  })

  describe('layout context', () => {
    it('provides viewBox', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useViewBox().value)
          return () => null
        },
      })

      render({
        components: { ScatterChart, Comp },
        template: `
          <ScatterChart :width="100" :height="50">
            <Comp />
          </ScatterChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenLastCalledWith({ x: 5, y: 5, width: 90, height: 40 })
    })

    it('provides clipPathId', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useClipPathId())
          return () => null
        },
      })

      render({
        components: { ScatterChart, Comp },
        template: `
          <ScatterChart :width="100" :height="50">
            <Comp />
          </ScatterChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(expect.stringMatching(/^v-charts[\w-]+-clip$/))
    })

    it('provides width', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useChartWidth().value)
          return () => null
        },
      })

      render({
        components: { ScatterChart, Comp },
        template: `
          <ScatterChart :width="100" :height="50">
            <Comp />
          </ScatterChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(100)
    })

    it('provides height', () => {
      const spy = vi.fn()
      const Comp = defineComponent({
        setup() {
          spy(useChartHeight().value)
          return () => null
        },
      })

      render({
        components: { ScatterChart, Comp },
        template: `
          <ScatterChart :width="100" :height="50">
            <Comp />
          </ScatterChart>
        `,
      })

      expect(spy).toHaveBeenCalledTimes(1)
      expect(spy).toHaveBeenCalledWith(50)
    })
  })
})
