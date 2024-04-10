'use strict';

// API includes
var Logger = require('dw/system/Logger');
var LOGGER = Logger.getLogger('UAMembersonAPIs', 'UAMembersonAPIs');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');
var URLUtils = require('dw/web/URLUtils');
var Resource = require('dw/web/Resource');

// Memberson Services.
var membersonSvc = require('*/cartridge/scripts/service/membersonService');

// Helper Files
var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

/**
 * to ge the customObject of the authToken
 * @returns {Object} authToken object
 */
function getTokenCustomObject() {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var siteID = Site.getCurrent().getID();
    var tokenObj = CustomObjectMgr.getCustomObject('membersonToken', siteID);
    if (empty(tokenObj)) {
        Transaction.wrap(function () {
            tokenObj = CustomObjectMgr.createCustomObject('membersonToken', siteID);
        });
    }
    return tokenObj;
}

/**
 * function to create the AuthToken
 * @param {Object} tokenObj authToken object from the cutomObj
 * @returns {string} return the authtoken
 */
function generateAuthToken(tokenObj) {
    // Service call for the authToken Memberson
    var membersonCRMUser = PreferencesUtil.getValue('membersonCRMUser');
    var membersonCRMPassword = PreferencesUtil.getValue('membersonCRMPassword');
    var membersonEndPointService = membersonSvc.getMembersonAPI();

    var requestData = {
        endpoint: 'api/user/authenticate',
        requestMethod: 'POST',
        requestBody: null
    };
    requestData.requestBody = JSON.stringify({
        UserName: membersonCRMUser,
        Password: membersonCRMPassword
    });
    var svcRes = membersonEndPointService.call(requestData);
    if (svcRes.ok) {
        // eslint-disable-next-line no-useless-escape
        var token = svcRes.object.text.replace(/[\"\'\s]/g, '');
        Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
            tokenObj.custom.authToken = token;
        });
        return token;
    }
    return null;
}


/**
 * Function to get the authToken for the Authorization.
 * @param {string} createNewToken authToken for the MembersonAPI
 * @returns {Object} return the token
 */
function getAuthToken(createNewToken) {
    try {
        var tokenObj = getTokenCustomObject();
        var token = tokenObj.custom.authToken;
        if (createNewToken || empty(token)) {
            token = generateAuthToken(tokenObj);
        }
        return token;
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js getAuthToken ' + msg + e.stack);
    }
    return null;
}


/**
 * Call the memberson Service
 * @param {Object} reqPayload payload request
 * @returns {Object} response from the membersonAPI
 */
function callMembersonAPI(reqPayload) {
    var result = null;
    var membersonEndPointService = membersonSvc.getMembersonAPI();

    try {
        reqPayload.token = getAuthToken(); //eslint-disable-line
        result = membersonEndPointService.call(reqPayload);
        if (!result.ok && (result.error === 401 || JSON.parse(result.errorMessage).ErrorCode === '2')) {
            reqPayload.token = getAuthToken(true); //eslint-disable-line
            result = membersonEndPointService.call(reqPayload);
        }
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js callMembersonAPI ' + msg + e.stack);
    }
    return result;
}

/**
 * Get the country config for the given country
 * @param {string} countryCode current countrycode of the site
 * @returns {Object} retrun the object for the site membersonconfigs
 */
function getCountryConfig(countryCode) {
    var responseObject = {
        countryCode: countryCode,
        membersonEnabled: false
    };
    try {
        var membersonCountryConfigs = PreferencesUtil.getJsonValue('membersonCountryConfigs');
        if (!empty(membersonCountryConfigs) && membersonCountryConfigs.length > 0) {
            var membersonCountry = membersonCountryConfigs.find(function (countryConfig) {
                return countryConfig.countryCode.equals(countryCode);
            });
            if (!empty(membersonCountry)) {
                responseObject.membersonEnabled = membersonCountry.enabled;
                responseObject.ecommLocation = membersonCountry.ecommLocation;
                responseObject.ageOfConsent = membersonCountry.ageOfConsent;
                responseObject.welcomeEmailTemplate = membersonCountry.welcomeEmailTemplate;

                if (Object.prototype.hasOwnProperty.call(membersonCountry, 'uaRewardsRedirectUrl') && !empty(membersonCountry.uaRewardsRedirectUrl)) {
                    var redirectUrl = membersonCountry.uaRewardsRedirectUrl[request.getLocale()]; // eslint-disable-line no-undef
                    responseObject.uaRewardsRedirect = redirectUrl || null;
                }

                if (Object.prototype.hasOwnProperty.call(membersonCountry, 'creativeversion') && !empty(membersonCountry.creativeversion)) {
                    responseObject.creativeversion = membersonCountry.creativeversion || null;
                }
            }
        }
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHooks.js getMembersonCountryConfigs ' + msg + e.stack);
    }
    return responseObject;
}

