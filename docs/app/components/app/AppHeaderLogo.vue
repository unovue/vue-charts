<script setup lang="ts">
const appConfig = useAppConfig()
</script>

<template>
  <div class="flex items-center gap-2">
    <img
      :src="appConfig.header?.logo?.light || '/logo.svg'"
      :alt="appConfig.header?.logo?.alt || 'vccs logo'"
      class="size-10 shrink-0"
    >
    <span class="text-2xl font-bold">{{ appConfig.header?.title }}</span>
  </div>
</template>
