import { fireEvent, render } from '@testing-library/vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { nextTick, ref } from 'vue'
import { JourneySankey } from '@/index'
import { mockGetBoundingClientRect } from '@/test/mockGetBoundingClientRect'
import { computeJourneyLayout } from '../journeyUtils'

// Shaped like an analytics journeys view: 11 sessions go / → /pricing and 6 of them end there.
const journeys = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/', '/docs'], count: 2 },
  { path: ['/', '/pricing', '/docs/self-hosting'], count: 1 },
  { path: ['/', '/pricing', '/features', '/web-analytics'], count: 1 },
  { path: ['/', '/pricing', '/docs/mcp', '/hiding-own-traffic'], count: 1 },
  { path: ['/', '/docs'], count: 3 },
  { path: ['/de', '/de/pricing', '/de', '/de/docs'], count: 3 },
]

const clock = vi.hoisted(() => ({ runs: [] as Array<{ to: number, update: (v: number) => void, complete: () => void, stopped: boolean }> }))
vi.mock('motion-v', async original => ({
  ...await original<typeof import('motion-v')>(),
  animate: (from: number, to: number, options: { onUpdate: (v: number) => void, onComplete?: () => void }) => {
    if (typeof from !== 'number')
      return { stop() {} }
    const run = { to, update: options.onUpdate, complete: () => options.onComplete?.(), stopped: false }
    clock.runs.push(run)
    return { stop: () => { run.stopped = true } }
  },
}))
async function frame(progress?: number) {
  for (const run of clock.runs.filter(run => !run.stopped)) {
    run.update(progress ?? run.to)
    if (progress == null) {
      run.stopped = true
      run.complete()
    }
  }
  await nextTick()
}

const options = { width: 900, height: 600, steps: 4, exitsKnown: true, nodeWidth: 8, nodePadding: 8, labelHeight: 34, labelWidth: 160, top: 28 }

beforeEach(() => {
  mockGetBoundingClientRect({ width: 900, height: 600 })
})

describe('computeJourneyLayout', () => {
  it('counts sessions per step, sessions that end there, and leaves exits unknown where paths are cut', () => {
    const { nodes } = computeJourneyLayout(journeys, options)
    const node = (step: number, name: string) => nodes.find(n => n.step === step && n.name === name)!
    expect([node(1, '/pricing').count, node(1, '/pricing').exits]).toEqual([11, 6])
    expect(node(1, '/docs').exits).toBe(3)
    expect(node(3, '/docs').exits).toBeNull()

    const cut = computeJourneyLayout(journeys, { ...options, steps: 3 })
    expect(cut.nodes.find(n => n.step === 1 && n.name === '/pricing')!.exits).toBe(6)
    expect(computeJourneyLayout(journeys, { ...options, exitsKnown: false }).nodes.every(n => n.exits === null)).toBe(true)
  })

  it('stacks bands inside their nodes, keeps label room and fits the height', () => {
    const layout = computeJourneyLayout(journeys, options)
    expect(layout.height).toBeLessThanOrEqual(options.height + 1e-6)
    for (const node of layout.nodes) {
      expect(node.slotHeight).toBeGreaterThanOrEqual(options.labelHeight)
      const out = layout.links.filter(link => link.source === node.id)
      const into = layout.links.filter(link => link.target === node.id)
      for (const link of out) {
        expect(link.y0 - link.width / 2).toBeGreaterThanOrEqual(node.y - 1e-6)
        expect(link.y0 + link.width / 2).toBeLessThanOrEqual(node.y + node.continueHeight + 1e-6)
      }
      for (const link of into)
        expect(link.y1 + link.width / 2).toBeLessThanOrEqual(node.y + node.continueHeight + node.exitHeight + 1e-6)
    }
  })
})

