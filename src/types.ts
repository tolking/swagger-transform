export interface Config {
  /**
   * The path of the swagger file
   * 
   * @required
   * @example 'path/to/swagger.json'
   * @example 'https://example.com/swagger.json'
   * @example ['path/to/swagger1.json', 'path/to/swagger2.json']
   */
  entry: string | string[]
  /**
   * The output directory of the generated type files
   * 
   * @default 'types'
   * @example 'types/models'
   */
  outDir?: string
  /** Whether to generate an index file that exports all type files  */
  index?: boolean
  /** Add a description at the top of each generated file */
  description?: string
  /** The type conversion map */
  typeMap?: Record<string, string>
  /** The configuration of the generated api file and type */
  api?: {
    /**
     * The file name of the generated api file
     * 
     * @default 'apis'
     */
    fileName?: string
    /**
     * The export name of the generated api
     * 
     * @default 'Apis'
     */
    exportName?: string
    /**
     * The output directory of the generated api file
     * 
     * @default config.outDir
     */
    outDir?: string
    /**
     * The file name of the generated api type file
     * 
     * @default 'allApis'
     */
    typeFileName?: string
    /**
     * The type name of the api
     * 
     * @default 'AllApis'
     */
    typeName?: string
  },
  /**
   * Replace the name of the parameter
   * 
   * @param key The name of the parameter
   * @param type The type of the parameter
   * @param content The content of the swagger file
   */
  reParametersName?: (
    key: string,
    type: Exclude<SwaggerParameter['in'], 'formData'>,
    content: Swagger,
  ) => string,
  /**
   * Replace the name of the definition
   * 
   * @param name The name of the definition
   */
  reDefinitionName?: (name: string) => string,
  /**
   * Replace the file name of the definition
   * 
   * @param name The name of the definition
   */
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
