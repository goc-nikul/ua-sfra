'use strict';

var server = require('server');

server.extend(module.superModule);

var csrfProtection = require('*/cartridge/scripts/middleware/csrf');
var userLoggedIn = require('*/cartridge/scripts/middleware/userLoggedIn');
var consentTracking = require('*/cartridge/scripts/middleware/consentTracking');
var productListHelper = require('*/cartridge/scripts/productList/productListHelpers');
var formErrors = require('*/cartridge/scripts/formErrors');
var idmPreferences = require('plugin_ua_idm/cartridge/scripts/idmPreferences.js');
var idmHelper = require('plugin_ua_idm/cartridge/scripts/idmHelper.js');
var Resource = require('dw/web/Resource');
var pageMetaData = require('*/cartridge/scripts/middleware/pageMetaData');
var ContentMgr = require('dw/content/ContentMgr');
var pageMetaHelper = require('*/cartridge/scripts/helpers/pageMetaHelper');
var currentSite = require('dw/system/Site').getCurrent();
const TYPE_WISH_LIST = require('dw/customer/ProductList').TYPE_WISH_LIST;

/**
 * Creates an account model for the current customer
 * @param {Object} req - local instance of request object
 * @returns {Object} a plain object of the current customer's account
 */
function getModel(req) {
    var AccountModel = require('*/cartridge/models/account');
    var AddressModel = require('*/cartridge/models/address');
    var OrderHelpers = require('*/cartridge/scripts/order/orderHelpers');
    var Site = require('dw/system/Site');
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    if (isMAOEnabled && Site.getCurrent().getCustomPreferenceValue('orderHistoryDetailsProvider') && Site.getCurrent().getCustomPreferenceValue('orderHistoryDetailsProvider').value === 'UACAPI') {
        OrderHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/orderHelpers');
    }
    var orderModel = null;
    var preferredAddressModel;

    if (!req.currentCustomer.profile) {
        return null;
    }

    try {
        orderModel = OrderHelpers.getOrderModel(req);
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('MyAccount');
        Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', 'Error while initializing order model', e.name, e.message, e.fileName, e.lineNumber, e.stack);
    }

    if (req.currentCustomer.addressBook.preferredAddress) {
        preferredAddressModel = new AddressModel(req.currentCustomer.addressBook.preferredAddress);
    } else {
        preferredAddressModel = null;
    }

    return new AccountModel(req.currentCustomer, preferredAddressModel, orderModel);
}
server.replace(
    'Show',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    consentTracking.consent,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var URLUtils = require('dw/web/URLUtils');
        var reportingUrlsHelper = require('*/cartridge/scripts/reportingUrls');
        var reportingURLs;

        // Get reporting event Account Open url
        if (req.querystring.registration && req.querystring.registration === 'submitted') {
            reportingURLs = reportingUrlsHelper.getAccountOpenReportingURLs(
                CustomerMgr.registeredCustomerCount
            );
        }
        var accountModel = getModel(req);
        var wishListAccount = require('*/cartridge/models/account/wishListAccount');
        var apiWishList = productListHelper.getList(req.currentCustomer.raw, {
            type: TYPE_WISH_LIST
        });
        if (!empty(apiWishList)) {
            wishListAccount(accountModel, apiWishList);
        }
        var viewData = res.getViewData();
        var activitiesList = []; // This gets published in the view data. See render() below.
        var currentCustomer = req.currentCustomer.raw.profile;
        var profileForm = server.forms.getForm('profile');
        var preferences = currentCustomer.custom.preferences ? JSON.parse(currentCustomer.custom.preferences) : '';
        var activityPreferences = preferences && preferences.activities ? preferences.activities : '';
        var activities = profileForm.customer.preferences.activities ? profileForm.customer.preferences.activities : '';
        for (var activityPreference = 0; activityPreference < activityPreferences.length; activityPreference++) {
            if (activities[activityPreferences[activityPreference]]) {
                var label = activities[activityPreferences[activityPreference]].label;
                activitiesList.push(label);
            }
        }

        var BVHelper = require('bm_bazaarvoice/cartridge/scripts/lib/libBazaarvoice').getBazaarVoiceHelper();
        if (BVHelper.isRREnabled() || BVHelper.isQAEnabled()) {
            viewData.bvScout = BVHelper.getBvLoaderUrl();
        }
        viewData.canonicalUrl = URLUtils.abs('Account-Show');
        res.setViewData(viewData);
        res.render('account/accountDashboard', {
            account: accountModel,
            accountlanding: true,
            activities: activitiesList,
            breadcrumbs: [
                {
                    htmlValue: Resource.msg('global.home', 'common', null),
                    url: URLUtils.home().toString()
                }
            ],
            reportingURLs: reportingURLs,
            socialLinks: true
        });
        // set page meta-data
        var contentObj = ContentMgr.getContent('account-page-meta');
        if (contentObj) {
            pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
        }
        next();
    }, pageMetaData.computedPageMetaData
);

