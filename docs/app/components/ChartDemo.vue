<script setup lang="ts">
import { useIntersectionObserver } from '@vueuse/core'
import { codeToHtml } from 'shiki'
import { codeDarkTheme, codeLightTheme } from '~/utils/shiki-code-themes'

// Chart demo card (ADR-0008): cube-motion .code recipe — one flat surface
// card with a code-bar header (file icon + filename + Preview/Code tabs +
// copy), CSS-counter line numbers, and a CSS-variable syntax palette so
// light and dark palettes live in this component's styles.
const props = defineProps<{
  name?: string
  description?: string
  src: string
}>()

const activeTab = ref<'preview' | 'code'>('preview')
const root = ref<HTMLElement>()
const isVisible = ref(false)
const isLoading = ref(true)
const loadError = ref('')
const chartComponent = shallowRef<Component | null>(null)
const sourceCode = ref('')
const highlightedCode = ref('')

const filename = computed(() => `${props.src.split('/').pop()}.vue`)

const chartModules = import.meta.glob<{ default: Component }>('~/charts/**/*.vue')
const sourceModules = import.meta.glob<string>('~/charts/**/*.vue', { query: '?raw', import: 'default' })

const moduleKey = computed(() => {
  for (const path of Object.keys(chartModules)) {
    if (path.includes(props.src))
      return path
  }
  return null
})

// Trigger load when scrolled into view
const { stop } = useIntersectionObserver(root, ([entry]) => {
  if (entry?.isIntersecting) {
    isVisible.value = true
    stop()
  }
}, { rootMargin: '200px' })

// Load chart + source once visible
watch(isVisible, async (visible) => {
  if (!visible)
    return
  const key = moduleKey.value
  if (!key) {
    loadError.value = `Chart not found: ${props.src}`
    isLoading.value = false
    return
  }
  try {
    const [mod, raw] = await Promise.all([
      chartModules[key]!(),
      sourceModules[key]!(),
    ])
    chartComponent.value = mod.default
    sourceCode.value = raw
    codeToHtml(raw, {
      lang: 'vue',
      themes: { light: codeLightTheme, dark: codeDarkTheme },
      defaultColor: 'light',
    }).then((html) => { highlightedCode.value = html })
  }
  catch (e) {
    loadError.value = `Failed to load chart: ${props.src}`
  }
  finally { isLoading.value = false }
})

const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
function copyCode() {
  const text = sourceCode.value
  if (navigator.clipboard?.writeText) {
    navigator.clipboard.writeText(text).catch(() => fallbackCopy(text))
  }
  else {
    fallbackCopy(text)
  }
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
}

function fallbackCopy(text: string) {
  const ta = document.createElement('textarea')
  ta.value = text
  ta.style.position = 'fixed'
  ta.style.opacity = '0'
  document.body.appendChild(ta)
  ta.select()
  document.execCommand('copy')
  document.body.removeChild(ta)
}

onBeforeUnmount(() => {
  clearTimeout(copyTimer)
})
</script>

