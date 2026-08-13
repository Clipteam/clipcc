import React from 'react';
import packageJSON from '../../../../package.json';

import logo from '../../../common/icon/app.svg';
import styles from './about.css';

const runtimeVersions = window.desktop?.getRuntimeVersions() ?? {};

const AboutElement = () => (
    <div className={styles.aboutBox}>
        <div><img
            alt={`${packageJSON.productName} icon`}
            src={logo}
            className={styles.aboutLogo}
        /></div>
        <div className={styles.aboutText}>
            <h2>{packageJSON.productName}</h2>
            Version {packageJSON.version}
            <table className={styles.aboutDetails}><tbody>
                {
                    ['Electron', 'Chrome', 'Node'].map(component => {
                        const versionKey = component.toLowerCase() as keyof typeof runtimeVersions;
                        const componentVersion = runtimeVersions[versionKey] ?? 'Unknown';
                        return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                    })
                }
            </tbody></table>
        </div>
    </div>
);

export default <AboutElement />;
