import { defaultTypeMap } from './config'
import type { Config, Swagger, SwaggerParameter } from './types'

/**
 * Check the value is number
 * @param value any
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number'
}

/**
 * Check the value is object
 * @param value any
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

/**
 * Check the value is array
 * @param value any
 */
export function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * Check the integrity of the url
 * @param url isURL
 */
export function isURL(url: string): boolean {
  return /^((ht|f)tps?):\/\/?/.test(url)
}

/**
 * Convert first character of string literal type to uppercase
 * @param str string
 */
export function capitalize<T extends string>(str: T) {
  return str.replace(/^\w/, (c) => c.toUpperCase()) as Capitalize<T>
}

/**
 * Convert first character of string literal type to lowercase
 * @param str string
 */
export function uncapitalize<T extends string>(str: T) {
  return str.replace(/^\w/, (c) => c.toLowerCase()) as Uncapitalize<T>
}

/**
 * deep merge object
 * @param target object
 * @param source object
 */
// eslint-disable-next-line 
export function deepMerge<T extends Record<string, any>>(target: T, source: T): T {
  for (const key in source) {
    if (isArray(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: [] })
      target[key] = target[key].concat(source[key])
    } else if (isObject(source[key])) {
      if (!target[key]) Object.assign(target, { [key]: {} })
      deepMerge(target[key], source[key])
    } else {
      Object.assign(target, { [key]: source[key] })
    }
  }
  return target
}

/** 
 * The string of the last slope of the path
 * @param path string
 */
export function getLastPath(path: string): string {
  const math = path.match(/\/([^/]*)$/)
  return math?.[1] || path
}

/**
 * transform swagger type
 * @param type string
 */
export function transformType(type: string, config: Config): string {
  const typeMap = Object.assign({}, defaultTypeMap, config.typeMap)
  return typeMap[type] || type
}

/**
 * transform type name
 * @param name string
 */
export function transformKeyName(name: string) {
  return /^[a-zA-Z0-9]*$/.test(name) ? name : `'${name}'`
}

/**
 * Get the name of the reference type
 * @param ref string
 * @param config Config
 */
export function getRefTypeName(ref: string, config: Config) {
  const key = getLastPath(ref)
  return config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key)
}

/**
 * Get the name of the parameter
 * @param key 
 * @param type 
 * @param content 
 * @param config 
 */
export function getParametersName(
  key: string,
  type: Exclude<SwaggerParameter['in'], 'formData'>,
  content: Swagger,
  config: Config,
) {
  let name = config.reParametersName
    ? config.reParametersName(key, 'header', content)
    : `${capitalize(key)}${capitalize(type)}`
  let n = 0

  while (content.definitions && name in content.definitions) {
    name = `${name}${n++}`
  }

  return name
}

/**
 * Generate type import
 * @param key string
 * @param config Config
 */
export function genTypeImport(key: string, config: Config): string {
  if (!key) return ''
  const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key)
  const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key)

  return `import type { ${typeName} } from './${fileName}'\n`
}

/**
 * Generate type export
 * @param key string
 * @param config Config
 */
export function genTypeExport(fileName: string): string {
  return `export type * from './${fileName}'\n`
}

/**
 * Generate description
 * @param description the description string
 * @param before the string before the description, default: '\n  '
 * @param after the string after the description, default: ''
 */
export function genDescription(description?: string , before = '\n  ', after = '') {
  return description ? `${before}/** ${description} */${after}` : ''
}
