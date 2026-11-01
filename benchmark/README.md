# Library comparison

The same chart in vccs and other charting libraries for Vue: a live site with the code for each
one, and a reproducible bundle-size benchmark. It stays outside the pnpm workspace, so competitor
packages never enter the root lockfile or the docs build.

| Path | What it holds |
| --- | --- |
| `libraries.mjs` | The libraries, what each one omits and which builds to measure |
| `site/` | The live comparison (Vite and Vue, static assets on a Worker) |
| `site/src/charts/<chart>/<library>.vue` | The exact code a card shows and the benchmark bundles |
| `bundles/<library>/` | One isolated install and lockfile per library, plus reference builds |
| `results/latest.json` | The published measurements |

## Run it

```bash
pnpm compare:libraries                    # measure and browser-check everything, then write the results
pnpm compare:libraries --only=vccs        # check one library without writing results
pnpm compare:cards [--chart=area]         # build the site and browser-check every card on every page
node scripts/check-comparison.mjs         # offline check that cards, pins and results agree

cd benchmark/site
pnpm install --ignore-workspace
pnpm dev                                  # http://localhost:4720
```

## How sizes are measured

esbuild with `--bundle --minify --format=esm --target=es2020`, production mode, gzip level 9. Vue is
external, and so is React for the Recharts reference. Only first-load JavaScript and CSS count: a
library's lazy chunks are left out. Vite 8, which bundles with Rolldown, is the cross-check.

Each build also runs in Chromium. It must render without page errors and react to hover, and its
animation must match `omits`: at least one on-screen state between the first and last, counted in
pixels on entrance or update. Crosshairs are reviewed by eye in `.evidence/libraries/*-hover.png`.

Only the line chart is measured for size. `compare:cards` checks the built site instead, so it covers
every chart page, and also fails a card whose new data or theme changes nothing. Pixels can't judge
whether a chart is correct, so review `.evidence/libraries/cards/` by eye: stacking order, a zero
baseline, leftover markers and dark-mode legibility.

A card that leaves something out says so in `note`, with a link in `noteSource`. `check-comparison`
fails without both. The link is read by a person: no check confirms that it still says the same thing.

## To update a version

Change the pin in `site/package.json` and in `bundles/<library>/package.json`, run `pnpm install
--ignore-workspace` in both, and rerun `pnpm compare:libraries`. `check-comparison` fails until all
three agree.
