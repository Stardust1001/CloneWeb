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
  for (let i = 0; i < config.num_retries; i++) {
    try {
      const { headers, buffer } = await request(url, timeout)
      return buffer2Text(headers, buffer)
    } catch (err) {
      logger.error(err.toString())
    }
  }
  logger.warn('[failed get]\t' + url)
}

export const download = async (url, timeout = config.download_timeout) => {
  const filepath = getAbsPath(url)
  if (await fsUtils.exists(filepath)) return
  for (let i = 0; i < config.num_retries; i++) {
    try {
      const { buffer } = await request(url, timeout)
      await save(url, buffer)
      logger.info('[downloaded]\t' + url)
    } catch (err) {
      logger.error(err.toString())
    }
  }
  logger.warn('[failed download]\t' + url)
}
