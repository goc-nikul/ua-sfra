'use strict';

var server = require('server');

server.post(
    'EligibleBasketForm',
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var URLUtils = require('dw/web/URLUtils');

        var currentBasket = BasketMgr.getCurrentBasket();
        var cart = currentBasket;

        var ineligibleForm = server.forms.getForm('ineligiblecart');

        if (ineligibleForm.keepitems.triggered === true) {
            require('int_shoprunner/cartridge/scripts/DeleteShopRunnerCookie').deleteCookie();
            req.session.custom.keepItems = true; // eslint-disable-line

            res.json({
                error: false,
                continueUrl: URLUtils.https('Checkout-Begin')
            });
        } else if (ineligibleForm.removeitems.triggered === true) {
            require('int_shoprunner/cartridge/scripts/checkout/RemoveNonShopRunner').removeItems(cart);
            req.session.custom.removeItems = true; // eslint-disable-line

            res.json({
                error: false,
                continueUrl: URLUtils.https('Checkout-Begin')
            });
        }

        return next();
    }
);

/**
 * Called by ShopRunner Javascript after a successful login.
 * Write the token (or blank token) to the session and cookie
 * after re-verifying with ShopRunner.
 */
server.get(
    'ValidateToken',
    function (req, res, next) {
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var cart = currentBasket;
        var token;

        token = req.querystring.srtoken;

        var result = require('int_shoprunner/cartridge/scripts/ShopRunnerAuth').validate(token, cart);

        session.custom.freshSRLogin = result.signin;

        res.render('shoprunner/cookiesession', {
            ValidToken: result.validToken
        });

        return next();
    }
);

module.exports = server.exports();
