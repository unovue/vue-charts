export function range(begin: number, end: number) {
  const values = []
  for (let value = begin; value < end; value++) {
    values.push(value)
  }
  return values
}

export function memoize<Args extends unknown[], Result>(fn: (...args: Args) => Result) {
  let lastArgs: Args | undefined
  let lastResult: Result
  return (...args: Args): Result => {
    if (lastArgs && args.every((value, index) => value === lastArgs?.[index])) {
      return lastResult
    }
    lastArgs = args
    lastResult = fn(...args)
    return lastResult
  }
}