server.replace(
    'SavePassword',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var Transaction = require('dw/system/Transaction');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var URLUtils = require('dw/web/URLUtils');
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var Site = require('dw/system/Site');

        var profileForm = server.forms.getForm('profile');
        var newPasswords = profileForm.login.newpasswords;
        // form validation
        if (!newPasswords.newpassword.value || (newPasswords.newpassword.value !== newPasswords.newpasswordconfirm.value)) {
            profileForm.valid = false;
            newPasswords.newpassword.valid = false;
            newPasswords.newpasswordconfirm.valid = false;
            newPasswords.newpasswordconfirm.error =
                Resource.msg('error.message.mismatch.newpassword', 'forms', null);
        }

        var result = {
            currentPassword: profileForm.login.currentpassword.value,
            newPassword: newPasswords.newpassword.value,
            newPasswordConfirm: newPasswords.newpasswordconfirm.value,
            profileForm: profileForm
        };

        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function () { // eslint-disable-line no-shadow
                var formInfo = res.getViewData();
                var customer = CustomerMgr.getCustomerByCustomerNumber(
                    req.currentCustomer.profile.customerNo
                );
                var status;
                Transaction.wrap(function () {
                    status = customer.profile.credentials.setPassword(
                        formInfo.newPassword,
                        formInfo.currentPassword,
                        true
                    );
                });
                if (status.error) {
                    formInfo.profileForm.login.currentpassword.valid = false;
                    formInfo.profileForm.login.currentpassword.error =
                        Resource.msg('error.message.currentpasswordnomatch', 'forms', null);

                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;

                    res.json({
                        success: false,
                        fields: formErrors.getFormErrors(profileForm)
                    });
                } else {
                    delete formInfo.currentPassword;
                    delete formInfo.newPassword;
                    delete formInfo.newPasswordConfirm;
                    delete formInfo.profileForm;

                    var email = customer.profile.email;
                    var templateData = {
                        firstName: customer.profile.firstName,
                        lastName: customer.profile.lastName,
                        url: URLUtils.https('Account-EditPassword'),
                        resettingCustomer: customer
                    };

                    var emailData = {
                        to: email,
                        subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
                        type: emailHelpers.emailTypes.passwordChanged
                    };

                    var emailObj = {
                        templateData: templateData,
                        emailData: emailData
                    };

                    require('*/cartridge/modules/providers').get('Email', emailObj).send();

                    res.json({
                        success: true,
                        redirectUrl: URLUtils.url('Account-Show').toString()
                    });
                }
            });
        } else {
            res.json({
                success: false,
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.replace('SaveNewPassword', csrfProtection.validateAjaxRequest, server.middleware.https, function (req, res, next) {
    var passwordForm = server.forms.getForm('newPasswords');
    var token = req.querystring.Token;

    if (!passwordForm.newpassword.value || (passwordForm.newpassword.value !== passwordForm.newpasswordconfirm.value)) {
        passwordForm.valid = false;
        passwordForm.newpassword.valid = false;
        passwordForm.newpasswordconfirm.valid = false;
        passwordForm.newpasswordconfirm.error =
            Resource.msg('error.message.mismatch.newpassword', 'forms', null);
    }

    if (passwordForm.valid) {
        var result = {
            newPassword: passwordForm.newpassword.value,
            newPasswordConfirm: passwordForm.newpasswordconfirm.value,
            token: token,
            passwordForm: passwordForm
        };
        res.setViewData({ passwordData: result });
        this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
            var URLUtils = require('dw/web/URLUtils');
            var Site = require('dw/system/Site');
            var currentCountry = Site.getCurrent().getID();
            var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
            var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
            var resettingCustomer;
            var reqResult = res.viewData.passwordData;
            var updatePwdStatus = (idmPreferences.isIdmEnabled)
                                    ? accountHelpers.updatePasswordIDMAccount(reqResult.token, reqResult.newPasswordConfirm)
                                    : accountHelpers.updatePasswordSFCCAccount(reqResult.token, reqResult.newPasswordConfirm);
            resettingCustomer = updatePwdStatus.resettingCustomer;
            if (updatePwdStatus.error) {
                reqResult.passwordForm.newpassword.valid = false;
                reqResult.passwordForm.newpasswordconfirm.valid = false;
                reqResult.passwordForm.newpasswordconfirm.error = Resource.msg('error.message.resetpassword.invalidformentry', 'forms', null);
            } else if (resettingCustomer) {
                var email = resettingCustomer.profile.email;
                var templateData = {
                    firstName: resettingCustomer.profile.firstName,
                    lastName: resettingCustomer.profile.lastName,
                    url: URLUtils.url('Home-Show', 'login', true),
                    resettingCustomer: resettingCustomer
                };

                var emailData = {
                    to: email,
                    subject: Resource.msg('subject.profile.resetpassword.email', 'login', null),
                    from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
                    type: emailHelpers.emailTypes.passwordChanged
                };

                var emailObj = {
                    templateData: templateData,
                    emailData: emailData
                };
                if (currentCountry === 'EU' || currentCountry === 'UKIE') {
                    require('app_ua_emea/cartridge/scripts/helpers/SFMCEmailHelper').sendPasswordResetConfirmationEmail(resettingCustomer);
                } else {
                    require('*/cartridge/modules/providers').get('Email', emailObj).send();
                }
            }
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                delete res.viewData.passwordData;// eslint-disable-line
            });
            if (reqResult.passwordForm.newpassword.valid) {
                res.json({
                    success: true
                });
            } else {
                res.json({
                    success: false,
                    fields: formErrors.getFormErrors(passwordForm)
                });
            }
        });
    } else {
        res.json({
            success: false,
            fields: formErrors.getFormErrors(passwordForm)
        });
    }
    next();
});

