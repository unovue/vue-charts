<script setup lang="ts">
import { scaleBand, scaleLinear, scaleTime } from 'd3-scale'
import { XAxis, YAxis } from '../../index'
import type { AxisProps } from '../../index'

const shared: AxisProps = { tick: false, angle: -45, label: 'Day', name: 'Visits', stroke: 'red', tickSize: 8 }
const numeric = scaleLinear()
const category = scaleBand<string>()
const time = scaleTime()
</script>

<template>
  <XAxis
    v-bind="shared"
    :tick="false"
    :angle="-45"
    label="Day"
  />
  <XAxis
    orientation="top"
    type="category"
    :padding="{ left: 4, right: 8 }"
    :scale="category"
  />
  <XAxis
    type="number"
    padding="gap"
    :scale="numeric"
  />
  <XAxis
    type="number"
    padding="no-gap"
    :scale="time"
  />
  <YAxis
    orientation="right"
    type="number"
    :padding="{ top: 4, bottom: 8 }"
    :scale="numeric"
  />
  <YAxis
    width="auto"
    padding="gap"
  />
  <!-- @vue-expect-error X axes accept only top or bottom. -->
  <XAxis orientation="sideways" />
  <!-- @vue-expect-error Y axes accept only left or right. -->
  <YAxis orientation="top" />
  <!-- @vue-expect-error Axis type is numeric or categorical. -->
  <XAxis type="date" />
  <!-- @vue-expect-error Padding strings have two supported values. -->
  <YAxis padding="wide" />
  <!-- @vue-expect-error Scale names must be supported. -->
  <XAxis scale="made-up" />
</template>
