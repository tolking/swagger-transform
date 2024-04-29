import { write } from "./write";
import { capitalize, genTypeImport, getFileNameFromPath, uncapitalize } from "./utils";
import type { Config, Swagger, SwaggerSchemaObject } from "./types";

export function definitionsToType(content: Swagger, config: Config) {
  for (const key in content.definitions) {
    const item = content.definitions[key];

    if ('properties' in item) {
      definitionToInterface(key, item, config);
    }
  }
}

function definitionToInterface(key: string, definition: SwaggerSchemaObject, config: Config) {
  const fileName = config.reDefinitionFileName ? config.reDefinitionFileName(key) : uncapitalize(key);
  const typeName = config.reDefinitionName ? config.reDefinitionName(key) : capitalize(key);
  const importTypes: string[] = [];
  let properties = '';

  for (const key in definition.properties) {
    const item = definition.properties[key];

    if ('$ref' in item) {
      // TODO: 
      const ref = getFileNameFromPath(item.$ref!);
      importTypes.push(ref);
      properties += `${key}: ${capitalize(ref)};\n`;
    } else {
      properties += `${key}: ${item.type};\n`;
    }
  }

  const imports = importTypes.length ? importTypes.map((item) => genTypeImport(item, config)).join('\n') + '\n' : '';
  const data = `${imports}export interface ${typeName} {
  ${properties}
}`;

  write(config.outDir!, fileName, data);
}
