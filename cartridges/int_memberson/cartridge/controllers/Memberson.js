'use strict';

var server = require('server');

// API include
var Transaction = require('dw/system/Transaction');
var CustomObjectMgr = require('dw/object/CustomObjectMgr');
var CustomerMgr = require('dw/customer/CustomerMgr');
var URLUtils = require('dw/web/URLUtils');
var HookMgr = require('dw/system/HookMgr');
var Locale = require('dw/util/Locale');
var Resource = require('dw/web/Resource');


// Helpers File include
// Server side validation against xss regex
var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var membersonHelpers = require('*/cartridge/scripts/helpers/membersonHelpers');

server.get('ValidateProfile', function (req, res, next) {
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var customObjId = req.querystring.ObjID;
            var revieveObj;
            var validateProfile = false;
            if (!empty(customObjId)) {
                revieveObj = CustomObjectMgr.getCustomObject('membersonCustomerProfile', customObjId);
                if (empty(revieveObj)) {
                    res.redirect(URLUtils.url('Home-Show', 'login', true, 'alreadyValidate', true));
                    return next();
                }
                // Business logic
                var countryID = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line no-undef

                var registrationForm = JSON.parse(revieveObj.custom.registerFormObject);
                var registrationFormObj = {
                    firstName: registrationForm.customer.firstname.htmlValue,
                    lastName: registrationForm.customer.lastname.htmlValue,
                    email: registrationForm.customer.email.htmlValue,
                    password: registrationForm.login.password.htmlValue,
                    countryDialingCode: registrationForm.customer.countryDialingCode.htmlValue,
                    phone: registrationForm.customer.phone.htmlValue,
                    month: registrationForm.customer.birthMonth.htmlValue,
                    day: registrationForm.customer.birthDay.htmlValue,
                    year: registrationForm.customer.birthYear.htmlValue,
                    registrationCountry: countryID,
                    gender: registrationForm.customer.gender.htmlValue,
                    addToEmailList: registrationForm.customer.addtoemaillist.htmlValue,
                    validForm: registrationForm.valid,
                    form: registrationForm
                };
                var profileObj = JSON.parse(revieveObj.custom.profileObj);
                var bdyMonth = profileObj.customer && profileObj.customer.birthMonth ? profileObj.customer.birthMonth : 0;
                if (bdyMonth === 0) {
                    bdyMonth = null;
                }
                var bdyDay = profileObj.customer && profileObj.customer.birthDay ? profileObj.customer.birthDay : 0;
                if (bdyDay === 0) {
                    bdyDay = null;
                }
                var birthYear = profileObj.customer && profileObj.customer.birthYear ? profileObj.customer.birthYear : 0;
                if (birthYear === 0) {
                    birthYear = null;
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
                birthDateObj.year = birthYear;
                profObj.birthdate_obj = birthDateObj;
                profObj.preferences = preferences;
                profObj.locale = request.locale; // eslint-disable-line no-undef
                var authenticatedCustomer = (idmPreferences.isIdmEnabled)
                                            ? accountHelpers.createIDMAccount(registrationFormObj.email, registrationFormObj.password, profObj)
                                            : accountHelpers.createSFCCAccount(registrationFormObj.email, registrationFormObj.password, registrationFormObj);
                if (authenticatedCustomer.authCustomer) {
                    if (registrationForm.addToEmailList) {
                        require('*/cartridge/modules/providers').get('Newsletter', {
                            email: registrationFormObj.email
                        }).subscribe();
                    }
                    var customerNo = authenticatedCustomer.authCustomer && authenticatedCustomer.authCustomer.profile && authenticatedCustomer.authCustomer.profile.customerNo;
                    res.setViewData({ authenticatedCustomer: authenticatedCustomer.authCustomer });
                    session.privacy.registeredURL = 'Account-SubmitRegistration';
                    Transaction.wrap(function () {
                        authenticatedCustomer.authCustomer.profile.custom['Loyalty-OptStatus'] = true;
                    });

                    var customerProfile = authenticatedCustomer.authCustomer.profile;
                    Transaction.wrap(function () {
                        // Store Country on profileLevel
                        customerProfile.custom.birthYear = registrationFormObj.year;
                        customerProfile.custom.registrationCountry = countryConfig.countryCode;
                    });

                    var searchProfileObjRes = null;
                    if (HookMgr.hasHook('app.memberson.SearchProfile')) {
                        searchProfileObjRes = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', registrationFormObj.email, phone, profileObj.customer.countryDialingCode);
                    }
                    if (!empty(searchProfileObjRes) && !searchProfileObjRes.error) {
                        if (!searchProfileObjRes.emptyCustomerNos && searchProfileObjRes.matchingCustomerNos) {
                            Transaction.wrap(function () {
                                authenticatedCustomer.authCustomer.profile.custom['Loyalty-ID'] = searchProfileObjRes.emailSearchCustomerNo;
                            });

                            // Call the TnC-Consent API to check if TnC-Conset status is set to YES in memberson for given customerNo
                            // var TnCConsentObjRes = null;
                            if (HookMgr.hasHook('app.memberson.viewTncConsent')) {
                                HookMgr.callHook('app.memberson.viewTncConsent', 'viewTnCConsentStatus', searchProfileObjRes.emailSearchCustomerNo, true, 'YES');
                            }
                            // Store the registrationCountry to profile if exist on MembersonProfile
                            membersonHelpers.updateregistrationCountryAttribute(searchProfileObjRes.emailSearchCustomerNo, customerProfile, countryConfig.countryCode);
                        }
                    } else {
                        res.redirect(URLUtils.url('Home-Show', 'login', true, 'validateProfile', validateProfile));
                        return next();
                    }

                    if (COHelpers.smsOptInEnabled()) {
                        if (customerNo && registrationFormObj.addToEmailList && authenticatedCustomer.authCustomer.authenticated) {
                            var customer = CustomerMgr.getCustomerByCustomerNumber(customerNo);
                            var profile = customer.getProfile();
                            Transaction.wrap(function () {
                                profile.custom.smsOptIn = true;
                            });
                        }
                    }
                    validateProfile = true;
                    Transaction.wrap(function () {
                        CustomObjectMgr.remove(revieveObj);

                        // Logged out the customer after account created
                        CustomerMgr.logoutCustomer(false);
                    });

                    var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
                    cookieHelpers.deleteCookie('UAExternalID');
                    cookieHelpers.deleteCookie('UAActiveSession');
                }
                res.redirect(URLUtils.url('Home-Show', 'login', true, 'validateProfile', validateProfile));
            }
        }
    }
    return next();
});

