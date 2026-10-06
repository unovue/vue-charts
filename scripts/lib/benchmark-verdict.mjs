function median(values) {
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2
}

export function compareSamples(baseline, current, sameBuild = false) {
  if (!baseline.length || baseline.length !== current.length
    || [...baseline, ...current].some(value => !Number.isFinite(value) || value <= 0)) {
    throw new Error('Expected paired positive benchmark samples')
  }
  const A = median(baseline)
  const B = median(current)
  // Resample paired rounds to keep shared machine load together. A 95% interval crossing
  // either unchanged gate boundary cannot establish a reliable pass or regression.
  let seed = 1
  const ratios = Array.from({ length: 2000 }, () => {
    const indices = baseline.map(() => {
      seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0
      return seed % baseline.length
    })
    return median(indices.map(i => current[i])) / median(indices.map(i => baseline[i]))
  }).sort((a, b) => a - b)
  const interval = [ratios[50], ratios[1949]]
  const [low, high] = interval
  const verdict = low > 1.1 || (sameBuild && high < 0.9)
    ? 'FAIL'
    : high <= 1.1 && (!sameBuild || low >= 0.9) ? 'PASS' : 'INCONCLUSIVE'
  return { A, B, ratio: B / A, interval, verdict, passed: verdict === 'PASS' }
}
