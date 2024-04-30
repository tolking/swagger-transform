import type { Config } from "./types";

/**
 * Check the value is number
 * @param value any
 */
export function isNumber(value: any): value is number {
  return typeof value === 'number'
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
  return str.replace(/^\w/, (c) => c.toUpperCase()) as Capitalize<T>;
}

/**
 * Convert first character of string literal type to lowercase
 * @param str string
 */
export function uncapitalize<T extends string>(str: T) {
  return str.replace(/^\w/, (c) => c.toLowerCase()) as Uncapitalize<T>;
}

/** 
 * The string of the last slope of the path
 * @param path string
 */
export function getLastPath(path: string): string {
  const math = path.match(/\/([^/]*)$/);
  return math?.[1] || path;
}

/**
 * transform swagger type
 * @param type string
 */
export function transformType(type: string, config: Config): string {
  return config.typeMap?.[type] || type;
}

/**
 * Generate type import
 * @param key string
 * @param config Config
 */
export function genTypeImport(key: string, config: Config): string {
  if (!key) return '';
  const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key);
  const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key);

  return `import type { ${typeName} } from './${fileName}'\n`
}