/**
 * function to return the AddressObject for the create profile in memberson
 * @param {Object} countryConfig country
 * @returns {Object} return the addressObj for the createProfile in Memberson
 */
function getAddressInfo(countryConfig) {
    var addresses = [];
    addresses.push({
        AddressType: 'HOME',
        CountryCode: countryConfig.countryCode
    });
    return addresses;
}

/**
 * Frunction to get the contactPref for the create profile in the Memberson
 * @param {Object} registrationFormObj registration form object to get the user Info
 * @returns {Object} return the contactPref obj for the create profile
 */
function getContactPref(registrationFormObj) {
    var smsOptIn = registrationFormObj.addToEmailList;
    return [{
        Code: 'EMAIL',
        DisplayText: 'EMAIL',
        Value: smsOptIn ? 1 : 2,
        Selected: smsOptIn
    },
    {
        Code: 'PHONE',
        DisplayText: 'PHONE',
        Value: smsOptIn ? 1 : 2,
        Selected: smsOptIn
    },
    {
        Code: 'SMS',
        DisplayText: 'SMS',
        Value: smsOptIn ? 1 : 2,
        Selected: false
    }];
}

/**
 * Function to get the properties for the consent on submitRegistration
 * @param {string} consentValue consentSatus for the profile
 * @returns {Object} return the consentStatus object for the profile
 */
function setConsentProperties(consentValue) {
    var StringUtils = require('dw/util/StringUtils');
    var Calendar = require('dw/util/Calendar');
    var formattedConsentDate = new Calendar();
    formattedConsentDate.setTimeZone(Site.getCurrent().getTimezone());
    var consentDate = StringUtils.formatCalendar(formattedConsentDate, 'dd/MM/YYYY');
    return [{
        Name: 'TnC_Consent',
        Value: consentValue
    },
    {
        Name: 'TnC_Consent_Date',
        Value: consentDate
    }];
}

/**
 * Function to create the payload for the create Profile
 *
 * @param {Object} regFormObj - registration form object
 * @param {Object} countryConfig - contryconfig form obj for the site
 * @returns {Object} - return the requestPayload for the create Profile
 */
function generateCreateProfilePayload(regFormObj, countryConfig) {
    var registrationFormObj = regFormObj;
    var birthDate = new Date(registrationFormObj.year, registrationFormObj.month - 1, registrationFormObj.day).toISOString();
    // Generate Request Payload.
    var reqPayLoad = {
        Profile: {
            FirstName: registrationFormObj.firstName,
            LastName: registrationFormObj.lastName,
            DOB: birthDate || null,
            DefaultAddress: 'Home',
            Mobile: registrationFormObj.phone,
            MobileCountryCode: registrationFormObj.countryDialingCode.replace('+', ''),
            Email: registrationFormObj.email,
            GenderCode: '',
            NationalityCode: countryConfig.countryCode,
            JoinLocation: countryConfig.ecommLocation,
            Addresses: getAddressInfo(countryConfig),
            ContactPreferences: getContactPref(registrationFormObj),
            Properties: setConsentProperties('YES')
        },
        Membership: {
            MemberType: 'UA Rewards',
            LocationCode: countryConfig.ecommLocation,
            Date: new Date()
        }
    };
    if (registrationFormObj.gender === '1') {
        reqPayLoad.Profile.GenderCode = 'M';
    } else if (registrationFormObj.gender === '2') {
        reqPayLoad.Profile.GenderCode = 'F';
    }
    return reqPayLoad;
}

/**
 * Function to set email template id according to preffered country and their locales.
 * @return {string} - returns template id.
 */
function getEmailTemplateId() {
    var HookMgr = require('dw/system/HookMgr');
    var countryConfig = {};
    var emailTemplateId;

    if (HookMgr.hasHook('app.memberson.CountryConfig')) {
        var countryCode = session.custom.currentCountry || Locale.getLocale(request.getLocale()).country; // eslint-disable-line
        countryConfig = HookMgr.callHook('app.memberson.CountryConfig', 'getMembersonCountryConfig', countryCode);
    }

    if (countryConfig.membersonEnabled && !empty(countryConfig.welcomeEmailTemplate)) {
        var emailTemplateConfig = countryConfig.welcomeEmailTemplate;
        if (Object.hasOwnProperty.call(emailTemplateConfig, request.getLocale())) {
            emailTemplateId = countryConfig.welcomeEmailTemplate[request.getLocale()];
        }
    } else if (countryConfig.membersonEnabled && !empty(PreferencesUtil.getValue('membersonWelcomeEmailTemplate'))) {
        // Get the email template id from the site preference;
        emailTemplateId = PreferencesUtil.getValue('membersonWelcomeEmailTemplate');
    } else {
        emailTemplateId = '';
    }

    return emailTemplateId;
}

