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

describe('int_OIS/cartridge/scripts/util/OISAuthTokenHelper', () => {

    it('Testing method getValidToken ---> MaoService return error in the response', () => {
        var OISAuthTokenHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/OISAuthTokenHelper', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/init/OISDataService': {
                getTokenData: function () {
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
            '../util/OISHelper': {
                prepareOISTokenServiceRequest: () => {
                    return '123Token';
                }
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
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new OISAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isFalse(result);
    });

    it('Testing method getValidToken ---> getValidToken returns plain JS object containing the token response', () => {
        var OISAuthTokenHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/OISAuthTokenHelper', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/init/OISDataService': {
                getTokenData: function () {
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
            '../util/OISHelper': {
                prepareOISTokenServiceRequest: () => {
                    return '123Token';
                }
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
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new OISAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'token Response is Defined');
        assert.isNotNull(result.accessToken);
    });

    it('Testing method getValidToken --> getCustomObject returns null and new Custom Object created', () => {
        var OISAuthTokenHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/OISAuthTokenHelper', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/init/OISDataService': {
                getTokenData: function () {
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
            '../util/OISHelper': {
                prepareOISTokenServiceRequest: () => {
                    return '123Token';
                }
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
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new OISAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result.accessToken);
        assert.isNotNull(result.accessToken, 'aaaa');
    });

    it('Testing method getValidToken --> getCustomObject returns null and createCustomObject', () => {
        var OISAuthTokenHelper = proxyquire('../../../../../cartridges/int_OIS/cartridge/scripts/util/OISAuthTokenHelper', {
            'dw/util/Calendar': Calendar,
            '*/cartridge/scripts/util/TimezoneHelper': TimezoneHelper,
            '~/cartridge/scripts/init/OISDataService': {
                getTokenData: function () {
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
            '../util/OISHelper': {
                prepareOISTokenServiceRequest: () => {
                    return '123Token';
                }
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
            'dw/system/Transaction': require('../../../../mocks/dw/dw_system_Transaction')
        });
        var tokenHelperObj = new OISAuthTokenHelper();
        var result = tokenHelperObj.getValidToken();
        assert.isDefined(result, 'result is defined');
        assert.isNotNull(result.accessToken);
        assert.isNotNull(result.accessToken, 'aaaa');
    });
});
