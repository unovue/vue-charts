<script setup>
import { CohortChart, Tooltip } from 'vccs'

const data = [
  { cohort: 'Jan', values: [1200, 610, 480, 410, 370, 350] },
  { cohort: 'Feb', values: [940, 470, 370, 320, 300] },
  { cohort: 'Mar', values: [1180, 650, 520, 450] },
  { cohort: 'Apr', values: [1340, 720, 600] },
  { cohort: 'May', values: [860, 440] },
  { cohort: 'Jun', values: [910] },
]
</script>

<template>
  <CohortChart
    :data="data"
    color="#f97316"
    :period-label="month => `Month ${month}`"
  >
    <Tooltip :cursor="false" />
  </CohortChart>
</template>
