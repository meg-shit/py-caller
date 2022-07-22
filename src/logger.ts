/* eslint-disable no-console */
import picocolors from 'picocolors'

const { bold, cyan, magenta, red } = picocolors

export default class Logger {
  static info(jsonObject: Object) {
    try {
      console.log(cyan(JSON.stringify(jsonObject, null, 2)))
    }
    catch (error: unknown) {
      if (error instanceof TypeError)
        console.log(`${bold(magenta(error.stack))}\n`)
      else
        console.error(error)
    }
  }

  static error(error: unknown) {
    if (error instanceof Error)
      console.error(red(error.stack))
    else
      console.error(error)
  }
}
