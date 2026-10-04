# State migration

## Stage 3

- [x] Replace the combined state computed with a stable read-only Vue domain view.
- [x] Disable selector argument caching and retain result memoization with direct reselect.
- [x] Remove the empty Redux store, subscription bridge, dispatch hook, and Redux/Immer dependencies.
- [x] Prove pointer-only tooltip updates leave geometry calculations idle.
