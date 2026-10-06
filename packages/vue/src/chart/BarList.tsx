import { type ComponentPublicInstance, type PropType, type SlotsType, computed, defineComponent, getCurrentInstance, ref } from 'vue'
import { useKeyedTransition } from '@/animation/useKeyedTransition'
import { useAnimationCallbacks } from '@/animation/useAnimationCallbacks'
import { provideChartInView, provideRenderPhase } from '@/model/runtime'
import { useTrackedData } from '@/hooks/useTrackedData'
import { cellGridSharedProps } from './cellGridProps'

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
  index: number
  row: BarListRow
  name: string
  value: number
  y: number
  ratio: number
  opacity: number
  /** Displayed presence preserves height when a transition is interrupted. */
  presence: number
  /** Moving up past another row during a change: drawn above the rows it passes. */
  rising?: boolean
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
  color: { type: String, default: 'var(--v-charts-series, #2563eb)' },
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
  props: { ...BarListVueProps, actionable: Boolean },
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
        index,
        y: index * (props.rowHeight + props.gap),
        ratio: max > 0 ? Math.max(0, item.value) / max : 0,
        opacity: 1,
        presence: 1,
      }))
    })

    const crossing = (from: RowState, to: RowState, t: number) => from.y - to.y > props.rowHeight && t < 1 ? { rising: true } : { rising: undefined }
    const callbacks = useAnimationCallbacks(() => emit('animation-start'), () => emit('animation-end'))
    const { items } = useKeyedTransition<RowState>(() => target.value, {
      key: state => state.name,
      interpolate: (from, to, t) => ({
        ...to,
        // The number counts along with its bar instead of jumping ahead of it; whole numbers stay
        // whole on the way.
        value: Number.isInteger(to.value) ? Math.round(from.value + (to.value - from.value) * t) : from.value + (to.value - from.value) * t,
        y: from.y + (to.y - from.y) * t,
        presence: Math.min(1, Math.max(0, from.presence + (to.presence - from.presence) * t)),
        // Rows changing rank cross each other: the ones moving up pass over at full strength while
        // the ones moving down dim underneath, so one label always reads clearly.
        ...crossing(from, to, t),
        ratio: from.ratio + (to.ratio - from.ratio) * t,
        opacity: Math.min(1, Math.max(0, (from.opacity + (to.opacity - from.opacity) * t) * (to.y - from.y > props.rowHeight ? 1 - 0.7 * Math.sin(Math.PI * t) : 1))),
      }),
      enterFrom: to => ({ ...to, value: 0, ratio: 0, opacity: 0, presence: 0 }),
      exitTo: from => ({ ...from, ratio: 0, opacity: 0, presence: 0 }),
      isActive: () => props.isAnimationActive,
      transition: () => props.transition,
      onStart: callbacks.onStart,
      onEnd: callbacks.onEnd,
    })

    const height = computed(() => {
      const count = items.value.reduce((sum, item) =>
        sum + Math.max(0, Math.min(1, item.value.presence)), 0)
      return Math.max(0, count * (props.rowHeight + props.gap) - props.gap)
    })
    const format = (state: RowState) => props.valueFormat ? props.valueFormat(state.value, state.row) : numbers.value.format(state.value)

    function renderName(slotProps: BarListSlotProps, href: string | undefined, exiting: boolean) {
      if (slots.name)
        return slots.name(slotProps)
      if (href) {
        return (
          <a
            href={href}
            tabindex={exiting ? -1 : undefined}
            style={{ color: 'inherit' }}
          >
            {slotProps.name}
          </a>
        )
      }
      if (!props.actionable || exiting)
        return slotProps.name
      return (
        <button
          type="button"
          style={{
            font: 'inherit',
            color: 'inherit',
            background: 'none',
            border: 0,
            padding: 0,
          }}
        >
          {slotProps.name}
        </button>
      )
    }

    return () => (
      <ul
        class="v-charts-bar-list"
        aria-label={props.ariaLabel}
        style={{ position: 'relative', height: `${height.value}px`, margin: 0, padding: 0, listStyle: 'none' }}
      >
        {items.value.map(({ key, value: state, phase }) => {
          const index = state.index
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
                zIndex: state.rising ? 1 : undefined,
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                pointerEvents: phase === 'exit' ? 'none' : undefined,
              }}
              onClick={(event: MouseEvent) => phase !== 'exit' && emit('row-click', state.row, index, event)}
            >
              <div style={{ position: 'relative', flex: '1 1 auto', minWidth: 0, height: '100%', display: 'flex', alignItems: 'center' }}>
                <div class="v-charts-bar-list-bar" style={{ position: 'absolute', inset: '0 auto 0 0', width: `${state.ratio * 100}%`, borderRadius: '4px', background: props.color, opacity: 0.18 }} />
                <span class="v-charts-bar-list-name" style={{ position: 'relative', padding: '0 8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {renderName(slotProps, href, phase === 'exit')}
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
    // The render phase and the on-screen state reach children only, so the transition lives one
    // level down.
    const instance = getCurrentInstance()
    provideRenderPhase()
    const inner = ref<ComponentPublicInstance | null>(null)
    provideChartInView(computed(() => inner.value?.$el))
    return () => (
      <BarListInner
        ref={inner}
        {...props}
        actionable={!!(instance?.vnode.props?.['onRow-click'] || instance?.vnode.props?.onRowClick)}
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
