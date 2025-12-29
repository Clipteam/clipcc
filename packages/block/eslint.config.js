const js = require('@eslint/js');
const globals = require('globals');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: 'script',
      globals: {
        ...globals.browser,
        ...globals.commonjs,
        Blockly: true, // Blockly global
        goog: true // goog closure libraries/includes
      }
    },
    rules: {
      'curly': ['error', 'multi-line'],
      'eol-last': ['error'],
      'indent': [
        'error', 2,  // Blockly/Google use 2-space indents
        // Blockly/Google uses +4 space indents for line continuations.
        {
          'SwitchCase': 1,
          'MemberExpression': 2,
          'ObjectExpression': 1,
          'FunctionDeclaration': {
            'body': 1,
            'parameters': 2
          },
          'FunctionExpression': {
            'body': 1,
            'parameters': 2
          },
          'CallExpression': {
            'arguments': 2
          },
          // Ignore default rules for ternary expressions.
          'ignoredNodes': ['ConditionalExpression']
        }
      ],
      'linebreak-style': ['error', 'unix'],
      'max-len': ['error', 120, 4],
      'no-trailing-spaces': ['error', { 'skipBlankLines': true }],
      'no-unused-vars': [
        'error',
        {
          'args': 'after-used',
          // Ignore vars starting with an underscore.
          'varsIgnorePattern': '^_',
          // Ignore arguments starting with an underscore.
          'argsIgnorePattern': '^_'
        }
      ],
      'no-use-before-define': ['error'],
      'no-self-assign': ['off'], // Blockly uses for exporting symbols.
      'quotes': ['off'], // Blockly mixes single and double quotes
      'semi': ['error', 'always'],
      'space-before-function-paren': ['error', 'never'], // Blockly doesn't have space before function paren
      'space-infix-ops': ['error'],
      'strict': ['off'], // Blockly uses 'use strict' in files
      'no-cond-assign': ['off'], // Blockly often uses cond-assignment in loops
      'no-redeclare': ['off'], // Closure style allows redeclarations
      'no-console': ['off'],
      'no-constant-condition': ['off'],
      'no-var': ['error'],
      'prefer-const': ['error']
    }
  },
  // ES6 modules for core files
  {
    files: ['core/**/**/*.js'],
    languageOptions: {
      sourceType: 'module'
    }
  },
  // Node environment for specific files
  {
    files: ['tests/jsunit/test_runner.js', 'gulpfile.js'],
    languageOptions: {
      globals: {
        ...globals.node
      }
    }
  },
  // Global ignores
  {
    ignores: [
      'node_modules/**',
      'build/**',
      'dist/**',
      'gh-pages/**',
      '**/*_compressed*.js',
      '**/*_uncompressed*.js',
      'msg/**',
      'core/css.js',
      'i18n/**',
      'tests/jsunit/**',
      'tests/workspace_svg/**',
      'tests/blocks/**',
      'demos/**',
      'accessible/**',
      'appengine/**',
      'shim/**',
      'webpack.config.js',
      '**/*.min.js'
    ]
  }
];
