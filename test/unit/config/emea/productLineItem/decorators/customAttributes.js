'use strict';

const assert = require('chai').assert;

describe(' app_ua_emea/cartridge/models/productLineItem/decorators/customAttributes.js', () => {
    it('Testing customAttributes', () => {
        var customAttributes = require('../../../../../../cartridges/app_ua_emea/cartridge/models/productLineItem/decorators/customAttributes');
        var result = customAttributes({}, { custom: {} });
        assert.isUndefined(result);
    });
});
