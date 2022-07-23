import yargs from 'yargs'
import Logger from './logger'
import { PyCaller } from '.'

export interface Arguments {
  command: string
  args: string[]
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
      .then((answers) => {
        if (answers.message)
          caller.runPython([answers.message])
        resolve(0)
      })
      .catch((error: unknown) => {
        Logger.error(error)
        reject(error)
      })
  })
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
  },
  async(argv) => {
    try {
      const { command, args } = argv
      const caller = new PyCaller(command, args, async(data) => {
        Logger.info(data)
        await inquirerMsg(caller)
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
