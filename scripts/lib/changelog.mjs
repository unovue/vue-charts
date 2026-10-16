// CHANGELOG.md sections, shared by the release CLI and the GitHub Release workflow so the
// published notes and the repository file can never disagree.

function headingPattern(version) {
  const escaped = version.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^## \\[${escaped}\\](?:\\s*-\\s*(.*))?$`, 'm')
}

export function changelogSection(markdown, version) {
  const match = markdown.match(headingPattern(version))
  if (!match)
    throw new Error(`CHANGELOG.md has no "## [${version}]" section.`)
  const rest = markdown.slice(match.index + match[0].length)
  const next = rest.search(/^## /m)
  const body = (next === -1 ? rest : rest.slice(0, next)).trim()
  if (!body)
    throw new Error(`CHANGELOG.md section for ${version} is empty.`)
  return { heading: match[0], date: match[1]?.trim() ?? '', body }
}

export function setChangelogSection(markdown, version, { body, date }) {
  const match = markdown.match(headingPattern(version))
  const section = `## [${version}] - ${date}\n\n${body.trim()}\n`
  if (!match)
    return `${markdown.trimEnd()}\n\n${section}`
  const start = match.index
  const rest = markdown.slice(start + match[0].length)
  const next = rest.search(/^## /m)
  const end = next === -1 ? markdown.length : start + match[0].length + next
  return `${markdown.slice(0, start)}${section}${next === -1 ? '' : `\n${markdown.slice(end)}`}`
}
