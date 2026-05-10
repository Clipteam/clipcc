import type Runtime from '../engine/runtime';

class MouseWheel {
    constructor (
        /**
         * Reference to the owning Runtime.
         */
        public runtime: Runtime
    ) {}

    /**
     * Mouse wheel DOM event handler.
     * @param data Data from DOM event.
     * @param data.deltaY Amount of vertical scroll. Negative value indicates scrolling up,
     *  positive value indicates scrolling down.
     */
    postData (data: { deltaY: number }): void {
        const matchFields: Record<string, string> = {};
        if (data.deltaY < 0) {
            matchFields.KEY_OPTION = 'up arrow';
        } else if (data.deltaY > 0) {
            matchFields.KEY_OPTION = 'down arrow';
        } else {
            return;
        }

        this.runtime.startHats('event_whenkeypressed', matchFields);
    }
}

export default MouseWheel;
