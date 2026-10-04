<script setup>
import { Tooltip, Tracker } from 'vccs'

const results = ['passed', 'passed', 'failed', 'passed', 'passed', 'passed', 'skipped', 'passed', 'failed', 'passed']
const data = Array.from({ length: 40 }, (_, i) => ({
  build: `#${1200 + i}`,
  result: results[(i * 3) % results.length],
}))
</script>

<template>
  <Tracker
    :data="data"
    data-key="result"
    name-key="build"
    :height="24"
    :gap="3"
    :radius="12"
    :colors="{ passed: '#14b8a6', failed: '#f97316', skipped: '#f59e0b' }"
    :labels="{ passed: 'Passed', failed: 'Failed', skipped: 'Skipped' }"
  >
    <Tooltip :cursor="false" />
  </Tracker>
</template>
