'use strict';

var server = require('server');
server.extend(module.superModule);
var URLUtils = require('dw/web/URLUtils');
var contentMgr = require('dw/content/ContentMgr');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');

/**
 * Account-CreateAccountModal : append method to check smsOptInEnabled o not
 * @name Base/Account-CreateAccountModal
 * @param {serverfunction} - append
 */
server.append('CreateAccountModal', function (req, res, next) {
    var viewData = res.getViewData();
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var content = contentMgr.getContent('register-page');
    pageMetaHelper.setPageMetaData(req.pageMetaData, content);
    var target = req.querystring.rurl || 1;
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
    var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
    if (customer && customer.registered) {
        res.json({
            success: true,
            redirectUrl: require('dw/web/URLUtils').url('Account-EditProfile').toString()
        });
    }
    var currentCountryDialingCode = COHelpers.getCountryDialingCodeBasedOnCurrentCountry();
    viewData.currentCountryDialingCode = currentCountryDialingCode;
    viewData.smsOptInEnabled = COHelpers.smsOptInEnabled();
    var showBirthYearField = require('*/cartridge/config/preferences').ShowBirthYearField;
    if (showBirthYearField) {
        var profileForm = viewData.profileForm;
        if (profileForm && profileForm.customer && profileForm.customer.birthYear && profileForm.customer.birthYear.options) {
            viewData.profileForm.customer.birthYear.options = accountHelpers.getBirthYearRange(profileForm.customer.birthYear.options);
        }
    }
    var minimumAgeRestriction = require('*/cartridge/config/preferences').MinimumAgeRestriction;
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;

    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    res.setViewData({
        mobileAuthEnabled: mobileAuthProvider.mobileAuthEnabled
    });
    if (mobileAuthProvider.mobileAuthEnabled) {
        if (session.privacy.mobileAuthCI) {
            var mobileAuthData = mobileAuthProvider.getDataFromSession();
            viewData.mobileAuthDisableRegistrationFields = true;
            var findIndexInForm = function (arr, val) {
                return arr.findIndex(function (arrItem) {
                    return arrItem.value === val || arrItem.label === val;
                });
            };
            viewData.profileForm.customer.lastname.htmlValue = mobileAuthData.name;
            if (mobileAuthData.gender === '0') {
                viewData.profileForm.customer.gender.options[2].selected = true;
            } else {
                viewData.profileForm.customer.gender.options[mobileAuthData.gender].selected = true;
            }

            var phoneMobile1Index = findIndexInForm(viewData.profileForm.customer.phoneMobile1.options, mobileAuthData.phone1);
            viewData.profileForm.customer.phoneMobile1.options[phoneMobile1Index].selected = true;
            viewData.profileForm.customer.phoneMobile2.htmlValue = mobileAuthData.phone2;
            viewData.profileForm.customer.phoneMobile3.htmlValue = mobileAuthData.phone3;

            var birthYearIndex = findIndexInForm(viewData.profileForm.customer.birthYear.options, mobileAuthData.birthYear);
            var birthMonthIndex = findIndexInForm(viewData.profileForm.customer.birthMonth.options, mobileAuthData.birthMonth);
            var birthDayIndex = findIndexInForm(viewData.profileForm.customer.birthDay.options, mobileAuthData.birthDay);

            viewData.profileForm.customer.birthYear.options[birthYearIndex].selected = true;
            viewData.profileForm.customer.birthMonth.options[birthMonthIndex].selected = true;
            viewData.profileForm.customer.birthDay.options[birthDayIndex].selected = true;
        }
        if (!req.querystring.format || req.querystring.format !== 'ajax') {
            session.custom.mobileAuthCurrentPage = URLUtils.url('Login-CreateAccountModal').toString();
        }
    }
    res.setViewData(viewData);

    var showRegisterModal = req.querystring.showregistermodal;
    var userName = '';
    if (req.currentCustomer.raw && req.currentCustomer.raw.profile) {
        userName = req.currentCustomer.raw.profile.email;
    }
    if (showRegisterModal) {
        res.redirect(URLUtils.url('Home-Show', 'showRegisterModal', showRegisterModal));
    } else {
        res.render('account/createAccountModal', {
            createAccountUrl: createAccountUrl,
            format: req.querystring.format ? req.querystring.format : '',
            userName: userName,
            actionUrl: actionUrl,
            minimumAgeRestriction: minimumAgeRestriction,
            isKRCustomCheckoutEnabled: isKRCustomCheckoutEnabled,
            canonicalUrl: URLUtils.abs('Login-CreateAccountModal'),
            naverRedirectURL: req.httpParameterMap.naverRedirectURL.stringValue
        });
    }
    next();
}, pageMetaData.computedPageMetaData);

