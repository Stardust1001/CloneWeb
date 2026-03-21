import { fsUtils } from '@wp1001/node'
import { sleep, promises } from '@wp1001/js'

import { get, download } from './network.js'
import { config, allDomains, allLinks, newUrls } from './common.js'
import logger from './logger.js'
import { processHtml, processCss, getExtname, getAbsPath, save } from './utils.js'

const start = async () => {
  const text = await get(config.site)
  processHtml(config.site, text)
  let numFinished = 0
  while (true) {
    if (!newUrls.length) break
    const urls = newUrls.slice()
    newUrls.splice(0, newUrls.length)
    logger.info(`已检索到 ${allLinks.size} 条链接`)
    await promises.schedule(async i => {
      const url = urls[i]
      const extname = getExtname(url) || 'html'
      if (extname === 'css') {
        const text = await get(url)
        processCss(url, text)
      } else if (config.patterns.html_ext.test(extname)) {
        const text = await get(url)
        processHtml(url, text)
      } else {
        await download(url)
      }
      logger.info(`已处理 ${++numFinished}/${allLinks.size} 条链接`)
    }, urls.length, config.concurrency)
    fsUtils.write('./allDomains.txt', [...allDomains].join('\n'))
    fsUtils.write('./allLinks.txt', [...allLinks].join('\n'))
  }
  logger.info(`已结束，总共检索到 ${allLinks.size} 条链接`)
}

start()
