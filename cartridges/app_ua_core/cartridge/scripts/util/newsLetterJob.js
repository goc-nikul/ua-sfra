'use strict';

var preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

/**
 * execute function merkle subscription email service Job
 * @return {void}
 */
function execute() {
    try {
        var customObjectMgr = require('dw/object/CustomObjectMgr');
        var customObjIterator = customObjectMgr.getAllCustomObjects('NewsLetterSignUp');
        while (customObjIterator.hasNext()) {
            var customObj = customObjIterator.next();
            var email = customObj.custom.email;
            var country = '';
            var language = '';

            if ('country' in customObj.custom && !empty(customObj.custom.country)) {
                country = customObj.custom.country.slice(-2).toUpperCase();
                language = customObj.custom.country.substring(0, 2);
            }
            var emailSourceCode;
            var emailWebSourceJSON = preferencesUtil.getJsonValue('emailWebSourceCodesJSON');
            if (!empty(emailWebSourceJSON) && !empty(country)) {
                emailSourceCode = emailWebSourceJSON[country].checkout;
            } else if (!empty(emailWebSourceJSON)) {
                emailSourceCode = emailWebSourceJSON.checkout;
            }
            var resObj = require('*/cartridge/modules/providers').get('Newsletter', { email: email, merkleSourceCode: emailSourceCode, country: country, lng: language }).subscribe();
            if (resObj && 'MerkleStatus' in resObj && resObj.MerkleStatus === 'success') {
                require('dw/system/Transaction').wrap(function () { // eslint-disable-line
                    customObjectMgr.remove(customObj);
                });
            }
        }
        return PIPELET_NEXT;
    } catch (e) {
        require('dw/system/Logger').error('Error while executing the script NewsLetterSignUp.js Error..' + e.message);
        return PIPELET_ERROR;
    }
}

exports.execute = execute;
