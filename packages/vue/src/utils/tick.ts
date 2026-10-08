import type { CartesianViewBoxRequired } from '@/types/viewBox'
import type { Size } from '@/types'
import type { CartesianTickItem } from '@/types/tick'
import { getAngledRectangleWidth } from '@/core/rectangle'

export function getNumberIntervalTicks(
  ticks: ReadonlyArray<CartesianTickItem>,
  interval: number,
): ReadonlyArray<CartesianTickItem> | undefined {
  return getEveryNthWithCondition(ticks, interval + 1)
}

/**
 * Given an array and a number N, return a new array which contains every nTh
 * element of the input array. For n below 1, an empty array is returned.
 * If isValid is provided, all candidates must suffice the condition, else undefined is returned.
 * @param {T[]} array An input array.
 * @param {integer} n A number
 * @param {Function} isValid A function to evaluate a candidate form the array
 * @returns {T[]} The result array of the same type as the input array.
 */
export function getEveryNthWithCondition<Type>(
  array: ReadonlyArray<Type>,
  n: number,
  isValid?: (candidate: Type) => boolean,
): ReadonlyArray<Type> | undefined {
  if (n < 1) {
    return []
  }
  if (n === 1 && isValid === undefined) {
    return array
  }
  const result: Type[] = []
  for (let i = 0; i < array.length; i += n) {
    if (isValid === undefined || isValid(array[i]) === true) {
      result.push(array[i])
    }
    else {
      return undefined
    }
  }
  return result
}

export function getAngledTickWidth(contentSize: Size, unitSize: Size, angle: number) {
  const size = { width: contentSize.width + unitSize.width, height: contentSize.height + unitSize.height }

  return getAngledRectangleWidth(size, angle)
}

export function getTickBoundaries(viewBox: CartesianViewBoxRequired, sign: number, sizeKey: string) {
  const isWidth = sizeKey === 'width'
  const { x, y, width, height } = viewBox
  if (sign === 1) {
    return {
      start: isWidth ? x : y,
      end: isWidth ? x + width : y + height,
    }
  }
  return {
    start: isWidth ? x + width : y + height,
    end: isWidth ? x : y,
  }
}
