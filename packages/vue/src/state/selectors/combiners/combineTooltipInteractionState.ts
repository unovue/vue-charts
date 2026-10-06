import type { TooltipIndex, TooltipInteractionState, TooltipState } from '../../chartTooltip'
import { noInteraction } from '../../chartTooltip'
import type { TooltipEventType, TooltipTrigger } from '@/types'

function chooseAppropriateMouseInteraction(
  tooltipState: TooltipState,
  tooltipEventType: TooltipEventType | undefined,
  trigger: TooltipTrigger,
): TooltipInteractionState | undefined {
  if (tooltipEventType === 'axis') {
    if (trigger === 'click') {
      return tooltipState.axisInteraction.click
    }
    return tooltipState.axisInteraction.hover
  }
  if (trigger === 'click') {
    return tooltipState.itemInteraction.click
  }
  return tooltipState.itemInteraction.hover
}

function hasBeenActivePreviously(tooltipInteractionState: TooltipInteractionState): boolean {
  return tooltipInteractionState.index != null
}

export function combineTooltipInteractionState(tooltipState: TooltipState, tooltipEventType: TooltipEventType | undefined, trigger: TooltipTrigger, defaultIndex: TooltipIndex | undefined): TooltipInteractionState {
  if (tooltipState.settings.activeIndex !== undefined) {
    return {
      ...noInteraction,
      active: tooltipState.settings.activeIndex !== null,
      index: tooltipState.settings.activeIndex === null ? null : String(tooltipState.settings.activeIndex),
    }
  }
  const appropriateMouseInteraction = chooseAppropriateMouseInteraction(tooltipState, tooltipEventType!, trigger)

  if (appropriateMouseInteraction?.active) {
    return appropriateMouseInteraction
  }

  if (tooltipState.keyboardInteraction.active) {
    return tooltipState.keyboardInteraction
  }

  if (tooltipState.syncInteraction.active && tooltipState.syncInteraction.index != null) {
    return tooltipState.syncInteraction
  }

  const activeFromProps = tooltipState.settings.active === true

  if (hasBeenActivePreviously(appropriateMouseInteraction!)) {
    if (activeFromProps) {
      return {
        ...appropriateMouseInteraction!,
        active: true,
      }
    }
  }
  else if (defaultIndex != null) {
    return {
      active: true,
      coordinate: undefined,
      dataKey: undefined,
      index: defaultIndex,
    }
  }

  return {
    ...noInteraction,
    coordinate: appropriateMouseInteraction?.coordinate,
  }
}
