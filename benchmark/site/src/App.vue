<script setup lang="ts">
import { computed, ref, shallowRef, watchEffect } from 'vue'
import { libraries } from '../../libraries.mjs'
import results from '../../results/latest.json'
import { lineData, randomizeLineData } from './charts/line/data'
import BundleTable from './components/BundleTable.vue'
import ComparisonCard from './components/ComparisonCard.vue'

const dark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
const data = shallowRef(lineData)
const showData = ref(false)

// `data-theme` is how Unovis documents following the page theme; it needs no chart code.
watchEffect(() => {
  document.documentElement.classList.toggle('dark', dark.value)
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
})

const buildFor = (id: string) => results.builds.find(build => build.library === id && build.build === 'default')
const dataJson = computed(() => JSON.stringify(data.value, null, 2))
</script>

<template>
  <main class="page">
    <header class="header">
      <div>
        <h1>Line chart</h1>
        <p>
          One dataset in nine charting libraries for Vue: three smooth lines, axes, a legend, a shared tooltip,
          a crosshair and animation, each in the library's default look. A library that can't do part of this
          says so on its card.
        </p>
      </div>
      <div class="controls">
        <button
          type="button"
          @click="data = randomizeLineData()"
        >
          Randomize data
        </button>
        <button
          type="button"
          :aria-pressed="showData"
          @click="showData = !showData"
        >
          {{ showData ? 'Hide data' : 'Show data' }}
        </button>
        <button
          type="button"
          :aria-pressed="dark"
          @click="dark = !dark"
        >
          {{ dark ? 'Light theme' : 'Dark theme' }}
        </button>
      </div>
    </header>
    <pre
      v-if="showData"
      class="data"
    >{{ dataJson }}</pre>
    <section class="grid">
      <ComparisonCard
        v-for="library in libraries"
        :key="library.id"
        :library="library"
        :build="buildFor(library.id)"
        chart="line"
        :data="data"
        :dark="dark"
      />
    </section>
    <BundleTable :results="results" />
  </main>
</template>

<style scoped>
.page { max-width: 1320px; margin: 0 auto; padding: 32px 16px 64px; }
.header { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.02em; }
p { margin: 0; max-width: 62ch; color: var(--ds-muted); }
.controls { display: flex; flex-wrap: wrap; gap: 8px; }
.data { max-height: 240px; overflow: auto; padding: 12px; border: 1px solid var(--ds-border); border-radius: 14px; font: 12px/1.5 var(--font-mono); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr)); gap: 16px; }
</style>
