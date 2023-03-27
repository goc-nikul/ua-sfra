'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var sinon = require('sinon');
var stubgetValidToken = sinon.stub();
var stubCall = sinon.stub();

global.empty = (data) => {
    return !data;
};

class firstDataAuthTokenHelper {
    constructor() {
        this.getValidToken = stubgetValidToken
    }
}

var halHelpers = proxyquire('../../../cartridges/app_ua_core/cartridge/scripts/helpers/halHelper.js', {
    'dw/system/Logger': require('../../mocks/dw/dw_system_Logger'),
    'dw/util/Locale': require('../../mocks/dw/dw_util_Locale'),
    'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
    'int_first_data/cartridge/scripts/firstDataAuthTokenHelper': firstDataAuthTokenHelper,
    'int_first_data/cartridge/scripts/services/firstDataService': {
        createGraphQLService: () => {
            return {
                call: stubCall
            }
        }
    },
    maxDistanceMiles : null
});
describe('halHelpers.js file test cases', function () {
    describe('isValidAddress method test cases', function () {
        it('Test case for basket and its objects are given', () => {
            global.request = {
                getLocale: () => true
            };
            stubgetValidToken.returns({ accessToken: 'testtoken' });
            stubCall.returns(
                { status: 'OK',
                  object: {
                statusCode: 200,
                text: JSON.stringify({
                    data:{
                        pickupLocationByAddress :{
                            address : 'test',
                            companyName: 'test Company Name'
                        }
                    }
                })
                 }
                }
            ) ;
            var basket = {
                custom: {
                    isCommercialPickup: true
                },
                defaultShipment: {
                    shippingAddress: {
                        address2: 'test Address',
                        city: 'test city',
                        stateCode: 'test stateCode',
                        postalCode: 'test postalCode',
                        countryCode: {
                            value: 'test CountryCode'
                        }
                    }
                }
            };
            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case to cover catch block', () => {
            stubgetValidToken.returns({ accessToken: 'testtoken' });
            stubCall.returns(
                { status: 'OK',
                  object: {
                    statusCode: 200,
                    text: JSON.stringify({
                    data:{
                        pickupLocationByAddress :{
                            address : 'test',
                            companyName: 'test Company Name'
                        }
                    }
                })
                 }
                }
            ) ;
            var basket = {
                custom: {
                    isCommercialPickup: true
                },
                defaultShipment: {
                    shippingAddress: {}
                }
            };
            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for basket and its objects are given but text is null', () => {
            stubgetValidToken.returns({ accessToken: 'testtoken' });
            stubCall.returns(
                { status: 'OK',
                  object: {
                statusCode: 200,
                text: JSON.stringify({data:null})
                 }
                }
            ) ;
            var basket = {
                custom: {
                    isCommercialPickup: true
                },
                defaultShipment: {
                    shippingAddress: {
                        address2: 'test Address',
                        city: 'test city',
                        stateCode: 'test stateCode',
                        postalCode: 'test postalCode',
                        countryCode: {
                            value: 'test CountryCode'
                        }
                    }
                }
            };
            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for basket and its objects are given but status code is null', () => {
            stubgetValidToken.returns({ accessToken: 'testtoken' });
            stubCall.reset();
            stubCall.returns(
                { status: 'NOT OK',
                  object: {
                  statusCode: null
                 }
                }
            ) ;
            var basket = {
                custom: {
                    isCommercialPickup: true
                },
                defaultShipment: {
                    shippingAddress: {
                        address2: 'test Address',
                        city: 'test city',
                        stateCode: 'test stateCode',
                        postalCode: 'test postalCode',
                        countryCode: {
                            value: 'test CountryCode'
                        }
                    }
                }
            };

            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for basket and its objects are given and getValidToken returns null', () => {
            stubgetValidToken.returns(null);
            stubCall.returns(
                { status: 'OK',
                  object: {
                statusCode: 200,
                text: JSON.stringify({data:'abcd'})
                 }
                }
            ) ;
            var basket = {
                custom: {
                    isCommercialPickup: true
                },
                defaultShipment: {
                    shippingAddress: {
                        address2: 'test Address',
                        city: 'test city',
                        stateCode: 'test stateCode',
                        postalCode: 'test postalCode',
                        countryCode: {
                            value: 'test CountryCode'
                        }
                    }
                }
            };

            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
        it('Test case for basket and its objects are not given', () => {
            var basket = {
                custom: {
                    isCommercialPickup: false
                },
                defaultShipment: null
            };
            var result = halHelpers.isValidAddress(basket);
            assert.isDefined(result, 'Is not defined');
        });
    });
    describe('getPickupLocationsByAddress method test cases', function () {
        it('Test case for address is not given', () => {
            stubgetValidToken.reset();
            stubgetValidToken.returns({ accessToken: '' })
            var address = '';
            var result = halHelpers.getPickupLocationsByAddress(address);
            assert.isUndefined(result, 'Is not isUndefined');
        });

        it('Test case for address is given', () => {
            var address = {
                test: 'test Address'
            };
            var result = halHelpers.getPickupLocationsByAddress(address);
            assert.isNull(result, 'Is not Null');
        });
    });
    describe('getPickupLocationsByGeolocation method test cases', function () {
        it('Test case for geolocation is given', () => {
            var geolocation = {
                test: 'test geolocation'
            };
            var result = halHelpers.getPickupLocationsByGeolocation( geolocation, 0);
            assert.isNull(result, 'Is null');
        });
        it('Test case for gelocation is not given', () => {
            var geolocation = '';
            var result = halHelpers.getPickupLocationsByGeolocation( geolocation, 0 );
            assert.isNotNull(result, 'Is null');
        });
    });
    describe('getPickupLocationsByPostalCode method test cases', function () {
        it('Test case for postalCode is given', () => {
          var postalCode = {
             test: 'test postalCode'
            }
            var result = halHelpers.getPickupLocationsByPostalCode(postalCode, 0);
            assert.isNull(result, 'Is null');
        });
        it('Test case for postalCode is not given', () => {
            var postalCode = null;
            var result = halHelpers.getPickupLocationsByPostalCode(postalCode, 0);
            assert.isNotNull(result, 'Is null');
        });
    });
});