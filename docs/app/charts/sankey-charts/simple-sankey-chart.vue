<script setup>
import { Sankey, Tooltip } from 'vccs'

const data = {
  nodes: [
    { name: 'Visit' },
    { name: 'Sign up' },
    { name: 'Onboarding' },
    { name: 'Active' },
    { name: 'Drop off' },
    { name: 'Churned' },
  ],
  links: [
    { source: 0, target: 1, value: 800 },
    { source: 0, target: 4, value: 200 },
    { source: 1, target: 2, value: 600 },
    { source: 1, target: 4, value: 200 },
    { source: 2, target: 3, value: 450 },
    { source: 2, target: 5, value: 150 },
  ],
}
</script>

<template>
  <Sankey
    :data="data"
    :width="730"
    :height="360"
    node-fill="#f97316"
    link-fill="#14b8a6"
  >
    <Tooltip :cursor="false" />
  </Sankey>
</template>
