import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { Funnel, FunnelChart, Pie, PieChart, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, Sankey, Treemap } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { motionTokens } from '@/animation/motion'

const clock = vi.hoisted(() => ({ reduced: false, runs: [] as Array<{ to: number, update: (v: number) => void, complete: () => void, stopped: boolean, duration?: number }> }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: number, to: number, options: { onUpdate: (v: number) => void, onComplete?: () => void, duration?: number }) => {
    if (typeof from !== 'number')
      return { stop() {} }
    const run = { to, update: options.onUpdate, complete: () => options.onComplete?.(), stopped: false, duration: options.duration }
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
    run.update(seconds ?? run.to)
    if (seconds == null) {
      run.stopped = true
      run.complete()
    }
  }
  await nextTick()
}
beforeEach(() => {
  clock.runs = []
  clock.reduced = false
  mockGetBoundingClientRect({ width: 400, height: 300 })
})
const initial = [{ name: 'B', value: 40 }, { name: 'C', value: 70 }]
export function remainingMotionCases(kind: 'pie' | 'radar' | 'radial' | 'funnel' | 'treemap' | 'sankey') {
  function setup(active = true, override = false) {
    const rows = ref(initial)
    const width = ref(400)
    const start = vi.fn()
    const end = vi.fn()
    const props = { onAnimationStart: start, onAnimationEnd: end, isAnimationActive: active, transition: override ? { duration: 0.12, ease: 'linear' as const } : undefined }
    const { container } = render(() => {
      switch (kind) {
        case 'pie': return <PieChart width={400} height={300}><Pie data={rows.value} dataKey="value" paddingAngle={4} {...props} v-slots={{ shape: (sector: { name: string, startAngle: number, endAngle: number, paddingAngle: number }) => <path data-name={sector.name} data-start={sector.startAngle} data-end={sector.endAngle} data-padding={sector.paddingAngle} d={`M${sector.startAngle},${sector.endAngle}`} /> }} /></PieChart>
        case 'radar': return (
          <RadarChart width={400} height={300} data={rows.value}>
            <PolarAngleAxis dataKey="name" />
            <PolarRadiusAxis domain={[0, 100]} />
            <Radar dot dataKey="value" {...props} />
          </RadarChart>
        )
        case 'radial': return <RadialBarChart width={400} height={300} data={rows.value}><RadialBar dataKey="value" {...props} /></RadialBarChart>
        case 'funnel': return <FunnelChart width={400} height={300}><Funnel data={rows.value} dataKey="value" {...props} v-slots={{ shape: (trap: { x: number, y: number, height: number, upperWidth: number }) => <rect x={trap.x} y={trap.y} height={trap.height} width={trap.upperWidth} /> }} /></FunnelChart>
        case 'treemap': return <Treemap width={width.value} height={300} data={rows.value} {...props} v-slots={{ content: (node: { name: string, x: number, y: number, width: number, height: number }) => <rect data-name={node.name} x={node.x} y={node.y} width={node.width} height={node.height} /> }} />
        case 'sankey': return <Sankey width={width.value} height={300} data={{ nodes: [...rows.value, { name: 'sink' }], links: rows.value.map((row, index) => ({ source: index, target: rows.value.length, value: row.value })) }} {...props} />
      }
    })
    const selector = { pie: '.v-charts-pie > g', radar: '.v-charts-radar-dots circle', radial: '.v-charts-radial-bar > path', funnel: '.v-charts-funnel > g:has(rect)', treemap: '.v-charts-treemap-node', sankey: '.v-charts-sankey-node' }[kind]
    const nodes = () => Array.from(container.querySelectorAll(selector))
    const geometry = (node: Element) => {
      const shape = node.matches('circle,path') ? node : node.querySelector('path,rect')!
      return ['d', 'x', 'y', 'width', 'height', 'cx', 'cy'].map(attr => shape?.getAttribute(attr)).join('|')
    }
    return { rows, width, container, nodes, geometry, start, end }
  }
  describe(`${kind} public keyed transitions`, () => {
    if (kind === 'treemap' || kind === 'sankey') {
      // A lost root size capability would animate a resize as an ordinary data update.
      it('snaps settled geometry to a new chart width without starting a transition', async () => {
        const view = setup()
        await frame()
        const before = view.nodes().map(view.geometry)
        view.start.mockClear()
        view.width.value = 600
        await nextTick()
        expect(view.nodes().map(view.geometry)).not.toEqual(before)
        expect(view.start).not.toHaveBeenCalled()
      })
    }
    if (kind === 'treemap') {
      // Clearing the chart used to dispose its geometry: refill must replay the first reveal.
      it('replays the fade entrance when an empty chart is refilled', async () => {
        const view = setup()
        await frame()
        view.rows.value = []
        await nextTick()
        expect(view.nodes()).toHaveLength(0)
        view.rows.value = initial
        await nextTick()
        expect(view.nodes().map(node => node.getAttribute('opacity'))).toEqual(['0', '0'])
      })
    }
    if (kind === 'sankey') {
      // At the last clock frame, floating interpolation must not make a collapsed rect negative.
      it('lands exiting nodes on exact zero height before completion', async () => {
        const rows = ref([
          { name: 'Jan', value: 60 },
          { name: 'Feb', value: 81 },
          { name: 'Mar', value: 98 },
          { name: 'Apr', value: 54 },
          { name: 'May', value: 19 },
          { name: 'Jun', value: 47 },
        ])
        const { container } = render(() => (
          <Sankey
            width={720}
            height={360}
            data={{
              nodes: [{ name: 'Total' }, ...rows.value],
              links: rows.value.map((row, index) => ({ source: 0, target: index + 1, value: row.value })),
            }}
          />
        ))
        await frame()
        rows.value = []
        await nextTick()
        await frame(motionTokens.update.duration)
        const rects = container.querySelectorAll('.v-charts-sankey-node rect')
        expect(rects.length).toBeGreaterThan(0)
        expect(Array.from(rects, rect => Number(rect.getAttribute('height')))).toEqual([0, 0, 0, 0, 0, 0, 0])
      })
    }
    it('keeps DOM identity and screen geometry on prepend and reorder', async () => {
      const view = setup()
      await frame()
      const before = view.nodes()
      expect(before.length).toBeGreaterThanOrEqual(2)
      const geometry = before.map(view.geometry)
      view.rows.value = [{ name: 'A', value: 20 }, initial[1], initial[0]]
      await nextTick()
      before.forEach((node, index) => {
        expect(view.nodes()).toContain(node)
        expect(view.geometry(node)).toBe(geometry[index])
      })
      await frame()
      before.forEach(node => expect(view.nodes()).toContain(node))
    })
    it('starts collapsed, retains exits until completion, and lands on nonzero geometry', async () => {
      const view = setup()
      await nextTick()
      const entrance = view.nodes().map(view.geometry)
      if (kind === 'pie') {
        for (const node of view.container.querySelectorAll('[data-start]'))
          expect(node.getAttribute('data-start')).toBe(node.getAttribute('data-end'))
      }
      else if (kind === 'radar') {
        for (const node of view.nodes()) {
          expect(node.getAttribute('cx')).toBe('200')
          expect(node.getAttribute('cy')).toBe('150')
        }
      }
      else if (kind === 'radial') {
        expect(view.nodes()).toHaveLength(0)
      }
      else if (kind === 'treemap') {
        // A diagonal cascade: every cell starts transparent, at 92 % of its size.
        for (const node of view.nodes()) {
          expect(node.getAttribute('opacity')).toBe('0')
          expect(Number(node.querySelector('rect')!.getAttribute('width'))).toBeGreaterThan(0)
        }
      }
      else {
        for (const node of view.nodes())
          expect(node.querySelector('rect')!.getAttribute('height')).toBe('0')
      }
      await frame()
      expect(view.nodes().map(view.geometry)).not.toEqual(entrance)
      const removed = kind === 'treemap' ? view.nodes().find(node => node.querySelector('[data-name]')?.getAttribute('data-name') === 'C')! : view.nodes()[1]
      view.rows.value = [initial[0]]
      await nextTick()
      expect(view.nodes()).toContain(removed)
      await frame(0.1)
      expect(view.nodes()).toContain(removed)
      await frame()
      expect(view.nodes()).not.toContain(removed)
    })
    it('interrupts from displayed geometry', async () => {
      const view = setup()
      await frame()
      const node = view.nodes()[0]
      const before = view.geometry(node)
      view.rows.value = [{ name: 'B', value: 90 }, { name: 'C', value: 10 }]
      await nextTick()
      await frame(0.15)
      const midway = view.geometry(node)
      expect(midway).not.toBe(before)
      view.rows.value = [{ name: 'B', value: 10 }, { name: 'C', value: 90 }]
      await nextTick()
      expect(view.geometry(node)).toBe(midway)
      await frame()
      expect(view.geometry(node)).not.toBe(midway)
    })
    it.each(['disabled', 'reduced'])('snaps when %s', async (mode) => {
      clock.reduced = mode === 'reduced'
      const view = setup(mode !== 'disabled')
      await nextTick()
      const before = view.nodes().map(view.geometry)
      view.rows.value = [{ name: 'B', value: 90 }, { name: 'C', value: 10 }]
      await nextTick()
      expect(view.nodes().map(view.geometry)).not.toEqual(before)
      expect(clock.runs).toHaveLength(0)
    })
    it('delivers one start and end callback per transition', async () => {
      const view = setup()
      await frame()
      await nextTick()
      expect(view.start).toHaveBeenCalledTimes(1)
      expect(view.end).toHaveBeenCalledTimes(1)
      view.rows.value = [{ name: 'B', value: 90 }, { name: 'C', value: 10 }]
      await nextTick()
      await frame()
      await nextTick()
      expect(view.start).toHaveBeenCalledTimes(2)
      expect(view.end).toHaveBeenCalledTimes(2)
    })
    it('uses the transition override for entrance and update', async () => {
      const view = setup(true, true)
      await nextTick()
      expect(clock.runs.at(-1)?.duration).toBe(0.12)
      await frame()
      view.rows.value = [{ name: 'B', value: 20 }, initial[1]]
      await nextTick()
      expect(clock.runs.at(-1)?.duration).toBe(0.12)
    })
    if (kind === 'sankey') {
      it('keeps links keyed and attached to displayed nodes through interruption and exit', async () => {
        const view = setup()
        await frame()
        const links = Array.from(view.container.querySelectorAll('.v-charts-sankey-link'))
        const oldPaths = links.map(link => link.getAttribute('d'))
        view.rows.value = [{ name: 'A', value: 20 }, initial[1], initial[0]]
        await nextTick()
        links.forEach((link, index) => {
          expect(view.container.contains(link)).toBe(true)
          expect(link.getAttribute('d')).toBe(oldPaths[index])
        })
        await frame(0.15)
        const midway = links.map(link => link.getAttribute('d'))
        view.rows.value = [{ name: 'A', value: 90 }, initial[1], { name: 'B', value: 10 }]
        await nextTick()
        expect(links.map(link => link.getAttribute('d'))).toEqual(midway)
        await frame()
        view.rows.value = [initial[0]]
        await nextTick()
        expect(view.container.contains(links[1])).toBe(true)
        await frame(0.5)
        expect(links[1].getAttribute('stroke-width')).toBe('0')
        await frame()
        expect(view.container.contains(links[1])).toBe(false)
      })
    }
    if (kind === 'pie') {
      it('keeps the ring angle total through insert, exit, and interruption', async () => {
        const view = setup()
        await frame()
        const total = () => Array.from(view.container.querySelectorAll('[data-start]')).reduce((sum, node) => sum + Number(node.getAttribute('data-end')) - Number(node.getAttribute('data-start')) + Number(node.getAttribute('data-padding')), 0)
        expect(total()).toBeCloseTo(360, 6)
        view.rows.value = [initial[0], { name: 'D', value: 20 }, initial[1]]
        await nextTick()
        for (const time of [0, 0.1, 0.2]) {
          await frame(time)
          expect(total()).toBeCloseTo(360, 6)
        }
        view.rows.value = [initial[0], { name: 'D', value: 80 }]
        await nextTick()
        for (const time of [0, 0.1, 0.3, 0.5]) {
          await frame(time)
          expect(total()).toBeCloseTo(360, 6)
        }
        await frame()
        expect(total()).toBeCloseTo(360, 6)
      })
    }
  })

  if (kind === 'treemap') {
    it('treemap nest navigation updates without remounting its animation clock', async () => {
      const { container } = render(() => <Treemap type="nest" width={400} height={300} data={[{ name: 'Group', children: initial }]} />)
      await frame()
      const count = clock.runs.length
      await fireEvent.click(container.querySelector('.v-charts-treemap-node')!)
      expect(clock.runs.length).toBe(count + 1)
      expect(clock.runs.at(-1)?.duration).toBe(motionTokens.enter.duration)
      await frame()
      expect(container.textContent).toContain('Root')
    })

    it('fades treemap labels in with their tiles', async () => {
      mockGetBoundingClientRect({ width: 10, height: 10 })
      const { container } = render(() => <Treemap width={400} height={300} data={initial} />)
      const label = () => container.querySelector('.v-charts-treemap-node text')
      await frame(0.05)
      expect(Number(label()?.getAttribute('opacity') ?? 1)).toBeLessThan(0.5)
      await frame()
      expect(label()?.hasAttribute('opacity')).toBe(false)
    })
  }
}
