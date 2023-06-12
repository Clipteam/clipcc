/*
 * Helpers for using enzyme and react-test-renderer with react-intl
 * Directly from https://github.com/yahoo/react-intl/wiki/Testing-with-React-Intl
 */
import React from 'react';
import renderer from 'react-test-renderer';
import {IntlProvider} from 'react-intl';
import intlShape from '../../src/lib/intl-shape.js';
import {mount, shallow} from 'enzyme';

function mountWithIntl (node, {context, childContextTypes} = {}) {
  return mount(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
        locale: 'en'
    },
    context: Object.assign({}, context),
    childContextTypes: Object.assign({}, {intl: intlShape}, childContextTypes)
  });
}

function shallowWithIntl (node, {context} = {}) {
  return shallow(node, {
    wrappingComponent: IntlProvider,
    wrappingComponentProps: {
        locale: 'en'
    },
    context: Object.assign({}, context)
  });
}

// react-test-renderer component for use with snapshot testing
const componentWithIntl = (children, props = {locale: 'en'}) => renderer.create(
    <IntlProvider {...props}>{children}</IntlProvider>
);

export {
    componentWithIntl,
    shallowWithIntl,
    mountWithIntl
};
