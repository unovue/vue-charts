// Executed before hydration. DOM identities distinguish replacement charts on tab clicks.
export function installSeenRecorder() {
  const ids = new WeakMap()
  let next = 0
  const id = (node) => {
    if (!ids.has(node))
      ids.set(node, ++next)
    return ids.get(node)
  }
  let styles = new Map()
  const styleOf = (node) => {
    if (!styles.has(node))
      styles.set(node, getComputedStyle(node))
    return styles.get(node)
  }
  const attributes = ['d', 'x', 'y', 'x1', 'y1', 'x2', 'y2', 'width', 'height', 'cx', 'cy', 'r', 'rx', 'ry', 'points', 'transform', 'opacity', 'stroke-dasharray', 'stroke-dashoffset']
  let pointer = [-1, -1]
  document.addEventListener('pointermove', e => pointer = [e.clientX, e.clientY])
  const state = { frames: [], shots: {}, seen: {}, evidenceAt: {}, trigger: 'load', done: false }
  window.seenRecording = state
  window.seenReset = (trigger) => {
    state.frames = []
    state.shots = {}
    state.seen = {}
    state.evidenceAt = {}
    state.trigger = trigger
  }
  function visibility(node) {
    const box = node.getBoundingClientRect()
    const ratio = box.width * box.height ? Math.max(0, Math.min(innerWidth, box.right) - Math.max(0, box.left)) * Math.max(0, Math.min(innerHeight, box.bottom) - Math.max(0, box.top)) / (box.width * box.height) : 0
    let opacity = 1
    let blurred = false
    let hidden = false
    let blur = 0
    for (let p = node; p; p = p.parentElement) {
      const s = styleOf(p)
      opacity *= Number(s.opacity)
      hidden ||= s.display === 'none' || s.visibility === 'hidden'
      // A blur that has settled at 0px (a finished fade-in) no longer hides anything.
      const radius = Number.parseFloat(s.filter.match(/blur\(([^)]+)/)?.[1] ?? '0')
      blurred ||= radius > 0.3
      blur += radius
      if (s.scale && s.scale !== 'none')
        blurred ||= s.scale.split(' ').some(value => Math.abs(Number.parseFloat(value) / (value.endsWith('%') ? 100 : 1) - 1) > 0.01)
      if (s.transform !== 'none') {
        const matrix = new DOMMatrixReadOnly(s.transform)
        blurred ||= [[matrix.m11, matrix.m12, matrix.m13], [matrix.m21, matrix.m22, matrix.m23], [matrix.m31, matrix.m32, matrix.m33]].some(row => Math.abs(Math.hypot(...row) - 1) > 0.01)
      }
    }
    return { visibleRatio: hidden ? 0 : ratio, effectiveOpacity: opacity, blurred, blur, box: [box.x, box.y, box.width, box.height] }
  }
  function disabledNodes() {
    const nodes = new WeakSet()
    const visited = new Set()
    function walk(vnode, off = false) {
      if (!vnode || typeof vnode !== 'object' || visited.has(vnode))
        return
      visited.add(vnode)
      off ||= vnode.component?.props?.isAnimationActive === false || vnode.component?.props?.item?.isAnimationActive === false || vnode.props?.isAnimationActive === false || vnode.props?.['is-animation-active'] === false
      if (off && vnode.el?.nodeType === 1)
        nodes.add(vnode.el)
      walk(vnode.component?.subTree, off)
      walk(vnode.suspense?.activeBranch, off)
      walk(vnode.ssContent, off)
      if (Array.isArray(vnode.children))
        vnode.children.forEach(child => walk(child, off))
    }
    walk(document.getElementById('__nuxt')?._vnode)
    return nodes
  }
  function snapshot(wrapper, info, t) {
    const svg = wrapper.querySelector('svg.v-charts-surface')
    const clone = svg.cloneNode(true)
    const originals = [svg, ...svg.querySelectorAll('*')]
    const copies = [clone, ...clone.querySelectorAll('*')]
    for (let i = 0; i < originals.length; i++) {
      const style = styleOf(originals[i])
      for (const property of ['fill', 'stroke', 'stroke-width', 'stroke-dasharray', 'stroke-dashoffset', 'opacity', 'visibility', 'display', 'font-size', 'font-family', 'transform', 'transform-origin', 'color', 'filter'])
        copies[i].style.setProperty(property, style.getPropertyValue(property))
    }
    // HTML serialization can emit named HTML entities that are invalid in SVG XML.
    clone.removeAttribute('xmlns')
    clone.setAttribute('width', info.box[2])
    clone.setAttribute('height', info.box[3])
    return { t, svg: new XMLSerializer().serializeToString(clone), opacity: info.effectiveOpacity, blur: info.blur, box: info.box }
  }
  let lastShot = 0
  function sample() {
    const t = performance.now()
    styles = new Map()
    const exemptions = disabledNodes()
    const charts = [...document.querySelectorAll('.v-charts-wrapper')].filter(w => w.querySelector('svg.v-charts-surface')).map((wrapper) => {
      const key = id(wrapper)
      const info = visibility(wrapper)
      const svg = wrapper.querySelector('svg.v-charts-surface')
      const shapes = [...svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text,use,image')].filter((shape) => {
        const ignored = shape.closest('[class*="active-dot"],[class*="tooltip"],[class*="cursor"]')
        // Host utility classes can mention cursors/tooltips without being hover shapes.
        return !ignored || !svg.contains(ignored)
      })
      const geometry = shapes.map((shape) => {
        const values = Object.fromEntries(attributes.map(a => [a, shape.getAttribute(a)]))
        const style = styleOf(shape)
        values.opacity = style.opacity
        values['stroke-dasharray'] = style.strokeDasharray
        values['stroke-dashoffset'] = style.strokeDashoffset
        const ancestors = []
        for (let p = shape; p && p !== svg; p = p.parentElement)
          ancestors.push([p.getAttribute('transform'), styleOf(p).transform, styleOf(p).opacity, p.getAttribute('clip-path')])
        values.ancestors = JSON.stringify(ancestors)
        // Absent attributes are implicit nulls; avoid repeating them in every frame.
        for (const attr of attributes) {
          if (values[attr] === null)
            delete values[attr]
        }
        return { id: id(shape), values }
      })
      const seriesShapes = shapes.filter(shape => shape.closest('.v-charts-bar,.v-charts-line,.v-charts-area,.v-charts-pie,.v-charts-radar,.v-charts-radial-bar,.v-charts-funnel,.v-charts-sankey,.v-charts-treemap,.v-charts-sunburst,.v-charts-scatter'))
      const disabled = seriesShapes.length > 0 && seriesShapes.every((shape) => {
        for (let p = shape; p; p = p.parentElement) {
          if (exemptions.has(p) || p.getAttribute('data-animation') === 'false')
            return true
          for (let vm = p.__vueParentComponent; vm; vm = vm.parent) {
            if (vm.props?.isAnimationActive === false || vm.props?.item?.isAnimationActive === false)
              return true
          }
        }
        return false
      })
      const over = pointer[0] >= info.box[0] && pointer[0] <= info.box[0] + info.box[2] && pointer[1] >= info.box[1] && pointer[1] <= info.box[1] + info.box[3]
      const strayHover = !over && [...wrapper.querySelectorAll('.v-charts-active-dot,.v-charts-tooltip-wrapper')].some((el) => {
        const v = visibility(el)
        return v.visibleRatio > 0 && v.effectiveOpacity > 0 && v.box[2] > 0 && v.box[3] > 0
      })
      if (info.visibleRatio >= 0.5 && info.effectiveOpacity >= 0.95 && !info.blurred && !state.seen[key])
        state.seen[key] = t
      if (info.visibleRatio >= 0.5 && !state.evidenceAt[key])
        state.evidenceAt[key] = t
      if (t - lastShot >= 60) {
        const shots = state.shots[key] ??= []
        const anchor = state.seen[key] ?? state.evidenceAt[key]
        if (!anchor || t <= anchor + 1400) {
          shots.push(snapshot(wrapper, info, t))
          if (!anchor) {
            while (shots.length > 3)
              shots.shift()
          }
        }
      }
      return { id: key, name: wrapper.getAttribute('data-chart') ?? `chart-${key}`, ...info, geometry, disabled, pointerOver: over, strayHover }
    })
    state.frames.push({ t, trigger: state.trigger, scrollY, pointer: [...pointer], charts })
    if (t - lastShot >= 60)
      lastShot = t
    if (!state.done)
      requestAnimationFrame(sample)
  }
  requestAnimationFrame(sample)
}

