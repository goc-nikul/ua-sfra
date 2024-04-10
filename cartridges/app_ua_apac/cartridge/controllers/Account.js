/* globals empty, session */
/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var formErrors = require('*/cartridge/scripts/formErrors');
var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
var Logger = require('dw/system/Logger');

/**
 * Check if disabled fields are updated
 * @param {dw.customer.Profile} profile customer profile
 * @param {Object} profileFormObj object representing customer profile form
 * @returns {boolean} are disabled fields updated
 */
function validateDisabledFieldsUpdated(profile, profileFormObj) {
    var disabledFieldsUpdated = false;
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    if (('isNaverUser' in profile.custom && profile.custom.isNaverUser) || (mobileAuthProvider.mobileAuthEnabled && profile.custom.CI)) {
        var showSplitPhoneMobileField = require('*/cartridge/config/preferences')
            .isShowSplitPhoneMobileField;
        if (showSplitPhoneMobileField) {
            var phoneMobile1 = profile.custom.phoneMobile1;
            var phoneMobile2 = profile.custom.phoneMobile2;
            var phoneMobile3 = profile.custom.phoneMobile3;
            if (
                (profileFormObj.customer.phoneMobile1 &&
                    phoneMobile1 !== profileFormObj.customer.phoneMobile1) ||
                (profileFormObj.customer.phoneMobile2 &&
                    phoneMobile2 !== profileFormObj.customer.phoneMobile2) ||
                (profileFormObj.customer.phoneMobile3 &&
                    phoneMobile3 !== profileFormObj.customer.phoneMobile3)
            ) {
                disabledFieldsUpdated = true;
            }
        } else {
            var customerPhone = profile.phoneHome;
            if (
                profileFormObj.customer.phone &&
                customerPhone !== profileFormObj.customer.phone
            ) {
                disabledFieldsUpdated = true;
            }
        }

        var birthMonth = profile.custom.birthMonth;
        if (profileFormObj.customer.birthMonth && birthMonth !== profileFormObj.customer.birthMonth) {
            disabledFieldsUpdated = true;
        }

        var birthYear = profile.custom.birthYear;
        if (profileFormObj.customer.birthYear && birthYear !== profileFormObj.customer.birthYear) {
            disabledFieldsUpdated = true;
        }

        var birthDay = profile.custom.birthDay;
        if (profileFormObj.customer.birthDay && birthDay !== profileFormObj.customer.birthDay) {
            disabledFieldsUpdated = true;
        }

        var lastName = profile.lastName;
        if (profileFormObj.customer.lastname && lastName !== profileFormObj.customer.lastname) {
            disabledFieldsUpdated = true;
        }

        var gender = profile.gender.value;
        // eslint-disable-next-line eqeqeq
        if (profileFormObj.customer.gender && gender != profileFormObj.customer.gender) {
            disabledFieldsUpdated = true;
        }
    }

    return disabledFieldsUpdated;
}

