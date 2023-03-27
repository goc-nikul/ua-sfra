'use strict';

var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var Resource = require('dw/web/Resource');

/**
 * This function is used to finding and giving error if  any cross site  vulnerabilities found.
 * @param {Object} object - form object
 * @param {Array} addressFieldsToVerify error messages
 * @returns {Object} an error object
 */
function crossSiteScriptPatterns(object, addressFieldsToVerify) {
    var errors = {};
    try {
        var listOfXSSRegex = PreferencesUtil.getValue('XSSListOfPatterns'); // String value, not JSON
        var field = '';
        var value = '';
        if (!empty(listOfXSSRegex)) {
            for (var i = 0; i < addressFieldsToVerify.length; i++) {
                field = addressFieldsToVerify[i];
                value = object[field];
                var regexp;
                if (!empty(value)) {
                    regexp = new RegExp(listOfXSSRegex);
                    if (!empty(value) && value.toLowerCase().search(regexp) !== -1) {
                        errors[field] = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
                    }
                }
            }
        }
    } catch (e) {
         // TODO:
    }
    return errors;
}
module.exports.crossSiteScriptPatterns = crossSiteScriptPatterns;
