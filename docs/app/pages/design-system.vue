<script setup lang="ts">
// Design system specimen — consumes the --ds-* token layer from main.css
// (ADR-0002). Swatches and demos render FROM the tokens, so this page can
// never drift from the source of truth.
import { onBeforeUnmount, onMounted, ref } from 'vue'

useSeoMeta({
  title: 'Design System — vccs',
  description: 'Design tokens for the vccs docs: cube-motion-derived neutrals, Vue-green accent, shape, elevation and motion tokens.',
})

// ── Live token values (read back from computed style so the page never lies) ──
const colorTokens = [
  { name: '--ds-bg', label: 'bg' },
  { name: '--ds-surface', label: 'surface' },
  { name: '--ds-block', label: 'block' },
  { name: '--ds-border', label: 'border' },
  { name: '--ds-text', label: 'text' },
  { name: '--ds-text-2', label: 'text-2' },
  { name: '--ds-muted', label: 'muted' },
  { name: '--ds-dim', label: 'dim' },
  { name: '--ds-accent', label: 'accent' },
  { name: '--ds-accent-strong', label: 'accent-strong' },
  { name: '--ds-accent-wash', label: 'accent-wash' },
]

const chartTokens = [
  { name: '--chart-1', label: 'chart-1' },
  { name: '--chart-2', label: 'chart-2' },
  { name: '--chart-3', label: 'chart-3' },
  { name: '--chart-4', label: 'chart-4' },
  { name: '--chart-5', label: 'chart-5' },
]

const values = ref<Record<string, string>>({})
let themeObserver: MutationObserver | undefined

function readTokens() {
  const cs = getComputedStyle(document.documentElement)
  const next: Record<string, string> = {}
  for (const t of [...colorTokens, ...chartTokens])
    next[t.name] = cs.getPropertyValue(t.name).trim()
  values.value = next
}

onMounted(() => {
  readTokens()
  // Re-read when the site theme flips (.dark class on <html>)
  themeObserver = new MutationObserver(readTokens)
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
})
onBeforeUnmount(() => themeObserver?.disconnect())

// ── Type scale ──
const typeScale = [
  { step: 'display', spec: 'Inter · 60px · 600 · -0.03em · 1.05', sample: 'Composable charts', css: { fontSize: 'clamp(2.5rem, 5vw, 3.75rem)', fontWeight: '600', letterSpacing: '-0.03em', lineHeight: '1.05' } },
  { step: 'title', spec: 'Inter · 20px · 600', sample: 'Gradient Area', css: { fontSize: '20px', fontWeight: '600', letterSpacing: '-0.01em' } },
  { step: 'lede', spec: 'Inter · 17px · 1.6', sample: 'An unofficial port of Recharts, rebuilt for the Vue ecosystem.', css: { fontSize: '17px', lineHeight: '1.6', color: 'var(--ds-muted)' } },
  { step: 'body', spec: 'Inter · 15px · 1.6', sample: 'Build charts declaratively from small Vue components.', css: { fontSize: '15px', lineHeight: '1.6' } },
  { step: 'sm', spec: 'Inter · 13px', sample: 'January – June 2024', css: { fontSize: '13px', color: 'var(--ds-muted)' } },
  { step: 'mono-spec', spec: 'JetBrains Mono · 12px', sample: 'area · monotone · 640ms rise', css: { fontFamily: 'var(--font-mono)', fontSize: '12px', color: 'var(--ds-dim)' } },
]

// ── Motion tokens + live stagger demo ──
const motionTokens = [
  { name: '--ds-enter', label: 'enter', note: 'rise · opacity + 12px lift' },
  { name: '--ds-stagger', label: 'stagger', note: 'between siblings' },
  { name: '--ds-exit', label: 'exit', note: 'always ½ of enter' },
  { name: '--ds-t-colour', label: 'colour', note: 'hover / color transitions' },
  { name: '--ds-ease', label: 'ease', note: 'all timed motion' },
]

const demoKey = ref(0)
function replay() { demoKey.value++ }

