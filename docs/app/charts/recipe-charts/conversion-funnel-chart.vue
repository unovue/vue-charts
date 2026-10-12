<script setup>
import { Bar, BarChart, LabelList, Tooltip, XAxis, YAxis } from 'vccs'

const steps = [
  { step: 'Visited', users: 4200 },
  { step: 'Signed up', users: 1680 },
  { step: 'Started trial', users: 790 },
  { step: 'Paid', users: 240 },
]
const data = steps.map((row, i) => ({
  ...row,
  share: i === 0 ? '100%' : `${Math.round(row.users / steps[i - 1].users * 100)}% of previous`,
}))
</script>

<template>
  <BarChart
    :height="220"
    :data="data"
    layout="vertical"
    :margin="{ top: 0, right: 110, bottom: 0, left: 0 }"
  >
    <XAxis
      type="number"
      hide
      :domain="[0, 'dataMax']"
    />
    <YAxis
      type="category"
      data-key="step"
      :width="96"
      :tick-line="false"
      :axis-line="false"
    />
    <Bar
      data-key="users"
      fill="#f97316"
      :radius="4"
      :background="{ fill: 'rgb(148 163 184 / 0.15)', radius: 4 }"
    >
      <LabelList
        data-key="share"
        position="right"
        class="fill-(--color-muted-foreground) text-xs"
      />
    </Bar>
    <Tooltip :cursor="false" />
  </BarChart>
</template>
