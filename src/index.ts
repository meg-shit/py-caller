import { EventEmitter } from 'events'
import os from 'os'
import { setTimeout as _setTimeout } from 'timers/promises'
import type { ExecaChildProcess } from 'execa'
import { execaSync } from 'execa'
import { nanoid } from 'nanoid'
import type { IOptions, IPyCallerOptions, IPyCallerPoolData, IPyCallerPoolOptions } from './types'

import Logger from './logger'

const defaultOptions: IOptions = {
  killSignal: '\t--MegEXIT--\t',
  killTimeout: 3000,
  EOL: '\t--MegSeparator--\t',
  AUTO_EOL: true,
  stdioOption: {
    stdin: 'pipe',
    stdout: 'pipe',
    stderr: 'inherit',
  },
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

      const subprocess = execa(command, args, this._options.stdioOption)

      if (subprocess.stdout) {
        // TODO
        // optimize use buffer
        const chunks: string[] = []
        subprocess.stdout.on('data', (data: string) => {
          const content = data.toString()
          if (!content)
            return

          console.warn(JSON.stringify(content))

          if (content.includes(this._options.killSignal)) {
            Logger.info('Python process received exited signal')
            this.destory()
            return
          }

          const commandStr = content
            .replaceAll(os.EOL, '\n')

          if (this._options.AUTO_EOL) {
            if (!commandStr.includes(this._options.EOL)) {
              chunks.push(commandStr)
              return
            }
          }

          const commands = commandStr.split(`${this._options.EOL}\n`)

          commands[0] = chunks.join('') + commands[0]
          chunks.splice(0, chunks.length)

          const len = commands.length
          if (len >= 2 && commands[len - 1] !== '') {
            chunks.push(commands[len - 1])
            commands[len - 1] = ''
          }

          Promise.resolve(callback?.(
            commands.filter(cmd => cmd !== ''),
          ))
        })
      }

      if (subprocess.stderr && this._options.stdioOption.stderr !== 'inherit') {
        subprocess.stderr.on('data', (data: string) => {
          Logger.error(new Error(`Python process error: ${data}`))
          if (data.includes(this._options.killSignal))
            this.destory()
        })
      }

      this.subprocess = subprocess
    })
  }

  async runPython(code: string[] | null) {
    if (!this.subprocess)
      await this._promise

    if (code === null) {
      this.subprocess.stdin?.write(this._options.killSignal, () => {
        Logger.info('Python process exited')
        this.subprocess.stdin?.end()
        this.destory()
      })
      return
    }
    const content = code.map(line => `${line}${os.EOL}`).join('')
    this.subprocess.stdin?.write(Buffer.from(content), async(error) => {
      if (error) {
        Logger.error(error)
        return
      }

      if (this._options.AUTO_EOL) {
        // flush too fast, will cause python read data as a single line
        // https://stackoverflow.com/questions/12510835/stdout-flush-for-nodejs
        await _setTimeout(100)
        this.subprocess.stdin?.write(Buffer.from(`${this._options.EOL}${os.EOL}`))
      }
    })
  }

  isAlive() {
    return !this.subprocess.killed
  }

  destory(force = false) {
    if (!this.subprocess)
      return

    if (force) {
      if (
        this.subprocess.pid
          && !this.subprocess.killed
          && os.platform() === 'win32'
      ) {
        const ret = execaSync('taskkill', ['/pid', `${this.subprocess.pid}`, '/f', '/t'])
        if (ret.exitCode)
          Logger.error(ret.stdout)
      }

      this.subprocess.kill('SIGKILL')

      return
    }

    this.subprocess?.kill()

    setTimeout(() => {
      if (this.isAlive()) {
        Logger.error('Python process still alive after 5s, force kill it')
        this.subprocess?.kill('SIGKILL')
      }
    }, this._options.killTimeout)
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
        caller.destory(true)
      })
      this._pool.delete(key)
      return
    }
    this._pool.forEach((callers) => {
      callers.forEach((caller) => {
        caller.destory(true)
      })
    })
    this._pool.clear()
  }
}
