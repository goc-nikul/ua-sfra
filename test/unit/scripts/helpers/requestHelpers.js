'use strict';

const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const assert = require('chai').assert;

describe('app_ua_core/cartridge/scripts/helpers/requestHelpers.js', () => {
    let RequestHelpers = proxyquire('../../../../cartridges/app_ua_core/cartridge/scripts/helpers/requestHelpers.js', {});


    describe('Testing method: isRequestTransactional()', () => {

        it('should return false when request is GET and is OCAPI request', () => {
            let request = {
                httpMethod: 'GET',
                clientId: '123',
                SCAPI: false,
                ocapiVersion: '23_2'
            };
            let result = RequestHelpers.isRequestTransactional(request);
            assert.equal(result, false);
        });

        it('should return true when request is not GET and is OCAPI request', () => {
            let request = {
                httpMethod: 'POST',
                clientId: '123',
                SCAPI: false,
                ocapiVersion: '23_2'
            };
            let result = RequestHelpers.isRequestTransactional(request);
            assert.equal(result, true);
        });

        it('should return true when request is not GET and is not OCAPI request', () => {
            let request = {
                httpMethod: 'POST',
                clientId: null,
                SCAPI: false,
                ocapiVersion: null
            };
            let result = RequestHelpers.isRequestTransactional(request);
            assert.equal(result, true);
        });

        it('should return true when request is GET and is not OCAPI request', () => {
            let request = {
                httpMethod: 'GET',
                clientId: null,
                SCAPI: false,
                ocapiVersion: null
            };
            let result = RequestHelpers.isRequestTransactional(request);
            assert.equal(result, true);
        });
    });
});
