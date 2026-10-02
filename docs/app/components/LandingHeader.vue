<script setup lang="ts">
// Landing-only header — cube-motion's .top recipe (ADR-0003).
// Docs pages keep the Docus chrome; this renders only on the landing page.
// Styles are Tailwind utilities on --ds-* tokens (project rule).
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const iconBtn = 'relative grid h-7 w-7 cursor-pointer touch-manipulation place-items-center rounded-full bg-(--ds-surface) p-0 text-(--ds-muted) shadow-[inset_0_0_0_1px_var(--ds-border),0_1px_2px_rgba(0,0,0,0.06)] transition-colors duration-(--ds-t-colour) ease-(--ds-ease) [-webkit-tap-highlight-color:transparent] [corner-shape:squircle] before:absolute before:-inset-1.5 before:content-[""] hover:bg-(--ds-block) hover:text-(--ds-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)'
const appConfig = useAppConfig()
</script>

<template>
  <header class="mx-auto flex max-w-[1080px] items-center justify-between px-6 pt-7">
    <NuxtLink
      class="inline-flex items-center gap-1.5 text-[15px] font-semibold tracking-[-0.02em] text-(--ds-text) no-underline"
      to="/"
    >
      <img
        src="/logo.svg"
        alt=""
        width="16"
        height="16"
        class="block"
      >vccs
    </NuxtLink>
    <div class="flex items-center gap-2.5">
      <nav
        class="flex items-center gap-3.5 text-[13px] font-medium text-(--ds-muted) max-[700px]:hidden"
        aria-label="Main navigation"
      >
        <NuxtLink
          class="text-inherit no-underline transition-colors duration-(--ds-t-colour) ease-(--ds-ease) hover:text-(--ds-text) focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--ds-accent)"
          to="/getting-started/introduction"
        >
          Docs
        </NuxtLink>
        <NuxtLink
          class="text-inherit no-underline transition-colors duration-(--ds-t-colour) ease-(--ds-ease) hover:text-(--ds-text) focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--ds-accent)"
          to="/charts/area-chart"
        >
          Charts
        </NuxtLink>
      </nav>
      <button
        :class="iconBtn"
        class="flex items-center justify-center"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        @click="toggleTheme"
      >
        <span class="relative flex size-4 items-center justify-center">
          <UIcon
            name="i-lucide-sun"
            class="absolute inset-0 transition-[opacity,transform] duration-(--ds-t-colour) ease-(--ds-ease)"
            :class="{ 'scale-60 opacity-0': !isDark }"
          />
          <UIcon
            name="i-lucide-moon"
            class="absolute inset-0 transition-[opacity,transform] duration-(--ds-t-colour) ease-(--ds-ease)"
            :class="{ 'scale-60 opacity-0': isDark }"
          />
        </span>
      </button>
      <DsButton
        variant="ghost"
        :href="appConfig.github.url"
        target="_blank"
        rel="noopener"
        class="[&_svg]:h-3.5 [&_svg]:w-3.5"
      >
        <UIcon name="i-simple-icons-github" />GitHub
      </DsButton>
    </div>
  </header>
</template>

<style scoped>
/* entrance only — header is beat 0 of the hero stagger */
header {
  animation: lh-rise var(--ds-enter) var(--ds-ease) both;
}
@keyframes lh-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  header { animation: none; }
}
</style>
