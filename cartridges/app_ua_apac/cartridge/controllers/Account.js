/* globals empty, session */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var formErrors = require('*/cartridge/scripts/formErrors');
var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
var Logger = require('dw/system/Logger');

server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // Wishlist prepend code
        var viewData = res.getViewData();
        var list = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
        viewData.list = list;
        res.setViewData(viewData);
        // Business logic
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var sitePreferences = require('*/cartridge/config/preferences');

        var passwordRequirements = accountHelpers.getPasswordRequirements();
        var Transaction = require('dw/system/Transaction');
        var Site = require('dw/system/Site');
        var currentSite = Site.getCurrent().getID();
        var showSplitEmailField = sitePreferences.isShowSplitEmailField;
        var showSplitPhoneMobileField = sitePreferences.isShowSplitPhoneMobileField;
        var showBirthYearField = sitePreferences.ShowBirthYearField;

        var registrationForm = server.forms.getForm('profile');

        accountHelpers.combineSplitFields(registrationForm);

        var phoneCleanRegex = new RegExp(Resource.msg('regex.phone.clean', '_preferences', '/[^a-z0-9\s]/gi')); // eslint-disable-line

        var profileObj = registrationForm.toObject();
        var tempPhoneNumber = profileObj.customer.phone;
        var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
        var phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
        phoneNumber = phoneNumber ? phoneNumber.replace(phoneCleanRegex, '') : tempPhoneNumber;
        phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;
        profileObj.customer.phone = phoneNumber;

        var isValidPhoneNumber = COHelpers.validatephoneNumber(profileObj.customer.phone, registrationForm.customer.countryDialingCode.value);
        if (!isValidPhoneNumber) {
            registrationForm.valid = false;
            registrationForm.customer.phone.valid = false;
            registrationForm.customer.phone.error = Resource.msg('error.message.areaCode', 'forms', null);
            res.json({
                fields: formErrors.getFormErrors(registrationForm),
                invalidForm: true
            });
        }

        var registrationFormObj = {
            firstName: registrationForm.customer.firstname.value,
            lastName: registrationForm.customer.lastname.value,
            email: registrationForm.customer.email.value,
            password: registrationForm.login.password.value,
            countryDialingCode: registrationForm.customer.countryDialingCode.value,
            phone: registrationForm.customer.phone.value,
            month: registrationForm.customer.birthMonth.value,
            day: registrationForm.customer.birthDay.value,
            year: (registrationForm.customer.birthYear && registrationForm.customer.birthYear.value) || null,
            gender: registrationForm.customer.gender.value,
            addToEmailList: registrationForm.customer.addtoemaillist.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };

        if (showSplitEmailField) {
            registrationFormObj.emailaddressName = registrationForm.customer.emailaddressName.value;
            registrationFormObj.emailaddressDomain = registrationForm.customer.emailaddressDomain.value;
            registrationFormObj.emailaddressDomainSelect = registrationForm.customer.emailaddressDomainSelect.value;
        }

        if (showSplitPhoneMobileField) {
            registrationFormObj.phoneMobile1 = registrationForm.customer.phoneMobile1.value;
            registrationFormObj.phoneMobile2 = registrationForm.customer.phoneMobile2.value;
            registrationFormObj.phoneMobile3 = registrationForm.customer.phoneMobile3.value;
        }

       // Server side validation against xss regex

        // Server side validation for validating Profile fields check with emoji and non latin characters
        var profileFieldsValidation = accountHelpers.validateProfileFields(profileObj.customer);
        var inputFieldsValidation = accountHelpers.validateAccountInputFields(profileObj.customer);
        if (!idmPreferences.isIdmEnabled && !CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.password.error =
                passwordRequirements.errorMsg;
            registrationForm.valid = false;
        } else if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
            registrationForm.valid = false;
            registrationForm.customer.email.valid = false;
            registrationForm.customer.email.error = inputFieldsValidation.customerAccountErrors.email;
        } else if (profileFieldsValidation.error) {
            registrationForm.valid = false;
            if (profileFieldsValidation.profileFieldsError.firstname) {
                registrationForm.customer.firstname.valid = false;
                registrationForm.customer.firstname.error = profileFieldsValidation.profileFieldsError.firstname;
            }
            if (profileFieldsValidation.profileFieldsError.lastname) {
                registrationForm.customer.lastname.valid = false;
                registrationForm.customer.lastname.error = profileFieldsValidation.profileFieldsError.lastname;
            }
        } else if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
            registrationForm.valid = false;
            accountHelpers.inputValidationField(inputFieldsValidation, registrationForm);
        }
        accountHelpers.updateProfileObj(registrationForm, profileObj);

        if (registrationForm.valid) {
            res.setViewData({ registerForm: registrationFormObj });
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                // Business logic
                registrationForm = res.getViewData().registerForm;
                var bdyYear = profileObj.customer && profileObj.customer.birthYear ? profileObj.customer.birthYear : 0;
                if (bdyYear === 0) {
                    bdyYear = null;
                }
                var bdyMonth = profileObj.customer && profileObj.customer.birthMonth ? profileObj.customer.birthMonth : 0;
                if (bdyMonth === 0) {
                    bdyMonth = null;
                }
                var bdyDay = profileObj.customer && profileObj.customer.birthDay ? profileObj.customer.birthDay : 0;
                if (bdyDay === 0) {
                    bdyDay = null;
                }
                var gender = null;
                if (profileObj.customer && profileObj.customer.gender == 1) {// eslint-disable-line
                    gender = 'MALE';
                } else if (profileObj.customer && profileObj.customer.gender == 2) {// eslint-disable-line
                    gender = 'FEMALE';
                }
                var phone = '';
                if (profileObj.customer.phone) {
                    phone = profileObj.customer.phone;
                }
                var preferences = accountHelpers.getPreferences(profileObj);
                var profObj = {};
                var birthDateObj = {};
                profObj.firstName = profileObj.customer.firstname ? profileObj.customer.firstname : '';
                profObj.lastName = profileObj.customer.lastname ? profileObj.customer.lastname : '';
                profObj.phone = profileObj.customer.countryDialingCode ? profileObj.customer.countryDialingCode + '-' + phone : phone;
                profObj.gender = gender;
                birthDateObj.month = bdyMonth;
                birthDateObj.day = bdyDay;
                if (showBirthYearField) {
                    birthDateObj.year = bdyYear;
                }
                profObj.birthdate_obj = birthDateObj;
                profObj.preferences = preferences;
                profObj.locale = request.locale; // eslint-disable-line no-undef

                var membersonSearchResponse = res.getViewData().membersonSearchResponse;
                var membersonEnabled = res.getViewData().membersonEnabled || false;
                var isEligibleForMemberson = res.getViewData().isEligibleForMemberson;
                if (!membersonEnabled || !isEligibleForMemberson || (membersonEnabled && !empty(membersonSearchResponse) && !membersonSearchResponse.multipleCustomerNos && membersonSearchResponse.emptyCustomerNos)) {
                    if (membersonEnabled && isEligibleForMemberson) {
                        res.setViewData({
                            membersonCreateCustomer: true
                        });
                    }
                    var authenticatedCustomer = (idmPreferences.isIdmEnabled)
                                            ? accountHelpers.createIDMAccount(registrationForm.email, registrationForm.password, profObj)
                                            : accountHelpers.createSFCCAccount(registrationForm.email, registrationForm.password, registrationFormObj);
                    if (authenticatedCustomer.authCustomer) {
                        if (registrationForm.addToEmailList) {
                            require('*/cartridge/modules/providers').get('Newsletter', {
                                email: registrationForm.email
                            }).subscribe();
                        }
                        var customerNo = authenticatedCustomer.authCustomer && authenticatedCustomer.authCustomer.profile && authenticatedCustomer.authCustomer.profile.customerNo;
                        var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
                        var profile = customer.getProfile();
                        res.setViewData({ authenticatedCustomer: authenticatedCustomer.authCustomer });
                        session.privacy.registeredURL = 'Account-SubmitRegistration';
                        if (currentSite === 'KR') {
                            if (registrationFormObj.form.customer.smsOptIn.checked) { // check if SMS opt is submitted
                                Transaction.wrap(function () {
                                    profile.custom.smsOptIn = true;
                                });
                            }
                        } else if (COHelpers.smsOptInEnabled()) {
                            if (customerNo && registrationFormObj.addToEmailList && authenticatedCustomer.authCustomer.authenticated) {
                                Transaction.wrap(function () {
                                    profile.custom.smsOptIn = true;
                                });
                            }
                        }

                        if (authenticatedCustomer.authCustomer && authenticatedCustomer.authCustomer.profile) {
                            var profileForm = server.forms.getForm('profile');
                            accountHelpers.saveSplitFields(profileForm, authenticatedCustomer.authCustomer.profile);
                            accountHelpers.saveBirthYear(profileForm, authenticatedCustomer.authCustomer.profile);
                        }

                        var shouldRedirectUrl = Site.current.getCustomPreferenceValue('registrationPageRedirectURL') ? Site.current.getCustomPreferenceValue('registrationPageRedirectURL') : accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);
                        res.json({
                            success: true,
                            customerNo: customerNo,
                            addToEmailList: registrationFormObj.addToEmailList,
                            redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true),
                            shouldRedirect: !Site.current.getCustomPreferenceValue('remainRegisteredCustomersOnCurrentPage'),
                            shouldRedirectUrl: shouldRedirectUrl
                        });
                        req.session.privacyCache.set('args', null);
                    } else {
                        registrationForm.form.customer.email.valid = false;
                        registrationForm.form.customer.email.error = authenticatedCustomer.errorMessage;
                        registrationForm.form.valid = false;
                        res.json({
                            fields: formErrors.getFormErrors(registrationForm)
                        });
                    }
                    // Wislist append code
                    viewData = res.getViewData();
                    var listGuest = viewData.list;
                    if (viewData.authenticatedCustomer) {
                        var listLoggedIn = productListHelper.getList(viewData.authenticatedCustomer, { type: 10 });
                        productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
                    }
                    // Removing addition data from response
                    Transaction.wrap(function () {
                        delete res.viewData.registerForm; // eslint-disable-line
                        delete res.viewData.list; // eslint-disable-line
                    });
                } else {
                    registrationForm.form.customer.email.valid = false;
                    registrationForm.form.customer.email.error = Resource.msg('memberson.msg.apierror', 'forms', null);
                    registrationForm.form.valid = false;
                    res.json({
                        fields: formErrors.getFormErrors(registrationForm)
                    });
                }
            });
        } else {
            res.json({
                fields: formErrors.getFormErrors(registrationForm),
                invalidForm: true
            });
        }
        next();
    }
);

