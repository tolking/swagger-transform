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
}

export const defaultTypeMap: Config['typeMap'] = {
  integer: 'number',
}
