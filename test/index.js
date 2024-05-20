import { swaggerToClass } from '../lib/index.js'

swaggerToClass({
  entry: './test/swagger.json',
  outDir: './test/types',
  api: {},
})