/**
 * Account-SaveProfile : prepend this method save profile
 * @name Base/Account-SaveProfile
 * @function
 * @memberof Account
 * @param {serverfunction} - prepend
 */
server.prepend('SaveProfile', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var checkoutHelper = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var profileForm = server.forms.getForm('profile');
    var profileObj = profileForm.toObject();
    var countryDialingCode = profileObj.customer.countryDialingCode;
    var currentCustomer = req.currentCustomer.raw.profile;

    if (!accountHelpers.handleSplitFieldsSaveProfile(profileObj, profileForm, currentCustomer)) {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(profileForm)
        });
        this.emit('route:Complete', req, res);
        return true;
    }
    var tempPhoneNumber;
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField) {
        // overwrite phone field with hyphen format
        tempPhoneNumber = profileObj.customer.phoneMobile1 + '-' + profileObj.customer.phoneMobile2 + '-' + profileObj.customer.phoneMobile3;
    } else {
        tempPhoneNumber = profileObj.customer.phone;
    }

    var phoneCleanRegex = new RegExp(Resource.msg('regex.phone.clean', '_preferences', '/[^a-z0-9\s]/gi')); // eslint-disable-line

    var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
    var phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
    phoneNumber = phoneNumber ? phoneNumber.replace(phoneCleanRegex, '') : tempPhoneNumber;
    phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;
    profileObj.customer.phone = phoneNumber;

    var isValidAreaCode = checkoutHelper.validatePhoneAreaCode(profileObj.customer.phone, countryDialingCode);
    var isValidPhoneNumber = checkoutHelper.validatephoneNumber(profileObj.customer.phone, countryDialingCode);
    var viewData = res.getViewData();
    viewData.isValidAreaCode = isValidAreaCode;
    viewData.isValidPhoneNumber = isValidPhoneNumber;
    res.setViewData(viewData);
    return next();
});

