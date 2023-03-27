'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;

describe('int_QAS/cartridge/scripts/QASActions/actions/Address', () => {

    var Address = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions/Address.js', {
        '../../utils/Class': {
            Class: Class.extend({})
        },
        'dw/util/Locale': {
            getLocale: function () {
                return {};
            }
        },
        'dw/system/Site': {
            getCurrent: function () {
                return {
                    getCustomPreferenceValue: function () {
                        return 'layout';
                    }
                };
            }
        },
        'dw/util/Bytes': function () {},
        'dw/system/CacheMgr': {
            getCache: function () {
                return {
                    put: function () {
                        return 'added';
                    }
                };
            }
        },
        'dw/crypto/MessageDigest': function () {
            return {
                digestBytes: function () {
                    return {
                        toString: function () {
                            return;
                        }
                    };
                }
            };
        }
    });

    it('Testing updateRefinedList', () => {
        var AddressObj = Address.extend({
            response: {
                result: {
                    getQAPicklist: function () {
                        return {
                            getPicklistEntry: function () {
                                return [
                                    {
                                        getMoniker: function () {
                                            return {};
                                        },
                                        getPicklist: function () {
                                            return {};
                                        },
                                        getPartialAddress: function () {
                                            return {};
                                        }
                                    }
                                ];
                            },
                            getFullPicklistMoniker: function () {
                                return '';
                            }
                        };
                    }
                }
            },
            setResultAddress: (address) => {
                assert.isNotNull(address.address1, 'Address1 is not null for response null');
                assert.isNotNull(address.address2, 'Address2 is not null for response null');
                assert.isNotNull(address.city, 'City is not null for response null');
                assert.isNotNull(address.state, 'State is not null for response null');
                assert.isNotNull(address.zipCode, 'ZipCode is not null for response null');
            }
        });
        AddressObj.prototype.updateRefinedList();
    });

    it('Testing getCache', () => {
        var AddressObj = Address.extend({
            cache: false,
            enabledCache: true
        });
        AddressObj.prototype.getCache();
    });

    it('Testing clearResponse', () => {
        var AddressObj = Address.extend({
            response: {}
        });
        AddressObj.prototype.clearResponse();
    });

    it('Testing clearRefinedList', () => {
        var AddressObj = Address.extend({
            refinedList: {}
        });
        AddressObj.prototype.clearRefinedList();
    });

    it('Testing getCountry', () => {
        var AddressObj = Address.extend({
            country: null
        });
        AddressObj.prototype.getCountry();
    });

    it('Testing getLayout', () => {
        var AddressObj = Address.extend({
            layout: null
        });
        AddressObj.prototype.getLayout();
    });

    it('Testing addDataToCache', () => {
        var AddressObj = Address.extend({
            getCache: function () {
                return {
                    put: function () {
                        return 'item added';
                    }
                };
            }
        });
        var param = [{ test: 'test' }];
        AddressObj.prototype.addDataToCache('action', param, {});
    });

    it('Testing getDataFromCache', () => {
        var AddressObj = Address.extend({
            response: {},
            getCache: function () {
                return {
                    get: function () {
                        return 'item added';
                    }
                };
            }
        });
        var param = ['test'];
        AddressObj.prototype.getDataFromCache('action', param);
    });

    it('Testing getDataFromCache', () => {
        var AddressObj = Address.extend({
            response: {},
            getCache: function () {
                return null;
            }
        });
        var param = ['test'];
        AddressObj.prototype.getDataFromCache('action', param);
    });
});