/**
 * Function to call the set otp API
 * @param {string} loyaltyID - memberson customer no
 * @returns {Object} - return the  result of the api
 */
function callSetOtpApi(loyaltyID) {
    var setOtpRes;
    try {
        // Service call for the Set OTP API of Memberson
        var requestData = {
            endpoint: 'api/profile/' + loyaltyID + '/password/WebPortal/set-otp',
            requestMethod: 'POST',
            requestBody: null
        };

        requestData.requestBody = JSON.stringify({});
        setOtpRes = callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js callSetOtpApi ERROR: ' + msg);
    }

    return setOtpRes;
}

/**
 * function to create request payload for the sendEmail API
 * @param {string} tempOtp - temp OTP
 * @param {Object} regObj - customer reg obj
 * @returns {Object} - return the request payload
 */
function sendEmailRequestPayload(tempOtp, regObj) {
    return {
        Address: regObj.email,
        Subject: Resource.msg('memberson.welcomeemail.Subject', 'membersonGlobal', null),
        SenderId: Resource.msg('memberson.welcomeemail.sender', 'membersonGlobal', null),
        TemplateId: getEmailTemplateId(),
        Content: '',
        Data: [
            {
                Key: 'OTP',
                Value: tempOtp
            },
            {
                Key: 'FirstName',
                Value: regObj.firstName
            },
            {
                Key: 'LastName',
                Value: regObj.lastName
            },
            {
                Key: 'Email',
                Value: regObj.email
            }
        ],
        IncludeSignature: true,
        IncludeBrowserView: true
    };
}

/**
 * function to call the sendEmail API
 * @param {string} memberNo - memberson customer no
 * @param {string} otp - temp otp
 * @param {Object} regObj - customer details
 * @returns {Object} - return response of sendEMail API
 */
function callSendEmailAPI(memberNo, otp, regObj) {
    var sendEmailRes;
    try {
        // Service call for the send email API of Memberson
        var requestData = {
            endpoint: 'api/member/' + memberNo + '/send-email',
            requestMethod: 'POST',
            requestBody: null
        };

        // create the request Payload for sendMail api
        var sendEmailReqPayload = sendEmailRequestPayload(otp, regObj);
        requestData.requestBody = JSON.stringify(sendEmailReqPayload);
        sendEmailRes = callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js callSendEmailAPI ERROR: ' + msg);
    }

    return sendEmailRes;
}

/**
 * Function to get the membership summary of the customer
 * @param {string} customernumber user phoneNumber
 * @returns {Object} return the customer membershipSummary
 */
function getMembershipSummary(customernumber) {
    var summaryRes;
    try {
        // Service call for the get Membership Summary API of Memberson
        var requestData = {
            endpoint: 'api/profile/' + customernumber + '/summary',
            requestMethod: 'GET',
            requestBody: null
        };

        // Search profile based on EmailAddress
        requestData.requestBody = JSON.stringify({});
        summaryRes = callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js getMembershipSummary ERROR: ' + msg);
    }

    return summaryRes;
}

/**
 * Function to create the profile to Memberson
 * @param {Object} regForm registration form object
 * @param {Object} countryConfig contryconfig form obj for the site
 * @returns {Object} return the resnse of the CreateProfile API call
 */
function createProfile(regForm, countryConfig) {
    // Service call for the create profile API of Memberson
    try {
        var requestData = {
            endpoint: 'api/profile/create-with-membership',
            requestMethod: 'POST',
            requestBody: null
        };

        // Create Profile API
        var requestPayload = generateCreateProfilePayload(regForm, countryConfig);
        requestData.requestBody = JSON.stringify(requestPayload);
        var result = callMembersonAPI(requestData);
        var svcResponse = {};
        if (result.ok) {
            svcResponse = JSON.parse(result.object.text);

            // Call the setOTP API
            var setOtpAPIResponse = callSetOtpApi(svcResponse.Profile.CustomerNumber);
            if (!empty(setOtpAPIResponse) && setOtpAPIResponse.status === 'OK') {
                var otpRes = JSON.parse(setOtpAPIResponse.object.text);
                var otp = otpRes.Password;
                if (!empty(otp)) {
                    var membersonMembershipSummary = getMembershipSummary(svcResponse.Profile.CustomerNumber);
                    if (!empty(membersonMembershipSummary) && membersonMembershipSummary.status === 'OK') {
                        var membershipSummaries = JSON.parse(membersonMembershipSummary.object.text);
                        var memberNo = membershipSummaries.MembershipSummaries[0].MemberNo;
                        if (!empty(memberNo)) {
                            callSendEmailAPI(memberNo, otp, regForm);
                        }
                    }
                }
            }
        } else {
            throw new Error(result.errorMessage);
        }
        return {
            createAccountResponse: svcResponse
        };
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js createProfile ERROR: ' + msg);
    }

    return {
        error: true
    };
}