/**
 * Account-SaveProfile : append this method save profile
 * @name Base/Account-SaveProfile
 * @function
 * @memberof Account
 * @param {serverfunction} - prepend
 */
server.append('SaveProfile', function (req, res, next) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var profileForm = server.forms.getForm('profile');
    var currentCustomer = req.currentCustomer.raw.profile;
    var viewData = res.viewData;
    var Transaction = require('dw/system/Transaction');

    // save fields only and only if validation has passed in core controller
    if ('profileForm' in viewData) {
        viewData.subscriptionUpdated = false;
        try {
            if ('addtoemaillist' in profileForm.customer && profileForm.customer.addtoemaillist.value) {
                require('*/cartridge/modules/providers').get('Newsletter', {
                    email: profileForm.customer.email.value
                }).subscribe();
            }

            var subscriptionEmail = !empty(profileForm.customer.newemail.value) ? profileForm.customer.newemail.value : profileForm.customer.email.value;
            try {
                var merkleStatus = require('*/cartridge/modules/providers').get('Newsletter', {
                    email: subscriptionEmail
                }).status();
                viewData.subscriptionUpdated = merkleStatus.text === '11';
                res.setViewData(viewData);
            } catch (error) {
                Logger.error('ERROR: Error while editing Email Subscription Status.', error);
            }

            Transaction.wrap(function () {
                currentCustomer.custom.smsOptIn = profileForm.customer.smsOptIn.checked;
            });
        } catch (error) {
            Logger.error('ERROR: Error while Saving Merkle Status.', error);
        }

        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            viewData = res.viewData;
            if (viewData.success) {
                accountHelpers.saveSplitFields(profileForm, currentCustomer);
                accountHelpers.saveBirthYear(profileForm, currentCustomer);
            }
        });
    }
    return next();
});

