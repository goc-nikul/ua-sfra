'use strict';

/* eslint-disable */

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('app_ua_core/cartridge/providers/QASAddressVerificationProvider', function() {

    class QasAbstractClass {
        getResult() {
            return {
                error: false,
                verificationStatus: true,
                address: {
                    result: true,
                    origin: true
                },
                refinedList: {
                    moniker: true,
                    picklist: [{}]
                }
            }
        }

        execute() {}
    }

    class QASActions {
        constructor() {
            this.get = new QasAbstractClass();
            this.search = new QasAbstractClass();
            this.refine = new QasAbstractClass();
            this.typeDownSearch = new QasAbstractClass();
        }
    }

    let QASAddressVerificationProvider = proxyquire('../../../cartridges/app_ua_core/cartridge/providers/QASAddressVerificationProvider', {
        'dw/system/Site': require('../../mocks/dw/dw_system_Site'),
        './AbstractAddressVerificationProvider': require('../../mocks/scripts/AbstractProvider'),
        '*/cartridge/scripts/QASActions/actions': new QASActions()
    });

    let provider = new QASAddressVerificationProvider();

    it('Testing method: enabledInBM', () => {
        let result = provider.enabledInBM();
        assert.equal(true, result);
    });

    it('Testing method: get', () => {
        let result = provider.get(true);
        assert.deepEqual(result, {
            success: true,
            address: true
        });
    });

    it('Testing method: search', () => {
        let result = provider.search(true);
        assert.deepEqual(result, {
            "address": true,
            "moniker": true,
            "original": true,
            "refinedList": [{}],
            "status": true,
            "success": true
        });
    });

    it('Testing method: update', () => {
        let result = provider.update(true);
        assert.deepEqual(result, {
            success: true,
            address: true
        });
    });

    it('Testing method: typeDownSearch', () => {
        let result = provider.typeDownSearch(true);
        assert.deepEqual(result, {
            success: true,
            result: {}
        });
    });
});
