export interface IOptions {
  EOL: string
  AUTO_EOL: boolean
  killSignal: string
  killTimeout: number
}

export interface IPyCallerOptions {
  command: string
  args: string[]
  options?: Partial<IOptions>
  callback?: ((data: string) => void) | ((data: string) => Promise<void>)
}

export interface IPyCallerPoolOptions extends Omit<IPyCallerOptions, 'callback'> {
  _id?: string
}

export interface IPyCallerPoolData {
  _id: string
  data: string
}
