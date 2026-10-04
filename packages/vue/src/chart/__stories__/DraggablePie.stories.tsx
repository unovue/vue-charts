import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { defineComponent, ref } from 'vue'
import { PieChart } from '@/chart/PieChart'
import { Pie } from '@/polar/pie/Pie'
import { getRelativeCoordinate } from '@/utils/getRelativeCoordinate'
import type { MouseHandlerDataParam } from '@/types'

type PieData = Array<{ name: string, value: number, fill: string }>

const meta = {
  title: 'Examples/Pie/DraggablePie',
  component: Pie,
} satisfies Meta<typeof Pie>

export default meta
type Story = StoryObj<typeof meta>

function createData(email: number, socialMedia: number, phone: number, webchat: number): PieData {
  return [
    { name: 'Email', value: email, fill: '#8884d8' },
    { name: 'Social Media', value: socialMedia, fill: '#a683ed' },
    { name: 'Phone', value: phone, fill: '#e18dd1' },
    { name: 'Web chat', value: webchat, fill: '#82ca9d' },
  ]
}

/**
 * @param cx center of the whole chart
 * @param cy center of the whole chart
 * @param angle angle of the point relative to the zero angle (east, 3 o'clock) in degrees
 * @param radius distance from the center of the chart to the point
 */
function DraggablePoint({ cx, cy, angle, radius }: { cx: number, cy: number, angle: number, radius: number }) {
  const pointCx = cx + radius * Math.cos((angle * Math.PI) / 180)
  const pointCy = cy - radius * Math.sin((angle * Math.PI) / 180)
  return (
    <circle
      style={{ cursor: 'grab' }}
      cx={pointCx}
      cy={pointCy}
      r={10}
      fill="red"
    />
  )
}

function computeAngle(cx: number, cy: number, e: MouseEvent): number {
  const { relativeX, relativeY } = getRelativeCoordinate(e)
  const deltaX = relativeX - cx
  const deltaY = relativeY - cy
  const angleInDegrees = -Math.atan2(deltaY, deltaX) * (180 / Math.PI)
  return angleInDegrees < 0 ? angleInDegrees + 360 : angleInDegrees
}

const DraggablePieWrapper = defineComponent({
  setup() {
    const isDragging = ref<string | null>(null)
    const email = ref(90)
    const socialMedia = ref(90)
    const cx = 250
    const cy = 250

    const onMouseDown = (_chartData: MouseHandlerDataParam, _e: Event) => {
      isDragging.value = 'email'
    }

    const onMouseUp = (_chartData: MouseHandlerDataParam, _e: Event) => {
      isDragging.value = null
    }

    const onMouseMove = (_chartData: MouseHandlerDataParam, e: Event) => {
      if (isDragging.value) {
        const newAngleInDegrees = computeAngle(cx, cy, e as MouseEvent)
        const delta = newAngleInDegrees - email.value
        email.value = newAngleInDegrees
        socialMedia.value = socialMedia.value - delta
      }
    }

    return () => {
      const data = createData(email.value, socialMedia.value, 90, 90)

      return (
        <PieChart
          width={500}
          height={500}
          margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          onMousedown={onMouseDown}
          onMouseup={onMouseUp}
          onMousemove={onMouseMove}
        >
          <Pie
            dataKey="value"
            data={data}
            outerRadius={200}
            label
            isAnimationActive={false}
          />
          <DraggablePoint angle={email.value} radius={200} cx={cx} cy={cy} />
        </PieChart>
      )
    }
  },
})

export const DraggablePie: Story = {
  render: () => DraggablePieWrapper,
}