server.replace(
    'SaveProfile',
    server.middleware.https,
    userLoggedIn.validateLoggedIn,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var profileForm = server.forms.getForm('profile');
        var profileObj = profileForm.toObject();
        var phoneNumber = profileObj.customer.phone;
        if (profileObj.customer.dob) {
            var dobArray = profileObj.customer.dob.split('/');
            profileObj.customer.birthDay = dobArray[0];
            profileObj.customer.birthMonth = dobArray[1];
            profileObj.customer.birthYear = dobArray[2];
        }
        profileObj.customer.phone = phoneNumber ? phoneNumber.split(' ').join('').replace(/[^a-z0-9\s]/gi, '').replace(/[_\s]/g, '-') : phoneNumber;
        var viewData = res.getViewData();
        if (!empty(viewData.isValidAreaCode) && !viewData.isValidAreaCode) {
            res.json({
                success: false,
                errorMessgae: Resource.msg('error.message.areaCode', 'forms', null),
                fields: []
            });
            return next();
        }
        if (!empty(viewData.isValidPhoneNumber) && !viewData.isValidPhoneNumber) {
            res.json({
                success: false,
                errorMessgae: Resource.msg('error.message.areaCode', 'forms', null),
                fields: []
            });
            return next();
        }
        var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
        accountHelpers.updateProfileObj(profileForm, profileObj);
        var preferences = accountHelpers.getPreferences(profileObj);
        // Server side validation for validating Profile fields check with emoji and non latin characters
        var profileFieldsValidation = accountHelpers.validateProfileFields(profileObj.customer);
        // Server side validation against xss regex
        var inputFieldsValidation = accountHelpers.validateAccountInputFields(profileObj.customer);
        // form validation
        if (profileObj.customer.email && profileObj.customer.email !== customer.profile.email) {
            profileForm.valid = false;
            profileForm.customer.email.valid = false;
            profileForm.customer.email.error =
                Resource.msg('error.message.mismatch.email', 'forms', null);
        } else if (profileFieldsValidation.error) {
            profileForm.valid = false;
            if (profileFieldsValidation.profileFieldsError.firstname) {
                profileForm.customer.firstname.valid = false;
                profileForm.customer.firstname.error = profileFieldsValidation.profileFieldsError.firstname;
            }
            if (profileFieldsValidation.profileFieldsError.lastname) {
                profileForm.customer.lastname.valid = false;
                profileForm.customer.lastname.error = profileFieldsValidation.profileFieldsError.lastname;
            }
        } else if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
            profileForm.valid = false;
            accountHelpers.inputValidationField(inputFieldsValidation, profileForm);
        } else {
            profileForm.valid = true;
        }
        var saveProfile = false;
        var newPasswords = profileForm.login.newpasswords;
        if (!empty(profileObj.customer.newemail) && !empty(profileObj.customer.newemailconfirm)) {
            if (!profileObj.login.password) {
                profileForm.valid = false;
                profileForm.login.password.valid = false;
                profileForm.login.password.error = Resource.msg('error.message.login.password', 'forms', null);
            }
            if (profileObj.customer.newemail !== profileObj.customer.newemailconfirm) {
                profileForm.valid = false;
                profileForm.customer.newemail.valid = false;
                profileForm.customer.newemailconfirm.valid = false;
                profileForm.customer.newemail.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
                profileForm.customer.newemailconfirm.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
            }
        } else if (!empty(newPasswords.newpassword.value) && !empty(newPasswords.newpasswordconfirm.value)) {
            profileObj.login.newPassword = newPasswords.newpassword.value;
            if (!profileObj.login.password) {
                profileForm.valid = false;
                profileForm.login.password.valid = false;
                profileForm.login.password.error = Resource.msg('error.message.login.password', 'forms', null);
            }
            if (newPasswords.newpassword.value !== newPasswords.newpasswordconfirm.value) {
                profileForm.valid = false;
                newPasswords.newpassword.valid = false;
                newPasswords.newpasswordconfirm.valid = false;
                newPasswords.newpasswordconfirm.error = Resource.msg('error.message.currentpasswordnomatch.field', 'forms', null);
                newPasswords.newpassword.error = Resource.msg('error.message.currentpasswordnomatch.field', 'forms', null);
            }
        } else {
            saveProfile = true;
        }
        // IDM Update Profile
        var updateProfileObject;
        var externalProfiles = customer.externalProfiles;
        var idmProfile = false;
        for (var profile in externalProfiles) { // eslint-disable-line
            var authenticationProviderID = externalProfiles[profile].authenticationProviderID;
            if (authenticationProviderID === idmPreferences.oauthProviderId) {
                idmProfile = true;
            }
        }
        if (idmPreferences.isIdmEnabled && profileForm.valid && idmProfile) {
            updateProfileObject = idmHelper.updateUser(profileObj, customer, saveProfile);
        }
        var result = {
            firstName: profileObj.customer.firstname,
            lastName: profileObj.customer.lastname,
            phone: profileObj.customer.phone,
            email: profileObj.customer.email,
            password: profileObj.login.password,
            gender: profileObj.customer.gender,
            zipCode: profileObj.customer.postalCode,
            birthDay: profileObj.customer.birthDay,
            birthMonth: profileObj.customer.birthMonth,
            birthYear: profileObj.customer.birthYear,
            preferences: JSON.stringify(preferences),
            profileForm: profileObj
        };
        if (profileForm.valid) {
            res.setViewData(result);
            this.on('route:BeforeComplete', function (req, res) { // eslint-disable-line no-shadow
                if (idmPreferences.isIdmEnabled) {
                    if (updateProfileObject && updateProfileObject.updated) {
                        idmHelper.updateProfile(res, customer, updateProfileObject.profieObject);
                        res.json({
                            success: true,
                            customerEmail: customer.profile.email
                        });
                    } else if (updateProfileObject && updateProfileObject.refreshtokenGenerationError) {
                        res.json({
                            success: false,
                            refreshTokenError: true
                        });
                    } else if (updateProfileObject && !updateProfileObject.updated && !updateProfileObject.passwordError) {
                        profileForm.customer.newemail.valid = false;
                        profileForm.customer.newemailconfirm.valid = false;
                        profileForm.customer.newemail.error = Resource.msg('error.message.profile.updateEmail', 'forms', null);
                        profileForm.customer.newemailconfirm.error = Resource.msg('error.message.profile.updateEmail', 'forms', null);
                        res.json({
                            success: false,
                            fields: formErrors.getFormErrors(profileForm),
                            emailUpdateError: Resource.msg('error.message.profile.updateEmail', 'forms', null)
                        });
                    } else {
                        if (updateProfileObject.passwordError) {
                            profileForm.login.password.valid = false;
                            profileForm.login.password.error = Resource.msg('error.message.current.passwordnomatch', 'forms', null);
                        }
                        res.json({
                            success: false,
                            errorMessage: updateProfileObject.passwordError ? Resource.msg('error.message.current.passwordnomatch', 'forms', null) : Resource.msg('error.message.mismatch.updateprofile', 'forms', null),
                            fields: formErrors.getFormErrors(profileForm)
                        });
                    }
                } else {
                    idmHelper.updateProfile(res, customer, null);
                    res.json({
                        success: true,
                        customerEmail: customer.profile.email
                    });
                }
            });
        } else {
            res.json({
                success: false,
                errorMessage: Resource.msg('error.message.mismatch.email', 'forms', null),
                fields: formErrors.getFormErrors(profileForm)
            });
        }
        return next();
    }
);

