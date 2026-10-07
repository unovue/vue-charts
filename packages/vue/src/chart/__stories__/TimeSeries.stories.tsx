import type { StoryObj } from '@storybook/vue3-vite'
import { scaleTime } from 'd3-scale'
import { timeDay, timeHour, timeMinute, timeMonth, timeSecond, timeWeek, timeYear } from 'd3-time'
import { timeData } from '@/storybook/data'
import { ComposedChart } from '@/chart/ComposedChart'
import { Line } from '@/cartesian/line/Line'
import { XAxis } from '@/cartesian/axis/XAxis'
import { Tooltip } from '@/components/tooltip/Tooltip'
import ResponsiveContainer from '@/container/ResponsiveContainer.vue'

export default {
  title: 'Examples/TimeSeries',
  component: XAxis,
}

const margin = { top: 20, right: 20, bottom: 20, left: 20 }

export const DefaultBehaviour: StoryObj = {
  render: () => {
    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={[...timeData]} margin={margin}>
          <XAxis dataKey="x" domain={['auto', 'auto']} />
          <Line dataKey="y" />
        </ComposedChart>
      </ResponsiveContainer>
    )
  },
}

// Multi-format tick formatter using native Date methods
// Mimics d3-time-format's multi-scale time format
function multiFormat(value: number | Date): string {
  const date = value instanceof Date ? value : new Date(value)
  return multiFormatDate(date)
}

function multiFormatDate(date: Date): string {
  if (timeSecond(date) < date) {
    return `.${String(date.getMilliseconds()).padStart(3, '0')}`
  }
  if (timeMinute(date) < date) {
    return `:${String(date.getSeconds()).padStart(2, '0')}`
  }
  if (timeHour(date) < date) {
    const h = date.getHours() % 12 || 12
    const m = String(date.getMinutes()).padStart(2, '0')
    return `${h}:${m}`
  }
  if (timeDay(date) < date) {
    const h = date.getHours() % 12 || 12
    const ampm = date.getHours() >= 12 ? 'PM' : 'AM'
    return `${h} ${ampm}`
  }
  if (timeMonth(date) < date) {
    if (timeWeek(date) < date) {
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
      return `${days[date.getDay()]} ${date.getDate()}`
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${months[date.getMonth()]} ${date.getDate()}`
  }
  if (timeYear(date) < date) {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    return months[date.getMonth()]
  }
  return String(date.getFullYear())
}

export const WithD3Scale: StoryObj = {
  render: () => {
    const data = [...timeData]
    const timeValues = data.map(row => row.x)
    const numericValues = timeValues.map(time => time.valueOf())
    const scale = scaleTime()
      .domain([Math.min(...numericValues), Math.max(...numericValues)])
      .nice()

    const xAxisArgs = {
      domain: scale.domain().map((d: Date) => d.valueOf()),
      scale: scale as any,
      type: 'number' as const,
      ticks: scale.ticks(5).map((d: Date) => d.valueOf()),
      tickFormatter: multiFormat,
    }

    return (
      <ResponsiveContainer width="100%" height={400}>
        <ComposedChart data={data} margin={margin}>
          <XAxis dataKey="x" {...xAxisArgs} />
          <Line dataKey="y" />
          <Tooltip />
        </ComposedChart>
      </ResponsiveContainer>
    )
  },
}
