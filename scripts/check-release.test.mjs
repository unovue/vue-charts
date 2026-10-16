import assert from 'node:assert/strict'
// eslint-disable-next-line test/no-import-node-test
import test from 'node:test'
import { changelogSection, setChangelogSection } from './lib/changelog.mjs'
import { groupCommits, parseCommit, pickBaseline, releaseEvidence, suggestIncrement } from './lib/release-plan.mjs'

const CHANGELOG = `# Changelog

## [1.0.0] - Unreleased

Rebuilt on Vue.

### Breaking changes

- Events replace callback props.

## [0.6.0] - 2026-09-09

Older notes.
`

test('parseCommit reads type, scope and the breaking marker', () => {
  assert.deepEqual(parseCommit('abcdef1 feat(usage): ship the guides'), { sha: 'abcdef1', type: 'feat', scope: 'usage', subject: 'ship the guides', breaking: false })
  assert.equal(parseCommit('abcdef2 fix(brush)!: keep movement one-to-one').breaking, true)
  assert.equal(parseCommit('abcdef3 not a conventional header').type, 'other')
})

test('groupCommits lists features before chores and folds unknown types into other', () => {
  const groups = groupCommits([
    parseCommit('a111111 chore: tidy'),
    parseCommit('b222222 feat: add sparkline'),
    parseCommit('c333333 wip: half done'),
  ])
  assert.deepEqual(groups.map(group => group.type), ['feat', 'chore', 'other'])
})

test('suggestIncrement prefers breaking, then features, then fixes', () => {
  assert.equal(suggestIncrement([parseCommit('a111111 docs: notes'), parseCommit('b222222 feat!: drop the store')]).increment, 'major')
  assert.equal(suggestIncrement([parseCommit('a111111 chore: bump deps'), parseCommit('b222222 feat: add Heatmap')]).increment, 'minor')
  assert.equal(suggestIncrement([parseCommit('a111111 fix: settle the brush')]).increment, 'patch')
  assert.equal(suggestIncrement([parseCommit('a111111 docs: readme')]).lowSignal, true)
})

test('baseline comes from git describe, not the highest version number', () => {
  // v1.1.0 exists in this repository but is an older lineage: semver sorting would pick it
  // and build a changelog covering 740 commits.
  assert.equal(pickBaseline({ described: 'v1.0.0-beta.2', tags: ['v1.1.0', 'v1.0.0-beta.2'] }), 'v1.0.0-beta.2')
  assert.equal(pickBaseline({ described: 'v1.0.0-beta.2', override: 'v0.6.0' }), 'v0.6.0')
  assert.throws(() => pickBaseline({ described: '' }), /Pass --from/)
})

test('releaseEvidence only accepts a release-tier PASS for that commit', () => {
  const table = [
    '| Claim | Command | Tier | Threshold | Can fail | Latest result |',
    '| --- | --- | --- | --- | --- | --- |',
    '| Unit tests | `vitest` | quick | all pass | a regression test | 2026-10-07 (38abb40): PASS, 1506 tests |',
    '| Playground sweep | `pnpm check:play` | release | 0 flags | a fixture | 2026-10-07 (38abb40): FAIL, 21 of 22 |',
  ].join('\n')
  assert.deepEqual(releaseEvidence('| Sweep | `pnpm check:play` | release | 0 flags | a fixture | 2026-10-07 (38abb40): PASS, 285 transitions |', '38abb40ffff'), { sha: '38abb40', result: '2026-10-07 (38abb40): PASS, 285 transitions' })
  assert.equal(releaseEvidence(table, '38abb40ffff'), null)
  assert.equal(releaseEvidence(table.replace('| release |', '| default |'), '38abb40ffff'), null)
})

test('changelogSection returns one version body and stops at the next heading', () => {
  const section = changelogSection(CHANGELOG, '1.0.0')
  assert.equal(section.date, 'Unreleased')
  assert.match(section.body, /Rebuilt on Vue\./)
  assert.match(section.body, /Events replace callback props\./)
  assert.doesNotMatch(section.body, /Older notes\./)
  assert.throws(() => changelogSection(CHANGELOG, '0.6.0-beta.1'), /no "## \[0.6.0-beta.1\]" section/)
  assert.throws(() => changelogSection('# Changelog\n\n## [1.0.0]\n\n## [0.9.0] - 2026-01-01\n\nx\n', '1.0.0'), /is empty/)
})

test('setChangelogSection dates the released version and keeps other sections', () => {
  const updated = setChangelogSection(CHANGELOG, '1.0.0', { body: 'Rebuilt on Vue.\n\n### Added\n\n- The usage CLI.', date: '2026-10-16' })
  assert.match(updated, /## \[1\.0\.0\] - 2026-10-16\n\nRebuilt on Vue\./)
  assert.match(updated, /## \[0\.6\.0\] - 2026-09-09\n\nOlder notes\./)
  assert.doesNotMatch(updated, /Unreleased/)
  assert.equal(changelogSection(updated, '1.0.0').body, 'Rebuilt on Vue.\n\n### Added\n\n- The usage CLI.')
})

test('setChangelogSection adds a section when the version is new', () => {
  const updated = setChangelogSection('# Changelog\n\n## [0.6.0] - 2026-09-09\n\nOlder notes.\n', '0.7.0', { body: 'New.', date: '2026-10-16' })
  assert.match(updated, /## \[0\.7\.0\] - 2026-10-16\n\nNew\./)
  assert.match(updated, /Older notes\./)
  assert.equal(changelogSection(updated, '0.7.0').body, 'New.')
})
