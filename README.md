# swagger-transform

A tool to generate API clients from Swagger/OpenAPI specs.

## Tips

- Only support the `json` format of the Swagger/OpenAPI spec.
- Partial content conversion may not be supported in some cases.

## Installation

```bash
npm install swagger-transform
```

## Usage

```ts
import { swaggerToType, swaggerToClass } from 'swagger-transform'

swaggerToType({
  entry: 'path/to/swagger.json',
  // or
  entry: 'https://example.com/swagger.json'
  // or
  entry: ['path/to/swagger1.json', 'path/to/swagger2.json'],
})

// or transform to class
swaggerToClass({
  entry: 'path/to/swagger.json',
})
```

## Options

### entry

- Type: `string` | `Array<string>`
- Required: `true`

The path to the Swagger/OpenAPI spec file or the URL to the Swagger/OpenAPI spec.

### outDir

- Type: `string`
- Default: `'types'`

The output directory of the generated type files.

### index

- Type: `boolean`
- Default: `false`

Whether to generate an index file that exports all type files.

### description

- Type: `string`

Add a description at the top of each generated file.

### typeMap

- Type: `object`
- Default: `{ integer: 'number' }`

The mapping of the Swagger/OpenAPI types to TypeScript types.

### api

- Type: `object` | `undefined`

The configuration of the generated api file and type. If `undefined`, the api file will not be generated. The configuration is as follows:

+ api.fileName

  - Type: `string`
  - Default: `'apis'`

  The file name of the generated api file

+ api.exportName

  - Type: `string`
  - Default: `'Apis'`

  The export name of the generated api file

+ api.outDir

  - Type: `string`
  - Default: config.outDir

  The output directory of the generated api file

+ api.typeFileName

  - Type: `string`
  - Default: `'allApis'`

  The file name of the generated api type file

+ api.typeName

  - Type: `string`
  - Default: `'AllApis'`

  The export name of the generated api type file

+ api.definitionType

  - Type: `'type' | 'class'`
  - Default: `'type'`

  The type name of the generated api definition, When using the `swaggerToClass` function, you can configure

### reParametersName

- Type: `function`

A function that receives the parameter name and returns the new parameter name.

### reDefinitionName

- Type: `function`

A function that receives the definition name and returns the new definition name.

### reDefinitionFileName

- Type: `function`

A function that receives the definition name and returns the new definition file name.

### reClassName

- Type: `function`

A function that receives the class name and returns the new class name.
