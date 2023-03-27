'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIHelper.js', () => {

    var UACAPIHelper = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIHelper', {
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site')
    });

    var result;
    describe('Testing method parseGraphQLResponse', () => {

        var response = {
            text: '',
            statusCode: 200
        }
        var svc = {};

        it('Should return result object with orders as empty when error thrown in the function', () => {
            response.text = 'parse ERORR Text';
            result = UACAPIHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.orders, '', 'orders are not empty');
        });

        it('should return result object', () => {

            result = UACAPIHelper.parseGraphQLResponse(svc, response);
            assert.isDefined(result, 'result is undefined');
            assert.equal(result.orderCount, 0);
            assert.equal(result.orders, '', 'orders are not an empty');

            response.statusCode = 400;
            response.text = '{}';
            result = UACAPIHelper.parseGraphQLResponse(svc, response);
            assert.isDefined(result, 'result is undefined');
            assert.equal(result.orders, '', 'orders are not empty');
            response.statusCode = 200;

            var parseText = {};
            var data = '';
            parseText.data = data;
            response.text = JSON.stringify(parseText);

            result = UACAPIHelper.parseGraphQLResponse(svc, response);
            assert.isNotNull(result.orders);

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

            result = UACAPIHelper.parseGraphQLResponse(svc, response);
            assert.isNull(result.orders);

            var edges = ['order1', 'order2'];
            data.orders = { edges: edges };
            response.text = JSON.stringify(parseText);
            response.statusCode = 200;

            result = UACAPIHelper.parseGraphQLResponse(svc, response);

            assert.isNotNull(result.orders, 'orders is not null');
            assert.deepEqual(result.orders.edges, edges);
            assert.equal(result.orderCount, edges.length);
            assert.equal(result.errorMessage, '', 'errorMessage mismatch');

            parseText.errors = [{ message: 'test Error msg' }];
            response.text = JSON.stringify(parseText);

            result = UACAPIHelper.parseGraphQLResponse(svc, response);

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

            result = UACAPIHelper.parseGraphQLResponse(svc, response);

            assert.equal(result.orderCount, 1);
            assert.isNotNull(result.rma);
            assert.isTrue(result.rma);
            assert.isNotNull(result.returns);
            assert.isTrue(result.returns);
            assert.isNotNull(result.rmaDetails);
            assert.isTrue(result.rmaDetails);

            data.createStoreRma = false;
            data.createGuestStoreRma = true;
            assert.isTrue(result.rma);

            data.createGuestStoreRma = false;
            data.createGuestItemizedRma = true;
            assert.isTrue(result.rma);

            data.createGuestItemizedRma = false;
            data.createItemizedRma = true;
            assert.isTrue(result.rma);
        });
    });

    describe('Testing method getMockedUACAPITokenResponse', () => {

        it('result should be defined and object with valid parameter', () => {
            result = UACAPIHelper.getMockedUACAPITokenResponse();
            assert.isDefined(result, 'result is undefined');
            assert.isObject(result, 'result is not an object');
            assert.equal(result.expiresAt, '2022-02-11T14:52:54.000Z', 'Expiray date is not matching');
        });
    });

    describe('Testing method prepareUACAPITokenServiceRequest', () => {
        var requestBody;
        it('should return UACAPI Token data in requestBody', () => {

            requestBody = UACAPIHelper.prepareUACAPITokenServiceRequest();
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.isObject(requestBody, 'requestBody is not an object');
            assert.isNotNull(requestBody.client_id, 'client_id is not null');
            assert.isNotNull(requestBody.client_secret, 'client_secret is not null');
            assert.isNotNull(requestBody.grant_type, 'grant_type is not null');
            assert.isNotNull(requestBody.audience, 'audience is not null');

            var Site = require('../../../../mocks/dw/dw_system_Site');
            assert.equal(requestBody.client_id, Site.getCurrent().getCustomPreferenceValue('UACAPIClientId'));
            assert.equal(requestBody.client_secret, Site.getCurrent().getCustomPreferenceValue('UACAPIClientSecret'));
            assert.equal(requestBody.grant_type, 'client_credentials');
            assert.equal(requestBody.audience, Site.getCurrent().getCustomPreferenceValue('UACAPIClientAudience'));
        });
    });

    describe('Testing method getMockedUACAPIResponse', () => {

        var parseText;
        var mockResponseData;
        it('should return mockResponseData without any requestType when null,empty or invalid type passed to function', () => {

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse(null);
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isUndefined(parseText.data.createGuestItemizedRma);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isUndefined(parseText.data.createGuestItemizedRma);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('testType');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isUndefined(parseText.data.createGuestItemizedRma);
        });

        it('should return mockResponseData when valid requestType passed', () => {

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('history');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data.orders);
            assert.isAbove(parseText.data.orders.edges.length, 0);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('orderTrack');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.order);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('orderDetail');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.order);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('dashboard');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.orders);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('createItemizedRma');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.createItemizedRma);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('createGuestItemizedRma');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data, 'data not defined');
            assert.isDefined(parseText.data.createGuestItemizedRma, 'createGuestItemizedRma not defined');

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('createStoreRma');
            assert.isUndefined(mockResponseData.text);
            assert.deepEqual(mockResponseData, {});

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('createGuestStoreRma');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.createGuestStoreRma);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('rmas');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.rmas);

            mockResponseData = UACAPIHelper.getMockedUACAPIResponse('rma');
            assert.equal(mockResponseData.statusCode, 200);
            parseText = JSON.parse(mockResponseData.text);
            assert.isDefined(parseText.data);
            assert.isDefined(parseText.data.rma);

        });
    });

    describe('Testing method prepareGraphQLRequest', () => {

        var requestBody;
        var params = { id: 'testID' };
        it('should return empty requestBody when null or empty passed to function', () => {

            requestBody = UACAPIHelper.prepareGraphQLRequest(null, null);
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.isNull(requestBody.variables, 'variables is not null');
            assert.equal(requestBody.query, '', 'query is not empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('', '');
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.equal(requestBody.variables, '', 'variables is not null')
            assert.equal(requestBody.query, '', 'query is not empty');
        });

        it('should return  requestBody with variables  when params passed to function', () => {

            requestBody = UACAPIHelper.prepareGraphQLRequest('requestType', params);
            assert.equal(requestBody.variables.id, params.id, 'params mismatch');
            assert.equal(requestBody.query, '', 'query is not empty');

        });

        it('should return requestBody when valid requestType passed', () => {

            requestBody = UACAPIHelper.prepareGraphQLRequest('history', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('orderTrack', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('orderDetail', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('dashboard', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('createItemizedRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('createGuestItemizedRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('createStoreRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('createGuestStoreRma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('rmas', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');

            requestBody = UACAPIHelper.prepareGraphQLRequest('rma', params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.notEqual(requestBody.query, '', 'query is empty');
        });
    });
});