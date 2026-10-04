import { render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Area, AreaChart, Line, LineChart, Scatter, ScatterChart, XAxis, YAxis } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'

const clock = vi.hoisted(() => ({
  reduced: false,
  fades: 0,
  runs: [] as Array<{ to: number, update: (v: number) => void, complete: () => void, stopped: boolean, duration?: number }>,
}))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (_from: number, to: number, options: { onUpdate: (v: number) => void, onComplete: () => void, duration?: number }) => {
    if (typeof _from !== 'number') {
      clock.fades++
      return { stop: () => {} }
    }
    const run = { to, update: options.onUpdate, complete: options.onComplete, stopped: false, duration: options.duration }
    clock.runs.push(run)
    return { stop: () => { run.stopped = true } }
  },
}))
vi.mock('@vueuse/core', async original => ({
  ...await original<typeof import('@vueuse/core')>(),
  usePreferredReducedMotion: () => ref(clock.reduced ? 'reduce' : 'no-preference'),
}))

async function frame(seconds?: number) {
  for (const run of clock.runs.filter(run => !run.stopped)) {
    run.update(seconds == null ? run.to : Math.min(seconds, run.to))
    if (seconds == null) {
      run.stopped = true
      run.complete()
    }
  }
  await nextTick()
}

export function cartesianMotionCases(kind: 'line' | 'area' | 'scatter') {
  const initial = [{ name: 'B', value: 40, x: 20 }, { name: 'C', value: 70, x: 60 }]
  const selector = kind === 'scatter' ? '.v-charts-scatter-symbol' : `.v-charts-${kind}-dot`
  function setup(active = true, extra: { label?: boolean, transition?: { duration: number, ease: 'linear' } } = {}) {
    const rows = ref(initial)
    const start = vi.fn()
    const end = vi.fn()
    const seriesProps = { isAnimationActive: active, onAnimationStart: start, onAnimationEnd: end, ...extra }
    const { container } = render(() => kind === 'scatter'
      ? (
          <ScatterChart width={400} height={300}>
            <XAxis type="number" dataKey="x" domain={[0, 100]} />
            <YAxis type="number" dataKey="value" domain={[0, 100]} />
            <Scatter data={rows.value} {...seriesProps} />
          </ScatterChart>
        )
      : kind === 'line'
        ? (
            <LineChart width={400} height={300} data={rows.value}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Line dataKey="value" {...seriesProps} />
            </LineChart>
          )
        : (
            <AreaChart width={400} height={300} data={rows.value}>
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} />
              <Area dot dataKey="value" {...seriesProps} />
            </AreaChart>
          ))
    const nodes = () => Array.from(container.querySelectorAll(selector))
    const geometry = (node: Element) => kind === 'scatter'
      ? node.querySelector('path')!.getAttribute('transform')
      : `${node.getAttribute('cx')},${node.getAttribute('cy')}`
    return { rows, container, nodes, geometry, start, end }
  }
  beforeEach(() => {
    clock.runs = []
    clock.reduced = false
    clock.fades = 0
    mockGetBoundingClientRect({ width: 400, height: 300 })
  })
  describe(`${kind} keyed motion through the public chart API`, () => {
    it('preserves existing DOM instances and screen geometry at prepend frame zero', async () => {
      const view = setup()
      await frame()
      const before = view.nodes()
      const positions = before.map(view.geometry)
      view.rows.value = [{ name: 'A', value: 20, x: 10 }, ...initial]
      await nextTick()
      const current = view.nodes()
      const offset = kind === 'scatter' ? 0 : 1 // Scatter identity is explicitly the row index.
      before.forEach((node, i) => {
        expect(current[i + offset]).toBe(node)
        expect(view.geometry(node)).toBe(positions[i])
      })
    })
    it('appends from the on-screen neighbour (scatter grows at its target position)', async () => {
      const view = setup()
      await frame()
      const neighbor = view.geometry(view.nodes().at(-1)!)
      view.rows.value = [...initial, { name: 'D', value: 10, x: 80 }]
      await nextTick()
      const added = view.nodes().at(-1)!
      if (kind === 'scatter') {
        expect(added.querySelector('path')!.getAttribute('d')).toContain('M0,0')
      }
      else {
        expect(view.geometry(added)).toBe(neighbor)
      }
      await frame()
      if (kind === 'scatter')
        expect(added.querySelector('path')!.getAttribute('d')).not.toContain('M0,0')
      else
        expect(view.geometry(added)).not.toBe(neighbor)
    })
    it('retains the removed DOM node through exit and removes it when settled', async () => {
      const view = setup()
      await frame()
      const removed = view.nodes()[1]
      view.rows.value = initial.slice(0, 1)
      await nextTick()
      expect(view.nodes()).toContain(removed)
      await frame(0.1)
      expect(view.nodes()).toContain(removed)
      await frame()
      expect(view.nodes()).not.toContain(removed)
    })
    it('interrupts from the actual screen value without remounting', async () => {
      const view = setup()
      await frame()
      const node = view.nodes()[0]
      const before = view.geometry(node)
      view.rows.value = initial.map(row => ({ ...row, value: 95, x: 90 }))
      await nextTick()
      await frame(0.15)
      const midway = view.geometry(node)
      expect(midway).not.toBe(before)
      view.rows.value = initial.map(row => ({ ...row, value: 5, x: 5 }))
      await nextTick()
      expect(view.nodes()[0]).toBe(node)
      expect(view.geometry(node)).toBe(midway)
      await frame()
      expect(view.geometry(node)).not.toBe(midway)
    })
    it.each(['disabled', 'reduced'] as const)('snaps immediately when %s', async (mode) => {
      clock.reduced = mode === 'reduced'
      const view = setup(mode !== 'disabled')
      await nextTick()
      await nextTick()
      const before = view.nodes().map(view.geometry)
      view.rows.value = initial.map(row => ({ ...row, value: 10, x: 10 }))
      await nextTick()
      expect(view.nodes().map(view.geometry)).not.toEqual(before)
      expect(clock.runs).toHaveLength(0)
      await nextTick()
      expect(view.start).toHaveBeenCalledTimes(2)
      expect(view.end).toHaveBeenCalledTimes(2)
      if (kind !== 'scatter')
        expect(view.container.querySelector('g[clip-path*="anim"]')).toBeNull()
    })
    it('applies the user timing to entrance and update, with one callback pair', async () => {
      const view = setup(true, { transition: { duration: 0.12, ease: 'linear' } })
      await nextTick()
      expect(clock.runs.at(-1)?.duration).toBe(0.12)
      await frame()
      const before = view.geometry(view.nodes()[0])
      view.rows.value = initial.map(row => ({ ...row, value: 90, x: 90 }))
      await nextTick()
      expect(clock.runs.at(-1)?.duration).toBe(0.12)
      expect(view.geometry(view.nodes()[0])).toBe(before)
      await frame()
      await nextTick()
      expect(view.start).toHaveBeenCalledTimes(2)
      expect(view.end).toHaveBeenCalledTimes(2)
    })
    it('keeps labels on screen while the geometry moves', async () => {
      const view = setup(true, { label: true })
      await nextTick()
      await frame()
      await nextTick()
      view.rows.value = initial.map(row => ({ ...row, value: 90, x: 90 }))
      await nextTick()
      await frame(0.25)
      await nextTick()
      expect(view.container.querySelector('.v-charts-label-list')).not.toBeNull()
      expect(clock.fades).toBe(0)
    })
    it('skips label opacity motion under reduced motion', async () => {
      clock.reduced = true
      const view = setup(true, { label: true })
      await nextTick()
      await nextTick()
      expect(view.container.querySelector('.v-charts-label-list')).not.toBeNull()
      expect(clock.fades).toBe(0)
    })
    if (kind === 'area') {
      it.each(['numeric', 'range', 'stacked'] as const)('keeps the %s baseline on the top-point clock through interruption', async (mode) => {
        const rows = ref([{ name: 'A', value: 40, bottom: 20, range: [20, 40] }, { name: 'B', value: 60, bottom: 30, range: [30, 60] }])
        const base = ref(0)
        const { container } = render(() => (
          <AreaChart width={400} height={300} data={rows.value}>
            <XAxis dataKey="name" />
            <YAxis domain={[0, 100]} />
            {mode === 'stacked' && <Area dataKey="bottom" stackId="a" />}
            <Area dataKey={mode === 'range' ? 'range' : 'value'} baseValue={base.value} stackId={mode === 'stacked' ? 'a' : undefined} />
          </AreaChart>
        ))
        await nextTick()
        await frame()
        const area = Array.from(container.querySelectorAll('.v-charts-area-area')).at(-1)!
        const oldPath = area.getAttribute('d')
        rows.value = rows.value.map(row => ({ ...row, value: 20, bottom: 10, range: [10, 20] }))
        base.value = 10
        await nextTick()
        expect(area.getAttribute('d')).toBe(oldPath)
        await frame(0.15)
        const midway = area.getAttribute('d')
        expect(midway).not.toBe(oldPath)
        rows.value = rows.value.map(row => ({ ...row, value: 70, bottom: 20, range: [20, 70] }))
        base.value = 20
        await nextTick()
        expect(area.getAttribute('d')).toBe(midway)
        await frame()
        expect(area.getAttribute('d')).not.toBe(midway)
      })
    }
    if (kind !== 'scatter') {
      it('uses the vertical category axis and a top-to-bottom sweep', async () => {
        const rows = ref(initial)
        const { container } = render(() => kind === 'line'
          ? (
              <LineChart layout="vertical" width={400} height={300} data={rows.value}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" />
                <Line dataKey="value" />
              </LineChart>
            )
          : (
              <AreaChart layout="vertical" width={400} height={300} data={rows.value}>
                <XAxis type="number" domain={[0, 100]} />
                <YAxis type="category" dataKey="name" />
                <Area dot dataKey="value" />
              </AreaChart>
            ))
        await nextTick()
        const rect = container.querySelector('clipPath[id*="anim"] rect')!
        expect(rect.getAttribute('height')).toBe('0')
        expect(Number(rect.getAttribute('width'))).toBeGreaterThan(0)
        await frame()
        const oldNodes = Array.from(container.querySelectorAll(selector))
        const oldGeometry = oldNodes.map(node => `${node.getAttribute('cx')},${node.getAttribute('cy')}`)
        rows.value = [{ name: 'A', value: 10, x: 10 }, ...initial]
        await nextTick()
        const current = Array.from(container.querySelectorAll(selector))
        oldNodes.forEach((node, index) => {
          expect(current[index + 1]).toBe(node)
          expect(`${node.getAttribute('cx')},${node.getAttribute('cy')}`).toBe(oldGeometry[index])
        })
      })
      it('keeps a null value as a gap at update frame zero', async () => {
        const rows = ref<Array<{ name: string, value: number | null }>>([{ name: 'A', value: 10 }, { name: 'B', value: 40 }, { name: 'C', value: 80 }])
        const { container } = render(() => kind === 'line'
          ? <LineChart width={400} height={300} data={rows.value}><Line dataKey="value" /></LineChart>
          : <AreaChart width={400} height={300} data={rows.value}><Area dot dataKey="value" /></AreaChart>)
        await nextTick()
        await frame()
        rows.value = rows.value.map(row => row.name === 'B' ? { ...row, value: null } : row)
        await nextTick()
        expect(container.querySelectorAll(selector)).toHaveLength(2)
        const path = container.querySelector(`.v-charts-${kind}-curve`)!.getAttribute('d')!
        expect(path.match(/M/g)).toHaveLength(2)
      })
      it('sweeps the curve and dots together with no dashoffset reveal', async () => {
        const view = setup()
        await nextTick()
        const dot = view.nodes()[0]
        const swept = dot.closest('g[clip-path*="anim"]')!
        expect(swept).not.toBeNull()
        expect(swept.querySelector(`.v-charts-${kind}-curve`)).not.toBeNull()
        expect(view.container.querySelector('[stroke-dashoffset]')).toBeNull()
        const rect = view.container.querySelector('clipPath[id*="anim"] rect')!
        expect(rect.getAttribute('width')).toBe('0')
        await frame(0.3)
        expect(Number(rect.getAttribute('width'))).toBeGreaterThan(0)
        expect(Number(rect.getAttribute('width'))).toBeLessThan(351)
        await frame()
        expect(view.nodes()[0]).toBe(dot)
        expect(Number(rect.getAttribute('width'))).toBeGreaterThan(300)
        expect(view.start).toHaveBeenCalledTimes(1)
        expect(view.end).toHaveBeenCalledTimes(1)
      })
    }
  })
}
