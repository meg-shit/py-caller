import { fileURLToPath } from 'url'
import path from 'path'
import { setTimeout as _setTimeout } from 'timers/promises'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PyCaller, PyCallerPool } from '@'
import type { IPyCallerOptions } from '@/types'

const scriptPath = path.resolve(fileURLToPath(import.meta.url), './../../examples/demo.py')

const options: IPyCallerOptions = {
  command: 'python',
  args: [scriptPath],
  // eslint-disable-next-line no-console
  callback: data => console.log(data),
}

describe('basic', () => {
  const $consoleLog = vi.fn(() => 'invoke')

  it('works', async() => {
    let caller: PyCaller | null = null
    try {
      caller = new PyCaller({
        ...options,
        callback: () => {
          $consoleLog()
        },
      })
      await _setTimeout(500)
      expect(caller!.isAlive()).toBeTruthy()
      await caller!.runPython(['come from nodejs (basic)'])
      await _setTimeout(500)
      await caller!.runPython(['come from nodejs (basic)'])

      expect($consoleLog).toBeCalled()
      expect($consoleLog).toReturnWith('invoke')
      expect(caller!.subprocess.stdin?.writableEnded).toBe(false)
      await new Promise((resolve) => {
        caller?.subprocess.stdin?.end(() => {
          resolve(0)
        })
      })
    }
    catch (error) {}
    finally {
      if (caller) {
        await _setTimeout(100)
        caller.destory()
      }
    }
  })
})

describe('pools', () => {
  let pool!: PyCallerPool
  beforeEach(() => {
    pool = new PyCallerPool()
  })
  afterEach(() => {
    pool.destroy()
  })
  it('pool works with multiple callers', async() => {
    const $console = vi.fn(() => 'invoke')
    const key = 'default'
    pool.listen(key, (data) => {
      expect(data).not.toBeNull()
      $console()
    })
    const id1 = pool.create(key, options)
    pool.create(key, options)

    await _setTimeout(1000)
    pool.send(key, ['come from nodejs (pools multiple callers 1)'])
    await _setTimeout(1000)
    expect($console).toBeCalled()
    expect($console).toBeCalledTimes(2)
    expect($console).toReturnWith('invoke')
    expect(pool.listenerCount(key)).toBe(1)
    pool.send(key, [`come from nodejs ${id1} (pools multiple callers 2)`], id1)
    await _setTimeout(500)
    expect($console).toBeCalledTimes(3)
  })

  it('pool works with multiple listener', async() => {
    const $console1 = vi.fn(() => 'invoke1')
    const $console2 = vi.fn(() => 'invoke2')
    const key = 'default'
    pool.listen(key, (data) => {
      expect(data).not.toBeNull()
      $console1()
    })
    pool.listen(key, (data) => {
      expect(data).not.toBeNull()
      $console2()
    })
    pool.create(key, options)

    await _setTimeout(500)
    pool.send(key, ['come from nodejs (pools multiple listener)'])
    await _setTimeout(500)
    expect($console1).toBeCalled()
    expect($console2).toBeCalled()
    expect(pool.listenerCount(key)).toBe(2)
  })
})

describe('perf', async() => {
  const scriptPath = path.resolve(fileURLToPath(import.meta.url), './../../examples/size.py')

  const options: IPyCallerOptions = {
    command: 'python',
    args: [scriptPath],
    // eslint-disable-next-line no-console
    callback: (data) => {
      expect(data.length).toBe(1)
      expect(data?.[0].length).toBe(10485760)
    },
  }
  const caller = new PyCaller(options)

  afterAll(() => {
    caller.destory(true)
  })

  it('works with 10M Output', async() => {
    caller.runPython(['Ping!'])
    await _setTimeout(2000)

    expect(caller.subprocess.stdin?.writableEnded).toBe(false)
  })
})
