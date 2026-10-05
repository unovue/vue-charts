# Locked packed consumers

These Vite and Nuxt applications compile and build against the packed library, outside the
repository's pnpm workspace. Their source files and dependency lockfiles are checked in.
`vccs` always resolves to `file:../vccs.tgz` in the disposable application directory.

Prepare the dependency store with network access before an offline run:

```sh
node scripts/check-consumers.mjs --prepare
```

Preparation packs the current library, asks pnpm to refresh its local archive resolution,
fetches the locked production and development dependencies, then installs with
`--offline --frozen-lockfile`, typechecks and builds both consumers. It saves the resulting
lockfiles. Review their diff before committing them. Preparation does not update other direct
consumer dependencies; make any intended fixture dependency upgrades explicitly.

The normal check creates fresh applications and uses the prepared pnpm store:

```sh
node scripts/check-consumers.mjs
```

Repacking changes the archive's integrity even when its path stays the same. Before each
frozen installation, `pnpm update vccs --offline --lockfile-only` refreshes that local resolution
using pnpm's own integrity calculation. The runner does not edit hashes or change archive
paths. The refresh was checked with a modified packed README: only the local archive integrity
changed, and the frozen offline install contained the modified README. Registry resolutions
remained unchanged. Library dependency changes may require another network-enabled preparation;
an absent dependency fails the check instead of falling back to network resolution.

To prove network isolation on macOS, run the normal command under a profile that denies all
network access (including child processes):

```sh
sandbox-exec -p '(version 1)(allow default)(deny network*)' node scripts/check-consumers.mjs
```

On other systems, run it in a network-disabled container after preparation. `--offline` alone
proves pnpm's install mode; it does not prove a framework build made no network request.
Temporary applications are removed on success or failure. No server starts during these checks.
