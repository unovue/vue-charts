import type { TooltipPayloadConfiguration } from '@/state/chartTooltip'
import type { ResolvedBarProps } from './type'
import { getTooltipNameProp } from '@/utils/chart'

export function getTooltipEntrySettings(props: ResolvedBarProps): TooltipPayloadConfiguration {
  const { dataKey, stroke, strokeWidth, fill, name, hide, unit } = props
  return {
    dataDefinedOnItem: undefined,
    positions: undefined,
    settings: {
      stroke,
      strokeWidth,
      fill,
      dataKey,
      nameKey: undefined,
      name: getTooltipNameProp(name, dataKey),
      hide,
      type: props.tooltipType,
      color: props.fill,
      unit: unit as string,
    },
  }
}
