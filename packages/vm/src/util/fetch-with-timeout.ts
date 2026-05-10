/**
 * Fetch a remote resource like `fetch` does, but with a time limit.
 * @param resource Remote resource to fetch.
 * @param init An options object containing any custom settings that you want to apply to the request.
 * @param timeout The amount of time before the request is canceled, in milliseconds
 * @returns The response from the server.
 */
const fetchWithTimeout = (resource: RequestInfo | URL, init: RequestInit | null, timeout: number): Promise<Response> => {
    let timeoutID: ReturnType<typeof setTimeout> | null = null;
    // Not supported in Safari <11
    const controller = window.AbortController ? new window.AbortController() : null;
    const signal = controller ? controller.signal : null;
    // The fetch call races a timer.
    return Promise.race([
        fetch(resource, Object.assign({signal}, init)).then(response => {
            clearTimeout(timeoutID!);
            return response;
        }),
        new Promise<never>((resolve, reject) => {
            timeoutID = setTimeout(() => {
                if (controller) controller.abort();
                reject(new Error(`Fetch timed out after ${timeout} ms`));
            }, timeout);
        })
    ]);
};

export default fetchWithTimeout;
