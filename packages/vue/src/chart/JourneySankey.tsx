import { type PropType, type SlotsType, computed, defineComponent, reactive, ref, watch } from 'vue'
import { useReducedMotion } from '@/animation/useReducedMotion'
import { chartEmits, chartListeners } from '@/events/componentEvents'
import { provideChartContext, useChartTooltip } from '@/state/chartContext'
import type { TooltipPayloadConfiguration } from '@/state/chartTooltip'
import { provideRenderPhase } from '@/animation/renderPhase'
import { type Reveal, useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { chartSizeProps, useResponsiveSize } from '@/hooks/useResponsiveSize'
import { useTrackedData } from '@/hooks/useTrackedData'
import Surface from '@/container/Surface'
import { ChartsWrapper } from './ChartsWrapper'
import { boxAttrs, cellChartOptions, cellGridSharedProps, isFocusVisible, rootAttrs } from './CellGridLayer'
import {
  type JourneyInput,
  type JourneyLink,
  type JourneyNode,
  type JourneyStep,
  computeJourneyLayout,
  connectedLinks,
  journeyLinksOf,
  largestJourneyThrough,
  reorderedNodes,
  truncateMiddle,
} from './journeyUtils'

export interface JourneyHeaderSlotProps extends JourneyStep {
  width: number
}

export interface JourneyLabelSlotProps {
  node: JourneyNode
  /** Default second line, e.g. "11 · 55% end here". */
  subtitle: string
}

export interface JourneySankeySlots {
  header?: (props: JourneyHeaderSlotProps) => any
  label?: (props: JourneyLabelSlotProps) => any
  default?: () => any
}

const HEADER_BAND = 28
const LABEL_HEIGHT = 34
const CHAR_WIDTH = 6.6
const CURVATURE = 0.42

export const JourneySankeyVueProps = {
  isAnimationActive: cellGridSharedProps.isAnimationActive,
  transition: cellGridSharedProps.transition,
  /** One row per journey: the pages (or events) in order and how many sessions took it. */
  data: { type: Array as PropType<Record<string, any>[]>, required: true as const },
  pathKey: { type: String, default: 'path' },
  dataKey: { type: String, default: 'count' },
  /** Columns to show; longer journeys are cut. Defaults to the longest journey. */
  steps: { type: Number, default: undefined },
  /**
   * Whether a journey's end means the session ended there. Set it to `false` when journeys
   * were cut before they reached you, so no node claims an "end here" share.
   */
  exitsKnown: { type: Boolean, default: true },
  color: { type: String, default: 'var(--v-charts-series, #2563eb)' },
  /** Fill for the part of a node whose sessions end there. */
  exitColor: { type: String, default: 'var(--v-charts-inactive, #a3a3a3)' },
  nodeWidth: { type: Number, default: 8 },
  nodePadding: { type: Number, default: 8 },
  /** The pinned journey, highlighted until cleared; bind with `v-model:pinned`. Clicking a band or node pins the largest journey through it. */
  pinned: { type: Array as PropType<string[] | null>, default: undefined },
  /** Show the step headers above the columns. */
  headers: { type: Boolean, default: true },
  /** Where a node name links to; return `undefined` for no link. */
  nodeHref: { type: Function as PropType<(name: string, node: JourneyNode) => string | undefined>, default: undefined },
  /** Second line under a node name. */
  formatSubtitle: { type: Function as PropType<(node: JourneyNode) => string>, default: undefined },
  /** Locale for numbers. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  ariaLabel: { type: String, default: undefined },
}

const journeyEmits = {
  'update:pinned': (_path: string[] | null) => true,
  'node-click': (_node: JourneyNode, _event: MouseEvent) => true,
  'link-click': (_link: JourneyLink, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

/** `fade` is the entrance's own opacity; absent outside the first appearance. */
type Shape = ({ kind: 'node', node: JourneyNode } | { kind: 'link', link: JourneyLink }) & { fade?: number }

const JourneySankeyInner = defineComponent({
  name: 'JourneySankeyInner',
  props: { ...JourneySankeyVueProps, width: { type: Number, required: true as const }, height: { type: Number, required: true as const } },
  emits: journeyEmits,
  slots: Object as SlotsType<JourneySankeySlots>,
  setup(props, { emit, slots }) {
    const tooltip = useChartTooltip()
    const reducedMotion = useReducedMotion()
    const rows = useTrackedData(() => props.data)
    const numbers = computed(() => new Intl.NumberFormat(props.locale))
    const percent = computed(() => new Intl.NumberFormat(props.locale, { maximumFractionDigits: 1 }))
    const wholePercent = computed(() => new Intl.NumberFormat(props.locale, { maximumFractionDigits: 0 }))

    const journeys = computed<JourneyInput[]>(() => (rows.value ?? []).flatMap((row) => {
      const path = row?.[props.pathKey]
      const count = Number(row?.[props.dataKey])
      return Array.isArray(path) && Number.isFinite(count) && count > 0
        ? [{ path: path.map(String), count }]
        : []
    }))
    const stepCount = computed(() => props.steps ?? Math.max(1, ...journeys.value.map(journey => journey.path.length)))
    const labelWidth = computed(() => Math.min(200, Math.max(120, props.width * 0.2)))

    const layout = computed(() => computeJourneyLayout(journeys.value, {
      width: props.width,
      height: props.height,
      steps: stepCount.value,
      exitsKnown: props.exitsKnown,
      nodeWidth: props.nodeWidth,
      nodePadding: props.nodePadding,
      labelHeight: LABEL_HEIGHT,
      labelWidth: labelWidth.value,
      top: props.headers ? HEADER_BAND : 0,
    }))

    // Nodes and bands keep their identity (step and name) across data changes and morph. A node
    // that changes rank in its step would slide through its neighbours: it folds away where it was
    // and unfolds where it goes instead, its label and bands fading with it.
    let reordered = new Set<string>()
    let previousNodes: JourneyNode[] = []
    watch(layout, ({ nodes }) => {
      reordered = reorderedNodes(previousNodes, nodes)
      previousNodes = nodes
    }, { immediate: true, flush: 'sync' })
    const fold = (node: JourneyNode, size: number) => ({ ...node, continueHeight: node.continueHeight * size, exitHeight: node.exitHeight * size })
    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const mix = (a: number, b: number, t: number) => a + (b - a) * t
    const { items } = useKeyedTransition<Shape>(() => [
      ...layout.value.nodes.map(node => ({ kind: 'node' as const, node })),
      ...layout.value.links.map(link => ({ kind: 'link' as const, link })),
    ], {
      key: shape => shape.kind === 'node' ? `n:${shape.node.id}` : `l:${shape.link.id}`,
      interpolate: (from, to, t) => {
        const shape = interpolateShape(from, to, t)
        return from.fade === undefined ? shape : { ...shape, fade: Math.min(1, Math.max(0, mix(from.fade, to.fade ?? 1, t))) }
      },
      enterFrom: shape => shape.kind === 'node'
        ? { kind: 'node', node: { ...shape.node, continueHeight: 0, exitHeight: 0 } }
        : { kind: 'link', link: { ...shape.link, width: 0 } },
      exitTo: shape => shape.kind === 'node'
        ? { kind: 'node', node: { ...shape.node, continueHeight: 0, exitHeight: 0 } }
        : { kind: 'link', link: { ...shape.link, width: 0 } },
      reveal,
      connected: true,
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
    })

    function interpolateShape(from: Shape, to: Shape, t: number): Shape {
      if (from.kind === 'node' && to.kind === 'node') {
        if (reordered.has(to.node.id))
          return { kind: 'node', node: t < 0.5 ? fold(from.node, 1 - t * 2) : fold(to.node, t * 2 - 1) }
        return { kind: 'node', node: { ...to.node, x: mix(from.node.x, to.node.x, t), y: mix(from.node.y, to.node.y, t), continueHeight: mix(from.node.continueHeight, to.node.continueHeight, t), exitHeight: mix(from.node.exitHeight, to.node.exitHeight, t) } }
      }
      if (from.kind === 'link' && to.kind === 'link') {
        return { kind: 'link', link: { ...to.link, x0: mix(from.link.x0, to.link.x0, t), x1: mix(from.link.x1, to.link.x1, t), y0: mix(from.link.y0, to.link.y0, t), y1: mix(from.link.y1, to.link.y1, t), width: mix(from.link.width, to.link.width, t) } }
      }
      return to
    }

    // The first appearance: a wave from the top-left corner, like the treemap. Pages and bands
    // fade in on their turn while settling a few pixels down into place.
    function reveal(): Reveal<Shape> | undefined {
      const { nodes } = layout.value
      if (!nodes.length)
        return undefined
      const bottom = Math.max(...nodes.map(node => node.y + node.continueHeight + node.exitHeight))
      const span = props.width + bottom || 1
      return {
        from: shape => shape.kind === 'node'
          ? { ...shape, node: { ...shape.node, y: shape.node.y - 6 }, fade: 0 }
          : { ...shape, link: { ...shape.link, y0: shape.link.y0 - 6, y1: shape.link.y1 - 6 }, fade: 0 },
        order: shape => shape.kind === 'node' ? (shape.node.x + shape.node.y) / span : (shape.link.x0 + shape.link.y0) / span,
      }
    }

    // --- Highlight: hover (or keyboard focus) shows connected paths, pinning shows one journey.
    const hover = ref<{ kind: 'node' | 'link', id: string }>()
    const localPinned = ref<string[] | null>(null)
    const pinnedPath = computed(() => props.pinned !== undefined ? props.pinned : localPinned.value)
    function setPinned(path: string[] | null) {
      localPinned.value = path
      emit('update:pinned', path)
    }

    const highlighted = computed(() => {
      const { links } = layout.value
      if (hover.value) {
        const start = hover.value.kind === 'link'
          ? links.filter(link => link.id === hover.value!.id)
          : links.filter(link => link.source === hover.value!.id || link.target === hover.value!.id)
        const ids = connectedLinks(links, start)
        const nodes = new Set<string>(hover.value.kind === 'node' ? [hover.value.id] : [])
        for (const link of links) {
          if (ids.has(link.id)) {
            nodes.add(link.source)
            nodes.add(link.target)
          }
        }
        return { links: ids, nodes, pinned: false }
      }
      if (pinnedPath.value?.length) {
        const ids = journeyLinksOf(pinnedPath.value, stepCount.value)
        const nodes = new Set(pinnedPath.value.slice(0, stepCount.value).map((name, step) => `${step}\u0001${name}`))
        return { links: ids, nodes, pinned: true }
      }
      return undefined
    })

    const linkOpacity = (link: JourneyLink) => {
      const h = highlighted.value
      if (!h)
        return 0.2
      return h.links.has(link.id) ? 0.45 : h.pinned ? 0.14 : 0.07
    }
    const nodeOpacity = (node: JourneyNode) => {
      const h = highlighted.value
      return !h || h.nodes.has(node.id) ? 1 : 0.25
    }

    // --- Tooltip: one entry per node and per band.
    const subtitleOf = (node: JourneyNode) => {
      if (props.formatSubtitle)
        return props.formatSubtitle(node)
      const count = numbers.value.format(node.count)
      if (node.step === 0)
        return `${count} sessions`
      if (node.exits === null)
        return count
      if (node.exits === 0)
        return `${count} · all continue`
      return `${count} · ${wholePercent.value.format(node.exits / node.count * 100)}% end here`
    }
    const nodeById = computed(() => new Map(layout.value.nodes.map(node => [node.id, node])))
    const linkDescription = (link: JourneyLink) => {
      const source = nodeById.value.get(link.source)!
      const target = nodeById.value.get(link.target)!
      return {
        name: `${source.name} → ${target.name}`,
        value: `${numbers.value.format(link.count)} sessions · ${percent.value.format(link.count / source.count * 100)}% of those on ${source.name} at step ${source.step + 1}`,
      }
    }
    watch(computed(() => {
      const settings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: {
          nodes: layout.value.nodes.map(node => ({ name: node.name, value: subtitleOf(node), payload: node })),
          links: layout.value.links.map(link => ({ ...linkDescription(link), payload: link })),
        },
        positions: undefined,
        settings: { stroke: undefined, strokeWidth: undefined, fill: undefined, dataKey: 'value', nameKey: 'name', name: undefined, hide: false, type: undefined, color: undefined, unit: '' },
      }
      return settings
    }), (settings, _previous, onCleanup) => {
      tooltip.addTooltipEntrySettings(settings)
      onCleanup(() => tooltip.removeTooltipEntrySettings(settings))
    }, { immediate: true })

    function enterNode(node: JourneyNode) {
      hover.value = { kind: 'node', id: node.id }
      const index = layout.value.nodes.findIndex(n => n.id === node.id)
      tooltip.setActiveMouseOverItemIndex({ activeIndex: `nodes[${index}]`, activeDataKey: 'value', activeCoordinate: { x: node.x + props.nodeWidth, y: node.y } })
    }
    function enterLink(link: JourneyLink) {
      hover.value = { kind: 'link', id: link.id }
      const index = layout.value.links.findIndex(l => l.id === link.id)
      tooltip.setActiveMouseOverItemIndex({ activeIndex: `links[${index}]`, activeDataKey: 'value', activeCoordinate: { x: (link.x0 + link.x1) / 2, y: (link.y0 + link.y1) / 2 } })
    }
    function leave() {
      hover.value = undefined
      tooltip.mouseLeaveItem()
    }
    function pinThrough(step: number, names: string[]) {
      const path = largestJourneyThrough(journeys.value, stepCount.value, { step, names })
      const same = path && pinnedPath.value && path.length === pinnedPath.value.length && path.every((name, i) => name === pinnedPath.value![i])
      setPinned(same || !path ? null : path)
    }
    function clickNode(node: JourneyNode, event: MouseEvent) {
      pinThrough(node.step, [node.name])
      emit('node-click', node, event)
    }
    function clickLink(link: JourneyLink, event: MouseEvent) {
      const source = nodeById.value.get(link.source)!
      const target = nodeById.value.get(link.target)!
      pinThrough(source.step, [source.name, target.name])
      emit('link-click', link, event)
    }

    // --- Keyboard: arrows walk the nodes, Enter pins, Escape clears.
    const focused = ref<string>()
    function onKeydown(event: KeyboardEvent) {
      const nodes = layout.value.nodes
      if (!nodes.length)
        return
      const current = nodes.find(node => node.id === focused.value)
      let next: JourneyNode | undefined
      if (!current) {
        next = event.key.startsWith('Arrow') ? nodes[0] : undefined
      }
      else if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        const column = nodes.filter(node => node.step === current.step)
        next = column[column.indexOf(current) + (event.key === 'ArrowDown' ? 1 : -1)]
      }
      else if (event.key === 'ArrowRight' || event.key === 'ArrowLeft') {
        const forward = event.key === 'ArrowRight'
        const candidates = layout.value.links
          .filter(link => forward ? link.source === current.id : link.target === current.id)
          .sort((a, b) => b.count - a.count)
        const nextId = candidates[0] && (forward ? candidates[0].target : candidates[0].source)
        next = nodes.find(node => node.id === nextId)
      }
      else if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        pinThrough(current.step, [current.name])
        return
      }
      else if (event.key === 'Escape') {
        setPinned(null)
        focused.value = undefined
        leave()
        return
      }
      if (!next)
        return
      event.preventDefault()
      focused.value = next.id
      enterNode(next)
    }

    // Keyboard focus must show where it is: start on the first node.
    function onFocus(event: FocusEvent) {
      const first = layout.value.nodes[0]
      if (focused.value === undefined && first && isFocusVisible(event.target as Element)) {
        focused.value = first.id
        enterNode(first)
      }
    }

    const linkPath = (link: JourneyLink) => {
      const mid = (link.x1 - link.x0) * CURVATURE
      return `M${link.x0},${link.y0}C${link.x0 + mid},${link.y0} ${link.x1 - mid},${link.y1} ${link.x1},${link.y1}`
    }
    const columnWidth = computed(() => {
      const steps = layout.value.steps
      return steps.length > 1 ? steps[1].x - steps[0].x : props.width
    })
    const summary = computed(() => props.ariaLabel ?? `Journeys of ${numbers.value.format(layout.value.steps[0]?.total ?? 0)} sessions over ${layout.value.steps.length} steps`)
    const focusedLabel = computed(() => {
      const node = focused.value ? nodeById.value.get(focused.value) : undefined
      return node ? `${node.name}, step ${node.step + 1}: ${subtitleOf(node)}` : summary.value
    })
    const fade = computed(() => reducedMotion.value === 'reduce' ? undefined : 'opacity 150ms ease-out')
    const halo = { paintOrder: 'stroke', stroke: 'var(--v-charts-background, #fff)', strokeWidth: '4px', strokeLinejoin: 'round' } as const

    return () => {
      const shapes = items.value
      // Leaving shapes fade out in the first half of the move and arriving ones fade in during the
      // second half, so their labels never pile up on the nodes sliding past them.
      const presence = (phase: string, progress: number | undefined) => phase === 'exit'
        ? Math.max(0, 1 - (progress ?? 1) * 2)
        : phase === 'enter' ? Math.max(0, (progress ?? 1) * 2 - 1) : 1
      // A reordered node is hidden at the midpoint of its fold, and so are its bands.
      const folding = (progress: number | undefined) => progress === undefined ? 1 : Math.abs(1 - progress * 2)
      const links = shapes.flatMap(({ key, value, phase, progress }) => value.kind === 'link'
        ? [{ key, link: value.link, phase, shown: (value.fade ?? presence(phase, progress)) * (reordered.has(value.link.source) || reordered.has(value.link.target) ? folding(progress) : 1), moving: progress !== undefined }]
        : [])
      const nodes = shapes.flatMap(({ key, value, phase, progress }) => value.kind === 'node'
        ? [{ key, node: value.node, phase, shown: (value.fade ?? presence(phase, progress)) * (phase === 'update' && reordered.has(value.node.id) ? folding(progress) : 1), moving: progress !== undefined }]
        : [])
      const labelChars = Math.floor((columnWidth.value - props.nodeWidth - 16) / CHAR_WIDTH)
      return (
        <Surface width={props.width} height={props.height} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          <g
            class="v-charts-journey"
            role="group"
            tabindex={0}
            aria-label={focusedLabel.value}
            style={{ outline: 'none' }}
            onKeydown={onKeydown}
            onFocus={onFocus}
            onBlur={() => { focused.value = undefined; leave() }}
          >
            {props.headers && (
              <g class="v-charts-journey-headers">
                {layout.value.steps.map(step => (
                  <g key={step.step} transform={`translate(${step.x},0)`}>
                    {slots.header
                      ? slots.header({ ...step, width: columnWidth.value })
                      : (
                          <text y={14} style={{ fontSize: '12px', fill: 'var(--v-charts-text, #666)' }}>
                            <tspan style={{ fontWeight: 500 }}>{`Step ${step.step + 1}`}</tspan>
                            <tspan style={{ fill: 'var(--v-charts-text, #666)' }}>
                              {step.previousTotal == null
                                ? ` · ${numbers.value.format(step.total)}`
                                : ` · ${numbers.value.format(step.total)} · ${percent.value.format(step.total / (step.previousTotal || 1) * 100)}% of step ${step.step}`}
                            </tspan>
                          </text>
                        )}
                  </g>
                ))}
              </g>
            )}
            <g class="v-charts-journey-links" fill="none">
              {links.map(({ key, link, shown, moving }) => (
                <path key={`v${String(key)}`} class="v-charts-journey-link" d={linkPath(link)} stroke-width={Math.max(link.width, 0.5)} style={{ stroke: props.color, opacity: linkOpacity(link) * shown, transition: moving ? undefined : fade.value, pointerEvents: 'none' }} />
              ))}
              {/* Wider invisible bands catch the pointer on thin links. */}
              {links.map(({ key, link, phase }) => phase === 'exit'
                ? null
                : (
                    <path
                      key={`h${String(key)}`}
                      class="v-charts-journey-link-hit"
                      d={linkPath(link)}
                      stroke="transparent"
                      stroke-width={Math.max(link.width, 10)}
                      style={{ cursor: 'pointer' }}
                      onMouseenter={() => enterLink(link)}
                      onMouseleave={leave}
                      onClick={(event: MouseEvent) => clickLink(link, event)}
                    />
                  ))}
            </g>
            <g class="v-charts-journey-nodes">
              {nodes.map(({ key, node, phase, shown, moving }) => {
                const height = node.continueHeight + node.exitHeight
                const href = props.nodeHref?.(node.name, node)
                const name = truncateMiddle(node.name, node.step === layout.value.steps.length - 1 ? Math.floor(labelWidth.value / CHAR_WIDTH) : labelChars)
                const subtitle = subtitleOf(node)
                const isFocused = focused.value === node.id
                return (
                  <g key={String(key)} class="v-charts-journey-node" style={{ opacity: nodeOpacity(node) * shown, transition: moving ? undefined : fade.value, pointerEvents: phase === 'exit' ? 'none' : undefined }}>
                    <g style={{ cursor: 'pointer' }} onMouseenter={() => enterNode(node)} onMouseleave={leave} onClick={(event: MouseEvent) => clickNode(node, event)}>
                      <rect x={node.x - 4} y={node.y} width={props.nodeWidth + 8} height={Math.max(height, 4)} fill="transparent" />
                      {node.continueHeight > 0 && <rect class="v-charts-journey-node-continue" x={node.x} y={node.y} width={props.nodeWidth} height={node.continueHeight} rx={2} style={{ fill: props.color }} />}
                      {node.exitHeight > 0 && <rect class="v-charts-journey-node-exit" x={node.x} y={node.y + node.continueHeight} width={props.nodeWidth} height={node.exitHeight} rx={2} style={{ fill: props.exitColor }} />}
                      {isFocused && <rect x={node.x - 2} y={node.y - 2} width={props.nodeWidth + 4} height={height + 4} rx={3} fill="none" stroke-width={1.5} style={{ stroke: 'var(--v-charts-focus, Highlight)' }} />}
                    </g>
                    {slots.label
                      ? <g transform={`translate(${node.x + props.nodeWidth + 8},${node.y})`}>{slots.label({ node, subtitle })}</g>
                      : (
                          <g class="v-charts-journey-label">
                            {href
                              ? <a href={href}><text x={node.x + props.nodeWidth + 8} y={node.y + 11} style={{ fontSize: '12px', fontWeight: 500, fill: 'var(--v-charts-text, #666)', ...halo }}>{name}</text></a>
                              : <text x={node.x + props.nodeWidth + 8} y={node.y + 11} style={{ fontSize: '12px', fontWeight: 500, fill: 'var(--v-charts-text, #666)', ...halo }}>{name}</text>}
                            <text x={node.x + props.nodeWidth + 8} y={node.y + 26} style={{ fontSize: '11px', fill: 'var(--v-charts-text, #666)', ...halo }}>{subtitle}</text>
                            {name !== node.name && <title>{node.name}</title>}
                          </g>
                        )}
                  </g>
                )
              })}
            </g>
          </g>
        </Surface>
      )
    }
  },
})

