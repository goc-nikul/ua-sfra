'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
const currentSite = require('../../dw/dw_system_Site').getCurrent();

let idmPreferences = {};
if (!empty(currentSite.preferences)) {
    idmPreferences = {
        isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
        updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
        oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
        clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
        clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
        jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
        jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
        storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
        redirectURI: currentSite.getCustomPreferenceValue('uaidmRedirectURI'),
        fbAppID: currentSite.getCustomPreferenceValue('facebookAppID')
    };
}

var IDMServiceStub = sinon.stub();
IDMServiceStub.returns({
    createIDMService: function () {
        return {
            // eslint-disable-next-line no-unused-vars
            call: function (params) {
                var result = {
                    status: 'OK',
                    object: {
                        text: '{"userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
                    }

                };
                return result;
            },
            setRequestMethod: function (method) {
                this[method] = method;
            },
            addParam: function (key, value) {
                this[key] = value;
            },
            addHeader: function (key, value) {
                this[key] = value;
            }
        };
    }
});


function proxyModel() {
    return proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
        '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
        'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
        'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
        '~/cartridge/scripts/idmPreferences.js': idmPreferences,
        'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
        'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
        'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
        'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
        '*/cartridge/scripts/formErrors': {},
        'server': {},
        'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
        'dw/customer/AuthenticationStatus': {
            ERROR_UNKNOWN: 'ERROR_UNKNOWN'
        },
        '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
        '*/cartridge/scripts/util/collections': require('../util/collections'),
        'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
        '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
    });
}

module.exports = proxyModel();
