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

const _applyFiles = (configs, files) =>
  configs.map(cfg =>
    cfg?.files
      ? { ...cfg, files: [...new Set([...cfg.files, ...files])] }
      : { ...cfg, files },
  );

// Some environments (or older tooling) can fail to resolve legacy "plugin:.../recommended"
// shareable-config strings. Import unicorn directly and inline its `recommended` flat
// config when available — this avoids the "couldn't find the config \"plugin:unicorn/recommended\""
// error while preserving the same rule set.
const unicornExtend = await import('eslint-plugin-unicorn')
  .then(m => m.default?.configs?.recommended)
  .catch(() => {});

// SonarJS ships both a flat-config and a legacy-style config. Prefer the
// legacy variant when available; otherwise fall back to the flat config but
// strip the top-level `name` property which ESLint's legacy loader rejects.
const sonarjsExtend = await import('eslint-plugin-sonarjs')
  .then(m => {
    const cfg = m.default?.configs;
    if (!cfg) return false;
    if (cfg['recommended-legacy']) return cfg['recommended-legacy'];
    if (cfg.recommended) {
      const copy = { ...cfg.recommended };
      delete copy.name;
      return copy;
    }
    return false;
  })
  .catch(() => {});

// Normalize legacy-style shareable configs into flat-config-compatible objects.
// - convert `plugins: ['name']` into `plugins: { name: pluginObject }`
// - strip `name` property (not allowed in legacy-style contexts)
// eslint-disable-next-line sonarjs/cognitive-complexity -- helper function
const _normalizePluginConfig = async cfg => {
  if (!cfg) return;

  const normalized = { ...cfg };
  // convert plugin-array -> plugin-object
  if (Array.isArray(normalized.plugins)) {
    const object = {};
    for (const name of normalized.plugins) {
      try {
        const module_ = await import(`eslint-plugin-${name}`);
        object[name] = module_.default || module_;
      } catch {
        // if we can't import the plugin module, keep the string (ESLint may still try to resolve it)
        object[name] = name;
      }
    }
    normalized.plugins = object;
  } else if (normalized.plugins && typeof normalized.plugins === 'object') {
    const object = {};
    for (const [k, v] of Object.entries(normalized.plugins)) {
      if (typeof v === 'string') {
        try {
          const module_ = await import(v);
          object[k] = module_.default || module_;
        } catch {
          object[k] = v;
        }
      } else {
        object[k] = v;
      }
    }
    normalized.plugins = object;
  }

  delete normalized.name;
  return normalized;
};

const unicornExtension = await _normalizePluginConfig(unicornExtend);
const sonarjsExtension = await _normalizePluginConfig(sonarjsExtend);

const baseCompatExtends = compat.extends(
  'plugin:@typescript-eslint/recommended',
  'plugin:import/recommended',
  'plugin:import/typescript',
  'plugin:promise/recommended',
  'prettier',
);

const reactCompatExtends = _applyFiles(
  compat.extends(
    'plugin:react/recommended',
    'plugin:react-hooks/recommended',
    'plugin:jsx-a11y/recommended',
  ),
  ['**/*.{jsx,tsx}'],
);

export default [
  // Global ignores for generated and build files
  {
    ignores: [
      '**/node_modules/**',
      '.next/**',
      'out/**',
      'dist/**',
      'coverage/**',
      '.github/**',
      '.codex/**',
      // Convex auto-generated files - must use full glob patterns
      'convex/_generated/**',
      'src/convex/_generated/**',
      '**/convex/_generated/**',
    ],
  },
  js.configs.recommended,
  ...baseCompatExtends,
  ...reactCompatExtends,
  ...(unicornExtension ? [unicornExtension] : []),
  ...(sonarjsExtension ? [sonarjsExtension] : []),
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
      react: { version: '19.2.4' },
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

      'no-implicit-coercion': 'warn',
      'unicorn/consistent-function-scoping': 'warn',
      // Warn when DB write helpers are used — Convex handlers should prefer MutationCtx for writes.
      'no-restricted-syntax': [
        'warn',
        {
          selector:
            "CallExpression[callee.property.name=/insert|delete|patch/][callee.object.property.name='db'][callee.object.object.name='ctx']",
          message:
            'Detected ctx.db.<write>. Prefer using a mutation (MutationCtx) for DB writes; add a code comment if this is intentional.',
        },
      ],
      // Generated Convex files may include project-agnostic eslint-disable comments; allow them
      'eslint-comments/no-unused-disable': 'off',
    },
  },
  {
    files: ['**/*.{jsx,tsx}'],
    rules: {
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-react': 'off',
      'react/prop-types': 'off',
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-unstable-nested-components': 'warn',
      'react/self-closing-comp': 'warn',
      'react-hooks/exhaustive-deps': 'warn',
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
    rules: {
      // Rules that require type information must only run in type-aware contexts.
      '@typescript-eslint/strict-boolean-expressions': 'warn',
      '@typescript-eslint/no-unnecessary-type-assertion': 'error',
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
          selector:
            "CallExpression[callee.property.name=/insert|delete|patch/][callee.object.property.name='db'][callee.object.object.name='ctx']",
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
