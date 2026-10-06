import { sortBy } from 'es-toolkit/compat'
import type { ComputedRef, InjectionKey, Ref } from 'vue'
import { computed, inject, provide, shallowRef, toRaw, watch } from 'vue'
import type { AxisLookup } from './axis'
import type { Registry } from './registry'
import { createRegistry } from './registry'
import { combineTicksOfTooltipAxis, combineTooltipCoordinate, combineTooltipPayload, parseTooltipIndex, sliceTooltipData } from '@/core/tooltip'
import { getValueByDataKey as readDataKey } from '@/core/data'
import type { ChartOptions } from '@/state/chartOptions'
import type { ChartDataState } from '@/types/chartData'
import type { ChartOffsetRequired, Coordinate, LayoutType, Size, TooltipEventType } from '@/types'
import type { TooltipActionPayload, TooltipActiveIndex, TooltipInteractionState, TooltipPayloadConfiguration, TooltipPayloadEntry, TooltipSettingsState, TooltipState, TooltipSyncState } from '@/state/chartTooltip'
import { noInteraction } from '@/state/chartTooltip'

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
  axis: AxisLookup
  entries: Registry<TooltipPayloadConfiguration>
  data: ComputedRef<ChartDataState>
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
  index: string
  localIndex: number
  coordinate?: Coordinate
  onClick?: (event: KeyboardEvent) => void
}
interface Selection {
  target: Pick<Target, 'entry' | 'identity'>
  requestedIndex: string
  channel: Channel
  active: boolean
  coordinate?: Coordinate
}

const sourceKey: InjectionKey<TooltipSource> = Symbol('vccs-tooltip-source')
const entryKey: InjectionKey<Entry> = Symbol('vccs-tooltip-entry')

