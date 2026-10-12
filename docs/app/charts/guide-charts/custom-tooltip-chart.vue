<script setup>
import { Bar, BarChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Page A', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page B', uv: 590, pv: 800, amt: 1400 },
  { name: 'Page C', uv: 868, pv: 967, amt: 1506 },
  { name: 'Page D', uv: 1397, pv: 1098, amt: 989 },
  { name: 'Page E', uv: 1480, pv: 1200, amt: 1228 },
  { name: 'Page F', uv: 1520, pv: 1108, amt: 1100 },
  { name: 'Page G', uv: 1400, pv: 680, amt: 1700 },
]

function getIntroOfPage(label) {
  const intros = {
    'Page A': 'Page A is about men\'s clothing',
    'Page B': 'Page B is about women\'s dress',
    'Page C': 'Page C is about women\'s bag',
    'Page D': 'Page D is about household goods',
    'Page E': 'Page E is about food',
    'Page F': 'Page F is about baby food',
  }
  return intros[label] || ''
}
</script>

<template>
  <BarChart
    :data="data"
    :margin="{ top: 5, right: 20, left: 10, bottom: 20 }"
    :height="300"
  >
    <XAxis data-key="name">
      <template #tick="{ x, y, payload }">
        <g :transform="`translate(${x},${y})`">
          <text
            :x="0"
            :y="0"
            dy="16"
            text-anchor="end"
            fill="#666"
            transform="rotate(-35)"
          >
            {{ payload.value }}
          </text>
        </g>
      </template>
    </XAxis>
    <YAxis />
    <Tooltip>
      <template #content="{ active, payload, label }">
        <div
          v-if="active && payload?.length"
          style="background: white; border: 1px solid #ccc; padding: 10px; border-radius: 4px;"
        >
          <p style="margin: 0 0 4px; font-weight: 600;">
            {{ label }} : {{ payload[0].value }}
          </p>
          <p style="margin: 0 0 4px; color: #999;">
            {{ getIntroOfPage(label) }}
          </p>
          <p style="margin: 0; color: #999;">
            Anything you want can be displayed here.
          </p>
        </div>
      </template>
    </Tooltip>
    <Bar
      data-key="uv"
      fill="#8884d8"
    />
  </BarChart>
</template>
