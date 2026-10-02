<script setup lang="ts">
// Landing (ADR-0005 layout, ADR-0006 hero card + background): Specimen
// split — copy left, code+chart card right, stat strip below — with a
// morphing area chart rendering live behind the whole page.
// layout/header/footer disabled — the landing uses its own cube-style
// header (LandingHeader); docs pages keep the Docus chrome.
import { onBeforeUnmount, ref } from 'vue'

definePageMeta({ layout: false, header: false })

useSeoMeta({
  title: 'vccs — Vue 3 Charting Components',
  description: 'Composable charting components for Vue 3, ported from Recharts',
})

const copied = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined
function copyInstall() {
  navigator.clipboard?.writeText('npm install vccs')
  copied.value = true
  clearTimeout(timer)
  timer = setTimeout(() => { copied.value = false }, 2000)
}
onBeforeUnmount(() => clearTimeout(timer))

// Hero card's active chart type — the background follows it
const heroChart = ref('area')

const stats = [
  { n: '30+', label: 'chart variants' },
  { n: '07', label: 'categories' },
  { n: '01', label: 'peer dependency' },
  { n: '100%', label: 'typescript' },
]
const appConfig = useAppConfig()
</script>

<template>
  <div class="sp">
    <!-- chart background — parked for now (ADR-0006); re-enable by uncommenting
    <div class="sp-bg">
      <LandingBackground :type="heroChart" />
      <div
        class="sp-bg-wash"
        aria-hidden="true"
      />
    </div>
    -->

    <div class="sp-content">
      <LandingHeader />

      <section class="sp-hero">
        <div class="sp-grid">
          <div class="sp-copy">
            <p
              class="sp-eyebrow sp-rise"
              style="--d: 0ms"
            >
              <span class="sp-dot" />v0.6.0 · vue &gt;= 3.0 · mit
            </p>
            <h1
              class="sp-title sp-rise"
              style="--d: 70ms"
            >
              Composable charting components for Vue&nbsp;3.
            </h1>
            <p
              class="sp-lede sp-rise"
              style="--d: 140ms"
            >
              An unofficial port of Recharts — React's most popular charting
              library, rebuilt for the Vue ecosystem.
            </p>
            <div
              class="sp-actions sp-rise"
              style="--d: 210ms"
            >
              <DsButton
                variant="solid"
                to="/getting-started/introduction"
              >
                Get Started →
              </DsButton>
              <DsButton
                variant="ghost"
                :href="appConfig.github.url"
                target="_blank"
                rel="noopener"
              >
                GitHub
              </DsButton>
              <span class="ds-pill">
                <i>$</i> npm install vccs
                <button
                  class="ds-copy"
                  :aria-label="copied ? 'Copied' : 'Copy install command'"
                  @click="copyInstall"
                >
                  <span class="sp-faces">
                    <UIcon
                      name="i-lucide-copy"
                      class="sp-face"
                      :class="{ 'sp-face-off': copied }"
                    />
                    <UIcon
                      name="i-lucide-check"
                      class="sp-face sp-face-check"
                      :class="{ 'sp-face-off': !copied }"
                    />
                  </span>
                </button>
              </span>
            </div>
          </div>

          <LandingCodeCard v-model:active="heroChart" />
        </div>
      </section>

      <!-- stat strip — hidden for now; re-enable by uncommenting
      <section class="sp-stats">
        <div
          v-for="(s, i) in stats"
          :key="s.label"
          class="sp-stat sp-rise"
          :style="{ '--d': `${350 + i * 70}ms` }"
        >
          <span class="sp-stat-n">{{ s.n }}</span>
          <span class="sp-stat-label">{{ s.label }}</span>
        </div>
      </section>
      -->
    </div>
  </div>
</template>

<style scoped>
.sp {
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--font-sans);
  min-height: 100dvh;
  -webkit-font-smoothing: antialiased;
}

/* chart background — right-side region behind the card, not full-bleed;
   wash for legibility; right inset keeps the edge off the viewport */
.sp-bg {
  position: fixed;
  inset: 0 64px 0 42%;
  z-index: 0;
  pointer-events: none;
}
.sp-bg-wash {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(to bottom, var(--ds-bg) 0%, transparent 30%, transparent 70%, var(--ds-bg) 100%),
    linear-gradient(to right, var(--ds-bg) 0%, transparent 55%);
}
.sp-content {
  position: relative;
  z-index: 1;
}

.sp-rise {
  animation: sp-rise var(--ds-enter) var(--ds-ease) both;
  animation-delay: var(--d, 0ms);
}
@keyframes sp-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}

.sp-hero {
  display: flex;
  align-items: center;
  min-height: calc(100dvh - 108px);
  padding: 3rem 1.5rem 2rem;
}
.sp-grid {
  display: grid;
  grid-template-columns: 5fr 7fr;
  gap: 3rem;
  align-items: center;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
}

.sp-eyebrow {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ds-muted);
  margin: 0 0 1.75rem;
  padding: 0.375rem 0.75rem;
  background: var(--ds-surface);
  border-radius: var(--ds-radius-pill);
  corner-shape: squircle;
  box-shadow: inset 0 0 0 1px var(--ds-border);
}
.sp-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ds-accent);
}

.sp-title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 1.25rem;
  text-wrap: balance;
}
.sp-lede {
  font-size: 17px;
  line-height: 1.6;
  color: var(--ds-muted);
  max-width: 30rem;
  margin: 0 0 2.25rem;
  text-wrap: pretty;
}

.sp-actions {
  display: flex;
  gap: 0.625rem;
  flex-wrap: wrap;
  align-items: center;
}

/* copy icon crossfade — cube's face morph on the shared ease */
.sp-faces {
  position: relative;
  display: grid;
  place-items: center;
  width: 12px;
  height: 12px;
}
.sp-face {
  position: absolute;
  inset: 0;
  transition: opacity var(--ds-t-colour) var(--ds-ease), transform var(--ds-t-colour) var(--ds-ease);
}
.sp-face-check { color: var(--ds-accent-strong); }
.sp-face-off {
  opacity: 0;
  transform: scale(0.6);
}

/* stats */
.sp-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 1rem;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 1.5rem 5rem;
}
.sp-stat {
  background: var(--ds-surface);
  border-radius: var(--ds-radius-card);
  padding: 1.5rem;
  box-shadow: var(--ds-shadow-card);
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.sp-stat-n {
  font-family: var(--font-mono);
  font-size: 1.75rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  font-variant-numeric: tabular-nums;
}
.sp-stat-label { font-size: 13px; color: var(--ds-muted); }

@media (max-width: 900px) {
  .sp-grid { grid-template-columns: 1fr; gap: 2.5rem; }
  .sp-stats { grid-template-columns: repeat(2, 1fr); }
  .sp-bg { inset: 0; }
}

@media (prefers-reduced-motion: reduce) {
  .sp-rise { animation: none; }
  .sp-face { transition: none; }
}
</style>