export function provideTooltipSource(source: TooltipSource) {
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
  const controlled = computed(() => {
    const owners = bindings.entries.value.filter(binding => binding.settings.activeIndex !== undefined)
    if (owners.length > 1)
      throw new Error('vccs: only one Tooltip per chart may control activeIndex.')
    return owners[0]?.settings.activeIndex
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
  const axis = computed(() => inputs.axis(axisType.value, settings.value.axisId))
  const ticks = computed(() => {
    const model = axis.value
    return combineTicksOfTooltipAxis(
      inputs.layout(),
      model.settings.value,
      model.realScaleType.value,
      model.scale.value,
      model.range.value,
      model.duplicateDomain.value,
      model.categoricalDomain.value,
      axisType.value,
    )
  })
  const orderedTicks = computed(() => sortBy(ticks.value ?? [], tick => tick.coordinate))
  const displayedData = computed(() => axis.value.displayedData.value)

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

  const axisTargets = computed<readonly Target[]>(() => {
    if (!inputs.entries.entries.value.some(entry => !entry.settings.hide))
      return []
    const identity = identities(displayedData.value, axis.value.settings.value.dataKey)
    return (ticks.value ?? []).map((tick, index) => ({
      index: String(index),
      localIndex: index,
      identity: identity[index],
    }))
  })
  const itemTargets = computed<readonly Target[]>(() => inputs.entries.registrations.value.flatMap((entry) => {
    const configuration = entry.value
    if (!configuration || configuration.settings.hide)
      return []
    if (configuration.keyboardItems) {
      const rows = configuration.keyboardItems.map(item => item.identity
        ?? inputs.options().tooltipPayloadSearcher?.(configuration.dataDefinedOnItem, item.index))
      const identity = identities(rows, configuration.settings.nameKey)
      return configuration.keyboardItems.map((item, localIndex) => ({
        ...item,
        entry,
        localIndex,
        identity: identity[localIndex],
      }))
    }
    const range = inputs.data.value
    const data = configuration.dataDefinedOnItem == null
      ? displayedData.value
      : sliceTooltipData(configuration.dataDefinedOnItem, range.dataStartIndex, range.dataEndIndex)
    if (!Array.isArray(data))
      return []
    const identity = identities(data, configuration.settings.nameKey ?? axis.value.settings.value.dataKey)
    return data.map((row, localIndex) => ({
      entry,
      localIndex,
      index: String(localIndex),
      identity: identity[localIndex],
      coordinate: inputs.options().tooltipPayloadSearcher?.(configuration.positions, String(localIndex)),
    }))
  }))
  const pointerTargets = computed<readonly Target[]>(() => inputs.entries.registrations.value.flatMap((entry) => {
    const configuration = entry.value
    if (!configuration || configuration.settings.hide)
      return []
    return (configuration.pointerItems ?? []).map((item, localIndex) => ({
      ...item,
      entry,
      localIndex,
      identity: rowIdentity(item.identity ?? inputs.options().tooltipPayloadSearcher?.(configuration.dataDefinedOnItem, item.index), configuration.settings.nameKey),
    }))
  }))
  const targets = computed(() => eventType.value === 'axis' ? axisTargets.value : itemTargets.value)

  function positional(index: TooltipActiveIndex | undefined, candidates = targets.value) {
    return index === undefined || index === null ? undefined : candidates[parseTooltipIndex(index) ?? -1]
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
    return current === null ? undefined : positional(parseTooltipIndex(settings.value.defaultIndex))
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
    return combineTooltipCoordinate(
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
  const payload = computed(() => combineTooltipPayload(
    eventType.value === 'item' ? target.value?.entry?.value ? [target.value.entry.value] : [] : inputs.entries.entries.value,
    target.value?.index ?? null,
    inputs.data.value,
    axis.value.settings.value,
    label.value,
    inputs.options().tooltipPayloadSearcher,
    eventType.value,
  ) ?? [])
  const source: TooltipSource = { active, index, label, payload, coordinate }

  let lastRequest: { index: TooltipActiveIndex, owner: TooltipActiveIndex | undefined, target?: Target } | undefined
  function request(next: TooltipActiveIndex, target?: Target) {
    const owner = controlled.value
    if (next === owner || (lastRequest?.index === next && Object.is(lastRequest.owner, owner)
      && (next === null || (target && lastRequest.target && sameTarget(target, lastRequest.target))))) {
      return
    }
    lastRequest = { index: next, owner, target }
    for (const binding of bindings.entries.value)
      binding.request(next)
  }

  function findTarget(type: TooltipEventType, action: TooltipActionPayload) {
    if (type === 'axis')
      return positional(parseTooltipIndex(action.activeIndex), axisTargets.value)
    return [...itemTargets.value, ...pointerTargets.value].find(item => item.index === action.activeIndex
      && (action.configuration ? item.entry?.value === action.configuration : item.entry?.value?.settings.dataKey === action.activeDataKey))
  }

  let lastSeriesRequest: { entry: Entry, index: TooltipActiveIndex, owner: TooltipActiveIndex | undefined, target: Target } | undefined
  function requestSeries(candidate: Target | undefined, isActive: boolean) {
    const entry = candidate?.entry
    const model = entry?.value?.model
    if (!entry || !model)
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

  function activate(type: TooltipEventType, channel: Channel, action: TooltipActionPayload, isActive = true) {
    if ((channel === 'hover' || channel === 'click') && channel !== settings.value.trigger)
      return
    const next = findTarget(type, action)
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
      coordinate: action.activeCoordinate,
    }
  }

  function clear(channel: Channel) {
    if (channel === 'hover' && settings.value.trigger !== 'hover')
      return
    request(null)
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
    const owners = inputs.entries.registrations.value.map(entry => ({ entry, index: entry.value?.model?.index() }))
    return { index: controlled.value, targets: targets.value, owners }
  }, ({ index, targets, owners }) => {
    validate(bindings, index, targets, () => {
      for (const binding of bindings.entries.value)
        binding.request(null)
    })
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
  const state = computed<TooltipState>(() => {
    const current = interaction.value
    const channel = selection.value?.channel
    const hover = channel === 'hover' ? current : noInteraction
    const click = channel === 'click' ? current : noInteraction
    return {
      settings: { ...settings.value, activeIndex: controlled.value },
      tooltipItemPayloads: inputs.entries.entries.value,
      itemInteraction: { hover, click },
      axisInteraction: { hover, click },
      keyboardInteraction: channel === 'keyboard' && selection.value
        ? { ...current, index: selection.value.requestedIndex, active: selection.value.active }
        : noInteraction,
      syncInteraction: { ...(channel === 'sync' ? current : noInteraction), label: label.value },
    }
  })

  function setActiveMouseOverItemIndex(action: TooltipActionPayload) { activate('item', 'hover', action) }
  function setActiveClickItemIndex(action: TooltipActionPayload) { activate('item', 'click', action) }
  function setMouseOverAxisIndex(action: TooltipActionPayload) { activate('axis', 'hover', action) }
  function setMouseClickAxisIndex(action: TooltipActionPayload) { activate('axis', 'click', action) }
  function mouseLeaveItem() { clear('hover') }
  function mouseLeaveChart() { clear('hover') }
  function setSyncInteraction(action: TooltipSyncState) {
    const candidate = positional(parseTooltipIndex(action.index))
    activate(eventType.value, 'sync', { activeIndex: candidate?.index ?? null, configuration: candidate?.entry?.value, activeDataKey: candidate?.entry?.value?.settings.dataKey, activeCoordinate: action.coordinate }, action.active)
  }
  function setKeyboardInteraction(action: TooltipActionPayload & { active: boolean }) {
    activate(eventType.value, 'keyboard', action, action.active)
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
    entries: inputs.entries,
    announcement,
    state,
    activeIndexFor,
    coordinateFor,
    setActiveMouseOverItemIndex,
    setActiveClickItemIndex,
    setMouseOverAxisIndex,
    setMouseClickAxisIndex,
    mouseLeaveItem,
    mouseLeaveChart,
    setSyncInteraction,
    setKeyboardInteraction,
  }
}
