'use strict';

// Helpers
var Transaction = require('dw/system/Transaction');
/**
 * Function to reset cod orders counter from customer profiles
 * @param {Object} params - Object
 * @returns {string} - return boolean value
 */
function resetCODOrdersCounter() {
    var Logger = require('dw/system/Logger');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var logger = Logger.getLogger(
        'ResetCODOrdersCounter',
        'ResetCODOrdersCounter'
    );

    logger.info('Starting reseting cod counter from customer profiles');
    var query = 'custom.codOrderCount >= {0}';

    var handleProcessProfiles = function (profile) {
        try {
            Transaction.wrap(function () {
                profile.custom.codOrderCount = 0; // eslint-disable-line no-param-reassign
            });
        } catch (error) {
            var err = error;
            logger.error(err);
        }
    };

    CustomerMgr.processProfiles(handleProcessProfiles, query, 1);

    logger.info('Reseti cod counter from customer profiles successfully');
    return true;
}

exports.execute = resetCODOrdersCounter;
