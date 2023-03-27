'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

var Class = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/utils/Class.js', {}).Class;

describe('int_QAS/cartridge/scripts/QASActions/actions/AddressRefine', () => {

    var AddressRefine = proxyquire('../../../../../../cartridges/int_QAS/cartridge/scripts/QASActions/actions/AddressRefine.js', {
        './Address': Class.extend({}),
        '../../services/QASService': {
            addressRefineService: {
                call: function () {
                    return {};
                }
            }
        }
    });

    it('Testing updateResult', () => {
        var AddressRefineObj = AddressRefine.extend({
            updateRefinedList: function () {
                return {};
            }
        });
        AddressRefineObj.prototype.updateResult();
    });

    it('Testing updateResultUsingCache', () => {
        var AddressRefineObj = AddressRefine.extend({
            response: {}
        });
        AddressRefineObj.prototype.updateResultUsingCache({});
    });

    it('Testing clearState', () => {
        var AddressRefineObj = AddressRefine.extend({
            clearRefinedList: function () {
                return {};
            },
            clearResponse: function () {
                return {};
            }
        });
        AddressRefineObj.prototype.clearState();
    });

    it('Testing execute', () => {
        var AddressRefineObj = AddressRefine.extend({
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
            }
        });
        AddressRefineObj.prototype.execute();
    });

    it('Testing getResult', () => {
        var AddressRefineObj = AddressRefine.extend({
            response: {}
        });
        AddressRefineObj.prototype.getResult();
    });
});
