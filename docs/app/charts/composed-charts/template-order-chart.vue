<script setup>
import { Area, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from 'vccs'

const data = [
  { name: 'Mon', visits: 420, signups: 380 },
  { name: 'Tue', visits: 510, signups: 450 },
  { name: 'Wed', visits: 480, signups: 520 },
  { name: 'Thu', visits: 620, signups: 560 },
  { name: 'Fri', visits: 580, signups: 610 },
]
</script>

<template>
  <ComposedChart
    :data="data"
    :height="300"
  >
    <CartesianGrid stroke-dasharray="3 3" />
    <XAxis data-key="name" />
    <YAxis />
    <!-- Declared first, so it paints first: the Area covers it. -->
    <Line
      data-key="signups"
      stroke="#f97316"
      :stroke-width="3"
    />
    <Area
      data-key="visits"
      stroke="#14b8a6"
      fill="#14b8a6"
      :fill-opacity="0.9"
    />
  </ComposedChart>
</template>
