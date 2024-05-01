import eslint from '@eslint/js'
import tseslint from 'typescript-eslint'

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    ignores: ['lib/**', 'test/types/**'],
    rules: {
      quotes: ['error', 'single'],
      semi: ['error', 'never'],
    }
  }
)
