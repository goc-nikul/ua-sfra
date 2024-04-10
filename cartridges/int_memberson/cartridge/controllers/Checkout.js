'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Begin', function (req, res, next) {
    var viewData = res.getViewData();
    if (!('error' in viewData) && !viewData.error) {
        var HookMgr = require('dw/system/HookMgr');
        var Locale = require('dw/util/Locale');
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig;
        if (HookMgr.hasHook('app.memberson.CountryConfig')) {
            countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        }
        if (!empty(countryConfig)) {
            viewData.membersonEnabled = countryConfig.membersonEnabled;
        }
        res.setViewData(viewData);
    }
    return next();
});

module.exports = server.exports();