<template>
  <figure
    ref="root"
    class="chart-demo m-0 my-7"
  >
    <!-- Skeleton -->
    <template v-if="!isVisible || isLoading">
      <div class="mb-2.5 space-y-2 px-1">
        <div class="h-5 w-40 rounded bg-(--ds-block) animate-pulse" />
        <div class="h-4 w-64 rounded bg-(--ds-block) animate-pulse" />
      </div>
      <div class="rounded-(--ds-radius-card) bg-(--ds-surface) shadow-[inset_0_0_0_1px_var(--ds-border),var(--ds-shadow-card)] [corner-shape:squircle] overflow-hidden">
        <div class="h-11.25 border-b border-(--ds-border)" />
        <div class="h-80" />
      </div>
    </template>

    <!-- Loaded -->
    <template v-else>
      <figcaption
        v-if="name"
        class="mb-2.5 px-1"
      >
        <h3 class="m-0 text-[15px] font-semibold tracking-[-0.01em] text-(--ds-text)">
          {{ name }}
        </h3>
        <p
          v-if="description"
          class="m-0 mt-0.75 text-[13px] text-(--ds-muted)"
        >
          {{ description }}
        </p>
      </figcaption>

      <div
        v-if="loadError"
        class="rounded-(--ds-radius-card) bg-(--ds-surface) p-5 text-[13px] text-(--ds-muted) shadow-[inset_0_0_0_1px_var(--ds-border),var(--ds-shadow-card)] [corner-shape:squircle]"
      >
        {{ loadError }}
      </div>

      <div
        v-else
        class="rounded-(--ds-radius-card) bg-(--ds-surface) shadow-[inset_0_0_0_1px_var(--ds-border),var(--ds-shadow-card)] [corner-shape:squircle] overflow-hidden"
      >
        <!-- code-bar -->
        <div class="flex items-center gap-2 border-b border-(--ds-border) py-2.5 pl-4.5 pr-3 text-[13px] font-medium tracking-[-0.01em] text-(--ds-text-2)">
          <svg
            class="size-4 shrink-0 text-(--ds-accent)"
            viewBox="0 0 16 16"
            fill="none"
            aria-hidden="true"
          >
            <path
              d="M9.5 1.5h-5a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1v-8l-3-3Z"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
            <path
              d="M9.5 1.5v3h3"
              stroke="currentColor"
              stroke-width="1.2"
              stroke-linejoin="round"
            />
          </svg>
          <span class="truncate font-mono text-xs text-(--ds-muted)">{{ filename }}</span>

          <span
            role="tablist"
            aria-label="Demo view"
            class="ml-2 flex items-center gap-0.5"
          >
            <button
              role="tab"
              :aria-selected="activeTab === 'preview'"
              aria-controls="panel-preview"
              class="h-6.5 cursor-pointer touch-manipulation rounded-full px-2.5 text-[13px] font-medium transition-colors duration-(--ds-t-colour) ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)"
              :class="activeTab === 'preview'
                ? 'bg-(--ds-block) text-(--ds-text)'
                : 'text-(--ds-muted) hover:text-(--ds-text)'"
              @click="activeTab = 'preview'"
            >
              Preview
            </button>
            <button
              role="tab"
              :aria-selected="activeTab === 'code'"
              aria-controls="panel-code"
              class="h-6.5 cursor-pointer touch-manipulation rounded-full px-2.5 text-[13px] font-medium transition-colors duration-(--ds-t-colour) ease-(--ds-ease) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--ds-accent)"
              :class="activeTab === 'code'
                ? 'bg-(--ds-block) text-(--ds-text)'
                : 'text-(--ds-muted) hover:text-(--ds-text)'"
              @click="activeTab = 'code'"
            >
              Code
            </button>
          </span>

          <span
            v-show="activeTab === 'code'"
            class="ml-auto"
          >
            <button
              class="ds-copy"
              :aria-label="copied ? 'Code copied' : 'Copy code'"
              @click="copyCode"
            >
              <svg
                v-if="!copied"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <rect
                  x="4"
                  y="4"
                  width="7"
                  height="7"
                  rx="1.5"
                  stroke="currentColor"
                />
                <path
                  d="M8 4V2.5A1.5 1.5 0 0 0 6.5 1h-4A1.5 1.5 0 0 0 1 2.5v4A1.5 1.5 0 0 0 2.5 8H4"
                  stroke="currentColor"
                />
              </svg>
              <svg
                v-else
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="m2 6.5 2.5 2.5L10 3.5"
                  stroke="currentColor"
                  stroke-width="1.4"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            </button>
          </span>
        </div>

        <div
          v-show="activeTab === 'preview'"
          id="panel-preview"
          role="tabpanel"
          class="flex min-h-80 items-center justify-center p-5"
        >
          <ClientOnly>
            <component
              :is="chartComponent"
              v-if="chartComponent"
            />
          </ClientOnly>
        </div>

        <div
          v-show="activeTab === 'code'"
          id="panel-code"
          role="tabpanel"
        >
          <div
            v-if="highlightedCode"
            class="chart-demo-code"
            v-html="highlightedCode"
          />
          <pre
            v-else
            class="m-0 overflow-auto px-5 py-4.5 font-mono text-[13px] leading-[1.7] text-(--ds-text)"
          ><code>{{ sourceCode }}</code></pre>
        </div>
      </div>
    </template>
  </figure>
</template>

<style scoped>
.chart-demo-code :deep(pre) {
  margin: 0;
  padding: 18px 20px 20px;
  overflow: auto;
  max-height: 26rem;
  background: transparent !important;
  font-family: var(--font-mono);
  font-size: 13px;
  line-height: 1.7;
  tab-size: 2;
}

.chart-demo-code :deep(code) {
  counter-reset: line;
}

.chart-demo-code :deep(.line) {
  counter-increment: line;
}

.chart-demo-code :deep(.line)::before {
  content: counter(line);
  display: inline-block;
  width: 2ch;
  margin-right: 1.5ch;
  text-align: right;
  color: var(--ds-dim);
  user-select: none;
  -webkit-user-select: none;
}

.chart-demo-code :deep(.line:last-child:empty) {
  display: none;
}
</style>

<style>
/* Dark flip. Unscoped (scoped `:global(.dark) .x` compiles to a bare `.dark`)
   and !important (wins over the spans' inline `--shiki-light` color regardless
   of style-tag order). Dual-theme shiki output keeps both colors inline on
   every span, so this rule-match change is the only recalc the flip needs. */
.dark .chart-demo-code .shiki,
.dark .chart-demo-code .shiki span {
  color: var(--shiki-dark) !important;
  background-color: transparent !important;
}
</style>
