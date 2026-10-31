export interface LineRow {
  month: string
  desktop: number
  mobile: number
  tablet: number
}

const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const lineData: LineRow[] = [
  [186, 80, 42],
  [305, 200, 58],
  [237, 120, 71],
  [173, 190, 65],
  [209, 130, 94],
  [214, 140, 88],
  [262, 175, 103],
  [248, 210, 97],
  [291, 168, 121],
  [320, 225, 116],
  [278, 240, 134],
  [344, 262, 142],
].map(([desktop, mobile, tablet], index) => ({ month: months[index]!, desktop: desktop!, mobile: mobile!, tablet: tablet! }))

/** New values for the same months, so every library animates the same update. */
export function randomizeLineData(random: () => number = Math.random): LineRow[] {
  const value = (low: number, high: number) => Math.round(low + random() * (high - low))
  return months.map(month => ({ month, desktop: value(150, 350), mobile: value(70, 270), tablet: value(40, 150) }))
}
