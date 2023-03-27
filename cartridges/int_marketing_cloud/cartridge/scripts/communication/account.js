'use strict';

/**
 * @module communication/account
 */

const URLUtils = require('dw/web/URLUtils');
const helpers = require('../util/helpers');

const hookPath = 'app.communication.account.';

/**
 * Wrapper to trigger.sendTrigger() to allow common variable injection for all hooks in the file
 * @param hookID
 * @param promise
 * @param data
 * @returns {SynchronousPromise}
 */
function sendTrigger(hookID, promise, data){
    if  (!empty(data.params.Customer)) {
        data.Profile = data.params.Customer.profile;
    } else if (!empty(data.params.CurrentCustomer)) {
        data.Profile = data.params.CurrentCustomer.profile;
    }
    data.AccountHomeLink = URLUtils.https('Account-Show');
    return require('./util/send').sendTrigger(hookID, promise, data);
}

/**
 * Trigger account created notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function created(promise, data) {
    return sendTrigger(hookPath + 'created', promise, data);
}

/**
 * Trigger account updated notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function updated(promise, data) {
    return sendTrigger(hookPath + 'updated', promise, data);
}

/**
 * Trigger password changed notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function passwordChanged(promise, data) {
    let passwordChangedXML = new XML('<PasswordResetCompleted></PasswordResetCompleted>');
    let requestXML = helpers.generateRequestXML(getRequestChangedObject(data), passwordChangedXML);
    data.TransactionXML = requestXML.toString();
    data.localeData = data.params.Customer.profile.preferredLocale.split('_');
    return sendTrigger(hookPath + 'passwordChanged', promise, data);
}

/**
 * Trigger password reset notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function passwordReset(promise, data) {
    if (data.params.containsKey('url')) { // SFRA compat
        data.ResetPasswordLink = data.params.url;
    } else {
        data.ResetPasswordLink = URLUtils.https('Account-SetNewPassword', 'Token', data.params.ResetPasswordToken);
    }
    if (!data.params.containsKey('ResetPasswordToken') && data.params.containsKey('passwordResetToken')) { // SFRA compat
        data.params.ResetPasswordToken = data.params.passwordResetToken;
    }
    if (!data.params.containsKey('Customer') && data.params.containsKey('resettingCustomer')) { // SFRA compat
        data.params.Customer = data.params.resettingCustomer;
    }
    return sendTrigger(hookPath + 'passwordReset', promise, data);
}

/**
 * Trigger account locked out notification
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function lockedOut(promise, data) {
    data.params.Customer = data.params.TempCustomer;
    return sendTrigger(hookPath + 'lockedOut', promise, data);
}

/**
 * Trigger email validation email
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
 function SAPACEmailValidation(promise, data) {
    var countryData = request.getLocale().split('_');
    data.url_link = data.params.url_link;
    data.email_address = data.params.email_address;
    data.firstname = data.params.firstname;
    data.lastname = data.params.lastname;
    data.emailtype = data.params.emailtype;
    data.email_source = data.params.email_source;
    data.recip_type = data.params.recip_type;
    data.signup_date = data.params.signup_date;
    data.creativeversion = data.params.creativeversion;
    data.segmentcode = data.params.segmentcode;
    data.localeData =  countryData;
    return sendTrigger(hookPath + 'SAPACEmailValidation' + countryData[1], promise, data);
}

/**
 * Declares attributes for data mapping for request XML
 * @param {order} Order
 * @returns {Object} Map of hook function to an array of strings
 */
 function getRequestChangedObject(data) {
    let customer = data.params.Customer;

    return {
        CustomerEmail: customer.profile.email,
        CustomerFirstName: customer.profile.firstName,
        CustomerLastName: customer.profile.lastName
    };
}

/**
 * Declares attributes available for data mapping configuration
 * @returns {Object} Map of hook function to an array of strings
 */
function triggerDefinitions() {
    var mergeCustomer = function (arr, customerPrefix, profilePrefix) {
        if (empty(customerPrefix)) {
            customerPrefix = 'Customer';
        }
        if (empty(profilePrefix)) {
            profilePrefix = 'Profile';
        }
        return [].concat(arr, [
            'AccountHomeLink',
            customerPrefix + '.anonymous',
            customerPrefix + '.ID',
            customerPrefix + '.note',
            customerPrefix + '.registered',
            profilePrefix + '.birthday',
            profilePrefix + '.companyName',
            profilePrefix + '.customerNo',
            profilePrefix + '.email',
            profilePrefix + '.fax',
            profilePrefix + '.female',
            profilePrefix + '.firstName',
            profilePrefix + '.gender.displayValue',
            profilePrefix + '.gender.value',
            profilePrefix + '.jobTitle',
            profilePrefix + '.lastLoginTime',
            profilePrefix + '.lastName',
            profilePrefix + '.lastVisitTime',
            profilePrefix + '.male',
            profilePrefix + '.nextBirthday',
            profilePrefix + '.phoneBusiness',
            profilePrefix + '.phoneHome',
            profilePrefix + '.phoneMobile',
            profilePrefix + '.preferredLocale',
            profilePrefix + '.previousLoginTime',
            profilePrefix + '.previousVisitTime',
            profilePrefix + '.salutation',
            profilePrefix + '.secondName',
            profilePrefix + '.suffix',
            profilePrefix + '.taxIDMasked',
            profilePrefix + '.taxIDType.displayValue',
            profilePrefix + '.taxIDType.value',
            profilePrefix + '.title'
        ]);
    };
    return {
        created: {
            description: 'Account Created trigger',
            attributes: mergeCustomer([])
        },
        updated: {
            description: 'Account Updated trigger',
            attributes: mergeCustomer([])
        },
        passwordChanged: {
            description: 'Password Changed trigger',
            attributes: mergeCustomer([])
        },
        passwordReset: {
            description: 'Password Reset trigger',
            attributes: mergeCustomer([
                'ResetPasswordToken',
                'ResetPasswordLink'
            ])
        },
        lockedOut: {
            description: 'Account Locked trigger',
            attributes: mergeCustomer([])
        }
    };
}

/**
 * Function to trigger the sleeping notification hook
 * @param {SynchronousPromise} promise
 * @param {module:communication/util/trigger~CustomerNotification} data
 * @returns {SynchronousPromise}
 */
function sleepingNotification(promise, data) {
    var countryData = request.getLocale().split('_');
    data.FirstName = data.params.FirstName;
    data.SleepingDate = data.params.SleepingDate;
    data.RedirectButtonLink = data.params.RedirectButtonLink;
    data.localeData =  countryData;
    return sendTrigger(hookPath + 'sleepingNotification', promise, data);
}

module.exports = require('dw/system/HookMgr').callHook(
    'app.communication.handler.initialize',
    'initialize',
    require('./handler').handlerID,
    'app.communication.account',
    {
        created: created,
        updated: updated,
        passwordChanged: passwordChanged,
        passwordReset: passwordReset,
        lockedOut: lockedOut,
        SAPACEmailValidation: SAPACEmailValidation,
        sleepingNotification: sleepingNotification
    }
);

// non-hook exports
module.exports.triggerDefinitions = triggerDefinitions;