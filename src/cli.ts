import yargs from 'yargs'
import inquirer from 'inquirer'
import Logger from './logger'
import { PyCaller } from '.'

interface Arguments {
  command: string
  args: string[]
}

function inquirerMsg(caller: PyCaller) {
  return new Promise((resolve, reject) => {
    inquirer
      .prompt([
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
      const caller = new PyCaller(command, args, async() => {
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
