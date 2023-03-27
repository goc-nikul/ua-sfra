'use strict';

const { assert } = require('chai');

var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

function Calendar() {
    this.toTimeString = () => '01/01/2022';
    this.before = () => true;
    this.add = () => (new Date() + 86400);
    this.getTime = () => new Date();
}

class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}

var UACAPIAuthTokenHelper = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper.js', {
    'dw/util/Calendar': Calendar,
    '../util/UACAPIHelper': {
        prepareUACAPITokenServiceRequest: function () {}
    },
    '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
    '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
        getTokenData: function () {
            return {
                call: () => {
                    return {
                        status: 'OK',
                        object: {
                            text: '{"access_token": 12344,"expires_in": 86400, "token_type": "Bearer"}'
                        }
                    };
                }
            };
        }
    },
    'dw/object/CustomObjectMgr': {
        getCustomObject: function () {
            return {
                getCustom: function () {
                    return {};
                }
            };
        },
        createCustomObject: function () {
            return {};
        }
    },
    'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
});

describe('int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper.js', () => {

    it('Testing method: getValidToken and auth request service return error in the response', () => {

        var UACAPIAuthTokenHelperRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '../util/UACAPIHelper': {
                prepareUACAPITokenServiceRequest: function () {}
            },
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getTokenData: function () {
                    return {
                        call: () => {
                            return {
                                status: 'error',
                                object: {
                                    text: ''
                                }
                            };
                        }
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return {
                        getCustom: function () {
                            return {};
                        }
                    };
                },
                createCustomObject: function () {
                    return {};
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var UACAPIAuthTokenHelperObj = new UACAPIAuthTokenHelperRes();
        var result = UACAPIAuthTokenHelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isFalse(result);
    });

    it('Testing method: getValidToken and auth request service return success in the response', () => {
        var UACAPIAuthTokenHelperObj = new UACAPIAuthTokenHelper();
        var result = UACAPIAuthTokenHelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isNotNull(result.accessToken);
        assert.equal(result.accessToken, '12344');
    });

    it('Testing method: getValidToken --> getCustomObject return null', () => {
        var UACAPIAuthTokenHelperRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '../util/UACAPIHelper': {
                prepareUACAPITokenServiceRequest: function () {}
            },
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {
                getTokenData: function () {
                    return {
                        call: () => {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"access_token": 12344,"expires_in": 86400, "token_type": "Bearer"}'
                                }
                            };
                        }
                    };
                }
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return null;
                },
                createCustomObject: function () {
                    return {
                        getCustom: function () { return {}; }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var UACAPIAuthTokenHelperObj = new UACAPIAuthTokenHelperRes();
        var result = UACAPIAuthTokenHelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isNotNull(result.accessToken);
        assert.equal(result.accessToken, '12344');
    });

    it('Testing method: getValidToken --> Test the stored token is valid', () => {
        var UACAPIAuthTokenHelperRes = proxyquire('../../../../../../cartridges/int_mao/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '../util/UACAPIHelper': {
                prepareUACAPITokenServiceRequest: function () {}
            },
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/UACAPI/services/UACAPIDataService': {

            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: function () {
                    return null;
                },
                createCustomObject: function () {
                    return {
                        getCustom: function () {
                            return {
                                token: '{"accessToken":"11111"}',
                                expires: ''
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../../../mocks/dw/dw_system_Transaction')
        });
        var UACAPIAuthTokenHelperObj = new UACAPIAuthTokenHelperRes();
        var result = UACAPIAuthTokenHelperObj.getValidToken();
        assert.isNotNull(result);
        assert.isNotNull(result.accessToken);
        assert.equal(result.accessToken, '11111');
    });
});
