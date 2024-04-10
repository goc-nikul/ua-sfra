'use strict';

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var assert = require('chai').assert;
var sinon = require('sinon');

var getValidTokenStub = sinon.stub();
var serviceCallStub = sinon.stub();
var firstDataHelperMock;

describe('int_first_data/cartridge/scripts/firstDataHelper.js', () => {
    var firstDataHelper = require('../../../mocks/scripts/helpers/firstDataHelper');

    beforeEach(() => {
        getValidTokenStub.returns({ accessToken: 'sadsfdsgfdgfdgdss' });
    });

    var response;
    describe('Testing method: generateGiftCard', () => {
        var result;
        it('should return giftCardData as null when no parameter passed to the function', () => {
            result = firstDataHelper.generateGiftCard();
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
        });

        it('should generate the new gift card when params passed to the function', () => {
            result = firstDataHelper.generateGiftCard(12, 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isTrue(result.giftCardData);
        });

        it('should log the error when access token is not available or unknown exeption occured ', () => {
            firstDataHelperMock = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataHelper', {
                '~/cartridge/scripts/firstDataPreferences': {
                    authHostname: 'https://ua-ecomm-staging.auth0.com/oauth/token',
                    graphQLApiUrl: 'https://api-integration.ecm-external.us.ua.dev/shop/graphql',
                    maxGiftcards: '2'
                },
                'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
                'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
                '~/cartridge/scripts/firstDataAuthTokenHelper': function () { this.getValidToken = getValidTokenStub; },
                '~/cartridge/scripts/services/firstDataService': { createAuthTokenService() { return { call: serviceCallStub }; }, createGraphQLService() { return { call: serviceCallStub }; } }
            });

            getValidTokenStub.returns({});
            result = firstDataHelperMock.generateGiftCard(12, 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);

            getValidTokenStub.throws(new Error('unknown error'));
            result = firstDataHelperMock.generateGiftCard(12, 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
            getValidTokenStub.resetBehavior();
        });

        it('should return error message when error occured while genrating the gift card', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            result = firstDataHelperMock.generateGiftCard(12, 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
            getValidTokenStub.reset();
        });
    });

    describe('Testing method: checkBalance', () => {
        it('should return the error message when empty parameters passed to the function', () => {
            response = firstDataHelper.checkBalance('', '');
            assert.isDefined(response);
            assert.isFalse(response.success);
            assert.isDefined(response.errorMessage);
            assert.isNull(response.giftCardData);
        });

        it('should return the balance of the gift card', () => {
            response = firstDataHelper.checkBalance('7777007070034050', 'testpin');
            assert.isDefined(response);
            assert.isDefined(response.giftCardData.currentBalance);
            assert.isNotNull(response.giftCardData.currentBalance);
        });

        it('should call handleErrorResponseCodes when createGraphQLService service returns errors', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{"extensions":""}]}'
                }
            });
            response = firstDataHelperMock.checkBalance('7777007070034050', 'testpin');
            assert.isDefined(response);
            assert.isNull(response.giftCardData);
        });

        it('should log the error when access token is not available or unknown exeption occured', () => {
            getValidTokenStub.returns({ accessToken: '' });
            response = firstDataHelperMock.checkBalance('7777007070034050', 'testpin');
            assert.isDefined(response);
            assert.isNull(response.giftCardData);

            getValidTokenStub.throws(new Error('unknown error'));
            response = firstDataHelperMock.checkBalance('7777007070034050', 'testpin');
            assert.isDefined(response);
            assert.isNull(response.giftCardData);
        });
    });

    describe('Testing method: authorizeGiftCard', () => {
        it('should return the error message when empty parameter passed to the function', () => {
            response = firstDataHelper.authorizeGiftCard('', '', '', '');
            assert.isDefined(response);
            assert.isFalse(response.success);
            assert.isDefined(response.errorMessage);
            assert.isNull(response.giftCardData);
        });

        it('should log the error when access token is not available or unknown exeption occured', () => {
            getValidTokenStub.returns({ accessToken: '' });
            response = firstDataHelperMock.authorizeGiftCard('7777007070034567', 'testpin', 20, 'ord123', 'uatest@ua.com');
            assert.isDefined(response);
            assert.isNull(response.giftCardData);

            getValidTokenStub.throws(new Error('unknown error'));
            response = firstDataHelperMock.authorizeGiftCard('7777007070034567', 'testpin', 20, 'ord123', 'uatest@ua.com');
            assert.isDefined(response);
            assert.isNull(response.giftCardData);
            getValidTokenStub.reset();
        });

        it('should call handleErrorResponseCodes when createGraphQLService service response contains errors', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{}]}'
                }
            });
            response = firstDataHelperMock.authorizeGiftCard('7777007070034567', 'testpin', 20, 'ord123', 'uatest@ua.com');
            assert.isDefined(response);
            assert.isDefined(response.errorMessage);
            assert.isTrue(response.error);
        });

        it('should return error as true when service status is not OK', () => {
            serviceCallStub.returns({
                status: 'Error',
                object: {
                    statusCode: 500,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            response = firstDataHelperMock.authorizeGiftCard('7777007070034567', 'testpin', 20, 'ord123', 'uatest@ua.com');
            assert.isDefined(response);
            assert.isDefined(response.errorMessage);
            assert.isTrue(response.error);
        });
        it('should authorize the gift card when valid data is passed to the function ', () => {
            serviceCallStub.returns(serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"data":{"makePurchase":{"transactionNumber": "234567890"}, "giftCard":{"currentBalance":100,"cardNumber":7777007070034567,"cardClass":190}},"errors":[]}'
                }
            }));
            response = firstDataHelperMock.authorizeGiftCard('7777007070034567', 'testpin', 20, 'ord123', 'uatest@ua.com');
            assert.isDefined(response);
            assert.isDefined(response.errorMessage);
            assert.isTrue(response.error);
        });
    });

    describe('Testing Method : reverseGiftCardAmount', () => {
        it('should return the error message when empty parameter passed to the function', () => {
            response = firstDataHelper.reverseGiftCardAmount('', '', '');
            assert.isDefined(response);
            assert.isFalse(response.success);
            assert.isDefined(response.errorMessage);
            assert.isNull(response.giftCardData);
        });

        it('should log the error when access token is not available or unknown exeption occured', () => {
            getValidTokenStub.returns({ accessToken: '' });
            response = firstDataHelperMock.reverseGiftCardAmount('7777007070034567', 'testpin', 20);
            assert.isDefined(response);
            assert.isNull(response.giftCardData);

            getValidTokenStub.throws(new Error('unknown error'));
            response = firstDataHelperMock.reverseGiftCardAmount('7777007070034567', 'testpin', 20);
            assert.isDefined(response);
            assert.isNull(response.giftCardData);
            getValidTokenStub.reset();
        });

        it('should call handleErrorResponseCodes when createGraphQLService service response contains errors', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            response = firstDataHelperMock.reverseGiftCardAmount('7777007070034567', 'testpin', 20);
            assert.isDefined(response);
            assert.isDefined(response.errorMessage);
            assert.isFalse(response.success);
            assert.isNull(response.giftCardData);
        });

        it('should return error message when service status is not OK', () => {
            serviceCallStub.returns({
                status: 'Error',
                object: {
                    statusCode: 500,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            response = firstDataHelperMock.reverseGiftCardAmount('7777007070034567', 'testpin', 20);
            assert.isDefined(response);
            assert.isDefined(response.errorMessage);
            assert.isFalse(response.success);
        });
        it('should return response of gift card when valid data is passed to the function ', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"data":{"voidPurchase":{"transactionNumber": "234567890"}, "giftCard":{"currentBalance":100,"cardNumber":7777007070034567,"cardClass":190}},"errors":[]}'
                }
            });
            response = firstDataHelperMock.reverseGiftCardAmount('7777007070034567', 'testpin', 20);
            assert.isDefined(response);
            assert.isTrue(response.success);
            assert.isNotNull(response.giftCardData);
            assert.isNull(response.errorMessage);
        });
    });

    describe('Testing method: generateGiftCards', () => {
        var result;
        it('should return gift Cards Data as null when no parameter passed to the function', () => {
            result = firstDataHelper.generateGiftCards();
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
        });

        it('should generate the new gift card when params passed to the function', () => {
            result = firstDataHelper.generateGiftCards([12, 13], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isDefined(result.giftCardData);
        });

        it('should log the error when access token is not available or unknown exeption occured ', () => {
            getValidTokenStub.returns({});
            result = firstDataHelperMock.generateGiftCards([12, 13], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);

            getValidTokenStub.throws(new Error('unknown error'));
            result = firstDataHelperMock.generateGiftCards([12, 13], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
            getValidTokenStub.resetBehavior();
        });

        it('should return error message when error occured while genrating the gift card', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            result = firstDataHelperMock.generateGiftCards([12, 13], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardData);
            getValidTokenStub.reset();
        });
    });
    describe('Testing method: authorizeGiftCards', () => {
        var result;
        it('should return gift Cards Data as null when no parameter passed to the function', () => {
            result = firstDataHelper.authorizeGiftCards();
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
        });

        it('should generate the new gift card when params passed to the function', () => {
            result = firstDataHelper.authorizeGiftCards([
                {
                    gcNumber: '7777007069967974',
                    gcPin: '98614955',
                    amount: 10
                },
                {
                    gcNumber: '7777007069967975',
                    amount: 10.5
                }
            ], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isDefined(result.giftCardsData);
        });

        it('should log the error when access token is not available or unknown exeption occured ', () => {
            getValidTokenStub.returns({});
            result = firstDataHelperMock.authorizeGiftCards([
                {
                    gcNumber: '7777007069967974',
                    gcPin: '98614955',
                    amount: 10
                },
                {
                    gcNumber: '7777007069967975',
                    gcPin: '98614956',
                    amount: 10.5
                }
            ], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);

            getValidTokenStub.throws(new Error('unknown error'));
            result = firstDataHelperMock.authorizeGiftCards([
                {
                    gcNumber: '7777007069967974',
                    gcPin: '98614955',
                    amount: 10
                },
                {
                    gcNumber: '7777007069967975',
                    gcPin: '98614956',
                    amount: 10.5
                }
            ], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
            getValidTokenStub.resetBehavior();
        });

        it('should return error message when error occured while authorizing the gift card', () => {
            serviceCallStub.returns({
                status: 'OK',
                object: {
                    statusCode: 200,
                    text: '{"errors":[{"extensions":{"responseCode":500}}]}'
                }
            });
            result = firstDataHelperMock.authorizeGiftCards([
                {
                    gcNumber: '7777007069967974',
                    gcPin: '98614955',
                    amount: 10
                },
                {
                    gcNumber: '7777007069967975',
                    gcPin: '98614956',
                    amount: 10.5
                }
            ], 'ord123', 'uatest@ua.com');
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
            getValidTokenStub.reset();
        });
    });

    describe('Testing method: checkGiftCardsBalance', () => {
        var result;
        it('should return gift Cards Data as null when no parameter passed to the function', () => {
            result = firstDataHelper.checkGiftCardsBalance();
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
        });

        it('should log the error when access token is not available or unknown exeption occured ', () => {
            getValidTokenStub.returns({});
            result = firstDataHelperMock.checkGiftCardsBalance([{ gcNumber: '7777007069967974', gcPin: '98614955' }, { gcNumber: '7777007069967975', gcPin: '98614956' }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);

            getValidTokenStub.throws(new Error('unknown error'));
            result = firstDataHelperMock.checkGiftCardsBalance([{ gcNumber: '7777007069967974', gcPin: '98614955' }, { gcNumber: '7777007069967975', gcPin: '98614956' }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
            getValidTokenStub.resetBehavior();
        });

        it('should return the giftCardsData when valid parmater passed to the function', () => {
            result = firstDataHelperMock.checkGiftCardsBalance([{ gcNumber: '7777007069967974', gcPin: '98614955' }, { gcNumber: '7777007069967975' }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
        });
    });

    describe('Testing method: reverseGiftCardsAmount', () => {
        var result;
        it('should return gift Cards Data as null when no parameter passed to the function', () => {
            result = firstDataHelper.reverseGiftCardsAmount();
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
        });

        it('should log the error when access token is not available or unknown exeption occured ', () => {
            getValidTokenStub.returns({});
            result = firstDataHelperMock.reverseGiftCardsAmount([{ gcNumber: '7777007069967974', gcPin: '98614955' }, { gcNumber: '7777007069967975', gcPin: '98614956' }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);

            getValidTokenStub.throws(new Error('unknown error'));
            result = firstDataHelperMock.reverseGiftCardsAmount([{ gcNumber: '7777007069967974', gcPin: '98614955' }, { gcNumber: '7777007069967975', gcPin: '98614956' }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
            getValidTokenStub.resetBehavior();
        });

        it('should add the return amount to the giftcard when valid parmater passed to the function', () => {
            result = firstDataHelperMock.reverseGiftCardsAmount([{ gcNumber: '7777007069967974', gcPin: '98614955', amount: 10 }, { gcNumber: '7777007069967975', amount: 10.5 }]);
            assert.isDefined(result);
            assert.isNull(result.giftCardsData);
        });
    });

    describe('Testing Method: getAuthAccessToken', () => {
        var result;
        it('should return null and log the error when client credentials are not available', () => {
            result = firstDataHelperMock.getAuthAccessToken();
            assert.isDefined(result);
            assert.isNull(result);
        });

        it('should return authTokenService response when client data  is available', () => {
            firstDataHelperMock = proxyquire('../../../../cartridges/int_first_data/cartridge/scripts/firstDataHelper', {
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
                '~/cartridge/scripts/firstDataAuthTokenHelper': function () { this.getValidToken = getValidTokenStub; },
                '~/cartridge/scripts/services/firstDataService': { createAuthTokenService() { return { call: serviceCallStub }; }, createGraphQLService() { return { call: serviceCallStub }; } }
            });
            serviceCallStub.returns({ data: { accessToken: 'hgfahgfd23437' } });
            result = firstDataHelperMock.getAuthAccessToken();
            assert.isDefined(result);
            assert.isNotNull(result);
            assert.isDefined(result.data.accessToken);
        });
    });

    describe('Testing Method: getCachedGC', () => {
        var result;
        it('should return null when giftCards or giftCardsResponse are not presented in session.privacy', () => {
            result = firstDataHelper.getCachedGC();
            assert.isDefined(result);
            assert.isNull(result);
        });

        it('should return null when session does not contain gift card data passed to the function', () => {
            session.privacy.giftCardsResponse = '{"success":true,"errorMessage":null,"giftCardsData":[{"cardNumber":"111111111111111","currentBalance":50,"cardClass":190}]}';
            session.privacy.giftCards = '[{"gcNumber":"111111111111111","gcPin":"11111111"}]';
            var giftCards = [{gcNumber: '7777777777777777', gcPin: '77777777'}];
            result = firstDataHelper.getCachedGC(giftCards);
            assert.isDefined(result);
            assert.isNull(result);
        });

        it('should return the cached giftCardsResponse when session contain gift card data passed to the function', () => {
            session.privacy.giftCardsResponse = '{"success":true,"errorMessage":null,"giftCardsData":[{"cardNumber":"7777777777777777","currentBalance":50,"cardClass":190}]}';
            session.privacy.giftCards = '[{"gcNumber":"7777777777777777","gcPin":"11111111"}]';
            var giftCards = [{gcNumber: '7777777777777777', gcPin: '11111111'}];
            result = firstDataHelper.getCachedGC(giftCards);
            assert.isDefined(result);
            assert.isNotNull(result);
        });
    });
});

