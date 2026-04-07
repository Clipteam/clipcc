import type {AnyAction} from 'redux';
import alertsData, {AlertTypes, AlertLevels} from '../lib/alerts/index.jsx';
import extensionData from '../lib/libraries/extensions/index.jsx';
import type {BaseAction} from './common';

const SHOW_ALERT = 'scratch-gui/alerts/SHOW_ALERT';
const SHOW_EXTENSION_ALERT = 'scratch-gui/alerts/SHOW_EXTENSION_ALERT';
const CLOSE_ALERT = 'scratch-gui/alerts/CLOSE_ALERT';
const CLOSE_ALERTS_WITH_ID = 'scratch-gui/alerts/CLOSE_ALERTS_WITH_ID';
const CLOSE_ALERT_WITH_ID = 'scratch-gui/alerts/CLOSE_ALERT_WITH_ID';

type AlertType = string;
type AlertLevel = string;

interface AlertItem {
    alertType?: AlertType;
    alertId?: string;
    closeButton?: boolean;
    content?: unknown;
    extensionId?: string;
    extensionName?: string | JSX.Element;
    iconURL?: string;
    iconSpinner?: boolean;
    level?: AlertLevel;
    message?: string;
    showDownload?: boolean;
    showReconnect?: boolean;
    showSaveNow?: boolean;
};

/**
 * Initial state of alerts reducer
 *
 * {boolean} visible - whether the alerts are visible
 * {array} alertsList - list of alerts, each with properties:
 *  alertType (required): one of AlertTypes
 *  closeButton (optional): bool indicating that we should show close button
 *  content (optional): react element (a <FormattedMessage />)
 *  extentionId (optional): id string that identifies the extension
 *  iconURL (optional): string
 *  level (required): string, one of AlertLevels
 *  message (optional): string
 *  showReconnect (optional): bool
 */
export interface AlertsState {
    visible: boolean;
    alertsList: AlertItem[];
};

const initialState: AlertsState = {
    visible: true,
    alertsList: []
};

const filterPopupAlerts = (alertsList: AlertItem[]): AlertItem[] => (
    alertsList.filter(curAlert => (
        curAlert.alertType === AlertTypes.STANDARD ||
        curAlert.alertType === AlertTypes.EXTENSION
    ))
);

const filterInlineAlerts = (alertsList: AlertItem[]): AlertItem[] => (
    alertsList.filter(curAlert => (
        curAlert.alertType === AlertTypes.INLINE
    ))
);

interface ShowAlertAction extends BaseAction<typeof SHOW_ALERT> {
    alertId: string;
    data?: {
        message?: string;
    };
};

interface ShowExtensionAlertAction extends BaseAction<typeof SHOW_EXTENSION_ALERT> {
    data: {
        extensionId?: string;
    };
};

interface CloseAlertAction extends BaseAction<typeof CLOSE_ALERT> {
    index: number;
    alertId?: string;
};

interface CloseAlertWithIdAction extends BaseAction<typeof CLOSE_ALERT_WITH_ID> {
    alertId: string;
};

interface CloseAlertsWithIdAction extends BaseAction<typeof CLOSE_ALERTS_WITH_ID> {
    alertId: string;
};

type AlertsAction =
    | ShowAlertAction
    | ShowExtensionAlertAction
    | CloseAlertAction
    | CloseAlertWithIdAction
    | CloseAlertsWithIdAction;

