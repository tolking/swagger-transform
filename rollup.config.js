import typescript from '@rollup/plugin-typescript'

const commonConf = {
  input: './src/index.ts',
  plugins: [
    typescript({
      tsconfig: './tsconfig.json',
    }),
  ],
}

const list = [
  {
    file: 'lib/index.js',
    format: 'es',
    exports: 'named',
    compact: true,
  },
  {
    file: 'lib/index.cjs',
    format: 'cjs',
    exports: 'named',
    compact: true,
  },
]

const buildConf = (options) => Object.assign({}, commonConf, options)

export default list.map((output) => buildConf({ output }))
