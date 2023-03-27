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
    if (customer.registered) {
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
    res.setViewData(viewData);
    var minimumAgeRestriction = require('*/cartridge/config/preferences').MinimumAgeRestriction;
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    var showRegisterModal = req.querystring.showregistermodal;
    if (showRegisterModal) {
        res.redirect(URLUtils.url('Home-Show', 'showRegisterModal', showRegisterModal));
    } else {
        res.render('account/createAccountModal', {
            createAccountUrl: createAccountUrl,
            format: req.querystring.format ? req.querystring.format : '',
            userName: req.currentCustomer.raw.profile ? req.currentCustomer.raw.profile.email : '',
            actionUrl: actionUrl,
            minimumAgeRestriction: minimumAgeRestriction,
            isKRCustomCheckoutEnabled: isKRCustomCheckoutEnabled,
            canonicalUrl: URLUtils.abs('Login-CreateAccountModal'),
            naverRedirectURL: req.httpParameterMap.naverRedirectURL.stringValue
        });
    }
    next();
}, pageMetaData.computedPageMetaData);


server.append('Show', function (req, res, next) {
    var viewData = res.getViewData(); // eslint-disable-line
    var redirectURL = req.httpParameterMap.naverRedirectURL.stringValue;
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

        var authenticatedCustomer = idmHelper.loginCustomer(authenticateCustomerResult.externalProfile, false);
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
        } else if ('isSleptAccount' in profile.custom && profile.custom.isSleptAccount) {   // eslint-disable-line block-scoped-var
            // If profile checked as sleepingAccount then logged out customer and redirect to info page.
            var CustomerMgr = require('dw/customer/CustomerMgr');
            naverRedirectURL = URLUtils.url('SleepingAccount-Show', 'customerNo', profile.customerNo).toString();   // eslint-disable-line block-scoped-var
            CustomerMgr.logoutCustomer(false);
            var cookieHelpers = require('*/cartridge/scripts/helpers/cookieHelpers');
            cookieHelpers.deleteCookie('UAExternalID');
            cookieHelpers.deleteCookie('UAActiveSession');
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
});

module.exports = server.exports();
