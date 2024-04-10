'use strict';

var server = require('server');
server.extend(module.superModule);

var URLUtils = require('dw/web/URLUtils');

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var ContentMgr = require('dw/content/ContentMgr');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');

server.get(
    'CreateAccountModal',
    csrfProtection.generateToken,
    function (req, res, next) {
        var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();
        var target = req.querystring.rurl || 1;
        var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
        var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
        var profileForm = server.forms.getForm('profile');
        profileForm.clear();
        var idmPreferences = require('*/cartridge/scripts/idmPreferences');
        var promptedLogin = req.querystring.promptedLogin || false;
        if (idmPreferences.isIdmEnabled && !idmPreferences.uaidmEnableRegisterFEValidation) {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                // Remove email validation on front end when idm is disabled
                delete profileForm.customer.email.regEx;
            });
        }
        var isFacebookLoginEnabledInRegisterModal = PreferencesUtil.isCountryEnabled('facebookLoginEnabledInRegisterModal');
        var showRegisterModal = req.querystring.showregistermodal;
        var userName = '';
        if (req.currentCustomer.raw && req.currentCustomer.raw.profile) {
            userName = req.currentCustomer.raw.profile.email;
        }
        if (showRegisterModal) {
            res.redirect(URLUtils.url('Home-Show', 'showRegisterModal', showRegisterModal));
        } else {
            res.render('account/createAccountModal', {
                profileForm: profileForm,
                oAuthReentryEndpoint: 3,
                createAccountUrl: createAccountUrl,
                isFacebookLoginEnabledInRegisterModal: isFacebookLoginEnabledInRegisterModal,
                passwordRules: passwordRequirements,
                format: req.querystring.format ? req.querystring.format : '',
                userName: userName,
                actionUrl: actionUrl,
                canonicalUrl: URLUtils.abs('Login-CreateAccountModal'),
                pageRef: req.querystring.pageRef,
                promptedLogin: promptedLogin
            });
        }
        next();
    }
);

server.get(
    'AccountCreatedModal',
    csrfProtection.generateToken,
    function (req, res, next) {
        res.render('account/accountCreatedModal', {});
        next();
    }
);

server.get('SocialLogin', server.middleware.https, consentTracking.consent, function (req, res, next) {
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
    accessToken = queryStringObj.accessToken;
    var providerID = queryStringObj.oauthProvider;
    if (empty(accessToken)) {
        res.json(responseJSON);
        return next();
    }
    var socialInfo = {};
    socialInfo.providerID = providerID;
    socialInfo.authToken = accessToken;
    var authenticateCustomerResult = idmHelper.authenticateCustomer(null, null, socialInfo);
    if (authenticateCustomerResult.status === 'ERROR_PASSWORD_MISMATCH') {
        // Make a request to create user
        var createUserObj = {};
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
        }
    }
    res.json(responseJSON);
    return next();
});

server.append('Show', function (req, res, next) {
    // set Login page meta-data
    var contentObj = ContentMgr.getContent('login-page');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }

    var promptedLogin = req.querystring.promptedLogin || false;
    if (promptedLogin) {
        session.custom.promptedLoginShowed = true;
    }
    var userName = '';
    if (req.currentCustomer.raw && req.currentCustomer.raw.profile) {
        userName = req.currentCustomer.raw.profile.email;
    }

    res.setViewData({
        isIdmEnabled: require('*/cartridge/scripts/idmPreferences').isIdmEnabled,
        userName: userName,
        format: req.querystring.format,
        canonicalUrl: URLUtils.abs('Login-Show'),
        returnUrl: req.querystring.returnUrl,
        pageRef: req.querystring.pageRef,
        promptedLogin: promptedLogin
    });
    next();
}, pageMetaData.computedPageMetaData);

server.replace('Logout', function (req, res, next) {
    // Wipe UA IDM Cookies that extend session
    require('*/cartridge/scripts/helpers/accountHelpers').deleteIDMCookies();

    var CustomerMgr = require('dw/customer/CustomerMgr');
    CustomerMgr.logoutCustomer(req.session.privacyCache.get('remember_me') || false);
    res.redirect(URLUtils.url('Home-Show'));
    next();
});

module.exports = server.exports();
