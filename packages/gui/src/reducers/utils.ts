import {combineReducers, type Reducer, type Store} from 'redux';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let initialReducers: Record<string, Reducer<any>> = {};
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let storeInstance: Store<any> | null = null;
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
 * Set the Redux store instance. This is necessary for the injectReducer function to work,
 * as it needs access to the store to replace the reducer.
 * @param store The Redux store instance to set for dynamic reducer injection.
 */
export function setStore<StoreState> (store: Store<StoreState>) {
    storeInstance = store;
}

/**
 * Dynamically inject a reducer into the store. This is useful for code-splitting and loading reducers on demand.
 * @param key The key under which to store the reducer's state in the Redux store.
 * @param reducer The reducer function to inject.
 */
export function injectReducer<ReducerState> (
    key: string,
    reducer: Reducer<ReducerState>) {
    dynamicReducers[key] = reducer;
    if (!storeInstance) return;
    storeInstance.replaceReducer(combineReducers({
        ...initialReducers,
        ...dynamicReducers
    }));
}
