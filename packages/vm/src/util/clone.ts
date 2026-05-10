/**
 * Methods for cloning JavaScript objects.
 */
class Clone {
    /**
     * Deep-clone a "simple" object: one which can be fully expressed with JSON.
     * Non-JSON values, such as functions, will be stripped from the clone.
     * @param original - the object to be cloned.
     * @returns a deep clone of the original object.
     */
    static simple <T> (original: T): T {
        return JSON.parse(JSON.stringify(original));
    }
}

export default Clone;
