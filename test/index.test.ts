import { fileURLToPath } from 'url'
import path from 'path'
import { describe, expect, it, vi } from 'vitest'
import { PyCaller } from '@'

const scriptPath = path.resolve(fileURLToPath(import.meta.url), './../../examples/demo.py')

describe('runs', async() => {
  const $consoleLog = vi.spyOn(console, 'log').mockImplementation(() => 'invoke')

  it('works', async() => {
    // eslint-disable-next-line no-console
    const caller = new PyCaller('python3', [scriptPath], data => console.log(data))

    caller.runPython(['come from nodejs'])
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
    expect($consoleLog).toBeCalled()
    expect(caller.subprocess.stdin?.writableEnded).toBe(false)
    caller.destory()
  })
})
