import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { load } from 'js-yaml'
import { getFileType, isURL } from './utils'
import type { Swagger } from './types'

export async function read(path: string) {
  const isUrl = isURL(path)
  return isUrl ? await getContentFromUrl(path) : getContentFromPath(path)
}

export function getContentFromPath(path: string) {
  const content = readFileSync(resolve(path), 'utf-8')
  return parseSwagger(path, content)
}

export async function getContentFromUrl(url: string) {
  return fetch(url)
  .then(response => response.text())
  .then(data => parseSwagger(url, data))
  .catch((err) => {
    throw err
  })
}

function parseSwagger(path: string, content: string) {
  const type = getFileType(path)

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
