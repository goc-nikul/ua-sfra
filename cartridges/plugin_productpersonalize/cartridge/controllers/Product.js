'use strict';
var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    res.setViewData({
        isPersonalizationEnabled: require('*/cartridge/config/peronslizePreferences').isPersonalizationEnable
    });
    next();
});

module.exports = server.exports();
