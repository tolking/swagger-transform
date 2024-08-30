import { defaultConfig } from './config'
import { definitionsToType } from './definitions'
import { pathsToApis } from './paths'
import { read } from './read'
import { deepMerge, isArray } from './utils'
import type { Config, Swagger } from './types'

export async function swaggerToType(option: Config) {
  if (!option.entry) {
    throw new Error('[swagger-transform Error]: entry is required')
  }

  const config = Object.assign({}, defaultConfig, option)
  let content: Swagger | undefined

  if (isArray(config.entry)) {
    for (const item of config.entry) {
      content = deepMerge(content || {} as Swagger, await read(item))
    }
  } else {
    content = await read(config.entry)
  }

  if (!content) return
  option.api && pathsToApis(content, config)
  definitionsToType(content, config)
}
