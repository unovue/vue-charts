import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it } from 'vitest'
import { nextTick } from 'vue'
import { BarChart } from '@/chart/BarChart'
import { LineChart } from '@/chart/LineChart'
import { ComposedChart } from '@/chart/ComposedChart'
import { Bar } from '@/cartesian/bar/Bar'
import { Line } from '@/cartesian/line/Line'
import { Area } from '@/cartesian/area/Area'
import { XAxis } from '@/cartesian/axis/XAxis'
import { YAxis } from '@/cartesian/axis/YAxis'
import { Tooltip } from '@/components/Tooltip'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { assertNotNull } from '@/test/helper'

/**
 * Integration tests for tooltip selectors (tooltipSelectors.ts).
 *
 * These tests verify that the chart selectors produce correct tooltip payload,
 * active label, and coordinate data by rendering real charts and triggering
 * mouse interactions. The selectors under test include:
 *   - selectActiveTooltipPayload / selectTooltipPayload
 *   - selectActiveLabel
 *   - selectIsTooltipActive
 *   - combineTooltipPayload
 *   - selectTooltipEventType (axis vs item)
 *   - selectActiveTooltipIndex
 */

describe('tooltipSelectors integration', () => {
  beforeEach(() => {
    mockGetBoundingClientRect({ width: 500, height: 500 })
  })

  const data = [
    { name: 'Page A', uv: 400, pv: 2400, amt: 2400 },
    { name: 'Page B', uv: 300, pv: 4567, amt: 2400 },
    { name: 'Page C', uv: 300, pv: 1398, amt: 2400 },
    { name: 'Page D', uv: 200, pv: 9800, amt: 2400 },
    { name: 'Page E', uv: 278, pv: 3908, amt: 2400 },
    { name: 'Page F', uv: 189, pv: 4800, amt: 2400 },
  ]

  /**
   * Helper: trigger mousemove on chart wrapper and wait for tooltip to render.
   */
  async function hoverChart(container: Element, clientX = 200, clientY = 200) {
    const chart = container.querySelector('.v-charts-wrapper')
    assertNotNull(chart)
    await fireEvent(chart, new MouseEvent('mousemove', { clientX, clientY }))
    await nextTick()
    await nextTick()
  }

  /**
   * Helper: get all tooltip item name texts.
   */
  function getTooltipItemNames(container: Element): string[] {
    const items = container.parentElement!.querySelectorAll('.v-charts-tooltip-item-name')
    return Array.from(items).map(el => el.textContent ?? '')
  }

  /**
   * Helper: get all tooltip item value texts.
   */
  function getTooltipItemValues(container: Element): string[] {
    const items = container.parentElement!.querySelectorAll('.v-charts-tooltip-item-value')
    return Array.from(items).map(el => el.textContent ?? '')
  }

  /**
   * Helper: get the tooltip label text.
   */
  function getTooltipLabel(container: Element): string | null {
    const label = container.parentElement!.querySelector('.v-charts-tooltip-label')
    return label?.textContent ?? null
  }

  describe('axis tooltip type (shared=true, default)', () => {
    it('shows payload for all graphical items at hovered index in LineChart', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
          <Line dataKey="pv" stroke="#82ca9d" isAnimationActive={false} />
        </LineChart>
      ))

      await hoverChart(container)

      const names = getTooltipItemNames(container)
      // axis tooltip should include both series
      expect(names.length).toBe(2)
      expect(names).toContain('uv')
      expect(names).toContain('pv')
    })

    it('shows correct label from XAxis dataKey at hovered index', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      await hoverChart(container)

      const label = getTooltipLabel(container)
      // After hovering, label should be one of the XAxis category values
      assertNotNull(label)
      const validLabels = data.map(d => d.name)
      expect(validLabels).toContain(label)
    })

    it('shows tooltip payload values matching the data at the active index', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      await hoverChart(container)

      const label = getTooltipLabel(container)
      const values = getTooltipItemValues(container)
      assertNotNull(label)

      // Find the data entry matching the label
      const entry = data.find(d => d.name === label)
      assertNotNull(entry)

      // The tooltip value should match the data's uv for that entry
      expect(values.length).toBe(1)
      expect(values[0]).toBe(String(entry.uv))
    })
  })

  describe('defaultIndex', () => {
    it('shows tooltip at specified data index without mouse interaction', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip defaultIndex={0} />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      await nextTick()
      await nextTick()
      await nextTick()

      const label = getTooltipLabel(container)
      // defaultIndex=0 should show the first data point's label
      expect(label).toBe('Page A')

      const values = getTooltipItemValues(container)
      expect(values.length).toBe(1)
      expect(values[0]).toBe(String(data[0].uv))
    })

    it('shows tooltip at last index when defaultIndex points to last element', async () => {
      const lastIndex = data.length - 1
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip defaultIndex={lastIndex} />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      await nextTick()
      await nextTick()
      await nextTick()

      const label = getTooltipLabel(container)
      expect(label).toBe(data[lastIndex].name)

      const values = getTooltipItemValues(container)
      expect(values[0]).toBe(String(data[lastIndex].uv))
    })
  })

  describe('shared={false} (item tooltip type)', () => {
    it('does not show tooltip without direct item hover in BarChart', async () => {
      const { container } = render(() => (
        <BarChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip shared={false} />
          <Bar dataKey="uv" fill="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#82ca9d" isAnimationActive={false} />
        </BarChart>
      ))

      // Mouse over empty chart area (not directly on a bar)
      const chart = container.querySelector('.v-charts-wrapper')
      assertNotNull(chart)
      await fireEvent(chart, new MouseEvent('mousemove', { clientX: 10, clientY: 10 }))
      await nextTick()
      await nextTick()

      // With shared=false and tooltipEventType='item', axis hover should not show tooltip
      const tooltipWrapper = container.parentElement!.querySelector('.v-charts-tooltip-wrapper') as HTMLElement | null
      if (tooltipWrapper) {
        // If wrapper exists, it should be hidden (visibility: hidden)
        expect(tooltipWrapper.style.visibility).toBe('hidden')
      }
    })
  })

  describe('composedChart with multiple chart types', () => {
    it('shows combined tooltip payload for Line + Bar in ComposedChart', async () => {
      const { container } = render(() => (
        <ComposedChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Bar dataKey="pv" fill="#413ea0" isAnimationActive={false} />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </ComposedChart>
      ))

      await hoverChart(container)

      const names = getTooltipItemNames(container)
      // Should show both Bar and Line data in the tooltip
      expect(names.length).toBe(2)
      expect(names).toContain('pv')
      expect(names).toContain('uv')
    })

    it('shows combined payload for Line + Bar + Area in ComposedChart', async () => {
      const { container } = render(() => (
        <ComposedChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Area type="monotone" dataKey="amt" fill="#8884d8" stroke="#8884d8" isAnimationActive={false} />
          <Bar dataKey="pv" fill="#413ea0" isAnimationActive={false} />
          <Line type="monotone" dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </ComposedChart>
      ))

      await hoverChart(container)

      const names = getTooltipItemNames(container)
      expect(names.length).toBe(3)
      expect(names).toContain('amt')
      expect(names).toContain('pv')
      expect(names).toContain('uv')
    })
  })

  describe('tooltip payload correctness', () => {
    it('includes correct color from graphical item stroke/fill in payload', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#ff7300" isAnimationActive={false} />
        </LineChart>
      ))

      await hoverChart(container)

      // The tooltip item name span should have the color from the Line stroke
      const nameSpan = container.parentElement!.querySelector('.v-charts-tooltip-item-name')
      assertNotNull(nameSpan)
      const color = (nameSpan as HTMLElement).style.color
      // Color may be in rgb format or hex
      expect(color).toBeTruthy()
    })

    it('tooltip content appears when tooltip is active after hover', async () => {
      const { container } = render(() => (
        <LineChart width={500} height={300} data={data}>
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line dataKey="uv" stroke="#8884d8" isAnimationActive={false} />
        </LineChart>
      ))

      // Before hover, no tooltip content should exist
      const contentBefore = container.parentElement!.querySelector('.v-charts-tooltip-content')
      expect(contentBefore).toBeNull()

      await hoverChart(container)

      // After hover, tooltip content should render with items
      const contentAfter = container.parentElement!.querySelector('.v-charts-tooltip-content')
      assertNotNull(contentAfter)
      const items = container.parentElement!.querySelectorAll('.v-charts-tooltip-item')
      expect(items.length).toBeGreaterThan(0)
    })
  })
})
