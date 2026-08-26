import type {Reducer} from 'redux';

export type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;

export type ReducerMap<S extends object> = {
    [P in keyof S]: Reducer<S[P]>;
};
