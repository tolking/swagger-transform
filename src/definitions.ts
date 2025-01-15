import { emptyPropert, ignoreLint } from './config'
import { write } from './write'
import {
  genDescription,
  genTypeExport,
  genTypeImport,
  getApiConfig,
  getClassName,
  getDefinitionFileName,
  getDefinitionName,
  getRefTypeName,
  isNumber,
  transformKeyName,
  transformType,
} from './utils'
import type {
  Config,
  PropItem,
  Swagger,
  SwaggerSchema,
  SwaggerSchemaArray,
  SwaggerSchemaEnum,
  SwaggerSchemaObject,
} from './types'

export function definitionsToType(content: Swagger, config: Config) {
  const definitions = Object.assign({}, content?.components?.schemas, content?.definitions)
  const description = genDescription(config.description, '', '\n\n')
  const fileList: string[] = []

  for (const key in definitions) {
    const item = definitions[key]
    const fileName = getDefinitionFileName(key, config)
    const typeName = getDefinitionName(key, config)

    fileList.push(fileName)
    if ('properties' in item) {
      const [importTypes, properties] = getInterface(item, config)
      let imports = ''
      let propert = ''

      if (importTypes.size) {
        importTypes.forEach((item) => {
          if (item === typeName) return
          const fileName = getDefinitionFileName(item, config)
          imports += genTypeImport(item, `./${fileName}`)
        })
      }

      properties.forEach((item) => {
        propert += getInterfaceProp(item, config)
      })

      const data = `${description}${imports ? `${imports}\n` : ''}export interface ${typeName} {${propert || emptyPropert}
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    } else if ('enum' in item) {
      const data = genEnum(typeName, item, config)

      write(config.outDir!, `${fileName}.ts`, `${description}${data}`)
    } else if (item.type === 'object') {
      const data = `${description}${ignoreLint}
export type ${typeName} = Record<string, any>`

      write(config.outDir!, `${fileName}.ts`, data)
    }
  }

  if (config.index) {
    const apiConfig = getApiConfig(config)
    const data = fileList.reduce((all, item) => {
      all += genTypeExport(item)
      return all
    }, `${description}${apiConfig.typeFileName ? genTypeExport(apiConfig.typeFileName) : ''}`)

    write(config.outDir!, 'index.ts', data)
  }
}
export function definitionsToClass(content: Swagger, config: Config) {
  const definitions = Object.assign({}, content?.components?.schemas, content?.definitions)
  const description = genDescription(config.description, '', '\n\n')
  const fileList: string[] = []

  for (const key in definitions) {
    const item = definitions[key]
    const fileName = getDefinitionFileName(key, config)
    const typeName = getDefinitionName(key, config)
    const className = getClassName(key, config)

    fileList.push(fileName)
    if ('properties' in item) {
      const [importTypes, properties] = getInterface(item, config, 'class')
      let imports = ''
      let propert = ''
      let constructor = ''

      if (importTypes.size) {
        importTypes.forEach((item) => {
          if (item === typeName) return
          const className = getClassName(item, config)
          const fileName = getDefinitionFileName(item, config)
          imports += genTypeImport(className, `./${fileName}`)
        })
      }

      properties.forEach((item) => {
        propert += getInterfaceProp(item, config)
        constructor += getConstructorProp(item.key)
      })

      const data = `${description}${imports ? `${imports}\n` : ''}export interface ${typeName} {${propert || emptyPropert}
}

export class ${className} {${propert || emptyPropert}

  constructor(init: ${typeName}) {${constructor}
  }
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    } else if ('enum' in item) {
      const data = genEnum(typeName, item, config, 'class')

      write(config.outDir!, `${fileName}.ts`, `${description}${data}`)
    } else if (item.type === 'object') {
      const data = `${description}${ignoreLint}
export type ${typeName} = Record<string, any>

export class ${className} {
  ${ignoreLint}
  [key: string]: any

  constructor(init: ${typeName}) {
    for (const key in init) {
      this[key] = init[key]
    }
  }
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    }
  }

  if (config.index) {
    const apiConfig = getApiConfig(config)
    const data = fileList.reduce((all, item) => {
      all += genTypeExport(item)
      return all
    }, `${description}${apiConfig.typeFileName ? genTypeExport(apiConfig.typeFileName) : ''}`)

    write(config.outDir!, 'index.ts', data)
  }
}

export function getInterface(definition: SwaggerSchemaObject, config: Config, definitionType?: 'type' | 'class'): [Set<string>, PropItem[]] {
  const importTypes = new Set<string>()
  const properties: PropItem[] = []

  for (const key in definition.properties) {
    const schema = definition.properties[key]
    const [_importTypes, type] = genSchema(schema, config, definitionType)

    if (type) {
      const required = definition.required && definition.required.includes(key)

      _importTypes.forEach((item) => importTypes.add(item))
      properties.push({
        key,
        type,
        required,
        description: schema.description,
      })
    }
  }

  return [importTypes, properties]
}

export function genSchema(schema: SwaggerSchema, config: Config, definitionType?: 'type' | 'class'): [Set<string>, string | undefined] {
  const importTypes = new Set<string>()

  if ('$ref' in schema && schema.$ref) {
    const type = getRefTypeName(schema.$ref, config)
    const className = getClassName(type, config)

    importTypes.add(type)
    return [importTypes, definitionType === 'class'? className : type]
  } else if ('allOf' in schema && schema.allOf?.length) {
    const type = schema.allOf.map((item) => {
      if ('$ref' in item && item.$ref) {
        const ref = getRefTypeName(item.$ref, config)
        const className = getClassName(ref, config)

        importTypes.add(ref)
        return definitionType === 'class'? className : ref
      } else if ('properties' in item) {
        const [_importTypes, _properties] = getInterface(item, config, definitionType)
        let propert = ''

        _properties.forEach((item) => {
          propert += getInterfaceProp(item, config)
        })

        _importTypes.forEach((item) => importTypes.add(item))
        return `{${propert.replaceAll(/ {2}/g, '    ')}\n  }`
      }
    }).join(' & ')

    return [importTypes, type]
  } else if ('enum' in schema) {
    const type = schema.enum.map((item) => isNumber(item) ? item : `'${item}'`).join(' | ')

    return [importTypes, type]
  } else if ((schema.type && schema.type === 'array') || ('items' in schema && schema.items)) {
    const _schema = schema as SwaggerSchemaArray
    const [imports, name] = genSchema(_schema.items, config, definitionType)

    imports.forEach((item) => importTypes.add(item))
    return [importTypes, `${name}[]`]
  } else if (schema.type && schema.type === 'object' && schema.additionalProperties) {
    const [imports, name] = genSchema(schema.additionalProperties, config, definitionType)

    imports.forEach((item) => importTypes.add(item))
    return [importTypes, `Record<string, ${name}>`]
  } else if (schema.type && schema.type === 'object') {
    const [_importTypes, _properties] = getInterface(schema as SwaggerSchemaObject, config, definitionType)
    let propert = ''

    _properties.forEach((item) => {
      propert += getInterfaceProp(item, config)
    })

    _importTypes.forEach((item) => importTypes.add(item))
    return [importTypes, propert ? `{${propert.replaceAll(/ {2}/g, '    ')}\n  }` : 'object']
  } else if (schema.type) {
    return [importTypes, transformType(schema.type, config)]
  }

  return [importTypes, undefined]
}

export function getInterfaceProp(item: PropItem, config: Config) {
  return `${genDescription(item.description)}\n  ${item.type === 'object' ? `${ignoreLint}\n  ` : ''}${transformKeyName(item.key)}${item.required ? '' : '?'}: ${transformType(item.type, config)}`
}

export function getConstructorProp(key: string) {
  const name = /^[a-zA-Z0-9]*$/.test(key) ? `.${key}` : `['${key}']`
  return `\n    this${name} = init${name}`
}

export function genEnum(typeName: string, definition: SwaggerSchemaEnum, config: Config, definitionType?: 'type' | 'class') {
  const append = definitionType === 'class' ? `
  
export type ${getClassName(typeName, config)} = ${typeName}` : ''

  if ('x-enum-varnames' in definition && definition['x-enum-varnames']?.length) {
    const data = definition['x-enum-varnames'].reduce((all, item, index) => {
      const description = definition['x-enum-comments']?.[item] || undefined
      const value = definition.enum[index]

      all += `${genDescription(description)}\n  ${item} = ${isNumber(value) ? value : `'${value}'`},`

      return all
    }, '')

    return `export enum ${typeName} {${data}
}${append}
`
  } else {
    return `export type ${typeName} = ${definition.enum.map((item) => `'${item}'`).join(' | ')}${append}`
  }
}
