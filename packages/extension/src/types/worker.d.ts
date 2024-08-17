declare module '*.worker' {
    class ExtensionSandbox extends Worker {
        constructor();
    }
    export default ExtensionSandbox;
}
