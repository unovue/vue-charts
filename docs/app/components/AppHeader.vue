<script setup lang="ts">
// Overrides the Docus layer's AppHeader by component name (ADR-0008).
// The universal site header lives in LandingHeader.vue — one header for
// landing and docs. Docus's search modal and app shell are untouched.
</script>

<template>
  <LandingHeader />
</template>
