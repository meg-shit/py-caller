import { release } from 'os'
import { afterAll, describe, expect, it, vi } from 'vitest'
import { runPython } from '@'

describe('runs', async() => {
  const $consoleLog = vi.spyOn(console, 'log').mockImplementation(() => 'invoke')
  it('works', async() => {
    runPython(['import os\n', 'print(os.listdir("."), flush=True)\n'])
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
    expect($consoleLog).toBeCalled()
  })
  it('again', async() => {
    runPython(['print("Hello World", flush=True)\n'])
    await new Promise<void>((resolve) => {
      setTimeout(() => {
        resolve()
      }, 500)
    })
    expect($consoleLog).toBeCalled()
  })
  afterAll(() => {
    release()
  })
})
