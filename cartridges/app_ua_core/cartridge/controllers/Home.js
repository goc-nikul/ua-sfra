'use strict';

var server = require('server');
var URLUtils = require('dw/web/URLUtils');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
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

server.append('ErrorNotFound', function (req, res, next) {
    res.setStatusCode(410);
    next();
});

module.exports = server.exports();
