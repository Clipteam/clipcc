/**
 * @license
 * Blockly Tests
 *
 * Copyright 2024 Clip Team
 * https://developers.google.com/blockly/
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

/**
 * @fileoverview A jest test runner that mimics the behaviour of goog.testing.junit
 * @author cuizhihui030925@outlook.com (Alex Cui)
 */
'use strict';


/**
 * Setup browser-jest
 */
/* eslint-disable no-unused-vars */
const {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  fdescribe,
  xdescribe,
  it,
  test,
  fit,
  xtest,
  xit,
  expect,
  jest,
  run,
} = window.browserJest;
/* eslint-enable no-unused-vars */

/**
 * Discover all test methods with prefix 'test' on the window object.
 */
const allMethods = Object.getOwnPropertyNames(window);
const allTests = [];
for (const method of allMethods) {
  if (method.startsWith('test') && method !== 'test' && typeof window[method] === 'function') {
    allTests.push(method);
  }
}

/**
 * Split tests to various scopes according to its name prefix.
 */
const scopes = {};
for (const method of allTests) {
  let name = method.substring(5);
  if (!method.startsWith('test_')) {
    // name with format 'testXxx', e.g. connection_test.js
    name = method.substring(4);
  }
  const underscore = name.indexOf('_');
  const suiteName = underscore > -1 ? name.substring(0, underscore) : 'test';
  if (!Object.hasOwnProperty.call(scopes, suiteName)) {
    scopes[suiteName] = [];
  }
  scopes[suiteName].push(method);
}

/**
 * Wrap all unit tests into jest test cases.
 */
describe('jsunit tests', function() {
  for (const scope in scopes) {
    describe(scope, function() {
      for (const method of scopes[scope]) {
        test(method, function() {
          window[method]();
        });
      }
    });
  }
});

/**
 * Create elements for showing results.
 */
const report = document.createElement('div');
report.setAttribute('id', 'test-report');
document.body.appendChild(report);

/**
 * Run tests.
 */
run().then(result => {
  console.log(result);

  let passed = 0;
  let failed = 0;

  for (const testResult of result.testResults) {
    const reportItem = document.createElement('div');
    let status;
    if (testResult.errors.length > 0) {
      status = 'failed';
      ++failed;
    } else {
      status = 'passed';
      ++passed;
    }

    reportItem.innerHTML = `<p>[${status}] ${testResult.testPath[testResult.testPath.length - 1]}</p>`;
    for (const error of testResult.errors) {
      reportItem.innerHTML += `<p style="margin-top: none;"><pre>${error}</pre></p>`;
    }
    report.appendChild(reportItem);
  }

  const endItem = document.createElement('p');
  endItem.setAttribute('id', 'test-results');
  endItem.innerHTML = `<p>${passed} passed, ${failed} failed, ${passed + failed} total</p>`;
  report.appendChild(endItem);
});
