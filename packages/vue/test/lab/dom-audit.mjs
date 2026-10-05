// Lists invalid attributes on rendered chart DOM per scenario: chart data written as attributes
// ([object …], undefined, NaN) and React-style names SVG ignores (strokeWidth). Exits 1 on any.
// pnpm motion:audit [scenario...] [--browser=…]
/* eslint-disable no-console -- command-line output is the interface of these tools */
import { launchBrowser, positional, startServer } from './shared.mjs'

const all = ['bar', 'barStacked', 'barHorizontal', 'line', 'area', 'areaStacked', 'composed', 'scatter', 'pie', 'donut', 'radar', 'radial', 'funnel', 'treemap', 'sankey', 'sunburst', 'tooltip']
const browser = await launchBrowser()
let server
try {
  server = await startServer()
  const page = await browser.newPage({ viewport: { width: 800, height: 440 } })
  // Valid mixed-case SVG attributes.
  const camelOk = new Set(['viewBox', 'preserveAspectRatio', 'gradientUnits', 'gradientTransform', 'patternUnits', 'patternContentUnits', 'patternTransform', 'clipPathUnits', 'markerWidth', 'markerHeight', 'markerUnits', 'refX', 'refY', 'textLength', 'lengthAdjust', 'startOffset', 'spreadMethod', 'stdDeviation', 'baseFrequency', 'numOctaves', 'tableValues', 'kernelMatrix', 'pathLength', 'maskUnits', 'maskContentUnits', 'filterUnits', 'primitiveUnits', 'xChannelSelector', 'yChannelSelector', 'stitchTiles', 'surfaceScale', 'specularExponent', 'specularConstant', 'diffuseConstant', 'pointsAtX', 'pointsAtY', 'pointsAtZ', 'limitingConeAngle', 'edgeMode', 'kernelUnitLength', 'targetX', 'targetY', 'repeatCount', 'repeatDur', 'calcMode', 'keyTimes', 'keySplines', 'keyPoints', 'attributeName', 'attributeType', 'zoomAndPan', 'systemLanguage', 'requiredExtensions', 'tabIndex'])
  let total = 0
  for (const s of positional().length ? positional() : all) {
    await page.goto(`${server.url}?s=${s}`, { timeout: 120000 })
    await page.waitForSelector('svg.v-charts-surface', { timeout: 120000 })
    await page.waitForTimeout(1300)
    if (s === 'tooltip') {
      const box = await page.locator('.v-charts-wrapper').boundingBox()
      await page.mouse.move(box.x + 200, box.y + 150)
      await page.waitForTimeout(600)
    }
    const found = await page.evaluate((camelOk) => {
      const ok = new Set(camelOk)
      const out = {}
      for (const el of document.querySelectorAll('.v-charts-wrapper *')) {
        for (const a of el.attributes) {
          const bad = /\[object |^undefined$|^NaN$|^null$|^function/.test(a.value) ? 'value' : (/[A-Z]/.test(a.name) && !ok.has(a.name)) ? 'camelCase' : null
          if (bad) {
            const k = `${el.tagName}.${(el.getAttribute('class') || '').split(' ')[0]} ${a.name}=${a.value.slice(0, 24)}`
            out[k] = (out[k] ?? 0) + 1
          }
        }
      }
      return out
    }, [...camelOk])
    const entries = Object.entries(found)
    total += entries.length
    console.log(`== ${s}: ${entries.length} distinct`)
    for (const [k, n] of entries.slice(0, 40)) console.log(`   ${String(n).padStart(4)}× ${k}`)
  }
  if (total)
    process.exitCode = 1
}
finally {
  await browser.close()
  await server?.close()
}
