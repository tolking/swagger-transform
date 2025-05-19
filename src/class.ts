import { defaultConfig } from './config'
import { getContent } from './content'
import { definitionsToClass } from './definitions'
import { pathsToApis } from './paths'
import type { Config } from './types'

export async function swaggerToClass(option: Config) {
  const config = Object.assign({}, defaultConfig, option)
  const content = await getContent(config)

  if (!content) return
  option.api && pathsToApis(content, config)
  definitionsToClass(content, config)
}
