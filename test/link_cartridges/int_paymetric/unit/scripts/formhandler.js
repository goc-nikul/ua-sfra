'use strict';

var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_paymetric/cartridge/scripts/';

describe('Paymetric: payment/processor/formhandler test', () => {
    var Forms = function () {
        var formData = {
            paymetric: {
                payload: {
                    value: 'test'
                }
            }
        };

        this.getForm = function (id) {
            return formData[id];
        };
    };
    var server = {
        forms: new Forms()
    };
    var formhandler = proxyquire(pathToLinkScripts + 'hooks/payment/processor/formhandler', {
        'server': server
    });

    it('Testing method: processForm', () => {
        var paymentForm = {
            paymentMethod: {
                value: 'Paymetric'
            }
        };
        var result = formhandler.processForm(null, paymentForm, {});
        assert.equal('Paymetric', result.viewData.paymentInformation.paymentMethodID.value);
        assert.equal('test', result.viewData.paymentInformation.payload.value);
    });

    it('Testing method: savePaymentInformation', () => {
        var result = formhandler.savePaymentInformation();
        assert.equal(true, result);
    });
});
