'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');
var Customer = require('../../../../mocks/apac/dw/dw_customer_Customer');


global.empty = (data) => {
    return !data;
};

let registrationFormObj = {
    gender: 'male',
    firstName: 'test',
    lastName: 'test1',
    phone: '1111111111',
    month: 1,
    day: 2,
    year: 2000,
    countryDialingCode: '+65',
    registrationCountry: 'KR'
}
describe('app_ua_apac/cartridge/scripts/helpers/accountHelpers', function () {

    let baseAccountHelpers = proxyquire('../../../../../cartridges/app_ua_core/cartridge/scripts/helpers/accountHelpers', {
        'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
            1: 'Account-Show',
            2: 'Checkout-Begin'
        },
        'app_storefront_base/cartridge/scripts/helpers/accountHelpers': {}
    });

    it('Testing method: createSFCCAccount', () => {
        global.customer = new Customer();
        var result = accountHelpers.createSFCCAccount('underarmourtestaccount@underarmour.com', '1234567890', registrationFormObj);
        assert.isTrue(result.authCustomer.registered);
    });

    it('Testing method: createSFCCAccount with birth field', () => {
        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                ShowBirthYearField: true
            },
        });
        global.customer = new Customer();
        var result = accountHelpers.createSFCCAccount('underarmourtestaccount@underarmour.com', '1234567890', registrationFormObj);
        assert.isTrue(result.authCustomer.registered);
    });

    it('Testing method: combinePhoneField', () => {

        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            },
        });

        var registrationForm = {
            customer: {
                phoneMobile1: {
                    value: '010'
                },
                phoneMobile2: {
                    value: '111'
                },
                phoneMobile3: {
                    value: '1111'
                },
                phone: {
                    value: ''
                }
            }
        }
        accountHelpers.combinePhoneField(registrationForm);

        assert.isNotNull(registrationForm.customer.phone.value);
        assert.equal(registrationForm.customer.phone.value, '010-111-1111');
    });

    it('Testing method: combineSplitFields', () => {

        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isShowSplitEmailField: true
            },
        });

        let registrationForm = {
            customer: {
                emailaddressName: {
                    value: 'test'
                },
                emailaddressDomain: {
                    value: 'test.com'
                },
                emailaddressNameConfirm: {
                    value: 'test'
                },
                email: {
                    value: ''
                },
                newemail: {
                    value: ''
                },
                newemailconfirm: {
                    value: ''
                }
            }
        }
        accountHelpers.combineSplitFields(registrationForm, false);

        assert.isNotNull(registrationForm.customer.email.value);
        assert.equal(registrationForm.customer.email.value, 'test@test.com');
    });
    
    it('Testing method: saveSplitFields', () => {

        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isShowSplitEmailField: true,
                isShowSplitPhoneMobileField: true
            },
        });

        let registrationForm = {
            customer: {
                emailaddressName: {
                    value: 'test'
                },
                emailaddressDomain: {
                    value: 'test.com'
                },
                emailaddressDomainSelect: {
                    value: 'test.com'
                },
                phoneMobile1: {
                    value: '010'
                },
                phoneMobile2: {
                    value: '111'
                },
                phoneMobile3: {
                    value: '1111'
                },
                phone: {
                    value: '',
                } 
            },
            toObject: (o) => {
                return {
                    customer: {
                        phone: {
                            value: '',
                            split: (o) => {
                                return {
                                    join: (o) => {
                                        return {
                                            replace: (o) => {
                                                return {
                                                    replace: (o) => {
                                                        return o;
                                                    }
                                                };
                                            }
                                        };
                                    }  
                                }
                            }
                        } 
                    }
                       
                };
            },
               
        };
        
        let profile = {
            custom: {
                emailaddressName: '',
                emailaddressDomain: '',
                emailaddressDomainSelect: '',
                phoneMobile1: '',
                phoneMobile2: '',
                phoneMobile3: ''
            },
            setPhoneHome: (o) => {
                return o;
            }
        }
        accountHelpers.saveSplitFields(registrationForm, profile);
        assert.equal(profile.custom.emailaddressName, 'test');
        assert.equal(profile.custom.emailaddressDomain, 'test.com');
        assert.equal(profile.custom.emailaddressDomainSelect, 'test.com');
        assert.equal(profile.custom.phoneMobile1, '010');
        assert.equal(profile.custom.phoneMobile2, '111');
        assert.equal(profile.custom.phoneMobile3, '1111');
        let phone = profile.custom.phoneMobile1 + '-' + profile.custom.phoneMobile2 + '-' + profile.custom.phoneMobile3;
        assert.equal(profile.setPhoneHome(phone), '010-111-1111');
    });


    it('Testing method: handleSplitFieldsSaveProfile', () => {
        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/preferences': {
                isShowSplitEmailField: true
            },
        });
        var profileObj = {
            customer: {
                emailaddressName: 'test',
                emailaddressNameConfirm: 'test1',
                emailaddressDomain: 'test.com',
                emailAddressDomainConfirm: 'test1.com'
            }
        }
        var profileForm = {
            customer: {
                emailaddressName: {
                    value: '',
                    valid: true,
                    error: ''
                },
                newemail: {
                    value: '',
                    valid: true,
                    error: ''
                },
                newemailconfirm: {
                    value: '',
                    valid: true,
                    error: ''
                }, 
                emailaddressNameConfirm: {
                    value: '',
                    valid: true,
                    error: ''
                },
                emailaddressDomain: {
                    value: '',
                    valid: true,
                    error: ''
                },
                emailAddressDomainConfirm: {
                    value: '',
                    valid: true,
                    error: ''
                },
                emailaddressNameConfirm: {
                    value: '',
                    valid: true,
                    error: ''
                },
                phoneMobile1: {
                    value: '',
                    valid: true,
                    error: ''
                },
                phoneMobile2: {
                    value: '',
                    valid: true,
                    error: ''
                },
                phoneMobile3: {
                    value: '',
                    valid: true,
                    error: ''
                },
                phone: {
                    value: '',
                    valid: true,
                    error: ''
                }
            },
            valid: true
        }
        var isEmailValid = accountHelpers.handleSplitFieldsSaveProfile(profileObj, profileForm);

        assert.isFalse(isEmailValid);
        assert.isFalse(profileForm.valid);
        assert.isFalse(profileForm.customer.emailaddressName.valid);
        assert.isFalse(profileForm.customer.emailaddressNameConfirm.valid);
        assert.isFalse(profileForm.customer.emailaddressDomain.valid);
        assert.isFalse(profileForm.customer.emailAddressDomainConfirm.valid);
        profileObj.customer.emailaddressNameConfirm = 'test';
        profileObj.customer.emailAddressDomainConfirm = 'test.com';
        let profileFormOne = accountHelpers.handleSplitFieldsSaveProfile(profileObj, profileForm);
        assert.equal(profileForm, profileFormOne);
        profileForm.customer.emailaddressName.value = 'test';
        profileForm.customer.emailaddressDomain.value = 'test.com';
        profileForm.customer.emailaddressNameConfirm.value = 'test';
        profileForm.customer.emailAddressDomainConfirm.value = 'test.com';
        let profileFormSecond = accountHelpers.handleSplitFieldsSaveProfile(profileObj, profileForm);
        assert.equal(profileForm, profileFormSecond);
    });

    it('Testing method: getBirthYearRange', () => {
        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            '*/cartridge/config/preferences': {
                minimumAgeRestriction: 14
            },
        });

        var yearOptions = [];
        var selectOptions = {
            checked:false,
            htmlValue:"",
            label:"Select",
            id:"",
            selected:false,
            value:null
        };
        yearOptions.push(selectOptions);
        yearOptions = accountHelpers.getBirthYearRange(yearOptions);
        var optionsLength = yearOptions.length;
        assert.equal(optionsLength, 102);
    });

    it('Testing method: saveBirthYear', () => {
        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            '*/cartridge/config/preferences': {
                ShowBirthYearField: true
            }
        });
        let form = {
            customer : {
                birthYear: {
                    value: 2000
                }
            }
        };
        let profile = {
            custom: {
                birthYear: ''
            }
        }
        accountHelpers.saveBirthYear(form,profile);
        assert.equal(form.customer.birthYear.value, profile.custom.birthYear);
    });
    

    it('Testing method: loadProfileFields', () => {
        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            '*/cartridge/config/preferences': {
                isShowSplitPhoneMobileField: true
            },
        });
        let profile = {
            custom: {
                phoneMobile1: '010',
                phoneMobile2: '111',
                phoneMobile3: '1111',
            }
        };
        let profileForm = {
            customer: {
                phoneMobile1: {
                    value: ''
                },
                phoneMobile2: {
                    value: ''
                },
                phoneMobile3: {
                    value: ''
                }
            }
        };
        accountHelpers.loadProfileFields(profileForm, profile);
        assert.equal(profileForm.customer.phoneMobile1.value, profile.custom.phoneMobile1);
        assert.equal(profileForm.customer.phoneMobile2.value, profile.custom.phoneMobile2);
        assert.equal(profileForm.customer.phoneMobile3.value, profile.custom.phoneMobile3);
    });

    let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
        'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/customer/CustomerMgr': require('../../../../mocks/apac/dw/dw_customer_CustomerMgr'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
        '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
            1: 'Account-Show',
            2: 'Checkout-Begin',
            3: 'Account-EditProfile'
        },
        'dw/customer/AuthenticationStatus': {
            AUTH_OK: 'AUTH_OK'
        },
        '*/cartridge/config/preferences': {
            isShowSplitPhoneMobileField: false
        },
    });

    it('Testing method: createSFCCAccount when customer is not authenticated', () => {
        let CustomerMgr = require('../../../../mocks/apac/dw/dw_customer_CustomerMgr');
        let authenticateCustomerStub = sinon.stub();
        let loginCustomerStub = sinon.stub();
        CustomerMgr.authenticateCustomer = authenticateCustomerStub;
        CustomerMgr.loginCustomer = loginCustomerStub;

        let accountHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/accountHelpers', {
            'app_ua_core/cartridge/scripts/helpers/accountHelpers': baseAccountHelpers,
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/customer/CustomerMgr': CustomerMgr,
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/web/Resource': require('../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/config/oAuthRenentryRedirectEndpoints': {
                1: 'Account-Show',
                2: 'Checkout-Begin',
                3: 'Account-EditProfile'
            },
            'dw/customer/AuthenticationStatus': {
                AUTH_OK: 'AUTH_OK'
            },
            '*/cartridge/config/preferences': {
                ShowBirthYearField: false
            }
        });
        authenticateCustomerStub.returns({ status: 'AUTH_Error' });
        var result = accountHelpers.createSFCCAccount('underarmourtestaccount@underarmour.com', '1234567890', registrationFormObj);
        assert.isNull(result.authCustomer);

        authenticateCustomerStub.returns({ status: 'AUTH_OK' });
        loginCustomerStub.returns(false);
        result = accountHelpers.createSFCCAccount('underarmourtestaccount@underarmour.com', '1234567890', registrationFormObj);
        assert.isNull(result.authCustomer);
        loginCustomerStub.reset();
    });
});
