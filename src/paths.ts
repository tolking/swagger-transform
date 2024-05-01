import { defaultApi } from './config'
import { genSchema } from './definitions'
import { write } from './write'
import { capitalize, genTypeImport, getLastPath, getParametersName, transformKeyName } from './utils'
import type { Config, Swagger, SwaggerOperation, SwaggerParameter, SwaggerParameterBody, SwaggerResponseContent, SwaggerSchema } from './types'

export function pathsToApis(content: Swagger, config: Config) {
  const apiConfig = Object.assign({}, defaultApi, config.api)
  const [importTypes, api, type] = genPathsContent(content, config)

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

export function genPathsContent(content: Swagger, config: Config): [Set<string>, string, string] {
  const importTypes = new Set<string>()
  let api = ''
  let type = ''

  for (const path in content.paths) {
    const pathItem = content.paths[path]
    let _type = ''

    for (const method in pathItem) {
      const operation = pathItem[method]
      const name = operation.operationId ?? `${method}${capitalize(getLastPath(path))}`
      const isFormData = operation.parameters?.some((item) => item.in === 'formData')
      const [responsesImport, responses] = genResponsesType(operation.responses['200'], config)
      const [requestBodyImport, body] = genRequestBodyType(operation, config)
      const [headerImport, header] = genRequestType(name, 'header', operation.parameters, content, config)
      const [pathImport, pathType] = genRequestType(name, 'path', operation.parameters, content, config)
      const [queryImport, query] = genRequestType(name, 'query', operation.parameters, content, config)

      responsesImport.forEach((item) => importTypes.add(item))
      requestBodyImport.forEach((item) => importTypes.add(item))
      headerImport.forEach((item) => importTypes.add(item))
      pathImport.forEach((item) => importTypes.add(item))
      queryImport.forEach((item) => importTypes.add(item))
      api += genApiProp(name, path, operation.summary || operation.description)
      _type += genApiTypeProp(method, operation.summary || operation.description, {
        responses: responses || 'undefined',
        body: body || (isFormData ? 'FormData' : undefined),
        header,
        path: pathType,
        query,
      })
    }

    type += `\n  ${transformKeyName(path)}: {${_type}
  }`
  }

  return [importTypes, api, type]
}

export function genResponsesType(response: SwaggerResponseContent | undefined, config: Config): [Set<string>, string | undefined] {
  const schema = response?.content?.['application/json']?.schema || response?.schema

  if (!schema) return [new Set<string>(), undefined]
  return genSchema(schema, config)
}

export function genRequestBodyType(operation: SwaggerOperation, config: Config): [Set<string>, string | undefined] {
  const schema = operation.requestBody?.content?.['application/json']?.schema
    || (operation.parameters?.find((item) => item.in === 'body') as SwaggerParameterBody)?.schema

  if (!schema) return [new Set<string>(), undefined]
  return genSchema(schema, config)
}

export function genRequestType(name: string, type: Exclude<SwaggerParameter['in'], 'formData'>, parameters: Array<SwaggerParameter | SwaggerParameterBody> | undefined, content: Swagger, config: Config): [Set<string>, string | undefined] {
  const list = parameters?.filter((item) => item.in === type)

  if (!list?.length) return [new Set<string>(), undefined]
  const typeName = getParametersName(name, type, content, config)
  const properties: Record<string, SwaggerSchema> = {}
  const required: string[] = []

  for (let i = 0; i < list.length; i++) {
    const item = list[i] as SwaggerParameter
    if (item.required) {
      required.push(item.name)
    }
    properties[item.name] = {
      ...item,
      ...item.schema,
    }
  }

  if (!content.definitions) {
    content.definitions = {}
  }
  content.definitions[typeName] = {
    type: 'object',
    required,
    properties,
  }

  return [new Set<string>([typeName]), typeName]
}

export function genApiProp(name: string, path: string, description?: string) {
  return `${description ? `\n  /** ${description} */` : ''}\n  ${transformKeyName(name)}: '${path}',`
}

interface ApiTypeProp {
  responses: string
  header?: string
  path?: string
  query?: string
  body?: string
}

export function genApiTypeProp(method: string, description: string | undefined, { responses, header, path, query, body }: ApiTypeProp) {
  return `${description ? `\n    /** ${description} */` : ''}\n    ${method}: {
      responses: ${responses}${header ? `\n      header: ${header}` : ''}${path ? `\n      path: ${path}` : ''}${query ? `\n      query: ${query}` : ''}${body ? `\n      body: ${body}` : ''}
    }`
}
