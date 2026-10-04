// Records a page expression on every animation frame on the real clock (WAAPI fades, springs).
// pnpm motion:probe <scenario> <step|-> <expression> [ms=1000]
/* eslint-disable no-console -- command-line output is the interface of these tools */
import { launchBrowser, positional, startServer } from './shared.mjs'

const [scenario, step, expr, ms = '1000'] = positional()
const server = await startServer()
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 800, height: 480 } })
page.on('pageerror', e => console.log('pageerror', e.message)); page.on('console', (m) => {
  if (m.type() === 'error' || m.type() === 'warning')
    console.log(m.type(), m.text().slice(0, 400))
})
await page.goto(`${server.url}?s=${scenario}`)
await page.waitForSelector('svg.v-charts-surface')
await page.waitForTimeout(step === '-' ? 0 : 1500)
const rows = await page.evaluate(async ({ step, expr, ms }) => {
  // The expression comes from the command line of a local debugging tool.
  // eslint-disable-next-line no-new-func
  const f = new Function(`return (${expr})`)
  const out = []
  const t0 = performance.now()
  if (step !== '-')
    window.lab.step(step)
  await new Promise((resolve) => {
    const tick = () => {
      let v
      try { v = f() }
      catch (e) { v = `ERR ${e.message}` }
      out.push([Math.round(performance.now() - t0), v])
      if (performance.now() - t0 < ms)
        requestAnimationFrame(tick)
      else resolve()
    }
    tick()
  })
  return out
}, { step, expr, ms: Number(ms) })
let last
for (const [t, v] of rows) {
  const s = JSON.stringify(v)
  if (s !== last)
    console.log(String(t).padStart(5), s)
  last = s
}
await browser.close()
await server.close()
