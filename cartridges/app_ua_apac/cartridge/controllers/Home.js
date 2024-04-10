'use strict';

var server = require('server');
var Resource = require('dw/web/Resource');

server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

    if (PreferencesUtil.getValue('isNaverSSOEnabled') && (req.querystring.login || req.querystring.showRegisterModal) && req.querystring.isNaverSSOFail) {
        var validateProfile = req.querystring.isNaverSSOFail;
        var validateProfileMsg;
        if (validateProfile === 'true') {
            var errorCodes = {
                ERROR_PASSWORD_MISMATCH: 'error.message.facebook.authFail',
                ERROR_UNKNOWN: 'error.message.error.unknown',
                SERVICE_UNAVAILABLE: 'error.message.login.form', // error message to display if IDM service is unavailable
                ERROR_INVALID_JWT: 'error.message.login.form', // error message to display if JWT is incorrect
                default: 'error.message.login.form'
            };
            var errorMessageKey = errorCodes[req.querystring.authStatus] || errorCodes.default;
            var errorMessage = Resource.msg(errorMessageKey, 'login', null);
            validateProfileMsg = errorMessage;
        }
        if (req.querystring.destinationPage === 'showRegisterModal') {
            res.setViewData({
                showRegisterModal: req.querystring.showRegisterModal || false,
                validateProfileObj: validateProfileMsg
            });
        } else {
            res.setViewData({
                showLogin: req.querystring.login || false,
                validateProfileObj: validateProfileMsg
            });
        }
    }

    if (req.querystring.initiateMobileAuth) {
        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        if (mobileAuthProvider.mobileAuthEnabled) {
            res.setViewData({
                initiateMobileAuth: true
            });
        }
    }
    next();
});

module.exports = server.exports();
