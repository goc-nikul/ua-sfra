/* eslint-disable consistent-return */
/* eslint-disable spellcheck/spell-checker */
/**
 * Provides VIP helper functions
 */

'use strict';

var Logger = require('dw/system/Logger');
var VIPTokenLogger = Logger.getLogger('VIPTokenLogger', 'VIPTokenLogger');

var VIPCustomerHelper = {
    parseGraphQLResponse: function (svc, response) {
        var graphqljson = response.text;
        var result = {
            response: null,
            success: false,
            errorMessage: ''
        };

        if (response.statusCode !== 200 || empty(graphqljson)) {
            Logger.error(
                'parseGraphQLResponse execution failed: Unable to parse VIP response, status code: "{0}"',
                response.statusCode
            );
            return result;
        }

        var graphqluser;
        try {
            graphqluser = JSON.parse(graphqljson);
        } catch (err) {
            Logger.error(
                'parseGraphQLResponse execution failed: Unable to parse VIP response'
            );
            return result;
        }
        if (graphqluser && graphqluser.data) {
            result.response = graphqluser.data.account || graphqluser.data.authorize || graphqluser.data.capture || graphqluser.data.voidAuthorization || null;
            result.success = true;
        }
        if (graphqluser && graphqluser.errors) {
            result.success = false;
            result.errorMessage = graphqluser.errors.length > 0 ? graphqluser.errors[0].message : '';
        }

        return result;
    },
    getMockedVIPResponse: function (svc, client) {
        var result = {
            success: true,
            statusCode: 200,
            statusMessage: 'ok',
            errorMessage: ''
        };

        if (client && client.indexOf('query { account') !== -1) {
            result.text = '{ "data": { "account": { "availableBalance": 20000, "activeContract": { "promoGroup": "UA_ATHLETE_50" } } } }';
        } else if (client && client.indexOf('mutation authorize') !== -1) {
            result.text = '{ "data": { "authorize": { "id": "VHJhbnNhY3Rpb246MzYwNDI5Y2ItM2NkYy00MzQ2LTk3MmItYTI4ZDBmOTUwNmFj" } } }';
        } else if (client && client.indexOf('mutation capture') !== -1) {
            result.text = '{ "data": { "capture": { "id": "VHJhbnNhY3Rpb246NDQxNWJlOTEtM2FhYS00ZmI4LWE2ZTItZWYxNWZiMTE0NTkx", "createdAt": "2019-08-07T13:16:29.447Z" } } }';
        } else if (client && client.indexOf('mutation voidAuthorization') !== -1) {
            result.text = '{ "data": { "voidAuthorization": { "id": "VHJhbnNhY3Rpb246ZDhjYWM1MzItZjJhYy00MzFlLTk3NTQtYTc4YjAzZGVmY2Nm", "transactionType": "void_authorize", "amount": 100 } } }';
        } else {
            result.text = '{ "data": { "account": { "availableBalance": 20000, "activeContract": { "promoGroup": "UA_ATHLETE_50" } } } }';
        }
        return result;
    },
    prepareVIPTokenServiceRequest: function () {
        var Site = require('dw/system/Site');
        var requestBody = {};
        requestBody.client_id = Site.current.getCustomPreferenceValue('vipClientId') || 'Ul2grZEpKpCP8WIL8kPVQh605uRuDNeW';
        requestBody.client_secret = Site.current.getCustomPreferenceValue('vipClientSecret') || 'nPZoZa3E9WJ6Wqt79TjTVGoUkhlk_Qv_a-7z4Y5yMfjbhcsyga1EOBlMNsxuXGW6';
        requestBody.grant_type = 'client_credentials';
        requestBody.audience = Site.current.getCustomPreferenceValue('vipClientAudience') || 'https://commerce.api.ua.com';
        VIPTokenLogger.error('VIPCustomerHelper.js: Request- {0}', JSON.stringify(requestBody));

        return requestBody;
    },
    prepareGraphQLRequest: function (params) {
        var requestBody = {};
        var requestType = params.requestType;

        switch (requestType) {
            case 'account':
                requestBody.query = 'query($accountNumber: String!) { account(accountNumber: $accountNumber) { availableBalance activeContract { promoGroup } } }';
                requestBody.variables = params.variables;
                break;
            case 'authorize':
                requestBody.query = 'mutation authorize($input: AuthorizeInput!) { authorize(input: $input) { id contract { costCenter { orderReasonFMS: code } } } }';
                requestBody.variables = params.variables;
                break;
            case 'capture':
                requestBody.query = 'mutation capture($input: CaptureInput!) { capture(input: $input) { id createdAt } }';
                requestBody.variables = params.variables;
                break;
            case 'voidAuthorization':
                requestBody.query = 'mutation voidAuthorization($input: VoidAuthorizationInput!) { voidAuthorization(input: $input) { id transactionType amount } }';
                requestBody.variables = params.variables;
                break;
            default:
                requestBody.query = 'query($accountNumber: String!) { account(accountNumber: $accountNumber) { availableBalance activeContract { promoGroup } } }';
                requestBody.variables = params.variables;
        }
        return requestBody;
    }
};

module.exports = VIPCustomerHelper;
