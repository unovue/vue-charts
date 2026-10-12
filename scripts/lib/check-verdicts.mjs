export function emptySurface(surface) {
  return surface.width <= 0 || surface.height <= 0 || surface.shapes === 0
}

export function seenVerdict(rows, recordings, errors) {
  if (errors.length || !recordings.length || !rows.length
    || rows.some(row => row.reliability !== 'unreliable' && row.flags.length)) {
    return 'FAIL'
  }
  return rows.some(row => row.reliability === 'unreliable') ? 'INCONCLUSIVE' : 'PASS'
}