server.get('Agreeconsent', function (req, res, next) {
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || request.getLocale().slice(-2).toUpperCase(); // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var searchProfileObjRes;
            var createProfileObjRes;
            var customerID = req.querystring.customerID;
            var customer = CustomerMgr.getCustomerByCustomerNumber(customerID);
            var profile = customer.getProfile();
            var registrationFormObj = {
                firstName: profile.firstName,
                lastName: profile.lastName,
                email: profile.email,
                countryDialingCode: profile.custom.countryDialingCode,
                phone: profile.phoneHome,
                gender: profile.gender.value.toString(),
                addToEmailList: profile.custom.smsOptIn
            };
            if (!empty(profile)) {
                var customerNumber = profile.custom['Loyalty-ID'];
                Transaction.wrap(function () {
                    profile.custom['Loyalty-OptStatus'] = true;
                });
                if (!empty(profile.birthday) && !empty(profile.custom.birthYear)) {
                    registrationFormObj.year = profile.custom.birthYear;
                    registrationFormObj.day = '1';
                    registrationFormObj.month = profile.birthday.getMonth() + 1;
                }
                if (empty(customerNumber)) {
                    if (HookMgr.hasHook('app.memberson.SearchProfile')) {
                        searchProfileObjRes = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', profile.email, profile.phoneHome, profile.custom.countryDialingCode);
                    }
                    if (!empty(searchProfileObjRes) && searchProfileObjRes.error) {
                        res.json({
                            success: false,
                            error: true,
                            msg: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
                        });
                        return next();
                    }

                    // Check If searchProfileObjRes is empty for the Both Email/Phone Then create the account to memberson
                    // Call the Create Profile API Hook
                    if (!empty(searchProfileObjRes) && searchProfileObjRes.emptyCustomerNos) {
                        if (empty(profile.birthday) || empty(profile.custom.birthYear)) {
                            res.json({
                                success: true,
                                error: false,
                                redirectUrl: URLUtils.url('Account-EditProfile').toString()
                            });
                            return next();
                        } else if (HookMgr.hasHook('app.memberson.CreateProfile')) {
                            createProfileObjRes = HookMgr.callHook('app.memberson.CreateProfile', 'CreateProfile', registrationFormObj, countryConfig);
                        }
                    } else if (!empty(searchProfileObjRes) && searchProfileObjRes.matchingCustomerNos) {
                        customerNumber = searchProfileObjRes.emailSearchCustomerNo;
                        // Store the registrationCountry to profile if exist on MembersonProfile
                        membersonHelpers.updateregistrationCountryAttribute(customerNumber, profile, countryConfig.countryCode);
                    } else if (!empty(searchProfileObjRes) && !searchProfileObjRes.matchingCustomerNos) {
                        res.json({
                            success: true,
                            error: false,
                            redirectUrl: URLUtils.url('Account-EditProfile').toString()
                        });
                        return next();
                    }
                    // Update the registrationFormObj if response is OK.
                    if (!empty(createProfileObjRes) && !createProfileObjRes.error) {
                        var resObj = createProfileObjRes.createAccountResponse;
                        customerNumber = resObj.Profile.CustomerNumber;
                        Transaction.wrap(function () {
                            profile.custom.registrationCountry = countryConfig.countryCode;
                        });
                    }
                    if (!empty(customerNumber)) {
                        Transaction.wrap(function () {
                            profile.custom['Loyalty-ID'] = customerNumber;
                        });
                    } else {
                        res.json({
                            success: true,
                            error: false,
                            redirectUrl: URLUtils.url('Account-Show').toString()
                        });
                    }
                } else if (HookMgr.hasHook('app.memberson.viewTncConsent')) {
                    HookMgr.callHook('app.memberson.viewTncConsent', 'viewTnCConsentStatus', customerNumber, true, 'YES');
                }
            }
            res.json({
                success: true,
                error: false,
                redirectUrl: URLUtils.url('Account-Show').toString()
            });
            return next();
        }
    }
    res.json({
        success: false,
        error: true,
        msg: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
    });
    return next();
});

