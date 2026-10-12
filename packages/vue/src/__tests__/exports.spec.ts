import { expect, it } from 'vitest'
import * as library from '@/index'
import * as nuxt from '@/nuxt'
import * as resolver from '@/resolver'

it('keeps the reviewed runtime export surface for every public entry', () => {
  expect({
    '.': Object.keys(library).sort(),
    './nuxt': Object.keys(nuxt).sort(),
    './resolver': Object.keys(resolver).sort(),
  }).toMatchSnapshot()
})
