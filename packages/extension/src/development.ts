/**
 * @fileoverview Export necessary stuffs to optimize development
 * experience.
 */

import { makeUnsandboxedCtx } from './adapter/ccx/make-ctx';
export type * from './types/ccx';
// @ts-expect-error it doesn't't take effect because it's external.
const Ctx = makeUnsandboxedCtx();
export default Ctx;
