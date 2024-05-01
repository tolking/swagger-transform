import { write } from './write'
import { capitalize, genTypeImport, getRefTypeName, isNumber, transformKeyName, transformType, uncapitalize } from './utils'
import type { Config, Swagger, SwaggerSchema, SwaggerSchemaArray, SwaggerSchemaEnum, SwaggerSchemaObject } from './types'

export function definitionsToType(content: Swagger, config: Config) {
  const definitions = Object.assign({}, content?.components?.schemas, content?.definitions)

  for (const key in definitions) {
    const item = definitions[key]
    const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key)
    const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key)

    if ('properties' in item) {
      const [importTypes, properties] = genInterface(item, config)
      let imports = ''

      if (importTypes.size) {
        importTypes.forEach((item) => {
          imports += genTypeImport(item, config)
        })
      }

      const data = `${imports ? `${imports}\n` : ''}export interface ${typeName} {${properties}
}
`

      write(config.outDir!, `${fileName}.ts`, data)
    } else if ('enum' in item) {
      const data = genEnum(typeName, item)

      write(config.outDir!, `${fileName}.ts`, data)
    }
  }
}

export function genInterface(definition: SwaggerSchemaObject, config: Config): [Set<string>, string] {
  const importTypes = new Set<string>()
  let properties = ''

  for (const key in definition.properties) {
    const schema = definition.properties[key]
    const [_importTypes, _type] = genSchema(schema, config)

    if (_type) { 
      _importTypes.forEach((item) => importTypes.add(item))
      properties += genInterfaceProp(key, _type, definition.required, schema.description, config)
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
        const [_importTypes, _properties] = genInterface(item, config)

        _importTypes.forEach((item) => importTypes.add(item))
        return `{${_properties.replaceAll(/ {2}/g, '    ')}\n  }`
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
    const [_importTypes, _type] = genInterface(schema as SwaggerSchemaObject, config)

    _importTypes.forEach((item) => importTypes.add(item))
    return [importTypes, `{${_type.replaceAll(/ {2}/g, '    ')}\n  }`]
  } else if (schema.type) {
    return [importTypes, schema.type]
  }

  return [importTypes, undefined]
}

export function genInterfaceProp(key: string, value: string, required: string[] | undefined, description: string | undefined, config: Config) {
  const isRequired = required && required.includes(key)
  return `${description ? `\n  /** ${description} */` : ''}\n  ${transformKeyName(key)}${isRequired ? '' : '?'}: ${transformType(value, config)}`
}

export function genEnum(typeName: string, definition: SwaggerSchemaEnum) {
  if ('x-enum-varnames' in definition && definition['x-enum-varnames']?.length) {
    const data = definition['x-enum-varnames'].reduce((all, item, index) => {
      const description = definition['x-enum-comments']?.[item] || undefined
      const value = definition.enum[index]

      all += `${description ? `\n  /** ${description} */` : ''}\n  ${item} = ${isNumber(value) ? value : `'${value}'`},`

      return all
    }, '')

    return `export enum ${typeName} {${data}
}
`
  } else {
    return `export type ${typeName} = ${definition.enum.map((item) => `'${item}'`).join(' | ')}`
  }
}
