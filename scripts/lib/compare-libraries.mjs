// Pure helpers of scripts/compare-libraries.mjs, kept apart so their verdicts have tests.

/** A chart animates if the screen shows at least one state between its first and last, on entrance or on update. */
const animatedFrames = 3

export function animationVerdict({ enterFrames, updateFrames }, omitted) {
  const animated = enterFrames >= animatedFrames || updateFrames >= animatedFrames
  if (animated && omitted)
    return { ok: false, animated, message: `declared without animation but drew ${enterFrames}/${updateFrames} distinct frames` }
  if (!animated && !omitted)
    return { ok: false, animated, message: `expected animation but drew only ${enterFrames}/${updateFrames} distinct frames` }
  return { ok: true, animated }
}

/** The output a page loads up front: the entry and its static imports, with its CSS. Lazy chunks are left out. */
export function loadedOutputs(metafile, entryName) {
  const outputs = metafile.outputs
  const entry = Object.keys(outputs).find(file => outputs[file].entryPoint?.endsWith(entryName))
  if (!entry)
    throw new Error(`No output for entry ${entryName}`)
  const loaded = new Set([entry])
  for (const file of loaded) {
    for (const dep of outputs[file].imports) {
      if (dep.kind === 'import-statement' && !dep.external)
        loaded.add(dep.path)
    }
    const css = outputs[file].cssBundle
    if (css)
      loaded.add(css)
  }
  return [...loaded]
}

/**
 * Everything that must agree for the published numbers to describe the published cards: every library
 * has a chart and a locked install, the site and the bundles pin the same versions, the results
 * were measured at those versions, and every declared omission is explained with a source.
 */
export function comparisonProblems({ charts, libraries, reference, sitePins, bundleManifests, lockfiles, chartFiles, results }) {
  const problems = []
  for (const library of [...libraries, reference]) {
    const manifest = bundleManifests[library.id]
    if (!manifest) {
      problems.push(`${library.id}: no benchmark/bundles/${library.id}/package.json`)
      continue
    }
    if (!lockfiles.includes(library.id))
      problems.push(`${library.id}: no lockfile`)
    for (const name of library.packages) {
      const pin = manifest.dependencies?.[name]
      if (!pin)
        problems.push(`${library.id}: bundle manifest does not install ${name}`)
      else if (library !== reference && pin !== sitePins[name])
        problems.push(`${library.id}: ${name} is ${pin} in its bundle but ${sitePins[name]} in the site`)
    }
    for (const build of library.builds) {
      const row = results.builds.find(item => item.library === library.id && item.build === build.id)
      if (!row)
        problems.push(`${library.id}/${build.id}: no measurement in results/latest.json`)
      else if (library.packages.some(name => row.versions?.[name] !== manifest.dependencies?.[name]))
        problems.push(`${library.id}/${build.id}: measured versions differ from the pins; run pnpm compare:libraries`)
    }
  }
  for (const library of libraries) {
    for (const { id: chart } of charts) {
      const limit = library.limits?.[chart]
      const hasFile = chartFiles[chart]?.includes(`${library.id}.vue`)
      if (limit?.unsupported && hasFile)
        problems.push(`${library.id}: ${chart} is marked unsupported but has a chart file`)
      if (!limit?.unsupported && !hasFile)
        problems.push(`${library.id}: no chart at benchmark/site/src/charts/${chart}/${library.id}.vue`)
      for (const omission of limit?.unsupported ? ['the chart'] : limit?.omits ?? []) {
        if (!limit.note)
          problems.push(`${library.id}: ${chart} omits ${omission} without a note`)
        if (!limit.noteSource?.startsWith('https://'))
          problems.push(`${library.id}: ${chart} omits ${omission} without a source`)
      }
    }
  }
  return problems
}
