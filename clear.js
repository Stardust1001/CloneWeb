import { fsUtils } from '@wp1001/node'
import { promises } from '@wp1001/js'

import { config } from './common.js'

const files = await fsUtils.listAll(config.dirname)
let numClears = 0
await promises.schedule(async i => {
  const stat = await fsUtils.stat(files[i])
  if (!stat.size) {
    await fsUtils.remove(files[i])
    console.log(`已删除 ${++numClears} 个空文件: ${files[i]}`)
  }
}, files.length, 20)
