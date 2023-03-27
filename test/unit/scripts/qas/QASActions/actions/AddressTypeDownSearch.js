'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;

describe('int_QAS/cartridge/scripts/QASActions/actions/AddressTypeDownSearch', () => {
    var AddressTypeDownSearch = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions/AddressTypeDownSearch.js', {
        './Address': Class.extend({}),
        '../../services/QASService': {
            addressTypeDownSearchService: {
                call: function () {
                    return {};
                }
            }
        }
    });

    it('Testing updateResult', () => {
        var addressTypeDownSearchObj = AddressTypeDownSearch.extend({
            updateRefinedList: function () {
                return {};
            }
        });
        addressTypeDownSearchObj.prototype.updateResult();
    });

    it('Testing updateResultUsingCache', () => {
        var AddressTypeDownSearchObj = AddressTypeDownSearch.extend({
            response: {}
        });
        AddressTypeDownSearchObj.prototype.updateResultUsingCache({});
    });

    it('Testing clearState', () => {
        var AddressTypeDownSearchObj = AddressTypeDownSearch.extend({
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            }
        });
        AddressTypeDownSearchObj.prototype.clearState();
    });

    it('Testing execute', () => {
        var AddressTypeDownSearchObj = AddressTypeDownSearch.extend({
            response: {},
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            },
            getLayout: function () {
                return {};
            },
            updateRefinedList: function () {
                return {};
            },
            getCountry: function () {
                return {};
            }
        });
        AddressTypeDownSearchObj.prototype.execute();
    });

    it('Testing getResult', () => {
        var AddressTypeDownSearchObj = AddressTypeDownSearch.extend({
            response: {}
        });
        AddressTypeDownSearchObj.prototype.getResult();
    });
});
