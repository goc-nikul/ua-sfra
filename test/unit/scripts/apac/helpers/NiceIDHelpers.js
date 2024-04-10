'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
var sinon = require('sinon');

global.empty = (data) => {
    return !data;
};

class Cipher {
    encrypt() {
        return 'encrypted';
    }
    decrypt() {
        return 'decrypted'
    }
}

var NiceIDServiceStub = sinon.stub();
NiceIDServiceStub.returns({
    createNiceIDService: function () {
        return {
            call: function (params) { // eslint-disable-line no-unused-vars
                return {
                    status: 'OK',
                    object: {
                        text: '{"dataHeader":{"GW_RSLT_CD":"1200","TRAN_ID":"20201119140000","GW_RSLT_MSG":"No error"},"dataBody":{"access_token": "ff5e27fe-8b5d-49db-ab1e-0ccf07de6ac1","token_type":"bearer","expires_in":1571077244,"scope":"default"}}'
                    }

                };
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

describe('app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', function () {

    let NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
        'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
        'dw/object/CustomObjectMgr': require('../../../../mocks/dw/dw_object_CustomObjectMgr'),
        'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
        'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
        '*/cartridge/scripts/util/loggerHelper.js': { maskSensitiveInfo() { } },
        '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
    });

    it('Testing method: generateAuthToken', () => {
        NiceIDHelpers.generateAuthToken();
    });

    it('Testing method: isValidAuthToken', () => {
        var result = NiceIDHelpers.isValidAuthToken();
        assert.isTrue(result);
    });

    it('Testing method: isValidAuthToken', () => {
        let NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: function (val) {
                    return null;
                },
                createCustomObject: function (objectID, siteID) {
                    return {
                        custom: {
                            siteID: siteID
                        }
                    };
                }
            }
        });
        var result = NiceIDHelpers.isValidAuthToken();
        assert.isFalse(result);
    });

    it('Testing method: generateCryptoToken', () => {
        NiceIDServiceStub.returns({
            createNiceIDService: function () {
                return {
                    call: function (params) { // eslint-disable-line no-unused-vars
                        return {
                            status: 'OK',
                            object: {
                                text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1200","GW_RSLT_MSG": "success"},"dataBody": {"rsp_cd": "P000","result_cd": "0000","site_code": "test","token_version_id": "202401292056235G-NCGACC550-5HBH7-F582CD29BA","token_val": "I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=","period": 3600}}'
                            }

                        };
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

        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        var result = NiceIDHelpers.generateCryptoToken('test');
        assert.isDefined(result);
        assert.equal(result.cryptoToken, 'I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=');
    });

    it('Testing method: generateCryptoToken', () => {
        NiceIDServiceStub.returns({
            createNiceIDService: function () {
                return {
                    call: function (params) { // eslint-disable-line no-unused-vars
                        return {
                            status: 'OK',
                            object: {
                                text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1400","GW_RSLT_MSG": "success"},"dataBody": {"rsp_cd": "S603","result_cd": "0000","site_code": "test","token_version_id": "202401292056235G-NCGACC550-5HBH7-F582CD29BA","token_val": "I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=","period": 3600}}'
                            }

                        };
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

        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        var result = NiceIDHelpers.generateCryptoToken('test');
        assert.equal(result, null);
    });

    it('Testing method: encryptData', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/crypto/Cipher': Cipher,
            'dw/crypto/Encoding': require('../../../../mocks/dw/dw_crypto_Encoding'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        let data = {
            authToken: 'ff5e27fe-8b5d-49db-ab1e-0ccf07de6ac1',
            cryptoToken: 'I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=',
            site_code: 'test',
            token_version_id: '202401292056235G-NCGACC550-5HBH7-F582CD29BA',
            reqNo: '202401300521530000000000000000',
            reqDtim: '20240130052153'
        }
        var result = NiceIDHelpers.encryptData(data);
        assert.isDefined(result.enc_data);
        assert.isDefined(result.integrity_value);
        assert.equal(result.token_version_id, data.token_version_id);
    });

    it('Testing method: decryptReturnData', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            'dw/crypto/Cipher': Cipher,
            'dw/crypto/Encoding': require('../../../../mocks/dw/dw_crypto_Encoding'),
            'dw/crypto/MessageDigest': require('../../../../mocks/dw/dw_crypto_MessageDigest'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        session.privacy.NiceIDReqNo = '202401300521530000000000000000';
        session.privacy.NiceIDReqDtim = '20240130052153';
        session.privacy.NiceIDCryptoToken = 'I9L8h6vOZ8fWRBp1DXSOXYSSTuOmpxQUEjUezHTwaIM=';
        var result = NiceIDHelpers.decryptReturnData('202401292056235G-NCGACC550-5HBH7-F582CD29BA', 'test' );
        assert.isDefined(result);
    });

    it('Testing method: getProfilesWithDuplicateCI', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/customer/CustomerMgr': {
                searchProfiles: function (query) {
                    return {
                        asList: function () {
                            return {
                                toArray: function () {
                                    return [{
                                        email: 'test@test.com'
                                    }];
                                }
                            };
                        }
                    };
                }
            }
        });
        var result = NiceIDHelpers.getProfilesWithDuplicateCI('1234', null);
        assert.isDefined(result);
        assert.equal(result[0].email, 'test@test.com');
    });

    it('Testing method: getProfilesWithDuplicateCI', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/customer/CustomerMgr': {
                searchProfiles: function (query) {
                    return {
                        asList: function () {
                            return {
                                toArray: function () {
                                    return [{
                                        email: 'test1@test.com'
                                    }];
                                }
                            };
                        }
                    };
                }
            }
        });
        var result = NiceIDHelpers.getProfilesWithDuplicateCI('1234', 'test@test.com');
        assert.isDefined(result);
        assert.equal(result[0].email, 'test1@test.com');
    });

    it('Testing method: getDataFromSession', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                splitPhoneField: function (mobile) {
                    return ['010', '1234', '1234'];
                }
            }
        });
        session.privacy.mobileAuthCI = '1234';
        session.privacy.mobileAuthName = 'test';
        session.privacy.mobileAuthGender = '1';
        session.privacy.mobileAuthMobile = '01012341234';
        session.privacy.mobileAuthBirthDate = '20100101';
        var result = NiceIDHelpers.getDataFromSession();
        assert.isDefined(result);
        assert.equal(result.mobileAuthCI, '1234');
        assert.equal(result.name, 'test');
        assert.equal(result.gender, '1');
        assert.equal(result.phone1, '010');
        assert.equal(result.phone2, '1234');
        assert.equal(result.phone3, '1234');
        assert.equal(result.birthYear, '2010');
        assert.equal(result.birthMonth, '1');
        assert.equal(result.birthDay, '1');
    });

    it('Testing method: getDataFromSession', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                splitPhoneField: function (mobile) {
                    return ['010', '1234', '1234'];
                }
            }
        });
        session.privacy.mobileAuthCI = '1234';
        session.privacy.mobileAuthName = 'test';
        session.privacy.mobileAuthGender = '1';
        session.privacy.mobileAuthMobile = '01012341234';
        session.privacy.mobileAuthBirthDate = '20101111';
        var result = NiceIDHelpers.getDataFromSession();
        assert.isDefined(result);
        assert.equal(result.mobileAuthCI, '1234');
        assert.equal(result.name, 'test');
        assert.equal(result.gender, '1');
        assert.equal(result.phone1, '010');
        assert.equal(result.phone2, '1234');
        assert.equal(result.phone3, '1234');
        assert.equal(result.birthYear, '2010');
        assert.equal(result.birthMonth, '11');
        assert.equal(result.birthDay, '11');
    });

    it('Testing method: getDataFromSession', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            '*/cartridge/scripts/helpers/addressHelpers': {
                splitPhoneField: function (mobile) {
                    return ['010', '1234', '1234'];
                }
            }
        });
        session.privacy.mobileAuthCI = null;
        var result = NiceIDHelpers.getDataFromSession();
        assert.isDefined(result);
        assert.isUndefined(result.mobileAuthCI);
        assert.isUndefined(result.name);
        assert.isUndefined(result.gender);
        assert.isUndefined(result.phone1);
        assert.isUndefined(result.phone2);
        assert.isUndefined(result.phone3);
        assert.isUndefined(result.birthYear);
        assert.isUndefined(result.birthMonth);
        assert.isUndefined(result.birthDay);
    });

    it('Testing method: validateAge', () => {
        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            '*/cartridge/config/preferences': {
                minimumAgeRestriction: 14
            }
        });
        var result = NiceIDHelpers.validateAge('20100101');
        assert.equal(result, false);
    });

    it('Testing method: generateAuthToken Invalid Response', () => {
        NiceIDServiceStub.returns({
            createNiceIDService: function () {
                return {
                    call: function (params) { // eslint-disable-line no-unused-vars
                        return {
                            status: 'OK',
                            object: {
                                text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1400","GW_RSLT_MSG": "fail"},"dataBody": {"rsp_cd":"P000","result_cd":"0000"}}'
                            }

                        };
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

        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        NiceIDHelpers.generateAuthToken();
    });

    it('Testing method: generateAuthToken Service Error', () => {
        NiceIDServiceStub.returns({
            createNiceIDService: function () {
                return {
                    call: function (params) { // eslint-disable-line no-unused-vars
                        return {
                            status: 'error',
                            object: {
                                text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1400","GW_RSLT_MSG": "fail"},"dataBody": {"rsp_cd":"P000","result_cd":"0000"}}'
                            }

                        };
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

        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        NiceIDHelpers.generateAuthToken();
    });

    it('Testing method: generateCryptoToken', () => {
        NiceIDServiceStub.returns({
            createNiceIDService: function () {
                return {
                    call: function (params) { // eslint-disable-line no-unused-vars
                        return {
                            status: 'error',
                            object: {
                                text: '{"dataHeader": {"CNTY_CD": "ko","GW_RSLT_CD": "1400","GW_RSLT_MSG": "fail"},"dataBody": {"rsp_cd": "P000","result_cd": "0000"}'
                            }

                        };
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

        NiceIDHelpers = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/helpers/NiceIDHelpers', {
            'dw/system/Site': require('../../../../mocks/dw/dw_system_Site'),
            'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
            'dw/util/StringUtils': require('../../../../mocks/dw/dw_util_StringUtils'),
            'dw/util/Calendar': require('../../../../mocks/dw/dw_util_Calendar'),
            '*/cartridge/scripts/services/NiceIDService': new NiceIDServiceStub()
        });
        var result = NiceIDHelpers.generateCryptoToken('test');
        assert.equal(result, null);
    });
});
