import type { Config } from './types'

export const defaultConfig: Partial<Config> = {
  outDir: 'types',
}

export const defaultApi: Config['api'] = {
  fileName: 'apis',
  exportName: 'Apis',
  typeName: 'AllApis',
  typeFileName: 'allApis',
  definitionType: 'type',
  functionFileName: 'repository',
  functionImport: 'import request from \'./request\'',
}

export const defaultTypeMap: Config['typeMap'] = {
  integer: 'number',
  int: 'number',
  long: 'number',
  float: 'number',
  double: 'number',
  int32: 'number',
  int64: 'number',
  object: 'Record<string, any>',
}

export const ignoreLint = '// eslint-disable-next-line @typescript-eslint/no-explicit-any'

export const emptyPropert = `
  ${ignoreLint}
  [key: string]: any`
