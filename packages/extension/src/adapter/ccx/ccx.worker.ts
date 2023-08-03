/* eslint-env worker */
import { Ctx, WorkerCtx, makeCtxForWorker } from './make-ctx';
import { WorkerDispatch as dispatch } from '../../dispatch/worker-dispatch';
import { CCXExtensionClass as ExtensionClass } from '../../type/ccx';

declare global {
    // eslint-disable-next-line no-var
    var ClipCCExtension: Ctx | WorkerCtx | undefined;
}

let initialRegistrations: Promise <unknown> [] =[];
let workerId: number;
let extensionURL = '';

dispatch.waitForConnection.then(() => {
    dispatch.call('ccxAdapter', 'allocateWorker').then(x => {
        const [id, url] = x;
        workerId = id;
        extensionURL = url;

        try {
            importScripts(url);

            const cachedInitialRegistrations = initialRegistrations;
            initialRegistrations = [];

            Promise.all(cachedInitialRegistrations).then(() => dispatch.call('ccxAdapter', 'onWorkerInit', id));
        } catch (e) {
            dispatch.call('ccxAdapter', 'onWorkerInit', id, e);
        }
    });
});

// @ts-expect-error make extension export correctly
global.module = new Proxy({}, {
    set (target: Record<string, unknown>, prop: string, value: any) {
        if (prop === 'exports') {
            const extensionObject = new value() as ExtensionClass;
            if (extensionObject.onInit) {
                extensionObject.onInit();
            }
            const serviceName = `ccxSandbox.${workerId}`;
            dispatch.call('ccxAdapter', 'registerExtensionService', extensionURL, serviceName);
        }
        target[prop] = value;
        return true;
    }
});

global.ClipCCExtension = window.ClipCCExtension = makeCtxForWorker(dispatch);

export default null as any;
