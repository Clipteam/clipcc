/* eslint-env worker */
import {
    BlockType,
    TargetType,
    ArgumentType
} from '../type/scratch';
import { WorkerDispatch as dispatch } from '../dispatch/worker-dispatch';

declare global {
  var Scratch: {
      ArgumentType: typeof ArgumentType,
      BlockType: typeof BlockType,
      TargetType: typeof TargetType,
      extensions: {
          register: (extensionObject: unknown) => Promise<unknown>
      }
  };
}

class ExtensionWorker {
    nextExtensionId = 0;
    initialRegistrations: Promise<unknown>[] = [];
    extensions: unknown[] = [];
    workerId?: number;
    constructor () {
        dispatch.waitForConnection.then(() => {
            dispatch.call('extensions', 'allocateWorker').then(x => {
                const [id, extension] = x;
                this.workerId = id;

                try {
                    importScripts(extension);

                    const initialRegistrations = this.initialRegistrations;
                    this.initialRegistrations = [];

                    Promise.all(initialRegistrations).then(() => dispatch.call('extensions', 'onWorkerInit', id));
                } catch (e) {
                    dispatch.call('extensions', 'onWorkerInit', id, e);
                }
            });
        });

        this.extensions = [];
    }

    register (extensionObject: unknown) {
        const extensionId = this.nextExtensionId++;
        this.extensions.push(extensionObject);
        const serviceName = `extension.${this.workerId}.${extensionId}`;
        const promise = dispatch.setService(serviceName, extensionObject)
            .then(() => dispatch.call('extensions', 'registerExtensionService', serviceName));
        if (this.initialRegistrations) {
            this.initialRegistrations.push(promise);
        }
        return promise;
    }
}

global.Scratch = global.Scratch || {};
global.Scratch.ArgumentType = ArgumentType;
global.Scratch.BlockType = BlockType;
global.Scratch.TargetType = TargetType;

/**
 * Expose only specific parts of the worker to extensions.
 */
const extensionWorker = new ExtensionWorker();
global.Scratch.extensions = {
    register: extensionWorker.register.bind(extensionWorker)
};
