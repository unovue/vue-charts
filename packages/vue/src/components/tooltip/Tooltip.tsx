import type { Component, PropType, SlotsType, VNode, VNodeChild } from 'vue'
import { useTooltipController, useTooltipSource } from '@/model/tooltip'
import type { ChartTransition } from '@/animation/motion'
import { useChartPresentation } from '@/model/presentation'
import { Fragment, Teleport, computed, defineComponent, h, watch } from 'vue'
import { usePortal } from '@/model/runtime'
import type { Formatter, TooltipActiveIndex, TooltipPayload, TooltipPayloadEntry, TooltipTrigger } from '@/types/tooltip'
import { useTimeoutFn } from '@vueuse/core'
import type { AxisId } from '@/types/axisSettings'
import type {
  Coordinate,
  NameType,
  Payload,
  ValueType,
} from '@/types'
import { uniqBy } from 'es-toolkit/compat'
import { useTooltipChartSynchronisation } from '@/events/sync'

import type { AllowInDimension, ContentType, CursorSlotProps, TooltipContentProps } from './types'
import { DefaultTooltipContent } from './DefaultTooltipContent'
import { TooltipBoundingBox } from './TooltipBoundingBox'
import { Cursor } from './Cursor'
// Default uniq function
function defaultUniqBy<TValue extends ValueType, TName extends NameType>(entry: Payload<TValue, TName>) {
  return entry.dataKey
}

type UniqueFunc<T> = (entry: T) => unknown

export type UniqueOption<T> = boolean | UniqueFunc<T>

export function getUniqPayload<T>(
  payload: ReadonlyArray<T>,
  option: UniqueOption<T>,
  defaultUniqBy: UniqueFunc<T>,
): ReadonlyArray<T> {
  if (option === true) {
    return uniqBy(payload, defaultUniqBy)
  }

  if (typeof option === 'function') {
    return uniqBy(payload, option)
  }

  return payload
}

// Main Tooltip Props
const TooltipVueProps = {
  /**
   * If true, then Tooltip is always displayed, once an activeIndex is set by mouse over, or programmatically.
   * If false, then Tooltip is never displayed.
   * If active is undefined, Recharts will control when the Tooltip displays.
   */
  active: {
    type: Boolean,
    default: undefined,
  },
  /**
   * If true, then Tooltip will show information about hidden series (defaults to false).
   */
  includeHidden: Boolean,
  formatter: Function as PropType<Formatter<ValueType, NameType>>,
  allowEscapeViewBox: {
    type: Object as PropType<AllowInDimension>,
    default: () => ({ x: false, y: false }),
  },
  content: [Object, Function] as PropType<ContentType>,
  cursor: {
    type: [Boolean, Object] as PropType<boolean | object>,
    default: true,
  },
  filterNull: {
    type: Boolean,
    default: true,
  },
  activeIndex: { type: Number as PropType<TooltipActiveIndex>, default: undefined },
  defaultIndex: Number,
  isAnimationActive: {
    type: Boolean,
    default: true,
  },
  transition: { type: Object as PropType<ChartTransition>, default: undefined },
  offset: {
    type: Number,
    default: 10,
  },
  payloadUniqBy: [Boolean, Function] as PropType<UniqueOption<TooltipPayloadEntry>>,
  /**
   * If portal is defined, then Tooltip will use this element as a target for rendering using Teleport
   */
  portal: {
    type: Object as PropType<HTMLElement | null>,
    default: undefined,
  },
  position: Object as PropType<Partial<Coordinate>>,
  reverseDirection: {
    type: Object as PropType<AllowInDimension>,
    default: () => ({ x: false, y: false }),
  },
  /**
   * If true, tooltip will appear on top of all bars on an axis tick.
   * If false, tooltip will appear on individual bars.
   */
  shared: {
    type: [Boolean, undefined] as PropType<boolean | undefined>,
    default: undefined,
  },
  /**
   * If `hover` then the Tooltip shows on mouse enter and hides on mouse leave.
   * If `click` then the Tooltip shows after clicking and stays active.
   */
  trigger: {
    type: String as PropType<TooltipTrigger>,
    default: 'hover',
  },
  style: {
    type: Object,
    default: () => ({}),
  },
  /**
   * Tooltip axis ID
   */
  axisId: {
    type: [String, Number] as PropType<AxisId>,
    default: 0,
  },
  // Style props
  contentStyle: {
    type: Object,
    default: () => ({}),
  },
  itemStyle: {
    type: Object,
    default: () => ({}),
  },
  labelStyle: {
    type: Object,
    default: () => ({}),
  },
  /** Sort rows. By default they keep the order of the series. */
  itemSorter: {
    type: [String, Function] as PropType<'name' | 'value' | 'dataKey' | ((item: Payload<ValueType, NameType>) => number | string)>,
    default: undefined,
  },
  separator: {
    type: String,
    default: ' : ',
  },
} as const

