/* eslint-disable no-console -- a command-line report */
// Release CLI: plan a version, check the gates a publish needs, and write the CHANGELOG section
// that the GitHub Release body is published from.
//   plan    — baseline, grouped commits and the suggested increment (read-only)
//   check   — the gates that must hold before bumping (read-only)
//   notes   — write the CHANGELOG section from a body file and print the diff
//   section — print one version's notes, exactly as the release workflow will publish them
import { spawnSync } from 'node:child_process'
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { changelogSection, setChangelogSection } from './lib/changelog.mjs'
import { groupCommits, parseCommit, pickBaseline, releaseEvidence, releaseNotesMarkdown, suggestIncrement } from './lib/release-plan.mjs'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const VERSION = /^\d+\.\d+\.\d+(?:-[0-9a-z.-]+)?$/i

function run(command, args, { allowFailure = false } = {}) {
  const result = spawnSync(command, args, { cwd: root, encoding: 'utf8' })
  if (result.error)
    throw result.error
  if (result.status !== 0 && !allowFailure)
    throw new Error(`${command} ${args.join(' ')} failed: ${(result.stderr || '').trim()}`)
  return { status: result.status, stdout: result.stdout ?? '', stderr: result.stderr ?? '' }
}

const git = (args, options) => run('git', args, options).stdout

function parseArgs(argv) {
  const [command, ...rest] = argv
  const flags = {}
  for (const arg of rest) {
    const match = arg.match(/^--([^=]+)(?:=(.*))?$/)
    if (!match)
      throw new Error(`Unexpected argument "${arg}".`)
    flags[match[1]] = match[2] ?? true
  }
  return { command, flags }
}

function currentVersion() {
  return JSON.parse(readFileSync(join(root, 'packages/vue/package.json'), 'utf8')).version
}

function buildPlan(from) {
  const described = git(['describe', '--tags', '--abbrev=0', 'HEAD']).trim()
  const baseline = pickBaseline({ described, override: from })
  const range = `${baseline}..HEAD`
  const commits = git(['log', '--format=%h %s', range]).split('\n').filter(Boolean).map(parseCommit)
  const footers = new Set(git(['log', '--format=%h', '--grep=^BREAKING CHANGE', range]).split('\n').filter(Boolean))
  for (const commit of commits)
    commit.breaking ||= footers.has(commit.sha)
  return {
    from: baseline,
    to: git(['rev-parse', '--short', 'HEAD']).trim(),
    commits,
    groups: groupCommits(commits),
    suggested: suggestIncrement(commits),
    breakingFooters: [...footers],
    current: currentVersion(),
  }
}

function plan(flags) {
  const built = buildPlan(flags.from)
  console.log(releaseNotesMarkdown(built))
  console.log(`\nnext: write the CHANGELOG body, then  node scripts/release.mjs notes --version=<version> --body-file=<file>`)
  console.log(`      bump with  pnpm exec bumpp ${built.suggested.increment} -y   (bumpp owns the version arithmetic)`)
}

/**
 * A squashed trunk commit has no workflow run of its own — `test.yml` runs on pull requests —
 * so ask the PR that landed it. A direct push falls back to a run on the commit.
 */
function ciGate(sha, record) {
  const prs = run('gh', ['api', `repos/{owner}/{repo}/commits/${sha}/pulls`, '--jq', '.[].number'], { allowFailure: true })
  const numbers = prs.stdout.trim().split('\n').filter(Boolean)
  if (prs.status === 0 && numbers.length) {
    const number = numbers[numbers.length - 1]
    const checks = run('gh', ['pr', 'checks', number], { allowFailure: true })
    const failing = checks.stdout.split('\n').filter(line => /fail|pending/i.test(line)).map(line => line.trim()).slice(0, 3)
    record(`CI green on the PR that landed HEAD (#${number})`, checks.status === 0, checks.status === 0 ? '' : failing.join('; ') || 'checks not complete')
    return
  }
  const runs = run('gh', ['run', 'list', '--commit', sha, '--limit', '5', '--json', 'workflowName,conclusion', '--jq', '.[] | "\\(.workflowName): \\(.conclusion)"'], { allowFailure: true })
  const found = runs.stdout.trim()
  record('CI green for HEAD', runs.status === 0 && found !== '' && !found.includes('null') && !/failure|cancelled/.test(found), found || 'no pull request and no workflow run for HEAD')
}

