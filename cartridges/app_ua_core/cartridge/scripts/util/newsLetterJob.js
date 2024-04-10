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

            var merkleEmailStatus;
            var Site = require('dw/system/Site');

            if (Site.getCurrent().getCustomPreferenceValue('isMarketingAutoOptInEnabled')) {
                var merkleStatus = require('*/cartridge/modules/providers').get('Newsletter', {
                    email: email,
                    merkleSourceCode: emailSourceCode,
                    country: country,
                    lng: language
                }).status();

                if (merkleStatus && 'status' in merkleStatus && 'Ecomm' in merkleStatus) {
                    merkleEmailStatus = merkleStatus.status.Ecomm;
                    if (merkleEmailStatus !== '' && merkleEmailStatus !== null) {
                        // if already subscribed, just remove custom object and skip
                        require('dw/system/Transaction').wrap(function () { // eslint-disable-line
                            customObjectMgr.remove(customObj);
                        });
                        continue; // eslint-disable-line
                    }
                }
            }

            // otherwise, perform as normal
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