/**
 * Function to interpret search profile response from memberson
 * @param {Object} emailSearchResponse object respnponse for the emailSearch
 * @param {Object} mobileSearchResponse object respnponse for the mobileSearch
 * @returns {Object} retrun the object for the searchprofiles using phone and email
 */
function handleSearchResponses(emailSearchResponse, mobileSearchResponse) {
    var emailSearchCustomerNo = '';
    var mobileSearchCustomerNo = '';
    var matchingCustomerNos = true;
    var multipleCustomerNos = false;
    var emptyCustomerNos = true;
    var errorMessage = '';
    if (emailSearchResponse.length > 0) {
        emailSearchCustomerNo = emailSearchResponse[0].CustomerNumber;
        emptyCustomerNos = false;
        if (!mobileSearchResponse.length || emailSearchCustomerNo !== mobileSearchResponse[0].CustomerNumber) {
            errorMessage = Resource.msg('memberson.msg.mobile.error', 'membersonGlobal', null);
        }
    }
    if (mobileSearchResponse.length > 0) {
        mobileSearchCustomerNo = mobileSearchResponse[0].CustomerNumber;
        emptyCustomerNos = false;
        if (!emailSearchResponse.length || mobileSearchCustomerNo !== emailSearchResponse[0].CustomerNumber) {
            errorMessage = Resource.msg('memberson.msg.email.error', 'membersonGlobal', null);
        }
    }

    if (emailSearchResponse.length > 1 || mobileSearchResponse.length > 1) {
        multipleCustomerNos = true;
    }
    if ((!empty(emailSearchCustomerNo) || !empty(mobileSearchCustomerNo)) && !emailSearchCustomerNo.equals(mobileSearchCustomerNo)) {
        matchingCustomerNos = false;
    }
    return {
        emptyCustomerNos: emptyCustomerNos,
        emailSearchCustomerNo: emailSearchCustomerNo,
        mobileSearchCustomerNo: mobileSearchCustomerNo,
        matchingCustomerNos: matchingCustomerNos,
        multipleCustomerNos: multipleCustomerNos,
        errorMessage: errorMessage
    };
}

/**
 * Function to simple search profile from the memberson.
 * @param {string} email user EmailID
 * @param {string} mobile user phone Number
 * @param {string} mobileCountryCode countrycode for the phonenumbers
 * @returns {Object} return the object for the searchProfile
 */
function searchProfile(email, mobile, mobileCountryCode) {
    try {
        // Service call for the searchProfile Memberson
        var result = {};
        var emailSearchResponse = null;
        var mobileSearchResponse = null;
        var requestData = {
            endpoint: 'api/profile/search-simple',
            requestMethod: 'POST',
            requestBody: null
        };

        // Search profile based on EmailAddress
        if (!empty(email)) {
            requestData.requestBody = JSON.stringify({
                EmailAddress: email
            });
            result = callMembersonAPI(requestData);
            if (result.ok) {
                emailSearchResponse = JSON.parse(result.object.text);
            } else {
                throw new Error(result.errorMessage);
            }
        } else {
            emailSearchResponse = [];
        }

        // Search profile based on Phonenumber
        if (!empty(mobile)) {
            if (!empty(mobileCountryCode)) {
                requestData.requestBody = JSON.stringify({
                    MobileNumberCountryCode: mobileCountryCode.replace('+', ''),
                    MobileNumber: mobile
                });
            } else {
                requestData.requestBody = JSON.stringify({
                    MobileNumber: mobile
                });
            }
            result = callMembersonAPI(requestData);
            if (result.ok) {
                mobileSearchResponse = JSON.parse(result.object.text);
            } else {
                throw new Error(result.errorMessage);
            }
        } else {
            mobileSearchResponse = [];
        }

        return handleSearchResponses(emailSearchResponse, mobileSearchResponse);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js searchProfile ERROR: ' + msg);
    }

    return {
        error: true
    };
}

/**
 * Function to SET the TnC Consent of the customer
 * @param {string} customernumber user membersonNo
 * @param {string} consentValue consetnValue to set in memberson
 */
