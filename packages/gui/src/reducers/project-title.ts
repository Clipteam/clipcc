import type {AnyAction} from 'redux';
import type {BaseAction} from './common';

const SET_PROJECT_TITLE = 'projectTitle/SET_PROJECT_TITLE';

// we are initializing to a blank string instead of an actual title,
// because it would be hard to localize here
export type ProjectTitleState = string;

const initialState: ProjectTitleState = '';

interface SetProjectTitleAction extends BaseAction<typeof SET_PROJECT_TITLE> {
    title: string;
};

const reducer = function (state = initialState, action: AnyAction): ProjectTitleState {
    switch (action.type) {
    case SET_PROJECT_TITLE:
        return action.title;
    default:
        return state;
    }
};
const setProjectTitle = (title: string): SetProjectTitleAction => ({
    type: SET_PROJECT_TITLE,
    title: title
});

export {
    reducer as default,
    initialState as projectTitleInitialState,
    setProjectTitle
};
