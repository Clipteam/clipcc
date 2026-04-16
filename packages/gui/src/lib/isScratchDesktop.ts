/**
 * Internal stored state. Not valid until after at least one call to `setIsScratchDesktop()`.
 */
let isDesktopState: boolean | undefined;

/**
 * Tell the `isScratchDesktop()` whether or not the GUI is running under Scratch Desktop.
 * @param value - the new value which `isScratchDesktop()` should return in the future.
 */
const setIsScratchDesktop = function (value: boolean): void {
    isDesktopState = value;
};

/**
 * Whether or not the GUI seems to be running under Scratch Desktop.
 * @returns true if it seems like the GUI is running under Scratch Desktop; false otherwise.
 * If `setIsScratchDesktop()` has not yet been called, this can return `undefined`.
 */
const isScratchDesktop = function (): boolean | undefined {
    return isDesktopState;
};

/**
 * Whether or not the GUI seems to be running under Scratch Desktop.
 * @returns false if it seems like the GUI is running under Scratch Desktop; true otherwise.
 */
const notScratchDesktop = function (): boolean {
    return !isScratchDesktop();
};

export default isScratchDesktop;
export {
    isScratchDesktop,
    notScratchDesktop,
    setIsScratchDesktop
};