const numeric = /[-+]?(?:\d*\.\d+|\d+)(?:e[-+]?\d+)?/gi
function signature(geometry) {
  return JSON.stringify(geometry).replace(numeric, v => String(Math.round(Number(v) * 1000) / 1000))
}
// Each attribute contributes its relative L1 distance, capped at one per shape: a shape that is
// not drawn yet is the farthest a shape can be from its final state.
function distance(geometry, final) {
  const current = new Map(geometry.map(s => [s.id, s.values]))
  const target = new Map(final.map(s => [s.id, s.values]))
  let sum = 0
  // Only the final chart's shapes count; shapes on their way out are not part of the entrance.
  for (const [key, b] of target) {
    const a = current.get(key)
    if (!a) {
      sum++
      continue
    }
    let shape = 0
    for (const attr of new Set([...Object.keys(a), ...Object.keys(b)])) {
      if (a[attr] === b[attr])
        continue
      const x = String(a[attr] ?? '').match(numeric)?.map(Number) ?? []
      const y = String(b[attr] ?? '').match(numeric)?.map(Number) ?? []
      if (!x.length || x.length !== y.length) {
        shape++
        continue
      }
      shape += x.reduce((n, v, i) => n + Math.abs(v - y[i]), 0) / Math.max(1, x.reduce((n, v) => n + Math.abs(v), 0), y.reduce((n, v) => n + Math.abs(v), 0))
    }
    sum += Math.min(1, shape)
  }
  return sum
}

