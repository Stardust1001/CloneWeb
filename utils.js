import path from 'node:path'
import iconv from 'iconv-lite'
import { fsUtils } from '@wp1001/node'

import { config, allLinks, newUrls } from './common.js'
import logger from './logger.js'

export const processHtml = (url, text) => {
  const items = []
  let matches = [...text.matchAll(config.patterns.html_url)]
  matches.forEach(m => m[3] && items.push([m[0], m[3]]))
  matches = [...text.matchAll(config.patterns.css_url)]
  matches.forEach(m => m[2] && items.push([m[0], m[2]]))
  matches = text.match(/<meta\s+http-equiv="refresh"\s+content="[^(url)]*url="?([^"]+)"?>/i)
  matches && items.push([matches[0], matches[1]])
  const valids = processMatched(url, items)
  text = replaceLinks(url, text, valids)
  save(url, text)
  logger.info('[processed]\t' + url)
}

export const processCss = (url, text) => {
  const items = []
  const matches = [...text.matchAll(config.patterns.css_url)]
  matches.forEach(m => m[2] && items.push([m[0], m[2]]))
  const valids = processMatched(url, items)
  text = replaceLinks(url, text, valids)
  save(url, text)
  logger.info('[processed]\t' + url)
}

export const getSuffix = url => {
  const { pathname } = new URL(url)
  return path.extname(pathname).slice(1).toLowerCase()
}

export const isValidUrl = url => {
  if (!url) return false
  if (
    url.startsWith('javascript:')
    || url.startsWith('tel:')
    || url.startsWith('data:')
    || url.startsWith('mailto:')
  ) return false
  return true
}

export const formatUrl = (url, referer) => {
  if (!url) return url
  const refererU = new URL(referer)
  let finalU
  if (url.startsWith('//')) {
    url = refererU.protocol + url
  } else if (url.startsWith('/')) {
    url = refererU.origin + url
  } else if (!url.startsWith('http')) {
    finalU = new URL(url, referer)
    url = finalU.href
  }
  finalU ||= new URL(url)
  const { hostname, origin, pathname } = finalU
  if (!config.host_pattern.test(hostname)) return
  return origin + pathname
}

export const processMatched = (url, items) => {
  const processedParts = new Set()
  const valids = {}
  items.forEach(item => {
    const [part, link] = item
    if (processedParts.has(part)) return
    processedParts.add(part)
    if (isValidUrl(link)) {
      const formatted = formatUrl(link, url)
      if (!formatted) return
      valids[part] = [link, formatted]
      if (!allLinks.has(formatted)) {
        allLinks.add(formatted)
        newUrls.push(formatted)
      }
    }
  })
  return valids
}

export const replaceLinks = (referer, text, valids) => {
  const replacerPath = getAbsPath(referer)
  const entries = Object.entries(valids)
  entries.sort((a, b) => b[0].length - a[0].length)
  entries.forEach(([part, item]) => {
    const [link, url] = item
    const urlPath = getAbsPath(url)
    const relative = path.relative(replacerPath, urlPath).slice(1)
    const replacer = part.replace(link, relative)
    text = text.replaceAll(part, replacer)
  })
  return text
}

export const buffer2Text = (headers, buffer) => {
  const text = iconv.decode(buffer, 'utf-8')
  const contentType = headers['content-type']?.[0] || ''
  let charset = contentType.split('charset=')[1]?.toLowerCase()
  if (!charset) {
    let match = text.match(/<meta\s+charset=[\"\'][^"'\/>]+/)
    match ||= text.match(/<meta\s+http-equiv=\"Content-Type\"\s+content=\"text\/html;\s*charset=[^"'\/>]+/i)
    if (match) {
      charset = match[0].split('charset=')[1].replaceAll('"', '').toLowerCase()
    }
  }
  if (!charset || charset === 'utf-8' || charset === 'utf8') return text
  return iconv.decode(buffer, charset)
}

export const getAbsPath = url => {
  let { host, pathname } = new URL(url)
  let filename = pathname.slice(1)
  if (!filename) filename = 'index.html'
  if (!filename.includes('.')) filename += '.html'
  filename = filename.replace(/(\s|%20)/g, '_')
  host = host.replace(/[\.\:]/g, '_')
  return path.join(config.dirname, host, filename)
}

export const save = async (url, content) => {
  const filepath = getAbsPath(url)
  const dirname = path.dirname(filepath)
  await fsUtils.mkdir(dirname)
  await fsUtils.write(filepath, content)
}
