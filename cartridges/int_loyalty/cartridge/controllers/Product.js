'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
    const URLUtils = require('dw/web/URLUtils');

    if (!loyaltyHelper.isLoyaltyEnabled()) {
        return next();
    }

    const isLoyaltyProduct = loyaltyHelper.isLoyaltyProduct(res.getViewData().product)
        || loyaltyHelper.isLoyaltyProduct(res.getViewData().masterProduct);


    // Redirect to login page if not logged in
    if (isLoyaltyProduct && !req.currentCustomer.profile) {
        const returnUrl = require('dw/web/URLUtils').url('Product-Show', 'pid', req.httpParameterMap.pid);
        res.redirect(URLUtils.url('Login-Show', 'returnUrl', returnUrl));
        return next();
    }

    // Redirect to enroll page if not a loyalty session
    if (isLoyaltyProduct && !loyaltyHelper.isLoyalCustomer()) {
        res.redirect(URLUtils.url('Page-Show', 'cid', loyaltyHelper.getMarketingLandingContentID()));
        return next();
    }

    return next();
});

module.exports = server.exports();
