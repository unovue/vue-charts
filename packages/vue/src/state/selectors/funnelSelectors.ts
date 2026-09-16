import { createSelector } from '@reduxjs/toolkit'
// import type { FunnelTrapezoidItem } from '../../cartesian/Funnel'
// import { computeFunnelTrapezoids } from '../../cartesian/Funnel'
import type { ChartData } from '../chartData'
import type { RechartsRootState } from '../store'
import { selectChartOffset } from './selectChartOffset'
import { selectChartDataAndAlwaysIgnoreIndexes } from './dataSelectors'
import type { DataKey, TooltipType } from '@/types'
import type { FunnelTrapezoidItem } from '@/cartesian/funnel/type'
import { computeFunnelTrapezoids } from '@/cartesian/funnel/utils'
// import type { DataKey, TooltipType } from '../../util/types'
// import type { CellProps } from '../..'

type FunnelComposedData = {
  trapezoids: ReadonlyArray<FunnelTrapezoidItem>
  data: any[]
}

export type ResolvedFunnelSettings = {
  dataKey: DataKey<any>
  data: any[] | undefined
  nameKey: DataKey<any>
  tooltipType?: TooltipType
  lastShapeType?: 'triangle' | 'rectangle'
  reversed?: boolean
  customWidth?: string | number
  // cells: ReadonlyArray<ReactElement>
  presentationProps: Record<string, any> | null
}

function pickFunnelSettings(_state: RechartsRootState, funnelSettings: ResolvedFunnelSettings): ResolvedFunnelSettings {
  return funnelSettings
}

export const selectFunnelTrapezoids = createSelector(
  [selectChartOffset, pickFunnelSettings, selectChartDataAndAlwaysIgnoreIndexes],
  (
    offset,
    { data, dataKey, nameKey, tooltipType, lastShapeType, reversed, customWidth,
      //  cells,
      presentationProps },
    { chartData },
  ) => {
    let displayedData: ChartData | undefined
    if (data != null && data.length > 0) {
      displayedData = data
    }
    else if (chartData != null && chartData.length > 0) {
      displayedData = chartData
    }

    if (displayedData && displayedData.length) {
      displayedData = displayedData.map((entry: any, index: number) => ({
        payload: entry,
        ...presentationProps,
        ...entry,
        // ...(cells && cells[index] && cells[index].props),
      }))
    }
    // else if (cells && cells.length) {
    //   displayedData = cells.map((cell: ReactElement<CellProps>) => ({ ...presentationProps, ...cell.props }))
    // }
    else {
      return { trapezoids: [], data: displayedData }
    }

    return computeFunnelTrapezoids({
      dataKey,
      nameKey,
      displayedData,
      tooltipType,
      lastShapeType,
      reversed,
      offset,
      customWidth,
    })
  },
)
