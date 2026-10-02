<script setup lang="ts">
// Universal site header (ADR-0008) — the ONE header for landing and docs.
// Cube .top recipe: in-flow, no bar. Includes ⌘K search (UContentSearchButton
// opens the Docus search modal, which lives in the Docus app shell), theme
// toggle, GitHub, and a mobile menu carrying the docs navigation tree.
import { computed, ref, watch } from 'vue'

const appConfig = useAppConfig()
const colorMode = useColorMode()
const isDark = computed(() => colorMode.value === 'dark')
function toggleTheme() {
  colorMode.preference = isDark.value ? 'light' : 'dark'
}

const links = [
  { label: 'Docs', to: '/getting-started/introduction' },
  { label: 'Charts', to: '/charts/area-chart' },
]

// Docs navigation tree, provided by the Docus app shell
const navigation = inject<any>('navigation', null)

const menuOpen = ref(false)
const route = useRoute()
watch(() => route.path, () => { menuOpen.value = false })

const iconBtn = 'relative grid h-7 w-7 cursor-pointer touch-manipulation place-items-center rounded-full bg-(--ds-surface) p-0 text-(--ds-muted) shadow-[inset_0_0_0_1px_var(--ds-border),0_1px_2px_rgba(0,0,0,0.06)] transition-colors duration-(--ds-t-colour) ease-(--ds-ease) [-webkit-tap-highlight-color:transparent] [corner-shape:squircle] before:absolute before:-inset-1.5 before:content-[""] hover:bg-(--ds-block) hover:text-(--ds-text) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)'
const navLink = 'text-inherit no-underline transition-colors duration-(--ds-t-colour) ease-(--ds-ease) hover:text-(--ds-text) focus-visible:rounded-[3px] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-(--ds-accent)'
</script>

<template>
  <header class="sticky top-0 z-50 bg-(--ds-bg)/80 backdrop-blur-md">
    <div class="relative mx-auto flex  items-center justify-between px-8 py-3">
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
        >vue-charts
      </NuxtLink>

      <div class="flex items-center gap-2.5">
        <!-- ⌘K search — opens the Docus search modal -->
        <UContentSearchButton
          collapsed
          icon="i-lucide-command"
          color="neutral"
          variant="ghost"
          tooltip
          aria-label="Search (⌘K)"
          class="cursor-pointer [&_svg]:size-4"
        />

        <nav
          class="flex items-center gap-3.5 text-[13px] font-medium text-(--ds-muted) max-lg:hidden"
          aria-label="Main navigation"
        >
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            :class="navLink"
          >
            {{ l.label }}
          </NuxtLink>
        </nav>

        <button
          :class="iconBtn"
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

        <!-- mobile menu -->
        <button
          class="lg:hidden"
          :class="[iconBtn]"
          :aria-label="menuOpen ? 'Close menu' : 'Open menu'"
          :aria-expanded="menuOpen"
          @click="menuOpen = !menuOpen"
        >
          <UIcon :name="menuOpen ? 'i-lucide-x' : 'i-lucide-menu'" />
        </button>
      </div>

      <!-- mobile menu panel -->
      <div
        v-if="menuOpen"
        class="absolute inset-x-4 top-full mt-2 rounded-(--ds-radius-card) bg-(--ds-surface) p-4 shadow-(--ds-shadow-card) lg:hidden"
      >
        <nav class="flex flex-col gap-0.5 font-mono text-[13px]">
          <NuxtLink
            v-for="l in links"
            :key="l.to"
            :to="l.to"
            class="rounded-md px-2 py-1.5 font-semibold text-(--ds-text) no-underline hover:bg-(--ds-block)"
          >
            {{ l.label }}
          </NuxtLink>
          <template v-if="navigation">
            <div
              v-for="group in navigation"
              :key="group.title"
              class="mt-3"
            >
              <p class="px-2 text-[11px] text-(--ds-dim)">
                {{ group.title }}
              </p>
              <NuxtLink
                v-for="child in group.children"
                :key="child.path"
                :to="child.path"
                class="block rounded-md px-2 py-1 text-(--ds-muted) no-underline hover:bg-(--ds-block) hover:text-(--ds-text)"
              >
                {{ child.title }}
              </NuxtLink>
            </div>
          </template>
        </nav>
      </div>
    </div>
  </header>
</template>
