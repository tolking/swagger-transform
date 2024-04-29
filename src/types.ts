export interface Config {
  entry: string
  api?: boolean
  outDir?: string
  apiOutDir?: string
  reParametersName?: (
    type: Extract<SwaggerParameter['in'], 'path' | 'query'> | 'body',
    path: string,
    method: string,
    operation: SwaggerOperation,
    content: Swagger,
  ) => string,
  reDefinitionName?: (name: string) => string,
  reDefinitionFileName?: (name: string) => string,
}

/** Swagger */
export interface Swagger {
  swagger: string
  info: SwaggerInfo
  paths: SwaggerPaths
  definitions: SwaggerDefinitions
}

export interface SwaggerInfo {
  title: string
  version: string
  description: string
}

export interface SwaggerPaths {
  [key: string]: SwaggerPath
}

export type SwaggerPath = {
  [key: string]: SwaggerOperation
}

export interface SwaggerOperation {
  summary?: string
  description?: string
  operationId?: string
  consumes?: string[]
  produces?: string[]
  parameters?: Array<SwaggerParameter | SwaggerParameterBody>
  responses: SwaggerResponse
  schemes?: string[]
  deprecated?: boolean
  tags?: string[]
}

export interface SwaggerParameter {
  in: 'header' | 'path' | 'query' | 'formData'
  type: 'string' | 'number' | 'integer' | 'boolean' | 'array' | 'file'
  name: string
  description?: string
  required?: boolean
  format?: string
  allowEmptyValue?: boolean
  items?: SwaggerSchemaRef | SwaggerSchemaArray // only for type: 'array'
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'
  enum?: string[]
}

export interface SwaggerParameterBody {
  in: 'body'
  name: string
  description?: string
  required?: boolean
  schema: SwaggerSchema
}

export type SwaggerSchema = SwaggerSchemaDefault | SwaggerSchemaRef | SwaggerSchemaArray | SwaggerSchemaObject | SwaggerSchemaEnum

export interface SwaggerSchemaDefault {
  type?: string
  description?: string
  format?: string
  allOf?: SwaggerSchema[]
}

export interface SwaggerSchemaRef {
  type?: undefined
  $ref?: string
}

export interface SwaggerSchemaArray {
  type: 'array'
  items: SwaggerSchema
  format?: string
  collectionFormat?: 'csv' | 'ssv' | 'tsv' | 'pipes' | 'multi'
  description?: string
}

export interface SwaggerSchemaObject {
  type: 'object'
  properties: Record<string, SwaggerSchema>
  required?: string[]
}

export interface SwaggerSchemaEnum {
  enum: Array<string | string>[]
  type?: 'string' | 'integer'
  description?: string
  allOf?: SwaggerSchema[]
  'x-enum-comments'?: Record<string, string>
  'x-enum-varnames'?: string[]
}

export interface SwaggerResponse {
  [key: `"${number}"`]: SwaggerResponseContent
}

export interface SwaggerResponseContent {
  description: string
  schema: SwaggerSchema
}

export interface SwaggerDefinitions {
  [key: string]: SwaggerSchema
}
