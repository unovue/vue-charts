import { expect, it } from 'vitest'
import { createSSRApp, defineComponent } from 'vue'
import { renderToString } from 'vue/server-renderer'
import { Bar, BarChart, XAxis, YAxis } from '@/index'

it('renders different concurrent SSR charts exactly as their solo requests', async () => {
  const fixtures = [
    { width: 300, name: 'First', value: 10 },
    { width: 500, name: 'Second', value: 40 },
  ].map(({ width, name, value }) => defineComponent({
    async setup() {
      await Promise.resolve()
      return () => (
        <BarChart width={width} height={300} data={[{ name, value }]}>
          <XAxis dataKey="name" />
          <YAxis domain={[0, 40]} />
          <Bar dataKey="value" isAnimationActive={false} />
        </BarChart>
      )
    },
  }))
  const solo = []
  for (const fixture of fixtures)
    solo.push(await renderToString(createSSRApp(fixture)))
  const concurrent = await Promise.all(fixtures.map(fixture => renderToString(createSSRApp(fixture))))
  expect(concurrent).toEqual(solo)
  expect(concurrent[0]).toContain('First')
  expect(concurrent[0]).not.toContain('Second')
  expect(concurrent[1]).toContain('Second')
  expect(concurrent[1]).not.toContain('First')
})
