'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_OIS/cartridge/scripts/UACAPI/helpers/util/OISHelper.js', () => {
    var OISHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/OISHelper', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
    });

    var result;
    describe('Testing method parseGraphQLResponse', () => {

        var response = {
            text: '',
            statusCode: 200
        };
        var svc = {};

        it('Should return result object with orders as empty when error thrown in the function', () => {
            response.text = 'parse ERORR Text';
            result = OISHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.orders, '', 'orders are not empty');
            assert.equal(result.orderCount, 0);
        });

        it('should return result object', () => {
            response.statusCode = 400;
            response.text = '{}';
            result = OISHelper.parseGraphQLResponse(svc, response);
            response.statusCode = 200;

            var parseText = {};
            var data = '';
            parseText.data = data;
            response.text = JSON.stringify(parseText);

            result = OISHelper.parseGraphQLResponse(svc, response);

            data = {
                orders: null,
                order: null,
                guestOrder: null,
                createItemizedRma: null,
                createGuestItemizedRma: null,
                createStoreRma: null,
                createGuestStoreRma: null,
                rmas: null,
                rma: null,

            };
            parseText.data = data;
            response.text = JSON.stringify(parseText);

            result = OISHelper.parseGraphQLResponse(svc, response);
            assert.isNull(result.orders);

            var edges = ['order1', 'order2'];
            data.orders = { edges: edges };
            response.text = JSON.stringify(parseText);
            response.statusCode = 200;

            result = OISHelper.parseGraphQLResponse(svc, response);

            assert.isNotNull(result.orders, 'orders is not null');
            assert.deepEqual(result.orders.edges, edges);
            assert.equal(result.orderCount, edges.length);
            assert.equal(result.errorMessage, '', 'errorMessage mismatch');

            parseText.errors = [{ message: 'test Error msg' }];
            response.text = JSON.stringify(parseText);

            result = OISHelper.parseGraphQLResponse(svc, response);

            assert.equal(result.errorMessage, 'test Error msg', 'errorMessage mismatch');
            assert.isTrue(result.error, 'error is false');
            assert.isNull(result.rma);
            assert.isNull(result.returns);
            assert.isNull(result.rmaDetails);

            data.guestOrder = true;
            data.createStoreRma = true;
            data.rmas = true;
            data.rma = true;

            response.text = JSON.stringify(parseText);

            result = OISHelper.parseGraphQLResponse(svc, response);

            assert.equal(result.orderCount, 1);
            assert.isTrue(result.rma);
            assert.isNotNull(result.returns);
            assert.isTrue(result.returns);
            assert.isTrue(result.rmaDetails);

            data.createStoreRma = false;
            data.createGuestStoreRma = true;
            result = OISHelper.parseGraphQLResponse(svc, response);
            assert.isTrue(result.rma);

            data.createGuestStoreRma = false;
            data.createGuestItemizedRma = true;
            result = OISHelper.parseGraphQLResponse(svc, response);
            assert.isTrue(result.rma);

            data.createGuestItemizedRma = false;
            data.createItemizedRma = true;
            result = OISHelper.parseGraphQLResponse(svc, response);
            assert.isTrue(result.rma);
        });
    });

    describe('Testing method getMockedOISResponse', () => {

        it('result should be defined and object with valid parameter', () => {
            result = OISHelper.getMockedOISResponse();
            assert.equal(result.expires_in, 'MockScopeValue');
            assert.equal(result.statusCode, 200);
            assert.equal(result.token, 'mockToken');
            assert.equal(result.statusMessage, 'Success');
        });
    });

    describe('Testing method prepareOISTokenServiceRequest', () => {
        var requestBody;
        it('should return UACAPI Token data in requestBody', () => {

            requestBody = OISHelper.prepareOISTokenServiceRequest();
            var expected = {
                audience: 'https://commerce.api.ua.com',
                client_id: 'ONDWXtzzKcz9DymMB8WJyTllmMTXKb0w',
                client_secret: 'fEtUcVbdzlegO76TSGSc3k8SCX4aWxniwRd6mB9S9OaNSGsdNy2uDWPsASDQPLPT',
                grant_type: 'client_credentials'
            };
            assert.deepEqual(requestBody.audience, expected.audience);
            assert.deepEqual(requestBody.client_id, expected.client_id);
            assert.deepEqual(requestBody.client_secret, expected.client_secret);
            assert.deepEqual(requestBody.grant_type, expected.grant_type);
        });
    });

    describe('Testing method getMockedOISResponse', () => {

        var parseText;
        var mockResponseData;
        it('should return mockResponseData without any requestType when empty or invalid type passed to function', () => {

            mockResponseData = OISHelper.getMockedOISResponse('');
            assert.equal(mockResponseData.statusCode, 200);

            mockResponseData = OISHelper.getMockedOISResponse('testType');
            assert.equal(mockResponseData.statusCode, 200);
        });

        it('should return mockResponseData when valid requestType passed', () => {

            mockResponseData = OISHelper.getMockedOISResponse('history');
            assert.equal(mockResponseData.statusCode, 200);
            assert.equal(mockResponseData.expires_in, 'MockScopeValue');
            assert.equal(mockResponseData.token, 'mockToken');
        });
    });

    describe('Testing method prepareGraphQLRequest', () => {

        var requestBody;
        var params = { id: 'testID' };
        it('should return empty requestBody when null or empty passed to function', () => {

            requestBody = OISHelper.prepareGraphQLRequest(null, null);
            assert.equal(requestBody.query, '');
            assert.equal(requestBody.variables, null);

            requestBody = OISHelper.prepareGraphQLRequest('', '');
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.equal(requestBody.variables, '', 'variables is not null')
            assert.equal(requestBody.query, '', 'query is not empty');
        });

        it('should return  requestBody with variables  when params passed to function', () => {

            requestBody = OISHelper.prepareGraphQLRequest('requestType', params);
            assert.equal(requestBody.variables.id, params.id, 'params mismatch');
            assert.equal(requestBody.query, '', 'query is not empty');
        });

        it('should return requestBody when valid requestType passed', () => {

            requestBody = OISHelper.prepareGraphQLRequest('history', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('orderTrack', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('orderDetail', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('dashboard', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('createItemizedRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('createGuestItemizedRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('createStoreRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('createGuestStoreRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('rmas', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = OISHelper.prepareGraphQLRequest('rma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');
        });
    });
});