function setTnCConsent(customernumber, consentValue) {
    try {
        // Service call for the TncConsent API of Memberson
        var requestData = {
            endpoint: 'api/profile/' + customernumber + '/custom-properties',
            requestMethod: 'PATCH',
            requestBody: null
        };

        // Set TnC Consent
        var setConsentReqPayload = setConsentProperties(consentValue);
        requestData.requestBody = JSON.stringify(setConsentReqPayload);
        callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js setTnCConsent ERROR: ' + msg);
    }
}

/**
 * Function to get the TnC Consent of the customer
 * @param {string} customerNumber user PhoneNo
 * @param {boolean} setConsent consetnStatus value to set
 * @param {string} consentValue consetnStatus value to set
 * @returns {Object} return the object for the viewConsent status API call
 */
function viewTnCConsent(customerNumber, setConsent, consentValue) {
    try {
        // Service call for getting TnC Consent Memberson
        var TnCConsentObjRes;
        var requestData = {
            endpoint: 'api/profile/' + customerNumber + '/custom-property/TnC_Consent',
            requestMethod: 'GET',
            requestBody: null
        };

        TnCConsentObjRes = callMembersonAPI(requestData);

        // If ViewTnCConsent API rsponse is OK and status value is 'NO' then set it to 'YES'
        if (!empty(TnCConsentObjRes) && TnCConsentObjRes.status === 'OK') {
            var consentStatus = JSON.parse(TnCConsentObjRes.object.text);
            if (setConsent) {
                if (empty(consentStatus) || empty(consentStatus.Value) || !consentStatus.Value.equalsIgnoreCase(consentValue)) {
                    setTnCConsent(customerNumber, consentValue);
                }
            }
            return {
                consentStatus: (empty(consentStatus) || empty(consentStatus.Value)) ? 'NO' : consentStatus.Value
            };
        }
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js viewTnCConsent ERROR: ' + msg);
    }

    return {
        error: true
    };
}

/**
 * Function to store the customer details to the customOBJ
 * @param {Object} registrationForm registration form object
 * @returns {Object} return the stored customObj
 */
function storeCustomerRegistration(registrationForm) {
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var UUIDUtils = require('dw/util/UUIDUtils');
    var membersonCustomObj = null;
    try {
        Transaction.wrap(function () {
            var uniqueString = UUIDUtils.createUUID();
            membersonCustomObj = CustomObjectMgr.createCustomObject('membersonCustomerProfile', uniqueString);
            membersonCustomObj.custom.firstName = registrationForm.customer.firstname.value;
            membersonCustomObj.custom.lastName = registrationForm.customer.lastname.value;
            membersonCustomObj.custom.email = registrationForm.customer.email.value;
            membersonCustomObj.custom.mobile = registrationForm.customer.phone.value;
            membersonCustomObj.custom.password = registrationForm.login.password.value;
            membersonCustomObj.custom.birthMonth = registrationForm.customer.birthMonth.value;
            membersonCustomObj.custom.birthYear = registrationForm.customer.birthYear.value;
            membersonCustomObj.custom.ConsentStatus = registrationForm.customer.addtoemaillist.value;
            membersonCustomObj.custom.registerFormObject = JSON.stringify(registrationForm);
            membersonCustomObj.custom.profileObj = JSON.stringify(registrationForm.toObject());
        });
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js storeCustomerRegistration ERROR: ' + msg);
    }

    return membersonCustomObj;
}

/**
 * Function to send the profileValidation Email
 * @param {string} ObjectID customObject ID
 * @param {Object} registrationFormObj registration form Object
 */
