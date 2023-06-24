const Cast = require('../util/cast.js');
const MathUtil = require('../util/math-util.js');

class Scratch3OperatorsBlocks {
    constructor (runtime) {
        /**
         * The runtime instantiating this block package.
         * @type {Runtime}
         */
        this.runtime = runtime;
    }

    /**
     * Retrieve the block primitives implemented by this package.
     * @return {object.<string, Function>} Mapping of opcode to Function.
     */
    getPrimitives () {
        return {
            operator_add: this.add,
            operator_subtract: this.subtract,
            operator_multiply: this.multiply,
            operator_divide: this.divide,
            operator_lt: this.lt,
            operator_equals: this.equals,
            operator_gt: this.gt,
            operator_and: this.and,
            operator_or: this.or,
            operator_not: this.not,
            operator_random: this.random,
            operator_join: this.join,
            operator_indexof: this.indexOf,
            operator_letter_of: this.letterOf,
            operator_length: this.length,
            operator_contains: this.contains,
            operator_mod: this.mod,
            operator_round: this.round,
            operator_mathop: this.mathop,
            operator_power: this.power,
            operator_bitand: this.bitand,
            operator_bitor: this.bitor,
            operator_bitxor: this.bitxor,
            operator_bitnot: this.bitnot,
            operator_bitlsh: this.bitlsh,
            operator_bitrsh: this.bitrsh,
            operator_bitursh: this.bitursh,
            operator_le: this.le,
            operator_ge: this.ge,
            operator_nequals: this.nequals
        };
    }

    getGenerators () {
        return {
            operator_add: this.gadd,
            operator_subtract: this.gsubtract,
            operator_multiply: this.gmultiply,
            operator_divide: this.gdivide,
            operator_lt: this.glt,
            operator_equals: this.gequals,
            operator_gt: this.ggt,
            operator_and: this.gand,
            operator_or: this.gor,
            operator_not: this.gnot,
            operator_random: this.grandom,
            operator_join: this.gjoin,
            operator_letter_of: this.gletterOf,
            operator_length: this.glength,
            operator_contains: this.gcontains,
            operator_mod: this.gmod,
            operator_round: this.ground,
            operator_mathop: this.gmathop
        };
    }

    add (args) {
        return Cast.toNumber(args.NUM1) + Cast.toNumber(args.NUM2);
    }

    gadd (args) {
        if (args.NUM1.constant && args.NUM2.constant) {
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: args.NUM1.source + args.NUM2.source
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `${args.NUM1.asNumber()} + ${args.NUM2.asNumber()}`
        };
    }

    subtract (args) {
        return Cast.toNumber(args.NUM1) - Cast.toNumber(args.NUM2);
    }

    gsubtract (args) {
        if (args.NUM1.constant && args.NUM2.constant) {
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: args.NUM1.source - args.NUM2.source
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `${args.NUM1.asNumber()} - ${args.NUM2.asNumber()}`
        };
    }

    multiply (args) {
        return Cast.toNumber(args.NUM1) * Cast.toNumber(args.NUM2);
    }

    gmultiply (args) {
        if (args.NUM1.constant && args.NUM2.constant) {
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: args.NUM1.source * args.NUM2.source
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `${args.NUM1.asNumber()} * ${args.NUM2.asNumber()}`
        };
    }

    divide (args) {
        return Cast.toNumber(args.NUM1) / Cast.toNumber(args.NUM2);
    }

    gdivide (args) {
        if (args.NUM1.constant && args.NUM2.constant) {
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: args.NUM1.source / args.NUM2.source
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `${args.NUM1.asNumber()} / ${args.NUM2.asNumber()}`
        };
    }

