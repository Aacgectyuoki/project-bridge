import js from '@eslint/js'
import next from 'eslint-config-next'
import tseslint from 'typescript-eslint'

export default [
  js.configs.recommended,
  ...next(),
  tseslint.configs.recommendedTypeChecked,
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    rules: {
      // Example custom rules
      'no-console': 'warn',
      'react/react-in-jsx-scope': 'off',
    },
  },
]
