import type { Series } from 'd3-shape'
import type { MaybeStackedGraphicalItem } from '@/types/graphical'

export type { MaybeStackedGraphicalItem } from '@/types/graphical'
import type { StackGroup } from '@/core/axis/stacks'
import type { DataKey } from '@/types/common'
import type { StackId } from '@/types/tick'
import type { BarPositionPosition } from '@/types/bar'
import { isNullish } from '@/utils/validate'
import { getPercentValue } from '@/utils/data'

function getBarSize(
  globalSize: number | string | undefined,
  totalSize: number | undefined,
  selfSize: number | string | undefined,
): number | undefined {
  const barSize = selfSize ?? globalSize

  return isNullish(barSize) ? undefined : getPercentValue(barSize!, totalSize!, 0)
}

type BarCategory = {
  stackId: StackId | undefined
  /**
   * List of dataKeys of items stacked at this position.
   * All of these Bars are either sharing the same stackId,
   * or this is an array with one Bar because it has no stackId defined.
   *
   * This structure limits us to having one dataKey only once per stack which I think is reasonable.
   * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
   */
  dataKeys: ReadonlyArray<DataKey<unknown>>
  /**
   * Width (in horizontal chart) or height (in vertical chart) of this stack of items
   */
  barSize: number
}

export type SizeList = ReadonlyArray<BarCategory>

export function combineBarSizeList(
  allBars: ReadonlyArray<MaybeStackedGraphicalItem>,
  globalSize: string | number | undefined,
  totalSize?: number,
) {
  const initialValue: Record<StackId, Array<MaybeStackedGraphicalItem>> = Object.create(null)

  const stackedBars = allBars.filter(b => b.stackId != null)
  const unstackedBars = allBars.filter(b => b.stackId == null)

  const groupByStack: Record<StackId, Array<MaybeStackedGraphicalItem>> = stackedBars.reduce((acc, bar) => {
    if (!acc[bar.stackId!]) {
      acc[bar.stackId!] = []
    }
    acc[bar.stackId!].push(bar)
    return acc
  }, initialValue)

  const stackedSizeList: SizeList = Object.entries(groupByStack).map(([stackId, bars]): BarCategory => {
    const dataKeys = bars.map(b => b.dataKey!)
    const barSize: number = getBarSize(globalSize, totalSize, bars[0].barSize)!
    return { stackId, dataKeys, barSize }
  })

  const unstackedSizeList: SizeList = unstackedBars.map((b): BarCategory => {
    const dataKeys = [b.dataKey!]
    const barSize: number = getBarSize(globalSize, totalSize, b.barSize)!
    return { stackId: undefined, dataKeys, barSize }
  })

  return [...stackedSizeList, ...unstackedSizeList]
}

function getBarPositions(
  barGap: string | number,
  barCategoryGap: string | number,
  bandSize: number,
  sizeList: SizeList,
  maxBarSize: number,
): ReadonlyArray<BarWithPosition> | null {
  const len = sizeList.length
  if (len < 1)
    return null

  let realBarGap = getPercentValue(barGap, bandSize, 0, true)

  let result: ReadonlyArray<BarWithPosition>
  const initialValue: ReadonlyArray<BarWithPosition> = []

  // Preserve the first-series sizing policy used by grouped and stacked bars.
  if (sizeList[0].barSize === +sizeList[0].barSize) {
    let useFull = false
    let fullBarSize = bandSize / len
    let sum = sizeList.reduce((res, entry) => res + entry.barSize || 0, 0)
    sum += (len - 1) * realBarGap

    if (sum >= bandSize) {
      sum -= (len - 1) * realBarGap
      realBarGap = 0
    }
    if (sum >= bandSize && fullBarSize > 0) {
      useFull = true
      fullBarSize *= 0.9
      sum = len * fullBarSize
    }

    const offset = ((bandSize - sum) / 2) >> 0
    let prev: BarPositionPosition = { offset: offset - realBarGap, size: 0 }

    result = sizeList.reduce(
      (res: ReadonlyArray<BarWithPosition>, entry: BarCategory): ReadonlyArray<BarWithPosition> => {
        const newPosition: BarWithPosition = {
          stackId: entry.stackId,
          dataKeys: entry.dataKeys,
          position: {
            offset: prev.offset + prev.size! + realBarGap,
            size: useFull ? fullBarSize : entry.barSize,
          },
        }
        const newRes: Array<BarWithPosition> = [...res, newPosition]

        prev = newRes[newRes.length - 1].position

        return newRes
      },
      initialValue,
    )
  }
  else {
    const offset = getPercentValue(barCategoryGap, bandSize, 0, true)

    if (bandSize - 2 * offset - (len - 1) * realBarGap <= 0) {
      realBarGap = 0
    }

    let originalSize = (bandSize - 2 * offset - (len - 1) * realBarGap) / len
    if (originalSize > 1) {
      originalSize >>= 0
    }
    const size = maxBarSize === +maxBarSize ? Math.min(originalSize, maxBarSize) : originalSize
    result = sizeList.reduce(
      (res: ReadonlyArray<BarWithPosition>, entry: BarCategory, i): ReadonlyArray<BarWithPosition> => [
        ...res,
        {
          stackId: entry.stackId,
          dataKeys: entry.dataKeys,
          position: {
            offset: offset + (originalSize + realBarGap) * i + (originalSize - size) / 2,
            size,
          },
        },
      ],
      initialValue,
    )
  }

  return result
}

export type BarWithPosition = {
  stackId: StackId | undefined
  /**
   * List of dataKeys of items stacked at this position.
   * All of these Bars are either sharing the same stackId,
   * or this is an array with one Bar because it has no stackId defined.
   *
   * This structure limits us to having one dataKey only once per stack which I think is reasonable.
   * People who want to have the same data twice can duplicate their data to have two distinct dataKeys.
   */
  dataKeys: ReadonlyArray<DataKey<unknown>>
  /**
   * Position of this stack in absolute pixels measured from the start of the chart
   */
  position: BarPositionPosition
}

export function combineAllBarPositions(
  sizeList: SizeList | undefined,
  globalMaxBarSize: number,
  barGap: string | number,
  barCategoryGap: string | number,
  barBandSize: number | undefined,
  bandSize: number | undefined,
  childMaxBarSize: number | undefined,
) {
  const maxBarSize: number = isNullish(childMaxBarSize) ? globalMaxBarSize : childMaxBarSize!

  let allBarPositions = getBarPositions(
    barGap,
    barCategoryGap,
    barBandSize !== bandSize ? barBandSize! : bandSize!,
    sizeList!,
    maxBarSize,
  )

  if (barBandSize !== bandSize && allBarPositions != null) {
    allBarPositions = allBarPositions.map(pos => ({
      ...pos,
      position: { ...pos.position, offset: pos.position.offset - barBandSize! / 2 },
    }))
  }

  return allBarPositions!
}

export function combineStackedData(
  stackGroups: Record<StackId, StackGroup> | undefined,
  barSettings: MaybeStackedGraphicalItem | undefined,
): Series<unknown, DataKey<unknown>> | undefined {
  if (!stackGroups || barSettings?.dataKey == null) {
    return undefined
  }
  const { stackId } = barSettings
  const stackGroup: StackGroup = stackGroups[stackId!]
  if (!stackGroup) {
    return undefined
  }
  const { stackedData }: StackGroup = stackGroup
  if (!stackedData) {
    return undefined
  }
  return stackedData.find(sd => sd.key === barSettings.dataKey)
}
