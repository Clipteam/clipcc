import React from 'react';
import Monitor from '../../../src/components/monitor/monitor.jsx';
import {render} from '@testing-library/react';

describe('Monitor Component', () => {
    const noop = jest.fn();

    const defaultProps = {
        category: 'motion',

        componentRef: noop,
        draggable: false,
        label: 'My label',
        mode: 'default',

        onDragEnd: noop,

        onNextMode: noop
    };

    test('it selects the correct colors based on default color mode', () => {
        const {container} = render(<Monitor
            {...defaultProps}
        />);

        expect(container.firstChild).toMatchSnapshot();
    });

    test('it selects the correct colors based on dark mode', () => {
        const {container} = render(<Monitor
            {...defaultProps}
        />);

        expect(container.firstChild).toMatchSnapshot();
    });
});
