'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/session/klarnaPaymentsCreateSession.js file test cases', () => {
    var klarnaPaymentsApiContext = proxyquire('../../../../cartridges/int_klarna_payments/cartridge/scripts/common/klarnaPaymentsApiContext.js', {
        'dw/util/HashMap': require('../../../mocks/dw/dw_util_HashMap')
    });
    klarnaPaymentsApiContext.prototype.getFlowApiUrls = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/common/klarnaPaymentsApiContext.js', {
        'dw/util/HashMap': require('../../../mocks/dw/dw_util_HashMap')
    }).prototype.getFlowApiUrls;

    var klarnaPaymentsCreateSession = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/session/klarnaPaymentsCreateSession.js', {
        '*/cartridge/scripts/helpers/instorePickupStoreHelpers': {
            basketHasOnlyBOPISProducts: function () {
                return false;
            }
        },
        '*/cartridge/scripts/common/klarnaPaymentsHttpService': require('./mock/common/klarnaPaymentsHttpService'),
        '*/cartridge/scripts/common/klarnaPaymentsApiContext': klarnaPaymentsApiContext,
        '*/cartridge/scripts/payments/requestBuilder/session': require('./mock/payments/requestBuilder/session'),
        '*/cartridge/scripts/util/klarnaHelper': {
            clearSessionRef: function () {
                return;
            }
        },
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger')
    });

    const LineItemCtnr = require('../../../mocks/dw/dw_order_LineItemCtnr');
    let basket = new LineItemCtnr();
    basket.shipments = [basket.shipments.get(0)];

    let localeObject = {     "custom": {         "country": "US",         "credentialID": "klarna.http.uscredentials",         "kebCartEnabled": "true",         "kebCategory": "pay_over_time",         "kebCheckoutEnabled": "true",         "kebEnvironment": "playground",         "kebLabel": "Klarna",         "kebLibraryUrl": "https://x.klarnacdn.net/express-button/v1/lib.js",         "kebMCEnabled": "false",         "kebMerchantID": "123456",         "kebShape": "rect",         "kebTheme": "dark",         "klarnaLocale": "en-US",         "osmCartEnabled": "true",         "osmCartTagId": "credit-promotion-standard",         "osmDataInlineEnabled": "false",         "osmFooterEnabled": "false",         "osmHeaderEnabled": "false",         "osmInfoPageEnabled": "false",         "osmLibraryUrl": "https://na-library.playground.klarnaservices.com/lib.js",         "osmPDPEnabled": "true",         "osmPDPTagId": "credit-promotion-auto-size",         "osmUCI": "abcd-efgh-ijkl-mnop-qrstuv-wxyz"     } };

    it('Test createSession method', function () {
        localeObject.custom.credentialID = 'SUCCESS';
        var result = klarnaPaymentsCreateSession.createSession(basket, localeObject);
        assert.equal(true, result.success);
    });

    it('Test createSession method', function () {
        localeObject.custom.credentialID = 'ERROR';
        var result = klarnaPaymentsCreateSession.createSession(basket, localeObject);
        assert.equal(true, result.success);
        assert.equal(null, result.response);
    });
});
