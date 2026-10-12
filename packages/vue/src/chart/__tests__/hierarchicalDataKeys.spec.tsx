import { fireEvent, render } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { Treemap } from '../Treemap'
import { SunburstChart } from '../SunburstChart'
import type { DataKey } from '@/types'

interface Entry {
  name: string
  a: { b: number }
  label: { text: string }
}

const leaves: Entry[] = [
  { name: 'unused A', a: { b: 12 }, label: { text: 'A' } },
  { name: 'unused B', a: { b: 24 }, label: { text: 'B' } },
]

const keys: { dataKey: DataKey<Entry>, nameKey: DataKey<Entry> }[] = [
  { dataKey: 'a.b', nameKey: 'label.text' },
  { dataKey: entry => entry.a?.b, nameKey: entry => entry.label?.text },
]

describe('hierarchical data keys', () => {
  it('resolves nested and function value/name keys for both charts and treemap drilldown', async () => {
    for (const { dataKey, nameKey } of keys) {
      const treemap = render(() => (
        <Treemap data={leaves} width={600} height={400} dataKey={dataKey} nameKey={nameKey} isAnimationActive={false}>
          {{ content: node => <rect data-name={node.name} data-value={node.value} width={node.width} height={node.height} /> }}
        </Treemap>
      ))
      const rects = [...treemap.container.querySelectorAll('rect[data-name]')]
      expect(rects.map(rect => [rect.getAttribute('data-name'), rect.getAttribute('data-value'), rect.getAttribute('width'), rect.getAttribute('height')])).toEqual([
        ['B', '24', '400', '400'],
        ['A', '12', '200', '400'],
      ])
      treemap.unmount()

      const sunburst = render(() => (
        <SunburstChart data={{ name: 'root', children: leaves }} width={600} height={400} dataKey={dataKey} nameKey={nameKey} isAnimationActive={false}>
          {{ content: node => <path data-name={node.name} data-value={node.value} /> }}
        </SunburstChart>
      ))
      expect([...sunburst.container.querySelectorAll('path[data-name]')].map(path => [path.getAttribute('data-name'), path.getAttribute('data-value')])).toEqual([
        ['B', '24'],
        ['A', '12'],
      ])
      sunburst.unmount()

      const nest = render(() => (
        <Treemap data={[{ name: 'unused group', label: { text: 'Group' }, children: leaves }]} type="nest" width={600} height={400} dataKey={dataKey} nameKey={nameKey} isAnimationActive={false}>
          {{ content: node => <rect data-name={node.name} data-value={node.value} width={node.width} height={node.height} /> }}
        </Treemap>
      ))
      const group = nest.container.querySelector('rect[data-name]')!
      expect([group.getAttribute('data-name'), group.getAttribute('data-value'), group.getAttribute('height')]).toEqual(['Group', '36', '400'])
      await fireEvent.click(group)
      expect([...nest.container.querySelectorAll('rect[data-name]')].map(rect => rect.getAttribute('data-name'))).toEqual(['B', 'A'])
      nest.unmount()
    }
  })
})
