import typescript from '@rollup/plugin-typescript'

const commonConf = {
  input: 'src/index.ts',
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
      exclude: ['node_modules/**', 'test/**'],
    }),
  ],
}

const list = [
  {
    file: 'lib/index.js',
    format: 'es',
  },
  {
    file: 'lib/index.cjs',
    format: 'cjs',
  },
]

const buildConf = (options) => Object.assign({}, commonConf, options)

export default list.map((output) => buildConf({ output }))