server.append('EditProfile', function (req, res, next) {
    var addressHelpers = require('*/cartridge/scripts/helpers/addressHelpers');
    var passwordRequirements = require('*/cartridge/scripts/helpers/accountHelpers').getPasswordRequirements();
    var lastUpdatedDate = addressHelpers.calenderHelper(req);
    var CustomerMgr = require('dw/customer/CustomerMgr');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var newCustomer = (req.querystring && req.querystring.registration && req.querystring.registration === 'submitted') ? true : false;  //eslint-disable-line
    var currentCustomer = req.currentCustomer.raw.profile;
    var customer = CustomerMgr.getCustomerByCustomerNumber(
            req.currentCustomer.profile.customerNo
        );
    var idmAccessToken;
    var refreshtokenGenerationError = false;
    var updateAccessTokenResponse = idmHelper.getNewAccessTokenIfExpired(customer, customer.profile.email);
    if (updateAccessTokenResponse && updateAccessTokenResponse.tokenSuccess) {
        idmHelper.updateTokenOnLogin(customer, updateAccessTokenResponse);
    } else if (updateAccessTokenResponse && updateAccessTokenResponse.refreshtokenGenerationError) {
        // render inline-login screen
        refreshtokenGenerationError = true;
    }
    if (currentCustomer && currentCustomer.custom && 'idmAccessToken' in currentCustomer.custom && !empty(currentCustomer.custom.idmAccessToken) && !refreshtokenGenerationError) {
        idmAccessToken = currentCustomer.custom.idmAccessToken;
    }
    if (idmAccessToken) {
        var customerInfo = idmHelper.customerInfo(idmAccessToken);
        if (customerInfo) {
            idmHelper.updateCurrentCustomerInfo(currentCustomer, customerInfo);
        }
    }
    var accHelpers = require('*/cartridge/scripts/account/accountHelpers');
    var accountModel = accHelpers.getAccountModel(req);
    var viewData = res.getViewData();
    var profileForm = viewData.profileForm;
    if (!empty(profileForm.customer) && 'postalCode' in profileForm.customer) {
        profileForm.customer.postalCode.value = accountModel.profile.zipCode;
    }
    var profilePictureUri = profilePictureUri in currentCustomer.custom && currentCustomer.custom.profilePictureUri ? currentCustomer.custom.profilePictureUri : '';  //eslint-disable-line
    var firstName = currentCustomer.firstName;
    var lastName = currentCustomer.lastName;
    if (profileForm.customer.postalCode && profileForm.customer.postalCode.value) {
        profileForm.customer.postalCode.value = currentCustomer.custom.zipCode;
    }
    if (profileForm.customer.dob && 'dob' in currentCustomer.custom) {
        profileForm.customer.dob.value = currentCustomer.custom.dob || '';
    }
    profileForm.customer.gender.options[currentCustomer.gender.value].selected = true;
    var preferences = currentCustomer.custom.preferences ? JSON.parse(currentCustomer.custom.preferences) : '';
    var genderPreferences = preferences && preferences.genders ? preferences.genders : '';
    var activityPreferences = preferences && preferences.activities ? preferences.activities : '';
    var genders = profileForm.customer.preferences.genders ? profileForm.customer.preferences.genders : '';
    var activities = profileForm.customer.preferences.activities ? profileForm.customer.preferences.activities : '';
    for (var genderPreference = 0; genderPreference < genderPreferences.length; genderPreference++) {
        if (genders[genderPreferences[genderPreference]]) {
            genders[genderPreferences[genderPreference]].checked = true;
        }
    }
    for (var activityPreference = 0; activityPreference < activityPreferences.length; activityPreference++) {
        if (activities[activityPreferences[activityPreference]]) {
            activities[activityPreferences[activityPreference]].checked = true;
        }
    }
    var genderForm = [];
    var activityForm = [];
    Object.keys(genders).forEach(function (gender) {
        if (genders[gender] != null && typeof genders[gender] === 'object') {
            genderForm.push(genders[gender]);
        }
    });
    Object.keys(activities).forEach(function (activity) {
        if (activities[activity] != null && typeof activities[activity] === 'object') {
            activityForm.push(activities[activity]);
        }
    });
    var month = currentCustomer.birthday && !empty(currentCustomer.birthday.getUTCMonth()) ? currentCustomer.birthday.getUTCMonth() + 1 : null;
    if (month && profileForm.customer.birthMonth.options[month]) {
        profileForm.customer.birthMonth.options[month].selected = true;
    }
    var day = currentCustomer.birthday && currentCustomer.birthday.getUTCDate() ? currentCustomer.birthday.getUTCDate() : null;
    if (day && profileForm.customer.birthDay.options[day]) {
        profileForm.customer.birthDay.options[day].selected = true;
    }
    // Server side validation for validating Profile fields check with emoji and non latin characters
    var profileFieldsValidation = accountHelpers.validateProfileFields(currentCustomer);
    viewData.profileFieldsError = profileFieldsValidation.profileFieldsError;
    viewData.firstName = firstName;
    viewData.lastName = lastName;
    viewData.profilePictureUri = profilePictureUri;
    viewData.lastUpdated = lastUpdatedDate;
    viewData.newCustomer = newCustomer;
    viewData.genders = genderForm;
    viewData.activities = activityForm;
    viewData.passwordRules = passwordRequirements;

    var URLUtils = require('dw/web/URLUtils');
    var rememberMe = false;
    var userName = currentCustomer && currentCustomer.email ? currentCustomer.email : '';
    var target = req.querystring.rurl || 1;
    var actionUrl = URLUtils.url('Account-Login', 'rurl', target);
    var createAccountUrl = URLUtils.url('Account-SubmitRegistration', 'rurl', target).relative().toString();
    if (req.currentCustomer.credentials) {
        rememberMe = true;
    }
    viewData.rememberMe = rememberMe;
    viewData.userName = userName;
    viewData.actionUrl = actionUrl;
    viewData.profileForm = profileForm;
    viewData.createAccountUrl = createAccountUrl;

    if (refreshtokenGenerationError) {
        viewData.refreshtokenGenerationError = true;
    }
    res.setViewData(viewData);
    // set page meta-data
    var contentObj = ContentMgr.getContent('my-account-page-meta');
    if (contentObj) {
        pageMetaHelper.setPageMetaData(req.pageMetaData, contentObj);
    }
    next();
}, pageMetaData.computedPageMetaData);

