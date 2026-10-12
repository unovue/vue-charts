<script setup lang="ts">
// usePlotArea is auto-imported by the vccs Nuxt module.
const plot = usePlotArea()
const width: number | undefined = plot.value?.width
</script>

<template>
  <text data-chart="plot-area">
    {{ width }}
  </text>
</template>
