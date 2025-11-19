/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import {describe, expect, test, beforeAll, beforeEach, afterAll, afterEach} from 'vitest';
import * as Blockly from 'blockly/core';
import type {Constructor} from './type_traits';
import {defineTestBlockInput} from './block';

export interface FieldTestContext {
  workspace: Blockly.Workspace;
  block: Blockly.Block;
}

export interface FieldTestCase<T extends Constructor<Blockly.Field>> {
  title: string;
  checkThrow?: boolean;
  invalid?: boolean;
  expectedValue: ReturnType<InstanceType<T>['getValue']>;
  expectedText?: ReturnType<InstanceType<T>['getText']>;
}

export interface ConstructorTestCase<T extends Constructor<Blockly.Field>> extends FieldTestCase<T> {
  args: ConstructorParameters<T>;
}

export interface FromJsonTestCase<T extends Constructor<Blockly.Field>, C extends Blockly.FieldConfig>
  extends FieldTestCase<T> {
  config: C;
}

export interface SetValueTestCase<T extends Constructor<Blockly.Field>> extends FieldTestCase<T> {
  ctorArgs?: ConstructorParameters<T>;
  value: Parameters<InstanceType<T>['setValue']>[0];
}

export interface ValidatorTestCase<T extends Constructor<Blockly.Field>, V extends Blockly.FieldValidator>
  extends SetValueTestCase<T> {
  validator: V;
}

/**
 * Assert the test case.
 * @param instance The field instance.
 * @param testCase Current test case.
 * @param assertionCallback Custom function for assertion.
 */
function assertion<T extends Constructor<Blockly.Field>>(
  instance: InstanceType<T>,
  testCase: FieldTestCase<T>,
  assertionCallback?: (
    instance: InstanceType<T>,
    testCase: FieldTestCase<T>
  ) => void
) {
  if (assertionCallback) {
    assertionCallback(instance, testCase);
  } else {
    expect(instance.getValue()).toStrictEqual(testCase.expectedValue);
    expect(instance.getText()).toStrictEqual(
      testCase.expectedText === undefined ? String(testCase.expectedValue) : testCase.expectedText
    );
  }
}

/**
 * Runs test suite for constructor for the specified field.
 * @param FieldClass The class of the field to be tested.
 * @param testCases Test cases for given field.
 * @param assertionCallback Custom function for assertion.
 */
export function runConstructorTests<T extends Blockly.Field>(
  FieldClass: Constructor<T>,
  testCases: ConstructorTestCase<typeof FieldClass>[],
  assertionCallback?: (
    instance: InstanceType<typeof FieldClass>,
    testCase: FieldTestCase<typeof FieldClass>
  ) => void
) {
  describe('Constructor', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        if (testCase.checkThrow) {
          expect(() => new FieldClass(...testCase.args)).toThrow();
        } else {
          assertion(new FieldClass(...testCase.args), testCase, assertionCallback);
        }
      });
    }
  });
}

/**
 * Runs test suite for fromJson for the specified field.
 * @param FieldClass The class of the field to be tested.
 * @param testCases Test cases for given field.
 * @param assertionCallback Custom function for assertion.
 */
export function runFromJsonTests<ConfigType extends Blockly.FieldConfig, T extends Blockly.Field>(
  FieldClass: Constructor<T>,
  testCases: FromJsonTestCase<typeof FieldClass, ConfigType>[],
  assertionCallback?: (
    instance: InstanceType<typeof FieldClass>,
    testCase: FieldTestCase<typeof FieldClass>
  ) => void
) {
  describe('fromJson', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        if (testCase.checkThrow) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          expect(() => (FieldClass as any).fromJson(testCase.config)).toThrow();
        } else {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          assertion((FieldClass as any).fromJson(testCase.config), testCase, assertionCallback);
        }
      });
    }
  });
}

/**
 * Runs test suite for setValue for the specified field.
 * @param FieldClass The class of the field to be tested.
 * @param testCases Test cases for given field.
 * @param assertionCallback Custom function for assertion.
 */
export function runSetValueTests<T extends Blockly.Field>(
  FieldClass: Constructor<T>,
  testCases: SetValueTestCase<typeof FieldClass>[],
  assertionCallback?: (
    instance: InstanceType<typeof FieldClass>,
    testCase: FieldTestCase<typeof FieldClass>
  ) => void
) {
  describe('setValue', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        const field = testCase.ctorArgs ? new FieldClass(...testCase.ctorArgs) : new FieldClass();
        field.setValue(testCase.value);
        assertion(field, testCase, assertionCallback);
      });
    }
  });
}

/**
 * Runs test suite for validator for the specified field.
 * @param FieldClass The class of the field to be tested.
 * @param testCases Test cases for given field.
 * @param assertionCallback Custom function for assertion.
 */
export function runValidatorTests<V extends Blockly.FieldValidator, T extends Blockly.Field>(
  FieldClass: Constructor<T>,
  testCases: ValidatorTestCase<typeof FieldClass, V>[],
  assertionCallback?: (
    instance: InstanceType<typeof FieldClass>,
    testCase: FieldTestCase<typeof FieldClass>
  ) => void
) {
  describe('Validators', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        const field = testCase.ctorArgs ? new FieldClass(...testCase.ctorArgs) : new FieldClass();
        field.setValidator(testCase.validator);
        field.setValue(testCase.value);
        assertion(field, testCase, assertionCallback);
      });
    }
  });
}

/**
 * Setup the context of serialization test.
 * @param FieldClass The class of the field to be tested.
 * @param name The field name.
 * @param ctorArgs Arguments for constructor.
 * @returns Context for testing.
 */
export function setupSerializationTests<T extends Constructor<Blockly.Field>>(
  FieldClass: T,
  name: string,
  ctorArgs?: ConstructorParameters<T>
) {
  const context: FieldTestContext = {} as FieldTestContext;

  beforeAll(() => {
    Blockly.Events.disable();
    context.workspace = new Blockly.Workspace();
    defineTestBlockInput();
  });

  beforeEach(() => {
    context.block = context.workspace.newBlock('test_block_input');
    const field = ctorArgs ? new FieldClass(...ctorArgs) : new FieldClass();
    context.block.getInput('INPUT')?.appendField(field, name);
  });

  afterEach(() => {
    context.block.dispose();
  });

  afterAll(() => {
    context.workspace.dispose();
  });

  return context;
}