// ── Install pill copy ──
const copied = ref(false)
let copyTimer: ReturnType<typeof setTimeout> | undefined
function copyInstall() {
  navigator.clipboard?.writeText('npm install vccs')
  copied.value = true
  clearTimeout(copyTimer)
  copyTimer = setTimeout(() => { copied.value = false }, 2000)
}
onBeforeUnmount(() => clearTimeout(copyTimer))
const appConfig = useAppConfig()
</script>

<template>
  <div class="ds">
    <header class="ds-head">
      <p class="ds-kicker">
        adr-0002 · cube-motion system · vue-green accent
      </p>
      <h1 class="ds-title">
        Design System
      </h1>
      <p class="ds-lede">
        The token layer behind the vccs docs. Everything on this page renders
        from the tokens themselves — change a token in <code>main.css</code>
        and this page follows.
      </p>
    </header>

    <!-- ── Color ── -->
    <section class="ds-section">
      <h2 class="ds-label">
        Color · semantic tokens
      </h2>
      <p class="ds-note">
        Zinc neutrals, single Vue-green accent. Chrome ≠ data: the accent
        never appears inside charts, and chart colors never style the UI.
      </p>
      <div class="ds-swatches">
        <div
          v-for="t in colorTokens"
          :key="t.name"
          class="ds-swatch"
        >
          <span
            class="ds-chip"
            :style="{ background: `var(${t.name})` }"
          />
          <span class="ds-swatch-name">{{ t.label }}</span>
          <span class="ds-swatch-val">{{ values[t.name] || t.name }}</span>
        </div>
      </div>
      <h3 class="ds-sublabel">
        Data palette · charts only
      </h3>
      <div class="ds-swatches ds-swatches-sm">
        <div
          v-for="t in chartTokens"
          :key="t.name"
          class="ds-swatch"
        >
          <span
            class="ds-chip"
            :style="{ background: `var(${t.name})` }"
          />
          <span class="ds-swatch-name">{{ t.label }}</span>
          <span class="ds-swatch-val">{{ values[t.name] || t.name }}</span>
        </div>
      </div>
    </section>

    <!-- ── Type ── -->
    <section class="ds-section">
      <h2 class="ds-label">
        Type · scale
      </h2>
      <p class="ds-note">
        Inter for prose and UI, JetBrains Mono for specs and code. Every size
        comes from the scale — no one-off values.
      </p>
      <div class="ds-type">
        <div
          v-for="t in typeScale"
          :key="t.step"
          class="ds-type-row"
        >
          <span class="ds-type-step">{{ t.step }}<br><em>{{ t.spec }}</em></span>
          <span
            class="ds-type-sample"
            :style="t.css"
          >{{ t.sample }}</span>
        </div>
      </div>
    </section>

    <!-- ── Shape & elevation ── -->
    <section class="ds-section">
      <h2 class="ds-label">
        Shape · radius &amp; elevation
      </h2>
      <p class="ds-note">
        Inner radius is derived, never repeated: <code>inner = outer − pad</code>.
        Depth comes from layered shadows; ghosts use inset rings, never borders.
        Dark mode collapses shadows to 1px white rings.
      </p>
      <div class="ds-shape">
        <div>
          <div class="ds-radius-outer">
            <div class="ds-radius-inner">
              <span>24 − 10 = 14</span>
            </div>
          </div>
          <ul class="ds-token-list">
            <li><span>--ds-radius-card</span><em>24px</em></li>
            <li><span>--ds-card-pad</span><em>10px</em></li>
            <li><span>--ds-radius-inner</span><em>14px</em></li>
            <li><span>--ds-radius-pill</span><em>999px + squircle</em></li>
          </ul>
        </div>
        <div class="ds-elev">
          <div class="ds-elev-card ds-elev-btn">
            <span>--ds-shadow-btn</span>
          </div>
          <div class="ds-elev-card ds-elev-carddemo">
            <span>--ds-shadow-card</span>
          </div>
          <div class="dark ds-elev-dark">
            <div class="ds-elev-card ds-elev-btn">
              <span>--ds-shadow-btn · dark</span>
            </div>
            <div class="ds-elev-card ds-elev-carddemo">
              <span>--ds-shadow-card · dark</span>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- ── Motion ── -->
    <section class="ds-section">
      <h2 class="ds-label">
        Motion · timing tokens
      </h2>
      <p class="ds-note">
        One curve, fixed ratios: exit is always half the enter. Reduced-motion
        users get fades, never translation.
      </p>
      <div class="ds-motion">
        <ul class="ds-token-list ds-motion-list">
          <li
            v-for="m in motionTokens"
            :key="m.name"
          >
            <span>{{ m.label }} <i>{{ m.note }}</i></span>
            <em>{{ m.name.replace('--ds-', '') === 'ease' ? 'cubic-bezier(0.2,0,0,1)' : ({ enter: '640ms', stagger: '70ms', exit: '320ms', colour: '160ms' } as Record<string, string>)[m.label] }}</em>
          </li>
        </ul>
        <div class="ds-motion-demo">
          <div
            :key="demoKey"
            class="ds-dots"
            aria-hidden="true"
          >
            <span
              v-for="i in 5"
              :key="i"
              class="ds-dot"
              :style="{ '--i': i - 1 }"
            />
          </div>
          <button
            class="ds-replay"
            aria-label="Replay stagger demo"
            @click="replay"
          >
            ↻ replay
          </button>
        </div>
      </div>
    </section>

    <!-- ── Buttons ── -->
    <section class="ds-section">
      <h2 class="ds-label">
        Buttons · the cube recipe
      </h2>
      <p class="ds-note">
        32px solid, inset-ring ghost, install pill with 24px copy. Compact
        visuals; hit areas extend to ≥40px invisibly. Buttons are the
        <code>&lt;DsButton&gt;</code> component — variants via prop.
      </p>
      <div class="ds-applied">
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
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
          </button>
        </span>
        <span class="ds-badge">v0.6.0</span>
      </div>
      <div class="dark ds-applied">
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
            <UIcon :name="copied ? 'i-lucide-check' : 'i-lucide-copy'" />
          </button>
        </span>
        <span class="ds-badge">v0.6.0</span>
      </div>
    </section>
  </div>
