<script setup>
import { SunburstChart, Tooltip } from 'vccs'

const data = {
  name: 'Traffic',
  children: [
    {
      name: 'Search',
      fill: '#f97316',
      children: [
        { name: 'Google', value: 420 },
        { name: 'Bing', value: 90 },
        { name: 'DuckDuckGo', value: 40 },
      ],
    },
    {
      name: 'Social',
      fill: '#14b8a6',
      children: [
        { name: 'LinkedIn', value: 150 },
        { name: 'Mastodon', value: 80 },
      ],
    },
    {
      name: 'Direct',
      fill: '#f59e0b',
      children: [
        { name: 'Bookmarks', value: 160 },
        {
          name: 'Newsletter',
          fill: '#06b6d4',
          children: [
            { name: 'Weekly', value: 110 },
            { name: 'Monthly', value: 50 },
          ],
        },
      ],
    },
  ],
}
</script>

<template>
  <SunburstChart
    :data="data"
    :height="320"
    :inner-radius="40"
    title="Traffic by source"
  >
    <Tooltip :cursor="false">
      <template #content="{ active, payload }">
        <ChartTooltipContent
          :active="active"
          :payload="payload"
          hide-label
        />
      </template>
    </Tooltip>
  </SunburstChart>
</template>
