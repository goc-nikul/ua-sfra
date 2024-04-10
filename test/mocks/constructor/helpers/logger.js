// log stuff
function log(moduleName, type, message) {
    return '[' + type + '] ' + moduleName + ': ' + message;
}

module.exports.log = log;
