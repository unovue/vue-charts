<script setup lang="ts">
import { computed } from 'vue'
import { libraries, reference } from '../../../libraries.mjs'

const props = defineProps<{
  results: {
    updatedAt: string
    settings: Record<string, unknown>
    builds: { library: string, build: string, label: string, reference: boolean, minBytes: number, gzipBytes: number, viteGzipBytes: number | null, versions: Record<string, string> }[]
  }
}>()

const nameOf = (id: string) => [...libraries, reference].find(library => library.id === id)?.name ?? id
const kb = (bytes: number | null) => bytes == null ? '–' : (bytes / 1024).toFixed(1)
const rows = computed(() => [...props.results.builds].sort((a, b) => Number(a.reference) - Number(b.reference) || a.gzipBytes - b.gzipBytes))
</script>

<template>
  <section class="sizes">
    <h2>Bundle size</h2>
    <p>
      First-load JavaScript and CSS for this exact chart, with Vue external (React for Recharts) and each library
      installed from its own lockfile. Measured on {{ results.updatedAt }} with esbuild
      ({{ results.settings.esbuild }}, minified, gzip level 9), cross-checked with Vite {{ results.settings.vite }}, which
      bundles with Rolldown. Vite's numbers run higher, so compare within a column.
    </p>
    <div class="scroll">
      <table>
        <thead>
          <tr>
            <th>Library</th>
            <th>What was bundled</th>
            <th class="number">
              Minified (KB)
            </th>
            <th class="number">
              Gzipped (KB)
            </th>
            <th class="number">
              Vite gzipped (KB)
            </th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="row in rows"
            :key="`${row.library}-${row.build}`"
            :class="{ reference: row.reference }"
          >
            <td>{{ nameOf(row.library) }}</td>
            <td>{{ row.label }}</td>
            <td class="number">
              {{ kb(row.minBytes) }}
            </td>
            <td class="number">
              <strong>{{ kb(row.gzipBytes) }}</strong>
            </td>
            <td class="number">
              {{ kb(row.viteGzipBytes) }}
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <p class="hint">
      Faded rows are references, not part of the ranking.
    </p>
  </section>
</template>

<style scoped>
.sizes { margin-top: 40px; }
h2 { margin: 0 0 6px; font-size: 20px; letter-spacing: -0.01em; }
p { margin: 0 0 12px; max-width: 80ch; color: var(--ds-muted); font-size: 14px; }
.scroll { overflow-x: auto; border: 1px solid var(--ds-border); border-radius: 14px; background: var(--ds-surface); }
table { width: 100%; border-collapse: collapse; font-size: 13px; }
th, td { padding: 8px 12px; text-align: left; border-bottom: 1px solid var(--ds-border); }
tr:last-child td { border-bottom: 0; }
th { font-weight: 600; white-space: nowrap; }
.number { text-align: right; font-variant-numeric: tabular-nums; white-space: nowrap; }
.reference td { color: var(--ds-muted); }
.hint { margin-top: 8px; font-size: 12px; }
</style>
