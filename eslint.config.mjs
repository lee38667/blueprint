import coreWebVitals from 'eslint-config-next/core-web-vitals'

const eslintConfig = [
  ...coreWebVitals,
  {
    // eslint-config-next 16 enables React Compiler rules at "error" by default.
    // These flag pre-existing, functional React patterns (setState in effects,
    // Date.now() in render, etc.). Surface them as warnings for incremental
    // cleanup rather than turning the upgrade into a hard lint failure.
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/immutability': 'warn',
      'react-hooks/preserve-manual-memoization': 'warn',
      'react-hooks/refs': 'warn',
    },
  },
  {
    ignores: [
      'node_modules/**',
      '.claude/**',
      '.next/**',
      'out/**',
      '.tmp-test/**',
      'graphify-out/**',
      'supabase/**',
      'tests/**',
    ],
  },
]

export default eslintConfig
