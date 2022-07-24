import type { ExecaChildProcess } from 'execa'

import Logger from './logger'

const EOL = '\r\t--MegSeparator--\r\t'

export class PyCaller {
  subprocess!: ExecaChildProcess
  _promise: Promise<typeof import('execa')>

  constructor(command: string, args: string[], callback?: (data: string) => void) {
    this._promise = import('execa')

    this._promise.then((m) => {
      const { execa } = m

      const subprocess = execa(command, args, {
        stdin: 'pipe',
        stdout: 'pipe',
        shell: true,
      })

      if (subprocess.stdout) {
        subprocess.stdout.on('data', (data: string) => {
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
      this.subprocess.stdin?.write(EOL, () => {
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
