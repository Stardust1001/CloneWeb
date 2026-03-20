import { fsUtils } from '@wp1001/node'
import { dates } from '@wp1001/js'

import { config } from './common.js'

const _consoleLog = config.logger?.console !== false
const _fileLog = config.logger?.file !== false

const logger = {
  async info (content) {
    const now = dates.now().to()
    if (_consoleLog) {
      console.log('INFO:\t' + content)
    }
    if (_fileLog) {
      await fsUtils.append(config.log_path, now + '\t' + 'INFO:\t' + content + '\n')
    }
  },
  async warn (content) {
    const now = dates.now().to()
    if (_consoleLog) {
      console.log('WARN:\t' + content)
    }
    if (_fileLog) {
      await fsUtils.append(config.log_path, now + '\t' + 'WARN:\t' + content + '\n')      
    }
  },
  async error (content) {
    const now = dates.now().to()
    if (_consoleLog) {
      console.log('ERROR:\t' + content)
    }
    if (_fileLog) {
      await fsUtils.append(config.log_path, now + '\t' + 'ERROR:\t' + content + '\n')
    }
  }
}

export default logger