server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // Wishlist prepend code
        var viewData = res.getViewData();
        if (req.currentCustomer.raw) {
            var list = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
            viewData.list = list;
            res.setViewData(viewData);
        }
        // Business logic
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var Resource = require('dw/web/Resource');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var sitePreferences = require('*/cartridge/config/preferences');
        var Locale = require('dw/util/Locale');

        var passwordRequirements = accountHelpers.getPasswordRequirements();
        var Transaction = require('dw/system/Transaction');
        var Site = require('dw/system/Site');
        var currentSite = Site.getCurrent().getID();
        var showSplitEmailField = sitePreferences.isShowSplitEmailField;
        var showSplitPhoneMobileField = sitePreferences.isShowSplitPhoneMobileField;
        var showBirthYearField = sitePreferences.ShowBirthYearField;

        var registrationForm = server.forms.getForm('profile');

        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        var mobileAuthCI;
        if (mobileAuthProvider.mobileAuthEnabled && session.privacy.mobileAuthCI) {
            var mobileAuthData = mobileAuthProvider.getDataFromSession();
            mobileAuthCI = mobileAuthData.mobileAuthCI;
            registrationForm.customer.lastname.value = mobileAuthData.name;
            registrationForm.customer.phoneMobile1.value = mobileAuthData.phone1;
            registrationForm.customer.phoneMobile2.value = mobileAuthData.phone2;
            registrationForm.customer.phoneMobile3.value = mobileAuthData.phone3;
            registrationForm.customer.birthYear.value = mobileAuthData.birthYear;
            registrationForm.customer.birthMonth.value = mobileAuthData.birthMonth;
            registrationForm.customer.birthDay.value = mobileAuthData.birthDay;
            registrationForm.customer.gender.value = mobileAuthData.gender === '0' ? '2' : mobileAuthData.gender;
        }

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
                        var currentCountry = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country;
                        res.setViewData({ authenticatedCustomer: authenticatedCustomer.authCustomer });
                        session.privacy.registeredURL = 'Account-SubmitRegistration';

                        if (mobileAuthProvider.mobileAuthEnabled && !empty(mobileAuthCI)) {
                            Transaction.wrap(function () {
                                profile.custom.CI = mobileAuthCI;
                            });
                        }
                        if (currentSite === 'KR') {
                            if (registrationFormObj.form.customer.smsOptIn.checked) { // check if SMS opt is submitted
                                Transaction.wrap(function () {
                                    profile.custom.smsOptIn = true;
                                });
                            }
                        } else if (COHelpers.smsOptInEnabled() || currentCountry === 'AU') {
                            if (customerNo && registrationFormObj.addToEmailList && authenticatedCustomer.authCustomer.authenticated) {
                                Transaction.wrap(function () {
                                    profile.custom.smsOptIn = true;
                                });
                            }
                        }

                        if (req.httpParameterMap.memberPricePid && req.httpParameterMap.memberPricePid.stringValue) {
                            var ContentMgr = require('dw/content/ContentMgr');
                            var ProductFactory = require('*/cartridge/scripts/factories/product');
                            var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
                            var registrationSuccessContent = ContentMgr.getContent('member-pricing-register-complete-popup');
                            var memberPriceProd = ProductFactory.get({ pid: req.httpParameterMap.memberPricePid.stringValue });
                            var memberPriceEligible = memberPriceProd.memberPricing.hasMemberPrice && memberPriceProd.memberPricing.memberPromoEligible;
                            if (!empty(registrationSuccessContent) && registrationSuccessContent.custom.body && registrationSuccessContent.custom.body.markup) {
                                res.setViewData({
                                    memberPriceProduct: memberPriceProd,
                                    memberPriceModalContent: renderTemplateHelper.getRenderedHtml({ content: registrationSuccessContent.custom.body.markup, memberPriceEligible: memberPriceEligible }, 'product/memberPricing/loginRegisterSuccessModal')
                                });
                            } else {
                                res.setViewData({
                                    memberPriceProduct: memberPriceProd,
                                    memberPriceModalContent: renderTemplateHelper.getRenderedHtml({ content: '', memberPriceEligible: memberPriceEligible }, 'product/memberPricing/loginRegisterSuccessModal')
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
                    if (viewData.list) {
                        var listGuest = viewData.list;
                        if (viewData.authenticatedCustomer) {
                            var listLoggedIn = productListHelper.getCurrentOrNewList(viewData.authenticatedCustomer, { type: 10 });
                            productListHelper.mergelists(listLoggedIn, listGuest, req, { type: 10 });
                        }
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

    var disabledFieldsUpdated = validateDisabledFieldsUpdated(currentCustomer, profileObj);

    if (disabledFieldsUpdated) {
        throw new Error(
            Resource.msg('subheading.error.general', 'error', null)
        );
    }

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
                viewData.subscriptionUpdated = merkleStatus.status.Ecomm === 'Active';
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
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    if (mobileAuthProvider.mobileAuthEnabled && currentCustomer.custom.CI) {
        var hasSocialSecurityNumber = true;
        viewData.hasSocialSecurityNumber = hasSocialSecurityNumber;
    }
    res.setViewData(viewData);
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
        viewData.isSubscribed = merkleStatus.status.Ecomm === 'Active';
        res.setViewData(viewData);
    } catch (error) {
        Logger.info('ERROR: Error while editing Email Subscription Status.', error);
    }

    viewData.smsOptIn = currentCustomer.custom.smsOptIn;
    if ('isNaverUser' in currentCustomer.custom) {
        viewData.isNaverUser = currentCustomer.custom.isNaverUser;
    }
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
    if (currentSite === 'KR') {
        var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
        viewData.mobileAuthEnabled = mobileAuthProvider.mobileAuthEnabled;
        if (mobileAuthProvider.mobileAuthEnabled && req.currentCustomer.raw.authenticated && empty(req.currentCustomer.raw.profile.custom.CI)) {
            viewData.mobileAuthPending = true;
        }
        if (showOnlyLastNameAsNameField) {
            viewData.name = req.currentCustomer.profile ? !empty(req.currentCustomer.profile.lastName) ? req.currentCustomer.profile.lastName : Resource.msg('header.account.myaccount', 'account', '') : null;
        }
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

                var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
                if (mobileAuthProvider.mobileAuthEnabled) {
                    res.setViewData({
                        mobileAuthPending: empty(profile.custom.CI)
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

                if (req.httpParameterMap.memberPricePid && req.httpParameterMap.memberPricePid.stringValue) {
                    var ContentMgr = require('dw/content/ContentMgr');
                    var ProductFactory = require('*/cartridge/scripts/factories/product');
                    var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
                    var registrationSuccessContent = ContentMgr.getContent('member-pricing-login-complete-popup');
                    var memberPriceProd = ProductFactory.get({ pid: req.httpParameterMap.memberPricePid.stringValue });
                    var memberPriceEligible = memberPriceProd.memberPricing.hasMemberPrice && memberPriceProd.memberPricing.memberPromoEligible;
                    if (!empty(registrationSuccessContent) && registrationSuccessContent.custom.body && registrationSuccessContent.custom.body.markup) {
                        var content = registrationSuccessContent.custom.body.markup.replace('{{CustomerName}}', profile.firstName);
                        res.setViewData({
                            memberPriceProduct: memberPriceProd,
                            memberPriceModalContent: renderTemplateHelper.getRenderedHtml({ content: content, memberPriceEligible: memberPriceEligible }, 'product/memberPricing/loginRegisterSuccessModal')
                        });
                    } else {
                        res.setViewData({
                            memberPriceProduct: memberPriceProd,
                            memberPriceModalContent: renderTemplateHelper.getRenderedHtml({ content: '', memberPriceEligible: memberPriceEligible }, 'product/memberPricing/loginRegisterSuccessModal')
                        });
                    }
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

/**
 * Account-Withdraw : New route to display delete account page
 * @name Base/Account-Withdraw
 * @function
 * @memberof Account
 * @param {serverfunction} - append
 */
server.get(
    'Withdraw',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.generateToken,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        // Display only in Korea
        if (Site.current.ID === 'KR') {
            var naverReauthenticated = req.session.privacyCache.get('naverReauthenticated');
            if (naverReauthenticated === 'authenticated') {
                req.session.privacyCache.set('naverReauthenticated', 'buttonEnabled');
            } else {
                req.session.privacyCache.set('naverReauthenticated', null);
            }
            var URLUtils = require('dw/web/URLUtils');
            res.render('account/removeAccountConfirmation', {
                customerNo: req.currentCustomer.raw.profile.customerNo,
                email: req.currentCustomer.raw.profile.email,
                isNaverSSOUser: req.currentCustomer.raw.profile.custom.isNaverUser,
                actionUrl: URLUtils.url('Account-HandleWithdraw').toString(),
                naverRedirectURL: URLUtils.https('Account-Withdraw').toString(),
                naverReauthenticated: naverReauthenticated === 'authenticated'
            });
        } else {
            res.setStatusCode(404);
            res.render('error/notFound');
        }
        next();
    }
);

/**
 * Account-Withdraw : New route to handle deletion of account and display delete confirmation
 * @name Base/Account-HandleWithdraw
 * @function
 * @memberof Account
 * @param {serverfunction} - append
 */
server.post(
    'HandleWithdraw',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var AuthenticationStatus = require('dw/customer/AuthenticationStatus');
        var Resource = require('dw/web/Resource');
        var CustomObjectMgr = require('dw/object/CustomObjectMgr');
        var email = req.currentCustomer.raw.profile.email;
        var password = req.form.loginPassword;
        var authenticationResult;
        var issue = '';
        var responseJSON = {
            success: true
        };
        var naverReauthenticated = req.session.privacyCache.get('naverReauthenticated') === 'buttonEnabled';

        // Server side validation against xss regex
        var inputFieldsValidation = accountHelpers.validateLoginInputFields(req.form);
        if (!naverReauthenticated && inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
            res.json({
                success: false,
                errorMessage: inputFieldsValidation.genericErrorMessage,
                xssError: true
            });
        } else {
            var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
            authenticationResult = idmHelper.authenticateCustomer(email, password);
            if (authenticationResult.tokenSuccess && authenticationResult.accessToken) {
                authenticationResult.status = AuthenticationStatus.AUTH_OK;
            }
            if (!naverReauthenticated && authenticationResult.status !== AuthenticationStatus.AUTH_OK) {
                var errorCodes = {
                    ERROR_PASSWORD_MISMATCH: 'error.message.password.mismatch',
                    ERROR_UNKNOWN: 'error.message.error.unknown',
                    SERVICE_UNAVAILABLE: 'error.message.login.form', // error message to display if IDM service is unavailable
                    ERROR_INVALID_JWT: 'error.message.login.form', // error message to display if JWT is incorrect
                    ERROR_PASSWORD_RESET_REQUIRED: 'error.message.login.form',
                    default: 'error.message.login.form'
                };
                var errorMessageKey = errorCodes[authenticationResult.status] || errorCodes.default;
                var errorMessage = Resource.msg(errorMessageKey, 'login', null);

                responseJSON = {
                    success: false,
                    errorMessage: [errorMessage],
                    error_code: authenticationResult.status
                };
            } else {
                var URLUtils = require('dw/web/URLUtils');
                var Site = require('dw/system/Site');
                var idmAccessToken;
                var refreshtokenGenerationError = false;
                var updateAccessTokenResponse = idmHelper.getNewAccessTokenIfExpired(customer, customer.profile.email);
                if (updateAccessTokenResponse && updateAccessTokenResponse.tokenSuccess) {
                    idmHelper.updateTokenOnLogin(customer, updateAccessTokenResponse);
                } else if (updateAccessTokenResponse && updateAccessTokenResponse.refreshtokenGenerationError) {
                    // render inline-login screen
                    refreshtokenGenerationError = true;
                }
                var currentCustomer = req.currentCustomer.raw.profile;
                if (currentCustomer && currentCustomer.custom && 'idmAccessToken' in currentCustomer.custom && !empty(currentCustomer.custom.idmAccessToken) && !refreshtokenGenerationError) {
                    idmAccessToken = currentCustomer.custom.idmAccessToken;
                }
                const customerInfo = idmHelper.customerInfo(idmAccessToken);
                var accountLinks = customerInfo.accountLinks;
                if (accountLinks.length > 1) {
                    var jiraHelper = require('*/cartridge/scripts/helpers/jiraHelper');
                    var jiraWatchers = Site.current.getCustomPreferenceValue('DeleteAccountJiraWatchers');
                    issue = jiraHelper.createAccountDeletionTicket(email);
                    if (empty(issue)) {
                        Logger.error('Delete Account -> Jira Ticket Creation Failed');
                        responseJSON.success = false;
                    } else if (!empty(issue) && jiraWatchers.length > 1) {
                        jiraHelper.addWatchers(issue, jiraWatchers);
                    }
                }
                if (responseJSON.success) {
                    var dwCustomer = req.currentCustomer.raw;
                    var customerNo = req.currentCustomer.raw.profile.customerNo;
                    var customObjectName = 'deletedCustomerRecords';
                    // Handle unsubscription from SFMC
                    if (!accountHelpers.unsubscribeEmailSFMC(dwCustomer.profile.email)) {
                        Logger.error('Delete Account -> Unsubscribe SFMC failed');
                        responseJSON.success = false;
                    } else {
                        // Handle deletion from IDM and SFCC
                        var accountLinksDomain = Site.current.getCustomPreferenceValue('uaidmAccountLinksDomain');
                        var domainUserId = accountLinks.find((link) => {
                            return link.domain === accountLinksDomain;
                        }).domainUserId;
                        var result = idmHelper.deleteAccountLink(domainUserId, accountLinksDomain);
                        if (result.status) {
                            var CustomerMgr = require('dw/customer/CustomerMgr');
                            var Transaction = require('dw/system/Transaction');
                            Transaction.begin();
                            // Removing customer from SFCC
                            CustomerMgr.removeCustomer(req.currentCustomer.raw);
                            Transaction.commit();

                            // Wipe UA IDM Cookies that extend session
                            accountHelpers.deleteIDMCookies();
                            CustomerMgr.logoutCustomer(false);
                            Transaction.wrap(function () {
                                const deletedCustomerRecordsObj = CustomObjectMgr.createCustomObject(customObjectName, customerNo.toString());
                                deletedCustomerRecordsObj.custom.AccountLinks = accountLinks.length > 1 ? 'Multiple Links' : 'Single Link';
                                deletedCustomerRecordsObj.custom.JiraTicket = !empty(issue) ? issue.toString() : '';
                            });
                            require('*/cartridge/scripts/helpers/cookieHelpers').create(customerNo.toString(), 'renderDeleteAccountSuccessPage');
                        } else {
                            Logger.error('Delete Account -> IDM Delete Account Link failed');
                            responseJSON.success = false;
                        }
                    }
                    responseJSON.redirect = URLUtils.url('Account-WithdrawSuccess', 'keyId', customerNo).toString();
                }
                if (!responseJSON.success) {
                    responseJSON.errorMessage = Resource.msg('error.message.account.remove', 'account', null);
                }
            }
        }
        res.json(responseJSON);
        next();
    }
);

server.get(
    'WithdrawSuccess',
    server.middleware.https,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        // Display only in Korea
        if (Site.current.ID === 'KR') {
            var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
            var cookieName = req.querystring.keyId;
            var deletedCustomerCookie = cookieHelpers.read(cookieName);
            /* Check if the customer is accessing the delete account success page for the first time
            by looking for the cookie and render the page. Else, render the error page if cookie not found. */
            if (deletedCustomerCookie && deletedCustomerCookie === 'renderDeleteAccountSuccessPage') {
                cookieHelpers.deleteCookie(cookieName);
                var URLUtils = require('dw/web/URLUtils');
                res.render('/account/removeAccountSuccess', {
                    homepageUrl: URLUtils.url('Home-Show').toString()
                });
                return next();
            }
        }
        res.setStatusCode(404);
        res.render('error/notFound');
        return next();
    }
);

module.exports = server.exports();
