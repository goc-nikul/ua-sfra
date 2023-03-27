'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

var FirstDataServiceStub = sinon.stub();
FirstDataServiceStub.returns({
    createAuthTokenService: function () {
        return {
            call: function () {

            }
        };
    },
    createGraphQLService: function () {
        return {
            // eslint-disable-next-line no-unused-vars
            call: function (params) {
                var serviceResponse = {
                    status: 'OK',
                    object: {
                        statusCode: 200
                    }
                };
                if (!Array.isArray(params.requestBody)) {
                    var cardNumber;
                    if (params.requestBody.variables.makePurchase && params.requestBody.variables.makePurchase.cardNumber) {
                        serviceResponse.object.text = '{"data":{"makePurchase":{"transactionNumber": "234567890"}, "giftCard":{"currentBalance":100,"cardNumber":7777007070034567,"cardClass":190}},"errors":[]}';
                    } else {
                        cardNumber = 'giftCard' in params.requestBody.variables ? params.requestBody.variables.giftCard.cardNumber : '7777007069967974';
                        if (cardNumber === '7777007069967974') {
                            serviceResponse.object.text = '{"data":{"giftCardData":{"cardNumber":7777007069967974,"pin":91260152,"currentBalance":100,"cardClass":190,"transactionNumber":712958},"activateGiftCard":true}}';
                        } else if (cardNumber === '7777007070034100') {
                            serviceResponse.object.text = '{"data":{"giftCard":{"currentBalance":100,"cardNumber":7777007070034100,"cardClass":190}},"errors":[]}';
                        } else if (cardNumber === '7777007070034050') {
                            serviceResponse.object.text = '{"data":{"giftCard":{"currentBalance":50,"cardNumber":7777007070034050,"cardClass":190}},"errors":[]}';
                        } else if (cardNumber === '7777007070034150') {
                            serviceResponse.object.text = '{"data":{"giftCard":{"currentBalance":150,"cardNumber":7777007070034150,"cardClass":190}},"errors":[]}';
                        } else {
                            serviceResponse.object.text = '{"data":{"giftCard":{"currentBalance":100,"cardNumber":7777007070034567,"cardClass":190}},"errors":[]}';
                        }
                    }
                } else {
                    serviceResponse.object.text = '[{"data":{"voidPurchase":"23123423423423", "makePurchase":true, "giftCard":{"cardNumber":"7777007070034567","pin":"49229659","currentBalance":100,"cardClass":190,"transactionNumber":"715931"}}}]';
                }
                return serviceResponse;
            }
        };
    }
});

var firstDataAuthTokenHelperStub = sinon.stub();
firstDataAuthTokenHelperStub.returns({
    getValidToken: function () {
        return {
            accessToken: 'sadsfdsgfdgfdgdss'
        };
    }
});

function proxyModel() {
    return proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataHelper', {
        '~/cartridge/scripts/firstDataPreferences': {
            clientId: '3245325353253',
            clientSecret: 'ewrwr44243534',
            audience: 'https://commerce.api.ua.com',
            grantType: 'client_credentials',
            authHostname: 'https://ua-ecomm-staging.auth0.com/oauth/token',
            graphQLApiUrl: 'https://api-integration.ecm-external.us.ua.dev/shop/graphql',
            maxGiftcards: '2'
        },
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        '~/cartridge/scripts/firstDataAuthTokenHelper': firstDataAuthTokenHelperStub,
        '~/cartridge/scripts/services/firstDataService': new FirstDataServiceStub()
    });
}

module.exports = proxyModel();
