import { defaultApi } from './config'
import { write } from './write'
import { capitalize, genTypeImport, getLastPath, getRefTypeName } from './utils'
import type { Config, Swagger, SwaggerResponseContent } from './types'

export function pathsToApis(content: Swagger, config: Config) {
  const apiConfig = Object.assign({}, defaultApi, config.api)
  const [api, type, importTypes] = genPathsContent(content, config)

  if (api) {
    const data = `export const ${apiConfig.exportName} = {${api}
} as const
`

    write(apiConfig.outDir ?? config.outDir!, `${apiConfig.fileName}.ts`, data)
  }

  if (type) {
    let imports = ''

    if (importTypes.size) {
      importTypes.forEach((item) => {
        imports += genTypeImport(item, config)
      })
    }
      
    const data = `${imports ? `${imports}\n` : ''}export interface ${apiConfig.typeName} {${type}
}
`

    write(config.outDir!, `${apiConfig.typeFileName}.ts`, data)
  }
}

function genPathsContent(content: Swagger, config: Config): [string, string, Set<string>] {
  const importTypes = new Set<string>()
  let api = ''
  let type = ''

  for (const path in content.paths) {
    const pathItem = content.paths[path]
    let _type = ''

    for (const method in pathItem) {
      const operation = pathItem[method]
      const name = operation.operationId ?? `${getLastPath(path)}${capitalize(method)}`
      // TODO: transform parameters
      const [responses, responsesImport] = genResponsesType(operation.responses['200'], config)

      responsesImport.forEach((item) => importTypes.add(item))
      
      api += genApiProp(name, path, operation.summary || operation.description)
      _type += genApiTypeProp(method, operation.summary || operation.description, { responses })
    }

    type += `\n  '${path}': {${_type}
  }`
  }

  return [api, type, importTypes]
}

function genResponsesType(response: SwaggerResponseContent | undefined, config: Config): [string, Set<string>] {
  const importTypes = new Set<string>()
  const schema = response?.content?.['application/json']?.schema || response?.schema
  let type = 'undefined'

  if (!schema) return [type, importTypes]
  if ('$ref' in schema && schema.$ref) {
    const ref = getRefTypeName(schema.$ref, config)

    importTypes.add(ref)
    type = ref
  } else if ('allOf' in schema && schema.allOf?.length) {
    const allOf = schema.allOf.map((item) => {
      if ('$ref' in item && item.$ref) {
        const ref = getRefTypeName(item.$ref, config)
        importTypes.add(ref)
        return ref
      } else if ('properties' in item && item?.properties.length) {
        // TODO: object type
        return item.type
      }
    }).join(' & ')

    type = allOf
  }
  
  return [type, importTypes]
}

function genApiProp(name: string, path: string, description?: string) {
  return `${description ? `\n  /** ${description} */` : ''}\n  ${name}: '${path}',`
}

interface ApiTypeProp {
  responses: string
  header?: string
  path?: string
  query?: string
  body?: string
}

function genApiTypeProp(method: string, description: string | undefined, { responses, header, path, query, body }: ApiTypeProp) {
  return `${description ? `\n    /** ${description} */` : ''}\n    ${method}: {
      responses: ${responses}${header ? `\n      header: ${header}` : ''}${path ? `\n      path: ${path}` : ''}${query ? `\n      query: ${query}` : ''}${body ? `\n      body: ${body}` : ''}
    }`
}
