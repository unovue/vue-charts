import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { SunburstChart } from '@/chart/SunburstChart'
import { Tooltip } from '@/components'
import { ResponsiveContainer } from '@/container'

const meta = {
  title: 'Examples/SunburstChart',
  component: SunburstChart,
} satisfies Meta<typeof SunburstChart>

export default meta
type Story = StoryObj<typeof meta>

const simpleData = {
  name: 'root',
  children: [
    { name: 'Child 1', value: 100, fill: '#f97316' },
    { name: 'Child 2', value: 200, fill: '#14b8a6' },
    { name: 'Child 3', value: 150, fill: '#f59e0b' },
    { name: 'Child 4', value: 250, fill: '#06b6d4' },
  ],
}

const nestedData = {
  name: 'root',
  children: [
    {
      name: 'Category A',
      fill: '#f97316',
      children: [
        { name: 'A-1', value: 100 },
        { name: 'A-2', value: 200 },
        { name: 'A-3', value: 50 },
      ],
    },
    {
      name: 'Category B',
      fill: '#14b8a6',
      children: [
        { name: 'B-1', value: 150 },
        { name: 'B-2', value: 100 },
      ],
    },
    {
      name: 'Category C',
      fill: '#f59e0b',
      children: [
        { name: 'C-1', value: 300 },
        {
          name: 'C-2',
          children: [
            { name: 'C-2-a', value: 80 },
            { name: 'C-2-b', value: 120 },
          ],
        },
      ],
    },
  ],
}

export const Simple: Story = {
  render: () => ({
    setup() {
      return () => (
        <ResponsiveContainer width="100%" height={400}>
          <SunburstChart data={{ ...simpleData }} width={400} height={400} />
        </ResponsiveContainer>
      )
    },
  }),
}

export const ThreeLevels: Story = {
  render: () => ({
    setup() {
      return () => (
        <ResponsiveContainer width="100%" height={400}>
          <SunburstChart data={{ ...nestedData }} width={400} height={400} />
        </ResponsiveContainer>
      )
    },
  }),
}

export const CustomColors: Story = {
  render: () => ({
    setup() {
      const data = {
        name: 'root',
        children: [
          { name: 'Red', value: 100, fill: '#ef4444' },
          { name: 'Blue', value: 200, fill: '#3b82f6' },
          { name: 'Green', value: 150, fill: '#22c55e' },
          { name: 'Purple', value: 120, fill: '#a855f7' },
        ],
      }
      return () => (
        <ResponsiveContainer width="100%" height={400}>
          <SunburstChart data={{ ...data }} width={400} height={400} stroke="#fff" />
        </ResponsiveContainer>
      )
    },
  }),
}

export const CustomContent: Story = {
  render: () => ({
    setup() {
      return () => (
        <ResponsiveContainer width="100%" height={400}>
          <SunburstChart data={{ ...simpleData }} width={400} height={400}>
            {{
              content: (props: any) => (
                <path
                  d={`M ${props.cx} ${props.cy}`}
                  fill={props.fill ?? '#333'}
                  stroke="#fff"
                  stroke-width={2}
                />
              ),
            }}
          </SunburstChart>
        </ResponsiveContainer>
      )
    },
  }),
}

export const WithTooltip: Story = {
  render: () => ({
    setup() {
      return () => (
        <ResponsiveContainer width="100%" height={400}>
          <SunburstChart data={{ ...nestedData }} width={400} height={400}>
            <Tooltip cursor={false} />
          </SunburstChart>
        </ResponsiveContainer>
      )
    },
  }),
}