describe('<JourneySankey />', () => {
  const links = (container: Element) => Array.from(container.querySelectorAll<SVGPathElement>('.v-charts-journey-link'))

  it('shows how many sessions end at a node, as a grey segment and in its label', () => {
    const { container, getByText } = render(() => <JourneySankey width={900} height={600} isAnimationActive={false} exitColor="grey" data={journeys} />)
    expect(getByText('11 · 55% end here')).toBeTruthy()
    expect(getByText('14 sessions')).toBeTruthy()
    expect(container.querySelectorAll('.v-charts-journey-node-exit').length).toBeGreaterThan(0)
    expect(container.querySelector<SVGRectElement>('.v-charts-journey-node-exit')!.style.fill).toBe('grey')
  })

  it('highlights every path connected to a hovered node and fades the rest', async () => {
    const { container, getByText } = render(() => <JourneySankey width={900} height={600} isAnimationActive={false} data={journeys} />)
    expect(links(container).every(link => link.style.opacity === '0.2')).toBe(true)
    const node = getByText('/de/pricing').closest('.v-charts-journey-node')!.querySelector('g')!
    await fireEvent.mouseEnter(node)
    const opacities = links(container).map(link => link.style.opacity)
    expect(opacities.filter(o => o === '0.45')).toHaveLength(3)
    expect(opacities.filter(o => o === '0.07')).toHaveLength(links(container).length - 3)
    expect(getByText('/pricing').closest<SVGGElement>('.v-charts-journey-node')!.style.opacity).toBe('0.25')
    await fireEvent.mouseLeave(node)
    expect(links(container).every(link => link.style.opacity === '0.2')).toBe(true)
  })

  it('pins the largest journey through a clicked node through v-model and unpins on a second click', async () => {
    const pinned = ref<string[] | null>(null)
    const { container, getByText } = render(() => (
      <JourneySankey width={900} height={600} isAnimationActive={false} data={journeys} pinned={pinned.value} {...{ 'onUpdate:pinned': (path: string[] | null) => { pinned.value = path } }} />
    ))
    const node = getByText('/de/pricing').closest('.v-charts-journey-node')!.querySelector('g')!
    await fireEvent.click(node)
    expect(pinned.value).toEqual(['/de', '/de/pricing', '/de', '/de/docs'])
    await nextTick()
    expect(links(container).filter(link => link.style.opacity === '0.45')).toHaveLength(3)
    await fireEvent.click(node)
    expect(pinned.value).toBeNull()
  })

  it('fades a removed journey out before the remaining nodes slide past it', async () => {
    const data = ref(journeys)
    const { container, getByText } = render(() => <JourneySankey width={900} height={600} data={data.value} />)
    await frame()
    const leaving = getByText('/de/pricing').closest<SVGGElement>('.v-charts-journey-node')!
    data.value = journeys.filter(journey => journey.path[0] !== '/de')
    await nextTick()
    await frame(0.3)
    expect(Number(leaving.style.opacity)).toBeLessThan(0.5)
    await frame(0.6)
    expect(Number(leaving.style.opacity)).toBe(0)
    await frame()
    expect(container.textContent).not.toContain('/de/pricing')
  })

  it('walks nodes with the arrow keys and pins with Enter', async () => {
    const pinned = ref<string[] | null>(null)
    const { container } = render(() => (
      <JourneySankey width={900} height={600} isAnimationActive={false} data={journeys} {...{ 'onUpdate:pinned': (path: string[] | null) => { pinned.value = path } }} />
    ))
    const group = container.querySelector('.v-charts-journey')!
    await fireEvent.keyDown(group, { key: 'ArrowDown' })
    expect(group.getAttribute('aria-label')).toBe('/, step 1: 14 sessions')
    await fireEvent.keyDown(group, { key: 'ArrowRight' })
    expect(group.getAttribute('aria-label')).toBe('/pricing, step 2: 11 · 55% end here')
    await fireEvent.keyDown(group, { key: 'Enter' })
    expect(pinned.value).toEqual(['/', '/pricing'])
  })
})
