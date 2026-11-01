export function emptySurface(surface) {
  return surface.width <= 0 || surface.height <= 0 || surface.shapes === 0
}

// Firefox drops a `rel="prefetch"` hint when the page needs that file for real. Only a URL the page
// lists as a prefetch is forgiven, because Playwright's request type `other` covers more than prefetches.
export function droppedPrefetch(errorText, url, prefetchedUrls) {
  return errorText === 'NS_BINDING_ABORTED' && prefetchedUrls.includes(url)
}

export function seenVerdict(rows, recordings, errors) {
  if (errors.length || !recordings.length || !rows.length
    || rows.some(row => row.reliability !== 'unreliable' && row.flags.length)) {
    return 'FAIL'
  }
  return rows.some(row => row.reliability === 'unreliable') ? 'INCONCLUSIVE' : 'PASS'
}