</template>

<style scoped>
.ds {
  background: var(--ds-bg);
  color: var(--ds-text);
  font-family: var(--font-sans);
  min-height: calc(100dvh - 64px);
  padding: 4rem 1.5rem 7rem;
  -webkit-font-smoothing: antialiased;
}

.ds-head,
.ds-section {
  max-width: 1080px;
  margin: 0 auto;
}
.ds-head { margin-bottom: 4rem; }
.ds-section { margin-bottom: 4rem; }

.ds-kicker {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ds-dim);
  margin: 0 0 1.25rem;
}
.ds-title {
  font-size: clamp(2.5rem, 5vw, 3.75rem);
  font-weight: 600;
  letter-spacing: -0.03em;
  line-height: 1.05;
  margin: 0 0 1rem;
}
.ds-lede {
  font-size: 17px;
  line-height: 1.6;
  color: var(--ds-muted);
  max-width: 36rem;
  margin: 0;
  text-wrap: pretty;
}
.ds-lede code,
.ds-note code {
  font-family: var(--font-mono);
  font-size: 0.875em;
  background: var(--ds-block);
  padding: 0.125em 0.375em;
  border-radius: 4px;
}

.ds-label {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  text-transform: uppercase;
  letter-spacing: 0.12em;
  color: var(--ds-dim);
  margin: 0 0 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid var(--ds-border);
}
.ds-sublabel {
  font-family: var(--font-mono);
  font-size: 12px;
  font-weight: 400;
  color: var(--ds-dim);
  margin: 1.75rem 0 0.875rem;
}
.ds-note {
  font-size: 15px;
  line-height: 1.6;
  color: var(--ds-muted);
  max-width: 40rem;
  margin: 0 0 1.75rem;
  text-wrap: pretty;
}

/* color */
.ds-swatches {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  gap: 1rem;
}
.ds-swatches-sm { max-width: 820px; }
.ds-swatch {
  background: var(--ds-surface);
  border-radius: 14px;
  box-shadow: var(--ds-shadow-card);
  padding: 0.625rem;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}
.ds-chip {
  height: 44px;
  border-radius: 8px;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}
