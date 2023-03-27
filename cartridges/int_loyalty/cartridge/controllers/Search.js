'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    const URLUtils = require('dw/web/URLUtils');

    if (!loyaltyHelper.isLoyaltyEnabled()) {
        return next();
    }

    const isLoyaltyExclusiveCategory = loyaltyHelper.isLoyaltyCategory(res.getViewData().category);

    // Redirect to login page if not logged in
    if (isLoyaltyExclusiveCategory && !req.currentCustomer.profile) {
        const returnUrl = URLUtils.url('Search-Show', 'cgid', req.httpParameterMap.cgid);
        res.redirect(URLUtils.url('Login-Show', 'returnUrl', returnUrl));
        return next();
    }
    // Redirect to enroll page if not a loyalty session
    if (isLoyaltyExclusiveCategory && !loyaltyHelper.isLoyalCustomer()) {
        res.redirect(URLUtils.url('Page-Show', 'cid', loyaltyHelper.getMarketingLandingContentID()));
        return next();
    }

    return next();
});

module.exports = server.exports();
