import React from 'react';
import classNames from 'classnames';
import styles from './loader.css';

import topBlock from './top-block.svg';
import middleBlock from './middle-block.svg';
import bottomBlock from './bottom-block.svg';

export interface ScopedLoaderProps {
    /** The text to display while loading */
    text?: string;
}

export default function ScopedLoaderComponent (props: ScopedLoaderProps) {
    return (
        <div
            className={classNames(styles.background, styles.scopedLoader)}
        >
            <div className={styles.container}>
                <div className={styles.blockAnimation}>
                    <img
                        className={styles.topBlock}
                        src={topBlock}
                    />
                    <img
                        className={styles.middleBlock}
                        src={middleBlock}
                    />
                    <img
                        className={styles.bottomBlock}
                        src={bottomBlock}
                    />
                </div>
                {props.text ? (
                    <div className={styles.title}>
                        {props.text}
                    </div>
                ) : null}
            </div>
        </div>
    );
}
