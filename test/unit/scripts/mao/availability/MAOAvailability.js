'use strict';

/* eslint-disable */
const assert = require('chai').assert;
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_mao/cartridge/scripts/MAOAvailability', function () {

    global.empty = (data) => {
        return !data;
    }
    
    var stubgetAvailabilityRequest = sinon.stub();
    var stubMAOAuthTokenHelper = sinon.stub();
    var stubgetAvailability = sinon.stub();
    var items = ['item1', 'item2'];
    var locations = ['location1', 'location2'];
    var MAOAvailability = proxyquire('../../../../../cartridges/int_mao/cartridge/scripts/availability/MAOAvailability.js', {
        'int_mao/cartridge/scripts/availability/MAOAvailabilityHelper': {
            getAvailabilityRequest: stubgetAvailabilityRequest
        },
        'int_mao/cartridge/scripts/services/MaoService': { getAvailability: stubgetAvailability },
        'int_mao/cartridge/scripts/MAOAuthTokenHelper': stubMAOAuthTokenHelper,
        'dw/system/Logger': require('../../../../mocks/dw/dw_system_Logger'),
        '~/cartridge/scripts/MaoPreferences': { MaoBOPISAvailabilityEndpointUrl: 'https//:testurl.com' }
    });

    it('should return response as a null when unknown exception occured', () => {
        var expectedError = new Error('Custom Error Check');
        stubgetAvailabilityRequest.throws(expectedError);
        var response = MAOAvailability.getMaoAvailability(null, null);
        stubgetAvailabilityRequest.reset();
        assert.isNull(response);
    })

    it('should return response as a null, when aceesstoken is null or empty', () => {
        stubgetAvailabilityRequest.returns({ id: '3245', name: 'testname' });
        stubMAOAuthTokenHelper.returns({
            getValidToken: function () {
                return { accessToken: '' };
            }
        });

        var response = MAOAvailability.getMaoAvailability(null, null);
        assert.isNull(response);
        stubMAOAuthTokenHelper.reset();
        stubMAOAuthTokenHelper.returns({
            getValidToken: function () {
                return { accessToken: null };
            }
        });
        response = MAOAvailability.getMaoAvailability(null, null);
        stubMAOAuthTokenHelper.reset();
        assert.isNull(response);
    });

    it('should return response as a null, when availabilityRequestJSON object is null or empty', () => {
        stubgetAvailabilityRequest.returns('');
        var response = MAOAvailability.getMaoAvailability(null, null);
        assert.isNull(response);
        stubgetAvailabilityRequest.returns(null);
        response = MAOAvailability.getMaoAvailability(null, null);
        assert.isNull(response);
    });

    it('should return response as a null, when availabilityService object is null or empty', () => {
        stubgetAvailabilityRequest.returns({ id: '3245', name: 'name' });
        stubMAOAuthTokenHelper.returns({
            getValidToken: function () {
                return { accessToken: 'testtoken' };
            }
        });
        stubgetAvailability.returns('');
        var response = MAOAvailability.getMaoAvailability(null, null);
        assert.isNull(response);
        stubgetAvailability.reset();
        stubgetAvailability.returns(null);
        response = MAOAvailability.getMaoAvailability(null, null);
        stubgetAvailability.reset();
        assert.isNull(response);
    });

    it('should return response as a null, when responseObject is null or empty ', () => {
        stubgetAvailability.returns({
            call: function () {
                return null;
            }
        });
        var response = MAOAvailability.getMaoAvailability(null, null);
        stubgetAvailability.reset();
        assert.isNull(response);
    });

    it('should return response as a null, when responseObject status is ERROR', () => {
        stubgetAvailability.returns({
            call: function () {
                return {
                    status: 'ERROR',
                    object: {}
                };
            }
        });
        var response = MAOAvailability.getMaoAvailability(null, null);
        stubgetAvailability.reset();
        assert.isNull(response);
    });

    it('should return response as a empty , when in responseObject object is empty ', () => {
        stubgetAvailability.returns({
            call: function () {
                return {
                    status: 'OK',
                    object: {}
                };
            }
        });
        var response = MAOAvailability.getMaoAvailability(items, locations);
        stubgetAvailability.reset();
        assert.deepEqual(response, {});
    });

    it('should return response with endpointurl as true, when function invoke with locations parmas', () => {
        stubgetAvailability.returns({
            call: function () {
                return {
                    status: 'OK',
                    object: {
                        data: 'testdata',
                        endPointUrl: true
                    }
                };
            }
        });
        var response = MAOAvailability.getMaoAvailability(items, locations);
        stubgetAvailability.reset();
        assert.isTrue(response.endPointUrl);
    });

    it('should return response with endpointurl as false, when function invoke without locations parmas', () => {
        stubgetAvailability.returns({
            call: function () {
                return {
                    status: 'OK',
                    object: {
                        data: 'testdata',
                        endPointUrl: false
                    }
                };
            }
        });
        var response = MAOAvailability.getMaoAvailability(items, locations);
        stubgetAvailability.reset();
        assert.isFalse(response.endPointUrl);
    });

    it('should return response, when availabilityRequestJSON object has valid values with properties', () => {
        stubgetAvailability.returns({
            call: function () {
                return {
                    status: 'OK',
                    object: {
                        data: 'testdata',
                        quantity: '5',
                        available: true
                    }
                };
            }
        });

        var response = MAOAvailability.getMaoAvailability(items, locations);
        assert.equal(response.data, 'testdata');
        assert.isTrue(response.available);
    });
});