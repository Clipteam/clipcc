import {combineReducers, type Reducer, type Store} from 'redux';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initialReducers: Record<string, Reducer<any>> | null = null;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const dynamicReducers: Record<string, Reducer<any>> = {};

/**
 * Set the initial reducers for the store. This should be called before creating the store,
 * and the reducers passed here will be combined with any dynamically injected reducers.
 * @param reducers The initial reducers to set for the store.
 */
export function setInitialReducers<StoreState> (reducers: Record<string, Reducer<StoreState>>) {
    initialReducers = reducers;
}

/**
 * Dynamically inject a reducer into the store. This is useful for code-splitting and loading reducers on demand.
 * @param store The Redux store to inject the reducer into.
 * @param key The key under which to store the reducer's state in the Redux store.
 * @param reducer The reducer function to inject.
 */
export function injectReducer<StoreState, ReducerState> (
    store: Store<StoreState>,
    key: string,
    reducer: Reducer<ReducerState>) {
    dynamicReducers[key] = reducer;
    store.replaceReducer(combineReducers({
        ...initialReducers,
        ...dynamicReducers
    }));
}