function sendProfileValidationEmail(ObjectID, registrationFormObj) {
    // Send Email
    var countryData = request.getLocale().split('_');    // eslint-disable-line no-undef
    var countryConfig = getCountryConfig(countryData[1]);
    var customObjID = ObjectID.toString();
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var templateData = {
        url_link: URLUtils.https('Memberson-ValidateProfile', 'ObjID', customObjID).toString(),
        email_address: registrationFormObj.email,
        firstname: registrationFormObj.firstName,
        lastname: registrationFormObj.lastName,
        emailtype: 'HTML',
        recip_type: 'final',
        email_source: 'LYT01',
        signup_date: new Date(),
        creativeversion: countryConfig.creativeversion,
        segmentcode: ''
    };

    var emailData = {
        to: registrationFormObj.email,
        from: PreferencesUtil.getValue('validationEmailSenderEmail'),
        type: emailHelpers.emailTypes.SAPACEmailValidation
    };

    var emailObj = {
        templateData: templateData,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Function to check if user is eligible for memberson
 * @param {string} customerEmailID - user EmailID
 * @returns {boolean} - retrun the result as boolean
 */
function validateUserForMemberson(customerEmailID) {
    var isEligibleForMemberson = true;
    var regEx = new RegExp(/@underarmour.+\s*$/);
    if (regEx.test(customerEmailID)) {
        isEligibleForMemberson = false;
    }

    return isEligibleForMemberson;
}

/**
 * Function to call the API for the member vouchers
 * @param {string} memberNo - customer's memberNo in memberson
 * @returns {Object} - customer's memberson voucher list
 */
function getMemberVouchers(memberNo) {
    var memberVouchersRes;
    try {
        // Service call for getting Memberson Vouchers
        var requestData = {
            endpoint: 'api/member/' + memberNo + '/vouchers?status=AVAILABLE',
            requestMethod: 'GET',
            requestBody: null
        };

        // Getting Vouchers
        requestData.requestBody = JSON.stringify({});
        memberVouchersRes = callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js getMemberVouchers ERROR: ' + msg);
    }

    return memberVouchersRes;
}

/**
 * Function to call the API for the Utilize member voucher
 * @param {Object} order - object of the current order
 * @param {string} loyaltyVoucherName - voucher name from the memberson
 * @param {string} locationCode - locationCode of the memberson
 * @returns {Object} - return result for the UtilizeAPI
 */
function utilizeMemberVoucher(order, loyaltyVoucherName, locationCode) {
    var utilizeMemberVouchersRes;
    try {
        // Service call for utilizing Memberson vouchers
        var requestData = {
            endpoint: 'api/voucher/' + loyaltyVoucherName + '/utilize?LocationCode=' + locationCode + '&receiptNumber=' + order.orderNo,
            requestMethod: 'POST',
            requestBody: null
        };

        // utilizing voucher
        requestData.requestBody = JSON.stringify({});
        utilizeMemberVouchersRes = callMembersonAPI(requestData);
    } catch (e) {
        var msg = e.message;
        LOGGER.error('membersonHelpers.js utilizeMemberVoucher ERROR: ' + msg);
    }

    return utilizeMemberVouchersRes;
}

/**
 * Function to call the API for the Utilize member voucher
 * @param {Object} order - object of the current order
 * @param {string} loyaltyVoucherName - voucher name from the memberson
 * @returns {Object} - return the result of the UnUtilizeAPI call
 */
function unUtilizeMemberVoucher(order, loyaltyVoucherName) {
    var unUtilizememberVouchersRes;
    if (!empty(loyaltyVoucherName)) {
        try {
            var voucherUnutilized = 0;
            // Service call for unutilizing Memberson vouchers
            var requestData = {
                endpoint: 'api/voucher/cancel-voucher-utilization?voucherNumber=' + loyaltyVoucherName,
                requestMethod: 'POST',
                requestBody: null
            };

            // Unutilizing voucher
            requestData.requestBody = JSON.stringify({});
            unUtilizememberVouchersRes = callMembersonAPI(requestData);
            if (unUtilizememberVouchersRes.ok) {
                voucherUnutilized = 1;
            } else {
                voucherUnutilized = 2;
            }

            Transaction.wrap(function () {
                order.custom['Loyalty-VoucherCancelled'] = voucherUnutilized; //eslint-disable-line
            });
        } catch (e) {
            var msg = e.message;
            LOGGER.error('membersonHelpers.js unUtilizeMemberVoucher ERROR: ' + msg);
        }
    }
    return unUtilizememberVouchersRes;
}

/**
 * Check the age of customer
 * @param {string} month of the bithDate customer
 * @param {string} year of of the bithDate customer
 * @param {Object} countryConfig membersonConfigs for the site
 * @returns {boolean} pass the result of customer is valid
 */
function validateAgeOfCustomer(month, year, countryConfig) {
    // Check if customer's age is 18+
    var endDate = new Date();
    var totalMonths = countryConfig.ageOfConsent * 12;
    var userMonths = ((endDate.getMonth() + 1) - month) + (12 * (endDate.getFullYear() - year));

    return userMonths > totalMonths;
}

/**
 * Function to get the MembersonPromotion
 * @param {Object} promotions - promotion object
 * @returns {Object} - return the object for the memberson promotion if any exist
 */
function getMembersonPromotion(promotions) {
    var promotionsItr = promotions.iterator();
    while (promotionsItr.hasNext()) {
        var promotion = promotionsItr.next();
        if (promotion && promotion.custom['Loyalty-Voucher']) {
            return promotion;
        }
    }
    return null;
}

/**
 * Function to update the user profile for birthYear and registrationCountry
 * @param {string} customerNo - customerNumber from the memberson profile
 * @param {string} profileObj - cusrrent customer profile
 */
function updateProfileAttributes(customerNo, profileObj) {
    if (empty(profileObj.custom.birthYear) || empty(profileObj.custom.registrationCountry)) {
        var membersonMembershipSummary = getMembershipSummary(customerNo);
        if (!empty(membersonMembershipSummary) && membersonMembershipSummary.status === 'OK') {
            var membershipSummary = JSON.parse(membersonMembershipSummary.object.text);
            if (!empty(membershipSummary)) {
                if (empty(profileObj.custom.registrationCountry) && !empty(membershipSummary.NationalityCode)) {
                    Transaction.wrap(function () {
                        profileObj.custom.registrationCountry = membershipSummary.NationalityCode; // eslint-disable-line no-param-reassign
                    });
                }
                if (empty(profileObj.custom.birthYear) && !empty(membershipSummary.DOB)) {
                    var userBirthDate = new Date(membershipSummary.DOB).getFullYear().toFixed();
                    Transaction.wrap(function () {
                        profileObj.custom.birthYear = userBirthDate; // eslint-disable-line no-param-reassign
                    });
                }
            }
        }
    }
}

/* istanbul ignore next */
/**
 * Gets voucher number for current customer against voucher code. Returns the first expiring voucher.
 * @param {string} customerNo Memberson Customer Number
 * @param {string} voucherCode Voucher Code to search
 * @returns {Object} pass the result of vouchers
 */
function getVoucherNumber(customerNo, voucherCode) {
    var membersonMembershipSummary = getMembershipSummary(customerNo);
    var memberNo;
    var memberVouchers;
    var memberVoucherCodes;
    var voucherList = [];
    if (!empty(membersonMembershipSummary) && membersonMembershipSummary.status === 'OK') {
        var membershipSummaries = JSON.parse(membersonMembershipSummary.object.text);
        memberNo = membershipSummaries.MembershipSummaries[0].MemberNo;
        memberVouchers = getMemberVouchers(memberNo);
        if (!empty(memberVouchers) && memberVouchers.status === 'OK') {
            memberVoucherCodes = JSON.parse(memberVouchers.object.text);
            memberVoucherCodes.forEach(function (Vouchers) {
                if (Vouchers.VoucherCode.equalsIgnoreCase(voucherCode)) {
                    voucherList.push(Vouchers);
                }
            });

            if (voucherList.length > 0) {
                var currentDate = new Date();
                voucherList.sort(function (expiryDate1, expiryDate2) {
                    var dateDistance1 = Math.abs(currentDate - new Date(expiryDate1.ExpiryDate));
                    var dateDistance2 = Math.abs(currentDate - new Date(expiryDate2.ExpiryDate));
                    return dateDistance1 - dateDistance2; // sort dateDistance1 before dateDistance2 when the distance is smaller
                });
                return {
                    voucherFound: true,
                    error: false,
                    errorMessage: '',
                    memberNo: memberNo,
                    voucherCode: voucherCode,
                    voucherNumber: voucherList[0].VoucherNumber
                };
            }
            return {
                voucherFound: false,
                error: true,
                errorMessage: Resource.msg('memberson.msg.notexistvoucher.cart', 'membersonGlobal', null)
            };
        }
    }
    return {
        voucherFound: false,
        error: true,
        errorMessage: Resource.msg('memberson.msg.apierror', 'membersonGlobal', null)
    };
}

/* istanbul ignore next */
/**
 * Empty the loyalty voucher name attribute
 * @param {Object} lineItemCtnr order or basket
 */
function emptyLoyaltyVoucherName(lineItemCtnr) {
    Transaction.wrap(function () {
        lineItemCtnr.custom['Loyalty-VoucherName'] = ''; // eslint-disable-line
    });
}

/* istanbul ignore next */
/**
 * function to check if memberson coupon is applied and update custom attribute
 * @param {Object} lineItemCtnr - order or basket
 * @param {Object} currentCustomer - customer profile
 * @returns {boolean} boolean checking whether memberson voucher is applied
 */
function checkIfMembersonCouponApplied(lineItemCtnr, currentCustomer) {
    var CouponMgr = require('dw/campaign/CouponMgr');
    var couponObj;
    var membersonPromotion = null;
    var isLoyaltyCouponInCart = false;
    // Remove the voucherNumber on the cart level if it is not empty
    var couponsIterator = lineItemCtnr.getCouponLineItems().iterator();
    if (!empty(couponsIterator)) {
        while (couponsIterator.hasNext()) {
            // this will loop through all the coupons applied
            var couponLineItem = couponsIterator.next();
            if (couponLineItem.isApplied()) {
                var couponCode = couponLineItem.getCouponCode();
                couponObj = CouponMgr.getCouponByCode(couponCode);
                membersonPromotion = getMembersonPromotion(couponObj.promotions);
                if (!empty(membersonPromotion)) {
                    isLoyaltyCouponInCart = true;
                    if (!empty(currentCustomer) && currentCustomer.authenticated && !empty(currentCustomer.profile)) {
                        var membersonCustomerNo = currentCustomer.profile.custom['Loyalty-ID'];
                        if (!empty(membersonCustomerNo)) {
                            var voucherDetails = getVoucherNumber(membersonCustomerNo, couponCode);
                            if (!voucherDetails.error && voucherDetails.voucherFound) {
                                // Store the voucherNumber on the cart level
                                Transaction.begin();
                                lineItemCtnr.custom['Loyalty-VoucherName'] = voucherDetails.voucherCode + '=' + voucherDetails.voucherNumber; // eslint-disable-line
                                Transaction.commit();

                                return isLoyaltyCouponInCart;
                            }
                        }
                    }
                    if (!empty(lineItemCtnr.custom['Loyalty-VoucherName'])) {
                        // Memberson voucher is applied but either customer or voucher was not found.
                        // Emptying this attribute will fail this order as isLoyaltyCouponInCart is true
                        emptyLoyaltyVoucherName(lineItemCtnr);
                    }
                }
            }
        }
    }
    if (!isLoyaltyCouponInCart) {
        emptyLoyaltyVoucherName(lineItemCtnr);
    }
    return isLoyaltyCouponInCart;
}

/**
 * Function to update the user profile for birthYear and registrationCountry
 * @param {string} customerNo - customerNumber from the memberson profile
 * @param {string} profileObj - current customer profile
 * @param {string} currentCountryCode - current country code
 */
function updateregistrationCountryAttribute(customerNo, profileObj, currentCountryCode) {
    if (empty(profileObj.custom.birthYear) || empty(profileObj.custom.registrationCountry)) {
        var membersonMembershipSummary = getMembershipSummary(customerNo);
        if (!empty(membersonMembershipSummary) && membersonMembershipSummary.status === 'OK') {
            var membershipSummary = JSON.parse(membersonMembershipSummary.object.text);
            if (!empty(membershipSummary)) {
                if (!empty(membershipSummary.NationalityCode) && (empty(profileObj.custom.registrationCountry) || profileObj.custom.registrationCountry !== membershipSummary.NationalityCode)) {
                    Transaction.wrap(function () {
                        profileObj.custom.registrationCountry = membershipSummary.NationalityCode; // eslint-disable-line no-param-reassign
                    });
                } else if (empty(membershipSummary.NationalityCode)) {
                    Transaction.wrap(function () {
                        profileObj.custom.registrationCountry = currentCountryCode; // eslint-disable-line no-param-reassign
                    });
                }
            }
        }
    }
}

/**
 * function to remove memberson vouchers
 * @param {Object} couponsIterator - coupon line items
 * @param {Object} currentBasket - current basket obj
 */
function removemembersonVouchers(couponsIterator, currentBasket) {
    var CouponMgr = require('dw/campaign/CouponMgr');
    var membersonPromotion = null;
    var couponObj;
    if (!empty(couponsIterator)) {
        while (couponsIterator.hasNext()) {
            // this will loop through all the coupons
            var couponLineItem = couponsIterator.next();
            var couponCode = couponLineItem.getCouponCode();
            couponObj = CouponMgr.getCouponByCode(couponCode);
            membersonPromotion = getMembersonPromotion(couponObj.promotions);
            if (!empty(membersonPromotion)) {
                LOGGER.error('membersonHelpers.js removemembersonVouchers - Removing coupon code ' + couponCode);
                currentBasket.removeCouponLineItem(couponLineItem);
            }
        }
    }
}

module.exports = {
    sendProfileValidationEmail: sendProfileValidationEmail,
    viewTnCConsent: viewTnCConsent,
    getCountryConfig: getCountryConfig,
    searchProfile: searchProfile,
    createProfile: createProfile,
    getMembershipSummary: getMembershipSummary,
    getAuthToken: getAuthToken,
    storeCustomerRegistration: storeCustomerRegistration,
    setTnCConsent: setTnCConsent,
    validateUserForMemberson: validateUserForMemberson,
    getMemberVouchers: getMemberVouchers,
    utilizeMemberVoucher: utilizeMemberVoucher,
    unUtilizeMemberVoucher: unUtilizeMemberVoucher,
    validateAgeOfCustomer: validateAgeOfCustomer,
    getMembersonPromotion: getMembersonPromotion,
    updateProfileAttributes: updateProfileAttributes,
    getVoucherNumber: getVoucherNumber,
    checkIfMembersonCouponApplied: checkIfMembersonCouponApplied,
    updateregistrationCountryAttribute: updateregistrationCountryAttribute,
    removemembersonVouchers: removemembersonVouchers
};
