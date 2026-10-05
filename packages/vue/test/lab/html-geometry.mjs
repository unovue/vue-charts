// Installed in the page by report and film. Resolve percentage widths to pixels so
// progress spans and jump thresholds use the same units as SVG geometry.
export function installHTMLGeometry() {
  window.__htmlGeometry = () => {
    const shapes = {}
    for (const [listIndex, list] of [...document.querySelectorAll('.v-charts-bar-list')].entries()) {
      shapes[`ul.v-charts-bar-list#barList${listIndex}`] = { height: String(list.getBoundingClientRect().height) }
      for (const row of list.querySelectorAll('.v-charts-bar-list-row')) {
        const key = row.__vnode?.key ?? row.querySelector('.v-charts-bar-list-name')?.textContent
        const id = `barList${listIndex}/${key}`
        shapes[`li.v-charts-bar-list-row#${id}`] = { transform: row.style.transform, opacity: row.style.opacity }
        const bar = row.querySelector('.v-charts-bar-list-bar')
        if (bar) {
          const width = Number.parseFloat(bar.style.width) * bar.parentElement.clientWidth / 100
          shapes[`div.v-charts-bar-list-bar#${id}`] = { width: String(width), height: row.style.height, opacity: row.style.opacity }
        }
      }
    }
    return shapes
  }
}
