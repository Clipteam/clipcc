import dispatch from '../../src/dispatch/worker-dispatch.js';
import DispatchTestService from './dispatch-test-service.js';
import log from '../../src/util/log';

dispatch.setService('RemoteDispatchTest', new DispatchTestService());

dispatch.waitForConnection.then(() => {
    dispatch.call('test', 'onWorkerReady').catch(e => {
        log(`Test worker failed to call onWorkerReady: ${JSON.stringify(e)}`);
    });
});
