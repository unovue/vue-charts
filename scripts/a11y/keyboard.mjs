import assert from 'node:assert/strict'

export async function checkKeyboard(page, name) {
  if (name === 'BarList') {
    const button = page.locator('.v-charts-bar-list-name button').first()
    await button.focus()
    await button.press('Enter')
    assert.equal(await page.evaluate(() => window.rowClicks.length), 1)
    await button.click()
    assert.equal(await page.evaluate(() => window.rowClicks.length), 2)
    assert.deepEqual(await page.evaluate(() => window.rowClicks.map(row => row.index)), [0, 0])
    return
  }
  if (name === 'Legend') {
    const button = page.locator('.v-charts-default-legend > li > button').first()
    assert.equal(await button.getAttribute('aria-pressed'), 'true')
    await button.press('Enter')
    assert.equal(await button.getAttribute('aria-pressed'), 'false')
    await button.press('Space')
    assert.equal(await button.getAttribute('aria-pressed'), 'true')
    return
  }
  if (name === 'Brush') {
    const start = page.getByRole('slider', { name: 'Range start' })
    const end = page.getByRole('slider', { name: 'Range end' })
    for (const slider of [start, end]) {
      assert.equal(await slider.getAttribute('aria-valuemin'), '0')
      assert.equal(await slider.getAttribute('aria-valuemax'), '2')
    }
    assert.equal(await start.getAttribute('aria-valuenow'), '0')
    await start.press('ArrowRight')
    assert.equal(await start.getAttribute('aria-valuenow'), '1')
    assert.equal(await start.getAttribute('aria-valuetext'), 'Beta')
    assert.equal(await end.getAttribute('aria-valuenow'), '2')
    return
  }
  const cellCharts = ['Tracker', 'Heatmap', 'CohortChart', 'CalendarHeatmap']
  if (cellCharts.includes(name)) {
    const grid = page.locator('.v-charts-cell-grid')
    await grid.focus()
    await grid.press('Home')
    const first = await grid.getAttribute('aria-activedescendant')
    assert.ok(first, `${name}: active cell`)
    await grid.press('End')
    assert.notEqual(await grid.getAttribute('aria-activedescendant'), first)
    assert.equal(await page.locator('[aria-selected="true"]').count(), 1)
    await grid.press('Home')
    await grid.press('ArrowRight')
    return
  }
  const root = page.locator('#host [tabindex="0"]').first()
  assert.equal(await root.count(), 1, `${name}: keyboard root`)
  await root.focus()
  await root.press('ArrowRight')
  await root.press('ArrowRight')
  const tooltip = page.locator('.v-charts-tooltip-wrapper')
  assert.equal(await tooltip.evaluate(el => getComputedStyle(el).visibility), 'visible')
  const itemCharts = ['PieChart', 'ScatterChart', 'FunnelChart']
  const trees = ['Treemap', 'Sankey', 'SunburstChart']
  if (name === 'ScatterChart') {
    assert.deepEqual(await page.locator('.v-charts-tooltip-item-value').allTextContents(), ['20', '10'])
    await page.waitForFunction(() => document.querySelector('[aria-live]').textContent.includes('20'))
  }
  else if (itemCharts.includes(name)) {
    assert.equal(await page.locator('.v-charts-tooltip-item-name').textContent(), 'Beta')
    assert.equal(await page.locator('.v-charts-tooltip-item-value').textContent(), '25')
    await page.waitForFunction(() => /Beta.*25/.test(document.querySelector('[aria-live]').textContent))
  }
  if ([...itemCharts, ...trees].includes(name)) {
    await root.press('End')
    const last = await tooltip.textContent()
    await root.press('ArrowLeft')
    assert.notEqual(await tooltip.textContent(), last, `${name}: previous item`)
    if (trees.includes(name)) {
      await root.press('Enter')
      assert.equal(await page.evaluate(() => window.nodeClicks.length), 1)
    }
    await root.press('Escape')
    assert.equal(await tooltip.evaluate(el => getComputedStyle(el).visibility), 'hidden')
    await root.press('Home')
    assert.equal(await tooltip.evaluate(el => getComputedStyle(el).visibility), 'visible')
  }
}
