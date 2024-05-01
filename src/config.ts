import type { Config } from './types'

export const defaultConfig: Partial<Config> = {
  outDir: 'swagger',
}

export const defaultApi: Config['api'] = {
  fileName: 'apis',
  exportName: 'Apis',
  typeName: 'AllApi',
  typeFileName: 'allApi',
}

export const defaultTypeMap: Config['typeMap'] = {
  integer: 'number',
}
