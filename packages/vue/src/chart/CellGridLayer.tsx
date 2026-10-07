import { type PropType, type SlotsType, type VNodeChild, computed, defineComponent, toRaw, useId, watch } from 'vue'
import { labelColor } from '@/utils/labelColor'
import { useReducedMotion } from '@/animation/useReducedMotion'
import { useTooltipController } from '@/model/tooltip'
import type { TooltipPayloadConfiguration } from '@/types/tooltip'
import { cascadeReveal, motionTokens } from '@/animation/motion'
import { type Move, useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { emptyGridTransitionPlan, planGridTransition } from '@/animation/gridTransition'
import { cellGridSharedProps } from './cellGridProps'
import { cellGridEmits } from '@/events/componentEvents'
import type { GridCell } from './cellGridUtils'
import { useItemKeyboard } from '@/events/useItemKeyboard'

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
  cell?: (props: CellSlotProps<P>) => VNodeChild
}

type Rect = Pick<GridCell, 'x' | 'y' | 'width' | 'height'>
/** A cell as drawn: `opacity` is the entrance's fade. */
type ShownCell = GridCell & { opacity?: number }

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
    title: { type: String, default: undefined },
  },
  emits: cellGridEmits,
  slots: Object as SlotsType<CellGridSlots>,
  setup(props, { emit, slots }) {
    const tooltip = useTooltipController()
    const reducedMotion = useReducedMotion()
    const baseId = useId()

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
      opacity: Math.min(1, Math.max(0, (from.opacity ?? 1) + ((to.opacity ?? 1) - (from.opacity ?? 1)) * t)),
    })

    // Identity on screen, jumps and seams are planned per change; see planGridTransition.
    let plan = emptyGridTransitionPlan<GridCell>()
    let generation = 0
    watch(() => props.cells, (next, previous = []) => {
      plan = planGridTransition(previous, next, plan.keys, ++generation)
    }, { immediate: true, flush: 'sync' })

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    // When the window moves (a new day appended, the oldest dropped), cells travel with their
    // staying neighbours like a conveyor belt and pass the clipped edge, so nothing overlaps.
    // Without a moving neighbour they grow and shrink in place.
    const { items } = useKeyedTransition<ShownCell>(() => props.cells, {
      key: cell => plan.keys.get(cell.key) ?? cell.key,
      interpolate: (from, to, t) => {
        if (!plan.jumping.has(to.key))
          return lerp(from, to, t)
        // Shrink where it was, then grow where it goes.
        return t < 0.5 ? lerp(from, collapse(from), t * 2) : lerp(collapse(to), to, t * 2 - 1)
      },
      // Between grid neighbours a cell folds along the seam; at an edge it rides the belt
      // through the clip.
      enterFrom: (to, neighbors) => {
        const seam = plan.seams.enter.get(to.key)
        if (seam)
          return seam
        const shift = shiftOf(neighbors.previousMove) ?? shiftOf(neighbors.nextMove)
        return isShift(shift) ? { ...to, x: to.x - shift.x, y: to.y - shift.y } : collapse(to)
      },
      exitTo: (from, neighbors) => {
        const seam = plan.seams.exit.get(from.key)
        if (seam)
          return seam
        const shift = shiftOf(neighbors.nextMove) ?? shiftOf(neighbors.previousMove)
        return isShift(shift) ? { ...from, x: from.x + shift.x, y: from.y + shift.y } : collapse(from)
      },
      // One clock for entering, staying and leaving cells keeps the belt gap-free.
      connected: true,
      reveal: () => cascadeReveal(props.cells, props.entrance),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
    })

    // A Tooltip `formatter` replaces this default text and receives the raw value.
    const valueTexts = computed(() => new Map(props.cells.flatMap(cell => cell.valueText === undefined ? [] : [[toRaw(cell.payload), cell.valueText]])))
    const configuration = computed(() => {
      const settings: TooltipPayloadConfiguration = {
        model: {
          root: true,
          index: () => props.activeIndex,
          request: index => emit('update:activeIndex', index),
        },
        keyboardItems: props.cells.map((cell, index) => ({
          index,
          identity: cell.key,
          coordinate: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
        })),
        // The payload is the chart's domain object; value and name come per cell.
        dataDefinedOnItem: props.cells.map(cell => cell.payload),
        values: Object.fromEntries(props.cells.map((cell, index) => [index, cell.value])),
        names: Object.fromEntries(props.cells.map((cell, index) => [index, cell.label])),
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
          formatter: valueTexts.value.size
            ? (value, _name, entry) => valueTexts.value.get(toRaw(entry.payload)) ?? value
            : undefined,
        },
      }
      return settings
    })
    tooltip.entries.register(configuration)
    const activeIndex = tooltip.activeIndexFor(configuration)
    const activeKey = computed(() => activeIndex.value === null ? undefined : props.cells[activeIndex.value]?.key)

    // Keyboard focus must show where it is: start on the latest cell, the one people look for first.
    const { keyboard, onFocus, onKeydown } = useItemKeyboard<GridCell>({
      empty: () => props.cells.length === 0,
      start: () => activeKey.value === undefined ? props.cells[props.cells.length - 1] : undefined,
      neighbour: (key) => {
        const current = activeKey.value === undefined ? undefined : props.cells[indexByKey.value.get(activeKey.value) ?? -1]
        if (current)
          return neighbour(current, key)
        return key === 'Home' ? props.cells[0] : key.startsWith('Arrow') || key === 'End' ? props.cells[props.cells.length - 1] : undefined
      },
      activate: cell => activate(cell, indexByKey.value.get(cell.key) ?? -1),
      clear,
      // Enter runs the cell action for keyboard users, like a click on the active cell.
      keydown: (event) => {
        const index = activeIndex.value
        const cell = index === null ? undefined : props.cells[index]
        if (event.key !== 'Enter' || !cell || index === null)
          return false
        event.preventDefault()
        emit('cell-click', cell.payload, index, event)
        return true
      },
    })

    function activate(cell: GridCell, index: number) {
      const action = {
        index,
        configuration: configuration.value,
        dataKey: 'value',
        coordinate: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
      }
      if (keyboard.value)
        tooltip.activate('keyboard', { ...action, active: true })
      else
        tooltip.activate('hover', { ...action, type: 'item' })
    }

    function clear() {
      if (keyboard.value)
        tooltip.activate('keyboard', { index: null, dataKey: 'value', coordinate: undefined, active: false })
      else
        tooltip.clear('hover')
    }

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
      tooltip.activate('click', {
        type: 'item',
        index,
        configuration: configuration.value,
        dataKey: 'value',
        coordinate: { x: cell.x + cell.width / 2, y: cell.y + cell.height / 2 },
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
      const fillTransition = reducedMotion.value === 'reduce'
        ? undefined
        : `fill ${motionTokens.color.duration}s ${motionTokens.color.cssEase}, `
          + `opacity ${motionTokens.feedback.duration}s ${motionTokens.feedback.cssEase}`
      const half = props.gap / 2
      const active = activeKey.value
      const activeCell = active === undefined ? undefined : items.value.find(item => item.value.key === active && item.phase !== 'exit')?.value
      return (
        <g
          data-slot="series"
          class="v-charts-cell-grid"
          role="listbox"
          tabindex={0}
          aria-label={props.title}
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
                  data-slot="cell"
                  class="v-charts-cell"
                  role="option"
                  aria-selected={isActive}
                  aria-label={(cell.valueText ?? cell.value) == null ? cell.label : `${cell.label}: ${cell.valueText ?? cell.value}`}
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
                      data-slot="label"
                      class="v-charts-cell-text"
                      x={cell.x + cell.width / 2}
                      y={cell.y + cell.height / 2}
                      text-anchor="middle"
                      dominant-baseline="central"
                      fill-opacity={fade}
                      style={{ fill: labelColor(cell.fill), fontSize: '11px', fontVariantNumeric: 'tabular-nums', pointerEvents: 'none' }}
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
