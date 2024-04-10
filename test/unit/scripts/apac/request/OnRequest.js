'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();


var onRequest;
describe('app_ua_apac/cartridge/scripts/request/OnRequest.js', () => {
    onRequest = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/request/OnRequest.js', {
        'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
        'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
        '*/cartridge/modules/providers': {
            get: () => {
                return {
                    mobileAuthEnabled: true
                };
            }
        }
    });

    it('Test OnRequest: empty CI', () => {
        global.request = {
            httpPath: 'Test-Start',
            session: {
                customer: {
                    authenticated: true,
                    profile: {
                        custom: {
                            CI: null
                        }
                    }
                }
            }
        };
        global.response = {
            redirect() { }
        };
        onRequest.onRequest();
    });

    it('Test OnRequest: Product-Show with EarlyAccess', () => {
        global.request = {
            httpPath: 'Product-Show',
            httpQueryString: 'earlyAccessPid=1',
            session: {
                customer: {
                    authenticated: true,
                    profile: {
                        custom: {
                            CI: null
                        }
                    }
                }
            }
        };
        global.response = {
            redirect() { }
        };
        onRequest.onRequest();
    });

    it('Test OnRequest: Default-Start with initiateMobileAuth true', () => {
        global.request = {
            httpPath: 'Default-Start',
            httpQueryString: 'initiateMobileAuth=true',
            session: {
                customer: {
                    authenticated: true,
                    profile: {
                        custom: {
                            CI: null
                        }
                    }
                }
            }
        };
        global.response = {
            redirect() { }
        };
        onRequest.onRequest();
    });

    it('Test OnRequest: Mobile Auth Disabled', () => {
        onRequest = proxyquire('../../../../../cartridges/app_ua_apac/cartridge/scripts/request/OnRequest.js', {
            'dw/system/Status': require('../../../../mocks/dw/dw_system_Status'),
            'dw/web/URLUtils': require('../../../../mocks/dw/dw_web_URLUtils'),
            '*/cartridge/modules/providers': {
                get: () => {
                    return {
                        mobileAuthEnabled: false
                    };
                }
            }
        });
        global.request = {
            httpPath: 'Default-Start',
            httpQueryString: 'initiateMobileAuth=true',
            session: {
                customer: {
                    authenticated: true,
                    profile: {
                        custom: {
                            CI: null
                        }
                    }
                }
            }
        };
        global.response = {
            redirect() { }
        };
        const val = onRequest.onRequest();
        assert.equal(val.status, 2);
    });
});
