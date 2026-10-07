<script setup lang="ts">
// Landing (ADR-0005 layout, ADR-0006 hero card, ADR-0007 install pill):
// Specimen split — copy left, code+chart card right.
// layout/header disabled — the landing uses its own cube-style
// header (LandingHeader); docs pages keep the Docus chrome.
import { ref } from 'vue'

definePageMeta({ layout: false, header: false })

useSeoMeta({
  title: 'vccs — Vue 3 Charting Components',
  description: 'Composable charting components for Vue 3, ported from Recharts',
})

// Hero card's active chart type — the background follows it
const heroChart = ref('area')

const appConfig = useAppConfig()
</script>

<template>
  <div class="min-h-dvh bg-(--ds-bg) font-[var(--font-sans)] text-(--ds-text) antialiased">
    <!-- WebGL radar background — ambient, pointer-events-none -->
    <div class="pointer-events-none fixed inset-0 z-0">
      <ClientOnly>
        <LandingRadarBackground />
      </ClientOnly>
      <div
        class="absolute inset-0 bg-[linear-gradient(to_right,var(--ds-bg)_0%,transparent_45%)]"
        aria-hidden="true"
      />
    </div>

    <div class="relative z-1">
      <LandingHeader />

      <section class="flex min-h-[calc(100dvh-108px)] items-center px-6 pb-8 pt-12">
        <div class="mx-auto grid w-full max-w-[1080px] grid-cols-[5fr_7fr] items-center gap-12 max-[900px]:grid-cols-1 max-[900px]:gap-10">
          <div>
            <h1
              class="sp-rise mb-5 text-balance text-[clamp(2.5rem,5vw,3.75rem)] font-semibold leading-[1.05] tracking-[-0.03em]"
              style="--d: 70ms"
            >
              Composable charting components for Vue&nbsp;3.
            </h1>
            <p
              class="sp-rise mb-9 max-w-[30rem] text-pretty text-[17px] leading-[1.6] text-(--ds-muted)"
              style="--d: 140ms"
            >
              An unofficial port of Recharts — React's most popular charting
              library, rebuilt for the Vue ecosystem.
            </p>
            <div
              class="sp-rise flex flex-wrap items-center gap-2.5"
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
              <InstallCommand />
            </div>
          </div>

          <LandingCodeCard v-model:active="heroChart" />
        </div>
      </section>

    </div>
  </div>
</template>

<style scoped>
/* entrance rise — keyframes can't be utilities; everything else is Tailwind */
.sp-rise {
  animation: sp-rise var(--ds-enter) var(--ds-ease) both;
  animation-delay: var(--d, 0ms);
}
@keyframes sp-rise {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: none; }
}
@media (prefers-reduced-motion: reduce) {
  .sp-rise { animation: none; }
}
</style>
