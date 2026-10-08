# Packed consumers

`node scripts/check-consumers.mjs` packs the library and installs it into a fresh Vite app and a
fresh Nuxt 4 app outside the workspace. `vccs` resolves to `file:../vccs.tgz`. Each app then
typechecks with `strict: true` and `strictTemplates: true` and makes a production build.

- Direct dependencies in `vite/package.json` and `nuxt/package.json` are exact versions. There is
  no lockfile, so their own dependencies resolve fresh, as for a new user. A new upstream patch
  release can turn the check red; that is real consumer breakage. To move a fixture to a new
  version, change its pin.
- The template probes are the library's own vue-tsc probes in `packages/vue/src/test/types/`
  (`api-example-0.vue`, `api-example-1.vue`, `standalone.vue`, `renames.vue`), copied with
  `from 'vccs'` in place of `from '../../index'`. `nullability.ts` and `publicProps.ts` exist only
  here: they check the packed declarations.
- `scripts/check-consumer-declarations.mjs` checks every packed vccs declaration with
  `skipLibCheck: false` in the Nuxt app. Errors in vccs files fail; third-party diagnostics are
  only reported.

The check needs network access for the first install; pnpm reuses its store after that.
