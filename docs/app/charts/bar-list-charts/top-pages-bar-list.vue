<script setup>
import { BarList } from 'vccs'

const pages = [
  { name: '/', value: 1240, url: '#' },
  { name: '/pricing', value: 820, url: '#' },
  { name: '/docs/getting-started', value: 610, url: '#' },
  { name: '/blog/launch-week', value: 330, url: '#' },
  { name: '/changelog', value: 190, url: '#' },
]
</script>

<template>
  <div class="w-full text-sm">
    <div class="mb-2 flex justify-between text-(--color-muted-foreground)">
      <span>Page</span>
      <span>Visitors</span>
    </div>
    <BarList
      :data="pages"
      href-key="url"
      color="rgb(249 115 22 / 0.18)"
    />
  </div>
</template>
