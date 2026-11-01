// Checks the comparison site as visitors get it: every library's card on every chart page must draw,
// react to hover with a tooltip naming the data, follow the theme and match its animation claim, with no
// page or console errors.
// Screenshots go to .evidence/libraries/cards/ for review by eye. An instrument, like
// compare-libraries.mjs, whose bundles cover only the line chart.
// Usage: pnpm compare:cards [--chart=area] [--only=vccs,chartjs]. Needs an install in benchmark/site.
/* eslint-disable no-console -- the table is the interface */
import { spawnSync } from 'node:child_process'
import { mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { preview } from 'vite'
import { charts, libraries } from '../benchmark/libraries.mjs'
import { launchBrowser } from './lib/browser.mjs'
import { animationVerdict } from './lib/compare-libraries.mjs'

const root = fileURLToPath(new URL('../', import.meta.url))
const site = join(root, 'benchmark/site')
const evidence = join(root, '.evidence/libraries/cards')
const option = name => process.argv.find(arg => arg.startsWith(`--${name}=`))?.slice(name.length + 3).split(',')
const chosenCharts = option('chart')
const chosenLibraries = option('only')

await mkdir(evidence, { recursive: true })
const built = spawnSync('pnpm', ['build'], { cwd: site, encoding: 'utf8' })
if (built.status !== 0)
  throw new Error(`The site did not build:\n${built.stdout}${built.stderr}`)

const server = await preview({ root: site, logLevel: 'silent', preview: { port: 4722 } })
const origin = server.resolvedUrls.local[0]
const browser = await launchBrowser()

/** Distinct stage images over 2.5 s: only pixels count, because libraries animate in different ways. */
async function frames(stage, action) {
  const seen = new Set()
  await action()
  const end = Date.now() + 2500
  while (Date.now() < end)
    seen.add((await stage.screenshot()).toString('base64'))
  return seen.size
}

/** Lines of text that hovering added. A tooltip's line can match a legend's, so each old line cancels one new line. */
function newLines(before, after) {
  const old = before.split('\n').map(line => line.trim())
  return after.split('\n').map(line => line.trim()).filter((line) => {
    const index = old.indexOf(line)
    if (index >= 0)
      old.splice(index, 1)
    return line && index < 0
  })
}

// Pixels can't tell `Chrome: 275` from layout coordinates, or a tooltip from a crosshair. A tooltip drawn on canvas adds no text, so it stays a review by eye.
function tooltipNamesNothing(chart, before, after) {
  const lines = newLines(before, after)
  return lines.length > 0 && !lines.some(line => chart.tooltipNames.some(name => line.includes(name)))
}

async function checkCard(chart, library) {
  const page = await browser.newPage({ viewport: { width: 760, height: 620 } })
  const errors = []
  page.on('pageerror', error => errors.push(`page error: ${error.message}`))
  page.on('console', message => message.type() === 'error' && errors.push(`console error: ${message.text()}`))
  await page.emulateMedia({ colorScheme: 'light' })
  const stage = page.locator('[data-compare-card] .stage')
  const name = `${chart.id}-${library.id}`

  const enterFrames = await frames(stage, () => page.goto(`${origin}?only=${library.id}#/${chart.id}`, { waitUntil: 'load' }))
  await page.waitForLoadState('networkidle')
  await page.waitForTimeout(1500)
  const settled = await stage.screenshot({ path: join(evidence, `${name}-light.png`) })

  const setChartVisibility = value => stage.evaluate((element, visibility) => { element.firstElementChild.style.visibility = visibility }, value)
  await setChartVisibility('hidden')
  const blank = await stage.screenshot()
  await setChartVisibility('')

  const declaredStill = library.limits?.[chart.id]?.omits?.includes('animation') ?? false
  const randomize = () => frames(stage, () => page.getByRole('button', { name: 'Randomize data' }).click())
  let updateFrames = await randomize()
  // A busy machine samples short transitions too thinly. One sighting proves motion and a low count
  // proves nothing, so a card claiming animation is measured again. The threshold stays the same.
  if (!declaredStill) {
    for (let attempt = 0; attempt < 4 && !animationVerdict({ enterFrames, updateFrames }, false).ok; attempt++)
      updateFrames = Math.max(updateFrames, await randomize())
  }
  await page.waitForTimeout(800)
  const updated = await stage.screenshot()
  // The whole page, because some libraries render their tooltip outside the card, on the body.
  const pageText = () => page.locator('body').innerText()
  const textBefore = await pageText()

  const box = await stage.boundingBox()
  // Several points, because one can land in a gap between bars, tiles or slices.
  let hovered = updated
  let textOnHover = textBefore
  const hasTooltip = !library.limits?.[chart.id]?.omits?.includes('tooltip')
  const coarse = [[0.5, 0.45], [0.35, 0.65], [0.65, 0.65], [0.5, 0.55], [0.25, 0.75], [0.75, 0.75]].map(point => [...point, 600])
  // Small marks such as scatter points only respond when the pointer is on them.
  const fine = Array.from({ length: 16 * 12 }, (_, index) => [0.08 + (index % 16) * 0.056, 0.06 + Math.floor(index / 16) * 0.076, 120])
  // Last, the marks themselves, for points too small for the grid to hit.
  const marks = await stage.locator('circle, path, rect').evaluateAll(elements => elements.slice(0, 80).map((element) => {
    const { x, y, width, height } = element.getBoundingClientRect()
    return { x: x + width / 2, y: y + height / 2 }
  }))
  const targets = [
    ...[...coarse, ...fine].map(([x, y, wait]) => ({ x: box.x + box.width * x, y: box.y + box.height * y, wait })),
    ...marks.map(mark => ({ ...mark, wait: 120 })),
  ]
  for (const { x, y, wait } of hasTooltip ? targets : []) {
    await page.mouse.move(x - 4, y)
    await page.mouse.move(x, y)
    await page.waitForTimeout(wait)
    const shot = await stage.screenshot({ path: join(evidence, `${name}-hover.png`) })
    if (!shot.equals(updated)) {
      hovered = shot
      // The first changed pixels can come before the tooltip fades in, and the evidence should show it.
      await page.waitForTimeout(400)
      await stage.screenshot({ path: join(evidence, `${name}-hover.png`) })
      textOnHover = await pageText()
      // A highlight or crosshair changes pixels too, so a readable tooltip keeps the search going until text appears.
      if (library.tooltipOnCanvas || newLines(textBefore, textOnHover).length)
        break
    }
  }
  await page.mouse.move(0, 0)

  await page.getByRole('button', { name: 'Dark theme' }).click()
  await page.waitForTimeout(1500)
  const dark = await stage.screenshot({ path: join(evidence, `${name}-dark.png`) })
  await page.close()

  const animation = animationVerdict({ enterFrames, updateFrames }, declaredStill)
  const problems = [
    ...errors,
    ...(settled.equals(blank) ? ['nothing rendered'] : []),
    ...(updated.equals(settled) ? ['new data changed nothing'] : []),
    ...(hovered.equals(updated) && hasTooltip ? ['hover changed nothing'] : []),
    ...(dark.equals(updated) ? ['the theme changed nothing'] : []),
    ...(hasTooltip && !library.tooltipOnCanvas && !hovered.equals(updated) && !newLines(textBefore, textOnHover).length ? ['hover added no tooltip text'] : []),
    ...(tooltipNamesNothing(chart, textBefore, textOnHover) ? [`the tooltip names nothing from the data: ${newLines(textBefore, textOnHover).join(' ').slice(0, 60)}`] : []),
    ...(animation.ok ? [] : [animation.message]),
  ]
  console.log(`${name.padEnd(24)} frames ${String(enterFrames).padStart(3)}/${String(updateFrames).padEnd(3)} ${problems.length ? `FAIL ${problems.join('; ')}` : 'ok'}`)
  return problems.map(text => `${name}: ${text}`)
}

// Screenshots occasionally stall on a stability wait, on a different card each run, so a stall gets one retry.
function checkOnce(chart, library) {
  const name = `${chart.id}-${library.id}`
  const report = error => [`${name}: ${error.message.split('\n')[0]}`]
  return checkCard(chart, library).catch((error) => {
    console.log(`${name.padEnd(24)} retrying after: ${error.message.split('\n')[0]}`)
    return checkCard(chart, library).catch(report)
  })
}

const failures = []
for (const chart of charts.filter(item => !chosenCharts || chosenCharts.includes(item.id))) {
  for (const library of libraries.filter(item => (!chosenLibraries || chosenLibraries.includes(item.id)) && !item.limits?.[chart.id]?.unsupported))
    failures.push(...await checkOnce(chart, library))
}
await browser.close()
await server.close()

if (failures.length) {
  console.error(`\n${failures.length} problem(s):\n${failures.join('\n')}`)
  process.exit(1)
}
console.log('\nEvery card works.')
