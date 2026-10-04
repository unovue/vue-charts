<script setup lang="ts">
// DsButton — the cube button recipe as a component (ADR-0002).
// Single source of truth for buttons; variants via prop, tags via to/href.
import { computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = withDefaults(defineProps<{
  variant?: 'solid' | 'ghost'
  to?: string
  href?: string
  type?: 'button' | 'submit' | 'reset'
}>(), {
  variant: 'solid',
  type: 'button',
})

const base = 'relative inline-flex h-8 cursor-pointer touch-manipulation items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-medium leading-none tracking-[-0.01em] no-underline transition-colors duration-(--ds-t-colour) ease-(--ds-ease) [-webkit-tap-highlight-color:transparent] [corner-shape:squircle] before:absolute before:inset-x-0 before:-inset-y-1.5 before:content-[""] active:scale-[0.97] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)'

const variants = {
  solid: 'bg-(--ds-text) text-(--ds-bg) shadow-(--ds-shadow-btn) hover:bg-(--ds-text-2)',
  ghost: 'bg-(--ds-surface) text-(--ds-text) shadow-[inset_0_0_0_1px_var(--ds-border),var(--ds-shadow-btn)] hover:bg-(--ds-block)',
} as const

const classes = computed(() => `${base} ${variants[props.variant]}`)
</script>

<template>
  <NuxtLink
    v-if="to"
    :to="to"
    :class="classes"
    v-bind="$attrs"
  >
    <slot />
  </NuxtLink>
  <a
    v-else-if="href"
    :href="href"
    :class="classes"
    v-bind="$attrs"
  >
    <slot />
  </a>
  <button
    v-else
    :type="type"
    :class="classes"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>
