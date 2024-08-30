import { relative, resolve } from 'path'
import { genSchema } from './definitions'
import { write } from './write'
import {
  capitalize,
  genDescription,
  genTypeImport,
  getApiConfig,
  getClassName,
  getDefinitionFileName,
  getLastPath,
  getParametersName,
  transformKeyName,
  uncapitalize,
} from './utils'
import type {
  Config,
  Swagger,
  SwaggerOperation,
  SwaggerParameter,
  SwaggerParameterBody,
  SwaggerResponseContent,
  SwaggerSchema,
} from './types'

export function pathsToApis(content: Swagger, config: Config) {
  const apiConfig = getApiConfig(config)
  const [importTypes, api, type, functions] = genPathsContent(content, config)
  const description = genDescription(config.description, '', '\n\n')
  
  if (api) {
    const data = `${description}export const ${apiConfig.exportName} = {${api}
} as const
`

    write(apiConfig.outDir ?? config.outDir!, `${apiConfig.fileName}.ts`, data)
  }

  if (apiConfig.function && functions) {
    let imports = ''

    if (importTypes.size) {
      importTypes.forEach((item) => {
        const className = getClassName(item, config)
        const type = apiConfig.definitionType === 'class' ? className : item
        const fileName = getDefinitionFileName(item, config)
        const outDir = resolve(config.outDir!)
        const apiOutDir = apiConfig.outDir ? resolve(apiConfig.outDir) : outDir
        const path = relative(apiOutDir, outDir)

        imports += genTypeImport(type, `${path || '.'}/${fileName}`, apiConfig.definitionType === 'type')
      })
    }

    const data = `${description}${apiConfig.functionImport}
import { ${apiConfig.exportName} } from './${apiConfig.fileName}'
${imports ? `${imports}` : ''}${functions}`

    write(apiConfig.outDir ?? config.outDir!, `${apiConfig.functionFileName}.ts`, data)
  }

  if (type) {
    let imports = ''

    if (importTypes.size) {
      importTypes.forEach((item) => {
        const className = getClassName(item, config)
        const type = apiConfig.definitionType === 'class' ? className : item
        const fileName = getDefinitionFileName(item, config)

        imports += genTypeImport(type, `./${fileName}`)
      })
    }

    const data = `${description}${imports ? `${imports}\n` : ''}export interface ${apiConfig.typeName} {${type}
}
`

    write(config.outDir!, `${apiConfig.typeFileName}.ts`, data)
  }
}

export function genPathsContent(content: Swagger, config: Config): [Set<string>, string, string, string] {
  const importTypes = new Set<string>()
  let api = ''
  let type = ''
  let functions = ''

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
      functions += genApiFunction(
        name,
        method,
        operation.summary || operation.description,
        ['post', 'put'].includes(method) ? body || (isFormData ? 'FormData' : undefined) : query,
        pathType,
        header,
        responses,
        config,
      )
    }

    type += `\n  ${transformKeyName(path)}: {${_type}
  }`
  }

  return [importTypes, api, type, functions]
}

export function genResponsesType(
  response: SwaggerResponseContent | undefined,
  config: Config,
): [Set<string>, string | undefined] {
  const apiConfig = getApiConfig(config)
  const schema = response?.content?.['application/json']?.schema || response?.schema

  if (!schema) return [new Set<string>(), undefined]
  return genSchema(schema, config, apiConfig.definitionType)
}

export function genRequestBodyType(
  operation: SwaggerOperation,
  config: Config,
): [Set<string>, string | undefined] {
  const apiConfig = getApiConfig(config)
  const schema = operation.requestBody?.content?.['application/json']?.schema
    || (operation.parameters?.find((item) => item.in === 'body') as SwaggerParameterBody)?.schema

  if (!schema) return [new Set<string>(), undefined]
  return genSchema(schema, config, apiConfig.definitionType)
}

export function genRequestType(
  name: string,
  type: Exclude<SwaggerParameter['in'], 'formData'>,
  parameters: Array<SwaggerParameter | SwaggerParameterBody> | undefined,
  content: Swagger,
  config: Config,
): [Set<string>, string | undefined] {
  const apiConfig = getApiConfig(config)
  const list = parameters?.filter((item) => item.in === type)

  if (!list?.length) return [new Set<string>(), undefined]
  const typeName = getParametersName(name, type, content, config)
  const className = getClassName(typeName, config)
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

  return [new Set<string>([typeName]), apiConfig.definitionType === 'class' ? className : typeName]
}

export function genApiProp(name: string, path: string, description?: string) {
  return `${genDescription(description)}\n  ${transformKeyName(name)}: '${path}',`
}

interface ApiTypeProp {
  responses: string
  header?: string
  path?: string
  query?: string
  body?: string
}

export function genApiTypeProp(
  method: string,
  description: string | undefined,
  { responses, header, path, query, body }: ApiTypeProp,
) {
  return `${genDescription(description, '\n    ')}\n    ${method}: {
      responses: ${responses}${header ? `\n      header: ${header}` : ''}${path ? `\n      path: ${path}` : ''}${query ? `\n      query: ${query}` : ''}${body ? `\n      body: ${body}` : ''}
    }`
}

export function genApiFunction(
  name: string,
  method: string,
  description: string | undefined,
  payload: string | undefined,
  path: string | undefined,
  header: string | undefined,
  responses: string | undefined,
  config: Config,
) {
  const apiConfig = getApiConfig(config)
  
  if (apiConfig.reFunctionTemplate) {
    return apiConfig.reFunctionTemplate(name, method, description, payload, path, header, responses)
  }

  return `${genDescription(description, '\n')}
export async function ${uncapitalize(name)}(payload: ${payload ?? 'undefined'}, path: ${path ?? 'undefined'}, config?: Record<string, unknown>${header ? ` & { header: ${header} }` : ''}): Promise<${responses ?? 'void'} | null> {
  return request('${method}', ${apiConfig.exportName}.${name}, payload, path, config)
}
`
}
