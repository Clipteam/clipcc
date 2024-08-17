import classNames from 'classnames';
import PropTypes from 'prop-types';
import React from 'react';
import {FormattedMessage, injectIntl} from 'react-intl';

import Button from '../button/button.jsx';
import Dropdown from '../dropdown/dropdown.jsx';
import InputGroup from '../input-group/input-group.jsx';
import styles from './boolopt-dropdown.css';

const ModeToolsComponent = props => (
    <Dropdown
        className={classNames(styles.modUnselect, styles.boolOptDropdown)}
        enterExitTransitionDurationMs={60}
        popoverContent={
            <InputGroup className={styles.modContextMenu}>
                <Button
                    className={classNames(styles.modMenuItem)}
                    onClick={props.onChooseUnite}
                >
                    <FormattedMessage
                        defaultMessage="unite"
                        description="Label for the unite in the boolean operation dropdown"
                        id="paint.boolOptDropdown.unite"
                    />
                </Button>
                <Button
                    className={classNames(styles.modMenuItem)}
                    onClick={props.onChooseIntersect}
                >
                    <FormattedMessage
                        defaultMessage="intersect"
                        description="Label for the intersect in the boolean operation dropdown"
                        id="paint.boolOptDropdown.intersect"
                    />
                </Button>
                <Button
                    className={classNames(styles.modMenuItem)}
                    onClick={props.onChooseSubtract}
                >
                    <FormattedMessage
                        defaultMessage="subtract"
                        description="Label for the subtract in the boolean operation dropdown"
                        id="paint.boolOptDropdown.subtract"
                    />
                </Button>
                <Button
                    className={classNames(styles.modMenuItem)}
                    onClick={props.onChooseExclude}
                >
                    <FormattedMessage
                        defaultMessage="exclude"
                        description="Label for the exclude in the boolean operation dropdown"
                        id="paint.boolOptDropdown.exclude"
                    />
                </Button>
                <Button
                    className={classNames(styles.modMenuItem)}
                    onClick={props.onChooseDivide}
                >
                    <FormattedMessage
                        defaultMessage="divide"
                        description="Label for the divide in the boolean operation dropdown"
                        id="paint.boolOptDropdown.divide"
                    />
                </Button>
            </InputGroup>
        }
        ref={props.componentRef}
        tipSize={.01}
        onOuterAction={props.onClickOutsideDropdown}
    >
        <span>
            {props.mode}
        </span>
    </Dropdown>
);

ModeToolsComponent.propTypes = {
    componentRef: PropTypes.func.isRequired,
    mode: PropTypes.string,
    onChooseUnite: PropTypes.func.isRequired,
    onChooseIntersect: PropTypes.func.isRequired,
    onChooseSubtract: PropTypes.func.isRequired,
    onChooseExclude: PropTypes.func.isRequired,
    onChooseDivide: PropTypes.func.isRequired,
    onClickOutsideDropdown: PropTypes.func
};
export default injectIntl(ModeToolsComponent);
