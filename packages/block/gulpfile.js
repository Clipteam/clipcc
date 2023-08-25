/**
 * @license
 * Copyright 2023 Clip Team
 * SPDX-License-Identifier: AGPL-3.0-or-later
 */

/**
 * @fileoverview Gulp script to build Blockly.
 */

const gulp = require('gulp');
gulp.replace = require('gulp-replace');
gulp.rename = require('gulp-rename');
const glob = require('glob');
const fs = require('fs');
const argv = require('yargs').argv;
const closureCompiler = require('google-closure-compiler').gulp();
const closureDeps = require('google-closure-deps');

const LICENSE_REGEX = new RegExp(`/\\*

 [\\w ]+

 Copyright \\d+ (Google Inc.|Massachusetts Institute of Technology)
 (https://developers.google.com/blockly/|All rights reserved.)

 Licensed under the Apache License, Version 2.0 \\(the "License"\\);
 you may not use this file except in compliance with the License.
 You may obtain a copy of the License at

   http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
\\*/`, 'g');

/**
 * Helper for trimming down Apache License. (only Google's and MIT's)
 */
function trimLicense() {
    return gulp.replace(LICENSE_REGEX, '');
}

/**
 * Helper for remove Blockly.Blocks to be compatible with Blockly.
 */
function removeBlocklyBlocks() {
    return gulp.replace('var Blockly={Blocks:{}};', '');
}

/**
 * Closure Compiler diagnostic groups we want to be treated as errors.
 * These are effected when the --debug or --strict flags are passed.
 * For a full list of Closure Compiler groups, look in the source here:
 * https://github.com/google/closure-compiler/blob/master/src/com/google/javascript/jscomp/DiagnosticGroups.java#L117
 */
const JSCOMP_ERROR = [
    'checkDebuggerStatement',
    'checkPrototypalTypes',
    'checkRegExp',
    // 'checkTypes', // Disabled
    // 'checkVars', // Warning, needs to be fixed
    'conformanceViolations',
    'const',
    'constantProperty',
    'deprecated',
    'deprecatedAnnotations',
    'duplicateMessage',
    'es5Strict',
    'externsValidation',
    // 'extraRequire', // Warning
    'functionParams',
    'globalThis',
    'invalidCasts',
    'misplacedTypeAnnotation',
    'missingOverride',
    'missingPolyfill',
    'missingProperties',
    'missingProvide',
    // 'missingRequire', // Warning, needs to be fixed
    'missingReturn',
    // 'missingSourcesWarnings', // Warning
    'moduleLoad',
    'moduleImport',
    'msgDescriptions',
    // 'nonStandardJsDocs', // Warning
    'partialAlias',
    // 'reportUnknownTypes', // Disabled
    // 'strictCheckTypes', // --strict
    // 'strictMissingProperties', // --strict
    'strictModuleChecks',
    'strictModuleDepCheck',
    // 'strictPrimitiveOperators', // --strict
    'suspiciousCode',
    'typeInvalidation',
    'undefinedVars',
    'underscore',
    'unknownDefines',
    'unusedLocalVariables',
    'unusedPrivateMembers',
    'uselessCode',
    'untranspilableFeatures',
    'visibility'
];

/**
 * Closure Compiler diagnostic groups we want to be treated as warnings.
 * These are effected when the --debug or --strict flags are passed.
 */
const JSCOMP_WARNING = [
    'checkVars',
    'extraRequire',
    'missingRequire',
    'missingSourcesWarnings',
    'nonStandardJsDocs'
];

/**
 * Closure Compiler diagnostic groups we want to be ignored. These
 * suppressions are always effected by default.
 */
const JSCOMP_OFF = [
    'checkTypes',
    'reportUnknownTypes'
];

/**
 * Helper for calling closure compiler.
 * @param {Object=} compilerOptions Additional options for closure compiler.
 * @param {boolean=} debug Whether compile in debug mode.
 * @param {boolean=} strict Whether compile in strict mode.
 */
function compile(compilerOptions, debug, strict) {
    const options = {
        compilation_level: 'SIMPLE',
        warning_level: (debug || strict) ? 'VERBOSE' : 'DEFAULT',
        language_in: 'ECMASCRIPT_2017',
        language_out: 'ECMASCRIPT5_STRICT',
        hide_warnings_for: 'node_modules',
        jscomp_off: [...JSCOMP_OFF]
    };

    if (debug || strict) {
        options.jscomp_error = [...JSCOMP_ERROR];
        options.jscomp_warning = [...JSCOMP_WARNING];
        if (strict) {
            options.jscomp_error.push(
                'strictCheckTypes',
                'strictMissingProperties',
                'strictPrimitiveOperators'
            );
        }
    }

    return closureCompiler({...options, ...compilerOptions});
}

/**
 * Task for building blockly_compressed_vertical.js.
 */
function buildCompressedBlockly() {
    return gulp.src([
        './core/**/**/*.js',
        '!./core/block_render_svg_horizontal.js',
        './node_modules/google-closure-library/closure/goog/**/**/*.js',
        './node_modules/google-closure-library/third_party/closure/goog/**/**/*.js'
    ], {base: './'})
        .pipe(compile({
            dependency_mode: 'PRUNE',
            entry_point: './core/blockly.js',
            rewrite_polyfills: false,
            define: 'goog.DEBUG=false'
        }, argv.debug, argv.strict))
        .pipe(trimLicense())
        .pipe(gulp.rename('blockly_compressed_vertical.js'))
        .pipe(gulp.dest('./'));
}

