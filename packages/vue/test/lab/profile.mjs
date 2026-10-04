// CPU profile of one lab step, printing the top self-time functions. Production build by default.
// pnpm motion:profile <scenario> <step> [backStep] [cpuSlowdown=4]
/* eslint-disable no-console -- command-line output is the interface of these tools */
import { launchBrowser, positional, startServer } from './shared.mjs'

process.env.LAB_PROD ??= '1'
const [scenario, step, back, rate = '4'] = positional()
const server = await startServer()
const browser = await launchBrowser()
const page = await browser.newPage({ viewport: { width: 800, height: 440 } })
await page.goto(`${server.url}?s=${scenario}`)
await page.waitForSelector('svg.v-charts-surface')
await page.waitForTimeout(1500)
if (back) {
  await page.evaluate(n => window.lab.step(n), back)
  await page.waitForTimeout(1000)
}
const cdp = await page.context().newCDPSession(page)
await cdp.send('Profiler.enable')
await cdp.send('Profiler.setSamplingInterval', { interval: 200 })
await cdp.send('Emulation.setCPUThrottlingRate', { rate: Number(rate) })
await cdp.send('Profiler.start')
await page.evaluate(n => window.lab.step(n), step)
await page.waitForTimeout(900 * Number(rate) / 2)
const { profile } = await cdp.send('Profiler.stop')
const self = new Map()
const byId = new Map(profile.nodes.map(n => [n.id, n]))
const dt = profile.timeDeltas
const counts = new Map()
profile.samples.forEach((id, i) => counts.set(id, (counts.get(id) ?? 0) + (dt[i] ?? 0)))
let total = 0
for (const [id, us] of counts) {
  const n = byId.get(id)
  const f = n.callFrame
  if (f.functionName === '(idle)' || f.functionName === '(program)')
    continue
  const key = `${f.functionName || '(anon)'} ${f.url.split('/').slice(-2).join('/').replace(/\?.*/, '')}:${f.lineNumber + 1}`
  self.set(key, (self.get(key) ?? 0) + us)
  total += us
}
console.log(`total busy ${(total / 1000).toFixed(0)} ms (throttled ${rate}x)`)
for (const [k, us] of [...self].sort((a, b) => b[1] - a[1]).slice(0, 40))
  console.log(`${(us / 1000).toFixed(1).padStart(7)} ms  ${(100 * us / total).toFixed(1).padStart(5)}%  ${k}`)
await browser.close()
await server.close()
