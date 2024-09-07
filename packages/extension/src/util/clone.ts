/**
 * Deep-clone an array of object.
 * @param obj The object to be deep-clone.
 * @returns The deep-cloned object.
 */
function clone<T> (obj: T): T {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const res: any = Array.isArray(obj) ? [] : {};
    if (typeof obj !== 'object') {
        return obj;
    }
    for (const key in obj) {
        res[key] = typeof obj[key] === 'object' ? clone(obj[key]) : obj[key];
    }
    return res;
}

export default clone;
