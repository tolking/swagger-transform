import { write } from './write'
import { capitalize, genTypeImport, getRefTypeName, isNumber, transformType, uncapitalize } from './utils'
import type { Config, Swagger, SwaggerSchemaArray, SwaggerSchemaEnum, SwaggerSchemaObject } from './types'

export function definitionsToType(content: Swagger, config: Config) {
  const definitions = content?.components?.schemas || content?.definitions || {}

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

function genInterface(definition: SwaggerSchemaObject, config: Config): [Set<string>, string] {
  const importTypes = new Set<string>()
  let properties = ''

  for (const key in definition.properties) {
    const item = definition.properties[key]

    if ('$ref' in item && item.$ref) {
      const ref = getRefTypeName(item.$ref, config)

      importTypes.add(ref)
      properties += genInterfaceProp(key, ref, definition.required, item.description, config)
    } else if ('allOf' in item && item.allOf?.length) {
      const allOf = item.allOf.map((item) => {
        if ('$ref' in item && item.$ref) {
          const ref = getRefTypeName(item.$ref, config)
          importTypes.add(ref)
          return ref
        } else {
          return item.type
        }
      }).join(' & ')

      properties += genInterfaceProp(key, allOf, definition.required, item.description, config)
    } else if ('enum' in item) {
      const value = item.enum.map((item) => isNumber(item) ? item : `'${item}'`).join(' | ')

      properties += genInterfaceProp(key, value, definition.required, item.description, config)
    } else if (item.type && item.type === 'array') {
      const _item = item as SwaggerSchemaArray

      if ('$ref' in _item.items && _item.items.$ref) {
        const ref = getRefTypeName(_item.items.$ref, config)
        importTypes.add(ref)
        properties += genInterfaceProp(key, `${ref}[]`, definition.required, item.description, config)
      } else if (_item.items.type) {
        properties += genInterfaceProp(key, `${transformType(_item.items.type, config)}[]`, definition.required, item.description, config)
      }
    } else if (item.type && item.type === 'object') {
      const [_importTypes, _properties] = genInterface(item as SwaggerSchemaObject, config)

      _importTypes.forEach((item) => importTypes.add(item))
      properties += genInterfaceProp(key, `{${_properties.replaceAll(/ {2}/g, '    ')}\n  }`, definition.required, item.description, config)
    } else if (item.type) {
      properties += genInterfaceProp(key, item.type, definition.required, item.description, config)
    }
  }

  return [importTypes, properties]
}

function genInterfaceProp(key: string, value: string, required: string[] | undefined, description: string | undefined, config: Config) {
  const isRequired = required && required.includes(key) ? '' : '?'
  return `${description ? `\n  /** ${description} */` : ''}\n  ${key}${isRequired}: ${transformType(value, config)}`
}

function genEnum(typeName: string, definition: SwaggerSchemaEnum) {
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
