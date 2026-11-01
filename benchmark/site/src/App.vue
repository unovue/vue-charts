<script setup lang="ts">
import { computed, ref, shallowRef, watch, watchEffect } from 'vue'
import { charts, libraries } from '../../libraries.mjs'
import results from '../../results/latest.json'
import { datasets } from './charts/datasets'
import BundleTable from './components/BundleTable.vue'
import ComparisonCard from './components/ComparisonCard.vue'

const dark = ref(window.matchMedia('(prefers-color-scheme: dark)').matches)
const showData = ref(false)

// `data-theme` is how Unovis documents following the page theme; it needs no chart code.
watchEffect(() => {
  document.documentElement.classList.toggle('dark', dark.value)
  document.documentElement.dataset.theme = dark.value ? 'dark' : 'light'
})

// One page per chart at #/<id>. `?only=<library>` keeps one card, so compare-cards.mjs can watch it alone.
const route = ref(window.location.hash.slice(2))
window.addEventListener('hashchange', () => { route.value = window.location.hash.slice(2) })
const chart = computed(() => charts.find(item => item.id === route.value) ?? charts[0]!)
const only = new URLSearchParams(window.location.search).get('only')
const limitOf = (library: { limits?: Record<string, unknown> }) => library.limits?.[chart.value.id] as { unsupported?: boolean, note?: string, noteSource?: string } | undefined
// Libraries that can draw this chart come first; the order is otherwise the same on each page.
const shown = computed(() => libraries
  .filter(library => !only || library.id === only)
  .toSorted((a, b) => Number(limitOf(a)?.unsupported ?? false) - Number(limitOf(b)?.unsupported ?? false)))
const drawing = computed(() => libraries.filter(library => !limitOf(library)?.unsupported).length)

const dataset = computed(() => datasets[chart.value.id]!)
const data = shallowRef(dataset.value.rows)
watch(dataset, (value) => { data.value = value.rows })

const buildFor = (id: string) => results.builds.find(build => build.library === id && build.build === 'default')
const dataJson = computed(() => JSON.stringify(data.value, null, 2))
</script>

<template>
  <main class="page">
    <header class="header">
      <div>
        <nav class="nav">
          <a
            v-for="item in charts"
            :key="item.id"
            :href="`#/${item.id}`"
            :aria-current="item.id === chart.id ? 'page' : undefined"
          >{{ item.title }}</a>
        </nav>
        <h1>{{ chart.title }} chart</h1>
        <p>
          One dataset in {{ drawing }} of {{ libraries.length }} charting libraries for Vue: {{ chart.description }},
          each in the library's default look. A library that can't do part of this says so on its card.
        </p>
      </div>
      <div class="controls">
        <button
          type="button"
          @click="data = dataset.randomize()"
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
        v-for="library in shown"
        :key="`${chart.id}-${library.id}`"
        :library="library"
        :limit="limitOf(library)"
        :build="chart.id === 'line' ? buildFor(library.id) : undefined"
        :version="buildFor(library.id)?.versions[library.packages[0]!]"
        :chart="chart.id"
        :data="data"
        :dark="dark"
      />
    </section>
    <BundleTable
      v-if="chart.id === 'line'"
      :results="results"
    />
    <p
      v-else
      class="sizes"
    >
      Bundle sizes are measured once, on the <a href="#/line">line chart</a>.
    </p>
  </main>
</template>

<style scoped>
.page { max-width: 1320px; margin: 0 auto; padding: 32px 16px 64px; }
.header { display: flex; flex-wrap: wrap; gap: 16px; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
h1 { margin: 0 0 6px; font-size: 28px; letter-spacing: -0.02em; }
p { margin: 0; max-width: 62ch; color: var(--ds-muted); }
.nav { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 16px; font-size: 14px; }
.nav a { color: var(--ds-muted); text-decoration: none; }
.nav a[aria-current] { color: inherit; font-weight: 600; }
.sizes { margin-top: 24px; font-size: 14px; }
.sizes a { color: inherit; }
.controls { display: flex; flex-wrap: wrap; gap: 8px; }
.data { max-height: 240px; overflow: auto; padding: 12px; border: 1px solid var(--ds-border); border-radius: 14px; font: 12px/1.5 var(--font-mono); }
.grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 400px), 1fr)); gap: 16px; }
</style>
