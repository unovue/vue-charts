# Motion consumer check

`pnpm check:motion` builds the library and this plain Vite app, which imports `vccs` from
`packages/vue/dist/es/index.mjs`. It runs every scenario in headless Chromium on a free port in
4600–4699 and writes results and failure screenshots to `.evidence/motion/`.

Each scenario measures the 800 ms after a data change: at least 42 frames, no frame interval over
34 ms except one up to 50 ms, no Vue warnings or page errors, and no recreated DOM element for a
retained data key (elements are compared by object identity on every frame). Line and stacked
Area go from 90 days to 7 and back; their path edges must keep the x order. The hover sweep must
read no layout and keep exactly one tooltip position spring pair running.

A fixture-only module wraps the real `motion-v` `useSpring` to count springs; it does not change
animation. Frame timing depends on the machine: treat a failure as a regression signal and rerun
on a quiet machine before you trust it.

Install the browser once with `node scripts/lib/browser.mjs --install-browser chromium-headless-shell`,
or point `MOTION_EXECUTABLE_PATH` at an installed Chromium headless shell.
