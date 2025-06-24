import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import importPlugin from 'eslint-plugin-import';
import promisePlugin from 'eslint-plugin-promise';
import securityPlugin from 'eslint-plugin-security';
import { viteConfig } from './vite.config.js';

// Create a sanitized version of browser globals
const sanitizedGlobals = { ...globals.browser };
delete sanitizedGlobals['AudioWorkletGlobalScope '];
sanitizedGlobals.AudioWorkletGlobalScope = true;

export default [
  { ignores: ['dist', 'build', 'node_modules', 'coverage', '.nyc_output'] },
  
  // Configuración principal para archivos JS/JSX
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2024,
      globals: sanitizedGlobals,
      parserOptions: {
        ecmaVersion: 'latest',
        ecmaFeatures: { jsx: true },
        sourceType: 'module',
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
      'jsx-a11y': jsxA11y,
      import: importPlugin,
      promise: promisePlugin,
      security: securityPlugin,
    },
    settings: {
      react: {
        version: 'detect',
      },
      'import/resolver': {
        vite: {
          viteConfig,
        },
        node: {
          extensions: ['.js', '.jsx'],
        },
      },
    },
    rules: {
      // === REGLAS BASE ===
      ...js.configs.recommended.rules,
      'no-unused-vars': ['error', { 'args': 'after-used', 'ignoreRestSiblings': true, 'caughtErrors': 'none' }],
      
      // === REGLAS REACT ===
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off',
      'react/prop-types': 'off',
      'react/jsx-uses-react': 'off',
      'react/jsx-uses-vars': 'error',
      'react/no-unescaped-entities': 'error',
      'react/no-unknown-property': 'error',
      'react/self-closing-comp': 'warn',
      'react/jsx-boolean-value': ['warn', 'never'],
      'react/jsx-curly-brace-presence': ['warn', { props: 'never', children: 'never' }],
      'react/jsx-fragments': ['warn', 'syntax'],
      'react/jsx-no-useless-fragment': 'warn',
      'react/no-array-index-key': 'warn',
      'react/no-children-prop': 'error',
      'react/no-danger': 'warn',
      'react/no-deprecated': 'error',
      'react/no-direct-mutation-state': 'error',
      'react/no-find-dom-node': 'error',
      'react/no-is-mounted': 'error',
      'react/no-redundant-should-component-update': 'error',
      'react/no-render-return-value': 'error',
      'react/no-string-refs': 'error',
      'react/no-this-in-sfc': 'error',
      'react/no-typos': 'error',
      'react/no-unsafe': 'error',
      'react/no-unused-prop-types': 'warn',
      'react/no-unused-state': 'warn',
      'react/prefer-es6-class': 'error',
      'react/prefer-stateless-function': 'warn',
      'react/require-render-return': 'error',
      'react/sort-comp': 'warn',
      'react/void-dom-elements-no-children': 'error',
      
      // === ACCESIBILIDAD (jsx-a11y) ===
      ...jsxA11y.configs.recommended.rules,
      'jsx-a11y/alt-text': 'error',
      'jsx-a11y/anchor-has-content': 'error',
      'jsx-a11y/anchor-is-valid': 'error',
      'jsx-a11y/aria-activedescendant-has-tabindex': 'error',
      'jsx-a11y/aria-props': 'error',
      'jsx-a11y/aria-proptypes': 'error',
      'jsx-a11y/aria-role': 'error',
      'jsx-a11y/aria-unsupported-elements': 'error',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/heading-has-content': 'error',
      'jsx-a11y/html-has-lang': 'error',
      'jsx-a11y/img-redundant-alt': 'warn',
      'jsx-a11y/interactive-supports-focus': 'error',
      'jsx-a11y/label-has-associated-control': 'error',
      'jsx-a11y/mouse-events-have-key-events': 'warn',
      'jsx-a11y/no-access-key': 'error',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/no-distracting-elements': 'error',
      'jsx-a11y/no-redundant-roles': 'warn',
      'jsx-a11y/role-has-required-aria-props': 'error',
      'jsx-a11y/role-supports-aria-props': 'error',
      'jsx-a11y/scope': 'error',
      'jsx-a11y/tabindex-no-positive': 'error',
      
      // === IMPORTS/EXPORTS ===
      ...importPlugin.configs.recommended.rules,
      'import/order': ['warn', {
        groups: [
          'builtin',
          'external',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        'newlines-between': 'always',
        alphabetize: { order: 'asc', caseInsensitive: true },
      }],
      'import/no-unresolved': 'error',
      'import/no-duplicates': 'error',
      'import/no-unused-modules': 'warn',
      'import/no-cycle': 'error',
      'import/no-self-import': 'error',
      'import/no-useless-path-segments': 'warn',
      'import/newline-after-import': 'warn',
      'import/no-anonymous-default-export': 'warn',
      'import/prefer-default-export': 'off',
      'import/named': 'error',
      'import/default': 'error',
      'import/namespace': 'error',
      
      // === PROMESAS ===
      ...promisePlugin.configs.recommended.rules,
      'promise/always-return': 'error',
      'promise/catch-or-return': 'error',
      'promise/no-callback-in-promise': 'warn',
      'promise/no-nesting': 'warn',
      'promise/no-promise-in-callback': 'warn',
      'promise/no-return-in-finally': 'warn',
      'promise/no-return-wrap': 'error',
      'promise/param-names': 'error',
      'promise/valid-params': 'warn',
      
      // === SEGURIDAD ===
      ...securityPlugin.configs.recommended.rules,
      'security/detect-buffer-noassert': 'error',
      'security/detect-child-process': 'error',
      'security/detect-disable-mustache-escape': 'error',
      'security/detect-eval-with-expression': 'error',
      'security/detect-new-buffer': 'error',
      'security/detect-no-csrf-before-method-override': 'error',
      'security/detect-non-literal-fs-filename': 'warn',
      'security/detect-non-literal-regexp': 'warn',
      'security/detect-non-literal-require': 'error',
      'security/detect-object-injection': 'warn',
      'security/detect-possible-timing-attacks': 'error',
      'security/detect-pseudoRandomBytes': 'error',
      'security/detect-unsafe-regex': 'error',
      
      // === VARIABLES Y FUNCIONES ===
      'no-unused-vars': ['error', { 
        varsIgnorePattern: '^[A-Z_]|^_',
        argsIgnorePattern: '^_',
        ignoreRestSiblings: true,
        destructuredArrayIgnorePattern: '^_'
      }],
      'no-undef': 'error',
      'no-redeclare': 'error',
      'no-shadow': 'warn',
      'no-shadow-restricted-names': 'error',
      'prefer-const': 'error',
      'no-var': 'error',
      'no-use-before-define': ['error', { functions: false, classes: true, variables: true }],
      'no-unused-expressions': ['error', { allowShortCircuit: true, allowTernary: true }],
      
      // === CALIDAD DE CÓDIGO ===
      'eqeqeq': ['error', 'always', { null: 'ignore' }],
      'no-console': 'warn',
      'no-debugger': 'error',
      'no-alert': 'warn',
      'no-eval': 'error',
      'no-implied-eval': 'error',
      'no-script-url': 'error',
      'no-with': 'error',
      'no-void': 'error',
      'no-useless-concat': 'error',
      'no-useless-return': 'error',
      'no-unreachable': 'error',
      'no-unreachable-loop': 'error',
      'no-duplicate-case': 'error',
      'no-fallthrough': 'error',
      'no-empty': ['error', { allowEmptyCatch: true }],
      'no-empty-function': 'warn',
      'no-lonely-if': 'warn',
      'no-nested-ternary': 'warn',
      'no-unneeded-ternary': 'warn',
      
      // === ARRAYS Y OBJETOS ===
      'no-array-constructor': 'error',
      'no-new-object': 'error',
      'object-shorthand': 'warn',
      'prefer-destructuring': ['warn', {
        array: true,
        object: true
      }, {
        enforceForRenamedProperties: false
      }],
      'prefer-object-spread': 'warn',
      'prefer-spread': 'warn',
      'prefer-template': 'warn',
      
      // === PROMESAS Y ASYNC/AWAIT ===
      'no-async-promise-executor': 'error',
      'no-await-in-loop': 'warn',
      'no-promise-executor-return': 'error',
      'prefer-promise-reject-errors': 'error',
      'require-atomic-updates': 'error',
      
      // === ESTILO Y CONSISTENCIA ===
      'consistent-return': 'warn',
      'default-case': 'warn',
      'default-case-last': 'error',
      'default-param-last': 'error',
      'no-multiple-empty-lines': ['warn', { max: 2, maxEOF: 1, maxBOF: 0 }],
      'no-trailing-spaces': 'warn',
      'comma-dangle': ['warn', 'always-multiline'],
      'quotes': ['warn', 'single', { avoidEscape: true, allowTemplateLiterals: true }],
      'semi': ['error', 'always'],
      'indent': ['warn', 2, { SwitchCase: 1 }],
      'linebreak-style': ['error', 'unix'],
      'max-len': ['warn', { code: 100, ignoreUrls: true, ignoreStrings: true }],
      'brace-style': ['warn', '1tbs', { allowSingleLine: true }],
      'comma-spacing': ['warn', { before: false, after: true }],
      'key-spacing': ['warn', { beforeColon: false, afterColon: true }],
      'space-before-blocks': 'warn',
      'space-before-function-paren': ['warn', { anonymous: 'always', named: 'never', asyncArrow: 'always' }],
      'space-in-parens': ['warn', 'never'],
      'space-infix-ops': 'warn',
      'space-unary-ops': ['warn', { words: true, nonwords: false }],
      'arrow-spacing': 'warn',
      'block-spacing': 'warn',
      'computed-property-spacing': ['warn', 'never'],
      'func-call-spacing': ['warn', 'never'],
      'keyword-spacing': 'warn',
      'no-multi-spaces': 'warn',
      'no-whitespace-before-property': 'warn',
      'object-curly-spacing': ['warn', 'always'],
      'rest-spread-spacing': ['warn', 'never'],
      'semi-spacing': 'warn',
      'template-curly-spacing': 'warn',
      
      // === PERFORMANCE ===
      'no-loop-func': 'error',
      'no-caller': 'error',
      'no-extend-native': 'error',
      'no-extra-bind': 'error',
      'no-implicit-coercion': 'warn',
      'no-implicit-globals': 'error',
      'no-new': 'error',
      'no-new-func': 'error',
      'no-new-wrappers': 'error',
      'no-octal-escape': 'error',
      'no-proto': 'error',
      'no-return-assign': 'error',
      'no-sequences': 'error',
      'no-throw-literal': 'error',
      'prefer-arrow-callback': 'warn',
      'prefer-numeric-literals': 'error',
      'prefer-rest-params': 'error',
      'radix': 'error',
      'yoda': 'error',
      
      // === React Refresh ===
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
    },
  },
  
  // === CONFIGURACIÓN PARA ARCHIVOS DE CONFIGURACIÓN ===
  {
    files: ['**/*.config.{js,mjs}/**/*'],
    languageOptions: {
      globals: globals.node,
    },
    rules: {
      'no-console': 'off',
      'import/no-anonymous-default-export': 'off',
    },
  },
  
  // === CONFIGURACIÓN PARA TESTS ===
  {
    files: ['**/*.{test,spec}.{js,jsx}', '**/__tests__/**/*.{js,jsx}'],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.jest,
        ...globals.vitest,
      },
    },
    rules: {
      'no-console': 'off',
      'react/display-name': 'off',
      'import/no-anonymous-default-export': 'off',
      'jsx-a11y/no-autofocus': 'off',
    },
  },
  
  // === CONFIGURACIÓN PARA HOOKS PERSONALIZADOS ===
  {
    files: ['**/hooks/**/*.{js,jsx}', '**/use*.{js,jsx}'],
    rules: {
      'react-hooks/exhaustive-deps': 'error',
    },
  },
];