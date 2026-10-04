import { Fragment } from 'vue'
import type { ShallowRef, VNode } from 'vue'
import { Cell } from '@/components/Cell'

/**
 * Extract Cell VNode props from a VNode tree.
 * Handles Fragment wrapping from v-for.
 */
export function extractCellProps(vnodes: VNode[]): Record<string, any>[] {
  const result: Record<string, any>[] = []
  for (const vnode of vnodes) {
    if (vnode.type === Cell) {
      result.push(vnode.props ?? {})
    }
    else if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      result.push(...extractCellProps(vnode.children as VNode[]))
    }
  }
  return result
}

/**
 * Filter out Cell VNodes from a VNode tree, preserving non-Cell siblings.
 * Recursively descends Fragment children to preserve co-located content (e.g. LabelList).
 */
export function filterOutCells(vnodes: VNode[]): VNode[] {
  const result: VNode[] = []
  for (const vnode of vnodes) {
    if (vnode.type === Cell) {
      continue
    }
    if (vnode.type === Fragment && Array.isArray(vnode.children)) {
      result.push(...filterOutCells(vnode.children as VNode[]))
    }
    else {
      result.push(vnode)
    }
  }
  return result
}

/**
 * Stores the Cell props read during a render, but only when they changed: a new but equal array
 * would re-run everything that reads it (legend payloads, geometry) on every render.
 */
export function assignCells(target: ShallowRef<Record<string, any>[]>, cells: Record<string, any>[]) {
  const current = target.value
  const same = current.length === cells.length && cells.every((cell, i) => {
    const before = current[i]
    const keys = Object.keys(cell)
    return keys.length === Object.keys(before).length && keys.every(key => Object.is(cell[key], before[key]))
  })
  if (!same)
    target.value = cells
}
