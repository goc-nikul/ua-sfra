'use strict';

/**
 * Fucntion to send sleeping account notification
 * @param {Object} profile - Profile object
 * @param {string} formattedSleepingDate - sleeping date
 */
function sendSleepingNotification(profile, formattedSleepingDate) {
    var URLUtils = require('dw/web/URLUtils');
    var Site = require('dw/system/Site');
    var StringUtils = require('dw/util/StringUtils');
    var Resource = require('dw/web/Resource');
    var Calendar = require('dw/util/Calendar');
    var cutomerProfile = profile;
    var currentLocale = Site.getCurrent().defaultLocale;
    currentLocale = currentLocale ? currentLocale.toLowerCase() : '';
    currentLocale = 'email.localetrack.' + currentLocale;
    var emailLocale = Resource.msg(currentLocale, 'email', null);
    var redirectURL;
    redirectURL = URLUtils.abs('Home-Show', 'login', true, 'cid', Resource.msgf('email.track.sleepconfirmation', 'email', null, emailLocale)).toString();
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers.js');
    var newDate = new Calendar(new Date());
    var formattedNewDate;
    formattedNewDate = StringUtils.formatCalendar(newDate, 'MM/dd/yyyy');
    var templateData = {

        FirstName: cutomerProfile.lastName,
        SleepingDate: formattedSleepingDate,
        RedirectButtonLink: redirectURL,
        Date: formattedNewDate

    };
    var recipientEmails = Site.current.getCustomPreferenceValue('customerServiceEmail');
    var customerServiceEmail = cutomerProfile.email;
    var emailData = {
        to: customerServiceEmail,
        from: recipientEmails,
        type: emailHelpers.emailTypes.sleepingNotification
    };

    var emailObj = {
        templateData: templateData,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

module.exports = {
    sendSleepingNotification: sendSleepingNotification
};
