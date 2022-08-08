import { fileURLToPath } from 'url'
import path from 'path'
import { setTimeout as _setTimeout } from 'timers/promises'
import type { SpyInstance } from 'vitest'
import { afterAll, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PyCaller, PyCallerPool } from '@'
import type { IPyCallerOptions } from '@/types'

const scriptPath = path.resolve(fileURLToPath(import.meta.url), './../../examples/demo.py')

const options: IPyCallerOptions = {
  command: 'python3',
  args: [scriptPath],
  // eslint-disable-next-line no-console
  callback: data => console.log(data),
}

describe('basic', async() => {
  let $consoleLog: null | SpyInstance = null
  const caller = new PyCaller(options)

  beforeEach(() => {
    $consoleLog = vi.spyOn(console, 'log').mockImplementation(() => 'invoke')
  })
  afterEach(() => {
    $consoleLog?.mockReset()
  })
  afterAll(() => {
    caller.destory()
  })

  it('works', async() => {
    caller.runPython(['come from nodejs'])
    await _setTimeout(1000)
    expect($consoleLog).toBeCalled()
    expect($consoleLog).toReturnWith('invoke')
    expect(caller.subprocess.stdin?.writableEnded).toBe(false)
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
    pool.send(key, ['come from nodejs'])
    await _setTimeout(1000)
    expect($console).toBeCalled()
    expect($console).toBeCalledTimes(2)
    expect($console).toReturnWith('invoke')
    expect(pool.listenerCount(key)).toBe(1)
    pool.send(key, [`come from nodejs ${id1}`], id1)
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
    pool.send(key, ['come from nodejs'])
    await _setTimeout(500)
    expect($console1).toBeCalled()
    expect($console2).toBeCalled()
    expect(pool.listenerCount(key)).toBe(2)
  })
})
