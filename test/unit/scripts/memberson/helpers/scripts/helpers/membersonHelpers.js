const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_memberson/cartridge/scripts/helpers/membersonHelpers', () => {
    it('Testing method: Generate auth token', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),    
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {},
                createCustomObject: function () {
                    return {
                        custom: {
                            authtoken: 'test'
                        }
                    };
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        assert.doesNotThrow(() => membersonHelpers.getAuthToken());
    });

    it('Testing method: Get Country Config', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return [
                        {
                            'countryCode': 'US',
                            'enabled': true,
                            'uaRewardsRedirectUrl': {
                                'en_US': 'test@test.com'
                            },
                            'creativeversion': 'V2'
                        }
                    ];
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            }
        });
        var countryCode = 'US';
        global.request.getLocale = function () {
            return 'en_US';
        };
        assert.doesNotThrow(() => membersonHelpers.getCountryConfig(countryCode));
    });

    it('Testing method: Get Membership Summary', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: false,
                                error: 401
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var customerNo = '001';
        assert.doesNotThrow(() => membersonHelpers.getMembershipSummary(customerNo));
    });

    it('Testing method: Create Profile', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return [
                        {
                            'countryCode': 'US',
                            'enabled': true,
                            'uaRewardsRedirectUrl': {
                                'en_US': 'test@test.com'
                            },
                            'creativeversion': 'V2'
                        }
                    ];
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "Profile": {"CustomerNumber": "001"} , "Password": "test123", "MembershipSummaries": [{"MemberNo": "001"}] }'
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        membersonEnabled: true,
                        welcomeEmailTemplate: {
                            'en_US': 'testtt'
                        },
                        status: 'OK'
                    };
                }
            }
        });
        var registrationFormObjMale = {
            firstname: 'First',
            lastName: 'Last',
            year: '2023',
            month: '01',
            day: '01',
            phone: '9999999999',
            countryDialingCode: '+1',
            email: 'test@test.com',
            countryCode: 'US',
            ecommLocation: 'US',
            gender: '1'
        };

        var registrationFormObjFemale = {
            firstname: 'First',
            lastName: 'Last',
            year: '2023',
            month: '01',
            day: '01',
            phone: '9999999999',
            countryDialingCode: '+1',
            email: 'test@test.com',
            countryCode: 'US',
            ecommLocation: 'US',
            gender: '2'
        };
        var countryConfig = {};
        session.custom.currentCountry = 'US';
        global.request.getLocale = function () {
            return 'en_US';
        };
        assert.doesNotThrow(() => membersonHelpers.createProfile(registrationFormObjMale, countryConfig));
        assert.doesNotThrow(() => membersonHelpers.createProfile(registrationFormObjFemale, countryConfig));
    });

    it('Testing method: Create Profile without welcome email template', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return [
                        {
                            'countryCode': 'US',
                            'enabled': true,
                            'uaRewardsRedirectUrl': {
                                'en_US': 'test@test.com'
                            },
                            'creativeversion': 'V2'
                        }
                    ];
                },
                getValue: function () {
                    return {
                        'membersonWelcomeEmailTemplate': 'Test'
                    };
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "Profile": {"CustomerNumber": "001"} , "Password": "test123", "MembershipSummaries": [{"MemberNo": "001"}] }'
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        membersonEnabled: true,
                        status: 'OK'
                    };
                }
            }
        });
        var registrationFormObj = {
            firstname: 'First',
            lastName: 'Last',
            year: '2023',
            month: '01',
            day: '01',
            phone: '9999999999',
            countryDialingCode: '+1',
            email: 'test@test.com',
            countryCode: 'US',
            ecommLocation: 'US',
            gender: '1'
        };
        var countryConfig = {};
        session.custom.currentCountry = 'US';
        global.request.getLocale = function () {
            return 'en_US';
        };
        assert.doesNotThrow(() => membersonHelpers.createProfile(registrationFormObj, countryConfig));
    });

    it('Testing method: Create Profile without welcome email template and welcome memberson email template', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return [
                        {
                            'countryCode': 'US',
                            'enabled': true,
                            'uaRewardsRedirectUrl': {
                                'en_US': 'test@test.com'
                            },
                            'creativeversion': 'V2'
                        }
                    ];
                },
                getValue: function () {
                    return {
                        'membersonWelcomeEmailTemplate': ''
                    };
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "Profile": {"CustomerNumber": "001"} , "Password": "test123", "MembershipSummaries": [{"MemberNo": "001"}] }'
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return true;
                },
                callHook: function () {
                    return {
                        error: false,
                        status: 'OK'
                    };
                }
            }
        });
        var registrationFormObj = {
            firstname: 'First',
            lastName: 'Last',
            year: '2023',
            month: '01',
            day: '01',
            phone: '9999999999',
            countryDialingCode: '+1',
            email: 'test@test.com',
            countryCode: 'US',
            ecommLocation: 'US',
            gender: '1'
        };
        var countryConfig = {};
        session.custom.currentCountry = 'US';
        global.request.getLocale = function () {
            return 'en_US';
        };
        assert.doesNotThrow(() => membersonHelpers.createProfile(registrationFormObj, countryConfig));
    });

    it('Testing method: Create Profile without status ok', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getJsonValue: function () {
                    return [
                        {
                            'countryCode': 'US',
                            'enabled': true,
                            'uaRewardsRedirectUrl': {
                                'en_US': 'test@test.com'
                            },
                            'creativeversion': 'V2'
                        }
                    ];
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: false,
                                object: {
                                    text: ''
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/HookMgr': {
                hasHook: function () {
                    return '';
                },
                callHook: function () {
                    return '';
                }
            }
        });
        var registrationFormObj = {
            firstname: 'First',
            lastName: 'Last',
            year: '2023',
            month: '01',
            day: '01',
            phone: '9999999999',
            countryDialingCode: '+1',
            email: 'test@test.com',
            countryCode: 'US',
            ecommLocation: 'US',
            gender: '1'
        };
        var countryConfig = {};
        session.custom.currentCountry = 'US';
        global.request.getLocale = function () {
            return 'en_US';
        };
        assert.doesNotThrow(() => membersonHelpers.createProfile(registrationFormObj, countryConfig));
    });

    it('Testing method: Search Profile', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '[{"CustomerNumber": "001"},{"CustomerNumber": "002"}]'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var email = 'test@test.com';
        var mobile = '9999999999';
        var mobileCountryCode = '+1';
        assert.doesNotThrow(() => membersonHelpers.searchProfile(email, mobile, mobileCountryCode));
    });

    it('Testing method: Search Profile with not empty email field and empty mobile field', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                object: {
                                    text: '[{"CustomerNumber": "001"},{"CustomerNumber": "002"}]'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var email = 'test@test.com';
        var mobile = '';
        var mobileCountryCode = '';
        assert.doesNotThrow(() => membersonHelpers.searchProfile(email, mobile, mobileCountryCode));
    });

    it('Testing method: Search Profile with not empty email field and empty mobile field with status ok', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{"value": ""}'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var email = 'test@test.com';
        var mobile = '';
        var mobileCountryCode = '';
        assert.doesNotThrow(() => membersonHelpers.searchProfile(email, mobile, mobileCountryCode));
    });

    it('Testing method: Search Profile with empty email field and not empty mobile field', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '[{"CustomerNumber": "001"},{"CustomerNumber": "002"}]'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var email = '';
        var mobile = '9999999999';
        var mobileCountryCode = '';
        assert.doesNotThrow(() => membersonHelpers.searchProfile(email, mobile, mobileCountryCode));
    });

    it('Testing method: View CC Consent', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
            'dw/util/Calendar': require('../../../../../../mocks/dw/dw_util_Calendar'),
            'dw/util/StringUtils': require('../../../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{"Value": ""}'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var customerNo = '001';
        var consentValue = 'Yes';
        var setConsent = 'Yes';
        assert.doesNotThrow(() => membersonHelpers.viewTnCConsent(customerNo, setConsent, consentValue));
    });

    it('Testing method: View CC Consent with error', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
            'dw/util/Calendar': require('../../../../../../mocks/dw/dw_util_Calendar'),
            'dw/util/StringUtils': require('../../../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/service/membersonService': {},
            '*/cartridge/scripts/utils/PreferencesUtil': {}
        });
        assert.doesNotThrow(() => membersonHelpers.viewTnCConsent());
    });

    it('Testing method: Set CC Consent', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
            'dw/util/Calendar': require('../../../../../../mocks/dw/dw_util_Calendar'),
            'dw/util/StringUtils': require('../../../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{"Value": ""}'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var customerNo = '001';
        var consentValue = 'Yes';
        assert.doesNotThrow(() => membersonHelpers.setTnCConsent(customerNo, consentValue));
    });

    it('Testing method: Set CC Consent With Error', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw_system_Logger': require('../../../../../../mocks/dw/dw_system_Logger'),
            'dw/system/Site': require('../../../../../../mocks/dw/dw_system_Site'),
            'dw/util/Calendar': require('../../../../../../mocks/dw/dw_util_Calendar'),
            'dw/util/StringUtils': require('../../../../../../mocks/dw/dw_util_StringUtils'),
            '*/cartridge/scripts/service/membersonService': {},
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        assert.doesNotThrow(() => membersonHelpers.setTnCConsent());
    });

    it('Testing method: Check Store Customer Registration', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            'dw/util/UUIDUtils': require('../../../../../../mocks/dw/dw_util_UUIDUtils'),
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                createCustomObject: function () {
                    return {
                        custom: {
                            authtoken: 'test'
                        }
                    };
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '[{"status": "testtt"}]'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var registrationFormObj = {
            customer: {
                firstname: {
                    value: 'First'
                },
                lastname: {
                    value: 'Last'
                },
                email: {
                    value: 'test@test.com'
                },
                phone: {
                    value: '9999999999'
                },
                birthMonth: {
                    value: '01'
                },
                birthYear: {
                    value: '2023'
                },
                addtoemaillist: {
                    value: ''
                }
            },
            login: {
                password: {
                    value: 'test@123'
                }
            }
        };
        assert.doesNotThrow(() => membersonHelpers.storeCustomerRegistration(registrationFormObj));
    });

    it('Testing method: Send Profile Validation Email', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/helpers/emailHelpers': {
                emailTypes: {
                    SAPACEmailValidation: ''
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {},
                createCustomObject: function () {
                    return {
                        custom: {
                            authtoken: 'test'
                        }
                    };
                }
            },
            'dw/web/URLUtils': require('../../../../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/modules/providers': {
                get: function () {
                    return {
                        send: function () {
                            return '';
                        }
                    };
                }
            }
        });
        global.request.getLocale = function () {
            return 'en_US';
        };
        var ObjectID = {};
        var registrationFormObj = {
            email: '',
            firstName: '',
            lastName: ''
        };
        assert.doesNotThrow(() => membersonHelpers.sendProfileValidationEmail(ObjectID, registrationFormObj));
        ;
    });

    it('Testing method: Validate User for Memberson', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '[{"status": "testtt"}]'
                                }
                            };
                        }
                    };
                }
            },
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return 'test';
                }
            }
        });
        var emailID = 'test@underarmour.com';
        assert.doesNotThrow(() => membersonHelpers.validateUserForMemberson(emailID));
    });

    it('Testing method: Get Memberson Vouchers', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '[{"VoucherCode": "001"}]'
                                }
                            };
                        }
                    };
                }
            }
        });
        var memberNo = '001';
        assert.doesNotThrow(() => membersonHelpers.getMemberVouchers(memberNo));
    });

    it('Testing method: Get Memberson Vouchers with error', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {},
            '*/cartridge/scripts/service/membersonService': {}
        });
        assert.doesNotThrow(() => membersonHelpers.getMemberVouchers());
    });

    it('Testing method: Utilize Memberson Voucher', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            }
        });
        var order = '';
        var loyaltyVoucherName = '';
        var locationCode = '';
        assert.doesNotThrow(() => membersonHelpers.utilizeMemberVoucher(order, loyaltyVoucherName, locationCode));
    });

    it('Testing method: Utilize Memberson Voucher with error', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {},
            '*/cartridge/scripts/service/membersonService': {}
        });
        assert.doesNotThrow(() => membersonHelpers.utilizeMemberVoucher());
    });

    it('Testing method: Unutilize Memberson Voucher with status ok', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: ''
                                }
                            };
                        }
                    };
                }
            }
        });
        var order = '';
        var loyaltyVoucherName = 'test';
        assert.doesNotThrow(() => membersonHelpers.unUtilizeMemberVoucher(order, loyaltyVoucherName));
    });

    it('Testing method: Unutilize Memberson Voucher without status ok', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {},
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                object: {
                                    text: ''
                                }
                            };
                        }
                    };
                }
            }
        });
        var order = '';
        var loyaltyVoucherName = 'test';
        assert.doesNotThrow(() => membersonHelpers.unUtilizeMemberVoucher(order, loyaltyVoucherName));
    });

    it('Testing method: Validate Age of the Customer', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            }
        });
        var month = '01';
        var year = '2023';
        var countryConfig = '';
        assert.doesNotThrow(() => membersonHelpers.validateAgeOfCustomer(month, year, countryConfig));
    });

    it('Testing method: Get Memberson Promotions', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                ok: true,
                                object: {
                                    text: '{ "status": "testtt" }'
                                }
                            };
                        }
                    };
                }
            }
        });
        var index = 0;
        var items = [
            {
                custom: {
                    'Loyalty-Voucher': ''
                }
            }
        ];
        var promotions = {
            iterator: () => {
                return {
                    hasNext: () => {
                        return index < items.length;
                    },
                    next: () => {
                        return items[index++];
                    }
                };
            }
        };
        assert.doesNotThrow(() => membersonHelpers.getMembersonPromotion(promotions));
    });

    it('Testing method: Update Profile Attributes', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "NationalityCode": "US", "DOB": "01/01/2023"}'
                                }
                            };
                        }
                    };
                }
            }
        });
        var customerNo = '001';
        var profileObj = {
            custom: {
                birthYear: '',
                registrationCountry: ''
            }
        };
        assert.doesNotThrow(() => membersonHelpers.updateProfileAttributes(customerNo, profileObj));
    });

    it('Testing method: Update Profile Attributes with error', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {},
            '*/cartridge/scripts/service/membersonService': {}
        });
        var customerNo = '001';
        var profileObj = {
            custom: {
                birthYear: '',
                registrationCountry: ''
            }
        };
        assert.doesNotThrow(() => membersonHelpers.updateProfileAttributes(customerNo, profileObj));
    });

    it('Testing method: Update Registration Country Attribute with Nationality Code', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "NationalityCode": "US", "DOB": "01/01/2023"}'
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction')
        });
        var customerNo = '001';
        var profileObj = {
            custom: {
                birthYear: '',
                registrationCountry: ''
            }
        };
        var currentCountryCode = 'US';
        assert.doesNotThrow(() => membersonHelpers.updateregistrationCountryAttribute(customerNo, profileObj, currentCountryCode));
    });

    it('Testing method: Update Registration Country Attribute without Nationality Code', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{ "NationalityCode": "", "DOB": "01/01/2023"}'
                                }
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction')
        });
        var customerNo = '001';
        var profileObj = {
            custom: {
                birthYear: '',
                registrationCountry: ''
            }
        };
        var currentCountryCode = 'US';
        assert.doesNotThrow(() => membersonHelpers.updateregistrationCountryAttribute(customerNo, profileObj, currentCountryCode));
    });

    it('Testing method: Remove Memberson Vouchers', () => {
        var membersonHelpers = proxyquire('../../../../../../../cartridges/int_memberson/cartridge/scripts/helpers/membersonHelpers', {
            '*/cartridge/scripts/utils/PreferencesUtil': {
                getValue: function () {
                    return '';
                }
            },
            '*/cartridge/scripts/service/membersonService': {
                getMembersonAPI: function () {
                    return {
                        call: (data) => {
                            return {
                                status: 'OK',
                                ok: true,
                                object: {
                                    text: '{}'
                                }
                            };
                        }
                    };
                }
            },
            'dw/campaign/CouponMgr': {
                getCouponByCode: function () {
                    var index = 0;
                    var items = [{
                        custom: {
                            'Loyalty-Voucher': true
                        }
                    }];
                    return {
                        promotions: {
                            iterator: function () {
                                return {
                                    hasNext: () => {
                                        return index < items.length;
                                    },
                                    next: () => {
                                        return items[index++];
                                    }
                                };
                            }
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../../mocks/dw/dw_system_Transaction')
        });
        var index = 0;
        var items = [{
            getCouponCode: function () {
                return 'test001';
            }
        }];
        var couponsIterator = {
            hasNext: () => {
                return index < items.length;
            },
            next: () => {
                return items[index++];
            }
        };
        var currentBasket = {
            removeCouponLineItem: function () {
                return '';
            }
        };
        assert.doesNotThrow(() => membersonHelpers.removemembersonVouchers(couponsIterator, currentBasket));
    });
});

