<script setup>
import { computed, ref } from 'vue'
import { Area, AreaChart, Bar, BarChart, Funnel, FunnelChart, Line, LineChart, Pie, PieChart, PolarAngleAxis, PolarRadiusAxis, Radar, RadarChart, RadialBar, RadialBarChart, Sankey, Tooltip, Treemap, XAxis, YAxis } from 'vccs'

const kind = new URLSearchParams(location.search).get('scenario') || 'bar'
const changed = ref(false)
const short = ref(false)
const days = Array.from({ length: 90 }, (_, i) => ({ name: new Date(Date.UTC(2024, 0, i + 1)).toISOString().slice(0, 10), value: 30 + i % 17 * 3, other: 20 + i % 11 * 2 }))
const categories = Array.from({ length: kind === 'bar' ? 91 : 6 }, (_, i) => ({ name: `category-${i}`, value: 20 + i * 7 }))
const rows = computed(() => {
  if (['line', 'area', 'hover'].includes(kind))
    return short.value ? days.slice(-7) : days
  let result = categories.map((row, i) => ({ ...row, value: changed.value ? (categories.length - i) * 13 : row.value }))
  if (kind === 'pie' && changed.value)
    result = [...result.slice(0, -1), { name: 'added-sector', value: 45 }]
  return result
})
const sankey = computed(() => ({
  nodes: [...rows.value.map(row => ({ name: row.name })), { name: 'sink' }],
  links: rows.value.map((row, i) => ({ source: i, target: rows.value.length, value: row.value })),
}))
function change() {
  if (['line', 'area'].includes(kind))
    short.value = !short.value
  else changed.value = !changed.value
}
window.motionFixture = {
  change,
  keys: () => rows.value.map(row => row.name),
  kind,
}
</script>

<template>
  <main>
    <h1>{{ kind }} motion fixture</h1>
    <button @click="change">
      Change data
    </button>
    <BarChart
      v-if="kind === 'bar'"
      :width="1000"
      :height="460"
      :data="rows"
    >
      <XAxis data-key="name" /><YAxis /><Bar
        data-key="value"
        fill="#3879bf"
      />
    </BarChart>
    <LineChart
      v-else-if="kind === 'line' || kind === 'hover'"
      :width="1000"
      :height="460"
      :data="rows"
    >
      <XAxis data-key="name" /><YAxis /><Line
        data-key="value"
        type="linear"
        stroke="#3879bf"
      />
      <Tooltip v-if="kind === 'hover'" />
    </LineChart>
    <AreaChart
      v-else-if="kind === 'area'"
      :width="1000"
      :height="460"
      :data="rows"
    >
      <XAxis data-key="name" /><YAxis />
      <Area
        dot
        data-key="value"
        stack-id="total"
        type="linear"
        fill="#3879bf"
        stroke="#3879bf"
      />
      <Area
        dot
        data-key="other"
        stack-id="total"
        type="linear"
        fill="#79bb9e"
        stroke="#79bb9e"
      />
    </AreaChart>
    <PieChart
      v-else-if="kind === 'pie'"
      :width="1000"
      :height="460"
    >
      <Pie
        :data="rows"
        data-key="value"
        name-key="name"
        fill="#3879bf"
      />
    </PieChart>
    <RadarChart
      v-else-if="kind === 'radar'"
      :width="1000"
      :height="460"
      :data="rows"
    >
      <PolarAngleAxis data-key="name" /><PolarRadiusAxis :domain="[0, 110]" /><Radar
        dot
        data-key="value"
        fill="#3879bf"
      />
    </RadarChart>
    <RadialBarChart
      v-else-if="kind === 'radial'"
      :width="1000"
      :height="460"
      :data="rows"
    >
      <RadialBar
        data-key="value"
        fill="#3879bf"
      />
    </RadialBarChart>
    <FunnelChart
      v-else-if="kind === 'funnel'"
      :width="1000"
      :height="460"
    >
      <Funnel
        :data="rows"
        data-key="value"
        name-key="name"
        fill="#3879bf"
      />
    </FunnelChart>
    <Treemap
      v-else-if="kind === 'treemap'"
      :width="1000"
      :height="460"
      :data="rows"
    />
    <Sankey
      v-else-if="kind === 'sankey'"
      :width="1000"
      :height="460"
      :data="sankey"
    />
  </main>
</template>

<style>
body { margin: 24px; font-family: system-ui, sans-serif; }
button { margin-bottom: 16px; padding: 8px 16px; }
</style>