/**
 * Task for building blocks_compressed_vertical.js.
 */
function buildCompressedBlock() {
    return gulp.src([
        './blocks_vertical/*.js',
        './build/gen_blocks.js',
        './core/colours.js',
        './core/constants.js'
    ], {base: './'})
        .pipe(compile({}, argv.debug, argv.strict))
        .pipe(trimLicense())
        .pipe(removeBlocklyBlocks())
        .pipe(gulp.rename('blocks_compressed_vertical.js'))
        .pipe(gulp.dest('./'));
}

/**
 * Task for building blocks_compressed.js
 */
function buildCompressedCommonBlock() {
    return gulp.src([
        './blocks_common/*.js',
        './build/gen_blocks.js',
        './core/colours.js',
        './core/constants.js'
    ], {base: './'})
        .pipe(compile({}, argv.debug, argv.strict))
        .pipe(trimLicense())
        .pipe(removeBlocklyBlocks())
        .pipe(gulp.rename('blocks_compressed.js'))
        .pipe(gulp.dest('./'));
}

const CLOSURE_LIBRARY = 'node_modules/google-closure-library/closure/goog';
const UNCOMPRESSED_HEADER = `'use strict';

var isNodeJS = !!(typeof module !== 'undefined' && module.exports &&
                  typeof window === 'undefined');

if (isNodeJS) {
  var window = {};
  require('google-closure-library');
}

window.BLOCKLY_DIR = (function() {
  if (!isNodeJS) {
    // Find name of current directory.
    var scripts = document.getElementsByTagName('script');
    var re = new RegExp('(.+)[\/]blockly_uncompressed(_vertical|_horizontal|)\.js$');
    for (var i = 0, script; script = scripts[i]; i++) {
      var match = re.exec(script.src);
      if (match) {
        return match[1];
      }
    }
    alert('Could not detect Blockly\\'s directory name.');
  }
  return '';
})();

window.BLOCKLY_BOOT = function() {
  var dir = '';
  if (isNodeJS) {
    require('google-closure-library');
    dir = 'blockly';
  } else {
    // Execute after Closure has loaded.
    if (!window.goog) {
      alert('Error: Closure not found.  Read this:\\n' +
            'developers.google.com/blockly/guides/modify/web/closure');
    }
    if (window.BLOCKLY_DIR.search(/node_modules/)) {
      dir = '..';
    } else {
      dir = window.BLOCKLY_DIR.match(/[^\\/]+$/)[0];
    }
  }
`;
const UNCOMPRESSED_FOOTER = `
delete this.BLOCKLY_DIR;
delete this.BLOCKLY_BOOT;
};

if (isNodeJS) {
  window.BLOCKLY_BOOT();
  module.exports = Blockly;
} else {
  // Delete any existing Closure (e.g. Soy's nogoog_shim).
  document.write('<script>var goog = undefined;</script>');
  // Set defines.
  document.write('<script>window.CLOSURE_UNCOMPILED_DEFINES = { \\'goog.ENABLE_DEBUG_LOADER\\': true };</script>');
  // Load fresh Closure Library.
  document.write('<script src="' + window.BLOCKLY_DIR +
      '/${CLOSURE_LIBRARY}/base.js"></script>');
  document.write('<script>window.BLOCKLY_BOOT();</script>');
}
`;

/**
 * Task for building blockly_uncompressed_vertical.js.
 */
function buildUncompressed(callback) {
    const files = glob.globSync([
        './core/**/**/*.js',
        './node_modules/google-closure-library/closure/goog/**/**/*.js',
        './node_modules/google-closure-library/third_party/closure/goog/**/**/*.js'
    ], {
        ignore: '**/block_render_svg_horizontal.js'
    });
    const dependencies = [];
    const provides = [];
    for (const file of files) {
        const result = closureDeps.parser.parseFile(file);
        for (const dependency of result.dependencies) {
            // dependencies parsed from goog.addDependency should be ignored
            if (!dependency.isParsedFromDepsFile()) {
                dependency.setClosurePath(CLOSURE_LIBRARY);
                dependencies.push(dependency);
            }
        }
        if (!file.startsWith('node_modules')) {
            for (const dependency of result.dependencies) {
                if (!dependency.isParsedFromDepsFile()) {
                    provides.push(...dependency.closureSymbols);
                }
            }
        }
    }
    const addDependencyCode = closureDeps.depFile.getDepFileText(CLOSURE_LIBRARY, dependencies).replace(/\\/g, '/');
    const requiresCode = '\n// Load Blockly.\n' + provides.sort().map(provide => `goog.require('${provide}');`).join('\n');
    fs.writeFileSync('blockly_uncompressed_vertical.js', UNCOMPRESSED_HEADER + addDependencyCode + requiresCode + UNCOMPRESSED_FOOTER);
    callback();
}

const build = gulp.parallel(
    buildUncompressed,
    buildCompressedBlockly,
    buildCompressedBlock,
    buildCompressedCommonBlock
);

module.exports = {
    build
};
