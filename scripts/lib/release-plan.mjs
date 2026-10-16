// Release planning: conventional-commit parsing, grouping and the release-evidence check.
// Pure functions only — the CLI shell does the git and gh calls.

const CONVENTIONAL = /^([a-z]+)(?:\(([^)]+)\))?(!)?:\s*(.+)$/

// Ordered by what a reader of release notes looks for first.
const DISPLAY_ORDER = ['feat', 'fix', 'perf', 'refactor', 'docs', 'test', 'build', 'ci', 'chore', 'revert', 'other']

const USER_VISIBLE = new Set(['feat', 'fix', 'perf', 'refactor', 'revert'])

export function parseCommit(line) {
  const trimmed = line.trim()
  const separator = trimmed.indexOf(' ')
  if (separator === -1)
    return { sha: trimmed, type: 'other', subject: trimmed, breaking: false }
  const sha = trimmed.slice(0, separator)
  const header = trimmed.slice(separator + 1)
  const match = header.match(CONVENTIONAL)
  if (!match)
    return { sha, type: 'other', subject: header, breaking: false }
  return { sha, type: match[1], scope: match[2], subject: match[4], breaking: Boolean(match[3]) }
}

export function groupCommits(commits) {
  const byType = new Map()
  for (const commit of commits) {
    const type = DISPLAY_ORDER.includes(commit.type) ? commit.type : 'other'
    if (!byType.has(type))
      byType.set(type, [])
    byType.get(type).push(commit)
  }
  return DISPLAY_ORDER
    .filter(type => byType.has(type))
    .map(type => ({ type, commits: byType.get(type) }))
}

/**
 * The increment to hand to bumpp. bumpp owns version arithmetic, so this only classifies the
 * commits; a prerelease current version is left for the human to decide (finalize vs next beta).
 */
export function suggestIncrement(commits) {
  if (commits.some(commit => commit.breaking))
    return { increment: 'major', reason: 'a commit is marked breaking' }
  if (commits.some(commit => commit.type === 'feat'))
    return { increment: 'minor', reason: 'new features' }
  if (commits.some(commit => commit.type === 'fix' || commit.type === 'perf'))
    return { increment: 'patch', reason: 'fixes or performance work' }
  return { increment: 'patch', reason: 'no user-visible change', lowSignal: !commits.some(commit => USER_VISIBLE.has(commit.type)) }
}

/**
 * git describe names the nearest tag; sorting tags by semver instead would pick an older,
 * higher-numbered tag and produce a changelog covering months of history.
 */
export function pickBaseline({ described, override }) {
  if (override)
    return override
  if (!described)
    throw new Error('No baseline tag found. Pass --from=<tag>.')
  return described
}

/**
 * A release-tier PASS for the exact commit, read from the VERIFY.md gate table:
 * "| … | … | release | … | … | 2026-10-07 (38abb40): PASS, … |".
 */
export function releaseEvidence(markdown, sha) {
  const short = sha.slice(0, 7)
  for (const line of markdown.split('\n')) {
    const cells = line.split('|').map(cell => cell.trim())
    if (cells.length < 7 || cells[3] !== 'release')
      continue
    const result = cells[cells.length - 2]
    if (result.includes(`(${short})`) && result.includes('PASS'))
      return { sha: short, result }
  }
  return null
}

export function releaseNotesMarkdown(plan) {
  const lines = [
    `baseline ${plan.from} → ${plan.to} (${plan.commits.length} commits)`,
    `current version ${plan.current}; suggested increment ${plan.suggested.increment} (${plan.suggested.reason})`,
  ]
  if (plan.suggested.lowSignal)
    lines.push('nothing user-visible in this range — a release here is usually noise')
  if (plan.breakingFooters.length)
    lines.push(`BREAKING CHANGE footers on: ${plan.breakingFooters.join(', ')}`)
  lines.push('')
  for (const group of plan.groups) {
    lines.push(`${group.type} (${group.commits.length})`)
    for (const commit of group.commits)
      lines.push(`  ${commit.sha.slice(0, 7)} ${commit.scope ? `${commit.scope}: ` : ''}${commit.subject}${commit.breaking ? ' [breaking]' : ''}`)
    lines.push('')
  }
  return lines.join('\n').trimEnd()
}
