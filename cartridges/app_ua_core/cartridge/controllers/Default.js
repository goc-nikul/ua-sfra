'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');
var cache = require('*/cartridge/scripts/middleware/cache');

server.extend(module.superModule);

server.append('Start', function (req, res, next) {
    var schemaHelper = require('*/cartridge/scripts/helpers/structuredDataHelper');
    var schemaData = schemaHelper.getHomePageSchema();
    res.setViewData({
        schemaData: schemaData,
        showLogin: req.querystring.login || false,
        showPasswordReset: req.querystring.passwordreset || false,
        showRegisterModal: req.querystring.showRegisterModal || false,
        canonicalUrl: URLUtils.abs('Home-Show')
    });
    next();
});

server.prepend(
    'Start',
    cache.applyPromotionSensitiveCache,
    function (req, res, next) {
        next();
    }
);

module.exports = server.exports();
