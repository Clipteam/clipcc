const testCompare = (lhs, op, rhs, message) => {
    const details = `Expected: ${lhs} ${op} ${rhs}`;
    const extra = {details};
    switch (op) {
    case '<': return expect(lhs < rhs).toBeTruthy();
    case '<=': return expect(lhs <= rhs).toBeTruthy();
    case '===': return expect(lhs === rhs).toBeTruthy();
    case '!==': return expect(lhs !== rhs).toBeTruthy();
    case '>=': return expect(lhs >= rhs).toBeTruthy();
    case '>': return expect(lhs > rhs).toBeTruthy();
    default: return expect(false, `Unrecognized op: ${op}`).toBeTruthy();
    }
};

module.exports = testCompare;
