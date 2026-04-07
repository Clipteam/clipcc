import React from 'react';

import styles from './label.css';

interface LabelProps {
    above?: boolean;
    children?: React.ReactNode;
    secondary?: boolean;
    text: React.ReactNode;
}

const Label = ({
    above = false,
    children,
    secondary = false,
    text
}: LabelProps) => (
    <label className={above ? styles.inputGroupColumn : styles.inputGroup}>
        <span className={secondary ? styles.inputLabelSecondary : styles.inputLabel}>
            {text}
        </span>
        {children}
    </label>
);

export default Label;
