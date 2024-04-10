'use strict';

const assert = require('chai').assert;
const proxyquire = require('proxyquire').noCallThru().noPreserveCache();

let printOrder = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/printOrder.js', {
    'dw/web/Resource': {
        msgf: function (params) { return params; },
        msg: function (params) {
            return params;
        }
    }
});

describe('Localization Tests', () => {
    global.empty = (data) => {
        return !data;
    };
    it('should return an array of localized strings', () => {
        const locale = 'en_GB';
        const result = printOrder.getFooterContent(locale);
        assert.isArray(result);
        assert.equal(result.length, 5);
    });

    it('should return an array of localized strings - test2', () => {
        printOrder = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/printOrder.js', {
            'dw/web/Resource': {
                msgf: function (params) { return params; },
                msg: function (params) {
                    if (params.indexOf('forms.invoice.wee') > -1) {
                        return null;
                    }
                    return params;
                }
            }
        });
        const locale = 'en_GB';
        const result = printOrder.getFooterContent(locale);
        assert.isArray(result);
        assert.equal(result.length, 5);
    });

    it('should return an object with localized labels', () => {
        const locale = 'en_GB';
        const result = printOrder.getLocaleResources(locale);
        assert.isObject(result);
        assert.equal(Object.keys(result).length, 21);
    });

    it('should return an object with localized labels - test 2', () => {
        printOrder = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/printOrder.js', {
            'dw/web/Resource': {
                msgf: function (params) { return params; },
                msg: function (params, file) {
                    if (file.indexOf('forms_') > -1) {
                        return null;
                    }
                    return params;
                }
            }
        });
        const locale = 'en_GB';
        const result = printOrder.getLocaleResources(locale);
        assert.isObject(result);
        assert.equal(Object.keys(result).length, 21);
    });

    it('should return an object with localized labels - test 3', () => {
        printOrder = proxyquire('../../../../../cartridges/app_ua_emea/cartridge/scripts/helpers/printOrder.js', {
            'dw/web/Resource': {
                msgf: function (params) { return params; },
                msg: function (params, file) {
                    if (file.indexOf('forms_') > -1) {
                        return null;
                    }
                    if (file.indexOf('forms_en') > -1) {
                        return null;
                    }
                    return params;
                }
            }
        });
        const locale = 'en_GB';
        const result = printOrder.getLocaleResources(locale);
        assert.isObject(result);
        assert.equal(Object.keys(result).length, 21);
    });
});

describe('Colorname Tests', () => {
    it('should split colorname', () => {
        const result = printOrder.fixProductColorNames('red');
        assert.equal(result, '');
    });

    it('should split colorname at 2 levels', () => {
        const result = printOrder.fixProductColorNames('red/black');
        assert.equal(result, 'red / black');
    });

    it('should split colorname at 3 levels', () => {
        const result = printOrder.fixProductColorNames('red/red/blue');
        assert.equal(result, 'red / blue');
    });
});