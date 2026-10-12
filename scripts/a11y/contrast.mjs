// The fixture owns each background relationship; SVG proximity is not evidence.
export function checkContrast() {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const context = canvas.getContext('2d', { willReadFrequently: true })

  function rgba(color) {
    context.clearRect(0, 0, 1, 1)
    context.fillStyle = color
    context.fillRect(0, 0, 1, 1)
    return [...context.getImageData(0, 0, 1, 1).data]
  }

  function composite(foreground, background) {
    const alpha = foreground[3] / 255
    return foreground.slice(0, 3).map((value, index) =>
      value * alpha + background[index] * (1 - alpha))
  }

  function luminance(rgb) {
    return rgb.slice(0, 3).reduce((sum, value, index) => {
      const channel = value / 255
      const linear = channel <= 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
      return sum + linear * [0.2126, 0.7152, 0.0722][index]
    }, 0)
  }

  const page = rgba(getComputedStyle(document.body).backgroundColor)
  const records = []
  const elements = document.querySelectorAll([
    '#host svg text',
    '#host .v-charts-tooltip-label',
    '#host .v-charts-tooltip-item-name',
    '#host .v-charts-tooltip-item-value',
    '#host .v-charts-legend-item-text',
    '#host .v-charts-bar-list-name',
    '#host .v-charts-bar-list-value',
  ].join(','))
  for (const element of elements) {
    if (!element.textContent.trim() || !element.getBoundingClientRect().width)
      continue
    const style = getComputedStyle(element)
    if (style.visibility === 'hidden' || style.display === 'none')
      continue
    let background = page
    const cell = element.closest('.v-charts-cell')
    const node = element.closest('.v-charts-treemap-node')
    const row = element.closest('.v-charts-bar-list-row')
    const tooltip = element.closest('.v-charts-tooltip-content')
    if (cell || node) {
      const shape = cell
        ? cell.querySelector('.v-charts-cell-rect')
        : node.querySelector(':scope > rect')
      background = composite(rgba(getComputedStyle(shape).fill), page)
    }
    else if (row && element.matches('.v-charts-bar-list-name')) {
      const bar = getComputedStyle(row.querySelector('.v-charts-bar-list-bar'))
      const tint = rgba(bar.backgroundColor)
      tint[3] *= Number(bar.opacity)
      background = composite(tint, page)
    }
    else if (tooltip) {
      background = composite(rgba(getComputedStyle(tooltip).backgroundColor), page)
    }
    const foreground = composite(rgba(element instanceof SVGElement
      ? style.fill
      : style.color), background)
    const a = luminance(foreground)
    const b = luminance(background)
    const ratio = (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
    const size = Number.parseFloat(style.fontSize)
    const large = size >= 24 || (size >= 18.66 && Number(style.fontWeight) >= 700)
    records.push({
      text: element.textContent,
      foreground,
      background,
      ratio,
      minimum: large ? 3 : 4.5,
    })
  }
  return records
}
