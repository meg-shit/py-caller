export interface IOptions {
  EOL: string
  killSignal: string
}

export interface IPyCallerOptions {
  command: string
  args: string[]
  options?: Partial<IOptions>
  callback?: (data: string) => void
}

export interface IPyCallerPoolOptions extends Omit<IPyCallerOptions, 'callback'> {
  _id?: string
}

export interface IPyCallerPoolData {
  _id: string
  data: string
}
