import React from 'react';
import {productName} from '../../package.json';


import styles from './about.css';



class AboutElement extends React.Component {
    constructor(prop :unknown) {
        super(prop);
        this.state = {appInfo:null}
    }
    componentDidMount(): void {
        window.apps.getInfo().then(app => this.setState({appInfo: app}))
    }
    render() {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        if (!this.state.appInfo) return null;
        return (
            <div className={styles.aboutBox}>
                <div><img
                    alt={`${productName} icon`}
                    src={'icons://app.svg'}
                    className={styles.aboutLogo}
                /></div>
                <div className={styles.aboutText}>
                    <h2>{productName}</h2>
                    {/* eslint-disable-next-line @typescript-eslint/ban-ts-comment */}
                    {/* @ts-ignore */}
                    Version {this.state.appInfo.appVersion}
                    <table className={styles.aboutDetails}><tbody>
                        {
                            ['Electron', 'Chrome', 'Node'].map(component => {
                                // eslint-disable-next-line @typescript-eslint/ban-ts-comment
                                // @ts-ignore
                                const componentVersion = this.state.appInfo.component[component.toLowerCase()];
                                return <tr key={component}><td>{component}</td><td>{componentVersion}</td></tr>;
                            })
                        }
                    </tbody></table>
                </div>
            </div>
        )
    }
}

export default <AboutElement />;