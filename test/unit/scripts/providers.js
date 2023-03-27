'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/modules/providers', function() {
	class TestProvider {
	    constructor() {
	        this.data = 'test';
	    }

	    get() {
	        return this.data;
	    }
	}

    let providers = proxyquire('../../../cartridges/app_ua_core/cartridge/modules/providers', {
        '*/cartridge/providers/AbstractTestProvider': TestProvider
    });

    it('Testing method: init', () => {
        let result = providers.get('Test');
        assert.equal('test', 'test');
    });
});