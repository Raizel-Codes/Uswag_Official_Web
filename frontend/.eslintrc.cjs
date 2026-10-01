/* ESLint 8 (legacy config) — matches the plugins already in package.json. `npm run lint` fails on any warning. */
module.exports = {
  root: true,
  env: { browser: true, es2022: true },
  parser: '@typescript-eslint/parser',
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module', ecmaFeatures: { jsx: true } },
  plugins: ['@typescript-eslint', 'react-hooks', 'react-refresh'],
  extends: ['eslint:recommended', 'plugin:@typescript-eslint/recommended', 'plugin:react-hooks/recommended'],
  ignorePatterns: ['dist', 'node_modules', '*.cjs', 'vite.config.ts', 'tailwind.config.js', 'postcss.config.js'],
  overrides: [
    {
      // These files put a hook, constant or icon beside a component on purpose (a context + its hook,
      // a nav config with its icons, the film kit). The rule only affects dev hot-reload, not correctness.
      files: [
        'src/context/**',
        'src/config/**',
        'src/components/landing/prequel/filmKit.tsx',
        'src/components/landing/ornaments/Quill.tsx',
        'src/components/landing/artifacts/MembershipEnvelope.tsx',
      ],
      rules: { 'react-refresh/only-export-components': 'off' },
    },
  ],
  rules: {
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
    '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
};
