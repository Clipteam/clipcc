import React from 'react';
import classNames from 'classnames';

import styles from './input.css';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    small?: boolean;
}

const Input = ({small = false, className, ...componentProps}: InputProps) => (
    <input
        {...componentProps}
        className={classNames(
            styles.inputForm,
            className,
            {
                [styles.inputSmall]: small
            }
        )}
    />
);

export default Input;