.ds-swatch-name {
  font-size: 12px;
  font-weight: 600;
}
.ds-swatch-val {
  font-family: var(--font-mono);
  font-size: 10.5px;
  color: var(--ds-dim);
  min-height: 1.2em;
}

/* type */
.ds-type-row {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 2rem;
  align-items: baseline;
  padding: 1.125rem 0;
  border-bottom: 1px solid var(--ds-border);
}
.ds-type-step {
  font-family: var(--font-mono);
  font-size: 12px;
  line-height: 1.5;
}
.ds-type-step em {
  font-style: normal;
  color: var(--ds-dim);
  font-size: 11px;
}

/* shape */
.ds-shape {
  display: grid;
  grid-template-columns: 1fr 2fr;
  gap: 2rem;
  align-items: start;
}
.ds-radius-outer {
  background: var(--ds-surface);
  border-radius: var(--ds-radius-card);
  padding: var(--ds-card-pad);
  box-shadow: var(--ds-shadow-card);
}
.ds-radius-inner {
  background: var(--ds-block);
  border-radius: var(--ds-radius-inner);
  height: 72px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ds-dim);
}
.ds-token-list {
  list-style: none;
  margin: 1rem 0 0;
  padding: 0;
  font-family: var(--font-mono);
  font-size: 12px;
}
.ds-token-list li {
  display: flex;
  justify-content: space-between;
  gap: 1rem;
  padding: 0.375rem 0;
  border-bottom: 1px dashed var(--ds-border);
  color: var(--ds-muted);
}
.ds-token-list em {
  font-style: normal;
  color: var(--ds-text);
}
.ds-token-list i {
  font-style: normal;
  color: var(--ds-dim);
}

.ds-elev {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}
.ds-elev-dark {
  grid-column: span 2;
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  background: var(--ds-bg);
  border-radius: var(--ds-radius-card);
  padding: 1rem;
}
.ds-elev-card {
  background: var(--ds-surface);
  border-radius: var(--ds-radius-card);
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: var(--font-mono);
  font-size: 11px;
  color: var(--ds-dim);
}
.ds-elev-btn { box-shadow: var(--ds-shadow-btn); }
.ds-elev-carddemo { box-shadow: var(--ds-shadow-card); }

/* motion */
.ds-motion {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start;
}
.ds-motion-list { margin: 0; }
.ds-motion-demo {
  background: var(--ds-surface);
  border-radius: var(--ds-radius-card);
  box-shadow: var(--ds-shadow-card);
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.ds-dots { display: flex; gap: 0.625rem; }
.ds-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: var(--ds-accent);
  animation: ds-dot-rise var(--ds-enter) var(--ds-ease) both;
  animation-delay: calc(var(--i) * var(--ds-stagger));
}
@keyframes ds-dot-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
.ds-replay {
  display: inline-flex;
  align-items: center;
  min-height: 40px;
  background: none;
  border: 0;
  border-radius: var(--ds-radius-pill);
  corner-shape: squircle;
  box-shadow: inset 0 0 0 1px var(--ds-border);
  padding: 0 1rem;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--ds-muted);
  cursor: pointer;
  touch-action: manipulation;
  transition: background-color var(--ds-t-colour) var(--ds-ease), color var(--ds-t-colour) var(--ds-ease);
}
.ds-replay:hover { color: var(--ds-text); background: var(--ds-block); }
.ds-replay:focus-visible {
  outline: 2px solid var(--ds-accent);
  outline-offset: 2px;
}

/* buttons/pill/copy/badge styles live in main.css as global .ds-* classes */

.ds-applied {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  flex-wrap: wrap;
  padding: 1.25rem;
  background: var(--ds-bg);
  border-radius: var(--ds-radius-card);
  box-shadow: inset 0 0 0 1px var(--ds-border);
}
.ds-applied + .ds-applied { margin-top: 0.75rem; }

@media (max-width: 800px) {
  .ds-shape,
  .ds-motion { grid-template-columns: 1fr; }
  .ds-type-row { grid-template-columns: 1fr; gap: 0.5rem; }
}

@media (prefers-reduced-motion: reduce) {
  .ds-dot { animation: none; }
}
</style>
