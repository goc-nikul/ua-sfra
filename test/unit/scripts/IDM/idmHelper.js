'use strict';
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const { assert } = require('chai');
const M = require('minimatch');
var sinon = require('sinon');
const currentSite = require('../../../mocks/dw/dw_system_Site').getCurrent();

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
        fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
        accountLinksDomain: 'domain'
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
                        text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

describe('plugin_ua_idm/cartridge/scripts/idmHelper', () => {
    var idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
        '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
        'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
        '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers'),
        'dw/util/UUIDUtils': {
            createUUID: function () {
                return 'UUID';
            }
        }
    });

    it('Testing getAccessToken', () => {
        var result = idmHelper.getAccessToken('grantType', 'code');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing getAccessToken --> grantType=refresh_token', () => {
        var result = idmHelper.getAccessToken('refresh_token', 'code');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing updateSizePreferences', () => {
        var result = idmHelper.updateSizePreferences('userID', {}, 'accessToken');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing updateIDMLocale', () => {
        var result = idmHelper.updateIDMLocale('userID', 'localeID', 'accessToken');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing customerInfo', () => {
        var result = idmHelper.customerInfo('accessToken');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing customerLoyaltyInfo', () => {
        var result = idmHelper.customerLoyaltyInfo('accessToken');
        assert.isNotNull(result);
        assert.equal(result.code, 200);
    });

    it('Testing updateTokenOnLogin', () => {
        var authenticatedCustomer = {
            profile: {
                custom: {}
            }
        };

        var authenticateCustomerResult = {
            accessToken: {},
            refreshToken: {},
            expiresIn: 1
        };
        var result = idmHelper.updateTokenOnLogin(authenticatedCustomer, authenticateCustomerResult);
        assert.isNotNull(result);
    });

    it('Testing authenticateCustomer', () => {
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isTrue(result.tokenSuccess);
    });

    it('Testing updateCurrentCustomerInfo', () => {
        var customerProfile = {
            describe: function () {
                return {
                    getSystemAttributeDefinition: function () {
                        return {
                            getValues: function () {
                                return {
                                    toArray: function () {
                                        return [
                                            {
                                                getDisplayValue: function () {
                                                    return 'male';
                                                }
                                            }
                                        ];
                                    }
                                };
                            }
                        };
                    }
                };
            },
            custom: {
                countryDialingCode: '+22'
            },
            setFirstName: function () {
                return {};
            },
            setSecondName: function () {
                return {};
            },
            setLastName: function () {
                return {};
            },
            setEmail: function () {
                return {};
            },
            setBirthday: function () {
                return {};
            },
            setGender: function () {
                return {};
            },
            setPhoneHome: function () {
                return {};
            }
        };
        var externalProfile = {
            profile: {
                employee: 'employee',
                preferences: {},
                birthdate_obj: {
                    month: 1,
                    day: 2,
                    year: 2000
                },
                firstName: 'firstName',
                lastName: 'lastName',
                gender: 'male',
                email: 'email',
                custom: {
                    loyaltyID: 'loyaltyID'
                },
                phone: '1234-11111',
                location: {
                    postalCode: '11111'
                }
            },
            loyaltyStatus: {},
            loyaltyStatusDate: '111',
            email: 'email',
            loyaltyID: 'loyaltyID',
            gender: {},
            emails: ['testemail@gmail.com']
        };
        global.request.locale = 'es_MX';
        var result = idmHelper.updateCurrentCustomerInfo(customerProfile, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing updateCurrentCustomerInfo --> Test in case empty externalProfile.email', () => {
        var customerProfile = {
            describe: function () {
                return {
                    getSystemAttributeDefinition: function () {
                        return {
                            getValues: function () {
                                return {
                                    toArray: function () {
                                        return [
                                            {
                                                getDisplayValue: function () {
                                                    return 'male';
                                                }
                                            }
                                        ];
                                    }
                                };
                            }
                        };
                    }
                };
            },
            custom: {
                countryDialingCode: '+22'
            },
            setFirstName: function () {
                return {};
            },
            setSecondName: function () {
                return {};
            },
            setLastName: function () {
                return {};
            },
            setEmail: function () {
                return {};
            },
            setBirthday: function () {
                return {};
            },
            setGender: function () {
                return {};
            },
            setPhoneHome: function () {
                return {};
            }
        };
        var externalProfile = {
            profile: {
                employee: 'employee',
                preferences: {},
                birthdate_obj: {
                    month: 1,
                    day: 2
                },
                firstName: 'firstName',
                lastName: 'lastName',
                gender: 'male',
                email: 'email',
                custom: {
                    loyaltyID: 'loyaltyID'
                },
                phone: '1234-11111',
                location: {
                    postalCode: '11111'
                }
            },
            loyaltyStatus: {},
            loyaltyStatusDate: '111',
            email: '',
            loyaltyID: 'loyaltyID',
            gender: {},
            emails: ['testemail@gmail.com']
        };
        global.request.locale = 'es_MX';
        var result = idmHelper.updateCurrentCustomerInfo(customerProfile, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing loginCustomer', () => {
        var externalProfile = {
            accountLinks: [
                {
                    domain: 'domain',
                    domainUserId: 'domainUserId'
                }
            ],
            profile: {
                domain: 'domain',
                domainUserId: 'domainUserId',
                sizePreferences: [{}]
            }
        };
        var result = idmHelper.loginCustomer(externalProfile, 'rememberMe', {});
        assert.isNotNull(result);
    });

    it('Testing createUser', () => {
        var profObj = {};
        var result = idmHelper.createUser('emailAddress', 'password', profObj);
        assert.isNotNull(result);
    });

    it('Testing getUserIDByEmail', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'OK',
                            object: {
                                text: '[{"domain":"UACF"}]'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var result = idmHelper.getUserIDByEmail('username', 'accessToken');
        assert.isNotNull(result);
    });

    it('Testing createUser --> service response return error', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        if (!empty(params) && JSON.parse(params).user.username === 'emailAddress') {
                            return {
                                status: 'error',
                                object: {
                                    text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
                                }

                            };
                        }
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var profObj = {};
        var result = idmHelper.createUser('emailAddress', 'password', profObj);
        assert.isNotNull(result);
    });

    it('Testing createSocialUser', () => {
        var createUserObj = {};
        var result = idmHelper.createSocialUser(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing createSocialUser --> in case response returned userId', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1111111","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var createUserObj = {};
        var result = idmHelper.createSocialUser(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing createSocialUser -> service response return error', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        if (!empty(params) && JSON.parse(params).domainUserId === 'AUTO') {
                            return {
                                status: 'error',
                                object: {
                                    text: '{"expires_in": "expires_in", "refresh_token":"refresh_token","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
                                }

                            };
                        }
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var createUserObj = {};
        var result = idmHelper.createSocialUser(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing createSocialUser ->Test Custom Exception', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        if (!empty(params) && JSON.parse(params).domainUserId === 'AUTO') {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"expires_in": expires_in, "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
                                }

                            };
                        }
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var createUserObj = {};
        var result = idmHelper.createSocialUser(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing updatePassword', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var customer = {
            profile: {
                credentials: {
                    setPassword: function () {
                        return {};
                    }
                }
            }
        };
        var res = {
            getViewData: function () {
                return {};
            },
            json: function () {
                return {};
            }
        };
        var result = idmHelper.updatePassword(res, customer);
        assert.isNotNull(result);
    });

    it('Testing updatePassword --> setPassword return error', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                current: {
                    getCustomPreferenceValue: function () {
                        return {};
                    }
                }
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {
                getFormErrors: function () {
                    return {};
                }
            },
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                sendEmail: function () {
                    return {};
                },
                emailTypes: {}
            }
        });
        var customer = {
            profile: {
                credentials: {
                    setPassword: function () {
                        return {
                            error: true
                        };
                    }
                }
            }
        };
        var res = {
            getViewData: function () {
                return {
                    profileForm: {
                        login: {
                            currentpassword: {}
                        }
                    }
                };
            },
            json: function () {
                return {};
            }
        };
        var result = idmHelper.updatePassword(res, customer);
        assert.isNotNull(result);
    });

    it('Testing verifyNewPasswordIDMAccount --> user_id exist in createUserResponse', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"user_id": "user_id", "expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers'),
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var createUserObj = {};
        var result = idmHelper.verifyNewPasswordIDMAccount(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing passwordReset --> Test Custom Exception', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
            'dw/system/Logger': {
                getLogger: function () {
                    return {};
                }
            },
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers'),
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var result = idmHelper.passwordReset('email', 'clientToken');
        assert.isNotNull(result);
    });

    it('Testing verifyNewPasswordIDMAccount --> Test Custom Exception', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
            'dw/system/Logger': {
                getLogger: function () {
                    return {};
                }
            },
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers'),
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var createUserObj = {};
        var result = idmHelper.verifyNewPasswordIDMAccount(createUserObj);
        assert.isNotNull(result);
    });

    it('Testing updateNewPasswordIDMAccount --> Test Custom Exception', () => {

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
            'dw/system/Logger': {
                getLogger: function () {
                    return {};
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var result = idmHelper.updateNewPasswordIDMAccount('token', 'newPassword');
        assert.isNotNull(result);
    });

    it('Testing updateProfile', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var externalProfile = {
            profile: null,
            emails: {
                'aa@gmail.com': { primary: {} }
            }
        };
        var customer = {
            getProfile: function () {
                return {
                    custom: {},
                    credentials: {
                        setPassword: function () {
                            return {
                                error: false
                            };
                        },
                        setLogin: function () {
                            return {};
                        }
                    },
                    describe: {
                        getSystemAttributeDefinition: function () {
                            return {
                                getValues: function () {
                                    return {
                                        toArray: function () {
                                            return [
                                                {
                                                    getDisplayValue: function () {
                                                        return 'male';
                                                    }
                                                }
                                            ];
                                        }
                                    };
                                }
                            };
                        }
                    },
                    setFirstName: function () {
                        return {};
                    },
                    setSecondName: function () {
                        return {};
                    },
                    setLastName: function () {
                        return {};
                    },
                    setEmail: function () {
                        return {};
                    },
                    setBirthday: function () {
                        return {};
                    },
                    setPhoneHome: function () {
                        return {};
                    },
                    setGender: function () {
                        return {};
                    }
                };
            }
        };
        var res = {
            getViewData: function () {
                return {
                    profileForm: {
                        login: {
                            password: {}
                        }
                    }
                };
            },
            json: function () {
                return {};
            }
        };
        global.session.privacy = {};
        var result = idmHelper.updateProfile(res, customer, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing updateProfile --> setPassword return an error ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {
                getFormErrors: function () {
                    return {};
                }
            },
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var externalProfile = {
            profile: null,
            emails: {
                'aa@gmail.com': { primary: {} }
            }
        };
        var customer = {
            getProfile: function () {
                return {
                    custom: {},
                    credentials: {
                        setPassword: function () {
                            return {
                                error: true
                            };
                        },
                        setLogin: function () {
                            return {};
                        }
                    },
                    describe: {
                        getSystemAttributeDefinition: function () {
                            return {
                                getValues: function () {
                                    return {
                                        toArray: function () {
                                            return [
                                                {
                                                    getDisplayValue: function () {
                                                        return 'male';
                                                    }
                                                }
                                            ];
                                        }
                                    };
                                }
                            };
                        }
                    },
                    setFirstName: function () {
                        return {};
                    },
                    setSecondName: function () {
                        return {};
                    },
                    setLastName: function () {
                        return {};
                    },
                    setEmail: function () {
                        return {};
                    },
                    setBirthday: function () {
                        return {};
                    },
                    setPhoneHome: function () {
                        return {};
                    },
                    setGender: function () {
                        return {};
                    }
                };
            }
        };
        var res = {
            getViewData: function () {
                return {
                    profileForm: {
                        login: {
                            password: {}
                        }
                    }
                };
            },
            json: function () {
                return {};
            }
        };
        global.session.privacy = {};
        var result = idmHelper.updateProfile(res, customer, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing updateProfile --> externalProfile.profile exist ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {
                getFormErrors: function () {
                    return {};
                }
            },
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var externalProfile = {
            profile: {
                gender: 1,
                phone: '222-11111',
                location: {},
                birthdate_obj: {
                    month: 1,
                    day: 1,
                    year: 2000
                }
            },
            emails: {
                'aa@gmail.com': { primary: {} }
            }
        };
        var customer = {
            getProfile: function () {
                return {
                    custom: {},
                    credentials: {
                        setPassword: function () {
                            return {
                                error: true
                            };
                        },
                        setLogin: function () {
                            return {};
                        }
                    },
                    describe: function () {
                        return {
                            getSystemAttributeDefinition: function () {
                                return {
                                    getValues: function () {
                                        return {
                                            toArray: function () {
                                                return [
                                                    {
                                                        getDisplayValue: function () {
                                                            return 1;
                                                        }
                                                    }
                                                ];
                                            }
                                        };
                                    }
                                };
                            }
                        };
                    },
                    setFirstName: function () {
                        return {};
                    },
                    setSecondName: function () {
                        return {};
                    },
                    setLastName: function () {
                        return {};
                    },
                    setEmail: function () {
                        return {};
                    },
                    setBirthday: function () {
                        return {};
                    },
                    setPhoneHome: function () {
                        return {};
                    },
                    setGender: function () {
                        return {};
                    }
                };
            }
        };
        var res = {
            getViewData: function () {
                return {
                    profileForm: {
                        login: {
                            password: {}
                        }
                    },
                    birthMonth: 1,
                    birthDay: 1,
                    birthYear: 2000
                };
            },
            json: function () {
                return {};
            }
        };
        global.session.privacy = {};
        var result = idmHelper.updateProfile(res, customer, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing updateProfile --> not valid email ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {
                getFormErrors: function () {
                    return {};
                }
            },
            'server': {
                forms: {
                    getForm: function () {
                        return {};
                    }
                }
            },
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                },
                sendAccountEditedEmail: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var externalProfile = {
            profile: null
        };
        var customer = {
            getProfile: function () {
                return {
                    custom: {},
                    credentials: {
                        setPassword: function () {
                            return {
                                error: false
                            };
                        },
                        setLogin: function () {
                            return null;
                        }
                    },
                    describe: function () {
                        return {
                            getSystemAttributeDefinition: function () {
                                return {
                                    getValues: function () {
                                        return {
                                            toArray: function () {
                                                return [
                                                    {
                                                        getDisplayValue: function () {
                                                            return 'male';
                                                        }
                                                    }
                                                ];
                                            }
                                        };
                                    }
                                };
                            }
                        };
                    },
                    setFirstName: function () {
                        return {};
                    },
                    setSecondName: function () {
                        return {};
                    },
                    setLastName: function () {
                        return {};
                    },
                    setEmail: function () {
                        return {};
                    },
                    setBirthday: function () {
                        return {};
                    },
                    setPhoneHome: function () {
                        return {};
                    },
                    setGender: function () {
                        return {};
                    }
                };
            }
        };
        var res = {
            getViewData: function () {
                return {
                    profileForm: {
                        login: {
                            password: {}
                        },
                        customer: {
                            email: {}
                        }
                    },
                    birthMonth: 1,
                    birthDay: 1
                };
            },
            json: function () {
                return {};
            }
        };
        global.session.privacy = {};
        var result = idmHelper.updateProfile(res, customer, externalProfile);
        assert.isNotNull(result);
    });

    it('Testing updateUser', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 1,
                phone: '11111',
                birthDay: 1,
                birthMonth: 1,
                birthYear: 2000
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = 'userId';
        var customer = {
            profile: {
                custom: {}
            }
        };
        var saveProfile = {};
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isTrue(result.updated);
    });

    it('Testing updateUser --> empty profileObj.customer.phone', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 2,
                phone: ''
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = 'userId';
        var customer = {
            profile: {
                custom: {}
            }
        };
        var saveProfile = {};
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isTrue(result.updated);
    });

    it('Testing updateUser --> empty session userId', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 2,
                phone: ''
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = '';
        var customer = {
            profile: {
                custom: {
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var saveProfile = {};
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isFalse(result.updated);
    });

    it('Testing updateUser --> empty session userId & saveProfile is null', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 2,
                phone: ''
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = '';
        var customer = {
            profile: {
                custom: {
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var saveProfile = null;
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isFalse(result.updated);
    });

    it('Testing loginCustomer --> getExternallyAuthenticatedCustomerProfile return null ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': require('../../../mocks/dw/dw_system_Logger'),
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': {
                getExternallyAuthenticatedCustomerProfile: function () {
                    return null;
                },
                createCustomer: function () {
                    return {
                        createExternalProfile: function () {
                            return {};
                        },
                        getProfile: function () {
                            return {
                                custom: {}
                            };
                        },
                        loginExternallyAuthenticatedCustomer: function () {
                            return {};
                        }
                    };
                }
            },
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers'),
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var externalProfile = {
            accountLinks: [],
            profile: {
                domain: 'domain',
                domainUserId: 'domainUserId',
                sizePreferences: [{}]
            }
        };
        var result = idmHelper.loginCustomer(externalProfile, 'rememberMe', {});
        assert.isNull(result);
    });

    it('Testing authenticateCustomer --> getAuthorizationCode return error', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer --> Test Custom Exception', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        }
                    };
                }
            },
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer --> Test Custom Exception for getIDMCredentials method', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        }
                    };
                }
            },
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
            '~/cartridge/scripts/jsrsasign': {},
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing getNewAccessTokenIfExpired', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var customer = {
            profile: {
                custom: {
                    idmAccessTokenExpiresIn: 1,
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var result = idmHelper.getNewAccessTokenIfExpired(customer, 'username');
        assert.isNotNull(result);
        assert.isTrue(result.tokenSuccess);
    });

    it('Testing getNewAccessTokenIfExpired --> tokenSuccess->false', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var customer = {
            profile: {
                custom: {
                    idmAccessTokenExpiresIn: 1,
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var result = idmHelper.getNewAccessTokenIfExpired(customer, 'username');
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing updateTokenOnLogin --> Test Custom Exception ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var authenticatedCustomer = {
            profile: {
                custom: {}
            }
        };

        var authenticateCustomerResult = {
            accessToken: {},
            refreshToken: {},
            expiresIn: {}
        };
        var result = idmHelper.updateTokenOnLogin(authenticatedCustomer, authenticateCustomerResult);
        assert.isNotNull(result);
    });

    it('Testing customerLoyaltyInfo --> Test Custom Exception ', () => {
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var result = idmHelper.customerLoyaltyInfo('accessToken');
        assert.isNotNull(result);
    });

    it('Testing updateUser --> empty session userId, token not Success', () => {
        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': {},
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers':{
                getPreferences: function () {
                    return {};
                }
            },
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 2,
                phone: ''
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = '';
        var customer = {
            profile: {
                custom: {
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var saveProfile = null;
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isFalse(result.updated);
    });

    it('Testing updateUser --> Test Custom Exception', () => {

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'OK',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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
        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
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
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': {},
            'dw/util/UUIDUtils': {
                createUUID: function () {
                    return 'UUID';
                }
            }
        });
        var profileObj = {
            customer: {
                email: 'email',
                gender: 2,
                phone: ''
            },
            login: {
                password: 'password'
            },
            profile: {
                custom: {}
            }
        };
        global.session.privacy = {};
        global.session.privacy.userId = 'usedid';
        var customer = {
            profile: {
                custom: {
                    idmRefreshToken: 'idmRefreshToken'
                }
            }
        };
        var saveProfile = null;
        var result = idmHelper.updateUser(profileObj, customer, saveProfile);
        assert.isNotNull(result);
        assert.isFalse(result.updated);
    });

    it('Testing authenticateCustomer -->Testing getRedirectURI ', () => {
        idmPreferences = {
            isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
            updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
            oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
            clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
            clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
            jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
            jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
            storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
            redirectURI: '',
            fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
            accountLinksDomain: 'domain'
        };

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'SERVICE_UNAVAILABLE',
                            object: {
                                text: '{expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        },
                        debug: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        timezoneOffset: 1
                    };
                },
                current: {
                    status: 'SITE_STATUS_PROTECTED'
                },
                SITE_STATUS_PROTECTED: 'SITE_STATUS_PROTECTED'
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer -->Testing getAuthorizationCode method and service response return code 500 ', () => {
        idmPreferences = {
            isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
            updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
            oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
            clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
            clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
            jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
            jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
            storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
            redirectURI: '',
            fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
            accountLinksDomain: 'domain'
        };

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            error: 500,
                            status: 'error',
                            object: {
                                text: '{expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        },
                        debug: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        timezoneOffset: 1
                    };
                },
                current: {
                    status: 'SITE_STATUS_PROTECTED'
                },
                SITE_STATUS_PROTECTED: 'SITE_STATUS_PROTECTED'
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer -->enableForcePasswordReset enabled', () => {
        idmPreferences = {
            isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
            updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
            oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
            clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
            clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
            jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
            jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
            storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
            redirectURI: '',
            fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
            accountLinksDomain: 'domain',
            enableForcePasswordReset: 'enableForcePasswordReset'
        };

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'error',
                            object: {
                                text: '{"expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "code":200, "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        },
                        debug: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        timezoneOffset: 1
                    };
                },
                current: {
                    status: 'SITE_STATUS_PROTECTED'
                },
                SITE_STATUS_PROTECTED: 'SITE_STATUS_PROTECTED'
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer -->isForcedPasswordReset return false', () => {
        idmPreferences = {
            isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
            updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
            oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
            clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
            clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
            jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
            jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
            storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
            redirectURI: '',
            fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
            accountLinksDomain: 'domain',
            enableForcePasswordReset: 'enableForcePasswordReset'
        };

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'error',
                            object: {
                                text: '{"error":"access_denied","reason": "100", "expires_in": "expires_in","code":200, "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        },
                        debug: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        timezoneOffset: 1
                    };
                },
                current: {
                    status: 'SITE_STATUS_PROTECTED'
                },
                SITE_STATUS_PROTECTED: 'SITE_STATUS_PROTECTED'
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });

    it('Testing authenticateCustomer --> getAuthorizationCode method --> code attibute missing in service response', () => {
        idmPreferences = {
            isIdmEnabled: currentSite.getCustomPreferenceValue('uaidmIsEnabled'),
            updateProfileOnLogin: currentSite.getCustomPreferenceValue('uaidmUpdateProfileOnLogin'),
            oauthProviderId: currentSite.getCustomPreferenceValue('uaidmOauthProviderId'),
            clientId: currentSite.getCustomPreferenceValue('uaidmClientId'),
            clientSecret: currentSite.getCustomPreferenceValue('uaidmClientSecret'),
            jwtSigningKeyId: currentSite.getCustomPreferenceValue('uaidmJwtSigningKeyId'),
            jwtSigningKey: currentSite.getCustomPreferenceValue('uaidmJwtSigningKey'),
            storefrontPassword: currentSite.getCustomPreferenceValue('uaidmSfccStorefrontPassword'),
            redirectURI: '',
            fbAppID: currentSite.getCustomPreferenceValue('facebookAppID'),
            accountLinksDomain: 'domain',
            enableForcePasswordReset: ''
        };

        IDMServiceStub.returns({
            createIDMService: function () {
                return {
                    // eslint-disable-next-line no-unused-vars
                    call: function (params) {
                        var result = {
                            status: 'error',
                            object: {
                                text: '{"error":"access_denied","reason": "100", "expires_in": "expires_in", "refresh_token":"refresh_token", "userId":"1234567890","access_token":"212324343543", "accountLinks":[{"domain":"ECOMM_NA", "domainUserId":"AUTO", "userDomain": "UACF"}]}'
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

        idmHelper = proxyquire('../../../../cartridges/plugin_ua_idm/cartridge/scripts/idmHelper', {
            '~/cartridge/scripts/services/idmService.js': new IDMServiceStub(),
            'dw/system/Logger': {
                getLogger: function () {
                    return {
                        error: function () {
                            return {};
                        },
                        debug: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/web/Cookie': require('../../../mocks/dw/dw_web_Cookie'),
            '~/cartridge/scripts/idmPreferences.js': idmPreferences,
            'dw/customer/CustomerMgr': require('../../../mocks/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction'),
            'dw/web/URLUtils': require('../../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        timezoneOffset: 1
                    };
                },
                current: {
                    status: 'SITE_STATUS_PROTECTED'
                },
                SITE_STATUS_PROTECTED: 'SITE_STATUS_PROTECTED'
            },
            'dw/util/StringUtils': require('../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/formErrors': {},
            'server': {},
            'dw/web/Resource': require('../../../mocks/dw/dw_web_Resource'),
            'dw/customer/AuthenticationStatus': {
                ERROR_UNKNOWN: 'ERROR_UNKNOWN'
            },
            '~/cartridge/scripts/jsrsasign': require('../../../../cartridges/plugin_ua_idm/cartridge/scripts/jsrsasign'),
            '*/cartridge/scripts/util/collections': require('../../../mocks/scripts/util/collections'),
            'dw/util/ArrayList': require('../../../mocks/scripts/util/dw.util.Collection'),
            '*/cartridge/scripts/helpers/accountHelpers': require('../../../unit/scripts/accountHelpers')
        });
        var socialInfo = {};
        var result = idmHelper.authenticateCustomer('username', 'password', socialInfo);
        assert.isNotNull(result);
        assert.isFalse(result.tokenSuccess);
    });
});
