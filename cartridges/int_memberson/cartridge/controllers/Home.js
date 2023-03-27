'use strict';

var server = require('server');

server.extend(module.superModule);

var Resource = require('dw/web/Resource');
var HookMgr = require('dw/system/HookMgr');
var URLUtils = require('dw/web/URLUtils');

server.append('Show', function (req, res, next) {
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var validateProfile = req.querystring.validateProfile;
            var alreadyValidate = req.querystring.alreadyValidate;
            var validateProfileObj;
            var loginUrl = URLUtils.https('Login-Show');
            if (!empty(validateProfile)) {
                if (validateProfile) {
                    validateProfileObj = {
                        validationProfile: 'true',
                        validateMsg: Resource.msg('memberson.msg.successfullyvalidate.email.login', 'membersonGlobal', null)
                    };
                } else {
                    validateProfileObj = {
                        validationProfile: 'false',
                        validateMsg: Resource.msgf('memberson.msg.errorvalidate.email.login', 'membersonGlobal', null, loginUrl)
                    };
                }
            } else if (!empty(alreadyValidate) && alreadyValidate) {
                validateProfileObj = {
                    validationProfile: 'false',
                    validateMsg: Resource.msgf('memberson.msg.already.validate.email.login', 'membersonGlobal', null, loginUrl)
                };
            }
            res.setViewData({
                showLogin: req.querystring.login || false,
                validateProfileObj: JSON.stringify(validateProfileObj)
            });
        }
    }
    next();
});

module.exports = server.exports();
