import type { RechartsRootState } from '../store'
import { useAppSelector } from '../hooks'
import type { SharedTooltipSettings } from '../chartTooltip'
import type { TooltipEventType } from '@/types'

export function selectDefaultTooltipEventType(state: RechartsRootState): TooltipEventType {
  return state.options.defaultTooltipEventType
}
export function selectValidateTooltipEventTypes(state: RechartsRootState): ReadonlyArray<TooltipEventType> | undefined {
  return state.options.validateTooltipEventTypes
}

export function combineTooltipEventType(
  shared: SharedTooltipSettings,
  defaultTooltipEventType: TooltipEventType,
  validateTooltipEventTypes: ReadonlyArray<TooltipEventType> | undefined,
): TooltipEventType {
  if (shared == null) {
    return defaultTooltipEventType
  }
  const eventType = shared ? 'axis' : 'item'
  if (validateTooltipEventTypes == null) {
    return defaultTooltipEventType
  }
  return validateTooltipEventTypes.includes(eventType) ? eventType : defaultTooltipEventType
}

export function selectTooltipEventType(state: RechartsRootState, shared: SharedTooltipSettings): TooltipEventType {
  const defaultTooltipEventType = selectDefaultTooltipEventType(state)
  const validateTooltipEventTypes = selectValidateTooltipEventTypes(state)
  return combineTooltipEventType(shared, defaultTooltipEventType, validateTooltipEventTypes)
}

export function useTooltipEventType(shared: SharedTooltipSettings) {
  return useAppSelector(state => selectTooltipEventType(state, shared))
}
