import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import tsParser from '@typescript-eslint/parser';
import unusedImports from 'eslint-plugin-unused-imports';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

export default [
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'coverage/**',
      'convex/_generated/**',
      'src/convex/_generated/**',
      '.github/**',
      '.codex/**',
    ],
    linterOptions: {
      reportUnusedDisableDirectives: false,
    },
  },
  js.configs.recommended,
  ...compat.extends(
    'plugin:@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
    'plugin:import/recommended',
    'plugin:import/typescript',
    'plugin:unicorn/recommended',
    'plugin:sonarjs/recommended',
    'plugin:promise/recommended',
    'prettier',
  ),
  {
    files: ['**/*.{js,jsx,ts,tsx}', '**/*.mjs', '**/*.cjs'],
    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: { jsx: true },
      },
    },
    // Plugins are loaded via `extends` where possible. Keep rules referencing plugin names. Only
    // attach lightweight plugin objects that don't introduce circular references.
    plugins: {
      'unused-imports': unusedImports,
    },

    settings: {
      react: { version: 'detect' },
      'import/resolver': {
        typescript: {
          project: './tsconfig.json',
        },
        node: { extensions: ['.js', '.jsx', '.ts', '.tsx', '.mjs', '.cjs'] },
      },
      // Treat some virtual/core modules (like Next helpers) as known
      'import/core-modules': ['server-only'],
    },
    rules: {
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/self-closing-comp': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
      'import/order': [
        'warn',
        {
          'newlines-between': 'always',
          alphabetize: { order: 'asc', caseInsensitive: true },
        },
      ],
      'unused-imports/no-unused-imports': 'error',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
      ],
      '@typescript-eslint/consistent-type-imports': [
        'warn',
        { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
      ],
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
      'no-implicit-coercion': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      // Warn when DB write helpers are used — Convex handlers should prefer MutationCtx for writes.
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name=/insert|delete|patch/][callee.object.property.name='db'][callee.object.object.name='ctx']",
          message:
            'Detected ctx.db.<write>. Prefer using a mutation (MutationCtx) for DB writes; add a code comment if this is intentional.',
        },
      ],
      // Generated Convex files may include project-agnostic eslint-disable comments; allow them
      'eslint-comments/no-unused-disable': 'off',
    },
  },
  // Tailwind config is TS but not included in the TS project. Use JS parser and Node globals to avoid
  // type-aware parsing errors.
  {
    files: ['tailwind.config.ts'],
    languageOptions: {
      // Use the TypeScript parser for `tailwind.config.ts` but DO NOT provide a `project` option
      // so it runs in parser-only mode (no type-checking).
      parser: tsParser,
      parserOptions: {
        tsconfigRootDir: __dirname,
      },
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
      },
    },
  },
  {
    // Type-aware rules (project-based) only run for source files under `src/` to avoid
    // accidentally applying them to build/config files like `tailwind.config.ts`.
    files: ['src/**/*.ts', 'src/**/*.tsx'],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        tsconfigRootDir: __dirname,
      },
    },
  },
  // Stronger Convex-specific constraints (narrow scope)
  {
    files: ['src/convex/**'],
    rules: {
      // Require explicit parameter types for exported Convex handlers to avoid ctx-type mistakes
      '@typescript-eslint/typedef': [
        'warn',
        {
          parameter: true,
          arrowParameter: true,
          memberVariableDeclaration: false,
          variableDeclaration: false,
        },
      ],
      // Make accidental DB-write detection in Convex files more visible
      'no-restricted-syntax': [
        'warn',
        {
          selector: "CallExpression[callee.property.name=/insert|delete|patch/][callee.object.property.name='db'][callee.object.object.name='ctx']",
          message:
            'Detected ctx.db.<write> — confirm this is inside a mutation handler (MutationCtx).',
        },
      ],
    },
  },
  // Node-specific files (configs, scripts) should use Node environment
  {
    files: ['**/*.{cjs,mjs}', '*.config.{js,cjs,mjs}', 'next.config.mjs'],
    languageOptions: {
      globals: {
        module: 'readonly',
        require: 'readonly',
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
        console: 'readonly',
      },
    },
    rules: {
      'no-console': 'off',
    },
  },
  // Suppress eslint-comments unused directive warnings for generated Convex files
  {
    files: ['src/convex/_generated/**'],
    rules: {
      'eslint-comments/no-unused-disable': 'off',
    },
  },
];
