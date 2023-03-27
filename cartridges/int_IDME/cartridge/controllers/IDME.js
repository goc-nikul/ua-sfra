/* eslint-disable spellcheck/spell-checker */
'use strict';

var server = require('server');
var IDMEclient = require('*/cartridge/scripts/IDMEclient');
var Logger = require('dw/system/Logger');

server.get('CustomPromos', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var promos = basket.getPriceAdjustments().toArray().map(function (promo) {
        return { id: promo.promotionID, text: promo.lineItemText };
    });
    res.render('/customPromosList', { promosArray: promos, isEmpty: promos.length < 1 });
    next();
});

server.get('RemoveVerifiedStatus', function (req, res, next) {
    if (session.custom.idmeVerified) {
        var IDMEHelper = require('*/cartridge/scripts/util/IDMEHelper');
        IDMEHelper.removeVerifiedStatus();
        res.json({ result: 'ok' });
    } else {
        Logger.error('IDME-RemoveVerifiedStatus execution failed: customer verification marker was not found in the session');
        res.json({ result: 'error: customer verification marker was not found in the session' });
    }
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    var basketModel = new CartModel(currentBasket);
    res.json(basketModel);
    next();
});

server.get('RefreshSummary', function (req, res, next) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var Transaction = require('dw/system/Transaction');
    var CartModel = require('*/cartridge/models/cart');
    var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(currentBasket);
    });
    var basketModel = new CartModel(currentBasket);
    res.json(basketModel);
    res.json({
        analytics: {
            idmeVerified: session.custom.idmeVerified,
            idmeScope: session.custom.idmeScope
        }
    });
    next();
});

server.get('Return', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var URLUtils = require('dw/web/URLUtils');
    var clientID = PreferencesUtil.getValue('IDMEclientID');
    var clientSecret = PreferencesUtil.getValue('IDMEclientSecret');
    var redirectUri = URLUtils.https('IDME-Return');
    var apiTokenEndpointURI = PreferencesUtil.getValue('IDMEapiTokenEndpointURI');
    var apiValidationStatusEndpointURI = PreferencesUtil.getValue('IDMEapiValidationStatusEndpointURI');
    var params = req.querystring;
    var code = params.code;// code comes as a GET parameter when IDme makes redirect
    var responseToCustomerGroupMapping;
    var isRequestFailed = false;
    var customerGroupMarker;
    try {
        try {
            responseToCustomerGroupMapping = PreferencesUtil.getJsonValue('IDMEUnifiedCustomerGroupMappingJSON');
        } catch (e) {
            throw new Error('IDME-Return execution failed: Unable to parse responseToCustomerGroupMapping config');
        }
        var client = new IDMEclient({
            clientID: clientID,
            clientSecret: clientSecret,
            redirectUri: redirectUri,
            apiTokenEndpointURI: apiTokenEndpointURI,
            apiValidationStatusEndpointURI: apiValidationStatusEndpointURI,
            code: code
        });
        var validationResult = client.verify();

        var scope = validationResult.scope; // 'military';
        var validationStatus = validationResult.validationStatus; // 'Verified';
        if (!scope || !validationStatus) {
            throw new Error('IDME-Return execution failed: Unable to get validationResult');
        }
        customerGroupMarker = responseToCustomerGroupMapping[scope];
        session.custom[customerGroupMarker] = validationStatus;
        session.custom.idmeVerified = customerGroupMarker;
        session.custom.idmeScope = scope;
    } catch (e) {
        isRequestFailed = true;
        Logger.error('IDME-Return execution failed: {0}', e.message ? e.message : e);
    }
    if (!isRequestFailed) {
        res.render('/initialclientauthentication', {
            isRequestFailed: isRequestFailed,
            st: session.custom[customerGroupMarker],
            gr: customerGroupMarker
        });
    } else {
        res.render('/initialclientauthenticationError', {
            isRequestFailed: isRequestFailed,
            st: session.custom[customerGroupMarker],
            gr: customerGroupMarker
        });
    }

    next();
});

module.exports = server.exports();
