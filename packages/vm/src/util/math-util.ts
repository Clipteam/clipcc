class MathUtil {
    /**
     * Convert a value from degrees to radians.
     * @param deg Value in degrees.
     * @returns Equivalent value in radians.
     */
    static degToRad (deg: number): number {
        return deg * Math.PI / 180;
    }

    /**
     * Convert a value from radians to degrees.
     * @param rad Value in radians.
     * @returns Equivalent value in degrees.
     */
    static radToDeg (rad: number): number {
        return rad * 180 / Math.PI;
    }

    /**
     * Clamp a number between two limits.
     * If n < min, return min. If n > max, return max. Else, return n.
     * @param n Number to clamp.
     * @param min Minimum limit.
     * @param max Maximum limit.
     * @returns Value of n clamped to min and max.
     */
    static clamp (n: number, min: number, max: number): number {
        return Math.min(Math.max(n, min), max);
    }

    /**
     * Keep a number between two limits, wrapping "extra" into the range.
     * e.g., wrapClamp(7, 1, 5) == 2
     * wrapClamp(0, 1, 5) == 5
     * wrapClamp(-11, -10, 6) == 6, etc.
     * @param n Number to wrap.
     * @param min Minimum limit.
     * @param max Maximum limit.
     * @returns Value of n wrapped between min and max.
     */
    static wrapClamp (n: number, min: number, max: number): number {
        const range = (max - min) + 1;
        return n - (Math.floor((n - min) / range) * range);
    }


    /**
     * Convert a value from tan function in degrees.
     * @param angle in degrees
     * @returns Correct tan value
     */
    static tan (angle: number): number {
        angle = angle % 360;
        switch (angle) {
        case -270:
        case 90:
            return Infinity;
        case -90:
        case 270:
            return -Infinity;
        default:
            return parseFloat(Math.tan((Math.PI * angle) / 180).toFixed(10));
        }
    }

    /**
     * Given an array of unique numbers,
     * returns a reduced array such that each element of the reduced array
     * represents the position of that element in a sorted version of the
     * original array.
     * E.g. [5, 19. 13, 1] => [1, 3, 2, 0]
     * @param elts The elements to sort and reduce
     * @returns The array of reduced orderings
     */
    static reducedSortOrdering (elts: number[]): number[] {
        const sorted = elts.slice(0).sort((a, b) => a - b);
        return elts.map(e => sorted.indexOf(e));
    }

    /**
     * Return a random number given an inclusive range and a number in that
     * range that should be excluded.
     *
     * For instance, (1, 5, 3) will only pick 1, 2, 4, or 5 (with equal
     * probability)
     *
     * @param lower - The lower bound (inlcusive)
     * @param upper - The upper bound (inclusive), such that lower <= upper
     * @param excluded - The number to exclude (MUST be in the range)
     * @returns A random integer in the range [lower, upper] that is not "excluded"
     */
    static inclusiveRandIntWithout (lower: number, upper: number, excluded: number): number {
        // Note that subtraction is the number of items in the
        // inclusive range [lower, upper] minus 1 already
        // (e.g. in the set {3, 4, 5}, 5 - 3 = 2).
        const possibleOptions = upper - lower;

        const randInt = lower + Math.floor(Math.random() * possibleOptions);
        if (randInt >= excluded) {
            return randInt + 1;
        }

        return randInt;
    }

    /**
     * Scales a number from one range to another.
     * @param i number to be scaled
     * @param iMin input range minimum
     * @param iMax input range maximum
     * @param oMin output range minimum
     * @param oMax output range maximum
     * @returns scaled number
     */
    static scale (i: number, iMin: number, iMax: number, oMin: number, oMax: number): number {
        const p = (i - iMin) / (iMax - iMin);
        return (p * (oMax - oMin)) + oMin;
    }
}

export default MathUtil;
