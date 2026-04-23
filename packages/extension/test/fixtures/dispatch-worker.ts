/**
 * @license
 * Copyright 2026 Clip Team
 * SPDX-License-Identifier: MPL-2.0
 */

import dispatch from '../../src/adapter/scratch/dispatch/worker-dispatch';
import {DispatchTestService} from './dispatch-test-service';

dispatch.setService('RemoteDispatchTest', new DispatchTestService());

dispatch.waitForConnection.then(() => {
    dispatch.call('test', 'onWorkerReady');
});
