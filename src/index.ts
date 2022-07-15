import stream from 'stream'
import { execa } from 'execa'
import Logger from './logger'

const subprocess = execa('python3', {
  stdin: 'pipe',
  stdout: 'pipe',
  shell: true,
})

if (subprocess.stdout) {
  subprocess.stdout.on('data', (data) => {
    // eslint-disable-next-line no-console
    Logger.info(data.toString())
  })
}

export function runPython(code: string[]) {
  const stdinStream = new stream.Readable()

  code.forEach((line) => {
    stdinStream.push(line)
  })
  stdinStream.push(null)

  if (subprocess.stdin)
    stdinStream.pipe(subprocess.stdin)
}

export function release() {
  subprocess.kill()
}
