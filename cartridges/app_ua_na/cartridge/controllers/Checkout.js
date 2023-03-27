'use strict';

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var server = require('server');
server.extend(module.superModule);

server.prepend(
    'Begin',
    server.middleware.https,
    consentTracking.consent,
    csrfProtection.generateToken,
    function (req, res, next) { // eslint-disable-line
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
        if (isAurusEnabled) {
            var safetyPayCheckoutSessionModel = require('*/cartridge/scripts/util/checkoutSessionHelper');
            if (safetyPayCheckoutSessionModel.hasSafetypayOrder()) {
                safetyPayCheckoutSessionModel.failSafetyPayOrder();
                res.redirect(require('dw/web/URLUtils').url('Checkout-Begin', 'stage', 'payment'));
            }
        }
        next();
    });

module.exports = server.exports();
