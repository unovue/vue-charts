<script setup lang="ts">
import { JourneySankey, Tooltip } from 'vccs'
import { Button } from '@/components/ui/button'

const all = [
  { path: ['/', '/pricing'], count: 6 },
  { path: ['/', '/pricing', '/', '/docs'], count: 1 },
  { path: ['/', '/pricing', '/', '/docs/guides/wordpress'], count: 1 },
  { path: ['/', '/pricing', '/docs/self-hosting'], count: 1 },
  { path: ['/', '/pricing', '/features/session-replay', '/features/web-analytics'], count: 1 },
  { path: ['/', '/pricing', '/docs/mcp', '/docs/hiding-own-traffic'], count: 1 },
  { path: ['/', '/docs'], count: 2 },
  { path: ['/', '/docs', '/pricing', '/features/session-replay'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/compare/fathom'], count: 1 },
  { path: ['/de', '/de/pricing', '/de', '/de/pricing'], count: 1 },
  { path: ['/de', '/de/pricing', '/de'], count: 1 },
  { path: ['/de', '/features/web-analytics', '/de/docs/self-hosting', '/de/docs/managing-your-installation'], count: 1 },
  { path: ['/de', '/de/docs/self-hosting'], count: 1 },
  { path: ['/compare/plausible', '/compare/google-analytics', '/compare/posthog', '/compare/umami'], count: 1 },
  { path: ['/de', '/de/for-european-companies', '/de/docs/self-hosting', '/de/docs/managing-your-installation'], count: 1 },
]

const steps = ref(4)
const top = ref(15)
const data = computed(() => [...all].sort((a, b) => b.count - a.count).slice(0, top.value))
const pinned = ref<string[] | null>(null)
</script>

<template>
  <div class="container py-10 space-y-6 [--v-charts-text:var(--muted-foreground)] [--v-charts-inactive:var(--muted-foreground)] [--v-charts-background:var(--background)] [--v-charts-tooltip-background:var(--popover)] [--v-charts-tooltip-foreground:var(--popover-foreground)] [--v-charts-tooltip-border:var(--border)]">
    <div class="max-w-lg">
      <h1 class="text-2xl font-bold tracking-tight">
        Journeys
      </h1>
      <p class="mt-1 text-sm text-muted-foreground">
        Paths from session start. Hover a band or page, click to pin the largest journey through it.
      </p>
    </div>

    <section class="rounded-xl border p-6 space-y-4">
      <div class="flex flex-wrap items-center gap-2">
        <Button
          size="sm"
          variant="outline"
          @click="steps = Math.max(2, steps - 1)"
        >
          − step
        </Button>
        <span class="text-sm tabular-nums">{{ steps }} steps</span>
        <Button
          size="sm"
          variant="outline"
          @click="steps = Math.min(5, steps + 1)"
        >
          + step
        </Button>
        <Button
          size="sm"
          variant="outline"
          @click="top = top === 15 ? 8 : 15"
        >
          Top {{ top === 15 ? 8 : 15 }} paths
        </Button>
        <span
          v-if="pinned"
          class="text-sm text-muted-foreground"
        >Pinned: {{ pinned.join(' → ') }}</span>
        <Button
          v-if="pinned"
          size="sm"
          variant="ghost"
          @click="pinned = null"
        >
          Clear
        </Button>
      </div>
      <JourneySankey
        v-model:pinned="pinned"
        :data="data"
        :steps="steps"
        :node-href="name => `#${name}`"
      >
        <Tooltip :cursor="false" />
      </JourneySankey>
      <div class="flex gap-6 text-xs text-muted-foreground">
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-(--v-charts-series,#2563eb)" />Continued to the next step</span>
        <span class="flex items-center gap-1.5"><span class="size-2 rounded-full bg-muted-foreground" />Ended the session there</span>
      </div>
    </section>
  </div>
</template>
