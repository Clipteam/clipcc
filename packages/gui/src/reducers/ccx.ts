import { Manager } from 'clipcc-extension';

const SET_MANAGER = 'scratch-gui/ccx/SET_MANAGER';
const SET_EXTENDED_XML = 'scratch-gui/ccx/SET_EXTENDED_XML';
const defaultManager = new Manager();
const initialState = {
    manager: defaultManager,
    extendedXML: ''
};

interface Action {
    type: string;
    manager?: Manager;
    extendedXML?: string;
}

const reducer = function (state = initialState, action: Action) {
    switch (action.type) {
        case SET_MANAGER:
            return action.manager!;
        case SET_EXTENDED_XML:
            return action.extendedXML!;
        default:
            return state;
    }
};

const setManager = function (manager: Manager) {
    return {
        type: SET_MANAGER,
        manager
    };
};

const setExtendedXML = function (xml: string) {
    return {
        type: SET_EXTENDED_XML,
        extendedXML: xml
    };
}

export {
    reducer as default,
    initialState as ccxInitialState,
    setManager,
    setExtendedXML
};
