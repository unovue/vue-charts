<script setup lang="ts">
// The numbers and verdicts on the Why vccs page: read from the comparison's own data, so they can't drift from the site.
import { computed } from 'vue'
import { alternatives, featureColumns, features } from '../../../benchmark/features.mjs'
import { libraries } from '../../../benchmark/libraries.mjs'
import results from '../../../benchmark/results/latest.json'

defineProps<{ section: 'sizes' | 'features' | 'alternatives' }>()

const site = 'https://vue-charts-benchmark.zernonia.workers.dev'
const cells = features as Record<string, Record<string, { support: string, value: string, source: string }>>
const nameOf = (id: string) => libraries.find(library => library.id === id)?.name ?? id
const sizes = computed(() => results.builds.filter(build => !build.reference).toSorted((a, b) => a.gzipBytes - b.gzipBytes))
const suggestions = computed(() => alternatives(results, libraries).map(item => ({
  ...item,
  source: item.source.startsWith('#') ? `${site}/${item.source}` : item.source,
})))
const marks: Record<string, string> = { yes: 'Yes', partial: 'Partial', no: 'No', unknown: 'Unknown' }
</script>

<template>
  <div
    v-if="section === 'sizes'"
    class="comparison overflow-x-auto"
  >
    <table>
      <thead>
        <tr>
          <th>Rank</th>
          <th>Library</th>
          <th>Gzipped (KB)</th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="(row, index) in sizes"
          :key="row.library"
        >
          <td>{{ index + 1 }}</td>
          <td>{{ nameOf(row.library) }}</td>
          <td>{{ (row.gzipBytes / 1024).toFixed(1) }}</td>
        </tr>
      </tbody>
    </table>
    <p class="mt-2 text-sm">
      Measured on {{ results.updatedAt }}. vccs alone is {{ ((results.builds.find(build => build.library === 'vccs' && build.reference)?.gzipBytes ?? 0) / 1024).toFixed(1) }} KB when your app already ships motion-v.
    </p>
  </div>
  <div
    v-else-if="section === 'features'"
    class="comparison overflow-x-auto"
  >
    <table>
      <thead>
        <tr>
          <th>Feature</th>
          <th
            v-for="library in libraries"
            :key="library.id"
            class="whitespace-nowrap"
          >
            {{ library.name }}
          </th>
        </tr>
      </thead>
      <tbody>
        <tr
          v-for="column in featureColumns"
          :key="column.id"
        >
          <th class="whitespace-nowrap">
            {{ column.title }}
          </th>
          <td
            v-for="library in libraries"
            :key="library.id"
            class="min-w-24 text-xs"
          >
            <a
              :href="cells[library.id]![column.id]!.source"
              :title="cells[library.id]![column.id]!.value"
              target="_blank"
              rel="noopener"
            >{{ column.id === 'rendering' ? cells[library.id]![column.id]!.value : marks[cells[library.id]![column.id]!.support] }}</a>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
  <ul
    v-else
    class="comparison list-disc space-y-2 pl-5"
  >
    <li
      v-for="item in suggestions"
      :key="item.need"
    >
      <strong>{{ item.need }}: {{ item.suggestion }}.</strong> {{ item.why }} <a
        :href="item.source"
        target="_blank"
        rel="noopener"
      >Source</a>
    </li>
  </ul>
</template>

<style scoped>
.comparison table { width: 100%; border-collapse: collapse; font-size: 14px; }
.comparison th, .comparison td { padding: 6px 12px 6px 0; text-align: left; vertical-align: top; border-bottom: 1px solid var(--ui-border); }
.comparison th { font-weight: 600; }
.comparison a { color: var(--ui-primary); }
</style>
