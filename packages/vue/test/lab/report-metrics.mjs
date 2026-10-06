// Geometry flags shared by the report and its regression checks.
const nums = s => (String(s).match(/-?\d*\.?\d+(?:e[-+]?\d+)?/gi) || []).map(Number)

// Normalised progress per element: the coordinate that moves most, from its first to last value.
export function curves(frames) {
  const ids = [...new Set(frames.flatMap(f => Object.keys(f.shapes)))]
  const result = []
  for (const id of ids) {
    // Arc endpoints move along circles, so a coordinate is not a progress measure; sectors are
    // judged by video.
    // Rounded bars keep x/y/width/height, which are measured instead of their path.
    const arcs = frames.some(f => /A\s*[\d.]/.test(f.shapes[id] ?? ''))
    const value = shape => arcs ? shape.split('|').slice(1).join('|') : shape
    if (arcs && !frames.some(f => f.shapes[id] && nums(value(f.shapes[id])).length))
      continue
    const series = frames.map(f => f.shapes[id] == null ? null : nums(value(f.shapes[id])))
    const present = series.map((v, i) => [v, i]).filter(([v]) => v)
    if (present.length < 3)
      continue
    const [first, i0] = present[0]
    const [last] = present.at(-1)
    if (first.length !== last.length)
      continue
    let k = -1
    let span = 0
    first.forEach((v, j) => {
      const d = Math.abs(last[j] - v)
      if (d > span) {
        span = d
        k = j
      }
    })
    if (span < 2)
      continue
    const pts = present.filter(([v]) => v.length === first.length).map(([v, i]) => [frames[i].t, (v[k] - first[k]) / (last[k] - first[k])])
    result.push({ id, span, appearsAt: i0 ? frames[i0].t : 0, pts })
  }
  return result
}

// A rect folded to under 2 px (width or height) is not visible, so moving it is not a visible jump:
// cells that fold away and unfold one column over (a calendar's first weekday) do exactly that. The
// sampler marks shapes fading through under 35 % opacity as `~faint`; those are not seen either.
function hidden(frames, id, t) {
  const shape = String(frames.find(f => f.t === t)?.shapes[id] ?? '')
  const parts = shape.split('|')
  const [width, height] = [Number(parts[3]), Number(parts[4])]
  return shape.endsWith('|~faint') || (parts[3] !== '' && parts[4] !== '' && (Math.abs(width) < 2 || Math.abs(height) < 2))
}

export function flags(curveList, frames, target) {
  const issues = []
  for (const c of curveList) {
    for (let i = 1; i < c.pts.length; i++) {
      const [t, p] = c.pts[i]
      const [tPrev, prev] = c.pts[i - 1]
      if (c.id !== 'tooltip' && p - prev < -0.04 && prev < 1.02)
        issues.push(`backwards ${c.id} @${Math.round(t)}ms ${prev.toFixed(2)}→${p.toFixed(2)}`)
      if (i > 1 && p - prev > 0.3 && c.span * (p - prev) > 6 && !(hidden(frames, c.id, tPrev) && hidden(frames, c.id, t)))
        issues.push(`jump ${c.id} @${Math.round(t)}ms +${((p - prev) * 100).toFixed(0)}% (${(c.span * (p - prev)).toFixed(0)}px)`)
    }
    // A stall: progress stuck mid-way for 3+ frames.
    let still = 0
    for (let i = 1; i < c.pts.length; i++) {
      const p = c.pts[i][1]
      still = Math.abs(p - c.pts[i - 1][1]) < 0.002 && p > 0.1 && p < 0.9 ? still + 1 : 0
      if (still === 3)
        issues.push(`stall ${c.id} @${Math.round(c.pts[i][0])}ms at ${(p * 100).toFixed(0)}%`)
    }
  }
  // The recording endpoint is not the target: compare with an independent static control.
  if (target) {
    const last = frames.at(-1)?.shapes ?? {}
    for (const id of new Set([...Object.keys(last), ...Object.keys(target)])) {
      const actual = nums(last[id] ?? '')
      const expected = nums(target[id] ?? '')
      if (actual.length !== expected.length
        || expected.some((value, i) => Math.abs(value - actual[i]) > 0.01)) {
        issues.push(`unsettled ${id}`)
      }
    }
  }
  // A synchronous height snap happens before the first animation frame.
  for (const [id, shape] of Object.entries(frames[0]?.before ?? {})) {
    if (!id.startsWith('ul.v-charts-bar-list#'))
      continue
    const before = nums(shape)[0]
    const after = nums(frames[0].shapes[id])[0]
    if (Math.abs(after - before) > 6)
      issues.push(`height jump ${id} @0ms ${before}→${after}px`)
  }
  // Bars that cover each other mid-transition although neither layout overlaps.
  if (frames.length && !frames[0].overlap && !frames.at(-1).overlap) {
    const worst = frames.reduce((a, f) => f.overlap > a.overlap ? f : a, frames[0])
    if (worst.overlap > 4)
      issues.push(`overlap bars @${Math.round(worst.t)}ms ${Math.round(worst.overlap)}px²`)
  }
  const intervals = frames.slice(1).map((f, i) => f.t - frames[i].t)
  return { issues, intervals }
}

function identity(scenario, issue) {
  const [kind, element] = issue.split(' ')
  return { scenario, kind, element }
}

/** Gate only recorded scenarios, so focused runs can use the same acceptance file. */
export function checkReport(report, accepted, strictTiming = false) {
  const same = (a, b) => a.scenario === b.scenario && a.kind === b.kind && a.element === b.element
  const observed = report.flatMap(r =>
    r.issues.map(issue => identity(`${r.scenario} ${r.step}`, issue)))
  const recorded = new Set(report.map(r => `${r.scenario} ${r.step}`))
  const stale = accepted.filter(entry =>
    recorded.has(entry.scenario) && !observed.some(flag => same(flag, entry)))
  const failed = report.flatMap((r) => {
    const failures = r.issues.filter(issue =>
      !accepted.some(entry => same(identity(`${r.scenario} ${r.step}`, issue), entry)))
    failures.push(...r.errors)
    if (strictTiming && (r.timing['1x']?.slow ?? 0) > 2)
      failures.push(`${r.timing['1x'].slow} slow frames`)
    return failures.length ? [{ ...r, failures }] : []
  })
  return { failed, stale }
}