const _JourneySankey = defineComponent({
  name: 'JourneySankey',
  props: { ...JourneySankeyVueProps, ...chartSizeProps },
  inheritAttrs: false,
  emits: { ...chartEmits, ...journeyEmits },
  slots: Object as SlotsType<JourneySankeySlots>,
  setup(props, { emit, slots, attrs }) {
    provideChartContext({ ...cellChartOptions('JourneySankey') })
    provideRenderPhase()
    const naturalHeight = computed(() => {
      const steps = props.steps ?? Infinity
      const perStep = new Map<number, Set<string>>()
      for (const row of props.data ?? []) {
        const path = row?.[props.pathKey]
        if (!Array.isArray(path))
          continue
        path.slice(0, steps).forEach((name: unknown, step: number) => {
          const names = perStep.get(step) ?? new Set<string>()
          names.add(String(name))
          perStep.set(step, names)
        })
      }
      const busiest = Math.max(1, ...[...perStep.values()].map(names => names.size))
      // Label room for every node of the busiest column, plus a third for the thick ones.
      return Math.round((props.headers ? HEADER_BAND : 0) + busiest * (LABEL_HEIGHT + props.nodePadding) * 1.33)
    })
    const size = useResponsiveSize(reactive({
      width: computed(() => props.width),
      // Without a height or aspect, give each of the busiest column's nodes room for its label.
      height: computed(() => props.height ?? (props.aspect ? undefined : Math.max(200, naturalHeight.value))),
      aspect: computed(() => props.aspect),
      initialDimension: computed(() => props.initialDimension),
    }))
    return () => {
      const { width: _w, height: _h, aspect: _a, initialDimension: _i, ...inner } = props
      return (
        <ChartsWrapper {...boxAttrs(attrs)} {...chartListeners(emit)} isResponsive={size.isResponsive.value} boxStyle={size.boxStyle.value} interactive={!size.isResponsive.value || size.measured.value} onResize={size.handleResize} width={size.effectiveWidth.value} height={size.effectiveHeight.value}>
          <JourneySankeyInner
            {...rootAttrs(attrs)}
            {...inner}
            width={size.effectiveWidth.value}
            height={size.effectiveHeight.value}
            {...{
              'onUpdate:pinned': (path: string[] | null) => emit('update:pinned', path),
              'onNode-click': (node: JourneyNode, event: MouseEvent) => emit('node-click', node, event),
              'onLink-click': (link: JourneyLink, event: MouseEvent) => emit('link-click', link, event),
              'onAnimation-start': () => emit('animation-start'),
              'onAnimation-end': () => emit('animation-end'),
            }}
          >
            {{ header: slots.header, label: slots.label }}
          </JourneySankeyInner>
          {slots.default?.()}
        </ChartsWrapper>
      )
    }
  },
})

/**
 * User journeys as a Sankey: columns are steps, bands are sessions moving from one page to the
 * next. Hovering a band or node highlights every connected path, the grey part of a node shows
 * sessions that ended there, and clicking pins the largest journey through it.
 *
 * ```vue
 * <JourneySankey :data="[{ path: ['/', '/pricing'], count: 11 }]" v-model:pinned="pinned"><Tooltip /></JourneySankey>
 * ```
 */
export const JourneySankey = _JourneySankey as typeof _JourneySankey & {
  new (): { $slots: JourneySankeySlots }
}
