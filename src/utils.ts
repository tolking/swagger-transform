import { defaultApi, defaultTypeMap } from './config'
import type { Config, Swagger, SwaggerParameter } from './types'

/**
 * Get the api config
 * @param config Config
 */
export function getApiConfig(config: Config) {
  return config.api ? Object.assign({}, defaultApi, config.api) : {}
}

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
      const targetArr = target[key]
      const sourceArr = source[key]
      const maxLength = Math.max(targetArr.length, sourceArr.length)
      const mergedArr = [] as T[Extract<keyof T, string>]

      for (let i = 0; i < maxLength; i++) {
        if (i in targetArr && i in sourceArr) {
          if (JSON.stringify(targetArr[i]) === JSON.stringify(sourceArr[i])) {
            mergedArr[i] = targetArr[i]
          } else if (isObject(targetArr[i]) && isObject(sourceArr[i])) {
            mergedArr[i] = deepMerge({ ...targetArr[i] }, sourceArr[i])
          } else {
            mergedArr[i] = sourceArr[i]
          }
        } else if (i in sourceArr) {
          mergedArr[i] = sourceArr[i]
        } else if (i in targetArr) {
          mergedArr[i] = targetArr[i]
        }
      }
      target[key] = mergedArr
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
 * Get the file type
 * @param path string
 */
export function getFileType(path: string): string {
  const math = path.match(/\.([^.]+)$/)
  return math?.[1] || ''
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
 * Get the name of the definition
 * @param name string
 * @param config Config
 */
export function getDefinitionName(name: string, config: Config) {
  return config.reDefinitionName ? config.reDefinitionName(name) : capitalize(name)
}

/**
 * Get the name of the class
 * @param name string
 * @param config Config
 */
export function getClassName(name: string, config: Config) {
  return config.reClassName ? config.reClassName(name) : `${capitalize(name)}Class`
}

/**
 * Get the name of the definition file
 * @param name string
 * @param config Config
 */
export function getDefinitionFileName(name: string, config: Config) {
  return config.reDefinitionFileName ? config.reDefinitionFileName(name) : uncapitalize(name)
}

/**
 * Get the name of the reference type
 * @param ref string
 * @param config Config
 */
export function getRefTypeName(ref: string, config: Config) {
  const key = getLastPath(ref)
  return getDefinitionName(key, config)
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
 * @param typeName string
 * @param filePath string
 * @param type boolean
 */
export function genTypeImport(typeName: string, filePath: string, type = true): string {
  if (!typeName || !filePath) return ''
  return `import ${type ? 'type ' : ''}{ ${typeName} } from '${filePath}'\n`
}

/**
 * Generate type export
 * @param key string
 */
export function genTypeExport(filePath: string): string {
  return `export * from './${filePath}'\n`
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
