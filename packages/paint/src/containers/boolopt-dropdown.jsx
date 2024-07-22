import paper from '@scratch/paper';
import {connect} from 'react-redux';
import bindAll from 'lodash.bindall';
import PropTypes from 'prop-types';
import React from 'react';

import BoolOptDropdownComponent from '../components/boolopt-dropdown/boolopt-dropdown.jsx';
import {changeBoolOptMode} from '../reducers/boolopt-mode';
import styles from '../components/boolopt-dropdown/boolopt-dropdown.css';

class BoolOptDropdown extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleChangeUnite',
            'handleChangeIntersect',
            'handleChangeSubtract',
            'handleChangeExclude',
            'handleChangeDivide',
            'handleClickOutsideDropdown',
            'setDropdown'
        ]);
    }
    handleChangeUnite () {
        if (this.dropDown.isOpen()) {
            this.props.changeMode('unite');
            this.dropDown.handleClosePopover();
        }
    }
    handleChangeIntersect () {
        if (this.dropDown.isOpen()) {
            this.props.changeMode('intersect');
            this.dropDown.handleClosePopover();
        }
    }
    handleChangeSubtract () {
        if (this.dropDown.isOpen()) {
            this.props.changeMode('subtract');
            this.dropDown.handleClosePopover();
        }
    }
    handleChangeExclude () {
        if (this.dropDown.isOpen()) {
            this.props.changeMode('exclude');
            this.dropDown.handleClosePopover();
        }
    }
    handleChangeDivide () {
        if (this.dropDown.isOpen()) {
            this.props.changeMode('divide');
            this.dropDown.handleClosePopover();
        }
    }
    handleClickOutsideDropdown (e) {
        e.stopPropagation();
        this.dropDown.handleClosePopover();
    }
    setDropdown (element) {
        this.dropDown = element;
    }
    render () {
        return (
            <BoolOptDropdownComponent
                componentRef={this.setDropdown}
                mode={this.props.mode}
                onClickOutsideDropdown={this.handleClickOutsideDropdown}
                onChooseUnite={this.handleChangeUnite}
                onChooseIntersect={this.handleChangeIntersect}
                onChooseSubtract={this.handleChangeSubtract}
                onChooseExclude={this.handleChangeExclude}
                onChooseDivide={this.handleChangeDivide}
            />
        );
    }
}

BoolOptDropdown.propTypes = {
    changeMode: PropTypes.func.isRequired,
    mode: PropTypes.string
};

const mapStateToProps = state => ({
    mode: state.scratchPaint.booloptMode
});
const mapDispatchToProps = dispatch => ({
    changeMode: mode => {
        dispatch(changeBoolOptMode(mode));
    }
});

export default connect(
    mapStateToProps,
    mapDispatchToProps
)(BoolOptDropdown);
