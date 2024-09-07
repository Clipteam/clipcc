import clone from './clone';

/**
 * Compares two parsed version arrays and determines their order.
 *
 * @param ver1 - The first version array to compare.
 * @param ver2 - The second version array to compare.
 * @returns Returns -1 if ver1 is less than ver2, 1 if ver1 is greater than ver2, and 0 if they are equal.
 */
function compareParsedVersion (ver1: string[], ver2: string[]) {
    const len = Math.max(ver1.length, ver2.length);
    for (let i = 0; i < len; ++i) {
        const v1 = i < ver1.length ? parseInt(ver1[i], 10) || 0 : 0;
        const v2 = i < ver2.length ? parseInt(ver2[i], 10) || 0 : 0;
        if (v1 < v2) return -1;
        if (v1 > v2) return 1;
    }
    return 0;
}

/**
 * Checks if a version matches a given version range pattern.
 *
 * @param ver - The version to check.
 * @param reg - The version range pattern, which can start with '^', '~', or contain '*'.
 * @returns Returns true if the version matches the pattern, otherwise false.
 */
function matchVersion (ver: string, reg: string) {
    if (reg[0] === '^') {
        const minVer = reg.substring(1).split('.');
        const maxVer = clone(minVer);
        maxVer[0] = (parseInt(maxVer[0], 10) + 1).toString();
        return compareParsedVersion(ver.split('.'), maxVer) < 0 && compareParsedVersion(ver.split('.'), minVer) >= 0;
    } else if (reg[0] === '~') {
        const minVer = reg.substring(1).split('.');
        const maxVer = clone(minVer);
        maxVer[1] = (parseInt(maxVer[1], 10) + 1).toString();
        return compareParsedVersion(ver.split('.'), maxVer) < 0 && compareParsedVersion(ver.split('.'), minVer) >= 0;
    } else if (reg.includes('*')) {
        return new RegExp(reg.replace(/\*/g, '\\d*')).test(ver);
    }
    return compareParsedVersion(ver.split('.'), reg.split('.')) === 0;
}

export {compareParsedVersion, matchVersion};