    lt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) < 0;
    }

    glt (args) {
        if (args.OPERAND1.constant && args.OPERAND2.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: Cast.compare(args.OPERAND1.source, args.OPERAND2.source) < 0
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `Cast.compare(${args.OPERAND1.asUnknown()}, ${args.OPERAND2.asUnknown()}) < 0`
        };
    }

    equals (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) === 0;
    }

    gequals (args) {
        if (args.OPERAND1.constant && args.OPERAND2.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: Cast.compare(args.OPERAND1.source, args.OPERAND2.source) === 0
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `Cast.compare(${args.OPERAND1.asUnknown()}, ${args.OPERAND2.asUnknown()}) === 0`
        };
    }

    gt (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) > 0;
    }

    ggt (args) {
        if (args.OPERAND1.constant && args.OPERAND2.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: Cast.compare(args.OPERAND1.source, args.OPERAND2.source) > 0
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `Cast.compare(${args.OPERAND1.asUnknown()}, ${args.OPERAND2.asUnknown()}) > 0`
        };
    }

    and (args) {
        return Cast.toBoolean(args.OPERAND1) && Cast.toBoolean(args.OPERAND2);
    }

    gand (args) {
        if (args.OPERAND1.constant && args.OPERAND2.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: args.OPERAND1.source && args.OPERAND2.source
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `(${args.OPERAND1.asUnknown()} && ${args.OPERAND2.asUnknown()})`
        };
    }

    or (args) {
        return Cast.toBoolean(args.OPERAND1) || Cast.toBoolean(args.OPERAND2);
    }

    gor (args) {
        if (args.OPERAND1.constant && args.OPERAND2.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: args.OPERAND1.source || args.OPERAND2.source
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `(${args.OPERAND1.asUnknown()} || ${args.OPERAND2.asUnknown()})`
        };
    }

    not (args) {
        return !Cast.toBoolean(args.OPERAND);
    }

    gnot (args) {
        if (args.OPERAND.constant) {
            return {
                constant: true,
                type: 4 /** BOOLEAN **/,
                result: !Cast.toBoolean(args.OPERAND1.source)
            };
        }
        return {
            constant: false,
            type: 4 /** BOOLEAN **/,
            result: `!(${args.OPERAND.asBoolean()})`
        };
    }

    _random (nFrom, nTo) {
        const low = nFrom <= nTo ? nFrom : nTo;
        const high = nFrom <= nTo ? nTo : nFrom;
        if (low === high) return low;
        // If both arguments are ints, truncate the result to an int.
        if (Cast.isInt(nFrom) && Cast.isInt(nTo)) {
            return low + Math.floor(Math.random() * ((high + 1) - low));
        }
        return (Math.random() * (high - low)) + low;
    }

    random (args) {
        const from = Cast.toNumber(args.FROM);
        const to = Cast.toNumber(args.TO);
        return this._random(from, to);
    }

    grandom (args, ctx) {
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `runtime._packageObjects['scratch3_operators']._random(${args.FROM.asNumber()}, ${args.TO.asNumber()})`
        };
    }

    join (args) {
        return Cast.toString(args.STRING1) + Cast.toString(args.STRING2);
    }

    gjoin (args, ctx) {
        if (args.STRING1.constant && args.STRING2.constant) {
            return {
                constant: true,
                type: 3 /* STRING */,
                result: Cast.toString(args.STRING1.source) + Cast.toString(args.STRING2.source)
            };
        }
        return {
            constant: false,
            type: 3 /* STRING */,
            result: `${args.STRING1.asString()} + ${args.STRING2.asString()}`
        };
    }

    _letterOf (str, index) {
        // Out of bounds?
        if (index < 0 || index >= str.length) {
            return '';
        }
        return str.charAt(index);
    }

    letterOf (args) {
        const index = Cast.toNumber(args.LETTER) - 1;
        const str = Cast.toString(args.STRING);
        this._letterOf(str, index);
    }

    gletterOf (args) {
        if (args.LETTER.constant && args.STRING.constant) {
            return {
                constant: true,
                type: 3 /* STRING */,
                result: this._letterOf(Cast.toString(args.STRING), Cast.toNumber(args.LETTER.source) - 1)
            };
        }
        return {
            constant: false,
            type: 3 /* STRING */,
            result: `runtime._packageObjects['scratch3_operators']._letterof(${args.STRING.asString()}, ${args.LETTER.asNumber()} - 1)`
        };
    }

    length (args) {
        return Cast.toString(args.STRING).length;
    }

    glength (args) {
        if (args.STRING.constant) {
            return {
                constant: true,
                type: 1 /* NUMBER */,
                result: Cast.toString(args.STRING.source).length
            };
        }
        return {
            constant: false,
            type: 1 /* NUMBER */,
            result: `${args.STRING.asString()}.length`
        };
    }

    _contains (string1, string2) {
        const format = function (string) {
            return Cast.toString(string).toLowerCase();
        };
        return format(string1).includes(format(string2));
    }

    contains (args) {
        return this._contains(args.STRING1, args.STRING2);
    }

    gcontains (args) {
        if (args.STRING1.constant && args.STRING2.constant) {
            return {
                constant: true,
                type: 4 /* BOOLEAN */,
                result: this._contains(args.STRING1.source, args.STRING2.source)
            };
        }
        return {
            constant: false,
            type: 4 /* BOOLEAN */,
            result: `runtime._packageObjects['scratch3_operators']._contains(${args.STRING1.asUnknown()}, ${args.STRING2.asUnknown()})`
        };
    }

    _mod (n, modulus) {
        let result = n % modulus;
        // Scratch mod uses floored division instead of truncated division.
        if (result / modulus < 0) result += modulus;
        return result;
    }

    mod (args) {
        const n = Cast.toNumber(args.NUM1);
        const modulus = Cast.toNumber(args.NUM2);
        return this._mod(n, modulus);
    }

    gmod (args) {
        if (args.NUM1.constant && args.NUM2.constant) {
            const n = Cast.toNumber(args.NUM1.source);
            const modulus = Cast.toNumber(args.NUM2.source);
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: this._mod(n, modulus)
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `runtime._packageObjects['scratch3_operators']._mod(${args.NUM1.asNumber()}, ${args.NUM2.asNumber()})`
        };
    }

    round (args) {
        return Math.round(Cast.toNumber(args.NUM));
    }

    ground (args) {
        if (args.NUM.constant) {
            return {
                constant: true,
                type: 2 /** NUMBER_NAN **/,
                result: Math.round(Cast.toNumber(args.NUM.source))
            };
        }
        return {
            constant: false,
            type: 2 /** NUMBER_NAN **/,
            result: `Math.round(${args.NUM.asNumber()})`
        };
    }

    mathop (args) {
        const operator = Cast.toString(args.OPERATOR).toLowerCase();
        const n = Cast.toNumber(args.NUM);
        switch (operator) {
        case 'abs': return Math.abs(n);
        case 'floor': return Math.floor(n);
        case 'ceiling': return Math.ceil(n);
        case 'sqrt': return Math.sqrt(n);
        case 'sin': return parseFloat(Math.sin((Math.PI * n) / 180).toFixed(10));
        case 'cos': return parseFloat(Math.cos((Math.PI * n) / 180).toFixed(10));
        case 'tan': return MathUtil.tan(n);
        case 'asin': return (Math.asin(n) * 180) / Math.PI;
        case 'acos': return (Math.acos(n) * 180) / Math.PI;
        case 'atan': return (Math.atan(n) * 180) / Math.PI;
        case 'ln': return Math.log(n);
        case 'log': return Math.log(n) / Math.LN10;
        case 'e ^': return Math.exp(n);
        case '10 ^': return Math.pow(10, n);
        }
        return 0;
    }

    gmathop (args) {
        // always constant
        const operator = Cast.toString(args.OPERATOR.source).toLowerCase();
        if (args.NUM.constant) {
            switch (operator) {
            case 'abs':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.abs(args.NUM.source)
                };
            case 'floor':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.floor(args.NUM.source)
                };
            case 'ceiling':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.ceil(args.NUM.source)
                };
            case 'sqrt':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.sqrt(args.NUM.source)
                };
            case 'sin':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: parseFloat(Math.sin((Math.PI * args.NUM.source) / 180).toFixed(10))
                };
            case 'cos':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: parseFloat(Math.cos((Math.PI * args.NUM.source) / 180).toFixed(10))
                };
            case 'tan':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: MathUtil.tan(args.NUM.source)
                };
            case 'asin':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: (Math.asin(args.NUM.source) * 180) / Math.PI
                };
            case 'acos':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: (Math.acos(args.NUM.source) * 180) / Math.PI
                };
            case 'atan':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: (Math.atan(args.NUM.source) * 180) / Math.PI
                };
            case 'ln':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.log(args.NUM.source)
                }
            case 'log':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.log(args.NUM.source) / Math.LN10
                };
            case 'e ^':
                return {
                    constant: true,
                    type: 1 /* NUMBER */,
                    result: Math.exp(args.NUM.source)
                };
            case '10 ^':
                return {
                    constant: true,
                    type: 2 /* NUMBER_NAN */,
                    result: Math.pow(10, args.NUM.source)
                }
        }

        switch (operator) {
        case 'abs':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.abs(${args.NUM.asNumber()})`
            };
        case 'floor':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.floor(${args.NUM.asNumber()})`
            };
        case 'ceiling':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.ceil(${args.NUM.asNumber()})`
            };
        case 'sqrt':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.sqrt(${args.NUM.asNumber()})`
            };
        case 'sin':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `parseFloat(Math.sin((Math.PI * ${args.NUM.asNumber()}) / 180).toFixed(10))`
            };
        case 'cos':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `parseFloat(Math.cos((Math.PI * ${args.NUM.asNumber()}) / 180).toFixed(10))`
            };
        case 'tan':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `MathUtil.tan(${args.NUM.asNumber()})`
            };
        case 'asin':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `(Math.asin(${args.NUM.asNumber()}) * 180) / Math.PI`
            };
        case 'acos':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `(Math.acos(${args.NUM.asNumber()}) * 180) / Math.PI`
            };
        case 'atan':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `(Math.atan(${args.NUM.asNumber()}) * 180) / Math.PI`
            };
        case 'ln':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.log(${args.NUM.asNumber()})`
            };
        case 'log':
            return {
                constant: false,
                type: 2 /* NUMBER_NAN */,
                result: `Math.log(${args.NUM.asNumber()}) / Math.LN10`
            };
        case 'e ^':
            return {
                constant: false,
                type: 1 /* NUMBER */,
                result: `Math.exp(${args.NUM.asNumber()})`
            };
        case '10 ^':
            return {
                constant: false,
                type: 1 /* NUMBER */,
                result: `Math.pow(10, ${args.NUM.asNumber()})`
            };
        }
        }
        return {
            constant: true,
            type: 1 /* NUMBER */,
            result: 0
        };
    }

    power (args) {
        return Math.pow(Cast.toNumber(args.NUM1), Cast.toNumber(args.NUM2));
    }

    bitand (args) {
        return Cast.toNumber(args.NUM1) & Cast.toNumber(args.NUM2);
    }

    bitor (args) {
        return Cast.toNumber(args.NUM1) | Cast.toNumber(args.NUM2);
    }

    bitxor (args) {
        return Cast.toNumber(args.NUM1) ^ Cast.toNumber(args.NUM2);
    }

    bitlsh (args) {
        return Cast.toNumber(args.NUM1) << Cast.toNumber(args.NUM2);
    }

    bitrsh (args) {
        return Cast.toNumber(args.NUM1) >> Cast.toNumber(args.NUM2);
    }

    bitursh (args) {
        return Cast.toNumber(args.NUM1) >>> Cast.toNumber(args.NUM2);
    }

    bitnot (args) {
        return ~Cast.toNumber(args.NUM1);
    }

    ge (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) >= 0;
    }

    le (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) <= 0;
    }

    nequals (args) {
        return Cast.compare(args.OPERAND1, args.OPERAND2) !== 0;
    }
    
    indexOf (args) {
        const {STRING, SUBSTRING, POS} = args;
        let index = Cast.toString(STRING).indexOf(Cast.toString(SUBSTRING));
        if (index === -1) return -1;
        for (let i = 0; i < Cast.toNumber(POS) - 1; i++) {
            index = Cast.toString(STRING).indexOf(Cast.toString(SUBSTRING), index + 1);
            if (index === -1) return -1;
        }
        return index + 1;
    }
}

module.exports = Scratch3OperatorsBlocks;
