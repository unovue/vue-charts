import { sortBy } from 'es-toolkit/compat'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { computed, inject, provide, shallowRef, toRaw, watch } from 'vue'
import type { AxisLookup } from './axis'
import { createRegistry } from './registry'
import { warn } from '@/utils/log'
import type { createChartData } from './dataRange'
import { tooltipCoordinate, tooltipPayload } from '@/core/tooltip'
import { getValueByDataKey as readDataKey } from '@/core/data'
import type { ChartOptions } from '@/model/options'
import type { ChartOffsetRequired, Coordinate, DataKey, LayoutType, Size, TooltipEventType } from '@/types'
import type { TooltipActiveIndex, TooltipIndex, TooltipInteractionState, TooltipPayloadConfiguration, TooltipPayloadEntry, TooltipSettingsState, TooltipTargetRequest } from '@/types/tooltip'

const noInteraction: TooltipInteractionState = Object.freeze({
  active: false,
  index: null,
  dataKey: undefined,
  coordinate: undefined,
})

export interface TooltipSource {
  readonly active: ComputedRef<boolean>
  readonly index: ComputedRef<number | null>
  readonly label: ComputedRef<string | undefined>
  readonly payload: ComputedRef<readonly TooltipPayloadEntry[]>
  readonly coordinate: ComputedRef<Coordinate | undefined>
}

export interface TooltipBinding {
  readonly settings: TooltipSettingsState
  readonly request: (index: TooltipActiveIndex) => void
}

interface TooltipInputs {
  axis?: AxisLookup
  dataRange: ReturnType<typeof createChartData>
  options: () => ChartOptions
  layout: () => LayoutType
  size: () => Size
  offset: () => ChartOffsetRequired
}

type Entry = Readonly<Ref<TooltipPayloadConfiguration | undefined>>
type Channel = 'hover' | 'click' | 'keyboard' | 'sync'
export interface Target {
  entry?: Entry
  identity: unknown
  /** Payload position can differ from the keyboard target order. */
  index: number
  payloadKey?: string
  localIndex: number
  coordinate?: Coordinate
  onClick?: (event: KeyboardEvent) => void
}
interface Selection {
  target: Pick<Target, 'entry' | 'identity'>
  requestedIndex: number
  channel: Channel
  active: boolean
  coordinate?: Coordinate
}

const controllerKey: InjectionKey<TooltipController> = Symbol('vccs-tooltip-controller')

export type TooltipController = ReturnType<typeof createTooltip>

export function provideTooltipController(controller: TooltipController) {
  provide(controllerKey, controller)
  provideTooltipSource(controller.source)
}

export function useTooltipController() {
  const controller = inject(controllerKey)
  if (!controller)
    throw new Error('vccs: selection requires a tooltip controller.')
  return controller
}

const sourceKey: InjectionKey<TooltipSource> = Symbol('vccs-tooltip-source')
const entryKey: InjectionKey<Entry> = Symbol('vccs-tooltip-entry')

function provideTooltipSource(source: TooltipSource) {
  provide(sourceKey, source)
}

export function useTooltipSource() {
  const source = inject(sourceKey)
  if (!source)
    throw new Error('vccs: Tooltip requires a tooltip source.')
  return source
}

export function provideTooltipEntry(entry: Entry) {
  provide(entryKey, entry)
}

export function useTooltipEntry() {
  return inject(entryKey, undefined)
}

