import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { Tooltip } from '@/components/Tooltip'
import { Sankey } from '../Sankey'

const energyData = {
  nodes: [
    { name: 'Coal' },
    { name: 'Gas' },
    { name: 'Solar' },
    { name: 'Electricity' },
    { name: 'Heat' },
    { name: 'Industry' },
    { name: 'Homes' },
  ],
  links: [
    { source: 0, target: 3, value: 30 },
    { source: 1, target: 3, value: 20 },
    { source: 2, target: 3, value: 15 },
    { source: 0, target: 4, value: 10 },
    { source: 1, target: 4, value: 8 },
    { source: 3, target: 5, value: 35 },
    { source: 3, target: 6, value: 30 },
    { source: 4, target: 6, value: 18 },
  ],
}

const meta = {
  title: 'Examples/SankeyChart',
  component: Sankey,
} satisfies Meta<typeof Sankey>

export default meta
type Story = StoryObj<typeof meta>

export const Simple: Story = {
  render: () => ({
    components: { Sankey },
    setup: () => ({ data: { nodes: [...energyData.nodes], links: [...energyData.links] } }),
    template: `<Sankey :data="data" :width="700" :height="400" />`,
  }),
}

export const CustomColors: Story = {
  render: () => ({
    components: { Sankey },
    setup: () => ({ data: { nodes: [...energyData.nodes], links: [...energyData.links] } }),
    template: `<Sankey :data="data" :width="700" :height="400" node-fill="#f97316" link-fill="#14b8a6" />`,
  }),
}

export const CustomNodeSlot: Story = {
  render: () => ({
    components: { Sankey },
    setup: () => ({ data: { nodes: [...energyData.nodes], links: [...energyData.links] } }),
    template: `
      <Sankey :data="data" :width="700" :height="400">
        <template #node="{ x, y, width, height, payload }">
          <g>
            <rect :x="x" :y="y" :width="width" :height="height" fill="#0ea5e9" />
            <text :x="x + width + 6" :y="y + height / 2" font-size="12" dominant-baseline="middle">
              {{ payload.name }}
            </text>
          </g>
        </template>
      </Sankey>
    `,
  }),
}

export const CustomLinkSlot: Story = {
  render: () => ({
    components: { Sankey },
    setup: () => ({ data: { nodes: [...energyData.nodes], links: [...energyData.links] } }),
    template: `
      <Sankey :data="data" :width="700" :height="400">
        <template #link="{ d, linkWidth }">
          <path :d="d" fill="none" stroke="#a855f7" :stroke-width="linkWidth" stroke-opacity="0.35" />
        </template>
      </Sankey>
    `,
  }),
}

export const WithTooltip: Story = {
  render: () => ({
    components: { Sankey, Tooltip },
    setup: () => ({ data: { nodes: [...energyData.nodes], links: [...energyData.links] } }),
    template: `
      <Sankey :data="data" :width="700" :height="400">
        <Tooltip :cursor="false" />
      </Sankey>
    `,
  }),
}