server.prepend('Login', server.middleware.https, csrfProtection.validateAjaxRequest, function (req, res, next) { // eslint-disable-line no-unused-vars
    if (req.querystring && req.querystring.responseErr) {
        res.setStatusCode(req.querystring.responseErr);
        return;
    }
    var Site = require('dw/system/Site');
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var responseJSON = {
        error: [Resource.msg('error.message.login.form', 'login', null)]
    };
    // Wishlist prepend code
    var listGuest;
    if (req.currentCustomer.raw) {
        listGuest = productListHelper.getList(req.currentCustomer.raw, { type: 10 });
    }

    // Server side validation against xss regex
    var inputFieldsValidation = accountHelpers.validateLoginInputFields(req.form);
    if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
        res.json({
            success: false,
            errorMessage: inputFieldsValidation.genericErrorMessage,
            xssError: true
        });
    } else if (idmPreferences.isIdmEnabled) {
        var AuthenticationStatus = require('dw/customer/AuthenticationStatus');
        var email = req.form.loginEmail;
        const PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var password = req.form.loginPassword;
        var rememberMe = req.form.loginRememberMe ? (!!req.form.loginRememberMe) : false;
        var authenticationResult = idmHelper.authenticateCustomer(email, password);
        if (authenticationResult.tokenSuccess && authenticationResult.accessToken) {
            const customerInfo = idmHelper.customerInfo(authenticationResult.accessToken);
            if (!empty(customerInfo) && 'sub' in customerInfo && !empty(customerInfo.sub) && PreferencesUtil.getValue('isLoyaltyEnable')) {
                const customerLoyaltyInfo = idmHelper.customerLoyaltyInfo(authenticationResult.accessToken, customerInfo.sub);
                if (!empty(customerLoyaltyInfo)) {
                    customerInfo.loyaltyID = customerLoyaltyInfo.loyaltyID;
                    customerInfo.loyaltyStatus = customerLoyaltyInfo.loyaltyStatus;
                    customerInfo.loyaltyStatusDate = customerLoyaltyInfo.loyaltyStatusDate;
                }
            }
            if (!empty(customerInfo)) {
                // Customer authenticated successfully
                authenticationResult = {
                    status: AuthenticationStatus.AUTH_OK,
                    externalProfile: customerInfo,
                    accessToken: authenticationResult.accessToken,
                    refreshToken: authenticationResult.refreshToken,
                    expiresIn: authenticationResult.expiresIn
                };
            }
        }
        if (authenticationResult.status !== AuthenticationStatus.AUTH_OK) {
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

            // Handling for force password reset.
            if (authenticationResult.status === 'ERROR_PASSWORD_RESET_REQUIRED') {
                accountHelpers.passwordResetIDMAccount(email);
            }

            responseJSON = {
                error: [errorMessage],
                error_code: authenticationResult.status
            };
        } else {
            var BasketMgr = require('dw/order/BasketMgr');
            var basket = BasketMgr.getCurrentBasket();
            var shippingAddress = null;
            var guestUserEnteredShippingAddress = null;
            var defaultShipment = basket && basket.defaultShipment ? basket.defaultShipment.shippingAddress : null;
            // Store commercial pick up shipping address
            if (basket && basket.custom && basket.custom.isCommercialPickup) {
                shippingAddress = defaultShipment;
            } else {
                guestUserEnteredShippingAddress = defaultShipment;
            }
            var suburb;
            if (basket && basket.defaultShipment.shippingAddress && 'suburb' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.suburb) {
                suburb = basket.defaultShipment.shippingAddress.custom.suburb;
            }
            var district;
            if (basket && basket.defaultShipment.shippingAddress && 'district' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.district) {
                district = basket.defaultShipment.shippingAddress.custom.district;
            }
            var businessName;
            if (basket && basket.defaultShipment.shippingAddress && 'businessName' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.businessName) {
                businessName = basket.defaultShipment.shippingAddress.custom.businessName;
            }
            var exteriorNumber;
            if (basket && basket.defaultShipment.shippingAddress && 'exteriorNumber' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.exteriorNumber) {
                exteriorNumber = basket.defaultShipment.shippingAddress.custom.exteriorNumber;
            }
            var interiorNumber;
            if (basket && basket.defaultShipment.shippingAddress && 'interiorNumber' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.interiorNumber) {
                interiorNumber = basket.defaultShipment.shippingAddress.custom.interiorNumber;
            }
            var additionalInformation;
            if (basket && basket.defaultShipment.shippingAddress && 'additionalInformation' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.additionalInformation) {
                additionalInformation = basket.defaultShipment.shippingAddress.custom.additionalInformation;
            }
            var colony;
            if (basket && basket.defaultShipment.shippingAddress && 'colony' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.colony) {
                colony = basket.defaultShipment.shippingAddress.custom.colony;
            }
            var dependentLocality;
            if (basket && basket.defaultShipment.shippingAddress && 'dependentLocality' in basket.defaultShipment.shippingAddress.custom && basket.defaultShipment.shippingAddress.custom.dependentLocality) {
                dependentLocality = basket.defaultShipment.shippingAddress.custom.dependentLocality;
            }
            var authenticatedCustomer = idmHelper.loginCustomer(authenticationResult.externalProfile, rememberMe);
            idmHelper.updateTokenOnLogin(authenticatedCustomer, authenticationResult);
            var Transaction = require('dw/system/Transaction');

            Transaction.wrap(function () {
                basket = BasketMgr.getCurrentBasket();
                if (basket && basket.productLineItems.length === 0 && basket.custom && basket.custom.isCommercialPickup) {
                    basket.custom.isCommercialPickup = false;
                }
                if (basket && basket.custom && basket.custom.isCommercialPickup && !basket.defaultShipment.shippingAddress && shippingAddress) {
                    // Copy commercial pick up address to default shipment.
                    if (basket.defaultShipment.shippingAddress === null) {
                        basket.defaultShipment.createShippingAddress();
                        // Fill shipping address with commercial pick up data
                        basket.defaultShipment.shippingAddress.setFirstName(shippingAddress.firstName);
                        basket.defaultShipment.shippingAddress.setLastName(shippingAddress.lastName);
                        basket.defaultShipment.shippingAddress.setAddress1(shippingAddress.address1);
                        basket.defaultShipment.shippingAddress.setAddress2(shippingAddress.address2);
                        basket.defaultShipment.shippingAddress.setCity(shippingAddress.city);
                        basket.defaultShipment.shippingAddress.setPostalCode(shippingAddress.postalCode);
                        basket.defaultShipment.shippingAddress.setStateCode(shippingAddress.stateCode);
                        var countryCode = shippingAddress.countryCode.value ? shippingAddress.countryCode.value : shippingAddress.countryCode;
                        basket.defaultShipment.shippingAddress.setCountryCode(countryCode);
                    }
                }
                // Intermediate login - Copies a guest User shipping Address to registered user Shipment as its Shipping Address
                if (basket && !basket.custom.isCommercialPickup && guestUserEnteredShippingAddress) {
                    if (basket.defaultShipment.shippingAddress === null) {
                        var shipment = basket.defaultShipment;
                        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
                        // Fill shipping address with Entered address to shipping and billing
                        basket.defaultShipment.createShippingAddress();
                        var billingAddress = basket.billingAddress;
                        if (!billingAddress) {
                            billingAddress = basket.createBillingAddress();
                        }
                        if (!empty(suburb)) {
                            basket.defaultShipment.shippingAddress.custom.suburb = suburb;
                            billingAddress.custom.suburb = suburb;
                        }
                        if (!empty(district)) {
                            basket.defaultShipment.shippingAddress.custom.district = district;
                            billingAddress.custom.district = district;
                        }
                        if (!empty(businessName)) {
                            basket.defaultShipment.shippingAddress.custom.businessName = businessName;
                            billingAddress.custom.businessName = businessName;
                        }
                        if (!empty(exteriorNumber)) {
                            basket.defaultShipment.shippingAddress.custom.exteriorNumber = exteriorNumber;
                            billingAddress.custom.exteriorNumber = exteriorNumber;
                        }
                        if (!empty(interiorNumber)) {
                            basket.defaultShipment.shippingAddress.custom.interiorNumber = interiorNumber;
                            billingAddress.custom.interiorNumber = interiorNumber;
                        }
                        if (!empty(additionalInformation)) {
                            basket.defaultShipment.shippingAddress.custom.additionalInformation = additionalInformation;
                            billingAddress.custom.additionalInformation = additionalInformation;
                        }
                        if (!empty(colony)) {
                            basket.defaultShipment.shippingAddress.custom.colony = colony;
                            billingAddress.custom.colony = colony;
                        }
                        if (!empty(dependentLocality)) {
                            basket.defaultShipment.shippingAddress.custom.dependentLocality = dependentLocality;
                            billingAddress.custom.dependentLocality = dependentLocality;
                        }
                        COHelpers.copyCustomerAddressToShipment(guestUserEnteredShippingAddress, shipment);
                        COHelpers.copyCustomerAddressToBilling(guestUserEnteredShippingAddress);
                    }
                }
            });

            if (!empty(authenticatedCustomer)) {
                var customerNo = authenticatedCustomer && authenticatedCustomer.profile && authenticatedCustomer.profile.customerNo;
                var instorePickupStoreHelpers = require('*/cartridge/scripts/helpers/instorePickupStoreHelpers');
                var isEmployee = !empty(authenticatedCustomer.profile) && 'isEmployee' in authenticatedCustomer.profile.custom && authenticatedCustomer.profile.custom.isEmployee;
                var isVIP = Site.getCurrent().getCustomPreferenceValue('enableVIPCheckoutExperience') && !empty(authenticatedCustomer.profile) && 'vipAccountId' in authenticatedCustomer.profile.custom && !empty(authenticatedCustomer.profile.custom.vipAccountId);
                var basketShipments = BasketMgr.getCurrentBasket() ? BasketMgr.getCurrentBasket().shipments : [];
                if (instorePickupStoreHelpers.basketHasInStorePickUpShipment(basketShipments)) {
                    if (!empty(authenticatedCustomer.profile) && isVIP) {
                        instorePickupStoreHelpers.updateToShipToAddressShipment(BasketMgr.getCurrentOrNewBasket(), req);
                    } else {
                        instorePickupStoreHelpers.setInStorePickUpShippingAddress(BasketMgr.getCurrentOrNewBasket());
                    }
                }
                var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
                if (basket) {
                    if (isEmployee || isVIP) {
                        Transaction.wrap(function () {
                            cartHelper.removeCouponLineItems(basket, isEmployee, isVIP);

                            // Remove IDME Verified Status
                            if (session.custom.idmeVerified) {
                                var IDMEHelper = require('*/cartridge/scripts/util/IDMEHelper');
                                IDMEHelper.removeVerifiedStatus();
                            }
                        });
                    }
                    // Remove store info from basket as BOPIS is not available for VIP users
                    if (isVIP) {
                        cartHelper.removeStoreInfoFromBasket(basket);
                    }
                }
                res.setViewData({
                    authenticatedCustomer: authenticatedCustomer
                });

                // Server side validation for validating Profile fields check with emoji and non latin characters
                var profileFieldsValidation = accountHelpers.validateProfileFields(authenticatedCustomer.profile);
                if (req.querystring.rurl === '4' && profileFieldsValidation.error) {
                    profileFieldsValidation.error = false;
                }
                var returnUrl = req.form.returnUrl || null;
                responseJSON = {
                    success: true,
                    customerNo: customerNo,
                    shouldRedirect: !Site.current.getCustomPreferenceValue('remainLoggedCustomersOnCurrentPage'),
                    returnUrl: returnUrl,
                    redirectUrl: accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, profileFieldsValidation.error), // eslint-disable-line spellcheck/spell-checker
                    isEmployee: isEmployee,
                    isVIP: isVIP,
                    errorInProfileValues: profileFieldsValidation.error
                };
                req.session.privacyCache.set('remember_me', rememberMe);
                req.session.privacyCache.set('args', null);
                req.session.privacyCache.set('loggedInWithFaceBook', false);

                if (req.form.pageRef !== 'checkoutPage') {
                    const storedBasket = BasketMgr.getStoredBasket();
                    Transaction.wrap(function () {
                        cartHelper.mergeBaskets(basket, storedBasket, req);
                    });
                }
            }
        }
        if (req.querystring && req.querystring.refreshTokenAjax) {
            var csrfTokGen = require('dw/web/CSRFProtection');
            responseJSON.csrfToken = { tokenName: csrfTokGen.getTokenName(), token: csrfTokGen.generateToken() };
        }

        // Early Access Product
        if (req.querystring.earlyAccessPid) {
            var ProductMgr = require('dw/catalog/ProductMgr');
            var HookMgr = require('dw/system/HookMgr');
            var productId = req.querystring.earlyAccessPid;
            var prod = ProductMgr.getProduct(productId);
            if (HookMgr.hasHook('app.earlyAccess.isEarlyAccessCustomer')) {
                var productEarlyAccess = HookMgr.callHook('app.earlyAccess.isEarlyAccessCustomer', 'isEarlyAccessCustomer', prod);
                res.setViewData({
                    earlyAccess: productEarlyAccess
                });
            }
        }

        // Wislist append code
        var viewData = res.getViewData();
        if (viewData.authenticatedCustomer) {
            var listLoggedIn = productListHelper.getCurrentOrNewList(viewData.authenticatedCustomer, { type: TYPE_WISH_LIST });
            productListHelper.mergelists(listLoggedIn, listGuest, req, { type: TYPE_WISH_LIST });
        }

        res.json(responseJSON);
        this.done(req, res);
        return;
    }
    // Handle the request with parent controller if IDM is not enabled
    next();
});

