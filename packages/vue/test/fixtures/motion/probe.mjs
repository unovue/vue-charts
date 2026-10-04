import { nextTick } from 'vue'

const selectors = {
  bar: ['.v-charts-bar-rectangle'],
  line: ['.v-charts-line-dot'],
  area: ['.v-charts-area-dot'],
  pie: ['.v-charts-pie > g'],
  radar: ['.v-charts-radar-dots circle'],
  radial: ['.v-charts-radial-bar > path'],
  funnel: ['.v-charts-funnel > g:has(.v-charts-trapezoid)'],
  treemap: ['.v-charts-treemap-node'],
  sankey: ['.v-charts-sankey-node', '.v-charts-sankey-link'],
  hover: ['.v-charts-line-dot'],
}

function vnodeKey(element) {
  if (element.__vnode?.key != null)
    return String(element.__vnode.key)
  // The keyed SVG wrapper is a DOM ancestor, not the Dot component's owner.
  for (let parent = element.parentElement; parent; parent = parent.parentElement) {
    if (parent.__vnode?.key != null)
      return String(parent.__vnode.key)
  }
  let owner = element.__vueParentComponent
  while (owner) {
    if (owner.vnode.key != null)
      return String(owner.vnode.key)
    owner = owner.parent
  }
  throw new Error(`No observable VNode key: ${element.outerHTML.slice(0, 200)}`)
}