export function analyzeSeen(frames, meta) {
  const entries = new Map()
  for (const frame of frames) {
    for (const chart of frame.charts) {
      if (!entries.has(chart.id))
        entries.set(chart.id, [])
      entries.get(chart.id).push({ ...chart, t: frame.t, scrollY: frame.scrollY })
    }
  }
  const maximumGapMs = Math.max(0, ...frames.slice(1).map((f, i) => f.t - frames[i].t))
  return [...entries].map(([id, samples]) => {
    const seenIndex = samples.findIndex(s => s.visibleRatio >= 0.5 && s.effectiveOpacity >= 0.95 && !s.blurred)
    const changes = samples.map((s, i) => i && signature(s.geometry) !== signature(samples[i - 1].geometry) ? i : -1).filter(i => i >= 0)
    // The entrance is the longest run of changing frames (gaps up to 120 ms); one-frame layout
    // changes at mount, while the chart is still off screen or hidden, are not part of it.
    const runs = []
    for (const index of changes) {
      const run = runs.at(-1)
      if (run && samples[index].t - samples[run.end].t <= 120)
        run.end = index
      else
        runs.push({ start: index, end: index })
    }
    const entrance = runs.reduce((best, run) => !best || samples[run.end].t - samples[run.start].t > samples[best.end].t - samples[best.start].t ? run : best, null)
    const startIndex = entrance?.start
    const seenAt = seenIndex < 0 ? null : samples[seenIndex].t
    const motionStart = entrance ? samples[entrance.start].t : null
    const motionEnd = entrance ? samples[entrance.end].t : null
    const final = samples.at(-1).geometry
    const initialDistance = startIndex === undefined ? 0 : distance(samples[startIndex - 1].geometry, final)
    // Share of the entrance's time that had passed when the chart was first properly visible.
    const progressAtSeen = seenAt === null ? null : motionEnd === motionStart ? 1 : Math.min(1, Math.max(0, (seenAt - motionStart) / (motionEnd - motionStart)))
    const geometryProgressAtSeen = seenAt === null || !initialDistance ? null : 1 - distance(samples[seenIndex].geometry, final) / initialDistance
    const seenMotionMs = seenAt === null || motionEnd === null ? 0 : Math.max(0, motionEnd - seenAt)
    const nearSeenGapMs = Math.max(0, ...frames.slice(1).map((f, i) => seenAt !== null && f.t >= seenAt - 100 && frames[i].t <= seenAt + 1200 ? f.t - frames[i].t : 0))
    const flags = []
    const disabled = samples.every(s => s.disabled)
    const firstHalfVisible = samples.find(s => s.visibleRatio >= 0.5) ?? samples[0]
    // A chart with animation off, or one that only re-lays out for a frame or two at mount, has no
    // entrance to miss.
    const animated = entrance && samples[entrance.end].t - samples[entrance.start].t >= 100
    if (!disabled && animated && (seenAt === null || progressAtSeen > 0.15 || seenMotionMs < 400))
      flags.push('unseen-entrance')
    if (!disabled && !changes.length)
      flags.push('no-entrance')
    if (seenAt !== null && motionStart !== null && motionStart - seenAt > 250)
      flags.push('late-start')
    // A tooltip shown on purpose (defaultIndex) stays; a hover mark that flashes up without the
    // pointer and goes again is the defect.
    // Judged only while the chart is on screen: a kept tooltip scrolled away is not "gone".
    const onScreen = samples.filter(s => s.visibleRatio >= 0.5)
    const firstStray = onScreen.findIndex(s => s.strayHover)
    if (firstStray >= 0 && onScreen.slice(firstStray).some(s => !s.strayHover))
      flags.push('stray-hover')
    return { ...meta, chart: samples[0].name, id, trigger: meta.trigger ?? (firstHalfVisible.scrollY === 0 ? 'load' : 'scroll-into-view'), seenAt, motionStart, motionEnd, progressAtSeen, geometryProgressAtSeen, seenMotionMs, startDelayMs: seenAt !== null && motionStart !== null ? motionStart - seenAt : null, strayHoverFrames: samples.filter(s => s.strayHover).length, strayHoverAt: samples.find(s => s.strayHover)?.t ?? null, initialDistance, disabled, maximumGapMs, nearSeenGapMs, reliability: nearSeenGapMs > 50 ? 'unreliable' : 'reliable', flags }
  })
}
