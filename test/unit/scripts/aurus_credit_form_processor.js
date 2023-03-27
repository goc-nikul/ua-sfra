var assert = require('chai').assert;
var proxyquire = require('proxyquire').noCallThru().noPreserveCache();

// Path to scripts
var pathToCartridges = '../../../cartridges/';
var pathToLinkScripts = pathToCartridges + 'int_aurus_custom/cartridge/scripts/';

// Path to test scripts
var pathToCoreMock = '../../mocks/';

describe('Aurus: hooks/payment/processor/aurus_credit_form_processor test', () => {
    
    var aurusCreditFormProcessor = proxyquire(pathToLinkScripts + 'hooks/payment/processor/aurus_credit_form_processor', {
        '*/cartridge/scripts/checkout/checkoutHelpers': {
            validateCreditCard: function () {
                return true;
            }
        },
        '*/cartridge/scripts/util/array': {},
        'dw/system/Logger': require(pathToCoreMock + 'dw/dw_system_Logger'),
        'dw/web/Resource': require(pathToCoreMock + 'dw/dw_web_Resource')
    });

    it('Testing method: processForm', () => {
        // Prepare Request
        var Customer = require(pathToCoreMock + 'dw/dw_customer_Customer');
        var req = {
            currentCustomer : {
                raw: new Customer()
            },
            form: {}
        }
        // Prepare payment Form
        var paymentForm = {
            paymentMethod: {
                value: 'AURUS_CREDIT_CARD'
            },
            creditCardFields: {
                cardType: {
                    value: 'some card type value',
                    htmlName: 'some card type html name'
                },
                cardNumber: {
                    value: 'some card number value',
                    htmlName: 'some card number html name'
                },
                securityCode: {
                    value: 'some card cvv value',
                    htmlName: 'some card cvv html name'
                },
                expirationMonth: {
                    selectedOption: '10',
                    htmlName: 'some card expiration month html name'
                },
                expirationYear: {
                    value: '2030',
                    htmlName: 'some card expiration year html name'
                },
                expirationDate: {
                    htmlValue: '1030'
                },
                ott: {
                    htmlValue: 'test'
                },
                saveCard: {
                    checked: false
                }
            },
        };
        // Process Form
        var result = aurusCreditFormProcessor.processForm(req, paymentForm, {});
        assert.equal('AURUS_CREDIT_CARD', result.viewData.paymentInformation.paymentMethodID.value);
        assert.equal(false, result.error);
    });


});