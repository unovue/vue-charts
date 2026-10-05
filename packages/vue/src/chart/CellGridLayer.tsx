import { type PropType, type SlotsType, type StyleValue, computed, defineComponent, ref, useId, watch } from 'vue'
import { usePreferredReducedMotion } from '@vueuse/core'
import { get } from 'es-toolkit/compat'
import { useChartTooltip } from '@/state/chartContext'
import type { ChartOptions } from '@/state/chartOptions'
import type { TooltipPayloadConfiguration, TooltipPayloadSearcher } from '@/state/chartTooltip'
import type { ChartTransition } from '@/animation/motion'
import type { VueClassValue } from '@/types/common'
import { type Move, type Reveal, useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import type { GridCell } from './cellGridUtils'

export interface CellSlotProps<P = unknown> {
  cell: GridCell<P>
  index: number
  active: boolean
  x: number
  y: number
  width: number
  height: number
  fill: string
  radius: number
}

export interface CellGridSlots<P = unknown> {
  cell?: (props: CellSlotProps<P>) => any
}

export function isFocusVisible(element: Element) {
  try {
    return element.matches(':focus-visible')
  }
  catch {
    // Engines without :focus-visible (older test DOMs) treat every focus as keyboard focus.
    return true
  }
}

interface Seams {
  /** Where an arriving cell starts: a zero-thick line on the seam it opens. */
  enter: Map<string, GridCell>
  /** Where a leaving cell ends: a zero-thick line on the seam it closes. */
  exit: Map<string, GridCell>
}

/**
 * A cell removed between two staying grid neighbours (a row dropped from the middle) closes
 * onto the line where those neighbours meet after the change; a cell added between two opens
 * from the line where they met before. Both ends move on the same clock as the neighbours, so
 * the cell always fills exactly the gap between them and never overlaps either.
 */
function findSeams(previous: readonly GridCell[], next: readonly GridCell[]): Seams {
  const seams: Seams = { enter: new Map(), exit: new Map() }
  const before = new Map(previous.map(cell => [cell.key, cell]))
  const after = new Map(next.map(cell => [cell.key, cell]))
  const position = (cells: readonly GridCell[]) => new Map(cells.map(cell => [`${cell.row}:${cell.column}`, cell]))
  const oldAt = position(previous)
  const newAt = position(next)
  const seamBetween = (cell: GridCell, at: Map<string, GridCell>, stays: Map<string, GridCell>, other: (key: string) => GridCell | undefined) => {
    const pair = (a: string, b: string) => {
      const first = at.get(a)
      const second = at.get(b)
      return first && second && stays.has(first.key) && stays.has(second.key) ? [other(first.key)!, other(second.key)!] : undefined
    }
    const vertical = pair(`${cell.row - 1}:${cell.column}`, `${cell.row + 1}:${cell.column}`)
    if (vertical)
      return { ...cell, y: (vertical[0].y + vertical[0].height + vertical[1].y) / 2, height: 0 }
    const horizontal = pair(`${cell.row}:${cell.column - 1}`, `${cell.row}:${cell.column + 1}`)
    if (horizontal)
      return { ...cell, x: (horizontal[0].x + horizontal[0].width + horizontal[1].x) / 2, width: 0 }
    return undefined
  }
  for (const cell of previous) {
    if (!after.has(cell.key)) {
      const seam = seamBetween(cell, oldAt, after, key => after.get(key))
      if (seam)
        seams.exit.set(cell.key, seam)
    }
  }
  for (const cell of next) {
    if (!before.has(cell.key)) {
      const seam = seamBetween(cell, newAt, before, key => before.get(key))
      if (seam)
        seams.enter.set(cell.key, seam)
    }
  }
  return seams
}

const cellPayloadSearcher: TooltipPayloadSearcher = (data, activeIndex) =>
  data == null || activeIndex == null ? undefined : get(data, activeIndex as string)

/** Chart options shared by every cell chart: tooltips belong to a single cell. */
export function cellChartOptions(chartName: string): ChartOptions {
  return {
    chartName,
    defaultTooltipEventType: 'item',
    validateTooltipEventTypes: ['item'],
    tooltipPayloadSearcher: cellPayloadSearcher,
    eventEmitter: undefined,
  }
}

/** Caller `class` and `style` for the chart box. Attributes are untyped, so they are narrowed here once. */
export function boxAttrs(attrs: Record<string, unknown>): { class?: VueClassValue, style?: StyleValue } {
  return { class: attrs.class as VueClassValue, style: attrs.style as StyleValue }
}

/** Caller attributes for the SVG root: `class` and `style` go to the chart box instead. */
export function rootAttrs(attrs: Record<string, unknown>) {
  const { class: _class, style: _style, ...rest } = attrs
  return rest
}

export const cellGridEmits = {
  'cell-click': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'cell-mouseenter': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'cell-mouseleave': (_payload: unknown, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

/** Props every cell chart passes straight through to the layer. */
export const cellGridSharedProps = {
  /** Corner radius of each cell in px; capped at half the cell's shorter side. */
  radius: { type: Number, default: 2 },
  isAnimationActive: { type: Boolean, default: true },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
}

type Rect = Pick<GridCell, 'x' | 'y' | 'width' | 'height'>
/** A cell as drawn: `opacity` is the entrance's fade. */
type ShownCell = GridCell & { opacity?: number }

/**
 * The first appearance, as a wave from the top-left corner: each cell fades in on its turn.
 * `cascade` settles each cell from 92 % of its size; `slide` moves it in from the left, which
 * suits a timeline.
 */
function revealOf(style: 'cascade' | 'slide', cells: readonly GridCell[]): Reveal<ShownCell> | undefined {
  if (!cells.length)
    return undefined
  let left = Infinity
  let top = Infinity
  let right = -Infinity
  let bottom = -Infinity
  for (const cell of cells) {
    left = Math.min(left, cell.x)
    top = Math.min(top, cell.y)
    right = Math.max(right, cell.x + cell.width)
    bottom = Math.max(bottom, cell.y + cell.height)
  }
  const span = right - left + bottom - top || 1
  const order = (cell: GridCell) => Math.min(1, Math.max(0, (cell.x - left + cell.y - top) / span))
  return style === 'slide'
    ? { from: cell => ({ ...cell, x: cell.x - 8, opacity: 0 }), order }
    : { from: cell => ({ ...cell, x: cell.x + cell.width * 0.04, y: cell.y + cell.height * 0.04, width: cell.width * 0.92, height: cell.height * 0.92, opacity: 0 }), order }
}

/**
 * Draws a set of keyed cells with the behavior every cell chart shares: cells keep their DOM
 * node and slide when the window moves, colors cross-fade, one cell is active at a time
 * (pointer or arrow keys), and the active cell drives the chart tooltip.
 */
export const CellGridLayer = defineComponent({
  name: 'CellGridLayer',
  props: {
    ...cellGridSharedProps,
    cells: { type: Array as PropType<GridCell[]>, required: true as const },
    /** Space between cells; hover targets extend into it so the pointer never falls through. */
    gap: { type: Number, default: 0 },
    /** How the other cells react to an active one: `ring` outlines it, `dim` fades the rest. */
    activeStyle: { type: String as PropType<'ring' | 'dim'>, default: 'ring' },
    /** How the cells first appear: `cascade` for grids, `slide` for a single timeline row. */
    entrance: { type: String as PropType<'cascade' | 'slide'>, default: 'cascade' },
    /** Where cells entering after the first appearance grow from. */
    grow: { type: String as PropType<'center' | 'bottom'>, default: 'center' },
    ariaLabel: { type: String, default: undefined },
    /** Controlled active cell by position; `undefined` leaves it to pointer and keyboard. */
    activeIndex: { type: Number as PropType<number | null>, default: undefined },
  },
  emits: { ...cellGridEmits, 'update:activeIndex': (_index: number | null) => true },
  slots: Object as SlotsType<CellGridSlots>,
  setup(props, { emit, slots }) {
    const tooltip = useChartTooltip()
    const reducedMotion = usePreferredReducedMotion()
    const baseId = useId()
    const activeKey = ref<string>()
    const keyboard = ref(false)

    const indexByKey = computed(() => new Map(props.cells.map((cell, index) => [cell.key, index])))

    const collapse = (cell: GridCell): GridCell => props.grow === 'bottom'
      ? { ...cell, y: cell.y + cell.height, height: 0 }
      : { ...cell, x: cell.x + cell.width / 2, y: cell.y + cell.height / 2, width: 0, height: 0 }
    const shiftOf = (move?: Move<GridCell>) => move ? { x: move.to.x - move.from.x, y: move.to.y - move.from.y } : undefined
    const isShift = (shift?: { x: number, y: number }): shift is { x: number, y: number } => !!shift && Math.abs(shift.x) + Math.abs(shift.y) > 0.5
    const lerp = (from: ShownCell, to: ShownCell, t: number): ShownCell => ({
      ...to,
      x: from.x + (to.x - from.x) * t,
      y: from.y + (to.y - from.y) * t,
      width: from.width + (to.width - from.width) * t,
      height: from.height + (to.height - from.height) * t,
      opacity: (from.opacity ?? 1) + ((to.opacity ?? 1) - (from.opacity ?? 1)) * t,
    })

    // Identity on screen. Usually the cell's own key, with two exceptions decided per change:
    // - A few cells move far against the common grid move (Sundays wrapping to the last row when
    //   the week start changes): they shrink and regrow in place instead of streaking across.
    // - Nothing stays, or most cells would have to jump (a different year, a reversed axis):
    //   new cells take over the node at the same grid position, so the grid recolors in place
    //   instead of every cell shrinking and growing at once.
    let screenKeys = new Map<string, string>()
    const jumping = new Set<string>()
    let seams: Seams = { enter: new Map(), exit: new Map() }
    let generation = 0
    watch(() => props.cells, (next, previous = []) => {
      const before = new Map(previous.map(cell => [cell.key, cell]))
      jumping.clear()
      const moves = new Map<string, number>()
      let staying = 0
      for (const cell of next) {
        const old = before.get(cell.key)
        if (old) {
          staying++
          const move = `${cell.column - old.column}:${cell.row - old.row}`
          moves.set(move, (moves.get(move) ?? 0) + 1)
        }
      }
      const common = [...moves].reduce<[string, number] | undefined>((best, entry) => !best || entry[1] > best[1] ? entry : best, undefined)?.[0]
      if (common !== undefined) {
        // Only moves that leave the common move by more than one cell would cross the grid;
        // neighbours of a removed or added row or column simply slide one step.
        const [commonColumn, commonRow] = common.split(':').map(Number)
        for (const cell of next) {
          const old = before.get(cell.key)
          if (old && Math.abs(cell.column - old.column - commonColumn) + Math.abs(cell.row - old.row - commonRow) > 1)
            jumping.add(cell.key)
        }
      }
      const inPlace = previous.length > 0 && (staying === 0 || jumping.size > staying / 2)
      if (inPlace)
        jumping.clear()

      const byPosition = new Map(previous.map(cell => [`${cell.row}:${cell.column}`, screenKeys.get(cell.key) ?? cell.key]))
      const keys = new Map<string, string>()
      const used = new Set<string>()
      generation++
      for (const cell of next) {
        let key = inPlace
          ? byPosition.get(`${cell.row}:${cell.column}`) ?? cell.key
          : screenKeys.get(cell.key) ?? cell.key
        if (used.has(key))
          key = `${cell.key}\u0000${generation}`
        used.add(key)
        keys.set(cell.key, key)
      }
      screenKeys = keys
      seams = inPlace ? { enter: new Map(), exit: new Map() } : findSeams(previous, next)
    }, { immediate: true, flush: 'sync' })

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    // When the window moves (a new day appended, the oldest dropped), cells travel with their
    // staying neighbours like a conveyor belt and pass the clipped edge, so nothing overlaps.
    // Without a moving neighbour they grow and shrink in place.
    const { items } = useKeyedTransition<ShownCell>(() => props.cells, {
      key: cell => screenKeys.get(cell.key) ?? cell.key,
      interpolate: (from, to, t) => {
        if (!jumping.has(to.key))
          return lerp(from, to, t)
        // Shrink where it was, then grow where it goes.
        return t < 0.5 ? lerp(from, collapse(from), t * 2) : lerp(collapse(to), to, t * 2 - 1)
      },
      // Between grid neighbours a cell folds along the seam; at an edge it rides the belt
      // through the clip.
      enterFrom: (to, neighbors) => {
        const seam = seams.enter.get(to.key)
        if (seam)
          return seam
        const shift = shiftOf(neighbors.previousMove) ?? shiftOf(neighbors.nextMove)
        return isShift(shift) ? { ...to, x: to.x - shift.x, y: to.y - shift.y } : collapse(to)
      },
      exitTo: (from, neighbors) => {
        const seam = seams.exit.get(from.key)
        if (seam)
          return seam
        const shift = shiftOf(neighbors.nextMove) ?? shiftOf(neighbors.previousMove)
        return isShift(shift) ? { ...from, x: from.x + shift.x, y: from.y + shift.y } : collapse(from)
      },
      // One clock for entering, staying and leaving cells keeps the belt gap-free.
      connected: true,
      reveal: () => revealOf(props.entrance, props.cells),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
    })

    watch(computed(() => {
      const settings: TooltipPayloadConfiguration = {
        dataDefinedOnItem: props.cells.map(cell => ({ name: cell.label, value: cell.value, payload: cell.payload, color: cell.fill })),
        positions: undefined,
        settings: {
          stroke: undefined,
          strokeWidth: undefined,
          fill: undefined,
          dataKey: 'value',
          nameKey: 'name',
          name: undefined,
          hide: false,
          type: undefined,
          color: undefined,
          unit: '',
        },
      }
      return settings
    }), (settings, _previous, onCleanup) => {
      tooltip.addTooltipEntrySettings(settings)
      onCleanup(() => tooltip.removeTooltipEntrySettings(settings))
    }, { immediate: true })

    // A data change can move or remove the active cell; the tooltip follows it or closes. This
    // only re-syncs and never reports back: a controlled index keeps deciding which cell it is.
    watch(indexByKey, (map) => {
      const index = props.activeIndex !== undefined
        ? (props.activeIndex ?? undefined)
        : activeKey.value === undefined ? undefined : map.get(activeKey.value)
      const cell = index === undefined ? undefined : props.cells[index]
      if (cell)
        activate(cell, index!, false)
      else if (activeKey.value !== undefined)
        clear(false)
    })

    function activate(cell: GridCell, index: number, notify = true) {
      activeKey.value = cell.key
      if (notify && props.activeIndex !== index)
        emit('update:activeIndex', index)
      tooltip.setActiveMouseOverItemIndex({
        activeIndex: String(index),
        activeDataKey: 'value',
        activeCoordinate: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
      })
    }

    function clear(notify = true) {
      activeKey.value = undefined
      tooltip.mouseLeaveItem()
      if (notify && props.activeIndex != null)
        emit('update:activeIndex', null)
    }

    // A controlled index selects its cell like the pointer would.
    watch(() => props.activeIndex, (index) => {
      if (index === undefined)
        return
      const cell = index === null ? undefined : props.cells[index]
      if (cell && cell.key !== activeKey.value)
        activate(cell, index!, false)
      else if (!cell && activeKey.value !== undefined)
        clear(false)
    }, { immediate: true })

    function onEnter(cell: GridCell, index: number, event: MouseEvent) {
      keyboard.value = false
      activate(cell, index)
      emit('cell-mouseenter', cell.payload, index, event)
    }

    function onLeave(cell: GridCell, index: number, event: MouseEvent) {
      if (activeKey.value === cell.key)
        clear()
      emit('cell-mouseleave', cell.payload, index, event)
    }

    function onClick(cell: GridCell, index: number, event: MouseEvent) {
      tooltip.setActiveClickItemIndex({
        activeIndex: String(index),
        activeDataKey: 'value',
        activeCoordinate: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
      })
      emit('cell-click', cell.payload, index, event)
    }

    /** The nearest cell in a direction, skipping holes such as days outside the range. */
    function neighbour(from: GridCell, key: string): GridCell | undefined {
      const cells = props.cells
      const pick = (candidates: GridCell[], by: (cell: GridCell) => number) =>
        candidates.reduce<GridCell | undefined>((best, cell) => best === undefined || by(cell) < by(best) ? cell : best, undefined)
      switch (key) {
        case 'ArrowRight': return pick(cells.filter(c => c.row === from.row && c.column > from.column), c => c.column)
        case 'ArrowLeft': return pick(cells.filter(c => c.row === from.row && c.column < from.column), c => -c.column)
        case 'ArrowDown': return pick(cells.filter(c => c.column === from.column && c.row > from.row), c => c.row)
        case 'ArrowUp': return pick(cells.filter(c => c.column === from.column && c.row < from.row), c => -c.row)
        case 'Home': return cells[0]
        case 'End': return cells[cells.length - 1]
      }
      return undefined
    }

    // Keyboard focus must show where it is: start on the latest cell, the one people look for first.
    function onFocus(event: FocusEvent) {
      if (activeKey.value !== undefined || props.cells.length === 0 || !isFocusVisible(event.target as Element))
        return
      keyboard.value = true
      activate(props.cells[props.cells.length - 1], props.cells.length - 1)
    }

    function onKeydown(event: KeyboardEvent) {
      if (props.cells.length === 0)
        return
      if (event.key === 'Escape') {
        clear()
        return
      }
      const current = activeKey.value === undefined ? undefined : props.cells[indexByKey.value.get(activeKey.value)!]
      const next = current ? neighbour(current, event.key) : (event.key.startsWith('Arrow') || event.key === 'Home' || event.key === 'End') ? props.cells[props.cells.length - 1] : undefined
      if (!next)
        return
      event.preventDefault()
      keyboard.value = true
      activate(next, indexByKey.value.get(next.key)!)
    }

    // Cells sliding in or out are visible only inside the grid's own bounds.
    const clip = computed(() => {
      const cells = props.cells
      if (cells.length === 0)
        return undefined
      let x0 = Infinity
      let y0 = Infinity
      let x1 = -Infinity
      let y1 = -Infinity
      for (const cell of cells) {
        x0 = Math.min(x0, cell.x)
        y0 = Math.min(y0, cell.y)
        x1 = Math.max(x1, cell.x + cell.width)
        y1 = Math.max(y1, cell.y + cell.height)
      }
      // Taller than the grid, so an entrance settling a few pixels into place is not cut off;
      // tight at the sides, where cells ride the sliding window out of view.
      return { x: x0 - 2, y: y0 - 8, width: x1 - x0 + 4, height: y1 - y0 + 16 }
    })
    const clipId = `${baseId}-clip`
    // By position, so user keys never end up in an element id.
    const cellId = (key: string) => `${baseId}-cell-${indexByKey.value.get(key)}`
    const radiusOf = (rect: Rect) => Math.max(0, Math.min(props.radius, rect.width / 2, rect.height / 2))

    return () => {
      const fillTransition = reducedMotion.value === 'reduce' ? undefined : 'fill 300ms ease-out, opacity 150ms ease-out'
      const half = props.gap / 2
      const active = activeKey.value
      const activeCell = active === undefined ? undefined : items.value.find(item => item.value.key === active && item.phase !== 'exit')?.value
      return (
        <g
          class="v-charts-cell-grid"
          role="listbox"
          tabindex={0}
          aria-label={props.ariaLabel}
          aria-activedescendant={active === undefined ? undefined : cellId(active)}
          style={{ outline: 'none' }}
          onFocus={onFocus}
          onKeydown={onKeydown}
          onBlur={() => {
            if (keyboard.value)
              clear()
          }}
        >
          {clip.value && (
            <defs>
              <clipPath id={clipId}>
                <rect x={clip.value.x} y={clip.value.y} width={clip.value.width} height={clip.value.height} />
              </clipPath>
            </defs>
          )}
          <g clip-path={clip.value ? `url(#${clipId})` : undefined}>
            {items.value.map(({ key, value: cell, phase }) => {
              const index = indexByKey.value.get(cell.key) ?? -1
              const isActive = cell.key === active
              const dimmed = props.activeStyle === 'dim' && active !== undefined && !isActive
              const radius = radiusOf(cell)
              const interactive = phase !== 'exit' && index >= 0
              // The entrance's fade; on fill-opacity, so the color cross-fade transition never lags it.
              const fade = cell.opacity != null && cell.opacity < 1 ? cell.opacity : undefined
              return (
                <g
                  key={key as string}
                  id={interactive ? cellId(cell.key) : undefined}
                  class="v-charts-cell"
                  role="option"
                  aria-selected={isActive}
                  aria-label={cell.value == null ? cell.label : `${cell.label}: ${cell.value}`}
                  style={{ opacity: dimmed ? 0.45 : 1, transition: fillTransition, pointerEvents: interactive ? undefined : 'none' }}
                  onMouseenter={(event: MouseEvent) => interactive && onEnter(cell, index, event)}
                  onMouseleave={(event: MouseEvent) => interactive && onLeave(cell, index, event)}
                  onClick={(event: MouseEvent) => interactive && onClick(cell, index, event)}
                >
                  {slots.cell
                    ? slots.cell({ cell, index, active: isActive, x: cell.x, y: cell.y, width: cell.width, height: cell.height, fill: cell.fill, radius })
                    : <rect class="v-charts-cell-rect" x={cell.x} y={cell.y} width={cell.width} height={cell.height} rx={radius} fill-opacity={fade} style={{ fill: cell.fill, transition: fillTransition }} />}
                  {cell.text && !slots.cell && cell.width >= cell.text.length * 6.2 + 4 && cell.height >= 13 && (
                    <text
                      class="v-charts-cell-text"
                      x={cell.x + cell.width / 2}
                      y={cell.y + cell.height / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      fill-opacity={fade}
                      style={{ fill: cell.strong ? 'var(--v-charts-background, #fff)' : 'var(--v-charts-text, #666)', fontSize: '11px', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
                    >
                      {cell.text}
                    </text>
                  )}
                  {half > 0 && <rect x={cell.x - half} y={cell.y - half} width={cell.width + props.gap} height={cell.height + props.gap} fill="transparent" />}
                </g>
              )
            })}
          </g>
          {activeCell && (props.activeStyle === 'ring' || keyboard.value) && (
            <rect
              class="v-charts-cell-active"
              x={activeCell.x - 1}
              y={activeCell.y - 1}
              width={activeCell.width + 2}
              height={activeCell.height + 2}
              rx={radiusOf(activeCell) + 1}
              fill="none"
              stroke-width={1.5}
              style={{ stroke: keyboard.value ? 'var(--v-charts-focus, Highlight)' : 'var(--v-charts-axis, #666)', pointerEvents: 'none' }}
            />
          )}
        </g>
      )
    }
  },
})
