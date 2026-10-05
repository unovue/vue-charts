# Published-package audit: vccs 0.6.0

Audit date: 2026-10-05. Audit only; no tracked files changed, no commits, no publishing. Evidence and fixture files are under `.evidence/review/package/`, already git-ignored (`git check-ignore` confirmed); no exclude change was needed.

## Outcome and findings

The tarball has valid ESM entry points and portable declarations. The packed Vite consumer passes a strict declaration check and builds. The Nuxt module auto-registers LineChart and Heatmap, builds, renders both on the server, and hydrates without observed warnings. **Independent registry installation was not verified:** both attempts failed on DNS, and the authorized local dependency fallback was used. No P0 finding.

| Rank | Finding | Evidence / impact |
|---|---|---|
| P1 | Recharts upstream copyright notice is absent from the shipped license. | `LICENSE:3` and `tar -xOf vccs-0.6.0.tgz package/LICENSE` show only Rick-hup. `packages/vue/README.md:12` describes this as a port. The [upstream MIT license](https://raw.githubusercontent.com/recharts/recharts/main/LICENSE) names Recharts and requires preservation of its notice. README credit is present, but is not that notice. Review the provenance of copied/ported portions and preserve the applicable upstream notice before release. This is an attribution finding, not a determination of every file's provenance. |
| P2 | The npm README gives incorrect/incomplete installation requirements. | `packages/vue/README.md:36`: `vue >= 3.0.0`; `packages/vue/package.json:72`: Vue `^3.5.0` and required motion-v `^2.4.0`. README does not explain the required motion peer, ESM-only consumption, Nuxt module, resolver, or opt-in typed helper. This can lead consumers to unsupported Vue versions or to miss the intended typed API. |
| P2 | Opting into row types has a measurable bundle cost. | `packages/vue/src/typed.ts:74`, `:110`, `:159`: the helper returns an object containing all supported components. Same chart UI: direct imports **361.06 KB / 124.33 KB gzip**, helper **495.64 KB / 162.59 KB gzip**. Extra **134.58 KB raw / 38.26 KB gzip** (30.8% gzip). Treemap, SunburstChart, Sankey, and RadarChart markers survive only in the helper bundle. See `vite-build*.log`, `declarations-and-bundles.json`, and `vite/src/App{,Direct}.vue`. Type narrowing works, but retains charts the consumer does not render. |
| P2 | Row safety is opt-in and incomplete for the newer charts. | `packages/vue/src/types/common.ts:5`, `components/Tooltip.tsx:49`, `chart/Tracker.tsx:30`, `chart/Heatmap.tsx:21`, `typed.ts:74`. Base chart data is safely `unknown[]`, but base Tooltip row payloads and Tracker record fields are `any`; base dataKey accepts arbitrary strings. Helper Tooltip payloads and Line dataKey are row-typed, but Tracker and Heatmap are absent from the helper. Cell event payloads are `unknown`, rather than the consumer's row type (`chart/CellGridLayer.tsx:116`). Consumers must narrow them themselves. |
| P2 | Library checks do not enforce strict null/type safety. | `packages/vue/tsconfig.json:29`: `strict: false`, with `skipLibCheck: true`; 454 AST `any` types, 557 non-null assertions and 51 suppression directives in the requested source population. Existing library typecheck passes under these flags; that does not establish correctness under strict mode. Detailed counts below. |
| P3 | Release documentation and manual publishing are easy to drift. | `CHANGELOG.md:7` latest entry is 0.4.0, but package is 0.6.0. `packages/vue/package.json:66` scripts provide manual publish with no prepack/prepublish verification hook; build must be run first. `.github/workflows/release.yaml:27` creates GitHub release notes only. CI has meaningful package/consumer checks, but is PR-triggered rather than a tag-release gate. No Changesets directory. A documented checked release procedure would suffice; automated npm publishing is not required for this finding. |
| P3 | README assets and feature table are stale. | `packages/vue/README.md:2` logo points at `docs/public/logo.svg`, absent from tarball. README chart table calls Treemap/Sankey/Sunburst unsupported, while public exports/implementations exist and `CHANGELOG.md:26` documents Treemap implementation. No updated npm examples for Tracker/Heatmap. |
| P3 | Repository metadata polish. | Publint suggests `git+https://github.com/rick-hup/vuecharts.git` in place of the current repository URL (`packages/vue/package.json:12`). Non-blocking suggestion; identifiers were not changed. |

## 1. Publint and Are The Types Wrong

Commands ran against the **same packed tarball**, not the source package. Versions: publint 0.3.25; attw CLI/core 0.18.5 (embedded TypeScript 5.6.1-rc).

`node_modules/.bin/publint .evidence/review/package/vccs-0.6.0.tgz --strict` — exit 0. Verbatim summary:

```
Suggestions:
1. pkg.repository.url is https://github.com/rick-hup/vuecharts but could be a full git URL like "git+https://github.com/rick-hup/vuecharts.git".
```

Reading: no errors or warnings; the metadata suggestion remains. Full output: `publint.log`.

`node_modules/.bin/attw .evidence/review/package/vccs-0.6.0.tgz --profile strict` — exit 1. Verbatim summary:

```text
vccs v0.6.0

⚠️ A require call resolved to an ESM JavaScript file, which is an error in Node and some bundlers. CommonJS consumers will need to use a dynamic import. https://github.com/arethetypeswrong/arethetypeswrong.github.io/blob/main/docs/problems/CJSResolvesToESM.md


"vccs"

node10: 🟢 
node16 (from CJS): ⚠️ ESM (dynamic import only)
node16 (from ESM): 🟢 (ESM)
bundler: 🟢 

***********************************

"vccs/nuxt"

node10: 🟢 
node16 (from CJS): ⚠️ ESM (dynamic import only)
node16 (from ESM): 🟢 (ESM)
bundler: 🟢 

***********************************

"vccs/resolver"

node10: 🟢 
node16 (from CJS): ⚠️ ESM (dynamic import only)
node16 (from ESM): 🟢 (ESM)
bundler: 🟢 

***********************************
```

Reading: all three entry points resolve correctly for Node ESM, bundler, and legacy node10 types. Each has the expected CommonJS-to-ESM warning. This is consistent with the brief's ESM-only contract, not a broken ESM import. A second run with `--profile strict --ignore-rules cjs-resolves-to-esm` exited 0; no other diagnostic remained (`attw-esm.log`). The unfiltered failure is preserved, not hidden.

## 2. Manifest and tarball

`packages/vue/package.json` audit:

- `name=vccs`, `version=0.6.0`, `type=module`, MIT; author/homepage/repository unchanged.
- Exports: `.` → types `./dist/index.d.ts`, import `./dist/es/index.mjs`; `./nuxt` → `./dist/nuxt.d.ts`, `./dist/es/nuxt.mjs`; `./resolver` → `./dist/resolver.d.ts`, `./dist/es/resolver.mjs`. Types conditions precede import conditions. All six targets ship. No CJS/require target or default/main fallback; ESM-only is intentional. `typed.ts` is exposed through the root's `defineChartComponents`, not a `/typed` subpath.
- Root `module`, `types`, and `typings` agree with these targets. `typesVersions` supplies legacy Nuxt/resolver type paths. Declaration-relative imports include extensions; attw supports their resolution.
- `sideEffects: false`; no shipped CSS/global component registration requirement was found. Nuxt registration happens in the invoked module's setup. Direct-import bundle successfully eliminates unused chart markers; the helper's all-components object limits that benefit.
- Required peers: Vue `^3.5.0`, motion-v `^2.4.0`. Optional peers: @nuxt/kit `^3.15.0 || ^4.0.0`, unplugin-vue-components `^30.0.0`. Nuxt itself is a development dependency; `vccs/nuxt` declarations import `nuxt/schema`, so the module subpath assumes a Nuxt project. The normal Vite root import does not need a Nuxt module at runtime. Nuxt 3 was not tested.
- Runtime dependencies: @types/d3-sankey, @types/d3-shape, @vueuse/core, d3-hierarchy, d3-sankey, d3-scale, d3-shape, d3-time, decimal.js-light, es-toolkit, motion-dom, reselect. `@types` packages are appropriate here because public declarations reference d3-shape/d3-sankey. @types/d3-scale and @types/d3-time are development-only; emitted declarations did not directly import those modules. Public external type imports are recorded in `declarations-and-bundles.json`.
- No Redux Toolkit or victory-vendor dependency or production source import remains. Reselect remains intentionally; README's Victory Vendor credit is historical relative to the direct D3 dependency graph.
- No `engines` field. No explicit supported Node range is communicated. This browser library's optional Nuxt integration inherits Nuxt's environment needs; the audit only ran Node 24.21.0.
- Files allowlist: LICENSE, README.md, `dist/**/*.d.ts`, `dist/**/*.mjs`. Root license is picked up in the archive even though `packages/vue/LICENSE` does not exist. No tests, stories, source directories, source maps, fixtures, or `.tsbuildinfo` shipped. Internal dist modules are expected for preserveModules. No source maps is a defensible size/privacy choice, at the cost of less convenient original-source debugging; no map references or map distribution promise was found.

Tarball: **314,342 compressed bytes**, **1,636,818 unpacked bytes**, **583 files**; **314 `.d.ts` files**, **820,567 declaration bytes**. Exact inventory: `tarball-files.txt`; metrics: `tarball-stats.json`; archive: `vccs-0.6.0.tgz`.

## 3. Vite + Vue + TypeScript consumer

Fixture: `vite/src/App.vue` uses a `Row` interface, `defineChartComponents<Row>()`, a LineChart with Line/XAxis/YAxis, Tooltip `#content` reading `item.payload.value`, and Tracker with dated statuses. `vite/src/type-probes.ts` checks emitted public declarations with positive and negative assertions. No library source alias is used.

Clean install attempt: `npm install --ignore-scripts --no-audit --no-fund --cache <evidence>/npm-cache --fetch-retries=0 --fetch-timeout=20000` in `vite/` — exit 1 (`vite-install.log`). npm prints ERESOLVE/motion-v@undefined; its debug log records registry **ENOTFOUND**, so this is not evidence of incompatible peer versions. Used the permitted fallback: saved `package.registry.json`, changed tooling/peer dependencies to local `file:` paths, unpacked the tarball into a real `node_modules/vccs` directory, and linked existing workspace dependencies (`fallback.py`, `fallback.log`). The library is the packed copy, not a source symlink. This cannot certify independent registry dependency resolution or detect every type leak masked by workspace dependencies.

Actual tools: Vue 3.5.18, motion-v 2.5.2, TypeScript 6.0.3, vue-tsc 3.3.12, Vite 8.0.0, Vue plugin 6.0.4. Compiler uses strict=true, skipLibCheck=false, Bundler resolution, ES2023.

- `node_modules/.bin/vue-tsc --noEmit -p .evidence/review/package/vite/tsconfig.json` — final exit 0, no diagnostics (`vite-typecheck.log`). Corrected initial probe described under anomalies.
- In `vite/`: `../../../../node_modules/.bin/vite build` — exit 0, `✓ built in 1.85s`; bundle 495.64 KB / 162.59 KB gzip (`vite-build.log`).
- In `vite/`: `../../../../node_modules/.bin/vite build --config vite.direct.config.mjs` — exit 0, `✓ built in 309ms`; same template/data with direct exports, 361.06 KB / 124.33 KB gzip (`vite-build-direct.log`). Wall times are not a benchmark: sequential builds/cache differed. Extra bundle code is corroborated by retained chart names, not inferred from timing.

Type findings: helper rejects a misspelled Line dataKey and gives Tooltip payload rows the exact `Row` type, without `any`. Base chart data is `unknown[]`; base Tooltip payload row is `any`; Tracker row fields are `any`. Slots have declared props (Tooltip content/cursor; Tracker cell), although base row types are broad and slot return types use `any`. Tooltip `update:activeIndex` and Tracker cell-click emits reject invalid argument types; Tracker event row payload is `unknown`, index is number, event is MouseEvent. Successful negative `@ts-expect-error` probes would fail if those invalid emits/keys became accepted. Tracker/Heatmap row keys are not generically narrowed by the helper.

The packed resolver also returned `{name:'LineChart',from:'vccs'}`, `{name:'Heatmap',from:'vccs'}`, and prefixed `{name:'Tracker',from:'vccs'}`; unknown component returned undefined (`resolver.log`).

## 4. Nuxt consumer and SSR/hydration

Fixture: `nuxt/nuxt.config.ts` includes `modules: ['vccs/nuxt']`; `nuxt/app/app.vue` uses auto-registered LineChart and Heatmap, with no chart imports. Fixed numeric dimensions and animation disabled isolate SSR/hydration from resize/animation behavior.

Registry install failed in the same way as Vite; identical authorized local-file fallback. Actual Nuxt 4.5.2, Nitro 2.13.4, Nuxt's Vite 8.3.2, Vue 3.5.18. Only this combination was tested, not the full peer range.

- In `nuxt/`: `../../../../packages/vue/node_modules/.bin/nuxi build` — exit 0, `✨ Build complete!`; Nitro output 4.14 MB / 1.17 MB gzip (`nuxt-build.log`). Build warns of stale Browserslist data (15 months) and plugin timing overhead; neither prevented the build.
- In `nuxt/`: `../../../../packages/vue/node_modules/.bin/nuxi typecheck` — exit 0, no diagnostics (`nuxt-typecheck.log`). Nuxt generated strict=true and skipLibCheck=true (framework default); Vite separately checked library declarations with skipLibCheck=false.
- `node .evidence/review/package/browser.cjs` — final exit 0. Starts built Nitro on **127.0.0.1:4600**, saves actual HTTP HTML, launches the supplied Chromium headless shell with playwright-core 1.58.2 resolved from the real @nuxt/test-utils location, and stops both in finally. First sandbox server attempt failed with listen EPERM; the successful retry had local server permissions.
- SSR **HTTP 200**, **2 SVGs**, LineChart and Heatmap markup present. Browser **2 SVGs**, **1 Heatmap**, **0 console warnings/errors**, **0 page errors** (`browser.json`, `browser.log`, `nuxt-server.log`, `nuxt-ssr.html`). Production warnings can be less detailed than development warnings; this is the observed production result, not a guarantee for every chart.
- Desktop (1000×800) and mobile (390×844) screenshots saved and visually inspected: `nuxt-desktop.png`, `nuxt-mobile.png`. Both charts visibly render the data. Mobile extends to 608px because the fixture explicitly sets width=600; this is fixture sizing, not evidence of broken responsive sizing. Responsive layouts, interactions, and animated hydration were not exercised.

## 5. Library TypeScript strictness

`packages/vue/tsconfig.json` is standalone (does not extend root strict configuration): strict=false, skipLibCheck=true, isolatedModules=true, allowJs=true, ESNext/Bundler, ES2023+DOM libs, JSX preserve/vue import source, noEmit=true, incremental=true, composite=true. noUncheckedIndexedAccess and exactOptionalPropertyTypes are absent; no individual strict subflags opt back in. Tests/stories are excluded from the normal typecheck.

`node_modules/.bin/vue-tsc --noEmit -p packages/vue/tsconfig.json --tsBuildInfoFile .evidence/review/package/library.tsbuildinfo` — exit 0, no diagnostics (`library-typecheck.log`). The build also succeeded: `pnpm --filter vccs build` — exit 0, `✓ built in 4m 44s`; d.ts generation dominated plugin time (`build.log`). A parallel rebuild was observed; both builds ended before pack.

Scan command: `node .evidence/review/package/strictness.cjs > .evidence/review/package/strictness.json`. TypeScript AST counts, not word occurrences in comments/strings; suppression directives counted textually. Includes all TS/TSX/Vue files under src except directories named __tests__ and __stories__, exactly as requested (332 files). `as any` also contributes to the any column; summed ranking counts this overlap. This population can include other test/helper directories, unlike the library tsconfig exclusions.

Totals: **any 454**, **as any 39**, **@ts-ignore 20**, **@ts-expect-error 31**, **non-null assertions 557**.

| File | any | as any | ignore | expect-error | non-null | Sum |
|---|---:|---:|---:|---:|---:|---:|
| `packages/vue/src/components/label/utils.tsx` | 2 | 0 | 0 | 0 | 95 | 97 |
| `packages/vue/src/utils/chart.ts` | 14 | 0 | 0 | 9 | 21 | 44 |
| `packages/vue/src/state/selectors/axisSelectors.ts` | 10 | 1 | 5 | 1 | 24 | 41 |
| `packages/vue/src/state/selectors/barSelectors.ts` | 9 | 0 | 0 | 1 | 24 | 34 |
| `packages/vue/src/cartesian/cartesian-grid/CartesianGrid.tsx` | 0 | 0 | 0 | 0 | 24 | 24 |
| `packages/vue/src/chart/journeyUtils.ts` | 0 | 0 | 0 | 0 | 23 | 23 |
| `packages/vue/src/state/selectors/radialBarSelectors.ts` | 11 | 1 | 1 | 3 | 7 | 23 |
| `packages/vue/src/components/Tooltip.tsx` | 7 | 0 | 0 | 0 | 15 | 22 |
| `packages/vue/src/utils/scale/utils/utils.ts` | 21 | 1 | 0 | 0 | 0 | 22 |
| `packages/vue/src/cartesian/funnel/utils.ts` | 4 | 1 | 0 | 0 | 14 | 19 |
| `packages/vue/src/cartesian/line/hooks/useLine.ts` | 14 | 0 | 0 | 0 | 5 | 19 |
| `packages/vue/src/cartesian/cartesian-axis/use-axis-line.tsx` | 1 | 1 | 0 | 0 | 16 | 18 |
| `packages/vue/src/chart/Sankey.tsx` | 9 | 6 | 0 | 0 | 2 | 17 |
| `packages/vue/src/chart/Treemap.tsx` | 17 | 0 | 0 | 0 | 0 | 17 |
| `packages/vue/src/cartesian/brush/components/BrushText.tsx` | 3 | 0 | 0 | 0 | 13 | 16 |

## 6. Release mechanics

Present: PR CI builds, typechecks, tests, lints, checks size, Nuxt SSR fixture, packed consumers, publint/attw, package contents, docs and motion; `.github/workflows/test.yml`. Tagged release workflow uses changelogithub for GitHub release notes and Node 18; it does not build/publish npm. Root CHANGELOG.md exists (latest 0.4.0), root/package bumpp scripts exist, root changelogen dev dependency exists, manual root/package pub:release scripts exist. Root MIT license ships; npm README ships and credits Recharts, with the copyright concern above.

Missing: Changesets configuration, npm publish job, prepack/prepublish verification hook, current 0.6.0 changelog entry, upstream Recharts notice. These are observations, not a request to add all of these systems. No release command was executed.

## Anomalies and limits

1. README claims Vue >=3.0.0, while manifest requires ^3.5.0 plus motion-v ^2.4.0. High confidence documentation drift; the manifest is authoritative.
2. Same rendered chart work costs 162.59 KB gzip through the typed helper versus 124.33 KB through direct imports. The helper is described as narrowing declarations while preserving runtime components (`typed.ts:158–161`), but its all-components object retains extra chart implementations. High confidence from emitted bundle markers. No runtime performance conclusion is drawn.
3. First probe expected base LineChart rows to be any and failed with **one TS2344** at `type-probes.ts:11` (`vite-typecheck-initial-probe.log`). Source/exported ChartData is unknown[]; the expectation was wrong. Corrected probe passed; this is not a library type error.
4. npm ERESOLVE reports motion-v@undefined despite matching ^2.4.0 requested ranges. npm debug output shows registry ENOTFOUND; dependency metadata could not be fetched. Environment failure, not a proven peer defect.
5. Independent gzip compressors produced different numbers from Vite: Node default 161,106/123,145 bytes and Python 160,386/122,456 bytes versus Vite 162.59/124.33 KB. Compression implementation/settings affect the result; report comparisons consistently use the same Vite tool. Raw bytes match 495,649/361,062. No contradiction in raw bundle content or performance conclusion.

Expected, not anomalous: raw attw exit 1 for all three CommonJS resolutions under the ESM-only brief; the ESM-filtered strict check passes. No package-size baseline or zero-overhead promise was provided. No prior audit was substituted for these runs.

Assumptions: used installed tooling rather than network-updated npx versions; used allowed local-file dependency fallback after DNS failures; fixed-size nonanimated charts are sufficient for the requested SSR baseline; kept framework-default Nuxt skipLibCheck while Vite checks declarations strictly; ranked absent upstream notice P1 pending exact provenance review; source-map omission is intentional based on allowlist/build output; no new release infrastructure is necessary to complete this audit.

Issues: independent clean npm installation and full supported Vue/motion/Nuxt version matrix remain unverified. Local linked dependencies can mask undeclared dependencies. No Nuxt 3, Node 18/20/22, real tooltip/cell interaction, reduced motion or responsive-size testing was performed. Production browser checks do not prove all development hydration cases. No library changes were made to resolve findings.

Cleanup: successful browser script closed Chromium and stopped its own server; the failed browser runner was explicitly terminated. All build/typecheck/install commands completed. Only port 4600 was used; ports 3011/3012 were not touched. Final git diff/status and source checksums were rechecked; tracked files unchanged.
