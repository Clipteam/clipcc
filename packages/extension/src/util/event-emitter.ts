// eslint-disable-next-line @typescript-eslint/no-explicit-any
type EventMap = Record<string, any>;

type EventKey<T extends EventMap> = string & keyof T;
type EventReceiver<T> = (params: T) => void;

export interface Emitter<T extends EventMap> {
    events: Partial<{ [K in EventKey<T>]: EventReceiver<T[K]>[] }>;
    on<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): () => void;
    once<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): () => void;
    off<K extends EventKey<T>>(eventName: K, fn: EventReceiver<T[K]>): void;
    emit<K extends EventKey<T>>(eventName: K, params: T[K]): void;
}

/**
 * Create a event emitter.
 * @returns a event emitter.
 */
export function createEmitter <T extends EventMap> (): Emitter<T> {
    return {
        events: {} as Partial<{ [K in EventKey<T>]: EventReceiver<T[K]>[] }>,
        on<K extends EventKey<T>> (eventName: K, fn: EventReceiver<T[K]>) {
            if (!(eventName in this.events)) {
                this.events[eventName] = [];
            }
            this.events[eventName]!.push(fn as EventReceiver<T[EventKey<T>]>);

            return () => this.off(eventName, fn);
        },

        once<K extends EventKey<T>> (eventName: K, fn: EventReceiver<T[K]>) {
            const onceFn: EventReceiver<T[K]> = params => {
                this.off(eventName, onceFn);
                fn(params);
            };
            return this.on(eventName, onceFn);
        },

        off<K extends EventKey<T>> (eventName: K, fn: EventReceiver<T[K]>) {
            if (eventName in this.events) {
                this.events[eventName] = this.events[eventName]!.filter(cb => cb !== fn);
            }
        },

        emit<K extends EventKey<T>> (eventName: K, params: T[K]) {
            const callbacks = this.events[eventName] || [];
            callbacks.forEach(callback => {
                (callback as EventReceiver<T[K]>)(params);
            });
        }
    };
}
