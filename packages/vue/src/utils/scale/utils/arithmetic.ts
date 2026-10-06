import Decimal from 'decimal.js-light'

/**
 * 获取数值的位数
 * 其中绝对值属于区间[0.1, 1)， 得到的值为0
 * 绝对值属于区间[0.01, 0.1)，得到的位数为 -1
 * 绝对值属于区间[0.001, 0.01)，得到的位数为 -2
 *
 * @param  {number} value 数值
 * @return {Integer} 位数
 */
function getDigitCount(value: number) {
  let result

  if (value === 0) {
    result = 1
  }
  else {
    result = Math.floor(new Decimal(value).abs().log(10).toNumber()) + 1
  }

  return result
}

/**
 * 按照固定的步长获取[start, end)这个区间的数据
 * 并且需要处理js计算精度的问题
 *
 * @param  {Decimal} start 起点
 * @param  {Decimal} end   终点，不包含该值
 * @param  {Decimal} step  步长
 * @return {Array}         若干数值
 */
function rangeStep(start: Decimal, end: Decimal, step: Decimal) {
  let num = new Decimal(start)
  let i = 0
  const result = []

  // magic number to prevent infinite loop
  while (num.lt(end) && i < 100000) {
    result.push(num.toNumber())

    num = num.add(step)
    i++
  }

  return result
}

export { rangeStep, getDigitCount }
