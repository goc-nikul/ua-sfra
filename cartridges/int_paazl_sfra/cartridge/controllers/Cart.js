'use strict';

var server = require('server');
server.extend(module.superModule);

var Site = require('dw/system/Site');

server.append('Show', function (req, res, next) {
    // Check if Paazl is enable or not
    var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');

    res.setViewData({
        isPaazlEnabled: isPaazlEnabled
    });

    return next();
});

module.exports = server.exports();
