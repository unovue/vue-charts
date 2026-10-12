<script setup>
import { Area, AreaChart, Line, LineChart, Tooltip, XAxis, YAxis } from 'vccs'

const data = [
  { day: 'Mon', visits: 420, signups: 24 },
  { day: 'Tue', visits: 510, signups: 31 },
  { day: 'Wed', visits: 480, signups: 28 },
  { day: 'Thu', visits: 620, signups: 40 },
  { day: 'Fri', visits: 580, signups: 36 },
  { day: 'Sat', visits: 310, signups: 15 },
  { day: 'Sun', visits: 290, signups: 12 },
]
</script>

<template>
  <div>
    <LineChart
      :data="data"
      :height="150"
      sync-id="week"
    >
      <XAxis data-key="day" />
      <YAxis />
      <Tooltip :cursor="false" />
      <Line
        data-key="visits"
        stroke="#f97316"
      />
    </LineChart>
    <AreaChart
      :data="data"
      :height="150"
      sync-id="week"
    >
      <XAxis data-key="day" />
      <YAxis />
      <Tooltip :cursor="false" />
      <Area
        data-key="signups"
        stroke="#14b8a6"
        fill="#14b8a6"
        :fill-opacity="0.3"
      />
    </AreaChart>
  </div>
</template>