server.get('DisplayConsentPopup', function (req, res, next) {
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var excludeConsentPopUpPageURLs = PreferencesUtil.getValue('excludePopupPageURLs');
    var currentPath = req.querystring.path;
    var matchingPage = excludeConsentPopUpPageURLs.find(function (urlString) {
        return currentPath.indexOf(urlString) > -1;
    });
    var displayPopup = false;
    if ((empty(matchingPage) || typeof matchingPage === 'undefined') && HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var currentCustomer = req.currentCustomer;
            if (!empty(currentCustomer) && currentCustomer.raw.authenticated && !empty(currentCustomer.raw.profile)) {
                var profile = currentCustomer.raw.profile;
                if (membersonHelpers.validateUserForMemberson(profile.email)) {
                    if (!profile.custom['Loyalty-OptStatus']) {
                        var searchProfileObjRes;
                        var customerNumber = profile.custom['Loyalty-ID'];
                        if (empty(customerNumber)) {
                            if (HookMgr.hasHook('app.memberson.SearchProfile')) {
                                searchProfileObjRes = HookMgr.callHook('app.memberson.SearchProfile', 'SearchProfile', profile.email, profile.phoneHome, profile.custom.countryDialingCode);
                            }
                            if (!empty(searchProfileObjRes) && !searchProfileObjRes.emptyCustomerNos && searchProfileObjRes.matchingCustomerNos) {
                                customerNumber = searchProfileObjRes.emailSearchCustomerNo;
                                Transaction.wrap(function () {
                                    profile.custom['Loyalty-ID'] = customerNumber;
                                });
                                // Store the registrationCountry to profile if exist on MembersonProfile
                                membersonHelpers.updateregistrationCountryAttribute(customerNumber, profile, countryConfig.countryCode);
                            }
                        }
                        if (!empty(customerNumber)) {
                            // Call the TnC-Consent API to check if TnC-Consent status is set to YES in memberson for given customerNo
                            var TnCConsentObjRes = null;
                            if (HookMgr.hasHook('app.memberson.viewTncConsent')) {
                                TnCConsentObjRes = HookMgr.callHook('app.memberson.viewTncConsent', 'viewTnCConsentStatus', customerNumber, false);

                                if (!TnCConsentObjRes.consentStatus.equalsIgnoreCase('YES')) {
                                    displayPopup = true;
                                } else {
                                    Transaction.wrap(function () {
                                        profile.custom['Loyalty-OptStatus'] = true;
                                    });
                                }
                            }
                            // Store the birthYear to profile if exist on MembersonProfile
                            membersonHelpers.updateProfileAttributes(customerNumber, profile);
                        } else {
                            displayPopup = true;
                        }
                        var BasketMgr = require('dw/order/BasketMgr');
                        var currentBasket = BasketMgr.getCurrentBasket();
                        var isBasketEmpty = !empty(currentBasket) ? currentBasket.allProductLineItems.length === 0 : false;
                        res.render('common/membersonConsentPopUp', {
                            displayPopup: displayPopup,
                            membersonEnabled: countryConfig.membersonEnabled,
                            loyaltyOptStatus: !profile.custom['Loyalty-OptStatus'],
                            membersonCustomerNo: profile.custom['Loyalty-ID'] || null,
                            customerNo: profile.customerNo,
                            isBasketEmpty: isBasketEmpty
                        });
                    }
                }
            }
        }
    }
    res.render('common/membersonConsentPopUp', {
        displayPopup: displayPopup
    });
    next();
});

