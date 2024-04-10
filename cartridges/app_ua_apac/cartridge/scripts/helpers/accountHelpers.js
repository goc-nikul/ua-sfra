'use strict';

var base = require('app_ua_core/cartridge/scripts/helpers/accountHelpers');
var Resource = require('dw/web/Resource');
var CustomerMgr = require('dw/customer/CustomerMgr');
var Logger = require('dw/system/Logger');
var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');


/**
 * Combined splitted fields for registration form
 * @param {registrationForm} registrationForm registrationForm
 */
function combinePhoneField(registrationForm) {
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField) {
        // eslint-disable-next-line no-param-reassign
        registrationForm.customer.phone.value = registrationForm.customer.phoneMobile1.value + '-' + registrationForm.customer.phoneMobile2.value + '-' + registrationForm.customer.phoneMobile3.value;
    }
}

/**
 * Combined splitted fields for registration form
 * @param {registrationForm} registrationForm registrationForm
 * @param {boolean} isProfileUpdate - is profile update request
 */
function combineSplitFields(registrationForm, isProfileUpdate) {
    var regForm = registrationForm;
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    if (showSplitEmailField) {
        if (isProfileUpdate) {
            if (!empty(registrationForm.customer.emailaddressName.value) && !empty(registrationForm.customer.emailaddressNameConfirm.value)) {
                regForm.customer.newemail.value = registrationForm.customer.emailaddressName.value + '@' + registrationForm.customer.emailaddressDomain.value;
                regForm.customer.newemailconfirm.value = registrationForm.customer.emailaddressNameConfirm.value + '@' + registrationForm.customer.emailAddressDomainConfirm.value;
            } else {
                regForm.customer.newemail.value = null;
                regForm.customer.newemailconfirm.value = null;
            }
        } else {
            regForm.customer.email.value = registrationForm.customer.emailaddressName.value + '@' + registrationForm.customer.emailaddressDomain.value;
        }
    }

    combinePhoneField(regForm);
}

/**
 * Create an account in SFCC
 * @param {Object} form registration or profile form
 * @param {string} profile customer profile
 */
function saveSplitFields(form, profile) {
    var Transaction = require('dw/system/Transaction');
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    if (showSplitEmailField) {
        Transaction.wrap(function () {
            if (!empty(form.customer.emailaddressName.value) && !empty(form.customer.emailaddressDomain.value)) {
                /* eslint-disable no-param-reassign */
                profile.custom.emailaddressName = form.customer.emailaddressName.value;
                profile.custom.emailaddressDomain = form.customer.emailaddressDomain.value;
                profile.custom.emailaddressDomainSelect = form.customer.emailaddressDomainSelect.value;
                /* eslint-disable no-param-reassign */
            }
        });
    }

    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField) {
        Transaction.wrap(function () {
            /* eslint-disable no-param-reassign */
            profile.custom.phoneMobile1 = form.customer.phoneMobile1.value;
            profile.custom.phoneMobile2 = form.customer.phoneMobile2.value;
            profile.custom.phoneMobile3 = form.customer.phoneMobile3.value;
            /* eslint-disable no-param-reassign */
        });
    }

    // SAVE PROFILE: HANDLE SAVE PHONE TO SUPPORT HYPHENS IN NUMBER
    combinePhoneField(form);
    var profileObj = form.toObject();
    var phoneCleanRegex = new RegExp(Resource.msg('regex.phone.clean', '_preferences', '/[^a-z0-9\s]/gi')); // eslint-disable-line
    var tempPhoneNumber = profileObj.customer.phone;
    var phoneNumberCombined = tempPhoneNumber ? tempPhoneNumber.split(' ') : tempPhoneNumber;
    var phoneNumber = phoneNumberCombined ? phoneNumberCombined.join('') : tempPhoneNumber;
    phoneNumber = phoneNumber ? phoneNumber.replace(phoneCleanRegex, '') : tempPhoneNumber;
    phoneNumber = phoneNumber ? phoneNumber.replace(/[_\s]/g, '-') : tempPhoneNumber;

    if (!empty(phoneNumber)) {
        Transaction.wrap(function () {
            profile.setPhoneHome(phoneNumber);
        });
    }
}

/**
 * Save birth year in SFCC profile
 * @param {Object} form registration or profile form
 * @param {string} profile customer profile
 */
