---
name: vccs-usage
description: |
  Search and retrieve task-specific guides for vccs, the Vue 3 chart library. Use FIRST when asked for a chart, graph, plot, or dashboard in a Vue/Nuxt app; when creating, changing, debugging, or reviewing code that imports from 'vccs'; when selecting a chart type; or when migrating Recharts code to Vue.

  Covers every chart root shipped by the installed vccs version, plus installation, slots, events, models, typed rows, SSR, and deterministic tests.

  Do not trigger for React/Recharts code that will remain in React, or for charts built with another library.
---

# vccs Usage

The CLI, catalog, and guides ship inside the `vccs` npm package. Run them through the consuming project's package manager so the answers always come from the same vccs version as the application code.

Do not use `npx` or `pnpx` with `@latest`, and do not retrieve guides from another checkout. Those can describe a different vccs version.

## Step 1: Search use cases

From the consuming project, search with an action-oriented query naming the outcome, chart, or API:

```sh
pnpm exec vccs-usage search "show daily activity in a calendar"
```

With another package manager, use its local-only exec equivalent. If the installed vccs does not provide this command, do not download a newer guide CLI; use documentation that matches the installed version or upgrade vccs.

The JSON result contains guide `id`, `description`, `category`, `path`, and a lexical `score`. It is a routing score, not semantic similarity.

If results are empty or too broad, browse every guide:

```sh
pnpm exec vccs-usage list
```

## Step 2: Retrieve guides

Retrieve the selected chart guide and every shared guide needed by the task. Pass comma-separated ids:

```sh
pnpm exec vccs-usage retrieve "calendar-heatmap,vue-api"
```

Always retrieve before implementing. Catalog descriptions select guides; they are not enough to write an example.

- Setup or auto-imports: add `installation`.
- Slots, events, models, sizing, or colors: add `vue-api`.
- Compile-time row keys or typed payloads: add `typed-rows`.
- SSR, screenshots, or exact geometry: add `ssr-testing`.

If output is truncated, rerun the command redirected to a file and read that file.

## Step 3: Implement and verify

Follow the retrieved chart's data shape and minimal example. Do not combine props from different chart families or fall back to Recharts render-prop APIs.

Before finishing:

- Import public runtime components from `vccs`; use only `vccs/nuxt` and `vccs/resolver` for their documented integrations.
- Check every customized prop and slot against the retrieved guides.
- Run the consuming application's typecheck and build when they exist.
- Retrieve `ssr-testing` before asserting pixels, taking screenshots, or requiring a complete server-rendered chart.
- If the installed package rejects a documented API, check its version and shipped declarations instead of suppressing the type error.
