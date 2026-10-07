/** A cell of a keyed grid as the transition plan sees it. */
export interface GridItem {
  /** Stable identity across data changes. */
  key: string
  row: number
  column: number
  x: number
  y: number
  width: number
  height: number
}

export interface GridSeams<C extends GridItem> {
  /** Where an arriving cell starts: a zero-thick line on the seam it opens. */
  enter: Map<string, C>
  /** Where a leaving cell ends: a zero-thick line on the seam it closes. */
  exit: Map<string, C>
}

export interface GridTransitionPlan<C extends GridItem> {
  /** On-screen identity per cell key. */
  keys: Map<string, string>
  /** Cells that move far against the common move: they shrink and regrow instead of streaking. */
  jumping: Set<string>
  seams: GridSeams<C>
}

export function emptyGridTransitionPlan<C extends GridItem>(): GridTransitionPlan<C> {
  return { keys: new Map(), jumping: new Set(), seams: { enter: new Map(), exit: new Map() } }
}

/**
 * A cell removed between two staying grid neighbours (a row dropped from the middle) closes
 * onto the line where those neighbours meet after the change; a cell added between two opens
 * from the line where they met before. Both ends move on the same clock as the neighbours, so
 * the cell always fills exactly the gap between them and never overlaps either.
 */
function findSeams<C extends GridItem>(previous: readonly C[], next: readonly C[]): GridSeams<C> {
  const seams: GridSeams<C> = { enter: new Map(), exit: new Map() }
  const before = new Map(previous.map(cell => [cell.key, cell]))
  const after = new Map(next.map(cell => [cell.key, cell]))
  const position = (cells: readonly C[]) => new Map(cells.map(cell => [`${cell.row}:${cell.column}`, cell]))
  const oldAt = position(previous)
  const newAt = position(next)
  const seamBetween = (cell: C, at: Map<string, C>, stays: Map<string, C>): C | undefined => {
    // The staying versions of the two neighbours at grid positions `a` and `b`.
    const pair = (a: string, b: string) => {
      const first = at.get(a)
      const second = at.get(b)
      const stayingFirst = first && stays.get(first.key)
      const stayingSecond = second && stays.get(second.key)
      return stayingFirst && stayingSecond ? [stayingFirst, stayingSecond] as const : undefined
    }
    const vertical = pair(`${cell.row - 1}:${cell.column}`, `${cell.row + 1}:${cell.column}`)
    if (vertical)
      return { ...cell, y: (vertical[0].y + vertical[0].height + vertical[1].y) / 2, height: 0 }
    const horizontal = pair(`${cell.row}:${cell.column - 1}`, `${cell.row}:${cell.column + 1}`)
    if (horizontal)
      return { ...cell, x: (horizontal[0].x + horizontal[0].width + horizontal[1].x) / 2, width: 0 }
    return undefined
  }
  for (const cell of previous) {
    if (!after.has(cell.key)) {
      const seam = seamBetween(cell, oldAt, after)
      if (seam)
        seams.exit.set(cell.key, seam)
    }
  }
  for (const cell of next) {
    if (!before.has(cell.key)) {
      const seam = seamBetween(cell, newAt, before)
      if (seam)
        seams.enter.set(cell.key, seam)
    }
  }
  return seams
}

/**
 * Plans how a keyed grid moves from `previous` to `next`. Identity on screen is usually the
 * cell's own key, with two exceptions decided per change:
 * - A few cells move far against the common grid move (Sundays wrapping to the last row when
 *   the week start changes): they shrink and regrow in place instead of streaking across.
 * - Nothing stays, or most cells would have to jump (a different year, a reversed axis):
 *   new cells take over the node at the same grid position, so the grid recolors in place
 *   instead of every cell shrinking and growing at once.
 *
 * `generation` must differ per call; it keeps a reused on-screen key unique.
 */
export function planGridTransition<C extends GridItem>(
  previous: readonly C[],
  next: readonly C[],
  previousKeys: ReadonlyMap<string, string>,
  generation: number,
): GridTransitionPlan<C> {
  const before = new Map(previous.map(cell => [cell.key, cell]))
  const jumping = new Set<string>()
  const moves = new Map<string, number>()
  let staying = 0
  for (const cell of next) {
    const old = before.get(cell.key)
    if (old) {
      staying++
      const move = `${cell.column - old.column}:${cell.row - old.row}`
      moves.set(move, (moves.get(move) ?? 0) + 1)
    }
  }
  const common = [...moves].reduce<[string, number] | undefined>((best, entry) => !best || entry[1] > best[1] ? entry : best, undefined)?.[0]
  if (common !== undefined) {
    // Only moves that leave the common move by more than one cell would cross the grid;
    // neighbours of a removed or added row or column simply slide one step.
    const [commonColumn, commonRow] = common.split(':').map(Number)
    for (const cell of next) {
      const old = before.get(cell.key)
      if (old && Math.abs(cell.column - old.column - commonColumn) + Math.abs(cell.row - old.row - commonRow) > 1)
        jumping.add(cell.key)
    }
  }
  const inPlace = previous.length > 0 && (staying === 0 || jumping.size > staying / 2)
  if (inPlace)
    jumping.clear()

  const byPosition = new Map(previous.map(cell => [`${cell.row}:${cell.column}`, previousKeys.get(cell.key) ?? cell.key]))
  const keys = new Map<string, string>()
  const used = new Set<string>()
  for (const cell of next) {
    let key = inPlace
      ? byPosition.get(`${cell.row}:${cell.column}`) ?? cell.key
      : previousKeys.get(cell.key) ?? cell.key
    if (used.has(key))
      key = `${cell.key}\u0000${generation}`
    used.add(key)
    keys.set(cell.key, key)
  }
  return { keys, jumping, seams: inPlace ? { enter: new Map(), exit: new Map() } : findSeams(previous, next) }
}
