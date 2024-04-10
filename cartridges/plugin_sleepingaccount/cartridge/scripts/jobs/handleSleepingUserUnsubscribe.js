'use strict';

var Transaction = require('dw/system/Transaction');

/**
 * Function for sleeping user email
 *
 */
exports.execute = function () {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var customObjIterator = CustomObjectMgr.getAllCustomObjects('SleepingAccountEmails');
    while (customObjIterator.hasNext()) {
        var customObj = customObjIterator.next();
        var email = customObj.custom.customerEmail;

        if (accountHelpers.unsubscribeEmailSFMC(email)) {
            Transaction.begin();
            CustomObjectMgr.remove(customObj);
            Transaction.commit();
        }
    }
};
