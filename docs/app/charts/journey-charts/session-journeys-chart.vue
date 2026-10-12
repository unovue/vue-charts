<script setup>
import { ref } from 'vue'
import { JourneySankey, Tooltip } from 'vccs'

const journeys = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/', '/docs'], count: 2 },
  { path: ['/', '/pricing', '/docs/self-hosting'], count: 1 },
  { path: ['/', '/pricing', '/features/replay', '/features/analytics'], count: 1 },
  { path: ['/', '/docs'], count: 2 },
  { path: ['/', '/docs', '/pricing', '/signup'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/docs'], count: 2 },
  { path: ['/de', '/de/docs'], count: 1 },
  { path: ['/blog/launch', '/pricing', '/signup', '/onboarding'], count: 2 },
]
const pinned = ref(null)
</script>

<template>
  <div class="w-full space-y-2">
    <JourneySankey
      v-model:pinned="pinned"
      :data="journeys"
      color="#f97316"
    >
      <Tooltip :cursor="false" />
    </JourneySankey>
    <p class="text-xs text-(--color-muted-foreground)">
      {{ pinned ? `Pinned: ${pinned.join(' → ')}` : 'Click a band or page to pin the largest journey through it.' }}
    </p>
  </div>
</template>
