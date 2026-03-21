import { fsUtils } from '@wp1001/node'
import { promises } from '@wp1001/js'

import { config } from './common.js'

const files = await fsUtils.listAll(config.dirname)
const items = []
await promises.schedule(async i => {
  const isDir = await fsUtils.isDir(files[i])
  items.push([files[i], !!isDir])
}, files.length, 20)
items.sort((a, b) => a[1] - b[1])

let numClears = 0
await promises.schedule(async i => {
  const [file, isDir] = items[i]
  let isEmpty = false
  if (isDir) {
    const subs = await fsUtils.listDir(file)
    isEmpty = !subs.length
  } else {
    const stat = await fsUtils.stat(file)
    isEmpty = !stat.size
  }
  if (isEmpty) {
    await fsUtils.remove(file)
    console.log(`已删除 ${++numClears} 个空文件/文件夹: ${file}`)
  }
}, items.length, 20)
