import https from 'node:https'
import http from 'node:http'
import { fsUtils } from '@wp1001/node'

import { config } from './common.js'
import logger from './logger.js'
import { getAbsPath, buffer2Text, save } from './utils.js'

export const request = async (url, timeout = config.timeout) => {
  const lib = url.startsWith('https') ? https : http
  return new Promise((resolve, reject) => {
    const req = lib.get(url, {
      headers: config.headers,
      rejectUnauthorized: false
    }, res => {
      const chunks = []
      res.on('data', (chunk) => chunks.push(chunk))
      res.on('end', () => {
        clearTimeout(timer)
        resolve({
          status: res.statusCode,
          headers: res.headers,
          buffer: Buffer.concat(chunks)
        })
      })
    })
    req.on('error', err => {
      clearTimeout(timer)
      reject(err.toString())
    })
    const timer = setTimeout(() => {
      req.destroy()
      reject('Timeout')
    }, timeout)
  })
}

export const get = async (url, timeout = config.timeout) => {
  let text = ''
  for (let i = 0; i < config.num_retries; i++) {
    try {
      const { status, headers, buffer } = await request(url, timeout)
      if (status < 200 || status >= 400) return ''
      text = buffer2Text(headers, buffer)
      if (text) break
    } catch (err) {
      logger.error(err.toString())
    }
  }
  if (!text) {
    logger.warn('[failed get]\t' + url)
  }
  return text
}

export const download = async (url, timeout = config.download_timeout) => {
  const filepath = getAbsPath(url)
  if (await fsUtils.exists(filepath)) return
  for (let i = 0; i < config.num_retries; i++) {
    try {
      const { status, buffer } = await request(url, timeout)
      if (status < 200 || status >= 400) break
      if (buffer.length) {
        await save(url, buffer)
        logger.info('[downloaded]\t' + url)
        return
      }
    } catch (err) {
      logger.error(err.toString())
    }
  }
  logger.warn('[failed download]\t' + url)
}
