import { read } from './read'
import { deepMerge, isArray } from './utils'
import type { Config, Swagger } from './types'

export async function getContent(config: Config){
  if (!config.entry) {
    throw new Error('[swagger-transform Error]: entry is required')
  }

  let content: Swagger | undefined

  if (isArray(config.entry)) {
    for (const item of config.entry) {
      content = deepMerge(content || {} as Swagger, await read(item, config))
    }
  } else {
    content = await read(config.entry, config)
  }

  return content
}
