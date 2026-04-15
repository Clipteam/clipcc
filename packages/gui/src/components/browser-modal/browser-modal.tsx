import React from 'react';
import ReactModal from 'react-modal';
import {defineMessages, FormattedMessage, injectIntl} from 'react-intl';
import type {IntlShape} from 'react-intl';

import Box from '../box/box.jsx';

import styles from './browser-modal.css';
import unhappyBrowser from './unsupported-browser.svg';

const messages = defineMessages({
    label: {
        id: 'gui.unsupportedBrowser.label',
        defaultMessage: 'Browser is not supported',
        description: ''
    },
    error: {
        id: 'gui.unsupportedBrowser.errorLabel',
        defaultMessage: 'An Error Occurred',
        description: 'Heading shown when there is an unhandled exception in an unsupported browser'
    }
});

interface BrowserModalProps {
    error?: boolean;
    intl: IntlShape;
    isRtl?: boolean;
    onBack: () => void;
}

const BrowserModal = ({intl, error = false, ...props}: BrowserModalProps) => {
    const label = error ? messages.error : messages.label;
    return (
        <ReactModal
            isOpen
            className={styles.modalContent}
            contentLabel={intl.formatMessage(messages.label)}
            overlayClassName={styles.modalOverlay}
            onRequestClose={props.onBack}
        >
            <div dir={props.isRtl ? 'rtl' : 'ltr'}>
                <Box className={styles.illustration}>
                    <img src={unhappyBrowser} />
                </Box>

                <Box className={styles.body}>
                    <h2>
                        <FormattedMessage {...label} />
                    </h2>
                    <p>
                        { /* eslint-disable max-len */ }
                        {
                            error ? <FormattedMessage
                                defaultMessage="We are very sorry, but it looks like you are using a browser version that ClipCC does not support. We recommend updating to the latest version of a supported browser such as Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari. "
                                description="Error message when the browser does not meet our minimum requirements"
                                id="gui.unsupportedBrowser.notRecommended"
                            /> : <FormattedMessage
                                defaultMessage="We are very sorry, but ClipCC does not support this browser. We recommend updating to the latest version of a supported browser such as Google Chrome, Mozilla Firefox, Microsoft Edge, or Apple Safari."
                                description="Error message when the browser does not work at all (IE)"
                                id="gui.unsupportedBrowser.description"
                            />
                        }
                        { /* eslint-enable max-len */ }
                    </p>

                    <Box className={styles.buttonRow}>
                        <button
                            className={styles.backButton}
                            onClick={props.onBack}
                        >
                            <FormattedMessage
                                defaultMessage="Back"
                                description="Button to go back in unsupported browser modal"
                                id="gui.unsupportedBrowser.back"
                            />
                        </button>

                    </Box>
                    <div className={styles.faqLinkText}>
                        <FormattedMessage
                            defaultMessage="To learn more, go to the {previewFaqLink}."
                            description="Invitation to try 3.0 preview"
                            id="gui.unsupportedBrowser.previewfaq"
                            values={{
                                previewFaqLink: (
                                    <a
                                        className={styles.faqLink}
                                        href="//scratch.mit.edu/3faq"
                                    >
                                        <FormattedMessage
                                            defaultMessage="FAQ"
                                            description="link to Scratch 3.0 FAQ page"
                                            id="gui.unsupportedBrowser.previewfaqlinktext"
                                        />
                                    </a>
                                )
                            }}
                        />
                    </div>
                </Box>
            </div>
        </ReactModal>
    );
};

const WrappedBrowserModal = injectIntl(BrowserModal);

export default WrappedBrowserModal;
export {setAppElement} from 'react-modal';
