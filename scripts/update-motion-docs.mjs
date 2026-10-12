// Keep the existing guide table synchronized with the chart motion timings.
/* eslint-disable no-console -- command-line output */
import { readFileSync, writeFileSync } from 'node:fs'
import { cascadeTiming, drawTiming, motionTokens } from '../packages/vue/src/animation/motion.ts'

const guide = new URL('../docs/content/2.guides/12.animation.md', import.meta.url)
const source = readFileSync(guide, 'utf8')
const rows = [
  ['First appearance', motionTokens.enter.duration, 'ease-out cubic'],
  ['Cascade entrance', cascadeTiming.duration, 'staggered ease-out cubic'],
  ['Line and area draw', `${drawTiming(0).duration}–${drawTiming(Infinity).duration}`, 'steady pace'],
  ['Data change', motionTokens.update.duration, 'ease-out quint'],
  ['Exit', motionTokens.exit.duration, 'ease-out quint'],
  ['Pointer feedback and tooltip appearance', motionTokens.feedback.duration, motionTokens.feedback.cssEase],
  ['Color change', motionTokens.color.duration, motionTokens.color.cssEase],
]
const table = [
  '| Phase | Duration | Curve |',
  '|---|---|---|',
  ...rows.map(([phase, duration, curve]) => `| ${phase} | ${duration} s | ${curve} |`),
].join('\n')
const start = source.indexOf('| Phase | Duration | Curve |')
const end = source.indexOf('\n\n', start)
if (start < 0 || end < 0)
  throw new Error('Motion guide timing table not found')
const next = source.slice(0, start) + table + source.slice(end)
if (process.argv.includes('--check')) {
  if (next !== source) {
    console.error('Motion guide timings are stale; run node scripts/update-motion-docs.mjs')
    process.exitCode = 1
  }
  else {
    console.log('PASS: motion guide timings match the source tokens')
  }
}
else {
  writeFileSync(guide, next)
  console.log('Updated the motion guide timing table')
}