export function createTooltip(inputs: TooltipInputs) {
  const entries = createRegistry<TooltipPayloadConfiguration>()
  const bindings = createRegistry<TooltipBinding>()
  const selection = shallowRef<Selection | null>()
  const announcement = shallowRef('')
  watch(() => bindings.entries.value.length, (count) => {
    if (count === 0)
      announcement.value = ''
  })
  const settings = computed<TooltipSettingsState>(() => bindings.entries.value[0]?.settings ?? {
    shared: undefined,
    trigger: 'hover',
    axisId: 0,
    active: undefined,
    defaultIndex: undefined,
  })
  const rootModels = computed(() => entries.entries.value.flatMap(entry => entry.model?.root ? [entry.model] : []))
  const controlledBindings = computed(() => bindings.entries.value.filter(binding => binding.settings.activeIndex !== undefined))
  let warnedOwners = false
  watch(() => controlledBindings.value.length, (count) => {
    if (count > 1 && !warnedOwners) {
      warnedOwners = true
      warn(false, 'vccs: only one Tooltip per chart may control activeIndex; the first controlled Tooltip wins.')
    }
  })
  const controlled = computed(() => {
    const root = rootModels.value.find(model => model.index() !== undefined)
    return root ? root.index() : controlledBindings.value[0]?.settings.activeIndex
  })
  const eventType = computed<TooltipEventType>(() => {
    const options = inputs.options()
    const shared = settings.value.shared
    const requested = shared === undefined ? options.defaultTooltipEventType : shared ? 'axis' : 'item'
    return options.validateTooltipEventTypes?.includes(requested) ? requested : options.defaultTooltipEventType
  })
  const axisType = computed(() => {
    const layout = inputs.layout()
    return layout === 'horizontal' ? 'xAxis' : layout === 'vertical' ? 'yAxis' : layout === 'centric' ? 'angleAxis' : 'radiusAxis'
  })
  const axis = computed(() => inputs.axis?.(axisType.value, settings.value.axisId))
  const ticks = computed(() => axis.value?.tooltipTicks.value)
  const orderedTicks = computed(() => sortBy(ticks.value ?? [], tick => tick.coordinate))
  const displayedData = computed(() => axis.value?.displayedData.value ?? [])

  function rowIdentity(row: unknown, key: TooltipPayloadConfiguration['settings']['nameKey']): unknown {
    const source = Array.isArray(row) ? row[0]?.payload : row
    const raw = source && typeof source === 'object' && 'payload' in source ? source.payload : source
    const name = key === undefined ? undefined : readDataKey(source, key) ?? readDataKey(raw, key)
    return name ?? toRaw(raw)
  }

  function identities(rows: readonly unknown[], key: TooltipPayloadConfiguration['settings']['nameKey']) {
    const values = rows.map(row => rowIdentity(row, key))
    const counts = new Map<unknown, number>()
    for (const value of values)
      counts.set(value, (counts.get(value) ?? 0) + 1)
    return values.map((value, index) => counts.get(value) === 1 ? value : toRaw(rows[index]))
  }

  function payloadAt(configuration: TooltipPayloadConfiguration, index: number, payloadKey?: string) {
    const data = configuration.dataDefinedOnItem
    return payloadKey === undefined
      ? Array.isArray(data) ? data[index] : undefined
      : inputs.options().tooltipPayloadSearcher?.(data, payloadKey)
  }

  const axisTargets = computed<readonly Target[]>(() => {
    if (!entries.entries.value.some(entry => !entry.settings.hide))
      return []
    const identity = identities(displayedData.value, axis.value?.settings.value.dataKey)
    return (ticks.value ?? []).map((tick, index) => ({
      index,
      localIndex: index,
      identity: identity[index],
    }))
  })
  const itemTargets = computed<readonly Target[]>(() => entries.registrations.value.flatMap((entry) => {
    const configuration = entry.value
    if (!configuration || configuration.settings.hide)
      return []
    if (configuration.keyboardItems) {
      const rows = configuration.keyboardItems.map(item => item.identity
        ?? payloadAt(configuration, item.index, item.payloadKey))
      const identity = identities(rows, configuration.settings.nameKey)
      return configuration.keyboardItems.map((item, localIndex) => ({
        ...item,
        entry,
        localIndex,
        identity: identity[localIndex],
      }))
    }
    const data = configuration.dataDefinedOnItem == null
      ? displayedData.value
      : inputs.dataRange.tooltipData(configuration.dataDefinedOnItem)
    if (!Array.isArray(data))
      return []
    const identity = identities(data, configuration.settings.nameKey ?? axis.value?.settings.value.dataKey)
    return data.map((row, localIndex) => ({
      entry,
      localIndex,
      index: localIndex,
      identity: identity[localIndex],
      coordinate: configuration.positions?.[localIndex],
    }))
  }))
  const pointerTargets = computed<readonly Target[]>(() => entries.registrations.value.flatMap((entry) => {
    const configuration = entry.value
    if (!configuration || configuration.settings.hide)
      return []
    return (configuration.pointerItems ?? []).map((item, localIndex) => ({
      ...item,
      entry,
      localIndex,
      identity: rowIdentity(item.identity ?? payloadAt(configuration, item.index, item.payloadKey), configuration.settings.nameKey),
    }))
  }))
  const targets = computed(() => eventType.value === 'axis' ? axisTargets.value : itemTargets.value)

  function positional(index: TooltipActiveIndex | undefined, candidates = targets.value) {
    return index === undefined || index === null || !Number.isSafeInteger(index) || index < 0
      ? undefined
      : candidates[index]
  }

  function sameTarget(a: Pick<Target, 'entry' | 'identity'>, b: Pick<Target, 'entry' | 'identity'>) {
    return a.entry === b.entry && a.identity === b.identity
  }

  const target = computed(() => {
    if (controlled.value !== undefined)
      return positional(controlled.value)
    const current = selection.value
    if (current) {
      const candidates = eventType.value === 'item' ? [...itemTargets.value, ...pointerTargets.value] : axisTargets.value
      const candidate = candidates.find(item => item.identity === current.target.identity
        && (eventType.value === 'axis' || !current.target.entry || item.entry === current.target.entry))
      const modelIndex = candidate?.entry?.value?.model?.index()
      if (modelIndex !== undefined)
        return positional(modelIndex, itemTargets.value.filter(item => item.entry === candidate?.entry))
      return candidate
    }
    return current === null ? undefined : positional(settings.value.defaultIndex)
  })
  const index = computed(() => {
    const position = target.value ? targets.value.indexOf(target.value) : -1
    return position < 0 ? null : position
  })
  const requestedIndex = computed(() => {
    const intent = selection.value
    const position = intent ? targets.value.findIndex(candidate => sameTarget(candidate, intent.target)) : -1
    return position < 0 ? null : position
  })
  const active = computed(() => {
    if (!target.value)
      return false
    if (controlled.value !== undefined)
      return true
    const channel = selection.value?.channel
    if ((channel === 'hover' || channel === 'click') && channel !== settings.value.trigger)
      return false
    return settings.value.active ?? selection.value?.active ?? settings.value.defaultIndex != null
  })
  const label = computed(() => {
    const value = eventType.value === 'axis' && index.value !== null ? ticks.value?.[index.value]?.value : undefined
    return value == null ? undefined : String(value)
  })

  function coordinateFor(candidate: Target | undefined, fallback?: Coordinate) {
    if (!candidate)
      return undefined
    return tooltipCoordinate(
      eventType.value,
      inputs.layout(),
      ticks.value?.[candidate.localIndex],
      inputs.size(),
      inputs.offset(),
      candidate.coordinate,
      fallback,
    )
  }
  const coordinate = computed(() => coordinateFor(
    target.value,
    controlled.value !== undefined ? undefined : selection.value?.coordinate,
  ))
  const payload = computed(() => {
    const shown = eventType.value === 'item'
      ? target.value?.entry?.value ? [target.value.entry.value] : []
      : entries.entries.value
    return tooltipPayload(
      shown.map(entry => ({
        ...entry,
        dataDefinedOnItem: inputs.dataRange.tooltipData(entry.dataDefinedOnItem),
      })),
      target.value?.index ?? null,
      axis.value?.settings.value,
      label.value,
      inputs.options().tooltipPayloadSearcher,
      eventType.value,
      target.value?.payloadKey,
    ) ?? []
  })
  const source: TooltipSource = { active, index, label, payload, coordinate }

  function notify(index: TooltipActiveIndex) {
    for (const binding of bindings.entries.value)
      binding.request(index)
    for (const model of rootModels.value)
      model.request(index)
  }

  let lastRequest: { index: TooltipActiveIndex, owner: TooltipActiveIndex | undefined, target?: Target } | undefined
  function request(next: TooltipActiveIndex, target?: Target) {
    const owner = controlled.value
    if (next === owner || (lastRequest?.index === next && Object.is(lastRequest.owner, owner)
      && (next === null || (target && lastRequest.target && sameTarget(target, lastRequest.target))))) {
      return
    }
    lastRequest = { index: next, owner, target }
    notify(next)
  }

  function findTarget(type: TooltipEventType, input: TooltipTargetRequest) {
    if (type === 'axis')
      return positional(input.index, axisTargets.value)
    return [...itemTargets.value, ...pointerTargets.value].find(item => item.index === input.index
      && (input.configuration ? item.entry?.value === input.configuration : item.entry?.value?.settings.dataKey === input.dataKey))
  }

  let lastSeriesRequest: { entry: Entry, index: TooltipActiveIndex, owner: TooltipActiveIndex | undefined, target: Target } | undefined
  function requestSeries(candidate: Target | undefined, isActive: boolean) {
    const entry = candidate?.entry
    const model = entry?.value?.model
    if (!entry || !model || model.root)
      return
    const next = isActive ? candidate.localIndex : null
    const owner = model.index()
    if (next === owner || (lastSeriesRequest?.entry === entry && lastSeriesRequest.index === next && Object.is(lastSeriesRequest.owner, owner)
      && (next === null || sameTarget(candidate, lastSeriesRequest.target)))) {
      return
    }
    lastSeriesRequest = { entry, index: next, owner, target: candidate }
    model.request(next)
  }

  function activate(channel: Channel, input: TooltipTargetRequest) {
    const type = input.type ?? eventType.value
    const isActive = input.active ?? true
    if ((channel === 'hover' || channel === 'click') && channel !== settings.value.trigger)
      return
    const next = findTarget(type, input)
    if (type !== eventType.value) {
      requestSeries(next, isActive)
      return
    }
    const position = next ? targets.value.indexOf(next) : -1
    const publicIndex = position < 0 ? null : position
    request(isActive ? publicIndex : null, next)
    requestSeries(next, isActive)
    if (!next) {
      selection.value = null
      return
    }
    selection.value = {
      target: { entry: next.entry, identity: next.identity },
      requestedIndex: next.index,
      channel,
      active: isActive,
      coordinate: input.coordinate,
    }
  }

  function clear(channel: Channel) {
    if (channel === 'hover' && settings.value.trigger !== 'hover')
      return
    request(null)
    if (channel === 'keyboard') {
      selection.value = null
      return
    }
    const intent = selection.value
    const candidate = intent ? [...itemTargets.value, ...pointerTargets.value].find(item => sameTarget(item, intent.target)) : undefined
    requestSeries(candidate, false)
    if (controlled.value === undefined && selection.value)
      selection.value = { ...selection.value, active: false }
  }

  function activeIndexFor(entry: Entry) {
    return computed(() => {
      if (controlled.value === undefined && entry.value?.model?.index() !== undefined)
        return positional(entry.value.model.index(), itemTargets.value.filter(item => item.entry === entry))?.localIndex ?? null
      if (!active.value)
        return null
      return eventType.value === 'axis' || target.value?.entry === entry ? target.value?.localIndex ?? null : null
    })
  }

  const invalid = new WeakMap<object, { input: TooltipActiveIndex, order: readonly Target[] }>()
  function validate(owner: object, input: TooltipActiveIndex | undefined, candidates: readonly Target[], emit: (index: null) => void) {
    if (input === undefined || input === null || positional(input, candidates)) {
      invalid.delete(owner)
      return
    }
    const order = candidates
    const previous = invalid.get(owner)
    if (previous && Object.is(previous.input, input) && order.length === previous.order.length && order.every((item, i) => sameTarget(item, previous.order[i])))
      return
    invalid.set(owner, { input, order })
    emit(null)
  }
  watch(() => {
    const owners = entries.registrations.value.map(entry => ({ entry, index: entry.value?.model?.index() }))
    return { index: controlled.value, targets: targets.value, owners }
  }, ({ index, targets, owners }) => {
    validate(bindings, index, targets, () => notify(null))
    if (index !== undefined)
      return
    for (const owner of owners) {
      validate(owner.entry, owner.index, itemTargets.value.filter(item => item.entry === owner.entry), () => owner.entry.value?.model?.request(null))
    }
  }, { flush: 'post' })
  watch([targets, pointerTargets], () => {
    if (controlled.value === undefined && selection.value && !target.value) {
      request(null)
      selection.value = null
    }
  }, { flush: 'post' })

  const interaction = computed<TooltipInteractionState>(() => ({
    active: active.value,
    index: target.value?.index ?? null,
    configuration: target.value?.entry?.value,
    dataKey: target.value?.entry?.value?.settings.dataKey,
    coordinate: coordinate.value,
  }))
  const keyboardInteraction = computed(() => selection.value?.channel === 'keyboard'
    ? { ...interaction.value, index: selection.value.requestedIndex, active: selection.value.active }
    : noInteraction)
  const syncInteraction = computed(() => ({
    ...(selection.value?.channel === 'sync' ? interaction.value : noInteraction),
    label: label.value,
  }))

  function coordinateAt(index: TooltipIndex, dataKey: DataKey<unknown>) {
    const entry = entries.entries.value.find(entry => entry.settings.dataKey === dataKey)
    return index === null ? undefined : entry?.positions?.[index]
  }

  return {
    source,
    bindings,
    settings,
    eventType,
    axisType,
    axis,
    ticks,
    orderedTicks,
    displayedData,
    targets,
    target,
    controlled,
    requestedIndex,
    entries,
    announcement,
    keyboardInteraction,
    syncInteraction,
    coordinateAt,
    activeIndexFor,
    coordinateFor,
    activate,
    clear,
  }
}
