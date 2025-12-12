#!/usr/bin/env node

/**
 * @license
 * Copyright 2013 Google LLC
 * SPDX-License-Identifier: Apache-2.0
 */

/**
 * Extracts messages from .js files into .json files for translation.
 * Specifically, lines with the following formats are extracted:
 *
 *    /// Here is a description of the following message.
 *    Blockly.SOME_KEY = 'Some value';
 *
 *    Blockly.ANOTHER_KEY = Blockly.SOME_KEY;
 *
 *    /// {{Notranslate}} Constants
 *    Blockly.CONSTANT = '20';
 *
 * Adjacent "///" lines are concatenated.
 *
 * For each key, the file en.json would get an entry of the form:
 *
 *    "Blockly.SOME_KEY": "Some value"
 *
 * The file constants.json will get:
 *
 *    "Blockly.CONSTANT": "20"
 *
 * The file synonyms.json will get:
 *
 *    "Blockly.ANOTHER_KEY": "Blockly.SOME_KEY"
 */

const fs = require('node:fs');
const path = require('node:path');
const util = require('node:util');

/** @type {util.ParseArgsConfig} */
const option = {
  args: process.argv.slice(2),
  options: {
    lang: {
      type: 'string',
      default: 'en'
    },
    input_file: {
      type: 'string',
      default: 'messages.js'
    },
    output_dir: {
      type: 'string',
      default: 'json'
    },
    quiet: {
      type: 'boolean',
      default: false
    },
    help: {
      type: 'boolean',
      default: false
    }
  },
  allowPositionals: false,
  allowNegative: true
};

const HELP_MESSAGE = `
Usage: build-i18n-src.js [options]

Options:
  --lang <code>         ISO 639-1 source language code, defaults to 'en'.
  --input_file <path>   Input file, defaults to 'messages.js'.
  --output_dir <path>   Relative directory for output files, defaults to 'json'.
  --quiet               Only display warnings, not routine info.

  --help                Display this information.
`;

const INPUT_DEF_PATTERN = /^Blockly\.Msg\.(\w*)\s*=\s*'(.*)';$/;
const INPUT_SYN_PATTERN = /^Blockly\.Msg\.(\w*)\s*=\s*Blockly\.Msg\.(\w*);$/;
const CONST_DESC_PATTERN = /{{Notranslate}}/i;

/**
 * Parse string from JavaScript source.
 * @param {string} str String to parse.
 * @returns {string} The parsed string.
 */
function parseString(str) {
  return JSON.parse(`"${str.replace(/(?<=[^\\])"/g, '\\"').replace(/\\'/g, '\'')}"`);
}

try {
  const {values} = util.parseArgs(option);
  if (values.help) {
    console.log(HELP_MESSAGE);
    process.exit(0);
  }

  // Read and parse input file.
  const results = {};
  const synonyms = {};
  const constants = {}; // Values that are constant across all languages.
  let description = '';
  let warningCount = 0;

  const buffer = fs.readFileSync(values.input_file, {encoding: 'utf-8'});
  for (const line of buffer.split('\n')) {
    if (line.startsWith('///')) {
      if (description) {
        description += ' ' + line.substring(3).trim();
      } else {
        description = line.substring(3).trim();
      }
    } else {
      const match = line.match(INPUT_DEF_PATTERN);
      if (match) {
        const key = match[1];
        const message = parseString(match[2]);

        if (!description) {
          console.warn(`Warning: No description for ${key}`);
          ++warningCount;
        }

        if (description && description.search(CONST_DESC_PATTERN) !== -1) {
          constants[key] = message;
        } else {
          results[key] = {
            message,
            description
          };
        }

        description = '';
      } else {
        const match = line.match(INPUT_SYN_PATTERN);
        if (match) {
          if (description) {
            console.log(`Warning: Description preceding definition of synonym ${match.groups[1]}`);
            description = '';
            ++warningCount;
          }
          synonyms[match[1]] = match[2];
        }
      }
    }
  }

  // Create <lang>.json
  const langFilename = path.join(process.cwd(), values.output_dir, `${values.lang}.json`);
  fs.writeFileSync(langFilename, JSON.stringify(results, null, 2));
  if (!values.quiet) {
    console.log(`Wrote ${Object.keys(results).length} synonym pairs to ${langFilename}.`);
  }

  // Create synonyms.json.
  const synonymsFilename = path.join(process.cwd(), values.output_dir, 'synonyms.json');
  fs.writeFileSync(synonymsFilename, JSON.stringify(synonyms, null, 2));
  if (!values.quiet) {
    console.log(`Wrote ${Object.keys(synonyms).length} synonym pairs to ${synonymsFilename}.`);
  }

  // Create constants.json.
  const constantsFilename = path.join(process.cwd(), values.output_dir, 'constants.json');
  fs.writeFileSync(constantsFilename, JSON.stringify(constants, null, 2));
  if (!values.quiet) {
    console.log(`Wrote ${Object.keys(constants).length} constant pairs to ${constantsFilename}.`);
  }

  console.log(`Finished with ${warningCount} warning(s).`);
} catch (error) {
  console.error(error);
  console.log(HELP_MESSAGE);
  process.exit(0);
}
