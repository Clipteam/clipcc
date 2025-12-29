import React from 'react';
import { render } from '@testing-library/react';
import Monitor from '../../../src/components/monitor/monitor';
import { DARK_THEME, DEFAULT_THEME } from '../../../src/lib/themes';

jest.mock('../../../src/lib/themes/default');
jest.mock('../../../src/lib/themes/dark');

describe('Monitor Component', () => {
    const noop = jest.fn();

    const defaultProps = {
        category: "motion",
        // eslint-disable-next-line react/jsx-no-bind
        componentRef: noop ,
        draggable: false,
        label: "My label",
        mode: "default",
        // eslint-disable-next-line react/jsx-no-bind
        onDragEnd: noop ,
        // eslint-disable-next-line react/jsx-no-bind
        onNextMode: noop
    };

    test('it selects the correct colors based on default theme', () => {
        const { container } = render(<Monitor
            {...defaultProps}
            theme={DEFAULT_THEME}
        />);

        expect(container.firstChild).toMatchSnapshot();
    });

    test('it selects the correct colors based on dark mode theme', () => {
        const { container } = render(<Monitor
            {...defaultProps}
            theme={DARK_THEME}
        />);

        expect(container.firstChild).toMatchSnapshot();
    });
});
