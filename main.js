import { fsUtils } from '@wp1001/node'
import { promises } from '@wp1001/js'

import { config, allDomains, allLinks, newUrls } from './common.js'
import logger from './logger.js'
import { processUrl } from './utils.js'

const start = async () => {
  await processUrl(config.site)
  let count = 0
  while (true) {
    if (!newUrls.length) break
    const urls = newUrls.slice()
    newUrls.splice(0, newUrls.length)
    logger.info(`已检索到 ${allLinks.size} 条链接`)
    await promises.schedule(async i => {
      await processUrl(urls[i])
      logger.info(`已处理 ${++count}/${allLinks.size} 条链接`)
    }, urls.length, config.concurrency)
    fsUtils.write('./all_domains.txt', [...allDomains].join('\n'))
    fsUtils.write('./all_links.txt', [...allLinks].join('\n'))
  }
  logger.info(`已结束，总共检索到 ${allLinks.size} 条链接`)
}

start()
