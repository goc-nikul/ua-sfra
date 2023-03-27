'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_nzpost/cartridge/models/nzAuthToken.js', () => {

    it('Testing nzAuth Token model if getCustomObject is null', () => {
        var NzAuthToken = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/models/nzAuthToken.js', {
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => null,
                createCustomObject: () => {
                    return {
                        custom: {}
                    }
                }
            },
            '*/cartridge/scripts/helpers/nzPostHelpers': {}
        });
        var nzAuthToken = new NzAuthToken();
        assert.isNotNull(nzAuthToken, 'nzAuthToken is null');
        assert.isNull(nzAuthToken.token, 'token should be null');
        assert.isFalse(nzAuthToken.isValidAuth(), 'isValidAuth should be false');
    });

    it('Testing nzAuth Token model if getCustomObject is not null', () => {
        var NzAuthToken = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/models/nzAuthToken.js', {
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    {
                        return {
                            custom: {}
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/nzPostHelpers': {}
        });
        var nzAuthToken = new NzAuthToken();
        assert.isNotNull(nzAuthToken, 'nzAuthToken is null');
        assert.isNull(nzAuthToken.token, 'token should be null');
        assert.isFalse(nzAuthToken.isValidAuth(), 'isValidAuth should be false');
    });

    it('Testing nzAuth Token model - getValidToken', () => {
        var NzAuthToken = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/models/nzAuthToken.js', {
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    {
                        return {
                            custom: {
                                token: {
                                    accessToken: '12345'
                                },
                                expires: {
                                    getTime: () => Date.now()
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/nzPostHelpers': {}
        });
        var nzAuthToken = new NzAuthToken();
        assert.isNotNull(nzAuthToken, 'nzAuthToken is null');
        assert.isNull(nzAuthToken.token, 'token should be null');
        assert.isFalse(nzAuthToken.isValidAuth(), 'isValidAuth should be false');
        assert.isFalse(nzAuthToken.isValidAuth(), 'Access through same object to valdiate cache');
    });

    it('Testing nzAuth Token model if refreshToken is not null', () => {
        var NzAuthToken = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/models/nzAuthToken.js', {
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    {
                        return {
                            custom: {
                                token: {
                                    accessToken: '12345'
                                },
                                expires: {
                                    getTime: () => Date.now()
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getOAuthToken: () => {
                    return {
                        access_token: '12345',
                        expires_in: 12
                    }
                }
            }
        });
        var nzAuthToken = new NzAuthToken();
        assert.isNotNull(nzAuthToken, 'nzAuthToken is null');
        assert.isNull(nzAuthToken.token, 'token should be null');
        assert.isNotNull(nzAuthToken.refreshToken(), 'isValidAuth should be false');
    });

    it('Testing nzAuth Token model if getValidToken is not null', () => {
        var NzAuthToken = proxyquire('../../../cartridges/int_nzpost/int_nzpost/cartridge/models/nzAuthToken.js', {
            'dw/system/Transaction': require('../../mocks/dw/dw_system_Transaction'),
            'dw/object/CustomObjectMgr': {
                getCustomObject: () => {
                    {
                        return {
                            custom: {
                                token: {
                                    accessToken: '12345'
                                },
                                expires: {
                                    getTime: () => Date.now()
                                }
                            }
                        }
                    }
                }
            },
            '*/cartridge/scripts/helpers/nzPostHelpers': {
                getOAuthToken: () => {
                    return {
                        access_token: '12345',
                        expires_in: 12
                    }
                }
            }
        });
        var nzAuthToken = new NzAuthToken();
        assert.isNotNull(nzAuthToken, 'nzAuthToken is null');
        assert.isNull(nzAuthToken.token, 'token should be null');
        assert.isNotNull(nzAuthToken.getValidToken(), 'isValidAuth should be false');
    });

});
