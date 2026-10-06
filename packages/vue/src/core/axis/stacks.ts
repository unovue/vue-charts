import type { Series } from 'd3-shape'
import {
  stack as shapeStack,
  stackOffsetExpand,
  stackOffsetNone,
  stackOffsetSilhouette,
  stackOffsetWiggle,
  stackOrderNone,
} from 'd3-shape'
import type { DataKey, StackOffsetType } from '@/types/common'
import type { AxisType, NumberDomain } from '@/types/axis'
import type { StackId } from '@/types/tick'
import type { ChartData, ChartDataState } from '@/types/chartData'
import type { MaybeStackedGraphicalItem } from '@/types/graphical'
import { getValueByDataKey } from '@/core/data'
import { isNan, isNumber, toFiniteNumber } from '@/utils/validate'

function makeDomainFinite(domain: NumberDomain): NumberDomain {
  return [domain[0] === Infinity ? 0 : domain[0], domain[1] === -Infinity ? 0 : domain[1]]
}

function getDomainOfSingle(data: readonly (readonly unknown[])[]): number[] {
  const flat = data.flat(2).filter(isNumber)
  return [Math.min(...flat), Math.max(...flat)]
}

export function getDomainOfStackGroups(
  stackGroups: Record<StackId, StackGroup> | undefined,
  startIndex: number,
  endIndex: number,
): NumberDomain | undefined {
  if (stackGroups == null) {
    return undefined
  }
  return makeDomainFinite(
    Object.keys(stackGroups).reduce(
      (result, stackId): NumberDomain => {
        const group = stackGroups[stackId]
        const { stackedData } = group
        const domain = stackedData.reduce(
          (res, entry) => {
            const s = getDomainOfSingle(entry.slice(startIndex, endIndex + 1))

            return [Math.min(res[0], s[0]), Math.max(res[1], s[1])]
          },
          [Infinity, -Infinity],
        )

        return [Math.min(domain[0], result[0]), Math.max(domain[1], result[1])]
      },
      [Infinity, -Infinity],
    ),
  )
}

type OffsetAccessor = (series: Array<Series<Record<string, unknown>, string>>, order: number[]) => void

const offsetSign: OffsetAccessor = (series) => {
  const n = series.length
  if (n <= 0) {
    return
  }

  for (let j = 0, m = series[0].length; j < m; ++j) {
    let positive = 0
    let negative = 0

    for (let i = 0; i < n; ++i) {
      const value = isNan(series[i][j][1]) ? series[i][j][0] : series[i][j][1]

      if (value >= 0) {
        series[i][j][0] = positive
        series[i][j][1] = positive + value
        positive = series[i][j][1]
      }
      else {
        series[i][j][0] = negative
        series[i][j][1] = negative + value
        negative = series[i][j][1]
      }
    }
  }
}

const offsetPositive: OffsetAccessor = (series) => {
  const n = series.length
  if (n <= 0) {
    return
  }

  for (let j = 0, m = series[0].length; j < m; ++j) {
    let positive = 0

    for (let i = 0; i < n; ++i) {
      const value = isNan(series[i][j][1]) ? series[i][j][0] : series[i][j][1]

      if (value >= 0) {
        series[i][j][0] = positive
        series[i][j][1] = positive + value
        positive = series[i][j][1]
      }
      else {
        series[i][j][0] = 0
        series[i][j][1] = 0
      }
    }
  }
}

const STACK_OFFSET_MAP: Record<string, OffsetAccessor> = {
  sign: offsetSign,
  // @ts-expect-error definitelytyped types are incorrect
  expand: stackOffsetExpand,
  // @ts-expect-error definitelytyped types are incorrect
  none: stackOffsetNone,
  // @ts-expect-error definitelytyped types are incorrect
  silhouette: stackOffsetSilhouette,
  // @ts-expect-error definitelytyped types are incorrect
  wiggle: stackOffsetWiggle,
  positive: offsetPositive,
}

export function getStackedData<T>(
  data: ReadonlyArray<T>,
  dataKeys: ReadonlyArray<DataKey<T>>,
  offsetType: StackOffsetType,
): ReadonlyArray<Series<T, DataKey<T>>> {
  const offsetAccessor: OffsetAccessor = STACK_OFFSET_MAP[offsetType]
  const stack = shapeStack<T, DataKey<T>>()
    .keys(dataKeys)
    .value((d, key) => toFiniteNumber(getValueByDataKey(d, key)) ?? 0)
    .order(stackOrderNone)
    // @ts-expect-error definitelytyped types are incorrect
    .offset(offsetAccessor)

  return stack(data)
}

export type StackGroup = {
  readonly stackedData: ReadonlyArray<Series<unknown, DataKey<unknown>>>
  readonly graphicalItems: ReadonlyArray<MaybeStackedGraphicalItem>
}

export function combineStackGroups(
  displayedData: ChartData | undefined,
  items: ReadonlyArray<MaybeStackedGraphicalItem>,
  stackOffsetType: StackOffsetType,
): Record<StackId, StackGroup> {
  const initialItemsGroups: Record<StackId, Array<MaybeStackedGraphicalItem>> = Object.create(null)
  const itemsGroup: Record<StackId, ReadonlyArray<MaybeStackedGraphicalItem>> = items.reduce(
    (acc: Record<StackId, Array<MaybeStackedGraphicalItem>>, item: MaybeStackedGraphicalItem) => {
      if (item.stackId == null) {
        return acc
      }
      if (acc[item.stackId] == null) {
        acc[item.stackId] = []
      }
      acc[item.stackId].push(item)
      return acc
    },
    initialItemsGroups,
  )
  return Object.fromEntries(
    Object.entries(itemsGroup).map(([stackId, graphicalItems]): [StackId, StackGroup] => {
      const dataKeys = graphicalItems.map(i => i.dataKey!)
      return [
        stackId,
        {
          stackedData: getStackedData(displayedData ?? [], dataKeys, stackOffsetType),
          graphicalItems,
        },
      ]
    }),
  )
}

export function combineDomainOfStackGroups(
  stackGroups: Record<StackId, StackGroup> | undefined,
  { dataStartIndex, dataEndIndex }: ChartDataState,
  axisType: AxisType,
): NumberDomain | undefined {
  if (axisType === 'zAxis') {
    // ZAxis ignores stacks
    return undefined
  }
  const domainOfStackGroups = getDomainOfStackGroups(stackGroups, dataStartIndex, dataEndIndex)
  if (domainOfStackGroups != null && domainOfStackGroups[0] === 0 && domainOfStackGroups[1] === 0) {
    return undefined
  }
  return domainOfStackGroups
}