server.append('EditProfile', function (req, res, next) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var passwordRequirements = accountHelpers.getPasswordRequirements();
    var showBirthYearField = require('*/cartridge/config/preferences').ShowBirthYearField;
    var currentCustomer = req.currentCustomer.raw.profile;
    var viewData = res.getViewData();
    var profileForm = viewData.profileForm;
    if (showBirthYearField) {
        if (profileForm && profileForm.customer && profileForm.customer.birthYear && profileForm.customer.birthYear.options) {
            profileForm.customer.birthYear.options = accountHelpers.getBirthYearRange(profileForm.customer.birthYear.options);
            var year = currentCustomer.birthday && !empty(currentCustomer.birthday.getFullYear()) ? currentCustomer.birthday.getFullYear() : null;
            if (year) {
                for (var j = 0; j < profileForm.customer.birthYear.options.length; j++) {
                    if (profileForm.customer.birthYear.options[j].id === year.toString()) {
                        profileForm.customer.birthYear.options[j].selected = true;
                    }
                }
            }
        }
        viewData.profileForm = profileForm;
    }
    viewData.minimumAgeRestriction = require('*/cartridge/config/preferences').MinimumAgeRestriction;
    viewData.isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    var customerHasCountryCode;
    for (var i = 0; i < profileForm.customer.countryDialingCode.options.length; i++) {
        var option = profileForm.customer.countryDialingCode.options[i];
        if (option.id === currentCustomer.custom.countryDialingCode) {
            option.selected = true;
            customerHasCountryCode = true;
        }
    }
    viewData.passwordRules = passwordRequirements;
    if (!customerHasCountryCode) {
        var currentCountryDialingCode = COHelpers.getCountryDialingCodeBasedOnCurrentCountry();
        viewData.currentCountryDialingCode = currentCountryDialingCode;
        res.setViewData(viewData);
    }

    viewData.isSubscribed = false;
    try {
        var merkleStatus = require('*/cartridge/modules/providers').get('Newsletter', {
            email: currentCustomer.email
        }).status();
        viewData.isSubscribed = merkleStatus.text === '11';
        res.setViewData(viewData);
    } catch (error) {
        Logger.info('ERROR: Error while editing Email Subscription Status.', error);
    }

    viewData.smsOptIn = currentCustomer.custom.smsOptIn;
    res.setViewData(viewData);

    viewData.profileForm = accountHelpers.loadProfileFields(profileForm, currentCustomer);

    return next();
});

server.append('Header', function (req, res, next) {
    var Site = require('dw/system/Site');
    var Resource = require('dw/web/Resource');
    var sitePreferences = require('*/cartridge/config/preferences');
    var showOnlyLastNameAsNameField = sitePreferences.isShowOnlyLastNameAsNameFieldEnabled;
    var currentSite = Site.getCurrent().getID();
    var viewData = res.getViewData();
    if (currentSite === 'KR' && showOnlyLastNameAsNameField) {
        viewData.name = req.currentCustomer.profile ? !empty(req.currentCustomer.profile.lastName) ? req.currentCustomer.profile.lastName : Resource.msg('header.account.myaccount', 'account', '') : null;
    }
    res.setViewData(viewData);
    next();
});

