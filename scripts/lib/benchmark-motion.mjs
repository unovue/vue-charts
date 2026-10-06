export function animatedGeometry(kind, before) {
  let middle
  return {
    sample(value) {
      if (!middle && value && value !== before)
        middle = value
    },
    validate(immediate, final) {
      if (!before || !middle || !final || middle === final || immediate === final)
        throw new Error(`${kind}: changed-data update snapped or produced no intermediate motion`)
      return { before, immediate, middle, final }
    },
  }
}
