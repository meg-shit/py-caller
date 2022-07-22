import type { ExecaChildProcess } from 'execa'

import Logger from './logger'

const EOL = '\r\t--MegSeparator--\r\t'

export class PyCaller {
  subprocess!: ExecaChildProcess

  constructor(command: string, args: string[], callback?: (data: string) => void) {
    import('execa').then((m) => {
      const { execa } = m

      const subprocess = execa(command, args, {
        stdin: 'pipe',
        stdout: 'pipe',
        shell: true,
      })

      if (subprocess.stdout) {
        subprocess.stdout.on('data', (data: string) => {
          Logger.info(data.toString())
          callback?.(data.toString())
        })
      }
      this.subprocess = subprocess
    })
  }

  runPython(code: string[] | null) {
    if (code === null) {
      this.subprocess.stdin?.write(EOL, () => {
        Logger.info('Python process exited')
        this.subprocess.stdin?.end()
      })
      return
    }
    const content = code.map(line => `${line}\n`).join('')
    this.subprocess.stdin?.write(Buffer.from(content))
    this.subprocess.stdin?.write('\r\n')
  }

  destory() {
    this.subprocess.kill()
  }
}
