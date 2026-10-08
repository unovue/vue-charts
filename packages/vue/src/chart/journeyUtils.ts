/** One journey: the steps a group of sessions took, and how many sessions took it. */
export interface JourneyInput<Row = unknown> {
  rows?: readonly Row[]
  path: string[]
  count: number
}

export interface JourneyNode<Row = unknown> {
  rows: readonly Row[]
  /** `step` and `name`, unique across the chart. */
  id: string
  name: string
  /** Zero-based column. */
  step: number
  /** Sessions on the shown paths at this step. */
  count: number
  /** Sessions whose shown path ends here; `null` when that is unknown (last column, cut paths). */
  exits: number | null
  x: number
  /** Top of the bar. */
  y: number
  /** Height of the part that continues to the next step. */
  continueHeight: number
  /** Height of the part that ends here (drawn grey). */
  exitHeight: number
  /** Top of the label slot; the slot is at least `labelHeight` tall even for thin bars. */
  slotHeight: number
}

export interface JourneyLink<Row = unknown> {
  rows: readonly Row[]
  id: string
  source: string
  target: string
  /** Step of the source node. */
  step: number
  count: number
  width: number
  /** Center of the band at the source and target edges. */
  y0: number
  y1: number
  x0: number
  x1: number
}

export interface JourneyStep {
  step: number
  x: number
  /** Sessions in this column. */
  total: number
  previousTotal: number | null
}

export interface JourneyLayout<Row = unknown> {
  nodes: JourneyNode<Row>[]
  links: JourneyLink<Row>[]
  steps: JourneyStep[]
  /** Pixels per session. */
  scale: number
  /** Height the layout needs at this scale. */
  height: number
}

export interface JourneyLayoutOptions {
  width: number
  height: number
  /** Columns to show; longer paths are cut. */
  steps: number
  /** Whether the end of a path means the session ended there (false when paths were cut). */
  exitsKnown: boolean
  nodeWidth: number
  nodePadding: number
  /** Vertical room a node label needs; thin nodes still get this much. */
  labelHeight: number
  /** Room right of the last column for its labels. */
  labelWidth: number
  top: number
}

const SEPARATOR = '\u0001'

export const journeyNodeId = (step: number, name: string) => `${step}${SEPARATOR}${name}`

/**
 * Lays out journeys as columns of steps. Nodes in a column are grouped under their main parent
 * (the parent sending the most sessions) in the parent's order, largest first, which keeps
 * links from crossing more than needed. One scale (px per session) applies to every column,
 * found by bisection so the tallest column fits the height, with every node keeping room for
 * its label.
 */
export function computeJourneyLayout<Row>(input: readonly JourneyInput<Row>[], options: JourneyLayoutOptions): JourneyLayout<Row> {
  const steps = Math.max(1, Math.floor(options.steps))
  const counts = new Map<string, { name: string, step: number, count: number, exits: number, rows: Row[] }>()
  const linkCounts = new Map<string, { source: string, target: string, step: number, count: number, rows: Row[] }>()

  for (const journey of input) {
    const count = Number(journey.count)
    if (!Array.isArray(journey.path) || journey.path.length === 0 || !(count > 0))
      continue
    const path = journey.path.slice(0, steps).map(String)
    path.forEach((name, step) => {
      const id = journeyNodeId(step, name)
      const node = counts.get(id) ?? { name, step, count: 0, exits: 0, rows: [] }
      node.count += count
      node.rows.push(...journey.rows ?? [])
      if (step === path.length - 1 && journey.path.length === path.length)
        node.exits += count
      counts.set(id, node)
      if (step > 0) {
        const source = journeyNodeId(step - 1, path[step - 1])
        const linkId = `${source}${SEPARATOR}${SEPARATOR}${id}`
        const link = linkCounts.get(linkId) ?? { source, target: id, step: step - 1, count: 0, rows: [] }
        link.count += count
        link.rows.push(...journey.rows ?? [])
        linkCounts.set(linkId, link)
      }
    })
  }

  let shownSteps = 0
  for (const node of counts.values())
    shownSteps = Math.max(shownSteps, node.step + 1)
  // The parent sending the most sessions into each node, found once instead of per comparison.
  const mainParent = new Map<string, { source: string, count: number }>()
  for (const link of linkCounts.values()) {
    const best = mainParent.get(link.target)
    if (!best || link.count > best.count)
      mainParent.set(link.target, { source: link.source, count: link.count })
  }
  // Order columns: first by count, then each node under its main parent, in the parent's order.
  const order = new Map<string, number>()
  const columns: string[][] = []
  for (let step = 0; step < shownSteps; step++) {
    const ids = [...counts.entries()].filter(([, node]) => node.step === step).map(([id]) => id)
    const parentRank = (id: string) => order.get(mainParent.get(id)?.source ?? '') ?? 0
    ids.sort((a, b) => step === 0
      ? counts.get(b)!.count - counts.get(a)!.count || a.localeCompare(b)
      : parentRank(a) - parentRank(b) || counts.get(b)!.count - counts.get(a)!.count || a.localeCompare(b))
    ids.forEach((id, rank) => order.set(id, rank))
    columns.push(ids)
  }

  const available = Math.max(0, options.height - options.top)
  const extent = (scale: number) => Math.max(0, ...columns.map(ids => ids.reduce((sum, id, i) => sum + Math.max(counts.get(id)!.count * scale, options.labelHeight) + (i ? options.nodePadding : 0), 0)))
  const largest = Math.max(1, ...columns.map(ids => ids.reduce((sum, id) => sum + counts.get(id)!.count, 0)))
  let lo = 0
  let hi = available / largest
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2
    if (extent(mid) <= available)
      lo = mid
    else
      hi = mid
  }
  const scale = lo

  const columnGap = shownSteps > 1 ? Math.max(0, (options.width - options.nodeWidth - options.labelWidth) / (shownSteps - 1)) : 0
  const nodes: JourneyNode<Row>[] = []
  const byId = new Map<string, JourneyNode<Row>>()
  columns.forEach((ids, step) => {
    let y = options.top
    for (const id of ids) {
      const data = counts.get(id)!
      const isLast = step === steps - 1
      const exits = options.exitsKnown && !isLast ? data.exits : null
      const height = data.count * scale
      const exitHeight = (exits ?? 0) * scale
      const node: JourneyNode<Row> = {
        id,
        rows: data.rows,
        name: data.name,
        step,
        count: data.count,
        exits,
        x: step * columnGap,
        y,
        continueHeight: height - exitHeight,
        exitHeight,
        slotHeight: Math.max(height, options.labelHeight),
      }
      nodes.push(node)
      byId.set(id, node)
      y += node.slotHeight + options.nodePadding
    }
  })

  // Bands leave a source from the top in target order and enter a target in source order.
  const outgoing = new Map<string, number>()
  const incoming = new Map<string, number>()
  const sortedLinks = [...linkCounts.entries()].sort(([, a], [, b]) =>
    (order.get(a.source)! - order.get(b.source)!) || (order.get(a.target)! - order.get(b.target)!))
  const links: JourneyLink<Row>[] = []
  for (const [id, link] of sortedLinks) {
    const source = byId.get(link.source)!
    const target = byId.get(link.target)!
    const width = link.count * scale
    const out = outgoing.get(link.source) ?? 0
    links.push({ id, rows: link.rows, source: link.source, target: link.target, step: link.step, count: link.count, width, x0: source.x + options.nodeWidth, x1: target.x, y0: source.y + out + width / 2, y1: 0 })
    outgoing.set(link.source, out + width)
  }
  for (const link of [...links].sort((a, b) => (order.get(a.target)! - order.get(b.target)!) || (order.get(a.source)! - order.get(b.source)!))) {
    const target = byId.get(link.target)!
    const into = incoming.get(link.target) ?? 0
    link.y1 = target.y + into + link.width / 2
    incoming.set(link.target, into + link.width)
  }

  const totals = columns.map(ids => ids.reduce((sum, id) => sum + counts.get(id)!.count, 0))
  return {
    nodes,
    links,
    steps: totals.map((total, step) => ({ step, x: step * columnGap, total, previousTotal: step ? totals[step - 1] : null })),
    scale,
    height: options.top + extent(scale),
  }
}

