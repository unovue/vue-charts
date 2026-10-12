import { open } from 'node:fs/promises'

// Drain during recording: neither the browser nor the transport retains the full payload.
export async function collectSeen(page, file) {
  const output = await open(file, 'w')
  await output.writeFile('{"frames":[')
  const frames = []
  const geometry = new Map()
  let first = true
  const state = { stopped: false }
  let failure
  async function drain() {
    const batch = await page.evaluate(() => window.seenRecording.frames.splice(0, 4))
    for (const frame of batch) {
      await output.writeFile(`${first ? '' : ','}${JSON.stringify(frame)}`)
      first = false
      for (const chart of frame.charts) {
        const signature = JSON.stringify(chart.geometry)
        const previous = geometry.get(chart.id)
        if (previous?.signature === signature)
          chart.geometry = previous.value
        else
          geometry.set(chart.id, { signature, value: chart.geometry })
      }
      frames.push(frame)
    }
    return batch.length
  }
  const pumping = (async () => {
    try {
      while (!state.stopped) {
        if (!await drain())
          await new Promise(resolve => setTimeout(resolve, 100))
      }
    }
    catch (error) {
      failure = error
    }
  })()
  return async function finish() {
    state.stopped = true
    try {
      await page.evaluate(() => { window.seenRecording.done = true })
      await pumping
      if (failure)
        throw failure
      let pending = await drain()
      while (pending)
        pending = await drain()
      await output.writeFile('],"shots":{')
      const shots = {}
      const ids = await page.evaluate(() => Object.keys(window.seenRecording.shots))
      for (const [index, id] of ids.entries()) {
        shots[id] = []
        await output.writeFile(`${index ? ',' : ''}${JSON.stringify(id)}:[`)
        const count = await page.evaluate(id => window.seenRecording.shots[id].length, id)
        for (let i = 0; i < count; i++) {
          const shot = await page.evaluate(({ id, i }) => window.seenRecording.shots[id][i], { id, i })
          await output.writeFile(`${i ? ',' : ''}${JSON.stringify(shot)}`)
          shots[id].push(shot)
        }
        await output.writeFile(']')
      }
      await output.writeFile('}}')
      return { frames, shots }
    }
    finally {
      await output.close()
    }
  }
}
