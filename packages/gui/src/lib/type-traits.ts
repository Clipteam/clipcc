export type PropsOf<C> = C extends React.ComponentType<infer P> ? P : never;
