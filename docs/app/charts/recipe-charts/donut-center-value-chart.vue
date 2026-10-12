<script setup>
import { Cell, Label, Pie, PieChart, Tooltip } from 'vccs'

const data = [
  { name: 'Chrome', value: 640 },
  { name: 'Safari', value: 380 },
  { name: 'Firefox', value: 160 },
  { name: 'Other', value: 104 },
]
const colors = ['#f97316', '#14b8a6', '#f59e0b', '#06b6d4']
const total = data.reduce((sum, row) => sum + row.value, 0)
</script>

<template>
  <PieChart :height="240">
    <Pie
      :data="data"
      data-key="value"
      name-key="name"
      :inner-radius="70"
      :outer-radius="100"
      :padding-angle="2"
      :corner-radius="4"
      stroke="none"
    >
      <Cell
        v-for="(row, i) in data"
        :key="row.name"
        :fill="colors[i]"
      />
      <Label
        position="center"
        :value="total.toLocaleString('en-US')"
        class="fill-(--color-foreground) text-2xl font-semibold"
      />
    </Pie>
    <Tooltip :cursor="false" />
  </PieChart>
</template>
