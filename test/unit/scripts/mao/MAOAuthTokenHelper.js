'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

class TimezoneHelper {
    getCurrentSiteTime() {
        return new Date();
    }
}

class Calendar {
    constructor(date) {
        this.date = date;
        this.DATE = 5;
        this.DAY_OF_WEEK = 7;
        this.SATURDAY = 7;
        this.SUNDAY = 1;
    }

    add(field, value) {
        if (field === this.DATE) {
            this.date.setDate(this.date.getDate() + value);
        }
    }

    before() {
        return true;
    }

    toTimeString() {
        return this.date;
    }

    get() {
        return 2;
    }
    getTime() {
        return 2;
    }
}

global.empty = (data) => {
    return !data;
};

describe('int_mao/cartridge/scripts/MAOAuthTokenHelper.js', () => {

    it('Testing method getValidToken ---> MaoService return error in the response', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'error',
                                object: ''
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isFalse(result);
    });

    it('Testing method getValidToken ---> getValidToken returns plain JS object containing the token response', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"token":{"accessToken": "aaaaa"},"expires":2}'
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {};
                        }
                    };
                },
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'token Response is Defined');
        assert.isNotNull(result.accessToken);
    });

    it('Testing method getValidToken --> getCustomObject returns null and new Custom Object created', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"token":{"accessToken": "aaaaa"},"expires":2}'
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken":"aaaaa","token_type":"bbbb"}'
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result.accessToken);
        assert.isNotNull(result.accessToken, 'aaaa');
    });

    it('Testing method getValidToken --> getCustomObject returns null and createCustomObject', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"token":{"accessToken": "aaaaa"},"expires":2}'
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {
                                token: '{"accessToken": "aaaaa","expires":2}'
                            };
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result.accessToken);
        assert.isNotNull(result.accessToken, 'aaaa');
    });

    it('Testing method refreshToken', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'OK',
                                object: {
                                    text: '{"token":{"accessToken": "aaaaa"},"expires":2}'
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.refreshToken();
        assert.isUndefined(result, 'result is Undefined');
    });

    it('Testing method refreshToken in case createOauthTokenService return an error in the response ', () => {
        var MAOAuthTokenHelper = proxyquire('../../../../cartridges/int_mao/cartridge/scripts/MAOAuthTokenHelper.js', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/services/MaoService': {
                createOauthTokenService: function () {
                    return {
                        call: function () {
                            return {
                                status: 'error',
                                object: {
                                    text: '{"status":"error","errorCode":"111"}'
                                }
                            };
                        }
                    };
                }
            },
            '~/cartridge/scripts/MaoPreferences': {
                MaoAuthTokenEndpointUrl: 'https:underaromottest.com'
            },
            'dw/object/CustomObjectMgr': {
                getCustomObject: (customObjectName, objectID) => null,
                createCustomObject: () => {
                    return {
                        custom: {},
                        getCustom: function () {
                            return {};
                        }
                    };
                }
            },
            'dw/system/Transaction': require('../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new MAOAuthTokenHelper();
        var result = tokenHelperObj.refreshToken();
        assert.isUndefined(result, 'result is Undefined');
    });
});
