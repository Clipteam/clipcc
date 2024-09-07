function clone<T> (obj: T): T {
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
