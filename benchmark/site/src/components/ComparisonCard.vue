<script setup lang="ts">
import type { Component } from 'vue'
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, shallowRef, watch } from 'vue'

interface Build {
  gzipBytes: number
  minBytes: number
  label: string
}

const props = defineProps<{
  library: { id: string, name: string, renderer: string, docs: string, packages: string[] }
  limit?: { unsupported?: boolean, note?: string, noteSource?: string }
  build?: Build
  version?: string
  chart: string
  data: unknown
  dark: boolean
}>()

const charts = import.meta.glob<{ default: Component }>('../charts/*/*.vue')
const sources = import.meta.glob<string>('../charts/*/*.vue', { query: '?raw', import: 'default' })
const path = computed(() => `../charts/${props.chart}/${props.library.id}.vue`)

const root = ref<HTMLElement>()
const tab = ref<'preview' | 'code'>('preview')
const chart = shallowRef<Component>()
const code = ref('')
let observer: IntersectionObserver | undefined

onMounted(() => {
  if (props.limit?.unsupported)
    return
  observer = new IntersectionObserver(([entry]) => {
    if (entry?.isIntersecting) {
      chart.value = defineAsyncComponent(charts[path.value]!)
      observer?.disconnect()
    }
  }, { rootMargin: '200px' })
  observer.observe(root.value!)
})
onBeforeUnmount(() => observer?.disconnect())

watch(tab, async (value) => {
  if (value !== 'code' || code.value)
    return
  const [{ createHighlighterCore }, { createJavaScriptRegexEngine }, raw] = await Promise.all([
    import('shiki/core'),
    import('shiki/engine/javascript'),
    sources[path.value]!(),
  ])
  const highlighter = await createHighlighterCore({
    themes: [import('@shikijs/themes/github-light'), import('@shikijs/themes/github-dark')],
    langs: [import('@shikijs/langs/vue')],
    engine: createJavaScriptRegexEngine(),
  })
  code.value = highlighter.codeToHtml(raw, { lang: 'vue', themes: { light: 'github-light', dark: 'github-dark' }, defaultColor: 'light' })
})

const size = computed(() => props.build && `${(props.build.gzipBytes / 1024).toFixed(1)} KB gzip`)
</script>

<template>
  <article
    ref="root"
    class="card"
    :data-compare-card="library.id"
    :data-rendered="chart ? 'true' : 'false'"
  >
    <header class="top">
      <div>
        <a
          :href="library.docs"
          class="name"
          target="_blank"
          rel="noopener"
        >{{ library.name }}</a>
        <span
          v-if="version"
          class="meta"
        > {{ version }}</span>
        <div class="meta">
          {{ library.renderer }}<template v-if="size">
            · <span :title="build?.label">{{ size }}</span>
          </template>
        </div>
      </div>
      <div
        v-if="!limit?.unsupported"
        class="tabs"
        role="tablist"
      >
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'preview'"
          :class="{ active: tab === 'preview' }"
          @click="tab = 'preview'"
        >
          Preview
        </button>
        <button
          type="button"
          role="tab"
          :aria-selected="tab === 'code'"
          :class="{ active: tab === 'code' }"
          @click="tab = 'code'"
        >
          Code
        </button>
      </div>
    </header>
    <p
      v-if="limit?.unsupported"
      class="missing"
    >
      Not available in this library.
    </p>
    <!-- v-show keeps the chart alive so returning to Preview does not replay its entrance. -->
    <div
      v-if="!limit?.unsupported"
      v-show="tab === 'preview'"
      class="stage"
    >
      <component
        :is="chart"
        v-if="chart"
        :data="data"
        :dark="dark"
      />
    </div>
    <div
      v-if="tab === 'code'"
      class="code"
      v-html="code"
    />
    <p
      v-if="limit?.note"
      class="note"
    >
      {{ limit.note }}
      <a
        v-if="limit.noteSource"
        :href="limit.noteSource"
        target="_blank"
        rel="noopener"
      >Source</a>
    </p>
  </article>
</template>

<style scoped>
.card { display: flex; flex-direction: column; min-width: 0; padding: 14px; border: 1px solid var(--ds-border); border-radius: 18px; background: var(--ds-surface); }
.top { display: flex; justify-content: space-between; gap: 8px; margin-bottom: 10px; }
.name { font-weight: 600; color: inherit; text-decoration: none; }
.name:hover { text-decoration: underline; }
.meta { font-size: 12px; color: var(--ds-muted); }
.name + .meta { margin-left: 6px; }
.tabs { display: flex; gap: 4px; align-items: flex-start; }
.tabs button { padding: 2px 10px; font-size: 12px; }
.tabs .active { background: var(--ds-block); }
.stage { min-height: 300px; min-width: 0; position: relative; font-size: 12px; }
.code { height: 300px; overflow: hidden; }
.note { margin: 8px 0 0; font-size: 12px; color: var(--ds-muted); }
.note a { color: inherit; }
.missing { display: grid; place-items: center; flex: 1; min-height: 120px; margin: 0; border: 1px dashed var(--ds-border); border-radius: 12px; font-size: 13px; color: var(--ds-muted); }
</style>
