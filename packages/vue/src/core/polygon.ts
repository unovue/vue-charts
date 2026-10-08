/** A closed SVG path through the points: `Mx,yLx,y…Z`. */
export function polygonPath(points: ReadonlyArray<{ x: number, y: number }>): string {
  return points.length ? `${points.map((point, i) => `${i === 0 ? 'M' : 'L'}${point.x},${point.y}`).join('')}Z` : ''
}