const reducer = function (state: AlertsState = initialState, action: AnyAction): AlertsState {
    switch (action.type) {
    case SHOW_ALERT: { // intended to show standard and inline alerts, but not extensions
        const alertId = action.alertId;
        if (alertId) {
            const newAlert: AlertItem = {
                alertId: alertId,
                level: AlertLevels.WARN // default level
            };
            const alertData = alertsData.find(thisAlertData => thisAlertData.alertId === alertId);
            if (alertData) {
                const newList = state.alertsList.filter(curAlert => (
                    !alertData.clearList || alertData.clearList.indexOf(curAlert.alertId!) === -1
                ));
                if (action.data && action.data.message) {
                    newAlert.message = action.data.message;
                }

                newAlert.alertType = alertData.alertType || AlertTypes.STANDARD;
                newAlert.closeButton = alertData.closeButton;
                newAlert.content = alertData.content;
                newAlert.iconURL = alertData.iconURL;
                newAlert.iconSpinner = alertData.iconSpinner;
                newAlert.level = alertData.level;
                newAlert.showDownload = alertData.showDownload;
                newAlert.showSaveNow = alertData.showSaveNow;

                newList.push(newAlert);
                return Object.assign({}, state, {
                    alertsList: newList
                });
            }
        }
        return state; // if alert not found, show nothing
    }
    case SHOW_EXTENSION_ALERT: {
        const extensionId = action.data.extensionId;
        if (extensionId) {
            const extension = extensionData.find(ext => ext.extensionId === extensionId);
            if (extension) {
                const newList = state.alertsList.slice();
                const newAlert: AlertItem = {
                    alertType: AlertTypes.EXTENSION,
                    closeButton: true,
                    extensionId: extensionId,
                    extensionName: extension.name,
                    iconURL: extension.connectionSmallIconURL,
                    level: AlertLevels.WARN,
                    showReconnect: true
                };
                newList.push(newAlert);

                return Object.assign({}, state, {
                    alertsList: newList
                });
            }
        }
        return state; // if alert not found, show nothing
    }
    case CLOSE_ALERT_WITH_ID:
    case CLOSE_ALERT: {
        const index = 'alertId' in action ? state.alertsList.findIndex(a => a.alertId === action.alertId) : action.index;
        if (index === -1) return state;
        const newList = state.alertsList.slice();
        newList.splice(index, 1);
        return Object.assign({}, state, {
            alertsList: newList
        });
    }
    case CLOSE_ALERTS_WITH_ID: {
        return Object.assign({}, state, {
            alertsList: state.alertsList.filter(curAlert => (
                curAlert.alertId !== action.alertId
            ))
        });
    }
    default:
        return state;
    }
};

/**
 * Action creator to close an alert with the given index.
 *
 * @param index - the index of the alert to close.
 * @returns - an object to be passed to the reducer.
 */
const closeAlert = function (index: number): CloseAlertAction {
    return {
        type: CLOSE_ALERT,
        index
    };
};

/**
 * Action creator to close all alerts with a given ID.
 *
 * @param alertId id string of the alert to close
 * @returns an object to be passed to the reducer.
 */
const closeAlertsWithId = function (alertId: string): CloseAlertsWithIdAction {
    return {
        type: CLOSE_ALERTS_WITH_ID,
        alertId
    };
};

/**
 * Action creator to close a single alert with a given ID.
 *
 * @param alertId - id string of the alert to close
 * @returns an object to be passed to the reducer.
 */
const closeAlertWithId = function (alertId: string): CloseAlertWithIdAction {
    return {
        type: CLOSE_ALERT_WITH_ID,
        alertId
    };
};

/**
 * Action creator to show an alert with the given alertId.
 *
 * @param alertId - id string of the alert to show
 * @returns an object to be passed to the reducer.
 */
const showStandardAlert = function (alertId: string): ShowAlertAction {
    return {
        type: SHOW_ALERT,
        alertId
    };
};

/**
 * Action creator to show an alert with the given input data.
 *
 * @param data - data for the alert
 * @param data.message - message for the alert
 * @param data.extensionId - extension ID for the alert
 * @returns an object to be passed to the reducer.
 */
const showExtensionAlert = function (data: {message?: string; extensionId?: string}): ShowExtensionAlertAction {
    return {
        type: SHOW_EXTENSION_ALERT,
        data
    };
};

/**
 * Function to dispatch showing an alert, with optional
 * timeout to make it close/go away.
 *
 * @param dispatch - dispatch function
 * @param alertId - the ID of the alert
 */
const showAlertWithTimeout = function (dispatch: (action: AlertsAction) => void, alertId: string): void {
    const alertData = alertsData.find(thisAlertData => thisAlertData.alertId === alertId);
    if (alertData) {
        dispatch(showStandardAlert(alertId));
        if (alertData.maxDisplaySecs) {
            setTimeout(() => {
                dispatch(closeAlertsWithId(alertId));
            }, alertData.maxDisplaySecs * 1000);
        }
    }
};

export {
    reducer as default,
    initialState as alertsInitialState,
    closeAlert,
    closeAlertWithId,
    filterInlineAlerts,
    filterPopupAlerts,
    showAlertWithTimeout,
    showExtensionAlert,
    showStandardAlert
};
