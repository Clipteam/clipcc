declare module 'tiny-worker' {
    class Worker {
        constructor(...args: any[]);
        addEventListener(event: any, fn: any): any;
        postMessage(msg: any): any;
        terminate(): void;
        setRange(min: any, max: any): boolean;
    }

    export default Worker;
}
