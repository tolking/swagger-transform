import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { load } from 'js-yaml'
import { getFileType, isURL } from './utils'
import type { Config, Swagger } from './types'

export async function read(path: string, config: Config) {
  const isUrl = isURL(path)
  return isUrl ? await getContentFromUrl(path, config) : getContentFromPath(path, config)
}

export function getContentFromPath(path: string, config: Config) {
  const content = readFileSync(resolve(path), 'utf-8')
  return parseSwagger(path, content, config)
}

export async function getContentFromUrl(url: string, config: Config) {
  return fetch(url)
  .then(response => response.text())
  .then(data => parseSwagger(url, data, config))
  .catch((err) => {
    throw err
  })
}

export function parseSwagger(path: string, str: string, config: Config) {
  const type = getFileType(path)
  const content = config.beforeParse ? config.beforeParse(str) : str

  switch (type) {
    case 'json':
      return JSON.parse(content) as Swagger
    case 'yaml':
    case 'yml':
      return load(content) as Swagger
    default:
      throw new Error('The file type is not supported')
  }
}
