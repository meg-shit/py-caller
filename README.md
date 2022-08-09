# pyCaller

> Python Invoker in Node Runtime.

## Install

```bash
npm install @meg-shit/py-caller -g
```

## Usage

```bash

#example
py-caller python demo.py


# help
py-caller -h

# py-caller <command> [args...]

# Positionals:
#   command  The command to run                                           [string]

# Options:
#       --args          The arguments to pass to the command [array] [default: []]
#       --watch         Enable Watch the command(files) for changes
#                                                        [boolean] [default: true]
#       --auto-inquire  Enable auto next question (except first)
#                                                        [boolean] [default: true]
#   -h, --help          Show help                                        [boolean]
#   -v, --version       Show version number                              [boolean]
```

## Programmatic usage

### Normal Usage

```ts
import { PyCaller } from '@meg-shit/py-caller'

const command = 'python'
const args = ['demo.py']

const callerOpts = {
  killSignal: '\r\t--MegEXIT--\r\t',
  EOL: '\r\t--MegSeparator--\r\t',
  AUTO_EOL: true,
  killTimeout: 3000,
}

const options = {
  command,
  args,
  options: callerOpts,
  callback: data => console.log(data),
}

const caller = new PyCaller(options)

caller.runPython(['hello world~'])
```

### Pools Usage

```ts

// a.ts
import { PyCallerPool } from '@meg-shit/py-caller'

const pyCallerPool = new PyCallerPool()
const key = 'test'

// b.ts
const command = 'python'
const args = ['demo.py']

const options = {
  command,
  args,
}

pyCallerPool.create(key, options)

// c.ts
pyCallerPool.listen(key, (data) => {
  console.log(data)
  // print "hello world~\n"  after `pyCallerPool.send` called
})

// d.ts
pyCallerPool.send(key, ['hello world~'])
```

## Options Api

### command

  * `command`: The command to run
  * Type: String

### args

  * `args`: The arguments to pass to the command
  * Type: Array
  * Default: []

### options

  * `options`: The options to pass to the caller
  * Type: Object
  * Default: `{
      killSignal: '\r\t--MegEXIT--\r\t',
      EOL: '\r\t--MegSeparator--\r\t',
      AUTO_EOL: true,
      killTimeout: 3000,
      stdioOption: {
        stdin: 'pipe',
        stdout: 'pipe',
        stderr: 'inherit',
      }
    }`

### callback

  * `callback`: The callback to receive the data
  * Type: ((data: string) => void) | ((data: string) => Promise<void>)