/**
 * Every link on a path through the start links: everything upstream of their sources and
 * downstream of their targets. Plain node and link data allow no more than this; exact journeys
 * need path data (see `journeyLinksOf`).
 */
export function connectedLinks(links: readonly JourneyLink[], start: readonly JourneyLink[]): Set<string> {
  const result = new Set(start.map(link => link.id))
  const up = [...new Set(start.map(link => link.source))]
  const down = [...new Set(start.map(link => link.target))]
  const seenUp = new Set(up)
  const seenDown = new Set(down)
  while (up.length) {
    const node = up.pop()!
    for (const link of links) {
      if (link.target === node) {
        result.add(link.id)
        if (!seenUp.has(link.source)) {
          seenUp.add(link.source)
          up.push(link.source)
        }
      }
    }
  }
  while (down.length) {
    const node = down.pop()!
    for (const link of links) {
      if (link.source === node) {
        result.add(link.id)
        if (!seenDown.has(link.target)) {
          seenDown.add(link.target)
          down.push(link.target)
        }
      }
    }
  }
  return result
}

/** The link ids along one exact journey. */
export function journeyLinksOf(path: readonly string[], steps: number): Set<string> {
  const shown = path.slice(0, steps)
  return new Set(shown.slice(1).map((name, i) => `${journeyNodeId(i, shown[i])}${SEPARATOR}${SEPARATOR}${journeyNodeId(i + 1, name)}`))
}

/** The largest journey through a node or a link, to pin on click. */
export function largestJourneyThrough(input: readonly JourneyInput[], steps: number, through: { step: number, names: string[] }): string[] | undefined {
  let best: JourneyInput | undefined
  for (const journey of input) {
    const path = journey.path.slice(0, steps)
    const matches = through.names.every((name, i) => path[through.step + i] === name)
    if (matches && (!best || journey.count > best.count))
      best = journey
  }
  return best?.path.slice(0, steps)
}

/** Shortens a label in the middle, keeping the start and the end readable. */
export function truncateMiddle(text: string, maxChars: number): string {
  if (text.length <= maxChars || maxChars < 5)
    return text
  const keep = maxChars - 1
  const head = Math.ceil(keep / 2)
  return `${text.slice(0, head)}…${text.slice(text.length - (keep - head))}`
}

/**
 * Nodes on both layouts whose rank within their step changes. Sliding them would pass them through
 * their neighbours, so they fold away and unfold at their new place instead.
 */
export function reorderedNodes(previous: readonly JourneyNode[], next: readonly JourneyNode[]): Set<string> {
  const before = new Map(previous.map(node => [node.id, node]))
  const common = next.filter(node => before.has(node.id))
  const moved = new Set<string>()
  for (const step of new Set(common.map(node => node.step))) {
    const nodes = common.filter(node => node.step === step)
    const oldOrder = [...nodes].sort((a, b) => before.get(a.id)!.y - before.get(b.id)!.y)
    const newOrder = [...nodes].sort((a, b) => a.y - b.y)
    // A node keeps its rank when the same nodes stay above it; anything else crosses a neighbour.
    newOrder.forEach((node, rank) => {
      if (oldOrder[rank] !== node)
        moved.add(node.id)
    })
  }
  return moved
}
