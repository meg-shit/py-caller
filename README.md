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

# 位置：
#   command  The command to run                                           [字符串]

# 选项：
#       --args     The arguments to pass to the command        [数组] [默认值: []]
#   -h, --help     显示帮助信息                                             [布尔]
#   -v, --version  显示版本号                                               [布尔]
```

## Programmatic usage

```ts
import { PyCaller } from '@meg-shit/py-caller'

// params: command, args
const command = 'python'
const args = ['demo.py']

const caller = new PyCaller(command, args, {}, async(data) => {
  // do something for response
})

caller.runPython(['hello world~'])
```


