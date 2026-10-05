<script setup lang="ts">
const rows: { name: string, value: number }[] = [{ name: 'A', value: 12 }, { name: 'B', value: 24 }]
</script>

<template>
  <BarChart
    :width="600"
    :height="300"
    :data="rows"
  >
    <Bar
      data-key="value"
      :is-animation-active="false"
    />
    <XAxis data-key="name" />
    <YAxis />
    <Tooltip>
      <template #content="{ active, payload, label }">
        <div v-if="active">
          {{ label }}: {{ payload?.[0]?.value }}
        </div>
      </template>
      <template #cursor="{ width, height }">
        <rect
          :width="width"
          :height="height"
        />
      </template>
    </Tooltip>
    <Legend />
  </BarChart>
  <LineChart
    :width="600"
    :height="300"
    :data="rows"
  >
    <Line
      data-key="value"
      :is-animation-active="false"
    />
    <Tooltip />
    <Legend />
  </LineChart>
</template>
