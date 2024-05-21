import { swaggerToClass, capitalize } from '../lib/index.js'

swaggerToClass({
  entry: './test/swagger.json',
  outDir: './test/types',
  api: {
    definitionType: 'class',
  },
  reClassName: (name) => `${capitalize(name)}Model`,
})
