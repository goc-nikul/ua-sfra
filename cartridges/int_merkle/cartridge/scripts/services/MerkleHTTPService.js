'use strict';

var preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var MerkleLogger = require('dw/system/Logger').getLogger('merkle');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');

/**
 * @returns {string} - current language for instance 'en'
 */
function getCurrentLanguage() {
    return require('dw/util/Locale').getLocale(request.getLocale()).language; // eslint-disable-line
}

/**
 * @returns {string} - current Country
 */
function getCurrentCountry() {
    return require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
}

/**
 * @param {Object} params - additional parameters
 * @returns {Object} requestBody - builded request body
 */
function createJsonRequestBody(params) {
    if (empty(params.email)) {
        return MerkleLogger.error('MERKLE - no email provided!');
    }

    var emailSource = '';
    var currentCountry = '';
    var language = '';

    if ('country' in params && params.country) {
        currentCountry = params.country;
    }

    if (empty(currentCountry) || currentCountry === undefined) {
        currentCountry = session.custom.currentCountry || getCurrentCountry();
    }

    if ('lng' in params && params.lng) {
        language = params.lng;
    }

    var emailWebSourceCode = preferencesUtil.getJsonValue('emailWebSourceCode');
    if (!empty(params.email_source)) {
        emailSource = params.email_source;
    } else if (!empty(emailWebSourceCode) && currentCountry && emailWebSourceCode[currentCountry]) {
        emailSource = emailWebSourceCode[currentCountry];
    } else if (!empty(emailWebSourceCode) && emailWebSourceCode['default']) {  // eslint-disable-line
        emailSource = emailWebSourceCode['default'];// eslint-disable-line
    } else if (!empty(emailWebSourceCode) && !emailWebSourceCode['default'] && !emailWebSourceCode[currentCountry]) {  // eslint-disable-line
        emailSource = preferencesUtil.getValue('emailWebSourceCode');
    }

    if (empty(emailSource)) {
        MerkleLogger.error('MERKLE - missing configuration in Demandware');
    }
    var firstName = !empty(params.firstname) ? params.firstname : '';
    var lastName = !empty(params.lastname) ? params.lastname : '';

    if (empty(language) || language === undefined) language = getCurrentLanguage();
    if (empty(language) || language === undefined) language = 'en';

    var countryJSON = preferencesUtil.getJsonValue('emailWebSourceCodesJSON')[currentCountry];
    var country = countryJSON && countryJSON['countryCode'] ? countryJSON['countryCode'] : currentCountry; // eslint-disable-line
    var triggerName = country.toLowerCase() + '_welcome';

    var requestBody = {
        email: params.email,
        firstname: firstName,
        lastname: lastName,
        trigger_name: triggerName,
        country: country,
        language: language.toUpperCase(),
        email_source: emailSource,
        acceptcode: '',
        mapmy_optin: false,
        ecomm_optin: true
    };

    return requestBody;
}

/**
 * getSubscriptionStatus function create merkle subscription status service
 * @return {void}
 */
function getSubscriptionStatus() {
    return LocalServiceRegistry.createService('int_merkle.http.subscribe.status', {
        /**
         * @param {dw.svc.HTTPService} svc - service instance
         * @param {Object} params - additional params
         */
        createRequest: function (svc, params) {
            var securityKey = svc.configuration.credential.password;

            svc.setRequestMethod('GET');
            svc.addParam('sk', securityKey);
            svc.addParam('email', params.email);
            svc.addParam('a', 'c');
        },
        parseResponse: function (svc, client) {
            return client;
        },
        mockCall: function () {
            return null;
        }
    });
}

/**
 * getSubscriptionEmail function create merkle subscription email service
 * @return {void}
 */
function getSubscriptionEmail() {
    var serviceId = 'int_merkle.http.subscribe.email';
    return LocalServiceRegistry.createService(serviceId, {
        /**
         * @param {dw.svc.HTTPService} svc - service instance
         * @param {Object} params - additional params
         * @returns {string} - payload
         */
        createRequest: function (svc, params) {
            var clientId = svc.configuration.credential.user;
            var clientSecret = svc.configuration.credential.password;
            var payload = createJsonRequestBody(params);

            svc.setRequestMethod('POST');
            svc.addHeader('Content-type', 'application/json');
            svc.addHeader('client_id', clientId);
            svc.addHeader('client_secret', clientSecret);

            return JSON.stringify(payload);
        },
        parseResponse: function (svc, client) {
            var result = client.text ? JSON.parse(client.text) : null;

            var resObj = {};

            if (result) {
                if ('welcome_journey' in result && result.welcome_journey.status === 'success') {
                    resObj.MerkleStatus = 'success';
                    resObj.emailStatus = 'check_d2c_pub_list' in result ? result.check_d2c_pub_list.d2c_pub_list : null;
                    var checkD2cList = 'create_d2c_pub_list' in result.check_d2c_pub_list ? result.check_d2c_pub_list.create_d2c_pub_list : null;

                    if (checkD2cList && checkD2cList.sfmcStatusMessage === 'InvalidEmailAddress') {
                        resObj.invalidEmail = true;
                    }
                } else if ('welcome_journey' in result && result.welcome_journey.status === 'not applicable') {
                    resObj.MerkleStatus = 'success';
                    resObj.doubleOpt = 'doubleOpt' in result ? result.doubleOpt.status : null;
                }
            } else {
                MerkleLogger.error('Merkle signup error: {0}', result);
                resObj.MerkleStatus = 'error';
            }

            return resObj;
        },
        mockCall: function () {
            return null;
        }
    });
}
module.exports = {
    getSubscriptionStatus: getSubscriptionStatus,
    getSubscriptionEmail: getSubscriptionEmail
};
