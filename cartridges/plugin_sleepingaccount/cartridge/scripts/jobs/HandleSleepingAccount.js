/**
 * This module provides often-needed helper methods for sending responses.
*
* @module account/HandleSleepingAccount
*/

'use strict';

// Helpers
var Transaction = require('dw/system/Transaction');
var Calendar = require('dw/util/Calendar');

/**
 *
 * @param {string} profile profile
 */
function createUnsubscribeListCustomObject(profile) {
    // Sleeping Customer Emails for unsubscribing Newsletter
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var customerEmail = profile.email;
    var objectEmail = CustomObjectMgr.getCustomObject('SleepingAccountEmails', customerEmail);
    if (empty(objectEmail)) {
        CustomObjectMgr.createCustomObject('SleepingAccountEmails', customerEmail);
    }
}

/**
 * Function to handle sleeping accounts
 * @param {Object} params - Object
 * @returns {string} - return boolean value
 */
function handleSleepingAccount(params) {
    var Logger = require('dw/system/Logger');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var notificationCal = new Calendar();
    notificationCal.add(Calendar.DAY_OF_YEAR, parseInt(params.sleepingAccountNotificationDays) * -1); // eslint-disable-line radix
    var notificationDate = notificationCal.getTime();

    Logger.getLogger('SleepingDeleting', 'SleepingAccount').info('Starting scan sleeping account');
    var query = '(custom.isSleptAccount = {0} OR custom.isSleptAccount != {1}) AND lastLoginTime < {2}';

    var handleProcessProfiles = function (profile) {
        var sleepingCutoffCal = new Calendar();
        try {
            sleepingCutoffCal.add(Calendar.DAY_OF_YEAR, parseInt(params.sleepingAccountCutoffDays) * -1); // eslint-disable-line radix
            var sleepingCutoffDate = sleepingCutoffCal.getTime();

            if (profile.lastLoginTime < sleepingCutoffDate) {
                Transaction.wrap(function () {
                    if (profile.custom.isSleptAccount !== true) {
                        profile.custom.isSleptAccount = true;   // eslint-disable-line no-param-reassign
                        profile.custom.smsOptIn = false; // eslint-disable-line no-param-reassign
                        createUnsubscribeListCustomObject(profile);
                    }
                });

                // SleepingAccountHelper.UnsubscribeMerkle(profile.email, true);
            } else {
                // The Date when account will be disabled
                var sleepingSFMCEmailHelper = require('~/cartridge/scripts/helpers/sleepingSFMCEmailHelpers.js');
                if (profile.custom.sleepingEmailNotification !== true) {
                    var formattedSleepingDate;
                    formattedSleepingDate = new Calendar(new Date(profile.lastLoginTime));
                    formattedSleepingDate.add(formattedSleepingDate.DAY_OF_YEAR, params.sleepingAccountCutoffDays);

                    // SFMC Email (send date of deactivation)
                    sleepingSFMCEmailHelper.sendSleepingNotification(profile, formattedSleepingDate);

                    // Marked profile as notification email sent
                    Transaction.wrap(function () {
                        profile.custom.sleepingEmailNotification = true;     // eslint-disable-line no-param-reassign
                    });
                }
            }
        } catch (error) {
            var err = error;
            Logger.getLogger('SleepingDeleting', 'SleepingAccount').error(err);
        }
    };

    if (!empty(params.emailId)) {
        query = '(custom.isSleptAccount = {0} OR custom.isSleptAccount != {1}) AND lastLoginTime < {2} AND email = {3}';
        CustomerMgr.processProfiles(handleProcessProfiles, query, null, true, notificationDate, params.emailId);
    } else {
        CustomerMgr.processProfiles(handleProcessProfiles, query, null, true, notificationDate);
    }

    Logger.getLogger('SleepingDeleting', 'SleepingAccount').info('Processed sleeping account(s) successfully');
    return true;
}

exports.execute = handleSleepingAccount;
