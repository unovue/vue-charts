<script setup lang="ts">
import { RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

defineProps<{
  title: string
  description: string
  /** Each button runs one data change, so its transition plays. */
  steps: { label: string, run: () => void }[]
}>()

// Remounting replays the entrance with the current data.
const mount = ref(0)
</script>

<template>
  <section class="flex min-w-0 flex-col gap-4 rounded-xl border p-5">
    <header class="flex items-start justify-between gap-3">
      <div class="min-w-0">
        <h3 class="text-sm font-semibold">
          {{ title }}
        </h3>
        <p class="mt-1 text-xs text-muted-foreground text-pretty">
          {{ description }}
        </p>
      </div>
      <Button
        size="sm"
        variant="ghost"
        class="shrink-0"
        @click="mount++"
      >
        <RotateCcw class="size-4" />
        Entrance
      </Button>
    </header>
    <div :key="mount">
      <slot />
    </div>
    <div class="flex flex-wrap gap-2">
      <Button
        v-for="step in steps"
        :key="step.label"
        size="sm"
        variant="outline"
        @click="step.run"
      >
        {{ step.label }}
      </Button>
    </div>
  </section>
</template>
