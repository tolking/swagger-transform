import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { isURL } from './utils'
import type { Swagger } from './types'

export async function read(path: string) {
  const isUrl = isURL(path)
  return isUrl ? await getContentFromUrl(path) : getContentFromPath(path)
}

function getContentFromPath(path: string) {
  const content = readFileSync(resolve(path), 'utf-8')
  return JSON.parse(content) as Swagger
}

async function getContentFromUrl(url: string) {
  return fetch(url)
  .then(response => response.json())
  .then(data => data as Swagger)
  .catch((err) => {
    throw new Error(`[swagger-transform Error]: ${err}`)
  })
}
