'use strict';

const assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_VIP/cartridge/scripts/util/VIPCustomerHelper.js', () => {

    var VIPCustomerHelper = proxyquire('../../../../../cartridges/int_VIP/cartridge/scripts/util/VIPCustomerHelper', {
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
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.response, null);
            assert.equal(result.success, false);
        });

        it('should return result object', () => {

            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.isNull(result.response);
            assert.isFalse(result.success);

            response.statusCode = 400;
            response.text = '{}';
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.isDefined(result, 'result is undefined');
            assert.equal(result.errorMessage, '', 'orders are not empty');
            response.statusCode = 200;

            var parseText = {};
            var data = '';
            parseText.data = data;
            response.text = JSON.stringify(parseText);

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
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.success, true);

            var edges = ['order1', 'order2'];
            data.orders = { edges: edges };
            response.text = JSON.stringify(parseText);
            response.statusCode = 200;
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.errorMessage, '', 'errorMessage mismatch');

            parseText.errors = [{ message: 'test Error msg' }];
            response.text = JSON.stringify(parseText);
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.errorMessage, 'test Error msg');
            assert.equal(result.success, false);

            data.guestOrder = true;
            data.createStoreRma = true;
            data.rmas = true;
            data.rma = true;
            response.text = JSON.stringify(parseText);
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.errorMessage, 'test Error msg');
            assert.equal(result.success, false);

            data.createStoreRma = false;
            data.createGuestItemizedRma = true;
            data.createItemizedRma = true;
            response.statusCode = 201;
            result = VIPCustomerHelper.parseGraphQLResponse(svc, response);
            assert.equal(result.errorMessage, '');
        });
    });

    describe('Testing method getMockedVIPResponse', () => {
        var response = {};
        var svc = {};
        it('result should be defined and object with valid parameter', () => {
            result = VIPCustomerHelper.getMockedVIPResponse();
            assert.isDefined(result.text, 'result is defined');
            assert.equal(result.success, true);
            assert.equal(result.statusCode, 200);
        });

        it('result should be defined and object with valid parameter, client equal account', () => {
            response = 'query { account';

            result = VIPCustomerHelper.getMockedVIPResponse(svc, response);
            assert.isDefined(result.text, 'result is defined');
            assert.equal(result.success, true);
            assert.equal(result.statusCode, 200);
        });

        it('result should be defined and object with valid parameter, client equal authorize', () => {
            response = 'mutation authorize';

            result = VIPCustomerHelper.getMockedVIPResponse(svc, response);
            assert.isDefined(result.text, 'result is defined');
            assert.equal(result.success, true);
            assert.equal(result.statusCode, 200);
        });

        it('result should be defined and object with valid parameter, client equal capture', () => {
            response = 'mutation capture';

            result = VIPCustomerHelper.getMockedVIPResponse(svc, response);
            assert.isDefined(result.text, 'result is defined');
            assert.equal(result.success, true);
            assert.equal(result.statusCode, 200);
        });

        it('result should be defined and object with valid parameter, client equal voidAuthorization', () => {
            response = 'mutation voidAuthorization';

            result = VIPCustomerHelper.getMockedVIPResponse(svc, response);
            assert.isDefined(result.text, 'result is defined');
            assert.equal(result.success, true);
            assert.equal(result.statusCode, 200);
        });
    });

    describe('Testing method prepareVIPTokenServiceRequest', () => {
        var requestBody;
        it('should return UACAPI Token data in requestBody', () => {
            requestBody = VIPCustomerHelper.prepareVIPTokenServiceRequest();
            assert.isDefined(requestBody.audience);
            assert.isDefined(requestBody.client_id);
            assert.isDefined(requestBody.client_secret);
            assert.isDefined(requestBody.grant_type);
        });
    });

    describe('Testing method prepareGraphQLRequest', () => {

        var requestBody;
        var params = { variables: '' };
        it('should return empty requestBody when null or empty passed to function', () => {

            requestBody = VIPCustomerHelper.prepareGraphQLRequest('');
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.isUndefined(requestBody.variables);
        });

        it('should return  requestBody with variables  when params passed to function', () => {
            params.variables = 'Test123';
            requestBody = VIPCustomerHelper.prepareGraphQLRequest(params);
            assert.isDefined(requestBody, 'requestBody is not defined');
            assert.equal(requestBody.variables, 'Test123');
        });

        it('should return requestBody when valid requestType passed', () => {
            params.variables = 'Test123';
            params.requestBody = 'account';
            requestBody = VIPCustomerHelper.prepareGraphQLRequest(params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.equal(requestBody.variables, 'Test123');

            params.requestType = 'authorize';
            requestBody = VIPCustomerHelper.prepareGraphQLRequest(params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.equal(requestBody.variables, 'Test123');

            params.requestType = 'capture';
            requestBody = VIPCustomerHelper.prepareGraphQLRequest(params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.equal(requestBody.variables, 'Test123');

            params.requestType = 'voidAuthorization';
            requestBody = VIPCustomerHelper.prepareGraphQLRequest(params);
            assert.isDefined(requestBody.query, 'query is not defined');
            assert.equal(requestBody.variables, 'Test123');
        });
    });
});