server.replace(
    'SubmitRegistration',
    server.middleware.https,
    csrfProtection.validateAjaxRequest,
    function (req, res, next) {
        // Wishlist prepend code
        var viewData = res.getViewData();
        var list = productListHelper.getList(req.currentCustomer.raw, { type: TYPE_WISH_LIST });
        viewData.list = list;
        res.setViewData(viewData);
        // Business logic
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var registrationForm = server.forms.getForm('profile');
        // setting variables for the BeforeComplete function
        var registrationFormObj = {
            email: registrationForm.customer.email.value,
            password: registrationForm.login.password.value,
            addToEmailList: registrationForm.customer.addtoemaillist.value,
            validForm: registrationForm.valid,
            form: registrationForm
        };
       // Server side validation against xss regex
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var passwordRequirements = accountHelpers.getPasswordRequirements();
        var Site = require('dw/system/Site');
        var inputFieldsValidation = accountHelpers.validateLoginInputFields(registrationFormObj);
        // form validation
        if (!idmPreferences.isIdmEnabled && !CustomerMgr.isAcceptablePassword(registrationForm.login.password.value)) {
            registrationForm.login.password.valid = false;
            registrationForm.login.password.valid = false;
            registrationForm.login.password.error = passwordRequirements.errorMsg;
            registrationForm.valid = false;
        } else if (inputFieldsValidation.error && (Object.keys(inputFieldsValidation.customerAccountErrors).length > 0)) {
            registrationForm.valid = false;
            registrationForm.customer.email.valid = false;
            registrationForm.customer.email.error = inputFieldsValidation.customerAccountErrors.email;
        }

        if (registrationForm.valid) {
            res.setViewData({ registerForm: registrationFormObj });
            // Business logic
            registrationForm = res.getViewData().registerForm;
            var authenticatedCustomer = (idmPreferences.isIdmEnabled)
                                        ? accountHelpers.createIDMAccount(registrationForm.email, registrationForm.password)
                                        : accountHelpers.createSFCCAccount(registrationForm.email, registrationForm.password);
            if (authenticatedCustomer.authCustomer) {
                if (registrationForm.addToEmailList) {
                    require('*/cartridge/modules/providers').get('Newsletter', {
                        email: registrationForm.email
                    }).subscribe();
                }
                var customerNo = authenticatedCustomer.authCustomer && authenticatedCustomer.authCustomer.profile && authenticatedCustomer.authCustomer.profile.customerNo;
                res.setViewData({ authenticatedCustomer: authenticatedCustomer.authCustomer });
                session.privacy.registeredURL = 'Account-SubmitRegistration';
                var shouldRedirectUrl = currentSite.getCustomPreferenceValue('registrationPageRedirectURL') ? currentSite.getCustomPreferenceValue('registrationPageRedirectURL') : accountHelpers.getLoginRedirectURL(req.querystring.rurl, req.session.privacyCache, true);
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
                var listLoggedIn = productListHelper.getCurrentOrNewList(viewData.authenticatedCustomer, { type: TYPE_WISH_LIST });
                productListHelper.mergelists(listLoggedIn, listGuest, req, { type: TYPE_WISH_LIST });
            }
            // Removing addition data from response
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                delete res.viewData.registerForm; // eslint-disable-line
                delete res.viewData.list; // eslint-disable-line
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

server.replace('PasswordResetDialogForm', server.middleware.https, function (req, res, next) {
    var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
    var email = req.form.loginEmail;
    var passwordRestObj = (idmPreferences.isIdmEnabled)
                            ? accountHelpers.passwordResetIDMAccount(email)
                            : accountHelpers.passwordResetSFCCAccount(email);
    if (passwordRestObj.status) {
        var URLUtils = require('dw/web/URLUtils');
        var mobile = req.querystring.mobile;
        var receivedMsgHeading = Resource.msg('label.resetpasswordreceived', 'login', null);
        var receivedMsgBody = Resource.msg('msg.requestedpasswordreset', 'login', null);
        var buttonText = Resource.msg('button.text.loginform', 'login', null);
        var returnUrl = URLUtils.url('Login-Show').toString();
        res.json({
            success: true,
            receivedMsgHeading: receivedMsgHeading,
            receivedMsgBody: receivedMsgBody,
            buttonText: buttonText,
            mobile: mobile,
            returnUrl: returnUrl,
            email: email
        });
    } else {
        res.json({
            success: false,
            fields: {
                loginEmail: passwordRestObj.errorMsg || Resource.msg('error.message.passwordreset', 'login', null)
            }
        });
    }
    next();
});

server.replace('SetNewPassword',
    server.middleware.https,
    csrfProtection.generateToken,
    consentTracking.consent,
    function (req, res, next) {
        var Site = require('dw/system/Site');
        var URLUtils = require('dw/web/URLUtils');
        var accountHelpers = require('*/cartridge/scripts/helpers/accountHelpers');
        var CustomerMgr = require('dw/customer/CustomerMgr');
        var passwordRequirements = accountHelpers.getPasswordRequirements();
        var token = req.querystring.token;
        var passwordForm = server.forms.getForm('newPasswords');
        passwordForm.clear();
        var newPasswordObjStatus = false;
        var redirectURL = 'continueShoppingRedirectURL' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('continueShoppingRedirectURL') ? Site.current.getCustomPreferenceValue('continueShoppingRedirectURL') : URLUtils.url('Home-Show');
        var passwordResetCustomer;
        var customerName;

        if (token) {
            newPasswordObjStatus = (idmPreferences.isIdmEnabled)
                                ? accountHelpers.verifyNewPasswordIDMAccount(token)
                                : accountHelpers.verifyNewPasswordSFCCAccount(token);
        }

        if (!newPasswordObjStatus.status) {
            res.redirect(URLUtils.url('Home-Show', 'passwordreset', true));
        } else {
            if (idmPreferences.isIdmEnabled) {
                var tokenResponse = idmHelper.getAccessToken('client_credentials', null);
                if (!empty(tokenResponse) && 'access_token' in tokenResponse && !empty(tokenResponse.access_token)) {
                    var accessToken = tokenResponse.access_token;
                    passwordResetCustomer = idmHelper.customerLoyaltyInfo(accessToken, newPasswordObjStatus.userId);
                }
            } else {
                passwordResetCustomer = CustomerMgr.getCustomerByToken(token);
            }

            if (passwordResetCustomer) {
                if (passwordResetCustomer.profile.firstName && passwordResetCustomer.profile.lastName) {
                    customerName = passwordResetCustomer.profile.firstName + ' ' + passwordResetCustomer.profile.lastName;
                } else if (passwordResetCustomer.profile.firstName) {
                    customerName = passwordResetCustomer.profile.firstName;
                } else if (passwordResetCustomer.profile.lastName) {
                    customerName = passwordResetCustomer.profile.lastName;
                }
            }
            if (passwordResetCustomer) {
                res.render('account/password/newPassword', { passwordForm: passwordForm, token: token, passwordRules: passwordRequirements, redirectURL: redirectURL, customerName: customerName, passwordResetCustomer: passwordResetCustomer });
            } else {
                res.render('account/password/newPassword', { passwordForm: passwordForm, token: token, passwordRules: passwordRequirements, redirectURL: redirectURL, customerName: customerName });
            }
        }
        next();
    }
);

server.replace('PasswordReset', function (req, res, next) {
    res.setStatusCode(410);
    res.render('error/notFound');
    next();
});

server.get('LoggedOutDueToInactivity', function (req, res, next) {
    var URLUtils = require('dw/web/URLUtils');
    res.setViewData({ canonicalUrl: URLUtils.abs('Account-LoggedOutDueToInactivity') });
    res.render('account/logoutDueToInactivity');
    next();
});

server.get('MobileLoginDetails', server.middleware.include, function (req, res, next) {
    res.render('account/mobileLoginDetails', { name:
        req.currentCustomer.profile ? req.currentCustomer.profile.firstName : null
    });
    next();
});

server.append('Header', function (req, res, next) {
    var viewData = res.getViewData();
    viewData.CurrentCustomer = customer;
    if (customer) {
        var customerGroups = customer.getCustomerGroups().toArray();
        var customerGroupIds = [];
        customerGroups.forEach(function (customerGroup) {
            customerGroupIds.push(customerGroup.ID);
        });
        viewData.customerGroupIDs = JSON.stringify(customerGroupIds);
    }

    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
