'use strict';

const {
    assert
} = require('chai');
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();
const sinon = require('sinon');

var flashStub = sinon.stub();

describe('int_ocapi/cartridge/hooks/shop/basket/validate_basket.js', () => {

    it('Testing method: validateBasket', () => {
        var validateBasket = proxyquire('../../../../../../cartridges/int_ocapi/cartridge/hooks/shop/basket/validate_basket.js', {
            'dw/system/Status': require('../../../../../mocks/dw/dw_system_Status'),
            '*/cartridge/scripts/util/collections': {
                forEach: (array, callback) => {
                    array.forEach((item) => callback(item));
                }
            },
            'dw/web/Resource': require('../../../../../mocks/dw/dw_web_Resource'),
            '*/cartridge/scripts/errorLogHelper': {
                handleOcapiHookErrorStatus: () => ''
            }
        });
        assert.doesNotThrow(() => validateBasket.validateBasket());
        var basketResponse = {
            flashes: [{
                type: 'customEmailIdRequired'
            }],
            removeFlash: () => true,
            customer_info: {
                email: null
            },
            addFlash: flashStub
        };
        var duringSubmit = true;

        flashStub.returns(true);
        assert.doesNotThrow(() => validateBasket.validateBasket(basketResponse, duringSubmit));
        flashStub.throws(new Error('Test'));
        assert.doesNotThrow(() => validateBasket.validateBasket(basketResponse, duringSubmit));
        flashStub.resetBehavior();
    });

});
