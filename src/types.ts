export interface Config {
  entry: string
  outDir?: string
  api?: {
    fileName?: string
    exportName?: string
    typeName?: string
    typeFileName?: string
    outDir?: string
  },
  index?: boolean
  description?: string
  typeMap?: Record<string, string>
  reParametersName?: (
    key: string,
    type: Exclude<SwaggerParameter['in'], 'formData'>,
    content: Swagger,
  ) => string,
  reDefinitionName?: (name: string) => string,
  reDefinitionFileName?: (name: string) => string,
}

/** Swagger */
export interface Swagger {
  swagger: string // 2.x
  openapi: string // 3.x
  info: SwaggerInfo
  paths: SwaggerPaths
  definitions?: SwaggerDefinitions // 2.x
  components?: {
    schemas: SwaggerDefinitions
  } // 3.x
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
  requestBody?: { content?: Record<string, { schema: SwaggerSchema }> } // 3.x
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
  schema?: SwaggerSchema
}

export interface SwaggerParameterBody {
  in: 'body'
  name: string
  description?: string
  required?: boolean
  schema: SwaggerSchema
}

export type SwaggerSchema =
  | SwaggerSchemaDefault
  | SwaggerSchemaRef
  | SwaggerSchemaArray
  | SwaggerSchemaObject
  | SwaggerSchemaEnum

export interface SwaggerSchemaDefault {
  type?: string
  description?: string
  format?: string
  allOf?: SwaggerSchema[]
}

export interface SwaggerSchemaRef {
  $ref?: string
  type?: undefined
  description?: undefined
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
  description?: undefined
}

export interface SwaggerSchemaEnum {
  enum: Array<string | number>
  type?: 'string' | 'integer'
  description?: string
  'x-enum-comments'?: Record<string, string>
  'x-enum-varnames'?: string[]
}

export interface SwaggerResponse {
  [key: string]: SwaggerResponseContent
}

export interface SwaggerResponseContent {
  description: string
  schema?: SwaggerSchema // 2.x
  content?: Record<string, { schema: SwaggerSchema }> // 3.x
}

export interface SwaggerDefinitions {
  [key: string]: SwaggerSchema
}
