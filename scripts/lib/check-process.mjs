import { setTimeout } from 'node:timers/promises'

export async function stopProcess(child, graceMs = 2000) {
  if (child.exitCode !== null || child.signalCode !== null)
    return
  const exited = new Promise(resolve => child.once('exit', resolve))
  child.kill('SIGTERM')
  if (!await Promise.race([exited.then(() => true), setTimeout(graceMs, false)])) {
    child.kill('SIGKILL')
    if (!await Promise.race([exited.then(() => true), setTimeout(graceMs, false)]))
      throw new Error('Server did not exit after SIGKILL')
  }
}

export async function waitForServer(child, url, timeoutMs = 10000, listening = () => true) {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline && child.exitCode === null && child.signalCode === null) {
    const response = await fetch(url, { signal: AbortSignal.timeout(500) }).catch(() => null)
    if (response?.ok && listening() && child.exitCode === null && child.signalCode === null)
      return true
    await setTimeout(100)
  }
  return false
}