function check(flags) {
  const results = []
  const record = (name, ok, detail) => results.push({ name, ok, detail })

  const branch = git(['rev-parse', '--abbrev-ref', 'HEAD']).trim()
  record('on main', branch === 'main', branch)

  const dirty = git(['status', '--porcelain']).trim()
  record('clean working tree', dirty === '', dirty.split('\n')[0] ?? '')

  const remote = run('git', ['rev-parse', '--verify', '--quiet', 'origin/main'], { allowFailure: true })
  if (remote.status === 0) {
    const head = git(['rev-parse', 'HEAD']).trim()
    const upstream = remote.stdout.trim()
    record('in sync with origin/main', head === upstream, head === upstream ? '' : `${head.slice(0, 7)} vs ${upstream.slice(0, 7)}`)
  }
  else {
    record('in sync with origin/main', false, 'origin/main not found')
  }

  if (flags.version && VERSION.test(flags.version))
    record(`tag v${flags.version} is free`, git(['tag', '-l', `v${flags.version}`]).trim() === '', '')
  else if (flags.version)
    record('version argument', false, `"${flags.version}" is not a semver version`)
  else
    record('tag v<version> is free', false, 'pass --version=<version> so the tag can be checked')

  const sha = git(['rev-parse', 'HEAD']).trim()
  ciGate(sha, record)

  const evidence = releaseEvidence(readFileSync(join(root, 'VERIFY.md'), 'utf8'), sha)
  if (flags['skip-verify'])
    record('release-tier verification', true, 'skipped by --skip-verify')
  else
    record(`release-tier verification for ${sha.slice(0, 7)}`, Boolean(evidence), evidence ? evidence.result : 'no release-tier PASS row in VERIFY.md (run pnpm verify --release, or pass --skip-verify)')

  for (const result of results)
    console.log(`${result.ok ? 'PASS' : 'FAIL'}  ${result.name}${result.detail ? `  — ${result.detail}` : ''}`)
  const failed = results.filter(result => !result.ok)
  if (failed.length) {
    console.log(`\n${failed.length} gate(s) failed; a release from here needs them cleared or an explicit override.`)
    process.exitCode = 1
  }
  else {
    console.log('\nAll gates pass. Next: node scripts/release.mjs plan')
  }
}

function readChangelog() {
  return readFileSync(join(root, 'CHANGELOG.md'), 'utf8')
}

function notes(flags) {
  if (!flags.version || !VERSION.test(flags.version))
    throw new Error('Pass --version=<semver version>.')
  if (!flags['body-file'] || !existsSync(resolve(flags['body-file'])))
    throw new Error('Pass --body-file=<path to the markdown body>.')
  const body = readFileSync(resolve(flags['body-file']), 'utf8').trim()
  if (!body)
    throw new Error(`${flags['body-file']} is empty.`)
  const date = flags.date ?? new Date().toISOString().slice(0, 10)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
    throw new Error(`--date=${date} is not YYYY-MM-DD.`)

  const before = readChangelog()
  writeFileSync(join(root, 'CHANGELOG.md'), setChangelogSection(before, flags.version, { body, date }))
  const section = changelogSection(readChangelog(), flags.version)
  console.log(`Wrote CHANGELOG.md section [${flags.version}] - ${section.date} (${section.body.length} chars).`)
  console.log(run('git', ['--no-pager', 'diff', '--', 'CHANGELOG.md']).stdout)
  console.log('This is the text the GitHub Release will publish. Review it, then commit and bump.')
}

function section(flags) {
  if (!flags.version || !VERSION.test(flags.version))
    throw new Error('Pass --version=<semver version>.')
  process.stdout.write(`${changelogSection(readChangelog(), flags.version).body}\n`)
}

function usage() {
  return [
    'Usage: node scripts/release.mjs <command> [options]',
    '',
    '  plan [--from=<tag>]                              baseline, grouped commits, increment',
    '  check --version=<version> [--skip-verify]        release gates',
    '  notes --version=<version> --body-file=<file> [--date=YYYY-MM-DD]',
    '  section --version=<version>                      the notes the release workflow publishes',
  ].join('\n')
}

const { command, flags } = parseArgs(process.argv.slice(2))
try {
  if (command === 'plan')
    plan(flags)
  else if (command === 'check')
    check(flags)
  else if (command === 'notes')
    notes(flags)
  else if (command === 'section')
    section(flags)
  else
    throw new Error(usage())
}
catch (error) {
  console.error(error.message)
  process.exitCode = 1
}
