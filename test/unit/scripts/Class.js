'use strict';

/* eslint-disable */

const assert = require('chai').assert;

describe('app_ua_core/cartridge/scripts/utils/Class test', () => {

    let Class = require('../../../cartridges/app_ua_core/cartridge/scripts/utils/Class').Class;

    it('Testing constructor Class', () => {
        let propertyTest = Class.hasOwnProperty('extend');
        assert.equal(true, propertyTest, 'check if Class.js have its basic method');

        let abstractClass = Class.extend({
            init: function(data) {
                this.data = data || {};
                return this;
            }
        });

        var testAbstractClass = new abstractClass();
        assert.equal(true, testAbstractClass.init(true).data, 'check if we can use "extend" method to create new classes');
    });
});
