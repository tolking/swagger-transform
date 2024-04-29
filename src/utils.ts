import type { Config } from "./types";

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
 * Generate type import
 * @param key string
 * @param config Config
 */
export function genTypeImport (key: string, config: Config): string {
  const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key);
  const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key);

  return `import type { ${typeName} } from '${fileName}'`
}

/** 
 * Get file name from path
 * @param path string
 */
export function getFileNameFromPath(path: string): string {
  return path.split('/').pop()!.split('.')[0]
}
