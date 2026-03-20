import { sleep, promises } from '@wp1001/js'

import { get, download } from './network.js'
import { config, allLinks, newUrls } from './common.js'
import logger from './logger.js'
import { processHtml, processCss, getSuffix, getAbsPath, save } from './utils.js'

const start = async () => {
  const text = await get(config.site)
  processHtml(config.site, text)
  while (true) {
    if (!newUrls.length) break
    const urls = newUrls.slice()
    newUrls.splice(0, newUrls.length)
    logger.info(`已检索到 ${allLinks.size} 条链接`)
    let numFinished = 0
    await promises.schedule(async i => {
      const url = urls[i]
      const suffix = getSuffix(url) || 'html'
      if (suffix === 'css') {
        const text = await get(url)
        processCss(url, text)
      } else if (config.patterns.html_ext.test(suffix)) {
        const text = await get(url)
        processHtml(url, text)
      } else {
        await download(url)
      }
      logger.info(`剩余 ${urls.length - ++numFinished} 条链接待处理`)
    }, urls.length, config.concurrency)
  }
  logger.info(`已结束，总共检索到 ${allLinks.size} 条链接`)
}

start()
