
'use strict';

var server = require('server');
server.extend(module.superModule);

// API include
var URLUtils = require('dw/web/URLUtils');
var Locale = require('dw/util/Locale');
var HookMgr = require('dw/system/HookMgr');

/**
 * Update the year field on the profile form
 * @param {Object} yearOptions is field of the profile form
 * @returns {Object} updated profile field birthYear
 */
function getBirthYearRange(yearOptions) {
    var currentYear = new Date().getFullYear();
    var earliestYear = new Date().getFullYear() - 100;
    var birthYearOptions = yearOptions;

    for (currentYear; currentYear >= earliestYear; currentYear--) {
        var optionsObj = {};
        optionsObj.checked = false;
        optionsObj.htmlValue = currentYear.toFixed(0);
        optionsObj.id = currentYear.toFixed(0);
        optionsObj.label = currentYear.toFixed(0);
        optionsObj.selected = false;
        optionsObj.value = currentYear.toFixed(0);
        birthYearOptions.push(optionsObj);
    }

    return birthYearOptions;
}

/**
 * Account-CreateAccountModal : append method to check smsOptInEnabled o not
 * @name Base/Account-CreateAccountModal
 * @param {serverfunction} - append
 */
server.append('CreateAccountModal', function (req, res, next) {
    var membersonEnabled = false;
    var profileForm = server.forms.getForm('profile');
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        membersonEnabled = countryConfig.membersonEnabled;
        if (membersonEnabled) {
            getBirthYearRange(profileForm.customer.birthYear.options);
        } else {
            profileForm.customer.birthDay.options[1].selected = false;  //  when Memberson is disabled we need to deselect the pre-selected birthday.
        }
    }
    res.setViewData({
        profileForm: profileForm,
        membersonEnabled: membersonEnabled,
        checkMembersonUrl: URLUtils.url('Account-CheckMembersonAccount')
    });
    next();
});

module.exports = server.exports();
