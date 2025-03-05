import googleStyle from 'eslint-config-google';
import eslint from '@eslint/js';
import tslint from 'typescript-eslint';
import jsdoc from 'eslint-plugin-jsdoc';
import globals from 'globals';

// These rules are no longer supported, but the Google style package we depend
// on hasn't been updated in years to remove them, even though they have been
// removed from the repo. Manually delete them here to avoid breaking linting.
delete googleStyle.rules['valid-jsdoc'];
delete googleStyle.rules['require-jsdoc'];

export default [
  {
    // Note: there should be no other properties in this object
    ignores: [
      // node modules
      'node_modules/*',
      // build artifacts
      'msg/{js,json}/**',
      'i18n/*',
      'shim/*',
      'dist/*',
      'gh-pages/*',
      'build/*',
      // tests
      'tests/*',
      // old sources
      'core/*',
      'blocks_*/*'
    ]
  },
  eslint.configs.recommended,
  jsdoc.configs['flat/recommended'],
  googleStyle,
  {
    rules: {
      'max-len': ['error', {
        code: 120,
        tabWidth: 2,
        ignoreUrls: true
      }],
      'quote-props': ['warn', 'as-needed'],
      'comma-dangle': ['error', 'never'],
      indent: ['error', 2, {
        SwitchCase: 1
      }],
      // Allow any text in the license tag. Other checks are not relevant.
      'jsdoc/check-values': ['off'],
      'jsdoc/require-param': ['warn', {
        checkDestructured: false,
        checkDestructuredRoots: false
      }],
      'jsdoc/check-param-names': ['warn', {
        checkDestructured: false
      }]
    },
    settings: {
      // Allowlist some JSDoc tag aliases we use.
      jsdoc: {
        tagNamePreference: {
          fileoverview: 'fileoverview'
        }
      }
    }
  },
  {
    files: [
      'scripts/**/*.js',
      'webpack.config.js'
    ],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        ...globals.node
      }
    }
  },
  {
    files: ['msg/messages.js'],
    languageOptions: {
      sourceType: 'commonjs',
      globals: {
        Blockly: 'readonly'
      }
    },
    rules: {
      'max-len': ['off']
    }
  },
  ...tslint.config({
    files: ['src/**/*.ts'],
    extends: [
      tslint.configs.recommended,
      jsdoc.configs['flat/recommended-typescript']
    ],
    languageOptions: {
      parser: tslint.parser
    },
    rules: {
      'jsdoc/check-values': ['off'],
      '@typescript-eslint/no-unused-vars': ['error', {
        args: 'none'
      }]
    }
  })
];
