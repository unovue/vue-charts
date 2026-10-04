<script setup>
import { Label, PolarAngleAxis, RadialBar, RadialBarChart } from 'vccs'

const value = 72
</script>

<template>
  <RadialBarChart
    :height="220"
    :data="[{ name: 'Goal', value, fill: '#14b8a6' }]"
    :start-angle="210"
    :end-angle="-30"
    :inner-radius="78"
    :outer-radius="100"
  >
    <PolarAngleAxis
      type="number"
      :domain="[0, 100]"
      :tick="false"
    />
    <RadialBar
      data-key="value"
      background
      :corner-radius="12"
    >
      <Label
        position="center"
        :value="`${value}%`"
        class="fill-(--color-foreground) text-3xl font-semibold"
      />
    </RadialBar>
  </RadialBarChart>
</template>
