import React from 'react'; // eslint-disable-line no-unused-vars
import {shallow} from 'enzyme';
import Button from '../../../src/components/button/button.jsx';

describe('Button', () => {
    test('triggers callback when clicked', () => {
        const onClick = jest.fn();
        const componentShallowWrapper = shallow(
            <Button onClick={onClick}>
                {'Button'}
            </Button>
        );
        componentShallowWrapper.simulate('click');
        expect(onClick).toHaveBeenCalled();
    });
});
