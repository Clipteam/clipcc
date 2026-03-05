# Scratch ESLint config

[![Greenkeeper badge](https://badges.greenkeeper.io/LLK/eslint-config-scratch.svg)](https://greenkeeper.io/)

#### eslint-config-scratch defines the eslint rules used for Scratch Javascript projects

## Installation

Install the config along with its peer dependencies, eslint, @eslint/js, globals, eslint-plugin-jsdoc, and @babel/eslint-parser.

```bash
npm install -DE eslint-config-clipcc eslint@^9 @eslint/js@^9 globals@^15 eslint-plugin-jsdoc@^50 @babel/eslint-parser@^7
```

If you're using the React config, also install the dependency for that

```bash
npm install -DE eslint-plugin-react@^7
```

If you're using the TypeScript config, also install the dependencies for that

```bash
npm install -DE @typescript-eslint/eslint-plugin@^8 @typescript-eslint/parser@^8
```

## Usage (ESLint 9 Flat Config)

> **Note**: This package now uses ESLint 9's flat config format. For the old eslintrc format, see the Migration Guide below.

The configuration is split up into several modules:
* `eslint-config-clipcc`: The base configuration. Always extend this.
* `eslint-config-clipcc/node`: Rules for node, e.g., server-side code, tests, and scripts
* `eslint-config-clipcc/es6`: Rules for ES6, for use when you're transpiling with webpack
* `eslint-config-clipcc/react`: Rules for React projects
* `eslint-config-clipcc/ts`: Rules for TypeScript

### Flat Config Setup

With ESLint 9, you create an `eslint.config.js` file in your project root. Here are examples:

#### Basic Node.js project
```javascript
// eslint.config.js
const clipccConfig = require('eslint-config-clipcc');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    clipccNode
];
```

#### ES6 + Node.js project
```javascript
// eslint.config.js
const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    clipccES6,
    clipccNode
];
```

#### React project with separate source directory
```javascript
// eslint.config.js
const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');
const clipccReact = require('eslint-config-clipcc/react');
const globals = require('globals');

module.exports = [
    // Base config for all files
    ...clipccConfig,
    clipccES6,
    clipccNode,
    
    // React config for source files
    {
        files: ['src/**/*.{js,jsx}'],
        languageOptions: {
            globals: {
                ...globals.browser
            }
        }
    },
    ...clipccReact.map(config => ({
        ...config,
        files: ['src/**/*.{js,jsx}']
    })),
    
    // Global ignores
    {
        ignores: ['node_modules/**', 'build/**', 'dist/**']
    }
];
```

#### TypeScript project
```javascript
// eslint.config.js
const clipccConfig = require('eslint-config-clipcc');
const clipccTS = require('eslint-config-clipcc/ts');

module.exports = [
    ...clipccConfig,
    ...clipccTS,
    {
        ignores: ['node_modules/**', 'build/**', 'dist/**']
    }
];
```

### Linting React Files

If you're linting React, your lint script will automatically lint `.jsx` files with the flat config:
```json
"scripts": {
    "lint": "eslint ."
}
```

## Migration Guide from ESLint 8 to ESLint 9

### Key Changes

1. **Config Format**: ESLint 9 uses flat config (`eslint.config.js`) instead of `.eslintrc` files
2. **No More `.eslintignore`**: Use the `ignores` property in your config instead
3. **Environment Variables**: Use `languageOptions.globals` from the `globals` package instead of `env`
4. **Plugins**: Import plugins directly as objects instead of using strings

### Migration Steps

#### 1. Update Dependencies

```bash
# Remove old dependencies
npm uninstall eslint

# Install new dependencies
npm install -DE eslint@^9 @eslint/js@^9 globals@^15 eslint-plugin-jsdoc@^50 @babel/eslint-parser@^7
npm install -DE eslint-config-clipcc@latest
```

#### 2. Convert Your Config File

**Old `.eslintrc.js`:**
```javascript
module.exports = {
    extends: ['clipcc', 'clipcc/es6', 'clipcc/node']
};
```

**New `eslint.config.js`:**
```javascript
const clipccConfig = require('eslint-config-clipcc');
const clipccES6 = require('eslint-config-clipcc/es6');
const clipccNode = require('eslint-config-clipcc/node');

module.exports = [
    ...clipccConfig,
    clipccES6,
    clipccNode
];
```

#### 3. Convert Environment Variables

**Old:**
```javascript
env: {
    browser: true,
    node: true
}
```

**New:**
```javascript
const globals = require('globals');

{
    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.node
        }
    }
}
```

#### 4. Convert Ignore Patterns

**Old `.eslintignore`:**
```
node_modules
build
dist
```

**New (in `eslint.config.js`):**
```javascript
{
    ignores: ['node_modules/**', 'build/**', 'dist/**']
}
```

#### 5. Remove Old Config Files

After migrating, remove these files:
- `.eslintrc.js` (or `.eslintrc`, `.eslintrc.json`, etc.)
- `.eslintignore`
- Any `eslintConfig` entries in `package.json`

## Committing
This project uses [semantic release](https://github.com/semantic-release/semantic-release)
to ensure version bumps follow semver so that projects using the config don't
break unexpectedly.

In order to automatically determine the type of version bump necessary, semantic
release expects commit messages to be formatted following
[conventional-changelog](https://github.com/bcoe/conventional-changelog-standard/blob/master/convention.md).
```
<type>(<scope>): <subject>
<BLANK LINE>
<body>
<BLANK LINE>
<footer>
```

`subject` and `body` are your familiar commit subject and body. `footer` is
where you would include `BREAKING CHANGE` and `ISSUES FIXED` sections if
applicable.

`type` is one of:
* `fix`: A bug fix **Causes a patch release (0.0.x)**
* `feat`: A new feature **Causes a minor release (0.x.0)**
* `docs`: Documentation only changes
* `style`: Changes that do not affect the meaning of the code (white-space, formatting, missing semi-colons, etc)
* `refactor`: A code change that neither fixes a bug nor adds a feature
* `perf`: A code change that improves performance **May or may not cause a minor release. It's not clear.**
* `test`: Adding missing tests or correcting existing tests
* `ci`: Changes to our CI configuration files and scripts (example scopes: Travis, Circle, BrowserStack, SauceLabs)
* `chore`: Other changes that don't modify src or test files
* `revert`: Reverts a previous commit

Use the [commitizen CLI](https://github.com/commitizen/cz-cli) to make commits
formatted in this way:

```bash
npm install -g commitizen
npm install
```

Now you're ready to make commits using `git cz`.

## Breaking changes
If you're committing a change that makes the linter more strict, or will
otherwise require changes to existing code, ensure your commit specifies a
breaking change.  In your commit body, prefix the changes with "BREAKING CHANGE: "
This will cause a major version bump so downstream projects must choose to upgrade
the config and will not break the build unexpectedly.
