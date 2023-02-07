import React from 'react';
import PropTypes from 'prop-types';
import bindAll from 'lodash.bindall';
import classNames from 'classnames';

import styles from './switch.css';

class Switch extends React.Component {
    constructor (props) {
        super(props);
        bindAll(this, [
            'handleClick',
            'handleKeyDown'
        ]);
    }
    handleClick () {
        if (this.props.disabled) {
            return;
        }
        this.props.onChange(!this.props.value);
    }
    handleKeyDown (event) {
        if (event.key === 'Enter') {
            this.props.onChange(!this.props.value);
            event.stopPropagation();
        }
    }
    render () {
        return (
            <div
                className={classNames(
                    styles.switch,
                    this.props.value ? styles.true : styles.false,
                    this.props.disabled ? styles.disabled : null
                )}
                onClick={this.handleClick}
                onKeyDown={this.handleKeyDown}
            >
                <div
                    className={classNames(
                        styles.slider,
                        this.props.value ? styles.true : styles.false,
                        this.props.disabled ? styles.disabled : null
                    )}
                />
                <input
                    className={styles.dummyInput}
                    inputMode="none"
                />
            </div>
        );
    }
}

Switch.propTypes = {
    value: PropTypes.bool,
    disabled: PropTypes.bool,
    onChange: PropTypes.func.isRequired
};

Switch.defaultProps = {
    value: false,
    disabled: false
};

export default Switch;