function entries(kind) {
  return selectors[kind].flatMap((selector, group) => {
    const series = [...document.querySelectorAll(`.v-charts-${kind === 'hover' ? 'line' : kind}`)]
    return [...document.querySelectorAll(selector)].map((element) => {
      const parent = element.closest(`.v-charts-${kind === 'hover' ? 'line' : kind}`)
      const rawKey = vnodeKey(element)
      const dataKey = kind === 'treemap' ? rawKey.replace(/^root\//, '') : kind === 'sankey' ? rawKey.replace(/^(node|link):/, '') : rawKey
      return { id: `${group}:${series.indexOf(parent)}:${rawKey}`, dataKey, element }
    })
  })
}

function geometry(element) {
  return [element, ...element.querySelectorAll('path,rect,circle')].map(node =>
    ['d', 'x', 'y', 'width', 'height', 'cx', 'cy'].map(attr => node.getAttribute(attr)).join('|'),
  ).join(';')
}

function pathSample(kind, elapsedMs) {
  const paths = [...document.querySelectorAll(`.v-charts-${kind}-curve, .v-charts-area-area`)]
  if (!paths.length)
    throw new Error('No paths to sample')
  return { elapsedMs, paths: paths.map((path) => {
    const d = path.getAttribute('d') || ''
    // The fixture uses linear paths: command endpoints are the actual data points.
    // A filled area traverses its upper edge forwards and its baseline backwards.
    const commands = [...d.matchAll(/([ML])([^MLZ]+)/g)]
    const xs = commands.map(([, , coordinates]) => Number(coordinates.trim().split(/[ ,]+/)[0]))
    const filled = path.classList.contains('v-charts-area-area')
    const pointCount = path.closest('.v-charts-area')?.querySelectorAll('.v-charts-area-dot').length
    const upper = filled ? xs.slice(0, pointCount) : xs
    const lower = filled ? xs.slice(pointCount) : []
    const ordered = (values, direction) => values.length >= 2 && values.every((x, i) => Number.isFinite(x) && (!i || direction * (x - values[i - 1]) >= -0.001))
    const valid = !/[^MLZ\d\s.,e+\-]/i.test(d) && ordered(upper, 1) && (!filled || ordered(lower, -1))
    return { class: path.getAttribute('class'), d, upperX: upper, lowerX: lower, valid }
  }) }
}

async function runMotionScenario() {
  const { kind, change, keys } = window.motionFixture
  const beforeKeys = keys()
  const before = entries(kind)
  const expectedBefore = kind === 'sankey' ? beforeKeys.length * 2 + 1 : beforeKeys.length * (kind === 'area' ? 2 : 1)
  if (before.length !== expectedBefore || new Set(before.map(item => item.id)).size !== before.length)
    throw new Error(`Invalid identity coverage: ${before.length} elements; expected ${expectedBefore}; keys ${before.map(item => item.id).join(',')}`)
  const marker = Symbol('motion identity')
  before.forEach((item, i) => { item.element[marker] = i })
  const initialGeometry = before.map(item => geometry(item.element))
  const initialPaths = [...document.querySelectorAll('.v-charts-line-curve,.v-charts-area-curve')].map(path => path.getAttribute('d'))
  const frames = []
  const samples = []
  let measuredFrames = 0
  const transitionStates = new Set()
  const recreated = new Set()
  let kept
  let start
  let last
  let changedGeometryFrames = 0
  let afterKeys
  const result = await new Promise((resolve, reject) => {
    requestAnimationFrame((time) => {
      start = last = time
      change()
      afterKeys = keys()
      const retained = new Set(afterKeys)
      if (kind === 'sankey') {
        retained.add('sink')
        afterKeys.forEach(key => retained.add(`${key}→sink`))
      }
      kept = before.filter(item => retained.has(item.dataKey))
      function tick(now) {
        try {
          const elapsed = now - start
          // Count frames inside the window, but include a crossing interval in the worst-frame check.
          if (elapsed <= 800.01)
            measuredFrames++
          frames.push(now - last)
          last = now
          const current = new Map(entries(kind).map(item => [item.id, item.element]))
          if (kept[0]?.element.isConnected)
            transitionStates.add(geometry(kept[0].element))
          for (const item of kept) {
            const element = current.get(item.id)
            if (element !== item.element || element?.[marker] !== item.element[marker])
              recreated.add(item.id)
          }
          if (before.some((item, i) => item.element.isConnected && geometry(item.element) !== initialGeometry[i]))
            changedGeometryFrames++
          if (['line', 'area'].includes(kind) && samples.length < 3 && elapsed >= [80, 160, 240][samples.length])
            samples.push(pathSample(kind, elapsed))
          if (elapsed < 800)
            requestAnimationFrame(tick)
          else resolve({ elapsedMs: elapsed })
        }
        catch (error) { reject(error) }
      }
      requestAnimationFrame(tick)
    })
  })
  await nextTick()
  const after = entries(kind)
  const expectedAfter = kind === 'sankey' ? afterKeys.length * 2 + 1 : afterKeys.length * (kind === 'area' ? 2 : 1)
  const failures = []
  const slowFrames = frames.filter(ms => ms > 34)
  if (measuredFrames < 42)
    failures.push(`Only ${measuredFrames} frames (minimum 42)`)
  if (slowFrames.length > 1 || Math.max(...frames) > 50)
    failures.push(`Frame budget exceeded: ${slowFrames.length} over 34ms, worst ${Math.max(...frames).toFixed(2)}ms`)
  if (!kept.length || recreated.size)
    failures.push(`Recreated ${recreated.size}/${kept.length} kept elements`)
  if (after.length !== expectedAfter)
    failures.push(`After coverage ${after.length}, expected ${expectedAfter}`)
  if (!changedGeometryFrames || transitionStates.size < 3)
    failures.push(`Insufficient animated geometry states: ${transitionStates.size}`)
  const orderChanged = before.map(item => item.id).join('|') !== after.map(item => item.id).join('|')
  if (kind === 'treemap' && !orderChanged)
    failures.push('Treemap did not re-sort its layout')
  if (['line', 'area'].includes(kind)) {
    if (samples.length !== 3 || samples.some(sample => sample.paths.some(path => !path.valid)))
      failures.push('Non-monotonic or missing mid-transition path sample')
    if (samples.every(sample => sample.paths.filter(path => path.class.includes('-curve')).every((path, i) => path.d === initialPaths[i])))
      failures.push('Path samples did not change')
  }
  return { ...result, beforeKeys, afterKeys, frames: measuredFrames, frameIntervalsMs: frames, worstFrameMs: Math.max(...frames), slowFrames: slowFrames.length, keptElements: kept.length, recreatedElements: recreated.size, recreatedKeys: [...recreated], beforeElements: before.length, afterElements: after.length, changedGeometryFrames, transitionStates: transitionStates.size, orderChanged, samples, failures }
}

async function runHoverSweep() {
  const wrapper = document.querySelector('.v-charts-wrapper')
  const tooltip = document.querySelector('[role="tooltip"]')
  if (!wrapper || !tooltip)
    throw new Error('Missing hover surface or tooltip')
  const box = wrapper.getBoundingClientRect()
  const move = x => wrapper.dispatchEvent(new MouseEvent('mousemove', { bubbles: true, clientX: box.left + x, clientY: box.top + 180 }))
  move(150)
  await new Promise(resolve => setTimeout(resolve, 400))
  const springs = [...window.motionSprings]
  const reads = { tooltipRect: 0, tooltipWidth: 0, allRect: 0, allWidth: 0 }
  const rect = Element.prototype.getBoundingClientRect
  const width = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetWidth')
  Element.prototype.getBoundingClientRect = function (...args) {
    reads.allRect++
    if (this === tooltip || tooltip.contains(this))
      reads.tooltipRect++
    return rect.apply(this, args)
  }
  Object.defineProperty(HTMLElement.prototype, 'offsetWidth', { ...width, get() {
    reads.allWidth++
    if (this === tooltip || tooltip.contains(this))
      reads.tooltipWidth++
    return width.get.call(this)
  } })
  const positions = new Set()
  const frames = []
  let maxRunningScalarSprings = 0
  let moves = 0
  let measuredFrames = 0
  try {
    await new Promise((resolve) => {
      requestAnimationFrame((start) => {
        let last = start
        function tick(now) {
          const elapsed = now - start
          if (elapsed <= 800.01)
            measuredFrames++
          frames.push(now - last)
          last = now
          move(100 + (moves % 35) * 22)
          moves++
          positions.add(tooltip.style.transform)
          maxRunningScalarSprings = Math.max(maxRunningScalarSprings, window.motionSprings.filter(value => value.isAnimating()).length)
          if (elapsed < 800)
            requestAnimationFrame(tick)
          else resolve()
        }
        requestAnimationFrame(tick)
      })
    })
  }
  finally {
    Element.prototype.getBoundingClientRect = rect
    Object.defineProperty(HTMLElement.prototype, 'offsetWidth', width)
  }
  const failures = []
  if (measuredFrames < 42 || frames.filter(ms => ms > 34).length > 1 || Math.max(...frames) > 50)
    failures.push('Hover frame budget exceeded')
  // The tooltip must never read layout while following the pointer. Turning pointer coordinates
  // into chart coordinates reads the wrapper box once per event, as d3-pointer does.
  if (reads.tooltipRect || reads.tooltipWidth)
    failures.push(`Tooltip layout reads during hover sweep: ${reads.tooltipRect} rect, ${reads.tooltipWidth} width`)
  if (reads.allRect > moves || reads.allWidth > moves)
    failures.push(`More than one layout read per pointer move: ${reads.allRect} rect, ${reads.allWidth} width over ${moves} moves`)
  if (springs.length !== 2 || window.motionSprings.length !== springs.length || springs.some((value, i) => value !== window.motionSprings[i]))
    failures.push('Position springs were missing or recreated')
  // One persistent spring per axis (x, y); retargeting must not add more.
  if (maxRunningScalarSprings < 1 || maxRunningScalarSprings > 2)
    failures.push(`Expected the x/y position springs to run; ${maxRunningScalarSprings} scalar springs running`)
  if (positions.size < 10 || tooltip.style.visibility !== 'visible')
    failures.push('Tooltip did not visibly move')
  return { frames: measuredFrames, frameIntervalsMs: frames, worstFrameMs: Math.max(...frames), moves, positions: positions.size, reads, scalarSpringsCreated: window.motionSprings.length, maxRunningScalarSprings, failures }
}

export function installMotionProbe() {
  window.runMotionScenario = runMotionScenario
  window.runHoverSweep = runHoverSweep
}
