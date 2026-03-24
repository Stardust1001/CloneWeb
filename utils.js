import path from 'node:path'
import iconv from 'iconv-lite'
import { fsUtils } from '@wp1001/node'

import { get, download } from './network.js'
import { config, allDomains, allLinks, newUrls } from './common.js'
import logger from './logger.js'

const { deep_detect, patterns, host_pattern, dirname } = config
const { html_url, css_url, js_url, html_ext } = patterns

export const processUrl = async (url) => {
  const extname = getExtname(url) || 'html'
  let regs = []
  if (deep_detect && extname === 'js') {
    regs = js_url
  } else if (extname === 'css') {
    regs = css_url
  } else if (html_ext.test(extname)) {
    regs = html_url.concat(css_url)
    if (deep_detect) {
      regs.push(...js_url)
    }
  } else {
    return download(url)
  }
  let text = await get(url)
  if (!text) return
  const items = []
  regs.forEach(([reg, no]) => {
    [...text.matchAll(reg)].forEach(m => m[no] && items.push([m[0], m[no]]))
  })
  const valids = processMatched(url, items)
  text = replaceLinks(url, text, valids)
  save(url, text)
}

export const getExtname = url => {
  const { pathname } = new URL(url)
  let ext = path.extname(pathname).slice(1).toLowerCase()
  if (!ext && pathname.includes('.')) {
    const parts = pathname.split('.')
    ext = parts[1].split('/')[0]
  }
  return ext
}

export const isValidUrl = url => {
  if (!url) return false
  if (url === '.') return false
  if (
    url.startsWith('javascript:')
    || url.startsWith('tel:')
    || url.startsWith('data:')
    || url.startsWith('mailto:')
    || url.includes('&quot;')
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
  try {
    finalU ||= new URL(url)
  } catch {
    return
  }
  const { hostname, origin, pathname } = finalU
  if (!hostname || origin === 'null') return
  if (!host_pattern.test(hostname)) return
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
      let domain
      try {
        domain = new URL(formatted).hostname
      } catch {
        return logger.error('无效连接: ' + formatted)
      }
      valids[part] = [link, formatted]
      if (!allLinks.has(formatted)) {
        allDomains.add(domain)
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
    if (part === replacer) return
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
  const ext = path.extname(pathname).slice(1).toLowerCase()
  if (!ext && pathname.includes('.')) {
    const parts = pathname.split('.')
    pathname = parts[0] + '.' + parts[1].split('/')[0]
  }
  let filename = pathname.slice(1)
  if (filename) {
    if (filename.includes('.')) {
      const ext = path.extname(pathname).slice(1).toLowerCase()
      if (ext !== 'html' && html_ext.test(ext)) {
        const dirname = path.dirname(pathname)
        const basename = path.basename(pathname).split('.')[0] + '.html'
        pathname = path.join(dirname, basename)
        filename = pathname.slice(1)
      }
    } else {
      filename += '.html'
    }
  } else {
    filename = 'index.html'
  }
  filename = filename.replace(/(\s|%20)/g, '_')
  host = host.replace(/[\.\:]/g, '_')
  return path.join(dirname, host, filename)
}

export const save = async (url, content) => {
  const filepath = getAbsPath(url)
  const dirname = path.dirname(filepath)
  await fsUtils.mkdir(dirname)
  await fsUtils.write(filepath, content)
}
