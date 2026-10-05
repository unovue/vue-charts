<script setup lang="ts" generic="E extends string">
import { RotateCcw } from 'lucide-vue-next'
import { Button } from '@/components/ui/button'

export interface EntranceOption<E> {
  id: E
  name: string
  description: string
  current?: boolean
}

defineProps<{
  title: string
  description: string
  options: EntranceOption<E>[]
  /** Changes to replay every card at once. */
  replayAll: number
  /** Tailwind grid columns for the cards. */
  columns?: string
}>()

defineSlots<{ default: (props: { entrance: E }) => any }>()

// Remounting a card replays its entrance; the library starts it once the chart is on screen.
const mounts = ref<Record<string, number>>({})
function replay(id: string) { mounts.value = { ...mounts.value, [id]: (mounts.value[id] ?? 0) + 1 } }
</script>

<template>
  <section class="space-y-3">
    <div class="max-w-2xl">
      <h3 class="text-base font-semibold">
        {{ title }}
      </h3>
      <p class="mt-1 text-sm text-muted-foreground text-pretty">
        {{ description }}
      </p>
    </div>
    <div
      class="grid gap-4"
      :class="columns ?? 'sm:grid-cols-2 xl:grid-cols-3'"
    >
      <article
        v-for="option in options"
        :key="option.id"
        class="flex min-w-0 flex-col gap-3 rounded-xl border p-4"
      >
        <header class="flex items-start justify-between gap-3">
          <div class="min-w-0">
            <h4 class="flex items-center gap-2 text-sm font-semibold">
              {{ option.name }}
              <span
                v-if="option.current"
                class="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
              >current</span>
            </h4>
            <p class="mt-1 text-xs text-muted-foreground text-pretty">
              {{ option.description }}
            </p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            class="size-8 shrink-0"
            :aria-label="`Replay ${option.name}`"
            @click="replay(option.id)"
          >
            <RotateCcw class="size-4" />
          </Button>
        </header>
        <div
          :key="`${replayAll}-${mounts[option.id] ?? 0}`"
          class="mt-auto"
        >
          <slot :entrance="option.id" />
        </div>
      </article>
    </div>
  </section>
</template>
