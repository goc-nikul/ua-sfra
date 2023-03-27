/* eslint-disable consistent-return */
/* eslint-disable spellcheck/spell-checker */
/**
 * Provides IDME helper functions
 */

'use strict';

var Logger = require('dw/system/Logger');

var IDMEHelper = {
    parseTokenDataResponse: function (svc, response) {
        var tijson = response.text;
        var result = {
            token: '',
            scope: ''
        };

        if (response.statusCode !== 200 || empty(tijson)) {
            Logger.error(
                'parseTokenDataResponse execution failed: Unable to parse ID.me response, status code: "{0}"',
                response.statusCode
            );
            return result;
        }

        var tiuser;
        try {
            tiuser = JSON.parse(tijson);
        } catch (err) {
            Logger.error(
                'requestTokenData execution failed: Unable to parse ID.me response'
            );
            return result;
        }
        if (tiuser != null) {
            result.token = tiuser.access_token;
            result.scope = tiuser.scope; // scope: military/responder/etc...
            return result;
        }
        Logger.error(
			'requestTokenData execution failed: Invalid ID.me response'
		);
        return result;
    },
    parseValidationResponse: function (svc, response) {
        var tijson = response.text;

        if (response.statusCode !== 200 || empty(tijson)) {
            Logger.error(
                'parseValidationResponse execution failed: Unable to parse ID.me response, status code: "{0}"',
                response.statusCode
            );
            return '';
        }

        // the returned text should be JSON containing the id, verification status, and service affiliation status.
        // try parsing the JSON to pull these out.
        var tiuser;

        try {
            tiuser = JSON.parse(tijson);
        } catch (err) {
            Logger.error(
                'parseValidationResponse execution failed: Unable to parse ID.me response'
            );
            return '';
        }

        if (tiuser != null) {
            if (tiuser.verified) {
                return 'Verified';
            }
            return 'Not Verified';
        }
    },
    getMockedIDMEResponse: function () {
        return {
            token: 'mockToken',
            scope: 'MockScopeValue'
        };
    },
    getMockedIDMEValidationStatusResponse: function () {
        return 'MockValidationStatus';
    },
    removeVerifiedStatus: function () {
        var customerGroupMarker = session.custom.idmeVerified;
        if (customerGroupMarker) {
            delete session.custom[customerGroupMarker];
            delete session.custom.idmeVerified;
            delete session.custom.idmeScope;
        }
    }
};

module.exports = IDMEHelper;
