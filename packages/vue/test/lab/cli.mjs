// `pnpm lab <command>`: motion instruments for looking at and debugging animations. They record and
// report; they never decide a release (the gates are in `pnpm verify`). Every recording is listed in
// .evidence/lab/manifest.json and .evidence/lab/index.html.
/* eslint-disable no-console -- command-line output is the interface of this tool */
import { spawnSync } from 'node:child_process'
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join, relative } from 'node:path'
import { repo } from './shared.mjs'

const HELP = `Usage: pnpm lab <command> [options]

  film <scenario…> [--steps=a,b]   1x video, contact sheet, filmstrip and frames.json per transition
  timing <scenario…> [--steps=a,b] real-clock frame timing at normal speed and with the CPU slowed 4x
  seen [route…] [--only=docs|landing|play] [--width=390] [--skip-build]
                                   what a visitor sees: entrance filmstrips on the built docs and playground
  dev                              the lab app in a Vite dev server (?s=<scenario>)
  help                             this text

Shared options: --prod (production build of the lab), --browser=chromium|firefox|webkit.
Ports: VCCS_PORTS=4620-4629 moves every server into one range.
Output: .evidence/lab/<command>/, listed in .evidence/lab/manifest.json and index.html.
See packages/vue/test/lab/README.md for the scenarios and how to read the output.`

const lab = join(repo, '.evidence/lab')
const [command, ...rest] = process.argv.slice(2)
const options = rest.filter(arg => arg.startsWith('--'))
const names = rest.filter(arg => !arg.startsWith('--'))
const path = file => file && relative(repo, file)

function run(script, args) {
  const result = spawnSync(process.execPath, [join(repo, script), ...args], { cwd: repo, stdio: 'inherit' })
  if (result.error)
    throw result.error
  return result.status ?? 1
}

function readJson(file) {
  return existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : undefined
}

// One entry per recording; a new run replaces the entries of the same command and scenario/page.
function updateManifest(kind, entries) {
  mkdirSync(lab, { recursive: true })
  const file = join(lab, 'manifest.json')
  const previous = readJson(file)?.recordings ?? []
  const replaced = new Set(entries.map(entry => `${entry.command} ${entry.scenario ?? entry.page}`))
  const recordings = [...previous.filter(entry => !replaced.has(`${entry.command} ${entry.scenario ?? entry.page}`)), ...entries]
  writeFileSync(file, `${JSON.stringify({ updated: new Date().toISOString(), recordings }, null, 2)}\n`)
  const escape = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('"', '&quot;')
  const link = (label, target) => target ? `<a href="${escape(relative(lab, join(repo, target)))}">${label}</a>` : ''
  const rows = recordings.map((entry) => {
    const image = entry.files.sheet ?? entry.files.filmstrip
    return `<tr class="${entry.flags.length ? 'flag' : ''}"><td>${escape(entry.command)}</td><td>${escape(entry.scenario ?? `${entry.page} ${entry.width} ${entry.chart} ${entry.trigger}`)}</td><td>${escape(entry.step ?? entry.reliability ?? '')}</td><td>${entry.flags.map(escape).join('<br>') || 'none'}</td><td>${Object.entries(entry.files).map(([label, target]) => link(label, target)).join(' · ')}</td><td>${image ? `<img loading="lazy" src="${escape(relative(lab, join(repo, image)))}">` : ''}</td></tr>`
  }).join('')
  writeFileSync(join(lab, 'index.html'), `<!doctype html><meta charset="utf-8"><title>Motion lab recordings</title><style>body{font:13px system-ui;margin:24px;background:#fafafa;color:#111}table{border-collapse:collapse;width:100%}td{border-top:1px solid #ddd;padding:6px;vertical-align:top}.flag td:nth-child(4){color:#b91c1c}img{width:480px}</style><h1>Motion lab recordings</h1><p>Updated ${new Date().toISOString()} after <code>pnpm lab ${kind}</code>. Raw data: <a href="manifest.json">manifest.json</a>.</p><table>${rows}</table>`)
  console.log(`Lab manifest: ${path(file)} (${entries.length} recordings from this run) · ${path(join(lab, 'index.html'))}`)
}

function motion(kind, extra) {
  if (!names.length)
    throw new Error(`Name at least one scenario: pnpm lab ${kind} <scenario…> (see packages/vue/test/lab/README.md)`)
  const out = join(lab, kind)
  mkdirSync(out, { recursive: true })
  const status = run('packages/vue/test/lab/report.mjs', [...names, ...options, ...extra, `--out=${out}`])
  const rows = readJson(join(out, 'report.json')) ?? []
  const fresh = rows.filter(row => names.includes(row.scenario))
  updateManifest(kind, fresh.map(row => ({
    command: kind,
    scenario: row.scenario,
    step: row.step,
    flags: row.issues,
    errors: row.errors,
    ...(kind === 'timing' ? { timing: Object.fromEntries(Object.entries(row.timing).map(([rate, t]) => [rate, { worst: Math.round(t.worst), p95: Math.round(t.p95), slow: t.slow, longtasks: t.longtasks }])) } : {}),
    files: Object.fromEntries(Object.entries({ video: row.video, sheet: row.sheet, strip: row.strip, frames: row.frames, report: join(out, 'index.html') }).filter(([, file]) => file).map(([label, file]) => [label, path(file)])),
  })))
  return status
}

function seen() {
  const out = join(lab, 'seen')
  const status = run('scripts/seen.mjs', [...(names.length ? [`--route=${names.join(',')}`] : []), ...options, `--out=${out}`])
  const summary = readJson(join(out, 'summary.json'))
  if (summary) {
    updateManifest('seen', summary.rows.map(row => ({
      command: 'seen',
      page: `${row.site} ${row.page}`,
      width: row.width,
      chart: row.chart,
      trigger: row.trigger,
      reliability: row.reliability,
      flags: row.flags,
      files: Object.fromEntries(Object.entries({
        filmstrip: row.filmstrip && join(out, row.filmstrip),
        frames: row.recording && join(out, `${row.recording}.json`),
        video: summary.recordings.find(r => r.name === row.recording)?.video && join(out, summary.recordings.find(r => r.name === row.recording).video),
        report: join(out, 'index.html'),
      }).filter(([, file]) => file).map(([label, file]) => [label, path(file)])),
    })))
  }
  return status
}

async function dev() {
  const { startServer } = await import('./shared.mjs')
  const server = await startServer()
  console.log(`Motion lab: ${server.url}?s=bar (scenarios: packages/vue/test/lab/README.md). Ctrl+C stops it.`)
  await new Promise(resolve => process.once('SIGINT', resolve))
  await server.close()
}

if (!command || command === 'help' || command === '--help') {
  console.log(HELP)
}
else if (command === 'film') {
  process.exitCode = motion('film', ['--video', '--frames'])
}
else if (command === 'timing') {
  process.exitCode = motion('timing', ['--timing'])
}
else if (command === 'seen') {
  process.exitCode = seen()
}
else if (command === 'dev') {
  await dev()
}
else {
  console.error(`Unknown lab command "${command}"\n\n${HELP}`)
  process.exitCode = 1
}