function saveBirthYear(form, profile) {
    var Transaction = require('dw/system/Transaction');
    var ShowBirthYearField = require('*/cartridge/config/preferences').ShowBirthYearField;
    if (ShowBirthYearField) {
        Transaction.wrap(function () {
            if (!empty(form.customer.birthYear) && !empty(form.customer.birthYear.value)) {
                /* eslint-disable no-param-reassign */
                profile.custom.birthYear = form.customer.birthYear.value;
                /* eslint-disable no-param-reassign */
            }
        });
    }
}

/**
 * Create an account in SFCC
 * @param {profileForm} profileForm registrationForm
 * @param {string} profile customer profile
 * @return {Object} profileForm return form object
 */
function loadProfileFields(profileForm, profile) {
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    if (showSplitPhoneMobileField) {
        /* eslint-disable no-param-reassign */
        profileForm.customer.phoneMobile1.value = profile.custom.phoneMobile1;
        profileForm.customer.phoneMobile2.value = profile.custom.phoneMobile2;
        profileForm.customer.phoneMobile3.value = profile.custom.phoneMobile3;
        /* eslint-disable no-param-reassign */
    }

    return profileForm;
}

/**
 * Create an account in SFCC
 * @param {Object} profileObj submitted profile form object
 * @param {profileForm} profileForm customer profile form
 * @param {profile} currentCustomer customer object
 * @returns {Object} profile form with validation
 */
function handleSplitFieldsSaveProfile(profileObj, profileForm) {
    var formValid = true;
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    if (showSplitEmailField) {
        /* eslint-disable no-param-reassign */
        if (!empty(profileObj.customer.emailaddressName) && !empty(profileObj.customer.emailaddressNameConfirm)) {
            if (!empty(profileObj.customer.emailaddressName) && !empty(profileObj.customer.emailaddressNameConfirm)) {
                if (profileObj.customer.emailaddressName !== profileObj.customer.emailaddressNameConfirm) {
                    profileForm.valid = false;
                    formValid = false;
                    profileForm.customer.emailaddressName.valid = false;
                    profileForm.customer.emailaddressNameConfirm.valid = false;
                    profileForm.customer.emailaddressName.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
                    profileForm.customer.emailaddressNameConfirm.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
                }
            }

            if (!empty(profileObj.customer.emailaddressDomain) && !empty(profileObj.customer.emailAddressDomainConfirm)) {
                if (profileObj.customer.emailaddressDomain !== profileObj.customer.emailAddressDomainConfirm) {
                    profileForm.valid = false;
                    formValid = false;
                    profileForm.customer.emailaddressDomain.valid = false;
                    profileForm.customer.emailAddressDomainConfirm.valid = false;
                    profileForm.customer.emailaddressDomain.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
                    profileForm.customer.emailAddressDomainConfirm.error = Resource.msg('error.message.mismatch.email.fields', 'forms', null);
                }
            }
        }
        /* eslint-disable no-param-reassign */
    }

    if (!formValid) return false;

    combineSplitFields(profileForm, true);

    return profileForm;
}


/**
 * Create an account in SFCC
 * @param {string} login loginId
 * @param {string} password password
 * @param {registrationFormObj} registrationFormObj registrationFormObj
 * @returns {Object} returns status and customer
 */
