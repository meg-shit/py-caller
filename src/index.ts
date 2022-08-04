import { EventEmitter } from 'stream'
import type { ExecaChildProcess } from 'execa'
import { nanoid } from 'nanoid'
import type { IOptions, IPyCallerOptions, IPyCallerPoolData, IPyCallerPoolOptions } from './types'

import Logger from './logger'

const defaultOptions: IOptions = {
  killSignal: '\r\t--MegEXIT--\r\t',
  EOL: '\r\t--MegSeparator--\r\t',
}

export class PyCaller {
  _id?: string
  _promise: Promise<typeof import('execa')>
  _options: IOptions
  subprocess!: ExecaChildProcess

  constructor(callerOptions: IPyCallerOptions, _id?: string) {
    const { command, args, options = {}, callback } = callerOptions
    if (_id)
      this._id = _id

    this._options = { ...defaultOptions, ...options }
    this._promise = import('execa')

    this._promise.then((m) => {
      const { execa } = m

      const subprocess = execa(command, args, {
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'pipe',
      })

      if (subprocess.stdout) {
        subprocess.stdout.on('data', (data: string) => {
          const content = data.toString()
          if (content.includes(this._options.killSignal)) {
            Logger.info('Python process received exited signal')
            this.destory()
            return
          }
          callback?.(data.toString())
        })
      }

      if (subprocess.stderr) {
        subprocess.stderr.on('data', (data: string) => {
          this.destory()
          Logger.error(data.toString())
        })
      }

      this.subprocess = subprocess
    })
  }

  async runPython(code: string[] | null) {
    if (!this.subprocess)
      await this._promise

    if (code === null) {
      this.subprocess.stdin?.write(this._options.EOL, () => {
        Logger.info('Python process exited')
        this.subprocess.stdin?.end()
      })
      return
    }
    const content = code.map(line => `${line}\n`).join('')
    this.subprocess.stdin?.write(Buffer.from(content))
  }

  isAlive() {
    return !this.subprocess.killed
  }

  destory() {
    if (!this.subprocess)
      return

    this.subprocess?.kill()
    setTimeout(() => {
      if (this.isAlive()) {
        Logger.error('Python process still alive after 5s, force kill it')
        this.subprocess?.kill('SIGKILL')
      }
    }, 5000)
  }
}

export class PyCallerPool extends EventEmitter {
  _pool: Map<string, Set<PyCaller>>

  constructor() {
    super()
    this._pool = new Map()
  }

  create(key: string, options: IPyCallerPoolOptions) {
    if (!key)
      throw new Error('key is required')

    if (!this._pool.has(key))
      this._pool.set(key, new Set())

    const _id = options._id || nanoid()

    const callback = (data: string) => {
      this.emit(key, { _id, data })
    }

    const caller = new PyCaller({ ...options, callback }, _id)
    this._pool.get(key)?.add(caller)
    return _id
  }

  get(key: string) {
    return this._pool.get(key)?.values()
  }

  listen(key: string, callback: (data: IPyCallerPoolData) => void) {
    this.on(key, callback)
  }

  send(key: string, code: string[] | null, _id?: string) {
    if (_id) {
      const callers = this._pool.get(key)
      callers?.forEach((caller) => {
        if (caller._id === _id)
          caller.runPython(code)
      })
      return
    }
    this._pool.get(key)?.forEach((caller) => {
      caller.runPython(code)
    })
  }

  destroy(key?: string) {
    if (key) {
      this._pool.get(key)?.forEach((caller) => {
        caller.destory()
      })
      this._pool.delete(key)
      return
    }
    this._pool.forEach((callers) => {
      callers.forEach((caller) => {
        caller.destory()
      })
    })
    this._pool.clear()
  }
}