server.get('PointsSummary', function (req, res, next) {
    var displayPoints = false;
    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        var countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
        if (countryConfig.membersonEnabled) {
            var StringUtils = require('dw/util/StringUtils');
            var Calendar = require('dw/util/Calendar');
            var Site = require('dw/system/Site');
            var membersonMembershipSummary;
            var currentCustomer = req.currentCustomer.raw.profile;
            if (!empty(currentCustomer)) {
                var membersonCustomerNo = currentCustomer.custom['Loyalty-ID'];
                if (!empty(membersonCustomerNo)) {
                    if (HookMgr.hasHook('app.memberson.MembershipSummary')) {
                        membersonMembershipSummary = HookMgr.callHook('app.memberson.MembershipSummary', 'getMembershipSummary', membersonCustomerNo);
                    }
                }

                if (!empty(membersonMembershipSummary) && membersonMembershipSummary.status === 'OK') {
                    var membershipSummary = JSON.parse(membersonMembershipSummary.object.text);
                    var membersonAccountSummary = membershipSummary.MembershipSummaries && membershipSummary.MembershipSummaries[0] && membershipSummary.MembershipSummaries[0].AccountSummaries && membershipSummary.MembershipSummaries[0].AccountSummaries[0];
                    if (!empty(membersonAccountSummary)) {
                        var expiryDate = membersonAccountSummary.NearestExpiringDate;
                        var expiryDateCal = !empty(expiryDate) && new Calendar(new Date(expiryDate));
                        var formattedExpiryDate;
                        if (!empty(expiryDateCal)) {
                            formattedExpiryDate = StringUtils.formatCalendar(expiryDateCal, Resource.msg('memberson.msg.expiryDateFormat', 'membersonGlobal', null));
                        } else {
                            formattedExpiryDate = '-';
                        }
                        displayPoints = true;
                        // Last Updated Date
                        var lastUpdatedDate = new Calendar();
                        lastUpdatedDate.setTimeZone(Site.getCurrent().getTimezone());
                        lastUpdatedDate.add(Calendar.DAY_OF_MONTH, -1);

                        res.setViewData({
                            pointsBalance: membersonAccountSummary.Balance || '0',
                            pointsExpiry: formattedExpiryDate,
                            lastUpdatedDate: StringUtils.formatCalendar(lastUpdatedDate, Resource.msg('memberson.msg.expiryDateFormat', 'membersonGlobal', null))
                        });
                    }
                }
            }
        }
    }
    res.render('account/pointsSummary', {
        displayPoints: displayPoints
    });
    next();
});

module.exports = server.exports();
