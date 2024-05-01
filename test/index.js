import { swaggerToType } from '../lib/index.js'

swaggerToType({
  entry: './test/swagger.json',
  outDir: './test/types',
  api: {},
})
