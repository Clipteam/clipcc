/**
 * Restrict sandboxed extension's permission to access runtime.
 */
export interface SecurityOptions {
    /**
     * Whether creates runtime proxy for sandboxed extension.
     * All runtime properties is read-only.
     * @type {boolean}
     */
    runtimeProxy: boolean;
    /**
     * Whether pass blockUtility proxy to sandboxed extension's block function.
     * @type {boolean}
     */
    passUtil: boolean;
    /**
     * Whether some runtime methods can be called.
     * @type {boolean}
     */
    callableRuntime: boolean;
    /**
     * Whether some thread methods can be called.
     * @type {boolean}
     */
    callableThread: boolean;
    /**
     * Whether some target methods can be called.
     * @type {boolean}
     */
    callableTarget: boolean;
}
