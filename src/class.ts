import { defaultConfig } from './config'
import { definitionsToClass } from './definitions'
import { pathsToApis } from './paths'
import { read } from './read'
import { deepMerge, isArray } from './utils'
import type { Config, Swagger } from './types'

export async function swaggerToClass(option: Config) {
  if (!option.entry) {
    throw new Error('[swagger-transform Error]: entry is required')
  }

  const config = Object.assign({}, defaultConfig, option)
  let content: Swagger | undefined

  if (isArray(config.entry)) {
    for (const item of config.entry) {
      content = deepMerge(content || {} as Swagger, await read(item, option))
    }
  } else {
    content = await read(config.entry, option)
  }

  if (!content) return
  option.api && pathsToApis(content, config)
  definitionsToClass(content, config)
}