server.prepend('Login', function (req, res, next) {
    this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
        var profileForm = server.forms.getForm('profile');
        var Transaction = require('dw/system/Transaction');
        var URLUtils = require('dw/web/URLUtils');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
        var viewData = res.getViewData();
        if (viewData.success && ('customerNo' in viewData && !empty(viewData.customerNo))) {
            var authenticatedCustomer = CustomerMgr.getCustomerByCustomerNumber(viewData.customerNo);
            // Store the SplitFields to customer profile in BM
            var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
            var profile = authenticatedCustomer.profile;
            if (!empty(profile)) {
                var customerEmail = profile.email;
                var customerPhone = profile.phoneHome;
                if (showSplitEmailField && !empty(customerEmail)) {
                    customerEmail = customerEmail.split('@');
                    var emailSelectOptions = 'emailaddressDomainSelect' in profileForm.customer && !empty(profileForm.customer.emailaddressDomainSelect.options) ? profileForm.customer.emailaddressDomainSelect.options : null;
                    var emailDomainValue = !empty(emailSelectOptions) ? emailSelectOptions.some(x => x.value === customerEmail[1]) : null;
                    Transaction.wrap(function () {
                        /* eslint-disable no-param-reassign */
                        profile.custom.emailaddressName = customerEmail[0];
                        profile.custom.emailaddressDomain = customerEmail[1];
                        profile.custom.emailaddressDomainSelect = (emailDomainValue) ? customerEmail[1] : '';
                        /* eslint-disable no-param-reassign */
                    });
                }

                var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
                if (showSplitPhoneMobileField && !empty(customerPhone)) {
                    customerPhone = addressHelper.splitPhoneField(customerPhone);
                    Transaction.wrap(function () {
                        if (customerPhone && Array.isArray(customerPhone) && customerPhone.length) {
                            profile.setPhoneHome(customerPhone.join('-'));
                            if (customerPhone[0]) {
                                profile.custom.phoneMobile1 = customerPhone[0];
                            }
                            if (customerPhone[1]) {
                                profile.custom.phoneMobile2 = customerPhone[1];
                            }
                            if (customerPhone[2]) {
                                profile.custom.phoneMobile3 = customerPhone[2];
                            }
                        }
                    });
                }

                // Reactivate Sleeping Account
                var reactivateAccount = req.querystring.reactivateAccount;
                if ('isSleptAccount' in profile.custom && reactivateAccount) {
                    var reactivatedAccountReturnUrl = URLUtils.url('Home-Show').toString();
                    Transaction.wrap(function () {
                        profile.custom.isSleptAccount = false;
                    });
                    res.setViewData({
                        redirectUrl: reactivatedAccountReturnUrl,
                        isSleepingRedirect: true
                    });
                }

                // Unchecking sleepingEmailNotification
                if (viewData.success && ('sleepingEmailNotification' in profile.custom && profile.custom.sleepingEmailNotification === true)) {
                    if (!('isSleptAccount' in profile.custom) || profile.custom.isSleptAccount === false) {
                        Transaction.wrap(function () {
                            profile.custom.sleepingEmailNotification = false;
                        });
                    }
                }

                // If profile checked as sleepingAccount then logged out customer and redirect to info page.
                if ('isSleptAccount' in profile.custom && profile.custom.isSleptAccount) {
                    var returnUrl = URLUtils.url('SleepingAccount-Show', 'customerNo', viewData.customerNo).toString();
                    CustomerMgr.logoutCustomer(false);
                    var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
                    cookieHelpers.deleteCookie('UAExternalID');
                    cookieHelpers.deleteCookie('UAActiveSession');
                    res.setViewData({
                        redirectUrl: returnUrl,
                        isSleepingRedirect: true
                    });
                }
            }
        }
    });
    next();
});

/**
 * Account-SetNewPassword : append this method to display only last name for KR site
 * @name Base/Account-SetNewPassword
 * @function
 * @memberof Account
 * @param {serverfunction} - append
 */
server.append('SetNewPassword', function (req, res, next) {
    var viewData = res.getViewData();
    var sitePreferences = require('*/cartridge/config/preferences');
    var showOnlyLastNameAsNameField = sitePreferences.isShowOnlyLastNameAsNameFieldEnabled;
    var passwordResetCustomer = viewData.passwordResetCustomer;
    if (showOnlyLastNameAsNameField && passwordResetCustomer && passwordResetCustomer.profile && passwordResetCustomer.profile.lastName) {
        viewData.customerName = passwordResetCustomer.profile.lastName;
    }
    next();
});

module.exports = server.exports();
