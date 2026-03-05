const ajv = require('ajv')();
const sb2Defs = require('./sb2_definitions.json');
const sb3Defs = require('./sb3_definitions.json');
const sb2Schema = require('./sb2_schema.json');
const sb3Schema = require('./sb3_schema.json');
const sprite2Schema = require('./sprite2_schema.json');
const sprite3Schema = require('./sprite3_schema.json');
ajv.addSchema(sb2Defs).addSchema(sb3Defs);

module.exports = function (isSprite, input, callback) {
    const validateSb2 = ajv.compile(isSprite ? sprite2Schema : sb2Schema);
    const validateSb3 = ajv.compile(isSprite ? sprite3Schema : sb3Schema);

    const isValidSb2 = validateSb2(input);

    if (isValidSb2) {
        input.projectVersion = 2;
        return callback(null, input);
    }

    const isValidSb3 = validateSb3(input);
    if (isValidSb3) {
        input.projectVersion = 3;
        return callback(null, input);
    }

    const validationErrors = {
        validationError: 'Could not parse as a valid SB2 or SB3 project.',
        sb2Errors: validateSb2.errors,
        sb3Errors: validateSb3.errors
    };

    callback(validationErrors);
};
