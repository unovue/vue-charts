import { resolve } from 'node:path'
import ts from 'typescript'
import { expect, it } from 'vitest'

it('rejects invalid event names, payloads, and listener signatures', () => {
  const configPath = resolve('tsconfig.json')
  const config = ts.readConfigFile(configPath, ts.sys.readFile)
  expect(config.error).toBeUndefined()
  const parsed = ts.parseJsonConfigFileContent(config.config, ts.sys, resolve('.'))
  expect(parsed.errors).toEqual([])
  const fixturePath = resolve('src/test/events-contract.ts')
  const program = ts.createProgram([fixturePath], {
    ...parsed.options,
    strict: true,
    composite: false,
    incremental: false,
  })
  const fixture = program.getSourceFile(fixturePath)
  expect(fixture).toBeDefined()
  const diagnostics = [
    ...program.getSyntacticDiagnostics(fixture),
    ...program.getSemanticDiagnostics(fixture),
    ...program.getSemanticDiagnostics(program.getSourceFile(resolve('src/utils/events.ts'))),
  ]
  expect(diagnostics.map(diagnostic => ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n'))).toEqual([])
}, 15000)
