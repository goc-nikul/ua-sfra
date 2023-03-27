'use strict';

var server = require('server');
var cache = require('*/cartridge/scripts/middleware/cache');

server.get('GetAllOptionsByPostalCode', cache.applyDefaultCache, function (req, res, next) {
    var isLegendSoftEnable = require('dw/system/Site').current.getCustomPreferenceValue('enableLegendSoft') || false;
    if (isLegendSoftEnable && req.querystring.postalcode) {
        var suggestions = require('*/cartridge/scripts/helpers/legendSoftHelpers').fetchAllOptions(req.querystring.postalcode);
        if (suggestions) {
            res.json(suggestions);
            return next();
        }
    }
    res.json({
        error: require('dw/web/Resource').msg('invalid.input', 'legendsoft', null)
    });
    return next();
});

module.exports = server.exports();
