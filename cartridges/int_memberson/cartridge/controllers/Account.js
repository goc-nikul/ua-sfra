/* globals empty, session */
/* eslint-disable no-restricted-syntax */

'use strict';

var server = require('server');
server.extend(module.superModule);

// API includes
var HookMgr = require('dw/system/HookMgr');
var Locale = require('dw/util/Locale');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
var CustomerMgr = require('dw/customer/CustomerMgr');

var formErrors = require('*/cartridge/scripts/formErrors');
var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');

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

server.append('SubmitRegistration', function (req, res, next) {
    // Memberson - Check if memberson is enabled for this country
    var countryConfig = {
        membersonEnabled: false
    };
    var membersonSearchResponse = null;
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
    }
    try {
        membersonSearchResponse = JSON.parse(request.httpParameterMap.membersonSearchResponse); // eslint-disable-line no-undef
    } catch (e) {
        membersonSearchResponse = null;
    }
    var viewData = res.getViewData();
    if ((empty(viewData.invalidForm) || !viewData.invalidForm)) {
        var registrationFormObj = viewData.registerForm;
        var registrationForm = registrationFormObj.form;
        var isEligibleForMemberson = membersonHelpers.validateUserForMemberson(registrationFormObj.email);

        res.setViewData({
            membersonEnabled: countryConfig.membersonEnabled,
            membersonCountryConfig: countryConfig,
            membersonSearchResponse: membersonSearchResponse,
            isEligibleForMemberson: isEligibleForMemberson
        });
        if (countryConfig.membersonEnabled) {
            registrationFormObj.phone = registrationFormObj.phone.replace(/[^a-z0-9\s]/gi, '');
            registrationFormObj.phone = registrationFormObj.phone.replace(/[_\s]/g, '-');

            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                var authenticatedCustomer = res.getViewData().authenticatedCustomer;
                var membersonCreateCustomer = res.getViewData().membersonCreateCustomer;
                var customerProfile = null;
                if (!empty(membersonSearchResponse) || !isEligibleForMemberson) {
                    if (!empty(authenticatedCustomer)) {
                        customerProfile = authenticatedCustomer.profile;
                        Transaction.wrap(function () {
                            // Store Country on profileLevel
                            customerProfile.custom.birthYear = registrationFormObj.year;
                            customerProfile.custom.registrationCountry = countryConfig.countryCode;
                        });
                    }
                    if (isEligibleForMemberson && membersonCreateCustomer && !empty(authenticatedCustomer) && empty(res.getViewData().fields)) {
                        // customer was created successfully
                        if (!empty(customerProfile)) {
                            Transaction.wrap(function () {
                                customerProfile.custom['Loyalty-OptStatus'] = true;
                            });
                            var createProfileRes;
                            if (HookMgr.hasHook('app.memberson.CreateProfile')) {
                                createProfileRes = HookMgr.callHook('app.memberson.CreateProfile', 'CreateProfile', registrationFormObj, countryConfig);
                            }

                            if (!empty(createProfileRes) && !createProfileRes.error) {
                                var membersonCustomerNumber = createProfileRes.createAccountResponse && createProfileRes.createAccountResponse.Profile && createProfileRes.createAccountResponse.Profile.CustomerNumber;
                                if (!empty(membersonCustomerNumber)) {
                                    Transaction.wrap(function () {
                                        customerProfile.custom['Loyalty-ID'] = membersonCustomerNumber;
                                    });
                                }
                                if (Object.prototype.hasOwnProperty.call(countryConfig, 'uaRewardsRedirect') && !empty(countryConfig.uaRewardsRedirect)) {
                                    res.viewData.redirectUrl = countryConfig.uaRewardsRedirect; // eslint-disable-line
                                    res.viewData.shouldRedirect = true; // eslint-disable-line
                                }
                            }
                        }
                    } else if (isEligibleForMemberson && !membersonSearchResponse.emptyCustomerNos && membersonSearchResponse.matchingCustomerNos) {
                        var membersonCustomObj = null;
                        if (HookMgr.hasHook('app.memberson.StoreCustomerRegistration')) {
                            membersonCustomObj = HookMgr.callHook('app.memberson.StoreCustomerRegistration', 'StoreCustomerRegistration', registrationForm);
                        }

                        if (!empty(membersonCustomObj) && !empty(membersonCustomObj.custom.membersonCustomerProfileID)) {
                            if (HookMgr.hasHook('app.memberson.SendProfileValidationEmail')) {
                                HookMgr.callHook('app.memberson.SendProfileValidationEmail', 'sendProfileValidationEmail', membersonCustomObj.custom.membersonCustomerProfileID, registrationFormObj);
                            }
                            res.json({
                                success: true,
                                validationEmailMessage: Resource.msg('memberson.msg.validationemail', 'membersonGlobal', null)
                            });
                        }
                    }
                }
                Transaction.wrap(function () {
                    delete res.viewData.registerForm; // eslint-disable-line
                });
            });
        }
    }
    next();
});

