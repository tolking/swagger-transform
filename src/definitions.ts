import { defaultApi } from './config'
import { write } from './write'
import {
  capitalize,
  genDescription,
  genTypeExport,
  genTypeImport,
  getRefTypeName,
  isNumber,
  transformKeyName,
  transformType,
  uncapitalize,
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
    const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key)
    const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key)

    fileList.push(fileName)
    if ('properties' in item) {
      const [importTypes, properties] = getInterface(item, config)
      let imports = ''
      let propert = ''

      if (importTypes.size) {
        importTypes.forEach((item) => {
          imports += genTypeImport(item, config)
        })
      }

      properties.forEach((item) => {
        propert += getInterfaceProp(item, config)
      })

      const data = `${description}${imports ? `${imports}\n` : ''}export interface ${typeName} {${propert}
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    } else if ('enum' in item) {
      const data = genEnum(typeName, item)

      write(config.outDir!, `${fileName}.ts`, `${description}${data}`)
    }
  }

  if (config.index) {
    const apiConfig = Object.assign({}, defaultApi, config.api)
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
    const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key)
    const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key)
    const className = config.reClassName ? config.reClassName(key) : `${capitalize(key)}Class`

    fileList.push(fileName)
    if ('properties' in item) {
      const [importTypes, properties] = getInterface(item, config)
      let imports = ''
      let propert = ''
      let constructor = ''

      if (importTypes.size) {
        importTypes.forEach((item) => {
          imports += genTypeImport(item, config)
        })
      }

      properties.forEach((item) => {
        propert += getInterfaceProp(item, config)
        constructor += getConstructorProp(item.key)
      })

      const data = `${description}${imports ? `${imports}\n` : ''}export interface ${typeName} {${propert}
}

export class ${className} {${propert}

  constructor(init: ${typeName}) {${constructor}
  }
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    } else if ('enum' in item) {
      const data = genEnum(typeName, item)

      write(config.outDir!, `${fileName}.ts`, `${description}${data}`)
    }
  }

  if (config.index) {
    const apiConfig = Object.assign({}, defaultApi, config.api)
    const data = fileList.reduce((all, item) => {
      all += genTypeExport(item)
      return all
    }, `${description}${apiConfig.typeFileName ? genTypeExport(apiConfig.typeFileName) : ''}`)

    write(config.outDir!, 'index.ts', data)
  }
}

export function getInterface(definition: SwaggerSchemaObject, config: Config): [Set<string>, PropItem[]] {
  const importTypes = new Set<string>()
  const properties: PropItem[] = []

  for (const key in definition.properties) {
    const schema = definition.properties[key]
    const [_importTypes, type] = genSchema(schema, config)

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

export function genSchema(schema: SwaggerSchema, config: Config): [Set<string>, string | undefined] {
  const importTypes = new Set<string>()

  if ('$ref' in schema && schema.$ref) {
    const type = getRefTypeName(schema.$ref, config)

    importTypes.add(type)
    return [importTypes, type]
  } else if ('allOf' in schema && schema.allOf?.length) {
    const type = schema.allOf.map((item) => {
      if ('$ref' in item && item.$ref) {
        const ref = getRefTypeName(item.$ref, config)
        importTypes.add(ref)
        return ref
      } else if ('properties' in item) {
        const [_importTypes, _properties] = getInterface(item, config)
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

    if ('$ref' in _schema.items && _schema.items.$ref) {
      const type = getRefTypeName(_schema.items.$ref, config)

      importTypes.add(type)
      return [importTypes, `${type}[]`]
    } else if (_schema.items.type) {
      return [importTypes, `${transformType(_schema.items.type, config)}[]`]
    }
  } else if (schema.type && schema.type === 'object') {
    const [_importTypes, _properties] = getInterface(schema as SwaggerSchemaObject, config)
    let propert = ''

    _properties.forEach((item) => {
      propert += getInterfaceProp(item, config)
    })

    _importTypes.forEach((item) => importTypes.add(item))
    return [importTypes, `{${propert.replaceAll(/ {2}/g, '    ')}\n  }`]
  } else if (schema.type) {
    return [importTypes, schema.type]
  }

  return [importTypes, undefined]
}

export function getInterfaceProp(item: PropItem, config: Config) {
  return `${genDescription(item.description)}\n  ${transformKeyName(item.key)}${item.required ? '' : '?'}: ${transformType(item.type, config)}`
}

export function getConstructorProp(key: string) {
  const name = /^[a-zA-Z0-9]*$/.test(key) ? `.${key}` : `['${key}']`
  return `\n    this${name} = init${name}`
}

export function genEnum(typeName: string, definition: SwaggerSchemaEnum) {
  if ('x-enum-varnames' in definition && definition['x-enum-varnames']?.length) {
    const data = definition['x-enum-varnames'].reduce((all, item, index) => {
      const description = definition['x-enum-comments']?.[item] || undefined
      const value = definition.enum[index]

      all += `${genDescription(description)}\n  ${item} = ${isNumber(value) ? value : `'${value}'`},`

      return all
    }, '')

    return `export enum ${typeName} {${data}
}
`
  } else {
    return `export type ${typeName} = ${definition.enum.map((item) => `'${item}'`).join(' | ')}`
  }
}
