import fs from 'fs'
import path from 'path'
import yargs from 'yargs'
import chokidar from 'chokidar'
import Logger from './logger'
import { PyCaller } from '.'

export interface Arguments {
  command: string
  args: string[]
  watch: boolean
}

function watchFiles(filePath: string, callback: (filePath: string) => void) {
  const absPath = path.resolve(filePath)
  const watcher = chokidar.watch(absPath, {
    ignored: /(^|[\/\\])\../,
  })

  watcher.on('change', callback)

  return () => {
    watcher.close()
  }
}

async function inquirerMsg(caller: PyCaller) {
  const module = await import('inquirer')
  const inquirer = module.default || module

  return new Promise((resolve, reject) => {
    inquirer.prompt([
      {
        type: 'input',
        name: 'message',
        message: 'what is your message?',
      },
    ])
      .then(async(answers) => {
        if (answers.message) { caller.runPython([answers.message]) }
        else {
          Logger.error('no message')
          await inquirerMsg(caller)
        }
        resolve(0)
      })
      .catch((error: unknown) => {
        Logger.error(error)
        reject(error)
      })
  })
}

function createCaller(argv: Arguments) {
  const { command, args } = argv
  const caller = new PyCaller(command, args, async(data) => {
    Logger.info(data)
    await inquirerMsg(caller)
  })
  return caller
}

// eslint-disable-next-line no-unused-expressions
yargs
  .scriptName('py-caller')
  .usage('$0 <command> [args...]')
  .command<Arguments>(
  '$0 <command> [args...]',
  'Run a command',
  (argv) => {
    argv
      .positional('command', {
        describe: 'The command to run',
        type: 'string',
      })
      .option('args', {
        describe: 'The arguments to pass to the command',
        type: 'array',
        default: [],
      })
      .option('watch', {
        describe: 'Watch the command(files) for changes',
        type: 'boolean',
        default: true,
      })
  },
  async(argv) => {
    try {
      let caller = createCaller(argv)

      const { args, watch } = argv

      if (watch) {
        if (args[0] && fs.existsSync(args[0])) {
          watchFiles(args[0], async(filePath) => {
            Logger.info(`File ${filePath} changed`)
            Logger.info('Reload Caller...')
            caller.destory()
            caller = createCaller(argv)
            await inquirerMsg(caller)
          })
        }
      }

      process.on('SIGINT', () => {
        caller.destory()
        process.exit(0)
      })

      await inquirerMsg(caller)
    }
    catch (error) {
      Logger.error(error)
    }
  })
  .showHelpOnFail(true)
  .alias('h', 'help')
  .alias('v', 'version')
  .help()
  .argv
