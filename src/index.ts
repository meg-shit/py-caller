import type { ExecaChildProcess } from 'execa'
import type { IOptions } from './types'

import Logger from './logger'

const defaultOptions: IOptions = {
  killSignal: '\r\t--MegEXIT--\r\t',
  EOL: '\r\t--MegSeparator--\r\t',
}

export class PyCaller {
  subprocess!: ExecaChildProcess
  _promise: Promise<typeof import('execa')>
  _options: IOptions

  constructor(command: string, args: string[], options: Partial<IOptions> = {}, callback?: (data: string) => void) {
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
          callback?.(data.toString())
        })
      }

      if (subprocess.stderr) {
        subprocess.stderr.on('data', (data: string) => {
          callback?.(data.toString())
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

  destory() {
    this.subprocess?.kill()
  }
}
