var page = module.superModule; // inherits functionality
var server = require('server');

server.extend(page);

// API includes
var HookMgr = require('dw/system/HookMgr');
var Resource = require('dw/web/Resource');
var Transaction = require('dw/system/Transaction');
var Locale = require('dw/util/Locale');

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
 * Order-Confirm : Append this method to add zip reciept number after order is placed
 * @name Base/Order-Confirm
 * @function
 * @memberof Order
 * @param {category} - sensitive
 * @param {serverfunction} - append
 */
server.append('Confirm', function (req, res, next) {
    var viewData = res.getViewData();
    if (!viewData.error && HookMgr.hasHook('app.memberson.CountryConfig')) {
        var profileForm = server.forms.getForm('profile');
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            getBirthYearRange(profileForm.customer.birthYear.options);
            viewData.membersonEnabled = countryConfig.membersonEnabled;
            viewData.profileForm = profileForm;
            res.setViewData(viewData);
        }
    }
    return next();
});

server.prepend('CreateAccount', function (req, res, next) {
    var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');
    var formErrors = require('*/cartridge/scripts/formErrors');
    var profileForm = server.forms.getForm('profile');
    var profileObj = profileForm.toObject();
    var isEligibleForMemberson = membersonHelpers.validateUserForMemberson(profileObj.customer.email);
    if (isEligibleForMemberson && HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            // Check if customer's age is 18+
            var month = profileObj.customer.birthMonth;
            var year = profileObj.customer.birthYear;
            if (empty(month) || empty(year)) {
                res.json({
                    success: false
                });
                this.emit('route:Complete', req, res);
                return;
            }
            var customerValid = membersonHelpers.validateAgeOfCustomer(month, year, countryConfig);
            if (!customerValid) {
                profileForm.valid = false;
                profileForm.customer.birthMonth.valid = false;
                profileForm.customer.birthMonth.error = Resource.msgf('memberson.msg.age.validation', 'membersonGlobal', null, countryConfig.ageOfConsent);
                res.json({
                    fields: formErrors.getFormErrors(profileForm),
                    success: false
                });
                this.emit('route:Complete', req, res);
                return;
            }
        }
    }
    next();
});

server.append('CreateAccount', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var viewData = res.getViewData();
        if (viewData.success && !empty(viewData.newCustomer) && HookMgr.hasHook('app.memberson.CountryConfig')) {
            var profileForm = server.forms.getForm('profile');
            var profileObj = profileForm.toObject();
            var profile = viewData.newCustomer.profile;
            var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
            var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
            if (!empty(profile) && countryConfig.membersonEnabled) {
                 // Store the birthYear to profile
                Transaction.wrap(function () {
                    profile.custom.birthYear = profileObj.customer.birthYear;
                });
                res.json({
                    success: true
                });
                res.setViewData(viewData);
            }
        }
    });
    return next();
});

module.exports = server.exports();
