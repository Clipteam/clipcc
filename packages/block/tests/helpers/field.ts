/**
 * @license
 * Copyright 2025 Clip Team
 * SPDX-License-Identifier: Apache-2.0
 */

import * as Blockly from 'blockly';
import type {Constructor} from './type_traits';
import type {FieldAngle} from '../../src/fields/angle';

interface FieldTestCase<T extends Constructor<Blockly.Field>> {
  title: string;
  checkThrow?: boolean;
  expectedValue: ReturnType<InstanceType<T>['getValue']>;
  expectedText?: ReturnType<InstanceType<T>['getText']>;
}

export interface ConstructorTestCase<T extends Constructor<Blockly.Field>> extends FieldTestCase<T> {
  args: ConstructorParameters<T>;
}

export interface FromJsonTestCase<T extends Constructor<Blockly.Field>, C extends Blockly.FieldConfig> extends FieldTestCase<T> {
  config: C;
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
  const assertion: typeof assertionCallback = (instance, testCase) => {
    if (assertionCallback) {
      assertionCallback(instance, testCase);
    } else {
      expect(instance.getValue()).toStrictEqual(testCase.expectedValue);
      expect(instance.getText()).toStrictEqual(
        testCase.expectedText === undefined ? String(testCase.expectedValue) : testCase.expectedText
      );
    }
  };

  describe('Constructor', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        if (testCase.checkThrow) {
          expect(() => new FieldClass(...testCase.args)).toThrow();
        } else {
          assertion(new FieldClass(...testCase.args), testCase);
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
  const assertion: typeof assertionCallback = (instance, testCase) => {
    if (assertionCallback) {
      assertionCallback(instance, testCase);
    } else {
      expect(instance.getValue()).toStrictEqual(testCase.expectedValue);
      expect(instance.getText()).toStrictEqual(
        testCase.expectedText === undefined ? String(testCase.expectedValue) : testCase.expectedText
      );
    }
  };

  describe('fromJson', () => {
    for (const testCase of testCases) {
      test(testCase.title, () => {
        if (testCase.checkThrow) {
          expect(() => (FieldClass as any).fromJson(testCase.config)).toThrow();
        } else {
          assertion((FieldClass as any).fromJson(testCase.config), testCase);
        }
      });
    }
  });
}
