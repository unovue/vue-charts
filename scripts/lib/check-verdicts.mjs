export function emptySurface(surface) {
  return surface.width <= 0 || surface.height <= 0 || surface.shapes === 0
}

// Firefox drops a `rel="prefetch"` hint, which it reports as type `other`, when the page needs that file
// for real. A script, stylesheet or fetch that aborts is still a failure.
export function droppedPrefetch(errorText, resourceType) {
  return errorText === 'NS_BINDING_ABORTED' && resourceType === 'other'
}

export function seenVerdict(rows, recordings, errors) {
  if (errors.length || !recordings.length || !rows.length
    || rows.some(row => row.reliability !== 'unreliable' && row.flags.length)) {
    return 'FAIL'
  }
  return rows.some(row => row.reliability === 'unreliable') ? 'INCONCLUSIVE' : 'PASS'
}
