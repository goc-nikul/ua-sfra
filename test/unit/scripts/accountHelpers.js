'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const Spy = require('../../helpers/unit/Spy');
var sinon = require('sinon');
let spy = new Spy();

class EmailProvider {
    constructor() {
        this.emailObj = {};
    }

    get(type, emailObj) {
        this.emailObj = emailObj;
        return this;
    }

    send() {
        return spy.use(this.emailObj);
    }
}

global.empty = (data) => {
    return !data;
};

global.request = {
    locale: 'en_US'
}

describe('app_ua_core/cartridge/scripts/helpers/accountHelpers', function() {
    let baseAccoutHelpers = proxyquire('../../../cartridges/storefront-reference-architecture/cartridges/app_storefront_base/cartridge/scripts/helpers/accountHelpers', {
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
            1: 'Account-Show',
            2: 'Checkout-Begin'
        }
    });

    let accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
        'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
        'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
        'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
        '*/cartridge/modules/providers': new EmailProvider(),
        '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
            1: 'Account-Show',
            2: 'Checkout-Begin',
            3: 'Account-EditProfile'
        },
        '*/cartridge/scripts/helpers/emailHelpers': {
            emailTypes: {
                registration: 1,
                passwordReset: 2,
                passwordChanged: 3,
                orderConfirmation: 4,
                accountLocked: 5,
                accountEdited: 6,
                possibleFraudNotification: 7,
                invoiceConfirmation: 8
            }
        },
        'dw/customer/CustomerMgr': require('../../mocks/dw/dw_customer_CustomerMgr'),
        '*/cartridge/scripts/idmHelper': require('../../mocks/scripts/helpers/idmHelper'),
        'dw/customer/AuthenticationStatus': {
            AUTH_OK: 'AUTH_OK'
        },
        'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
    });

    let user = {
        email: 'testEmail',
        firstName: 'testFirstName',
        lastName: 'testlastName'
    };

    it('Testing method: sendCreateAccountEmail', () => {
        spy.init();
        accoutHelpers.sendCreateAccountEmail(user);
        assert.equal(true, spy.called);
        assert.equal(1, spy.data.emailData.type);
    });

    it('Testing method: sendAccountEditedEmail', () => {
        spy.init();
        accoutHelpers.sendAccountEditedEmail(user);
        assert.equal(true, spy.called);
        assert.equal(6, spy.data.emailData.type);
    });

    it('Testing method: sendPasswordResetEmail', () => {
        user.profile = {
            email: 'testEmail',
            firstName: 'testFirstName',
            lastName: 'testlastName',
            credentials: {
                createResetPasswordToken: () => {
                    return 'token';
                }
            }
        };

        spy.init();
        accoutHelpers.sendPasswordResetEmail('testEmail', user);
        assert.equal(true, spy.called);
        assert.equal(2, spy.data.emailData.type);
    });

    /*
    it('Testing method: createIDMAccount', () => {
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isTrue(result.authCustomer.authenticated);
        assert.isTrue(result.authCustomer.registered);
    });*/

    it('Testing method: createSFCCAccount', () => {
        var result = accoutHelpers.createSFCCAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isTrue(result.authCustomer.registered);
    });

    it('Testing method: passwordResetIDMAccount', () => {
        var result = accoutHelpers.passwordResetIDMAccount('amedhegar@pfdsweb.com');
        assert.isTrue(result.status);
    });

    it('Testing method: passwordResetSFCCAccount', () => {
        var result = accoutHelpers.passwordResetSFCCAccount('amedhegar@pfdsweb.com');
        assert.isTrue(result.status);
        result = accoutHelpers.passwordResetSFCCAccount('amedhegar');
        assert.isFalse(result.status);
    });

    it('Testing method: verifyNewPasswordIDMAccount', () => {
        var result = accoutHelpers.verifyNewPasswordIDMAccount('token');
        assert.isTrue(result.status);
    });

    it('Testing method: verifyNewPasswordSFCCAccount', () => {
        var result = accoutHelpers.verifyNewPasswordSFCCAccount('token');
        assert.isTrue(result.status);
    });

    it('Testing method: updatePasswordIDMAccount', () => {
        var result = accoutHelpers.updatePasswordIDMAccount('token', 'newpassword');
        assert.isFalse(result.error);
    });

    it('Testing method: updatePasswordSFCCAccount', () => {
        var result = accoutHelpers.updatePasswordSFCCAccount('token', 'newpassword');
        assert.isFalse(result.error);
    });

    it('Testing method: getLoginRedirectURL', () => {
        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return '';
                    },
                    set: function() {
                        return '';
                    }
                }
            }
        };
        // No argsForQueryString
        var result = accoutHelpers.getLoginRedirectURL('1', req.session.privacyCache, true);
        assert.equal(result, 'someUrlAsStringAccount-EditProfile');

        var req = {
            session: {
                privacyCache: {
                    get: function() {
                        return 'test';
                    },
                    set: function() {
                        return '';
                    }
                }
            }
        };
        // New user with argsForQueryString
        var result = accoutHelpers.getLoginRedirectURL('1', req.session.privacyCache, true);
        assert.equal(result, 'someUrlAsStringAccount-EditProfile');

        // Existing user
        var result = accoutHelpers.getLoginRedirectURL('1', req.session.privacyCache, false);
        assert.equal(result, 'someUrlAsStringAccount-Show');

        // Existing user no end-point
        var result = accoutHelpers.getLoginRedirectURL(false, req.session.privacyCache, false);
        assert.equal(result, 'someUrlAsStringAccount-Show');

        // Existing user invalid end-point
        var result = accoutHelpers.getLoginRedirectURL('0', req.session.privacyCache, false);
        assert.equal(result, 'someUrlAsStringAccount-EditProfile');
    });
    it('Testing method: createIDMAccount', () => {
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNotNull(result.errorMessage);
    });

    it('Testing method: createIDMAccount --> user created successfully', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': require('../../mocks/dw/dw_customer_CustomerMgr'),
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: true
                    }
                },
                authenticateCustomer: function () {
                    return {
                        tokenSuccess: 'tokenSuccess',
                        accessToken: 'accessToken',
                        status: 'AUTH_OK'
                    }
                },
                customerInfo: function () {
                    return 'customerInfo'
                },
                loginCustomer: function () {
                    return {}
                },
                updateTokenOnLogin: function () {
                    return {};
                }
            },
            'dw/customer/AuthenticationStatus': {
                AUTH_OK: 'AUTH_OK'
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNull(result.errorMessage);
    });

    it('Testing method: createIDMAccount --> customerAuth.status != Ok', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': require('../../mocks/dw/dw_customer_CustomerMgr'),
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: true
                    }
                },
                authenticateCustomer: function () {
                    return {
                        tokenSuccess: 'tokenSuccess',
                        accessToken: 'accessToken',
                        status: 'AUTH_ERROR'
                    }
                },
                customerInfo: function () {
                    return null;
                },
                loginCustomer: function () {
                    return {}
                },
                updateTokenOnLogin: function () {
                    return {};
                }
            },
            'dw/customer/AuthenticationStatus': {
                AUTH_OK: 'AUTH_OK'
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNotNull(result.errorMessage);
    });

    it('Testing method: createIDMAccount --> ERROR_DUPLICATE_CUSTOMER', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': require('../../mocks/dw/dw_customer_CustomerMgr'),
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: false,
                        errorCode: 'ERROR_DUPLICATE_CUSTOMER'
                    }
                },
                errorCodes: {
                    ERROR_DUPLICATE_CUSTOMER: 'ERROR_DUPLICATE_CUSTOMER'
                }
            },
            'dw/customer/AuthenticationStatus': {
                AUTH_OK: 'AUTH_OK'
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNotNull(result.errorMessage);
    });

    it('Testing method: createIDMAccount --> Default ERROR', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': require('../../mocks/dw/dw_customer_CustomerMgr'),
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: false,
                        errorCode: {
                            errorCode: 'ERROR'
                        }
                    }
                },
                errorCodes: 'ERROR'
            },
            'dw/customer/AuthenticationStatus': {
                AUTH_OK: 'AUTH_OK'
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createIDMAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNotNull(result.errorMessage);
    });

    it('Testing method: createSFCCAccount --> authenticateCustomerResult.status !== AUTH_OK', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': {
                authenticateCustomer: function () {
                    return {
                        status: 'AUTH_ERROR'
                    }
                },
                createCustomer: function () {
                    return {};
                }
            },
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: true
                    }
                },
                authenticateCustomer: function () {
                    return {
                        tokenSuccess: 'tokenSuccess',
                        accessToken: 'accessToken',
                        status: 'AUTH_ERROR'
                    }
                },
                createCustomer: function () {
                    return {};
                }
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createSFCCAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNull(result.authCustomer);
    });

    it('Testing method: createSFCCAccount --> loginCustomer.status returns null', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            'dw/customer/CustomerMgr': {
                authenticateCustomer: function () {
                    return {
                        status: 'AUTH_OK'
                    }
                },
                createCustomer: function () {
                    return {};
                },
                loginCustomer: function () {
                    return null;
                }
            },
            '*/cartridge/scripts/idmHelper':{
                createUser: function () {
                    return {
                        status: true
                    }
                },
                authenticateCustomer: function () {
                    return {
                        tokenSuccess: 'tokenSuccess',
                        accessToken: 'accessToken',
                        status: 'AUTH_ERROR'
                    }
                },
                createCustomer: function () {
                    return {};
                }
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.createSFCCAccount('amedhegar@pfdsweb.com', '1234567890');
        assert.isNull(result.authCustomer);
    });

    it('Testing method: passwordResetIDMAccount --> idmUserID Exist', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            '*/cartridge/scripts/idmHelper':{
                getAccessToken: function () {
                    return {
                        access_token: 'access_token'
                    };
                },
                getUserIDByEmail: function () {
                    return 'userIDByEmail';
                },
                updateIDMLocale: function () {
                    return {};
                },
                passwordReset: function () {
                    return {};
                }
            },
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.passwordResetIDMAccount('amedhegar@pfdsweb.com');
        assert.isUndefined(result.status);
    });

    it('Testing method: passwordResetIDMAccount --> access token Not Exist', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            '*/cartridge/scripts/idmHelper':{
                getAccessToken: function () {
                    return {
                        access_token: ''
                    };
                },
                getUserIDByEmail: function () {
                    return 'userIDByEmail';
                },
                updateIDMLocale: function () {
                    return {};
                },
                passwordReset: function () {
                    return {};
                }
            },
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.passwordResetIDMAccount('amedhegar@pfdsweb.com');
        assert.isFalse(result.status);
    });

    it('Testing method: passwordResetSFCCAccount ---> getCustomerByLogin returned null', () => {

        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            '*/cartridge/scripts/idmHelper':{},
            'dw/customer/CustomerMgr': {
                getCustomerByLogin: function () {
                    null;
                }
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        var result = accoutHelpers.passwordResetSFCCAccount('amedhegar@pfdsweb.com');
        assert.isFalse(result.status);
    });

    it('Testing method: passwordResetSFCCAccount ---> Custom Exception', () => {
        var stub = sinon.stub();
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            '*/cartridge/modules/providers': new EmailProvider(),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    registration: 1,
                    passwordReset: 2,
                    passwordChanged: 3,
                    orderConfirmation: 4,
                    accountLocked: 5,
                    accountEdited: 6,
                    possibleFraudNotification: 7,
                    invoiceConfirmation: 8
                }
            },
            '*/cartridge/scripts/idmHelper':{},
            'dw/customer/CustomerMgr': {
                getCustomerByLogin: stub
            },
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
        });
        stub.throws('custom error');
        var result = accoutHelpers.passwordResetSFCCAccount('amedhegar@pfdsweb.com');
        assert.isFalse(result.status);
    });

    it('Testing method: validateProfileFields', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return {};
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {}
        });
        var customerObj = {
            firstname: 'foo'
        };
        var result = accoutHelpers.validateProfileFields(customerObj);
        assert.isFalse(result.error);
    });

    it('Testing method: validateProfileFields --> error in profile fields', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return [{error: true}];
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {}
        });
        var customerObj = {
            firstname: 'foo'
        };
        var result = accoutHelpers.validateProfileFields(customerObj);
        assert.isTrue(result.error);
    });

    it('Testing method: validateAccountInputFields', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return [{error: true}];
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {};
                }
            }
        });
        var accountObj = {
            email: 'foo@gmail.com'
        };
        var result = accoutHelpers.validateAccountInputFields(accountObj);
        assert.isFalse(result.error);
    });

    it('Testing method: validateAccountInputFields --> error in email field', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return [{error: true}];
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {
                        email: 'error'
                    };
                }
            }
        });
        var accountObj = {
            email: 'foo@gmail.com'
        };
        var result = accoutHelpers.validateAccountInputFields(accountObj);
        assert.isTrue(result.error);
    });

    it('Testing method: validateAccountInputFields  --> error in loginEmail field', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return [{error: true}];
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {
                        loginEmail: 'error'
                    };
                }
            }
        });
        var accountObj = {
            email: 'foo@gmail.com'
        };
        var result = accoutHelpers.validateAccountInputFields(accountObj);
        assert.isTrue(result.error);
    });

    it('Testing method: validateAccountInputFields  --> error in firstName field', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return [{error: true}];
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {
                        firstName: 'error'
                    };
                }
            }
        });
        var accountObj = {
            email: 'foo@gmail.com'
        };
        var result = accoutHelpers.validateAccountInputFields(accountObj);
        assert.isTrue(result.error);
    });

    it('Testing method: validateLoginInputFields', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/checkout/checkoutHelpers': {
                checkEmptyEmojiNonLatinChars: function () {
                    return {};
                }
            },
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            '*/cartridge/scripts/utils/checkCrossSiteScript': {
                crossSiteScriptPatterns: function () {
                    return {};
                }
            }
        });
        var accountObj = {
            email: 'foo@gmail.com'
        };
        var result = accoutHelpers.validateLoginInputFields(accountObj);
        assert.isFalse(result.error);
    });

    it('Testing method: inputValidationField', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
        });
       var inputValidation = {
        customerAccountErrors: {
            firstname: {},
            lastname: {},
            email: {},
            newemail: {},
            newemailconfirm: {},
            phone: {},
            gender: {},
            birthDay: {},
            birthDay: {},
            postalCode: {},
            birthMonth: {}
        }
    };

    var profileForm = {
        customer: {
            firstname: {},
            lastname: {},
            email: {},
            newemail: {},
            newemailconfirm: {},
            phone: {},
            gender: {},
            birthDay: {},
            birthDay: {},
            postalCode: {},
            birthMonth: {}
        }
    }
        accoutHelpers.inputValidationField(inputValidation, profileForm);
    });

    it('Testing method: getPreferences', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
        });
        request.getHttpParameterMap = function () {
            return {
                getParameterNames: function () {
                    return {
                        contains: function() {
                            return 'male';
                        }
                    };
                }
            }
        }
        var profileObj = {
            customer : {
                preferences: {
                    genders: [{
                        htmlValue: 'male'
                    }],
                    activities:  [{
                        htmlValue: 'activity1'
                    }],
                }
            }
        }
        accoutHelpers.getPreferences(profileObj);
    });

    it('Testing method: updateProfileObj', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
        });
        var profileObj = {
            customer : {
                preferences: {
                    genders: [{
                        htmlValue: ''
                    }],
                    activities:  [{
                        htmlValue: ''
                    }],
                }
            }
        }
        var profileForm = {
            customer : {
                preferences: {
                    genders: [{
                        htmlValue: 'male'
                    }],
                    activities:  [{
                        htmlValue: 'activity1'
                    }],
                }
            }
        }
        accoutHelpers.updateProfileObj(profileForm, profileObj);
    });

    it('Testing method: getCardType', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
        });
        accoutHelpers.getCardType('VIC');
    });

    it('Testing method: getCardType --> card type not exist', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
        });
        accoutHelpers.getCardType('VIC111');
    });

    it('Testing method: getPasswordRequirements', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getPreferences: function () {
                            return {
                                getCustom: function () {
                                  return {
                                    useStrongPassword: 'useStrongPassword',
                                    strongPasswordRegex: 'strongPasswordRegex'
                                  }
                                }
                            }
                        },
                        getCustomPreferenceValue: function () {
                            return true;
                        }
                    }
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body:  {
                                markup: 'markup'
                            }
                        }
                    };
                }
            }
        });
        accoutHelpers.getPasswordRequirements();
    });

    it('Testing method: getPasswordRequirements --> useStrongPassword not enabled', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getPreferences: function () {
                            return {
                                getCustom: function () {
                                  return {
                                    useStrongPassword: 'useStrongPassword',
                                    strongPasswordRegex: 'strongPasswordRegex'
                                  }
                                }
                            }
                        },
                        getCustomPreferenceValue: function (param) {
                            return false;
                        }
                    }
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return {
                        custom: {
                            body:  {
                                markup: 'markup'
                            }
                        }
                    };
                }
            }
        });
        accoutHelpers.getPasswordRequirements();
    });

    it('Testing method: getPasswordRequirements --> getStrongPasswordRegex', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getPreferences: function () {
                            return {
                                getCustom: function () {
                                  return {
                                    useStrongPassword: 'useStrongPassword',
                                    strongPasswordRegex: 'strongPasswordRegex'
                                  }
                                }
                            }
                        },
                        getCustomPreferenceValue: function (param) {
                            if (param ==='strongPasswordRegex') {
                                return false;
                            }
                            return true;
                        }
                    }
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return null;
                }
            }
        });
        accoutHelpers.getPasswordRequirements();
    });

    it('Testing method: getPasswordRequirements --> getContent return null', () => {
        accoutHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
            'app_storefront_base/cartridge/scripts/helpers/accountHelpers': baseAccoutHelpers,
            'dw/web/URLUtils': require('../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../mocks/dw/dw_web_Resource'),
            'dw/customer/CustomerMgr': {},
            'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {},
            'dw/system/Site': {
                getCurrent: function () {
                    return {
                        getPreferences: function () {
                            return {
                                getCustom: function () {
                                  return {
                                    useStrongPassword: 'useStrongPassword',
                                    strongPasswordRegex: 'strongPasswordRegex'
                                  }
                                }
                            }
                        },
                        getCustomPreferenceValue: function (param) {
                            return true;
                        }
                    }
                }
            },
            'dw/content/ContentMgr': {
                getContent: function () {
                    return null;
                }
            }
        });
        accoutHelpers.getPasswordRequirements();
    });
});
