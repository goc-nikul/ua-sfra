'use strict';


const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

describe('int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js file test cases', function () {
    it('Testing for getKlarnaCountriesObject in isEnabledCartPage is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledCartPage();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledCartPage is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmCartEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledCartPage();
        assert.isNull(result, 'result is false');
    });
    it('Testing for isEnabledCartPage is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmCartEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledCartPage();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getCartPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmCartTagId is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmCartTagId: null
                }
            };
        };
        let result = klarnaOSM.getCartPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmCartTagId is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmCartTagId: 'credit-promotion-standard'
                }
            };
        };
        let result = klarnaOSM.getCartPagePlacementTagId();
        assert.equal(result, 'credit-promotion-standard');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledPDPPage is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledPDPPage();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledPDPPage is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmPDPEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledPDPPage();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledPDPPage is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmPDPEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledPDPPage();
        assert.isTrue(result, 'result is true');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getPDPPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmPDPTagId is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmPDPTagId: null
                }
            };
        };
        let result = klarnaOSM.getPDPPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmPDPTagId is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmPDPTagId: 'credit-promotion-auto-size'
                }
            };
        };
        let result = klarnaOSM.getPDPPagePlacementTagId();
        assert.equal(result, 'credit-promotion-auto-size');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledCartPage is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledHeader();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledCartPage is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmHeaderEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledHeader();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledCartPage is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmHeaderEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledHeader();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getHeaderPlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmHeaderTagId is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmHeaderTagId: null
                }
            };
        };
        let result = klarnaOSM.getHeaderPlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for osmHeaderTagId is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmHeaderTagId: 'credit-promotion-auto-size'
                }
            };
        };
        let result = klarnaOSM.getHeaderPlacementTagId();
        assert.equal(result, 'credit-promotion-auto-size');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledFooter is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledFooter();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledFooter is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmFooterEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledFooter();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledFooter is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmFooterEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledFooter();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        var klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        var result = klarnaOSM.getInfoPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getInfoPagePlacementTagId is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmInfoPageTagId: null
                }
            };
        };
        let result = klarnaOSM.getInfoPagePlacementTagId();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getInfoPagePlacementTagId is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmInfoPageTagId: 'credit-promotion-auto-size'
                }
            };
        };
        let result = klarnaOSM.getInfoPagePlacementTagId();
        assert.equal(result, 'credit-promotion-auto-size');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledDataInline is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledDataInline();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledDataInline is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmDataInlineEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledDataInline();
        assert.isNull(result, 'result is null');
    });
    it('Testing for isEnabledDataInline is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmDataInlineEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledDataInline();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getUCI();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getUCI is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmUCI: null
                }
            };
        };
        let result = klarnaOSM.getUCI();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getUCI is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmUCI: 'client1234'
                }
            };
        };
        let result = klarnaOSM.getUCI();
        assert.equal(result, 'client1234');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getScriptURL();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getScriptURL is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmLibraryUrl: null
                }
            };
        };
        let result = klarnaOSM.getScriptURL();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getScriptURL is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    osmLibraryUrl: 'https://klarnaservices.com/lib.js'
                }
            };
        };
        let result = klarnaOSM.getScriptURL();
        assert.equal(result, 'https://klarnaservices.com/lib.js');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getExpressButtonScriptURL();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getExpressButtonScriptURL is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebLibraryUrl: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonScriptURL();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getExpressButtonScriptURL is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebLibraryUrl: 'https://express-button/v1/lib.js'
                }
            };
        };
        let result = klarnaOSM.getExpressButtonScriptURL();
        assert.equal(result, 'https://express-button/v1/lib.js');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        var klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        var result = klarnaOSM.getExpressButtonMID();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getExpressButtonMID is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMerchantID: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonMID();
        assert.isNull(result, 'result is Null');
    });
    it('Testing for getExpressButtonMID is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMerchantID: 'PN02879'
                }
            };
        };
        let result = klarnaOSM.getExpressButtonMID();
        assert.equal(result, 'PN02879');
    });
    it('Testing for isEnabledExpressButtonCheckout is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCheckoutEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledExpressButtonCheckout();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledExpressButtonCheckout is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCheckoutEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledExpressButtonCheckout();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getExpressButtonLabel is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebLabel: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonLabel();
        assert.equal(result, 'klarna');
    });
    it('Testing for getExpressButtonLabel is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebLabel: 'test'
                }
            };
        };
        let result = klarnaOSM.getExpressButtonLabel();
        assert.equal(result, 'test');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledExpressButtonCart is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledExpressButtonCart();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledExpressButtonCart is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCartEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledExpressButtonCart();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledExpressButtonCart is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCartEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledExpressButtonCart();
        assert.isTrue(result, 'result is true');
    });
    it('Testing for isEnabledExpress is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCheckoutEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledExpress();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledExpress is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCheckoutEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledExpress();
        assert.isTrue(result, 'result is true');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getExpressButtonEnvironment();
        assert.equal(result, 'playground');
    });
    it('Testing for getExpressButtonEnvironment is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebEnvironment: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonEnvironment();
        assert.equal(result, 'playground');
    });
    it('Testing for getExpressButtonEnvironment is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebEnvironment: {
                        value: 'test'
                    }
                }
            };
        };
        let result = klarnaOSM.getExpressButtonEnvironment();
        assert.equal(result, 'test');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getExpressButtonCategory();
        assert.equal(result, '');
    });
    it('Testing for getExpressButtonCategory is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCategory: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonCategory();
        assert.equal(result, '');
    });
    it('Testing for getExpressButtonCategory is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebCategory: 'test'
                }
            };
        };
        let result = klarnaOSM.getExpressButtonCategory();
        assert.equal(result, 'test');
    });
    it('Testing for getKlarnaCountriesObject in isEnabledMCExpressButton is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.isEnabledMCExpressButton();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledMCExpressButton is false', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMCEnabled: false
                }
            };
        };
        let result = klarnaOSM.isEnabledMCExpressButton();
        assert.isFalse(result, 'result is false');
    });
    it('Testing for isEnabledMCExpressButton is true', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMCEnabled: true
                }
            };
        };
        let result = klarnaOSM.isEnabledMCExpressButton();
        assert.isTrue(result, 'result is True');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getMCExpressButtonTheme();
        assert.equal(result, 'default');
    });
    it('Testing for getMCExpressButtonTheme is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMCTheme: null
                }
            };
        };
        let result = klarnaOSM.getMCExpressButtonTheme();
        assert.equal(result, 'default');
    });
    it('Testing for getMCExpressButtonTheme is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMCTheme: {
                        value: 'TestTheme'
                    }
                }
            };
        };
        let result = klarnaOSM.getMCExpressButtonTheme();
        assert.equal(result, 'TestTheme');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getExpressButtonShape();
        assert.equal(result, 'default');
    });
    it('Testing for getExpressButtonShape is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebShape: null
                }
            };
        };
        let result = klarnaOSM.getExpressButtonShape();
        assert.equal(result, 'default');
    });
    it('Testing for getExpressButtonShape is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebShape: {
                        value: 'TestShape'
                    }
                }
            };
        };
        let result = klarnaOSM.getExpressButtonShape();
        assert.equal(result, 'TestShape');
    });
    it('Testing for getKlarnaCountriesObject is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return null;
        };
        let result = klarnaOSM.getMiniCartExpressButtonShape();
        assert.equal(result, 'default');
    });
    it('Testing for getMiniCartExpressButtonShape is null', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMiniCartShape: null
                }
            };
        };
        var result = klarnaOSM.getMiniCartExpressButtonShape();
        assert.equal(result, 'default');
    });
    it('Testing for getMiniCartExpressButtonShape is exists', () => {
        let klarnaOSM = proxyquire('../../../../cartridges/int_klarna_payments_custom/cartridge/scripts/marketing/klarnaOSM.js', {});
        klarnaOSM.getKlarnaCountriesObject = function () {
            return {
                custom: {
                    kebMiniCartShape: {
                        value: 'TestShape'
                    }
                }
            };
        };
        let result = klarnaOSM.getMiniCartExpressButtonShape();
        assert.equal(result, 'TestShape');
    });
});