// Main Tooltip Component
const _Tooltip = defineComponent({
  name: 'Tooltip',
  emits: { 'update:activeIndex': (_index: TooltipActiveIndex) => true },
  props: TooltipVueProps,
  slots: Object as SlotsType<{
    content?: (props: TooltipContentProps) => VNodeChild
    cursor?: (props: CursorSlotProps) => VNodeChild
    default?: () => VNode[]
  }>,
  setup(props, { slots, emit }) {
    const tooltip = useTooltipController()

    const source = useTooltipSource()
    const binding = computed(() => ({
      settings: {
        activeIndex: props.activeIndex,
        shared: props.shared,
        trigger: props.trigger,
        axisId: props.axisId,
        active: props.active,
        defaultIndex: props.defaultIndex === undefined ? undefined : String(props.defaultIndex),
      },
      request: (index: TooltipActiveIndex) => emit('update:activeIndex', index),
    }))
    tooltip.bindings.register(binding)
    const ownsInteraction = computed(() => tooltip.bindings.registrations.value[0] === binding)
    const presentation = useChartPresentation()
    const viewBox = presentation.viewBox
    const accessibilityLayer = presentation.accessibility
    const tooltipEventType = tooltip.eventType
    const coordinate = source.coordinate
    const payload = source.payload

    // Portal
    const tooltipPortalFromContext = usePortal()
    const tooltipPortal = computed(() => props.portal ?? tooltipPortalFromContext?.value)

    // Final states
    const finalIsActive = source.active
    const finalLabel = source.label

    // Payload processing
    const emptyPayload: TooltipPayload = []

    const finalPayload = computed(() => {
      if (!finalIsActive.value) {
        return emptyPayload
      }

      let result: TooltipPayload = payload.value ?? emptyPayload

      if (props.filterNull && result.length > 0) {
        result = getUniqPayload(
          result.filter(entry =>
            entry.value != null && (entry.hide !== true || props.includeHidden),
          ),
          props.payloadUniqBy!,
          defaultUniqBy,
        )
      }

      return result
    })

    const announcement = useTimeoutFn(() => {
      // A controlled Tooltip announces only after its owner accepts the keyboard index.
      if (tooltip.controlled.value !== undefined && source.index.value !== tooltip.requestedIndex.value)
        return
      const entries = finalPayload.value.flatMap((entry, position, payload) => {
        const formatter = entry.formatter ?? props.formatter
        const formatted: unknown = formatter
          ? formatter(entry.value!, entry.name!, entry, position, payload)
          : entry.value
        if (formatted == null)
          return []
        const [value, name] = formatter && Array.isArray(formatted)
          ? formatted
          : [Array.isArray(formatted) ? formatted.join(' ~ ') : formatted, entry.name]
        return [`${name ?? ''} ${value ?? ''}`.trim()]
      })
      if (entries.length) {
        tooltip.announcement.value = finalLabel.value == null
          ? entries.join(', ')
          : `${finalLabel.value}: ${entries.join(', ')}`
      }
    }, 150, { immediate: false })

    // Listen to keyboard state only: pointer updates must never trigger announcements.
    watch([
      ownsInteraction,
      () => tooltip.keyboardInteraction.value.active,
      () => tooltip.controlled.value !== undefined
        ? tooltip.controlled.value
        : tooltip.keyboardInteraction.value.index,
      () => tooltip.keyboardInteraction.value.index,
      () => tooltip.keyboardInteraction.value.configuration,
    ], ([owner, active, index], _, cleanup) => {
      announcement.stop()
      if (!owner || !accessibilityLayer.value || !active || index == null)
        return
      announcement.start()
      cleanup(announcement.stop)
    }, { flush: 'post' })

    const hasPayload = computed(() => finalPayload.value.length > 0)

    // Content component resolution
    const contentComponent = computed<Component>(() => {
      if (props.content) {
        return props.content
      }
      return DefaultTooltipContent
    })

    const contentProps = computed(() => ({
      ...props,
      payload: finalPayload.value,
      label: finalLabel.value,
      active: finalIsActive.value,
      coordinate: coordinate.value,
      accessibilityLayer: accessibilityLayer.value,
    }))

    const hasContentSlot = computed(() => !!slots.content || !!slots.default)

    useTooltipChartSynchronisation(source, () => ownsInteraction.value)
    return () => {
      if (!tooltipPortal.value) {
        return null
      }
      return (
        <Fragment>
          <foreignObject>
            <Teleport to={tooltipPortal.value}>
              <TooltipBoundingBox
                allowEscapeViewBox={props.allowEscapeViewBox}
                isAnimationActive={props.isAnimationActive}
                transition={props.transition}
                active={finalIsActive.value}
                coordinate={coordinate.value}
                hasPayload={hasPayload.value}
                offset={props.offset}
                position={props.position}
                reverseDirection={props.reverseDirection}
                viewBox={viewBox.value}
                style={props.style}
              >
                {hasContentSlot.value
                  ? (slots.content ? slots.content(contentProps.value) : slots.default!())
                  : h(contentComponent.value, contentProps.value)}
              </TooltipBoundingBox>
            </Teleport>
          </foreignObject>

          {finalIsActive.value && (
            <Cursor
              cursor={props.cursor}
              cursorSlot={slots.cursor}
              tooltipEventType={tooltipEventType.value}
              coordinate={coordinate.value}
              payload={payload.value}
              index={tooltip.target.value?.index}
            />
          )}
        </Fragment>
      )
    }
  },
})

export type TooltipSlots = {
  content?: (props: TooltipContentProps) => VNodeChild
  cursor?: (props: CursorSlotProps) => VNodeChild
  default?: () => VNode[]
}

// Explicit constructor slots survive declaration generation for Volar consumers.
export const Tooltip: typeof _Tooltip & { new (): { $slots: TooltipSlots } } = _Tooltip

export default Tooltip

export type { TooltipContentProps, CursorSlotProps, CrossCursorSlotProps, RectangleCursorSlotProps, SectorCursorSlotProps, CurveCursorSlotProps, ContentType } from './types'
