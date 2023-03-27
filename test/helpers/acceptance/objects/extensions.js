var path = require('path');

module.exports.Test = require('./testing/factory');

// Register all extensions and testing instances here.
module.exports = {
    client: [
        path.resolve(__dirname, 'client/types/abstract.js'),
        path.resolve(__dirname, 'client/types/component.js')
    ],
    typesMap: {
        component: require('./testing/types/component')
    }
};
