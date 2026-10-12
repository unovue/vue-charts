import { fireEvent, render } from '@testing-library/vue'
import { expect, it, vi } from 'vitest'
import { BarList, JourneySankey, Sparkline, Tracker } from '@/index'

const row = { metrics: { name: 'A', value: 10, status: 'up', path: ['A', 'B'] }, source: 'analytics' }

// Catches key access that only reads a flat property, and payloads replaced by mapped rows.
it.each(['nested', 'accessor'] as const)('reads %s keys while retaining source rows', async (mode) => {
  const nameKey = mode === 'nested' ? 'metrics.name' : (item: typeof row) => item.metrics.name
  const dataKey = mode === 'nested' ? 'metrics.value' : (item: typeof row) => item.metrics.value
  const statusKey = mode === 'nested' ? 'metrics.status' : (item: typeof row) => item.metrics.status
  const trackerClick = vi.fn()
  const listClick = vi.fn()
  const { container } = render(() => (
    <div>
      <Tracker width={100} height={20} data={[row]} dataKey={statusKey} nameKey={nameKey} isAnimationActive={false} {...{ 'onCell-click': trackerClick }}>
        {{ cell: ({ cell }) => <text data-fill={cell.fill}>{cell.payload.source}</text> }}
      </Tracker>
      <BarList data={[row]} dataKey={dataKey} nameKey={nameKey} isAnimationActive={false} {...{ 'onRow-click': listClick }}>
        {{ value: ({ row: source, formatted }) => `${source.source}:${formatted}` }}
      </BarList>
      <Sparkline width={100} height={40} data={[row]} dataKey={dataKey} nameKey={nameKey} curve="linear" isAnimationActive={false} />
    </div>
  ))
  const cell = container.querySelector('.v-charts-cell')!
  expect(cell.querySelector('text')?.textContent).toBe('analytics')
  expect(cell.querySelector('text')?.getAttribute('data-fill')).toBe('var(--v-charts-status-up, #22c55e)')
  expect(container.querySelector('.v-charts-bar-list-value')?.textContent).toBe('analytics:10')
  expect(container.querySelector('.v-charts-sparkline-line')?.getAttribute('d')).toBe('M50,20Z')
  await fireEvent.click(cell)
  await fireEvent.click(container.querySelector('.v-charts-bar-list-row')!)
  expect(trackerClick.mock.calls[0]?.[0]).toBe(row)
  expect(listClick.mock.calls[0]?.[0]).toBe(row)
})

// Catches aggregate payloads losing the original rows that contributed to a node or link.
it.each(['nested', 'accessor'] as const)('retains journey provenance with %s keys', async (mode) => {
  const other = { ...row, source: 'other' }
  const invalid = { ...row, metrics: { ...row.metrics, value: -1 } }
  const pathKey = mode === 'nested' ? 'metrics.path' : (item: typeof row) => item.metrics.path
  const dataKey = mode === 'nested' ? 'metrics.value' : (item: typeof row) => item.metrics.value
  const nodeClick = vi.fn()
  const linkClick = vi.fn()
  const { container } = render(() => (
    <JourneySankey width={500} height={300} data={[row, other, invalid]} pathKey={pathKey} dataKey={dataKey} isAnimationActive={false} {...{ 'onNode-click': nodeClick, 'onLink-click': linkClick }}>
      {{ label: ({ node }) => <text>{node.rows.map(source => source.source).join(',')}</text> }}
    </JourneySankey>
  ))
  expect([...container.querySelectorAll('.v-charts-journey-node text')].map(text => text.textContent))
    .toEqual(['analytics,other', 'analytics,other'])
  await fireEvent.click(container.querySelector('.v-charts-journey-node > g')!)
  await fireEvent.click(container.querySelector('.v-charts-journey-link-hit')!)
  expect(nodeClick.mock.calls[0]?.[0].rows).toEqual([row, other])
  expect(linkClick.mock.calls[0]?.[0].rows).toEqual([row, other])
  expect(nodeClick.mock.calls[0]?.[0].rows[0]).toBe(row)
  expect(linkClick.mock.calls[0]?.[0].rows[1]).toBe(other)
})
