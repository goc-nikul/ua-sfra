'use strict';

var URLUtils = require('dw/web/URLUtils');
var base = require('app_storefront_base/cartridge/scripts/helpers/accountHelpers');
var endpoints = require('*/cartridge/config/oAuthRenentryRedirectEndpoints');
var Resource = require('dw/web/Resource');
var CustomerMgr = require('dw/customer/CustomerMgr');
/**
 * Send an email that would notify the user that account was created
 * @param {obj} registeredUser - object that contains user's email address and name information.
 */
function sendCreateAccountEmail(registeredUser) {
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var Site = require('dw/system/Site');
    var templateData = {
        email: registeredUser.email,
        firstName: registeredUser.firstName,
        lastName: registeredUser.lastName,
        url: URLUtils.https('Login-Show')
    };

    var emailData = {
        to: registeredUser.email,
        subject: Resource.msg('email.subject.new.registration', 'registration', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
        type: emailHelpers.emailTypes.registration
    };

    var emailObj = {
        templateData: templateData,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Gets the password reset token of a customer
 * @param {Object} customer - the customer requesting password reset token
 * @returns {string} password reset token string
 */
function getPasswordResetToken(customer) {
    var Transaction = require('dw/system/Transaction');

    var passwordResetToken;
    Transaction.wrap(function () {
        passwordResetToken = customer.profile.credentials.createResetPasswordToken();
    });
    return passwordResetToken;
}

/**
 * Sends the email with password reset instructions
 * @param {string} email - email for password reset
 * @param {Object} resettingCustomer - the customer requesting password reset
 */
function sendPasswordResetEmail(email, resettingCustomer) {
    var Site = require('dw/system/Site');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');

    var passwordResetToken = getPasswordResetToken(resettingCustomer);
    var templateData = {
        passwordResetToken: passwordResetToken,
        firstName: resettingCustomer.profile.firstName,
        lastName: resettingCustomer.profile.lastName,
        url: URLUtils.https('Account-SetNewPassword', 'Token', passwordResetToken),
        resettingCustomer: resettingCustomer
    };

    var emailData = {
        to: email,
        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
        type: emailHelpers.emailTypes.passwordReset
    };

    var emailObj = {
        templateData: templateData,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Send an email that would notify the user that account was edited
 * @param {obj} profile - object that contains user's profile information.
 */
function sendAccountEditedEmail(profile) {
    try {
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var Site = require('dw/system/Site');

        var userObject = {
            firstName: profile.firstName,
            lastName: profile.lastName,
            url: URLUtils.https('Login-Show')
        };

        var emailData = {
            to: profile.email,
            subject: Resource.msg('email.subject.account.edited', 'account', null),
            from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
            type: emailHelpers.emailTypes.accountEdited
        };

        var emailObj = {
            templateData: userObject,
            emailData: emailData
        };

        require('*/cartridge/modules/providers').get('Email', emailObj).send();
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('Error in account update email trigger' + e);
    }
}

/**
 * Creates an account model for the current customer
 * @param {string} redirectUrl - rurl of the req.querystring
 * @param {string} privacyCache - req.session.privacyCache
 * @param {boolean} newlyRegisteredUser - req.session.privacyCache
 * @returns {string} a redirect url
 */
function getLoginRedirectURL(redirectUrl, privacyCache, newlyRegisteredUser) {
    var endpoint = 'Account-EditProfile';
    var result;
    var targetEndPoint = redirectUrl
        ? parseInt(redirectUrl, 10)
        : 1;

    var registered = newlyRegisteredUser ? 'submitted' : 'false';

    if (newlyRegisteredUser) {
        targetEndPoint = 3;
    }

    var argsForQueryString = privacyCache.get('args');

    if (targetEndPoint && endpoints[targetEndPoint]) {
        endpoint = endpoints[targetEndPoint];
    }

    if (argsForQueryString) {
        result = URLUtils.url(endpoint, 'registration', registered, 'args', argsForQueryString).relative().toString();
    } else {
        result = URLUtils.url(endpoint, 'registration', registered).relative().toString();
    }

    return result;
}

/**
 * Create an account in IDM
 * @param {string} username login
 * @param {string} password password
 * @param {profObj} profObj profObj
 * @returns {Object} status of request
 */
function createIDMAccount(username, password, profObj) {
    try {
        var idmHelper = require('*/cartridge/scripts/idmHelper');
        var duplicateCustomer = false;
        var loginStatus = idmHelper.createUser(username, password, profObj);
        if (!loginStatus.status) {
            var errorMsg;
            switch (loginStatus.errorCode) {
                case idmHelper.errorCodes.ERROR_DUPLICATE_CUSTOMER:
                    duplicateCustomer = true;
                    errorMsg = Resource.msg('error.message.user.already.exist', 'forms', null);
                    break;
                default:
                    errorMsg = Resource.msg('error.message.username.invalid', 'forms', null);
                    break;
            }
            throw new Error(errorMsg);
        }
        var AuthenticationStatus = require('dw/customer/AuthenticationStatus');
        var customerAuth = idmHelper.authenticateCustomer(username, password);
        if (customerAuth.tokenSuccess && customerAuth.accessToken) {
            var customerInfo = idmHelper.customerInfo(customerAuth.accessToken);
            if (!empty(customerInfo)) {
                // Customer authenticated successfully
                customerAuth = {
                    status: AuthenticationStatus.AUTH_OK,
                    externalProfile: customerInfo,
                    accessToken: customerAuth.accessToken,
                    refreshToken: customerAuth.refreshToken,
                    expiresIn: customerAuth.expiresIn
                };
            }
        }
        if (customerAuth.status !== AuthenticationStatus.AUTH_OK) {
            throw new Error(Resource.msg('error.message.username.invalid', 'forms', null));
        }
        var authCustomer = idmHelper.loginCustomer(customerAuth.externalProfile, true);
        if (!authCustomer) {
            throw new Error(Resource.msg('error.message.username.invalid', 'forms', null));
        } else {
            idmHelper.updateTokenOnLogin(authCustomer, customerAuth);
        }
        return {
            authCustomer: authCustomer,
            errorMessage: null
        };
    } catch (e) {
        return {
            authCustomer: null,
            duplicateCustomer: duplicateCustomer, // eslint-disable-line
            errorMessage: e.message
        };
    }
}

/**
 * Create an account in SFCC
 * @param {string} login loginId
 * @param {string} password password
 * @returns {Object} returns status and customer
 */
function createSFCCAccount(login, password) {
    var Transaction = require('dw/system/Transaction');
    var authenticatedCustomer;
    // attempt to create a new user and log that user in.
    try {
        Transaction.wrap(function () {
            var error = {};
            var newCustomer = CustomerMgr.createCustomer(login, password);

            var authenticateCustomerResult = CustomerMgr.authenticateCustomer(login, password);
            if (authenticateCustomerResult.status !== 'AUTH_OK') {
                error = { authError: true, status: authenticateCustomerResult.status };
                throw error;
            }

            authenticatedCustomer = CustomerMgr.loginCustomer(authenticateCustomerResult, false);

            if (!authenticatedCustomer) {
                error = { authError: true, status: authenticateCustomerResult.status };
                throw error;
            } else {
                // assign values to the profile
                var newCustomerProfile = newCustomer.getProfile();
                newCustomerProfile.email = login;
            }
        });
        return {
            authCustomer: authenticatedCustomer,
            errorMessage: null
        };
    } catch (e) {
        return {
            authCustomer: null,
            errorMessage: Resource.msg('error.message.username.invalid', 'forms', null)
        };
    }
}

/**
 * Get common error result format
 * @param {boolean} status staus
 * @param {Object} errorMsg error messages
 * @returns {Object} statusObj password reset status
 */
function providePasswordResetStatus(status, errorMsg) {
    var statusObj = {};
    statusObj.status = status;
    statusObj.errorMsg = errorMsg;
    return statusObj;
}

/**
 * Checks if the email value entered is correct format
 * @param {string} email - email string to check if valid
 * @returns {boolean} Whether email is valid
 */
function validateEmail(email) {
    var regex = /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/;
    return regex.test(email);
}

/**
 * Validate password reset for IDM
 * @param {string} email email to validate for password reset
 * @returns {Object} passwordResetStatus ststus of password reset
 */
function passwordResetIDMAccount(email) {
    if (email) {
        var idmHelper = require('*/cartridge/scripts/idmHelper');
        const tokenResponse = idmHelper.getAccessToken('client_credentials', null);
        if (!empty(tokenResponse) && 'access_token' in tokenResponse && !empty(tokenResponse.access_token)) {
            let accessToken = tokenResponse.access_token;
            let idmUserID = idmHelper.getUserIDByEmail(email, accessToken);
            if(idmUserID) idmHelper.updateIDMLocale(idmUserID, request.locale, accessToken); // eslint-disable-line
            let passwordResetStatus = idmHelper.passwordReset(email, accessToken);
            return providePasswordResetStatus(passwordResetStatus.status, passwordResetStatus.errorCode);
        }
    }
    return providePasswordResetStatus(false, Resource.msg('error.message.required', 'login', null));
}

/**
 * Validate password reset for SFCC
 * @param {string} email email to validate for password reset
 * @returns {Object} passwordResetStatus ststus of password reset
 */
function passwordResetSFCCAccount(email) {
    try {
        var isValid = validateEmail(email);
        if (isValid) {
            var resettingCustomer = CustomerMgr.getCustomerByLogin(email);
            if (resettingCustomer) {
                sendPasswordResetEmail(email, resettingCustomer);
                return providePasswordResetStatus(true);
            }
            return providePasswordResetStatus(false, Resource.msg('error.message.passwordreset', 'login', null));
        }
        return providePasswordResetStatus(false, Resource.msg('error.message.required', 'login', null));
    } catch (e) {
        return providePasswordResetStatus(false, e.message);
    }
}

/**
 * Validate user in IDM
 * @param {string} token user token
 * @returns {boolean} verifies user in IDM
 */
function verifyNewPasswordIDMAccount(token) {
    var idmHelper = require('*/cartridge/scripts/idmHelper');
    return idmHelper.verifyNewPasswordIDMAccount(token);
}

/**
 * Validate user in SFCC
 * @param {string} token user token
 * @returns {Object} verifies user in SFCC
 */
function verifyNewPasswordSFCCAccount(token) {
    var customer = CustomerMgr.getCustomerByToken(token);

    if (token && customer) {
        return {
            status: true,
            customer: customer
        };
    }

    return {
        status: false
    };
}

/**
 * Update password in IDM
 * @param {string} token user token
 * @param {string} newPassword new password
 * @returns {boolean} status
 */
function updatePasswordIDMAccount(token, newPassword) {
    var idmHelper = require('*/cartridge/scripts/idmHelper');
    return idmHelper.updateNewPasswordIDMAccount(token, newPassword);
}

/**
 * Update password in SFCC
 * @param {string} token user token
 * @param {string} newPassword user password
 * @returns {boolean} status
 */
function updatePasswordSFCCAccount(token, newPassword) {
    var Transaction = require('dw/system/Transaction');
    var updatePwdStatus = {
        error: true,
        resettingCustomer: null
    };
    Transaction.wrap(function () {
        var resettingCustomer = CustomerMgr.getCustomerByToken(token);
        var status = (resettingCustomer && resettingCustomer.profile && resettingCustomer.profile.credentials)
                        ? resettingCustomer.profile.credentials.setPasswordWithToken(token, newPassword)
                        : false;
        updatePwdStatus.error = !status;
        updatePwdStatus.resettingCustomer = resettingCustomer;
    });
    return updatePwdStatus;
}

/**
 * validate major input fields against emoji characters, non latin characters and regex pattern
 * @param {Object} customerObj - customer Object
 * @returns {Object} an error object
 */
function validateProfileFields(customerObj) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var customerFieldsToVerify = 'firstname' in customerObj ? ['firstname', 'lastname'] : ['firstName', 'lastName'];
    var inputValidationErrors = {
        error: false,
        profileFieldsError: {}
    };

    // Validate shipping address
    if (customerObj) {
        inputValidationErrors.profileFieldsError = COHelpers.checkEmptyEmojiNonLatinChars(customerObj, customerFieldsToVerify);
        if (Object.keys(inputValidationErrors.profileFieldsError).length > 0) {
            inputValidationErrors.error = true;
        }
    }
    return inputValidationErrors;
}

/**
 * validate input fields helper against xss regex pattern
 * @param {Object} accountObject - form object
 * @param {Object} inputFieldsToVerify - form object
 * @returns {Object} an error object
 */
function validateInputFieldshelper(accountObject, inputFieldsToVerify) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var inputValidateErrors = {
        error: false,
        customerAccountErrors: {},
        genericErrorMessage: ''
    };
        // Validate customer account
    if (accountObject) {
        inputValidateErrors.customerAccountErrors = checkCrossSiteScript.crossSiteScriptPatterns(accountObject, inputFieldsToVerify);
    }
    if (Object.keys(inputValidateErrors.customerAccountErrors).length > 0) {
        inputValidateErrors.error = true;
        if ('email' in inputValidateErrors.customerAccountErrors) {
            inputValidateErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
            inputValidateErrors.customerAccountErrors.email = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
        } else if ('loginEmail' in inputValidateErrors.customerAccountErrors) {
            inputValidateErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
            inputValidateErrors.customerAccountErrors.loginEmail = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
        } else {
            inputValidateErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
        }
    }
    return inputValidateErrors;
}
/**
 * creating array of input field name for my account
 * @param {accountObject} accountObject - form object
 * @returns {Object} an error object
 */
function validateAccountInputFields(accountObject) {
    var accountFieldsToVerify = ['firstname', 'lastname', 'email', 'newemail', 'newemailconfirm', 'phone', 'gender', 'birthDay', 'postalCode', 'birthMonth'];
    var validateInputFieldError = validateInputFieldshelper(accountObject, accountFieldsToVerify);
    return validateInputFieldError;
}
/**
 * creating array of input field name for my account payment,login account register
 * @param {accountObject} accountObject - form object
 * @returns {Object} an error object
 */
function validateLoginInputFields(accountObject) {
    var loginFieldsToVerify = ['email', 'name', 'loginEmail'];
    var validateInputFieldsError = validateInputFieldshelper(accountObject, loginFieldsToVerify);
    return validateInputFieldsError;
}
/**
 * invalidate  input fields if any  xss valnarability is present in field
 * @param {inputFieldsValidation} inputFieldsValidation - form object
 * @param {profileForm} profileForm - form object
 */
function inputValidationField(inputFieldsValidation, profileForm) { /* eslint-disable no-param-reassign */
    if (inputFieldsValidation.customerAccountErrors.firstname) {
        profileForm.customer.firstname.valid = false;
        profileForm.customer.firstname.error = inputFieldsValidation.customerAccountErrors.firstname;
    }
    if (inputFieldsValidation.customerAccountErrors.lastname) {
        profileForm.customer.lastname.valid = false;
        profileForm.customer.lastname.error = inputFieldsValidation.customerAccountErrors.lastname;
    }
    if (inputFieldsValidation.customerAccountErrors.email) {
        profileForm.customer.email.valid = false;
        profileForm.customer.email.error = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
    }
    if (inputFieldsValidation.customerAccountErrors.newemail) {
        profileForm.customer.newemail.valid = false;
        profileForm.customer.newemail.error = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
    }
    if (inputFieldsValidation.customerAccountErrors.newemailconfirm) {
        profileForm.customer.newemailconfirm.valid = false;
        profileForm.customer.newemailconfirm.error = Resource.msg('checkout.nonlatincharacters.specificerror', 'checkout', null);
    }
    if (inputFieldsValidation.customerAccountErrors.phone) {
        profileForm.customer.phone.valid = false;
        profileForm.customer.phone.error = inputFieldsValidation.customerAccountErrors.phone;
    }
    if (inputFieldsValidation.customerAccountErrors.gender) {
        profileForm.customer.gender.valid = false;
        profileForm.customer.gender.error = inputFieldsValidation.customerAccountErrors.gender;
    }
    if (inputFieldsValidation.customerAccountErrors.birthDay) {
        profileForm.customer.birthDay.valid = false;
        profileForm.customer.birthDay.error = inputFieldsValidation.customerAccountErrors.birthDay;
    }
    if (inputFieldsValidation.customerAccountErrors.birthDay) {
        profileForm.customer.birthDay.valid = false;
        profileForm.customer.birthDay.error = inputFieldsValidation.customerAccountErrors.birthDay;
    }
    if (inputFieldsValidation.customerAccountErrors.postalCode) {
        profileForm.customer.postalCode.valid = false;
        profileForm.customer.postalCode.error = inputFieldsValidation.customerAccountErrors.postalCode;
    }
    if (inputFieldsValidation.customerAccountErrors.birthMonth) {
        profileForm.customer.birthMonth.valid = false;
        profileForm.customer.birthMonth.error = inputFieldsValidation.customerAccountErrors.birthMonth;
    }
}

/**
 * fetches user selected preferences, adds them to arrays
 * @param {profileObj} profileObj - form object
 * @returns {Object} user preferences
 */
function getPreferences(profileObj) {
    var preferences = {
        genders: [],
        activities: []
    };
    var requestParameterNames = request.getHttpParameterMap().getParameterNames(); // eslint-disable-line no-undef
    var genderObj = profileObj.customer.preferences.genders ? profileObj.customer.preferences.genders : '';
    Object.keys(genderObj).forEach(function (gender) {
        if (requestParameterNames.contains(genderObj[gender].htmlName)) {
            preferences.genders.push(genderObj[gender].htmlValue);
        }
    });
    var activityObj = profileObj.customer.preferences.activities ? profileObj.customer.preferences.activities : '';
    Object.keys(activityObj).forEach(function (activity) {
        if (requestParameterNames.contains(activityObj[activity].htmlName)) {
            preferences.activities.push(activityObj[activity].htmlValue);
        }
    });
    return preferences;
}

/**
 * update profileObj with preferences objects from profileForm
 * @param {profileForm} profileForm - form object
 * @param {profileObj} profileObj - form object
 */
function updateProfileObj(profileForm, profileObj) {
    Object.keys(profileForm.customer.preferences.genders).forEach(function (gender) {
        if (profileForm.customer.preferences.genders[gender] != null && typeof profileForm.customer.preferences.genders[gender] === 'object') {
            profileObj.customer.preferences.genders[gender] = profileForm.customer.preferences.genders[gender];
        }
    });
    Object.keys(profileForm.customer.preferences.activities).forEach(function (activity) {
        if (profileForm.customer.preferences.activities[activity] != null && typeof profileForm.customer.preferences.activities[activity] === 'object') {
            profileObj.customer.preferences.activities[activity] = profileForm.customer.preferences.activities[activity];
        }
    });
}

/**
 * Returns the correct credit card type
 * @param {string} cardType - Current card type
 * @returns {string} returns correct card type
 */
function getCardType(cardType) {
    var cardTypeObject = {
        VIC: Resource.msg('aurus.visa.credit_card', 'payment', null),
        MCC: Resource.msg('aurus.Master.credit_card', 'payment', null),
        AXC: Resource.msg('aurus.american_express.credit_card', 'payment', null),
        NVC: Resource.msg('aurus.discover.credit_card', 'payment', null),
        DCC: Resource.msg('aurus.diners.credit_card', 'payment', null),
        JBC: Resource.msg('aurus.jcb.credit_card', 'payment', null)
    };

    if (cardType in cardTypeObject && cardTypeObject[cardType]) {
        return cardTypeObject[cardType];
    }

    return cardType;
}


/**
 * Provides the regex based on the site preference. Strong password requirements or existing weaker requirements.
 * This is independent from the Business Manager password requirements due to the requirement to enable / disable client and server side validation separately.
 * @return {Object} result - Result object containing regular expression used for password validation and its end user error message.
 */
function getPasswordRequirements() {
    let result = {
        regex: '^.{6,}$',
        errorMsg: Resource.msg('password.regex.error', 'account', null),
        strongPassword: false
    };

    let Site = require('dw/system/Site');

    const isStrongPasswordEnable = function () {
        let preferenceName = 'useStrongPassword';
        if (preferenceName in Site.getCurrent().getPreferences().getCustom() && Site.getCurrent().getCustomPreferenceValue(preferenceName) === true) {
            return true;
        }

        return false;
    };
    const getStrongPasswordRegex = function () {
        let preferenceName = 'strongPasswordRegex';
        if (preferenceName in Site.getCurrent().getPreferences().getCustom() && Site.getCurrent().getCustomPreferenceValue(preferenceName)) {
            return Site.getCurrent().getCustomPreferenceValue(preferenceName);
        }

        return false;
    };
    const getStrongPasswordMessage = function () {
        var ContentMgr = require('dw/content/ContentMgr');
        let passwordContent = ContentMgr.getContent('strong-password-requirements');
        if (!empty(passwordContent)) {
            return !empty(passwordContent.custom.body) ? passwordContent.custom.body.markup : result.errorMsg;
        }
        return result.errorMsg;
    };

    if (isStrongPasswordEnable() && getStrongPasswordRegex() !== false) {
        result.strongPassword = true;
        result.regex = getStrongPasswordRegex();
        result.errorMsg = getStrongPasswordMessage();
    }

    return result;
}


module.exports = base;
module.exports.getLoginRedirectURL = getLoginRedirectURL;
module.exports.sendCreateAccountEmail = sendCreateAccountEmail;
module.exports.sendPasswordResetEmail = sendPasswordResetEmail;
module.exports.sendAccountEditedEmail = sendAccountEditedEmail;
module.exports.createIDMAccount = createIDMAccount;
module.exports.createSFCCAccount = createSFCCAccount;
module.exports.passwordResetIDMAccount = passwordResetIDMAccount;
module.exports.passwordResetSFCCAccount = passwordResetSFCCAccount;
module.exports.verifyNewPasswordIDMAccount = verifyNewPasswordIDMAccount;
module.exports.verifyNewPasswordSFCCAccount = verifyNewPasswordSFCCAccount;
module.exports.updatePasswordIDMAccount = updatePasswordIDMAccount;
module.exports.updatePasswordSFCCAccount = updatePasswordSFCCAccount;
module.exports.validateProfileFields = validateProfileFields;
module.exports.validateAccountInputFields = validateAccountInputFields;
module.exports.validateLoginInputFields = validateLoginInputFields;
module.exports.inputValidationField = inputValidationField;
module.exports.getPreferences = getPreferences;
module.exports.updateProfileObj = updateProfileObj;
module.exports.getCardType = getCardType;
module.exports.getPasswordRequirements = getPasswordRequirements;