function createSFCCAccount(login, password, registrationFormObj) {
    var Transaction = require('dw/system/Transaction');
    var sitePreferences = require('*/cartridge/config/preferences');
    var showBirthYearField = sitePreferences.ShowBirthYearField;
    var authenticatedCustomer;
    var regFormObj = registrationFormObj;
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
                var profile = customer.getProfile();
                var gender = regFormObj.gender;
                if (gender) {
                    // Case-insensitive match vs. values of Profile.gender system attribute
                    // (Enum of Int type), configurable in Business Manager.
                    var genderAttrDef = profile.describe().getSystemAttributeDefinition('gender');
                    var genderAttrValues = genderAttrDef.getValues();
                    genderAttrValues = genderAttrValues.toArray();
                    var genderAttrMatch = genderAttrValues.filter(function (attrValue) {
                        return (RegExp('^' + gender + '$', 'i').test(attrValue.getDisplayValue()));
                    }).pop();
                    if (genderAttrMatch) {
                        gender = genderAttrMatch.value;
                    }
                }
                if (!gender) {
                    gender = 0;
                }
                newCustomerProfile.setFirstName(regFormObj.firstName);
                newCustomerProfile.setLastName(regFormObj.lastName);
                newCustomerProfile.setPhoneHome(regFormObj.phone);
                newCustomerProfile.setGender(gender);
                if (newCustomerProfile && regFormObj.countryDialingCode) {
                    newCustomerProfile.custom.countryDialingCode = regFormObj.countryDialingCode;
                }
                // Set the CountryCode to customerProfile
                if (newCustomerProfile && regFormObj.registrationCountry) {
                    newCustomerProfile.custom.registrationCountry = regFormObj.registrationCountry;
                }
                var birthday = null;
                if (showBirthYearField) {
                    if (regFormObj.month && regFormObj.month !== '0' && regFormObj.day && regFormObj.day !== '0' && regFormObj.year) {
                        birthday = new Date(regFormObj.year, regFormObj.month - 1, regFormObj.day);
                        newCustomerProfile.custom.birthDay = regFormObj.day.toString();
                        newCustomerProfile.custom.birthMonth = regFormObj.month.toString();
                        newCustomerProfile.custom.birthYear = regFormObj.year.toString();
                    }
                } else if (regFormObj.month && regFormObj.month !== '0' && regFormObj.day && regFormObj.day !== '0') {
                    birthday = new Date('0000', regFormObj.month - 1, regFormObj.day);
                }
                if (!empty(birthday)) {
                    newCustomerProfile.setBirthday(birthday);
                }
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
 * Update the year field on the profile form
 * @param {Object} yearOptions is field of the profile form
 * @returns {Object} updated profile field birthYear
 */
function getBirthYearRange(yearOptions) {
    var Site = require('dw/system/Site');
    var minimumAgeRequired = (Site.getCurrent().getCustomPreferenceValue('minimumAgeRestriction') || 14);
    var currentYear = new Date().getFullYear() - minimumAgeRequired;
    var earliestYear = new Date().getFullYear() - (100 + minimumAgeRequired);
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
 * Function for request body
 * @param {string} email email of user
 *@return {string} email obj
 */
function getUnsubscribeRequestBody(email) {
    var obj = {
        keys: {},
        values: {}
    };
    obj.keys['subscriber Key'] = email;
    obj.values['email Address'] = email;
    return obj;
}

/**
 * Call marketing data event service to unsubscribe emails
 * @param {Object} authToken marketing cloud auth token
 * @returns {Object} service or null
 */
function getDataEventService(authToken) {
    try {
        return LocalServiceRegistry.createService('marketingcloud.rest.dataevents', {
            createRequest: function (svc, message) {
                svc.addHeader('Authorization', 'Bearer ' + authToken.accessToken);
                var svcURL = authToken.restInstanceURL;
                var svcPath = '/hub/v1/dataevents/{key}/rowset';

                if (!empty(message.sendKey)) {
                    svcPath = svcPath.replace('{key}', 'key:' + message.sendKey);
                }

                svc.addHeader('Accept', '*/*');
                svc.addHeader('Content-Type', 'application/json');

                svc.setURL(svcURL + svcPath);

                return JSON.stringify(message.requestBody);
            },
            parseResponse: function (svc, client) {
                return client;
            }
        });
    } catch (e) {
        Logger.error('Error occurred within marketing cloud unsubscribe service:', e.message);
    }
    return null;
}

/**
 * Function for unsubscribing user email from SFMC
 * @param {string} email customer email to unsubscribe
 * @returns {boolean} true if unsubscription was successful
 */
function unsubscribeEmailSFMC(email) {
    var Site = require('dw/system/Site');
    var authToken = require('int_marketing_cloud').authToken();
    var token = authToken.getValidToken();
    var sendKey = Site.current.getCustomPreferenceValue('UnsubscribeNewsletterKey');
    var eventService = getDataEventService(token);
    var arr = [];
    arr.push(getUnsubscribeRequestBody(email));
    var params = {
        requestBody: arr,
        sendKey: sendKey
    };
    var result = eventService.call(params);
    if (!empty(result) && !empty(result.status) && result.status === 'OK') {
        return true;
    }
    return false;
}


module.exports = base;
module.exports.createSFCCAccount = createSFCCAccount;
module.exports.combineSplitFields = combineSplitFields;
module.exports.saveSplitFields = saveSplitFields;
module.exports.saveBirthYear = saveBirthYear;
module.exports.handleSplitFieldsSaveProfile = handleSplitFieldsSaveProfile;
module.exports.loadProfileFields = loadProfileFields;
module.exports.combinePhoneField = combinePhoneField;
module.exports.getBirthYearRange = getBirthYearRange;
module.exports.unsubscribeEmailSFMC = unsubscribeEmailSFMC;