server.post('CheckMembersonAccount', function (req, res, next) {
    var countryConfig;
    var registrationForm = server.forms.getForm('profile');

    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
    }
    var email = req.httpParameterMap.email.stringValue;
    var mobile = req.httpParameterMap.mobile.stringValue;
    mobile = mobile.replace(/[^a-z0-9\s]/gi, '');
    mobile = mobile.replace(/[_\s]/g, '-');
    var mobileCountryCode = req.httpParameterMap.mobileCountryCode.stringValue;
    var searchResponse = {};
    var success = false;
    var month = req.httpParameterMap.birthMonth.stringValue;
    var year = req.httpParameterMap.birthYear.stringValue;
    if (empty(month) || empty(year)) {
        res.json({
            success: success
        });
        return next();
    }
    if (month && month !== 0 && year && year !== 0) {
        var customerValid = membersonHelpers.validateAgeOfCustomer(month, year, countryConfig);
        if (!customerValid) {
            registrationForm.valid = false;
            registrationForm.customer.birthMonth.valid = false;
            registrationForm.customer.birthMonth.error = Resource.msgf('memberson.msg.age.validation', 'membersonGlobal', null, countryConfig.ageOfConsent);
            success = false;
            res.json({
                fields: formErrors.getFormErrors(registrationForm),
                invalidForm: true,
                success: success
            });
            return next();
        }
    }
    if (HookMgr.hasHook('app.memberson.SearchProfile')) {
        searchResponse = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', email, mobile, mobileCountryCode);
    }

    if (!empty(searchResponse) && (empty(searchResponse.error))) {
        if (searchResponse.multipleCustomerNos !== true && searchResponse.matchingCustomerNos === true) {
            success = true;
        }
        res.json({
            searchResponse: searchResponse
        });
    }

    if ((!empty(searchResponse.error))) {
        res.json({
            searchResponse: {
                errorMessage: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
            }
        });
    }

    res.json({
        success: success
    });
    return next();
});

server.append('EditProfile', function (req, res, next) {
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var profileForm = res.getViewData().profileForm;
            var currentCustomer = req.currentCustomer.raw.profile;
            var customer = CustomerMgr.getCustomerByCustomerNumber(currentCustomer.customerNo);
            var isBirthDateAvailable = false;
            var searchProfileObjRes;
            var membersonRes = null;
            var isLoyaltyIdAvailable = false;
            getBirthYearRange(profileForm.customer.birthYear.options);
            // Set the Birth Year
            var year = !empty(currentCustomer.custom.birthYear) ? currentCustomer.custom.birthYear : null;
            var yearIndex = res.getViewData().profileForm.customer.birthYear.options.findIndex(x => x.htmlValue === year);
            if (year && profileForm.customer.birthYear.options[yearIndex]) {
                profileForm.customer.birthYear.options[yearIndex].selected = true;
            }
            if (!empty(currentCustomer.birthday) && !empty(currentCustomer.custom.birthYear)) {
                isBirthDateAvailable = true;
            }
            var isEligibleForMemberson = membersonHelpers.validateUserForMemberson(currentCustomer.email);
            if (isEligibleForMemberson) {
                if (!empty(currentCustomer.phoneHome)) {
                    if (HookMgr.hasHook('app.memberson.SearchProfile')) {
                        searchProfileObjRes = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', currentCustomer.email, currentCustomer.phoneHome, customer.profile.custom.countryDialingCode);
                    }

                    // Check if Phone number and email are mismatch or not in Memberson on edit profile page.
                    if (!empty(searchProfileObjRes) && searchProfileObjRes.error) {
                        membersonRes = {
                            success: false,
                            error: true,
                            errorMessage: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
                        };
                    } else if (empty(currentCustomer.custom['Loyalty-ID']) && !searchProfileObjRes.emptyCustomerNos && searchProfileObjRes.matchingCustomerNos) {
                        Transaction.wrap(function () {
                            currentCustomer.custom['Loyalty-ID'] = searchProfileObjRes.emailSearchCustomerNo;
                        });
                    }
                    if (!empty(searchProfileObjRes) && !empty(searchProfileObjRes.errorMessage)) {
                        membersonRes = {
                            success: false,
                            error: true,
                            errorMessage: searchProfileObjRes.errorMessage
                        };
                    }
                    if (currentCustomer) {
                        isLoyaltyIdAvailable = !empty(currentCustomer.custom['Loyalty-ID']);
                    }

                    if (empty(membersonRes) || membersonRes.success) {
                        // check if birthday is saved
                        if (empty(currentCustomer.birthday) || empty(currentCustomer.custom.birthYear)) {
                            membersonRes = {
                                success: false,
                                error: true,
                                errorMessage: Resource.msg('memberson.msg.birthmonthyear.required', 'membersonGlobal', null)
                            };
                        }
                    }
                } else {
                    membersonRes = {
                        success: false,
                        error: true,
                        errorMessage: Resource.msg('memberson.msg.phonenumber.missing', 'membersonGlobal', null)
                    };
                }
                var viewData = res.getViewData();
                viewData.isLoyaltyIdAvailable = isLoyaltyIdAvailable;
                res.setViewData({
                    profileForm: profileForm,
                    membersonEnabled: countryConfig.membersonEnabled,
                    membersonRes: membersonRes,
                    isBirthDateAvailable: isBirthDateAvailable
                });
            } else {
                res.setViewData({
                    profileForm: profileForm,
                    membersonEnabled: countryConfig.membersonEnabled,
                    membersonRes: membersonRes,
                    isBirthDateAvailable: isBirthDateAvailable,
                    isLoyaltyIdAvailable: false
                });
            }
        }
    }
    return next();
});

