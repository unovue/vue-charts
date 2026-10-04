import { type PropType, type SlotsType, computed, defineComponent } from 'vue'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { provideRenderPhase } from '@/animation/renderPhase'
import { useTrackedData } from '@/hooks/useTrackedData'
import { cellGridSharedProps } from './CellGridLayer'

export type BarListRow = Record<string, any>

export interface BarListSlotProps {
  row: BarListRow
  index: number
  name: string
  value: number
  /** Share of the largest value, 0…1. */
  ratio: number
  formatted: string
}

export interface BarListSlots {
  name?: (props: BarListSlotProps) => any
  value?: (props: BarListSlotProps) => any
}

interface RowState {
  row: BarListRow
  name: string
  value: number
  y: number
  ratio: number
  opacity: number
}

export const BarListVueProps = {
  isAnimationActive: cellGridSharedProps.isAnimationActive,
  transition: cellGridSharedProps.transition,
  data: { type: Array as PropType<BarListRow[]>, required: true as const },
  /** Field with the label. It is also the row's identity, so a row slides to its new rank. */
  nameKey: { type: String, default: 'name' },
  dataKey: { type: String, default: 'value' },
  /** Field with a link; the label becomes an anchor. */
  hrefKey: { type: String, default: undefined },
  sort: { type: String as PropType<'descending' | 'ascending' | 'none'>, default: 'descending' },
  color: { type: String, default: 'color-mix(in oklab, var(--v-charts-series, #2563eb) 18%, transparent)' },
  valueFormat: { type: Function as PropType<(value: number, row: BarListRow) => string>, default: undefined },
  /** Locale for the default number format. Fixed by default so server and client render the same. */
  locale: { type: String, default: 'en-US' },
  rowHeight: { type: Number, default: 32 },
  gap: { type: Number, default: 4 },
  ariaLabel: { type: String, default: undefined },
}

const barListEmits = {
  'row-click': (_row: BarListRow, _index: number, _event: MouseEvent) => true,
  'animation-start': () => true,
  'animation-end': () => true,
}

const BarListInner = defineComponent({
  name: 'BarListInner',
  props: BarListVueProps,
  emits: barListEmits,
  slots: Object as SlotsType<BarListSlots>,
  setup(props, { emit, slots }) {
    const rows = useTrackedData(() => props.data)
    const numbers = computed(() => new Intl.NumberFormat(props.locale))

    const target = computed<RowState[]>(() => {
      const list = (rows.value ?? []).flatMap((row) => {
        const value = Number(row?.[props.dataKey])
        return row && Number.isFinite(value) ? [{ row, name: String(row[props.nameKey] ?? ''), value }] : []
      })
      if (props.sort !== 'none')
        list.sort((a, b) => props.sort === 'descending' ? b.value - a.value : a.value - b.value)
      const max = Math.max(0, ...list.map(item => item.value))
      return list.map((item, index) => ({
        ...item,
        y: index * (props.rowHeight + props.gap),
        ratio: max > 0 ? Math.max(0, item.value) / max : 0,
        opacity: 1,
      }))
    })

    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const { items } = useKeyedTransition<RowState>(() => target.value, {
      key: state => state.name,
      interpolate: (from, to, t) => ({
        ...to,
        y: from.y + (to.y - from.y) * t,
        ratio: from.ratio + (to.ratio - from.ratio) * t,
        opacity: from.opacity + (to.opacity - from.opacity) * t,
      }),
      enterFrom: to => ({ ...to, ratio: 0, opacity: 0 }),
      exitTo: from => ({ ...from, ratio: 0, opacity: 0 }),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
    })

    const height = computed(() => Math.max(0, target.value.length * (props.rowHeight + props.gap) - props.gap))
    const format = (state: RowState) => props.valueFormat ? props.valueFormat(state.value, state.row) : numbers.value.format(state.value)

    return () => (
      <ul
        class="v-charts-bar-list"
        aria-label={props.ariaLabel}
        style={{ position: 'relative', height: `${height.value}px`, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {items.value.map(({ key, value: state, phase }) => {
          const index = target.value.findIndex(item => item.name === state.name)
          const slotProps: BarListSlotProps = { row: state.row, index, name: state.name, value: state.value, ratio: state.ratio, formatted: format(state) }
          const href = props.hrefKey ? state.row[props.hrefKey] : undefined
          return (
            <li
              key={key as string}
              class="v-charts-bar-list-row"
              aria-hidden={phase === 'exit' ? 'true' : undefined}
              style={{
                position: 'absolute',
                left: 0,
                right: 0,
                top: 0,
                height: `${props.rowHeight}px`,
                transform: `translateY(${state.y}px)`,
                opacity: state.opacity,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: phase === 'exit' ? 'none' : undefined,
              }}
              onClick={(event: MouseEvent) => index >= 0 && emit('row-click', state.row, index, event)}
            >
              <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                <div class="v-charts-bar-list-bar" style={{ position: 'absolute', inset: '0 auto 0 0', width: `${state.ratio * 100}%`, borderRadius: '4px', background: props.color }} />
                <span class="v-charts-bar-list-name" style={{ position: 'relative', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {slots.name ? slots.name(slotProps) : href ? <a href={href} style={{ color: 'inherit' }}>{state.name}</a> : state.name}
                </span>
              </div>
              <span class="v-charts-bar-list-value" style={{ flex: 'none', fontVariantNumeric: 'tabular-nums' }}>
                {slots.value ? slots.value(slotProps) : slotProps.formatted}
              </span>
            </li>
          )
        })}
      </ul>
    )
  },
})

const _BarList = defineComponent({
  name: 'BarList',
  props: BarListVueProps,
  emits: barListEmits,
  slots: Object as SlotsType<BarListSlots>,
  setup(props, { emit, slots }) {
    // The render phase reaches children only, so the transition lives one level down.
    provideRenderPhase()
    return () => (
      <BarListInner
        {...props}
        {...{
          'onRow-click': (row: BarListRow, index: number, event: MouseEvent) => emit('row-click', row, index, event),
          'onAnimation-start': () => emit('animation-start'),
          'onAnimation-end': () => emit('animation-end'),
        }}
      >
        {{ name: slots.name, value: slots.value }}
      </BarListInner>
    )
  },
})

/**
 * A ranked list with a bar behind each label, as in analytics "top pages" panels.
 *
 * ```vue
 * <BarList :data="[{ name: '/pricing', value: 820 }]" href-key="url" />
 * ```
 */
export const BarList = _BarList as typeof _BarList & {
  new (): { $slots: BarListSlots }
}