server.get('InitiateMobileAuth', function (req, res, next) {
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    if (mobileAuthProvider.mobileAuthEnabled) {
        if (req.httpParameterMap.currentPage && req.httpParameterMap.currentPage.stringValue) {
            session.custom.mobileAuthCurrentPage = req.httpParameterMap.currentPage.stringValue;
        }
        res.render('account/mobileAuth/initiateMobileAuth', {
            login: req.querystring.login && req.querystring.login === 'true',
            update: req.querystring.update && req.querystring.update === 'true'
        });
    } else {
        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
});

server.get('MobileAuthModal', function (req, res, next) {
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    if (mobileAuthProvider.mobileAuthEnabled) {
        var encryptedData;
        var authTokenObj = mobileAuthProvider.getValidToken();
        var encryptionData;
        var triggerError = false;
        var currentCustomer = req.currentCustomer.raw;
        var customerLoggedIn = currentCustomer && currentCustomer.registered && (currentCustomer.authenticated || currentCustomer.externallyAuthenticated);
        var authenticationPending = customerLoggedIn && empty(currentCustomer.profile.custom.CI);
        if (authTokenObj && !empty(authTokenObj.token)) {
            encryptionData = mobileAuthProvider.getCryptoToken(authTokenObj.token);
            if (!empty(encryptionData)) {
                encryptedData = mobileAuthProvider.encryptData(encryptionData);
            }
        }
        if (!(authTokenObj && !empty(authTokenObj.token)) || empty(encryptionData) || empty(encryptedData)) {
            triggerError = true;
        }
        res.render('account/mobileAuth/mobileAuthModal', {
            url: 'https://nice.checkplus.co.kr/CheckPlusSafeModel/service.cb',
            encryptedData: encryptedData,
            triggerError: triggerError,
            authenticationPending: authenticationPending
        });
    } else {
        res.redirect(URLUtils.url('Home-Show'));
    }
    next();
});

server.get('MobileAuthReturn', function (req, res, next) {
    var Resource = require('dw/web/Resource');
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    var decryptedData = '';
    var triggerRegistration = false;
    var duplicatedEmail = '';
    var errorMessage = '';
    var reloadPage = false;
    var modalTemplate = '';
    var showSMSOptIn = false;
    var disableOuterClose = false;
    var naverRedirectURL = session.custom.mobileAuthCurrentPage || null;
    delete session.custom.mobileAuthCurrentPage;
    var currentCustomer = req.currentCustomer.raw;
    var customerLoggedIn = currentCustomer && currentCustomer.registered && (currentCustomer.authenticated || currentCustomer.externallyAuthenticated);
    if (mobileAuthProvider.mobileAuthEnabled) {
        try {
            var queryStringObj = req.querystring;
            var tokenVersion = queryStringObj.token_version_id;
            var encryptedData = queryStringObj.enc_data;
            if (tokenVersion === session.privacy.NiceIDTokenVersion) {
                decryptedData = mobileAuthProvider.decryptData(encryptedData);

                if (!empty(decryptedData) && decryptedData.birthdate) {
                    var legalAge = mobileAuthProvider.validateAge(decryptedData.birthdate);
                    if (legalAge) {
                        var customerEmail = null;
                        if (customerLoggedIn) {
                            customerEmail = currentCustomer.profile.email;
                        }
                        decryptedData.splitPhone = require('*/cartridge/scripts/helpers/addressHelpers').splitPhoneField(decryptedData.mobileno).join('-');
                        decryptedData.birthYear = decryptedData.birthdate.substring(0, 4);
                        decryptedData.birthMonth = decryptedData.birthdate.substring(4, 6);
                        decryptedData.birthDay = decryptedData.birthdate.substring(6);
                        var profiles = mobileAuthProvider.checkCIDuplication(decryptedData, customerEmail);
                        if (customerLoggedIn && !empty(currentCustomer.profile.custom.CI)) {
                            if (currentCustomer.profile.custom.CI === decryptedData.ci) {
                                var mobileAuthData = mobileAuthProvider.getDataFromSession();
                                var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
                                var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');

                                var externalProfiles = currentCustomer.externalProfiles;
                                var idmProfile = false;
                                for (var externalProfile in externalProfiles) { // eslint-disable-line
                                    var authenticationProviderID = externalProfiles[externalProfile].authenticationProviderID;
                                    if (authenticationProviderID === idmPreferences.oauthProviderId) {
                                        idmProfile = true;
                                    }
                                }

                                var updateProfileObject;

                                if (idmPreferences.isIdmEnabled && idmProfile) {
                                    var profileForm = server.forms.getForm('profile');
                                    var profileObj = profileForm.toObject();
                                    profileObj.customer.phone = decryptedData.mobileno;
                                    if (!empty(currentCustomer.profile.gender)) {
                                        if (currentCustomer.profile.gender.value === 1) {
                                            profileObj.customer.gender = 1;
                                        } else if (currentCustomer.profile.gender.value === 2 || currentCustomer.profile.gender.value === 0) {
                                            profileObj.customer.gender = 2;
                                        }
                                    }
                                    updateProfileObject = idmHelper.updateUser(profileObj, currentCustomer, true);
                                } else {
                                    updateProfileObject = {
                                        updated: true
                                    };
                                }

                                if (updateProfileObject && updateProfileObject.updated) {
                                    var Transaction = require('dw/system/Transaction');
                                    Transaction.wrap(function () {
                                        currentCustomer.profile.phoneHome = decryptedData.mobileno;
                                        currentCustomer.profile.custom.phoneMobile1 = mobileAuthData.phone1;
                                        currentCustomer.profile.custom.phoneMobile2 = mobileAuthData.phone2;
                                        currentCustomer.profile.custom.phoneMobile3 = mobileAuthData.phone3;
                                    });
                                    reloadPage = true;
                                }
                            } else {
                                errorMessage = Resource.msg('error.updatemobile.differentci', 'mobileAuth', null);
                            }
                        } else if (!empty(profiles) && profiles.length > 0) {
                            duplicatedEmail = profiles[0].email;

                            if (customerLoggedIn) {
                                require('*/cartridge/scripts/helpers/accountHelpers').deleteIDMCookies();

                                var CustomerMgr = require('dw/customer/CustomerMgr');
                                CustomerMgr.logoutCustomer(req.session.privacyCache.get('remember_me') || false);
                            }
                            modalTemplate = 'account/mobileAuth/mobileAuthDuplicate';
                        } else if (customerLoggedIn) {
                            decryptedData.genderText = decryptedData.gender === '1' ? Resource.msg('label.completelogin.gender.male', 'mobileAuth', null) : Resource.msg('label.completelogin.gender.female', 'mobileAuth', null);
                            showSMSOptIn = currentCustomer.profile.phoneHome.split('-').join('') !== decryptedData.mobileno || !currentCustomer.profile.custom.smsOptIn;
                            disableOuterClose = true;
                            modalTemplate = 'account/mobileAuth/mobileAuthCompleteLogin';
                        } else {
                            triggerRegistration = true;
                        }
                    } else {
                        errorMessage = Resource.msg('error.registration.minimumage', 'mobileAuth', null);
                    }
                } else {
                    throw new Error('No Decrypted Data or no birthdate');
                }
            } else {
                throw new Error('Token version mismatch');
            }
        } catch (e) {
            var Logger = require('dw/system/Logger');
            Logger.error('Mobile Auth Return Error ' + e.message + e.stack);
            errorMessage = Resource.msg('error.mobileauth.generic', 'mobileAuth', null);
        }
    } else {
        res.redirect(URLUtils.url('Home-Show'));
        return next();
    }
    if (!empty(errorMessage) && customerLoggedIn && empty(currentCustomer.profile.custom.CI)) {
        disableOuterClose = true;
    }
    res.render('account/mobileAuth/mobileAuthReturn', {
        triggerRegistration: triggerRegistration,
        duplicatedEmail: duplicatedEmail,
        decryptedRetData: decryptedData,
        errorMessage: errorMessage,
        authenticationPending: customerLoggedIn && empty(currentCustomer.profile.custom.CI),
        naverRedirectURL: naverRedirectURL,
        reloadPage: reloadPage,
        modalTemplate: modalTemplate,
        showSMSOptIn: showSMSOptIn,
        disableOuterClose: disableOuterClose
    });
    return next();
});

server.post('CompleteMobileAuth', function (req, res, next) {
    var success = true;
    var requestBody = req.httpParameterMap;
    if (requestBody.logout && requestBody.logout.booleanValue) {
        require('*/cartridge/scripts/helpers/accountHelpers').deleteIDMCookies();

        var CustomerMgr = require('dw/customer/CustomerMgr');
        CustomerMgr.logoutCustomer(req.session.privacyCache.get('remember_me') || false);
    } else {
        var currentCustomer = req.currentCustomer.raw;
        if (currentCustomer.profile) {
            var profile = currentCustomer.profile;

            var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
            if (mobileAuthProvider.mobileAuthEnabled && session.privacy.mobileAuthCI) {
                var mobileAuthData = mobileAuthProvider.getDataFromSession();
                var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
                var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');

                var externalProfiles = currentCustomer.externalProfiles;
                var idmProfile = false;
                for (var externalProfile in externalProfiles) { // eslint-disable-line
                    var authenticationProviderID = externalProfiles[externalProfile].authenticationProviderID;
                    if (authenticationProviderID === idmPreferences.oauthProviderId) {
                        idmProfile = true;
                    }
                }

                var updateProfileObject;
                if (idmPreferences.isIdmEnabled && idmProfile) {
                    var profileObj = {
                        customer: {
                            birthDay: mobileAuthData.birthDay,
                            birthMonth: mobileAuthData.birthMonth,
                            birthYear: mobileAuthData.birthYear,
                            email: profile.email,
                            lastname: mobileAuthData.name,
                            phone: mobileAuthData.phone,
                            gender: mobileAuthData.gender === '0' ? '2' : mobileAuthData.gender,
                            preferences: {}
                        },
                        login: {}
                    };
                    updateProfileObject = idmHelper.updateUser(profileObj, currentCustomer, true, JSON.parse(profile.custom.preferences));
                } else {
                    updateProfileObject = {
                        updated: true
                    };
                }

                var Transaction = require('dw/system/Transaction');
                Transaction.wrap(function () {
                    if (updateProfileObject && updateProfileObject.updated) {
                        profile.custom.CI = mobileAuthData.mobileAuthCI;
                        profile.setLastName(mobileAuthData.name);
                        profile.setPhoneHome(mobileAuthData.phone1 + '-' + mobileAuthData.phone2 + '-' + mobileAuthData.phone3);
                        profile.custom.phoneMobile1 = mobileAuthData.phone1;
                        profile.custom.phoneMobile2 = mobileAuthData.phone2;
                        profile.custom.phoneMobile3 = mobileAuthData.phone3;
                        profile.setGender(mobileAuthData.gender === '0' ? '2' : mobileAuthData.gender);
                        var birthdate = new Date(parseInt(mobileAuthData.birthYear, 10), parseInt(mobileAuthData.birthMonth, 10) - 1, parseInt(mobileAuthData.birthDay, 10));
                        profile.setBirthday(birthdate);
                        profile.custom.birthYear = mobileAuthData.birthYear;
                        profile.custom.birthMonth = mobileAuthData.birthMonth;
                        profile.custom.birthDay = mobileAuthData.birthDay;
                        if (requestBody.parameterNames.contains('smsOptIn')) {
                            profile.custom.smsOptIn = requestBody.smsOptIn.booleanValue;
                        }
                    }
                });
            }
        }
    }
    res.json({
        success: success
    });
    next();
});

server.append('Show', function (req, res, next) {
    var viewData = res.getViewData(); // eslint-disable-line
    var redirectURL = req.httpParameterMap.naverRedirectURL.stringValue;
    var mobileAuthProvider = require('*/cartridge/modules/providers').get('MobileAuth');
    viewData.mobileAuthEnabled = mobileAuthProvider.mobileAuthEnabled;
    if (req.querystring.mobileAuthEmail && mobileAuthProvider.mobileAuthEnabled) {
        viewData.userName = req.querystring.mobileAuthEmail;
    }
    res.setViewData({
        naverRedirectURL: redirectURL
    });
    next();
});

/**
 * Login-OAuthReentry : This endpoint is called by the External OAuth Login Provider (Facebook, Google etc. to re-enter storefront after shopper logs in using their service
 * @name Base/Login-OAuthReentry
 * @function
 * @memberof Login
 * @param {middleware} - server.middleware.https
 * @param {middleware} - consentTracking.consent
 * @param {querystringparameter} - code - given by facebook
 * @param {querystringparameter} - state - given by facebook
 * @param {category} - sensitive
 * @param {renders} - isml only if there is a error
 * @param {serverfunction} - get
 */
server.get('OAuthReentryNaver', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var oauthLoginFlowMgr = require('dw/customer/oauth/OAuthLoginFlowMgr');
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var Transaction = require('dw/system/Transaction');
    var Resource = require('dw/web/Resource');
    var naverSSOToken;
    var sitePreferences = require('*/cartridge/config/preferences');
    var showSplitEmailField = sitePreferences.isShowSplitEmailField;
    var showSplitPhoneMobileField = sitePreferences.isShowSplitPhoneMobileField;

    var finalizeOAuthLoginResult = oauthLoginFlowMgr.finalizeOAuthLogin();
    if (!finalizeOAuthLoginResult) {
        res.redirect(URLUtils.url('Login-Show'));
        return next();
    }

    // get access token from naver.
    var naverssoHelper = require('*/cartridge/scripts/helpers/naversso/naverSSOHelpers.js');
    var qstringObj = req.querystring;
    naverSSOToken = naverssoHelper.getNaverSSOToken(qstringObj);

    if (empty(naverSSOToken)) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var response = naverssoHelper.getNaverUserInfo(naverSSOToken);
    var oauthProviderID = 'Naver';

    if (!oauthProviderID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (!response) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var externalProfile = response;
    if (!externalProfile) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var userID = externalProfile.id || externalProfile.uid;
    if (!userID) {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    var authenticatedCustomerProfile = CustomerMgr.getExternallyAuthenticatedCustomerProfile(
        oauthProviderID,
        userID
    );

    if (!authenticatedCustomerProfile) {
        // Create new profile
        Transaction.wrap(function () {
            var newCustomer = CustomerMgr.createExternallyAuthenticatedCustomer(
                oauthProviderID,
                userID
            );

            authenticatedCustomerProfile = newCustomer.getProfile();
            var fullName;
            var email = externalProfile['email-address'] || externalProfile.email;
            if (!email) {
                var emails = externalProfile.emails;

                if (emails && emails.length) {
                    email = externalProfile.emails[0].value;
                }
            }
            authenticatedCustomerProfile.setEmail(email);
            if (showSplitEmailField) {
                email = email.split('@');
                // save SplitEmail Field
                authenticatedCustomerProfile.custom.emailaddressName = email[0];
                authenticatedCustomerProfile.custom.emailaddressDomain = email[1];
                authenticatedCustomerProfile.custom.emailaddressDomainSelect = '';
            }
            var gender = null;
            if (externalProfile.gender == 'M') {// eslint-disable-line
                gender = '1';
            } else if (externalProfile.gender == 'F') {// eslint-disable-line
                gender = '2';
            }
            fullName = externalProfile.name || '';
            authenticatedCustomerProfile.setLastName(fullName);
            authenticatedCustomerProfile.setGender(gender);

            if (!empty(externalProfile.mobile)) {
                authenticatedCustomerProfile.setPhoneHome(externalProfile.mobile);
                if (showSplitPhoneMobileField) {
                    authenticatedCustomerProfile.setPhoneHome(externalProfile.mobile);
                    var phoneNumber = externalProfile.mobile.split('-');
                    authenticatedCustomerProfile.custom.phoneMobile1 = phoneNumber[0];
                    authenticatedCustomerProfile.custom.phoneMobile2 = phoneNumber[1];
                    authenticatedCustomerProfile.custom.phoneMobile3 = phoneNumber[2];
                }
            }

            var birthDay = externalProfile.birthday;
            var birthYear = externalProfile.birthyear;
            if (!empty(birthDay) && !empty(birthYear)) {
                var birthDate = birthYear + '-' + birthDay;
                birthDate = new Date(birthDate);
                authenticatedCustomerProfile.setBirthday(birthDate);
            }
        });
    }

    var credentials = authenticatedCustomerProfile.getCredentials();
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    var defaultShipment = basket && basket.defaultShipment ? basket.defaultShipment.shippingAddress : null;
    var shippingAddress = null; // eslint-disable-line
    var guestUserEnteredShippingAddress = null;
    // Store commercial pick up shipping address
    if (basket && basket.custom && basket.custom.isCommercialPickup) {
        shippingAddress = defaultShipment;
    } else {
        guestUserEnteredShippingAddress = defaultShipment;
    }

    if (credentials.isEnabled()) {
        Transaction.wrap(function () {
            CustomerMgr.loginExternallyAuthenticatedCustomer(oauthProviderID, userID, false);
            authenticatedCustomerProfile.custom.isNaverUser = true;
        });
    } else {
        res.render('/error', {
            message: Resource.msg('error.oauth.login.failure', 'login', null)
        });

        return next();
    }

    if (basket && !basket.custom.isCommercialPickup && guestUserEnteredShippingAddress) {
        var shipment = basket.defaultShipment;
        COHelpers.copyCustomerAddressToShipment(guestUserEnteredShippingAddress, shipment);
        COHelpers.copyCustomerAddressToBilling(guestUserEnteredShippingAddress);
    }

    // If profile checked as sleepingAccount then logged out customer and redirect to info page.
    var redirectUrl;
    if ('isSleptAccount' in authenticatedCustomerProfile.custom && authenticatedCustomerProfile.custom.isSleptAccount) {
        redirectUrl = URLUtils.url('SleepingAccount-Show', 'customerNo', authenticatedCustomerProfile.customerNo).toString();
        CustomerMgr.logoutCustomer(false);
        var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
        cookieHelpers.deleteCookie('UAExternalID');
        cookieHelpers.deleteCookie('UAActiveSession');
    } else {
        redirectUrl = !empty(session.custom.naverRedirectURL) ? session.custom.naverRedirectURL : URLUtils.url('Account-Show');
    }

    res.redirect(redirectUrl);
    delete session.custom.naverRedirectURL;

    return next();
});

server.replace('SocialLogin', server.middleware.https, consentTracking.consent, function (req, res, next) {
    var naverSSOToken;
    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

    var AuthenticationStatus = require('dw/customer/AuthenticationStatus');
    var Resource = require('dw/web/Resource');
    var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var accessToken = null;
    // eslint-disable-next-line no-unused-vars
    var responseJSON = {
        error: [Resource.msg('error.message.login.form', 'login', null)]
    };
    var queryStringObj = req.querystring;
    var socialInfo = {};
    var createUserObj = {};
    var naverRedirectURL;
    var basket;
    var guestUserEnteredShippingAddress;
    var destinationPage = session.custom.redirectDestination;
    var isAccountDeletion = queryStringObj.accountDeletion && queryStringObj.accountDeletion === 'true';
    if (PreferencesUtil.getValue('isNaverSSOEnabled') && queryStringObj.oauthProvider === 'naver') {
        var naverssoHelper = require('*/cartridge/scripts/helpers/naversso/naverSSOHelpers.js');
        var qstringObj = req.querystring;
        naverSSOToken = naverssoHelper.getNaverSSOToken(qstringObj);

        queryStringObj.accessToken = naverSSOToken;
        socialInfo.appID = PreferencesUtil.getValue('naverAppID');
        socialInfo.updateProfile = 'true';
        createUserObj.appID = PreferencesUtil.getValue('naverAppID');
    }
    accessToken = queryStringObj.accessToken;
    var providerID = queryStringObj.oauthProvider;
    if (empty(accessToken)) {
        // Handle NaverSSO login redirection
        if (PreferencesUtil.getValue('isNaverSSOEnabled') && queryStringObj.oauthProvider === 'naver') {    // Handle For NaverSSO
            if ('error' in responseJSON && responseJSON.error.length) {
                naverRedirectURL = URLUtils.url('Home-Show', destinationPage, 'true', 'destinationPage', destinationPage, 'isNaverSSOFail', true, 'authStatus', authenticateCustomerResult.status);   // eslint-disable-line
            } else {
                naverRedirectURL = !empty(session.custom.naverRedirectURL) ? session.custom.naverRedirectURL : URLUtils.url('Account-Show');
            }
            res.redirect(naverRedirectURL);
            delete session.custom.naverRedirectURL;
            delete session.custom.redirectDestination;
            return next();
        }
        res.json(responseJSON);
        return next();
    }
    socialInfo.providerID = providerID;
    socialInfo.authToken = accessToken;
    var authenticateCustomerResult = idmHelper.authenticateCustomer(null, null, socialInfo);
    if (authenticateCustomerResult.status === 'ERROR_PASSWORD_MISMATCH') {
        // Make a request to create user
        createUserObj.providerID = providerID;
        createUserObj.accessToken = queryStringObj.accessToken;
        var createSocialUser = idmHelper.createSocialUser(createUserObj);
        if (createSocialUser.status) {
            authenticateCustomerResult = idmHelper.authenticateCustomer(null, null, socialInfo);
        }
    }
    if (authenticateCustomerResult.tokenSuccess && authenticateCustomerResult.accessToken) {
        const customerInfo = idmHelper.customerInfo(authenticateCustomerResult.accessToken);
        if (!empty(customerInfo)) {
            // Customer authenticated successfully
            authenticateCustomerResult = {
                status: AuthenticationStatus.AUTH_OK,
                externalProfile: customerInfo,
                accessToken: authenticateCustomerResult.accessToken,
                refreshToken: authenticateCustomerResult.refreshToken,
                expiresIn: authenticateCustomerResult.expiresIn
            };
        }
    }
    if (authenticateCustomerResult.status !== AuthenticationStatus.AUTH_OK) {
        var errorCodes = {
            ERROR_PASSWORD_MISMATCH: 'error.message.facebook.authFail',
            ERROR_UNKNOWN: 'error.message.error.unknown',
            SERVICE_UNAVAILABLE: 'error.message.login.form', // error message to display if IDM service is unavailable
            ERROR_INVALID_JWT: 'error.message.login.form', // error message to display if JWT is incorrect
            default: 'error.message.login.form'
        };
        var errorMessageKey = errorCodes[authenticateCustomerResult.status] || errorCodes.default;
        var errorMessage = Resource.msg(errorMessageKey, 'login', null);
        responseJSON = {
            error: [errorMessage]
        };
    } else {
        if (PreferencesUtil.getValue('isNaverSSOEnabled') && queryStringObj.oauthProvider === 'naver') {    // Handle For NaverSSO
            // Store current basket data
            var BasketMgr = require('dw/order/BasketMgr');
            basket = BasketMgr.getCurrentBasket();
            var defaultShipment = basket && basket.defaultShipment ? basket.defaultShipment.shippingAddress : null;
            var shippingAddress = null; // eslint-disable-line
            guestUserEnteredShippingAddress = null;
            // Store commercial pick up shipping address
            if (basket && basket.custom && basket.custom.isCommercialPickup) {
                shippingAddress = defaultShipment;
            } else {
                guestUserEnteredShippingAddress = defaultShipment;
            }
        }

        var authenticatedCustomer;
        if (isAccountDeletion) {
            responseJSON = {
                success: true
            };
        } else {
            authenticatedCustomer = idmHelper.loginCustomer(authenticateCustomerResult.externalProfile, false);
        }

        if (!empty(authenticatedCustomer)) {
            idmHelper.updateTokenOnLogin(authenticatedCustomer, authenticateCustomerResult);
            res.setViewData({
                authenticatedCustomer: authenticatedCustomer
            });
            responseJSON = {
                success: true,
                redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, false) // eslint-disable-line spellcheck/spell-checker
            };
            req.session.privacyCache.set('args', null);
            req.session.privacyCache.set('loggedInWithFaceBook', true);

            if (PreferencesUtil.getValue('isNaverSSOEnabled') && queryStringObj.oauthProvider === 'naver') {    // Handle For NaverSSO
                // Retain checkoutInfo and basket ans store custom fields for phone and email
                // Create new profile
                var profile = authenticatedCustomer.profile;
                var Transaction = require('dw/system/Transaction');
                if (!empty(profile)) {
                    Transaction.wrap(function () {
                        var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
                        if (showSplitEmailField) {
                            var email = profile.email.split('@');
                            // save SplitEmail Field
                            profile.custom.emailaddressName = email[0];
                            profile.custom.emailaddressDomain = email[1];
                            profile.custom.emailaddressDomainSelect = email[1];
                        }
                        var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
                        var addressHelper = require('*/cartridge/scripts/helpers/addressHelpers');
                        var phoneNumber = addressHelper.splitPhoneField(profile.phoneHome);
                        if (!empty(phoneNumber)) {
                            profile.setPhoneHome(phoneNumber.join('-'));
                            if (showSplitPhoneMobileField) {
                                profile.custom.phoneMobile1 = phoneNumber[0];
                                profile.custom.phoneMobile2 = phoneNumber[1];
                                profile.custom.phoneMobile3 = phoneNumber[2];
                            }
                        }
                        profile.custom.isNaverUser = true;  // Set isNaverUser attriubute to true
                    });
                }
                if (basket && !basket.custom.isCommercialPickup && guestUserEnteredShippingAddress) {
                    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
                    var shipment = basket.defaultShipment;
                    COHelpers.copyCustomerAddressToShipment(guestUserEnteredShippingAddress, shipment);
                    COHelpers.copyCustomerAddressToBilling(guestUserEnteredShippingAddress);
                }
            }
        }
    }

    // Handle NaverSSO login redirection
    if (PreferencesUtil.getValue('isNaverSSOEnabled') && queryStringObj.oauthProvider === 'naver') {    // Handle For NaverSSO
        if ('error' in responseJSON && responseJSON.error.length) {
            naverRedirectURL = URLUtils.url('Home-Show', destinationPage, 'true', 'destinationPage', destinationPage, 'isNaverSSOFail', true, 'authStatus', authenticateCustomerResult.status);   // eslint-disable-line
        } else if (profile && 'isSleptAccount' in profile.custom && profile.custom.isSleptAccount) {   // eslint-disable-line block-scoped-var
            // If profile checked as sleepingAccount then logged out customer and redirect to info page.
            var CustomerMgr = require('dw/customer/CustomerMgr');
            naverRedirectURL = URLUtils.url('SleepingAccount-Show', 'customerNo', profile.customerNo).toString();   // eslint-disable-line block-scoped-var
            CustomerMgr.logoutCustomer(false);
            var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
            cookieHelpers.deleteCookie('UAExternalID');
            cookieHelpers.deleteCookie('UAActiveSession');
        } else {
            naverRedirectURL = !empty(session.custom.naverRedirectURL) ? session.custom.naverRedirectURL : URLUtils.url('Account-Show').toString();
        }

        if (isAccountDeletion) {
            req.session.privacyCache.set('naverReauthenticated', 'authenticated');
        }

        res.redirect(naverRedirectURL);
        delete session.custom.naverRedirectURL;
        delete session.custom.redirectDestination;
        return next();
    }

    res.json(responseJSON);
    return next();
});

module.exports = server.exports();