server.prepend('SaveProfile', function (req, res, next) {
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
                this.done(req, res);
                return;
            }
            var customerValid = membersonHelpers.validateAgeOfCustomer(month, year, countryConfig);
            if (!customerValid) {
                var ContentMgr = require('dw/content/ContentMgr');
                var modalBody = ContentMgr.getContent('age-validation-popup-body').custom.body.toString();
                res.json({
                    success: false,
                    ageNotValid: true,
                    modalContent: modalBody,
                    fields: []
                });
                this.done(req, res);
                return;
            }
        }
    }
    next();
});

server.append('SaveProfile', function (req, res, next) {
    var profileForm = server.forms.getForm('profile');
    var updatedProfile = profileForm.toObject();
    if (empty(res.getViewData().success || res.getViewData().success) && HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var searchProfileObjRes;
            var createProfileObjRes;
            var customerNumber;
            var profile = req.currentCustomer.raw.profile;
            var registrationFormObj = {
                firstName: updatedProfile.customer.firstname,
                lastName: updatedProfile.customer.lastname,
                email: updatedProfile.customer.email,
                countryDialingCode: updatedProfile.customer.countryDialingCode,
                phone: updatedProfile.customer.phone,
                gender: updatedProfile.customer.gender,
                addToEmailList: updatedProfile.customer.addtoemaillist,
                day: updatedProfile.customer.birthDay,
                month: updatedProfile.customer.birthMonth,
                year: updatedProfile.customer.birthYear
            };
            // Store the birthYear to profile on saveProfile
            Transaction.wrap(function () {
                profile.custom.birthYear = updatedProfile.customer.birthYear;
            });
            var isEligibleForMemberson = membersonHelpers.validateUserForMemberson(updatedProfile.customer.email);
            if (isEligibleForMemberson) {
                if (HookMgr.hasHook('app.memberson.SearchProfile')) {
                    searchProfileObjRes = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', updatedProfile.customer.email, updatedProfile.customer.phone, updatedProfile.customer.countryDialingCode);
                }
                if (!empty(searchProfileObjRes) && searchProfileObjRes.error) {
                    res.json({
                        success: false,
                        errorMessgae: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
                    });
                    this.emit('route:Complete', req, res);
                    return;
                }
                // Check If searchProfileObjRes is empty for the Both Email/Phone Then create the account to memberson
                // Call the Create Profile API Hook
                if (!empty(searchProfileObjRes) && searchProfileObjRes.emptyCustomerNos) {
                    if (HookMgr.hasHook('app.memberson.CreateProfile')) {
                        createProfileObjRes = HookMgr.callHook('app.memberson.CreateProfile', 'CreateProfile', registrationFormObj, countryConfig);
                    }
                } else if (!empty(searchProfileObjRes) && searchProfileObjRes.matchingCustomerNos) {
                    customerNumber = searchProfileObjRes.emailSearchCustomerNo;
                    // Store the registrationCountry to profile if exist on MembersonProfile
                    membersonHelpers.updateregistrationCountryAttribute(customerNumber, profile, countryConfig.countryCode);
                } else if (!empty(searchProfileObjRes) && !searchProfileObjRes.matchingCustomerNos) {
                    res.json({
                        success: false,
                        errorMessgae: searchProfileObjRes.errorMessage
                    });
                    this.emit('route:Complete', req, res);
                    return;
                }
                // Update the registrationFormObj if response is OK.
                if (!empty(createProfileObjRes) && !createProfileObjRes.error) {
                    customerNumber = createProfileObjRes.createAccountResponse && createProfileObjRes.createAccountResponse.Profile && createProfileObjRes.createAccountResponse.Profile.CustomerNumber;
                    Transaction.wrap(function () {
                        profile.custom.registrationCountry = countryConfig.countryCode;
                    });
                }
                if (!empty(customerNumber)) {
                    Transaction.wrap(function () {
                        profile.custom['Loyalty-ID'] = customerNumber;
                    });
                    var viewData = res.getViewData();
                    viewData.LoyaltyID = customerNumber;
                    res.setViewData(viewData);
                    if (HookMgr.hasHook('app.memberson.viewTncConsent')) {
                        HookMgr.callHook('app.memberson.viewTncConsent', 'viewTnCConsentStatus', customerNumber, true, 'YES');
                    }
                } else {
                    res.json({
                        success: false,
                        errorMessgae: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
                    });
                    this.emit('route:Complete', req, res);
                    return;
                }
            }
        }
    }
    next();
});

module.exports = server.exports();
