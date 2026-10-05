<script setup lang="ts">
import { AreaChart as AreaChartIcon, BarChart3, CircleDot, LineChart as LineChartIcon, MessageSquare, Moon, PieChart as PieChartIcon, Radar as RadarIcon, Sun } from 'lucide-vue-next'

const colorMode = useColorMode()
const route = useRoute()

// Page name from the route, e.g. /bar-charts → "Bar Charts".
useHead({
  title: () => route.path === '/'
    ? 'vccs playground'
    : `${route.path.slice(1).split('-').map(word => word[0]!.toUpperCase() + word.slice(1)).join(' ')} · vccs playground`,
})

function toggleColorMode() {
  colorMode.preference = colorMode.value === 'dark' ? 'light' : 'dark'
}

const navLinks = [
  { path: '/bar-charts', name: 'Bar Charts', icon: BarChart3 },
  { path: '/area', name: 'Area Charts', icon: AreaChartIcon },
  { path: '/line-charts', name: 'Line Charts', icon: LineChartIcon },
  { path: '/pie-charts', name: 'Pie Charts', icon: PieChartIcon },
  { path: '/radar-charts', name: 'Radar Charts', icon: RadarIcon },
  { path: '/radial-charts', name: 'Radial Charts', icon: CircleDot },
  { path: '/tooltip-charts', name: 'Tooltips', icon: MessageSquare },
]
</script>

<template>
  <div class="min-h-screen bg-background text-foreground">
    <header class="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div class="container flex h-14 items-center">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold tracking-tight"
        >
          <BarChart3 class="size-5" />
          <span class="hidden sm:inline">vccs playground</span>
        </NuxtLink>

        <div class="mx-3 h-4 w-px shrink-0 bg-border sm:mx-4" />

        <nav class="flex min-w-0 items-center gap-1 overflow-x-auto [scrollbar-width:none]">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.path"
            :to="link.path"
          >
            <Button
              variant="ghost"
              size="sm"
              :aria-label="link.name"
              :class="[
                route.path === link.path
                  ? 'bg-accent text-accent-foreground'
                  : 'text-muted-foreground',
              ]"
            >
              <component
                :is="link.icon"
                class="size-4"
              />
              <span class="hidden xl:inline">{{ link.name }}</span>
            </Button>
          </NuxtLink>
        </nav>

        <div class="ml-auto shrink-0 pl-2">
          <ClientOnly>
            <Button
              variant="ghost"
              size="icon-sm"
              aria-label="Toggle theme"
              @click="toggleColorMode"
            >
              <Sun
                v-if="colorMode.value === 'dark'"
                class="size-4"
              />
              <Moon
                v-else
                class="size-4"
              />
            </Button>
            <template #fallback>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Toggle theme"
                disabled
              >
                <Sun class="size-4" />
              </Button>
            </template>
          </ClientOnly>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>
  </div>
</template>
