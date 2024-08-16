import React from 'react';
import PropTypes from 'prop-types';
import ToolSelectComponent from '../tool-select-base/tool-select-base.jsx';
import messages from '../../lib/messages.js';
import boolOptIcon from './boolean-operation.svg';

const BoolOptModeComponent = props => (
    <ToolSelectComponent
        imgDescriptor={messages.boolOpt}
        imgSrc={boolOptIcon}
        isSelected={props.isSelected}
        onMouseDown={props.onMouseDown}
    />
);

BoolOptModeComponent.propTypes = {
    isSelected: PropTypes.bool.isRequired,
    onMouseDown: PropTypes.func.isRequired
};

export default BoolOptModeComponent;
