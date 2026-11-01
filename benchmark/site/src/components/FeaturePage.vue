<script setup lang="ts">
import { computed } from 'vue'
import { alternatives, downloads, excluded, featureColumns, features, featuresCheckedAt } from '../../../features.mjs'
import { libraries } from '../../../libraries.mjs'

const props = defineProps<{
  results: { updatedAt: string, builds: { library: string, build: string, gzipBytes: number, versions: Record<string, string> }[] }
}>()

const cells = features as Record<string, Record<string, { support: string, value: string, source: string }>>
const marks: Record<string, string> = { yes: 'Yes', partial: 'Partial', no: 'No', unknown: 'Unknown' }
const versionOf = (library: { id: string, packages: string[] }) => props.results.builds.find(build => build.library === library.id && build.build === 'default')?.versions[library.packages[0]!]
const suggestions = computed(() => alternatives(props.results, libraries))
const count = (value: number) => value.toLocaleString('en-US')
</script>

<template>
  <section class="section">
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th class="sticky">
              Feature
            </th>
            <th
              v-for="library in libraries"
              :key="library.id"
            >
              {{ library.name }}
              <span class="version">{{ versionOf(library) }}</span>
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="column in featureColumns"
            :key="column.id"
          >
            <th class="sticky">
              {{ column.title }}
              <span class="rule">{{ column.rule }}</span>
            </th>
            <td
              v-for="library in libraries"
              :key="library.id"
            >
              <span
                v-if="column.id !== 'rendering'"
                class="mark"
                :data-support="cells[library.id]![column.id]!.support"
              >{{ marks[cells[library.id]![column.id]!.support] }}</span>
              <a
                :href="cells[library.id]![column.id]!.source"
                target="_blank"
                rel="noopener"
              >{{ cells[library.id]![column.id]!.value }}</a>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint">
      Free editions only. Features checked on {{ featuresCheckedAt }}; sizes measured on {{ results.updatedAt }}. "No" means
      looked for and not found, and each cell links to its source.
    </p>
  </section>

  <section class="section">
    <h2>When another library suits you better</h2>
    <dl class="suggestions">
      <div
        v-for="item in suggestions"
        :key="item.need"
      >
        <dt>{{ item.need }}: <strong>{{ item.suggestion }}</strong></dt>
        <dd>
          {{ item.why }}
          <a
            :href="item.source"
            :target="item.source.startsWith('#') ? undefined : '_blank'"
            rel="noopener"
          >Source</a>
        </dd>
      </div>
    </dl>
  </section>

  <section class="section">
    <h2>How this comparison works</h2>
    <ul>
      <li>Same data, series, axes, legend and tooltip on every card, in idiomatic Vue from each library's docs.</li>
      <li>Each library keeps its default palette and fonts, and shows only what the chart needs.</li>
      <li>Dark mode uses each library's documented approach.</li>
      <li>Free editions only. A library that can't draw a chart gets a placeholder with the reason and a source.</li>
      <li>Versions are pinned and the harness is <a href="https://github.com/unovue/vue-charts/tree/main/benchmark">in the repo</a>, so anyone can reproduce the results.</li>
      <li>Runtime speed at large data sizes is not measured yet.</li>
    </ul>
    <h3>Why these libraries</h3>
    <p>
      Charting libraries usable from Vue and free for commercial use, with npm downloads for {{ downloads.week }}. Downloads are context, not a cutoff: smaller Vue-native libraries are included too.
    </p>
    <div class="scroll narrow">
      <table>
        <tbody>
          <tr
            v-for="library in libraries"
            :key="library.id"
          >
            <th>{{ library.name }}</th>
            <td><code>{{ (downloads.packages as Record<string, { name: string }>)[library.id]!.name }}</code></td>
            <td class="number">
              {{ count((downloads.packages as Record<string, { count: number }>)[library.id]!.count) }}
            </td>
            <td>{{ (downloads.packages as Record<string, { note?: string }>)[library.id]!.note }}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <h3>Left out</h3>
    <ul>
      <li
        v-for="item in excluded"
        :key="item.name"
      >
        <strong>{{ item.name }}</strong> (<code>{{ item.package }}</code>, {{ count(item.count) }}):
        {{ item.reason }} <a
          :href="item.source"
          target="_blank"
          rel="noopener"
        >Source</a>
      </li>
    </ul>
  </section>
</template>

<style scoped>
.section { margin-top: 32px; font-size: 14px; }
.section:first-child { margin-top: 0; }
h2 { margin: 0 0 8px; font-size: 20px; letter-spacing: -0.01em; }
h3 { margin: 20px 0 6px; font-size: 15px; }
p { margin: 0 0 12px; max-width: 80ch; color: var(--ds-muted); }
ul { margin: 0; padding-left: 20px; max-width: 90ch; line-height: 1.7; }
a { color: inherit; }
.scroll { overflow-x: auto; border: 1px solid var(--ds-border); border-radius: 14px; background: var(--ds-surface); }
.narrow { max-width: 720px; }
table { border-collapse: collapse; font-size: 13px; }
th, td { padding: 10px 12px; text-align: left; vertical-align: top; border-bottom: 1px solid var(--ds-border); }
tr:last-child th, tr:last-child td { border-bottom: 0; }
thead th { white-space: nowrap; font-weight: 600; }
tbody td { min-width: 150px; }
.narrow table { width: 100%; }
.narrow td { min-width: 0; }
.number { text-align: right; font-variant-numeric: tabular-nums; }
.sticky { position: sticky; left: 0; z-index: 1; min-width: 200px; max-width: 240px; background: var(--ds-surface); font-weight: 600; }
.version, .rule { display: block; color: var(--ds-muted); font-size: 11px; font-weight: 400; }
.rule { margin-top: 4px; line-height: 1.4; }
.mark { display: block; margin-bottom: 2px; font-size: 11px; font-weight: 600; color: var(--ds-muted); }
.mark[data-support='yes'] { color: #0f8a5f; }
.mark[data-support='partial'] { color: #b7791f; }
.mark[data-support='no'] { color: #c2410c; }
:global(.dark) .mark[data-support='yes'] { color: #34d399; }
:global(.dark) .mark[data-support='partial'] { color: #fbbf24; }
:global(.dark) .mark[data-support='no'] { color: #fb923c; }
.hint { margin-top: 8px; font-size: 12px; }
.suggestions { margin: 0; display: grid; gap: 12px; max-width: 90ch; }
.suggestions dt { font-weight: 500; }
.suggestions dd { margin: 2px 0 0; color: var(--ds-muted); }
</style>
