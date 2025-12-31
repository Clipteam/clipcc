const minilog = require('@turbowarp/nanolog');
minilog.enable();

module.exports = minilog('vm');
