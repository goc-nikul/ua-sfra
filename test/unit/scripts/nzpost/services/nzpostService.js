'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var service = {
    addParam: () => {},
    addHeader: () => {}
};

describe('int_nzpost/cartridge/scripts/services/nzpostService.js', () => {

    it('Testing method getOAuthTokenService on mock call', () => {
        var nzPostService = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/services/nzpostService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service);
                    return callbackObject.mockCall();
                }
            },
            '*/cartridge/config/nzConfig': {}
        });
        var oAuthTokenService = nzPostService.getOAuthTokenService();
        assert.isNotNull(oAuthTokenService, 'oAuthTokenService is nul');
        assert.isDefined(oAuthTokenService, 'oAuthTokenService is not defined');
        assert.equal(oAuthTokenService.access_token, 'eyJhbGciOiJIUzI1NiIsImtpZCI6IlRFU1QiLCJwaS5hdG0iOiIxIn0.eyJzY29wZSI6W10sImNsaWVudF9pZCI6IjYwZTVhYzA1NzNjNzQ4YjI4OWVkNjRmZGU5YmZkZGVmIiwiZXhwIjoxNjMwMDQ5NjA3fQ.SF7JRXHKuT-0M9F1sj9dMAD8QF3oOTpUUT2Ien-5d_A');
        assert.equal(oAuthTokenService.token_type, 'Bearer');
        assert.equal(oAuthTokenService.expires_in, 86399);
    });

    it('Testing method getOAuthTokenService on service call', () => {
        var nzPostService = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/services/nzpostService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service);
                    return callbackObject.parseResponse('', {
                        access_token: 'LiveAccessToken',
                        token_type: 'LiveBearer',
                        expires_in: 86399
                    });
                }
            },
            '*/cartridge/config/nzConfig': {}
        });
        var oAuthTokenService = nzPostService.getOAuthTokenService();
        assert.isNotNull(oAuthTokenService, 'oAuthTokenService is nul');
        assert.isDefined(oAuthTokenService, 'oAuthTokenService is not defined');
        assert.equal(oAuthTokenService.access_token, 'LiveAccessToken');
        assert.equal(oAuthTokenService.token_type, 'LiveBearer');
        assert.equal(oAuthTokenService.expires_in, 86399);
    });

    it('Testing method getParcelLabelService on service call', () => {
        var nzPostService = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/services/nzpostService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service, {
                        request: 'consignment'
                    });
                    return callbackObject.parseResponse('', {
                        consignmentid: 'ABCD',
                        status: 200
                    });
                }
            },
            '*/cartridge/config/nzConfig': {
                nzpostConfigurations: '{"username":"test"}'
            }
        });
        var parcelLabelService = nzPostService.getParcelLabelService();
        assert.isNotNull(parcelLabelService, 'parcelLabelService is nul');
        assert.isDefined(parcelLabelService, 'parcelLabelService is not defined');
        assert.equal(parcelLabelService.consignmentid, 'ABCD');
        assert.equal(parcelLabelService.status, 200);
    });

    it('Testing method getParcelLabelService on service call with request body as null', () => {
        var nzPostService = proxyquire('../../../../../cartridges/int_nzpost/int_nzpost/cartridge/scripts/services/nzpostService.js', {
            'dw/svc/LocalServiceRegistry': {
                createService: (serviceId, callbackObject) => {
                    callbackObject.createRequest(service);
                    return callbackObject.parseResponse('', {
                        consignmentid: 'ABCD',
                        status: 200
                    });
                }
            },
            '*/cartridge/config/nzConfig': {
                nzpostConfigurations: '{"username":"test"}'
            }
        });
        var parcelLabelService = nzPostService.getParcelLabelService();
        assert.isNotNull(parcelLabelService, 'parcelLabelService is nul');
        assert.isDefined(parcelLabelService, 'parcelLabelService is not defined');
        assert.equal(parcelLabelService.consignmentid, 'ABCD');
        assert.equal(parcelLabelService.status, 200);
    });

});
