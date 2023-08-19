/* eslint-env worker */
import { Ctx, WorkerCtx, makeCtxForWorker } from './make-ctx';
import { WorkerDispatch as dispatch } from '../../dispatch/worker-dispatch';
import { CCXExtensionClass as ExtensionClass } from '../../type/ccx';

declare global {
    // eslint-disable-next-line no-var
    var ClipCCExtension: Ctx | WorkerCtx | undefined;
}

let workerId: number;
let extensionId = '';

dispatch.waitForConnection.then(() => {
    dispatch.call('ccxAdapter', 'allocateWorker').then(x => {
        const [id, extId, mainScript] = x;
        workerId = id;
        extensionId = extId;

        self.ClipCCExtension = makeCtxForWorker(dispatch, `ccxSandbox.${workerId}`, extId);

        try {
            importScripts(mainScript);
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
            dispatch.setService(serviceName, extensionObject).then(async () => {
                if (extensionObject.onInit) {
                    await extensionObject.onInit();
                }
                await dispatch.call('ccxAdapter', 'registerExtensionService', extensionId, serviceName);
                await dispatch.call('ccxAdapter', 'onWorkerInit', workerId);
            });
        }
        target[prop] = value;
        return true;
    }
});

export default null as any;
