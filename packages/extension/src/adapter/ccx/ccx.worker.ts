/* eslint-env worker */
import { Ctx, WorkerCtx, makeCtxForWorker } from './make-ctx';
import { WorkerDispatch as dispatch } from '../../dispatch/worker-dispatch';
import { CCXExtensionClass as ExtensionClass } from '../../type/ccx';

declare global {
    // eslint-disable-next-line no-var
    var ClipCCExtension: Ctx | WorkerCtx | undefined;
}

let initialRegistrations: Promise<unknown> [] =[];
let workerId: number;
let extensionURL = '';

dispatch.waitForConnection.then(() => {
    dispatch.call('ccxAdapter', 'allocateWorker').then(x => {
        const [id, url, mainScript] = x;
        workerId = id;
        extensionURL = url;

        self.ClipCCExtension = makeCtxForWorker(dispatch, `ccxSandbox.${workerId}`);

        try {
            importScripts(mainScript);
            dispatch.call('ccxAdapter', 'onWorkerInit', id);
        } catch (e) {
            dispatch.call('ccxAdapter', 'onWorkerInit', id, e);
        }
    });
});

// @ts-expect-error make extension export correctly
self.module = new Proxy({}, {
    set (target: Record<string, unknown>, prop: string, value: any) {
        if (prop === 'exports') {
            const extensionObject = new value() as ExtensionClass;
            const serviceName = `ccxSandbox.${workerId}`;
            dispatch.setService(serviceName, extensionObject).then(() => {
                if (extensionObject.onInit) {
                    extensionObject.onInit();
                }
            });
            dispatch.call('ccxAdapter', 'registerExtensionService', extensionURL, serviceName);
        }
        target[prop] = value;
        return true;
    }
});

export default null as any;
