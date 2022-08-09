import type { StdioOption } from 'execa'

export interface IOptions {
  EOL: string
  AUTO_EOL: boolean
  killSignal: string
  killTimeout: number
  stdioOption: {
    readonly stdin: 'pipe'
    readonly stdout: 'pipe'
    stderr: StdioOption
  }
}

export interface IPyCallerOptions {
  command: string
  args: string[]
  options?: Partial<IOptions>
  callback?: ((data: any) => void) | ((data: any) => Promise<void>)
}

export interface IPyCallerPoolOptions extends Omit<IPyCallerOptions, 'callback'> {
  _id?: string
}

export interface IPyCallerPoolData {
  _id: string
  data: string
}
