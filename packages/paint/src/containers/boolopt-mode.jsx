import paper from '@scratch/paper';
import PropTypes from 'prop-types';
import React from 'react';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import Modes from '../lib/modes';

import {changeMode} from '../reducers/modes';
import {clearSelectedItems, setSelectedItems} from '../reducers/selected-items';
import {getSelectedLeafItems} from '../helper/selection';
import {setCursor} from '../reducers/cursor';

import BoolOptTool from '../helper/tools/boolopt-tool';
import BoolOptModeComponent from '../components/boolopt-mode/boolopt-mode.jsx';

class BoolOptMode extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'activateTool',
            'deactivateTool'
        ]);
    }
    componentDidMount () {
        if (this.props.isBoolOptModeActive) {
            this.activateTool(this.props);
        }
    }
    componentWillReceiveProps (nextProps) {
        if (nextProps.isBoolOptModeActive && !this.props.isBoolOptModeActive) {
            this.activateTool();
        } else if (!nextProps.isBoolOptModeActive && this.props.isBoolOptModeActive) {
            this.deactivateTool();
        }
        if (nextProps.selectedItems !== this.props.selectedItems && this.tool) {
            this.tool.onSelectionChanged(nextProps.selectedItems);
        }
        if (nextProps.boolOptMode !== this.props.boolOptMode && this.tool) {
            this.tool.setOperation(nextProps.boolOptMode);
        }
    }
    shouldComponentUpdate (nextProps) {
        return nextProps.isBoolOptModeActive !== this.props.isBoolOptModeActive ||
            nextProps.boolOptMode !== this.props.boolOptMode;
    }
    componentWillUnmount () {
        if (this.tool) {
            this.deactivateTool();
        }
    }
    activateTool () {
        this.tool = new BoolOptTool(
            this.props.setSelectedItems,
            this.props.clearSelectedItems,
            this.props.setCursor,
            this.props.onUpdateImage,
            this.props.boolOptMode
        );
        this.tool.activate();
    }
    deactivateTool () {
        this.tool.deactivateTool();
        this.tool.remove();
        this.tool = null;
    }
    render () {
        return (
            <BoolOptModeComponent
                isSelected={this.props.isBoolOptModeActive}
                onMouseDown={this.props.handleMouseDown}
            />
        );
    }
}

BoolOptMode.propTypes = {
    clearSelectedItems: PropTypes.func.isRequired,
    handleMouseDown: PropTypes.func.isRequired,
    boolOptMode: PropTypes.string,
    isBoolOptModeActive: PropTypes.bool.isRequired,
    onUpdateImage: PropTypes.func.isRequired,
    selectedItems: PropTypes.arrayOf(PropTypes.instanceOf(paper.Item)),
    setCursor: PropTypes.func.isRequired,
    setSelectedItems: PropTypes.func.isRequired
};

const mapStateToProps = state => ({
    isBoolOptModeActive: state.scratchPaint.mode === Modes.BOOLOPT,
    boolOptMode: state.scratchPaint.booloptMode,
    selectedItems: state.scratchPaint.selectedItems
});
const mapDispatchToProps = dispatch => ({
    setCursor: cursorString => {
        dispatch(setCursor(cursorString));
    },
    setSelectedItems: () => {
        dispatch(setSelectedItems(getSelectedLeafItems(), false /* bitmapMode */));
    },
    clearSelectedItems: () => {
        dispatch(clearSelectedItems());
    },
    handleMouseDown: () => {
        dispatch(changeMode(Modes.BOOLOPT));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BoolOptMode);
