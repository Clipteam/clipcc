export type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;

type CamelToSnake<S extends string> = S extends `${infer T}${infer U}`
    ? T extends Capitalize<T>
    ? `_${Lowercase<T>}${CamelToSnake<U>}`
    : `${T}${CamelToSnake<U>}`
    : S;

export type CamelToSnakeKeys<T> = T extends object
    ? {
        [K in keyof T as CamelToSnake<K & string>]: T[K];
    }
    : T;
