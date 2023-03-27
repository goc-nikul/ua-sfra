/* eslint-disable no-restricted-syntax */
/* eslint-disable guard-for-in */

'use strict';

var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var localeID = request.locale; // eslint-disable-line

/* Script modules */
var baseCheckoutHelper = require('app_ua_emea/cartridge/scripts/checkout/checkoutHelpers');
var BasketMgr = require('dw/order/BasketMgr');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');

/**
 *  @param {dw.util.Array} addressFieldsToVerify - addressFieldsToVerify array
 *  @param {string} field - field
 * Returns the address fields required to verify.
 * @returns {Array} addressFieldsToVerify
 */
function arrayRemove(addressFieldsToVerify, field) {
    return addressFieldsToVerify.filter(function (ele) {
        return ele !== field;
    });
}

/**
 * Returns the address fields required to verify.
 * @returns {Array} addressFieldsToVerify
 */
function getAddressFields() {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var currentLocale = Locale.getLocale(localeID);
    var countryCode = currentLocale.country;
    if (empty(session.custom.currentCountry)) {
        session.custom.currentCountry = countryCode;
    }
    var addressFieldsToVerify = ['lastName', 'address1', 'address2', 'postalCode', 'countryCode'];
    if (session.custom.currentCountry === 'AU' || session.custom.currentCountry === 'NZ') {
        addressFieldsToVerify.push('suburb');
    } else if (session.custom.currentCountry !== 'HK' && session.custom.currentCountry !== 'KR') {
        addressFieldsToVerify.push('city');
    } else if (session.custom.currentCountry === 'HK') {
        addressFieldsToVerify = arrayRemove(addressFieldsToVerify, 'postalCode');
    }

    if (session.custom.currentCountry !== 'KR') {
        addressFieldsToVerify.push('firstName');
    }

    if (session.custom.currentCountry === 'PH' || session.custom.currentCountry === 'ID') {
        addressFieldsToVerify.push('district');
    }
    return addressFieldsToVerify;
}

/**
 * validate order limit from site preference
 * @returns {Object} an error object
 */
function checkOrderLimit() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var result = {
        orderLimitExceeds: false,
        lineItemMaxLimitError: ''
    };
    var footwearCount = 0;
    var otherCount = 0;
    var localeID = request.locale.split('_')[0]; // eslint-disable-line
    var limitOrderQuantityJSONData = Site.current.getCustomPreferenceValue('limitOrderQuantityByCategory');
    if (!empty(limitOrderQuantityJSONData)) {
        try {
            var limitOrderQuantityJSON = JSON.parse(limitOrderQuantityJSONData);
            if (currentBasket) {
                var productLineItems = currentBasket.productLineItems;
                for (var i = 0; i < productLineItems.length; i++) {
                    var lineItem = productLineItems[i];
                    var masterItemDivision = lineItem.product.masterProduct.custom.division.toLowerCase();
                    var division = masterItemDivision === 'footwear' ? 'footwear' : 'apparel';
                    if (!empty(division) && !empty(limitOrderQuantityJSON[session.custom.currentCountry]) && !empty(limitOrderQuantityJSON[session.custom.currentCountry][division])) {
                        var limitOrderQuantityData = limitOrderQuantityJSON[session.custom.currentCountry];
                        var qtyOrderMaxLimit = parseInt(limitOrderQuantityData[division].order_limit, 10);
                        var qtyOrderDataMessage = limitOrderQuantityData[division].message;
                        if (division === 'footwear') {
                            footwearCount += lineItem.quantity.value;
                            if (footwearCount > qtyOrderMaxLimit || lineItem.quantity.value > qtyOrderMaxLimit) {
                                result.orderLimitExceeds = true;
                                result.lineItemMaxLimitError = qtyOrderDataMessage[0][localeID];
                                break;
                            }
                        }
                        if (division !== 'footwear') {
                            otherCount += lineItem.quantity.value;
                            if (otherCount > qtyOrderMaxLimit || lineItem.quantity.value > qtyOrderMaxLimit) {
                                result.orderLimitExceeds = true;
                                result.lineItemMaxLimitError = qtyOrderDataMessage[0][localeID];
                                break;
                            }
                        }
                    }
                }
            }
        } catch (e) {
            Logger.error('checkoutHelpers.js function error: JSON parse failed. Can not parse site custom preference Error: {0}', e);
        }
    }
    return result;
}

/**
 * validate major input fields against xss valnability, non latin characters and regex pattern
 * @param {Object} addressObject - addressObject
 * @returns {Object} an error object
 */
function validateInputFieldsForShippingMethod(addressObject) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var addressFieldsToVerify = getAddressFields();
    var inputValidationErrors = {
        error: false,
        shippingAddressErrors: {},
        genericErrorMessage: ''
    };
    // Validate shipping address
    if (addressObject) {
        inputValidationErrors.shippingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(addressObject, addressFieldsToVerify);
    }
    if (Object.keys(inputValidationErrors.shippingAddressErrors).length > 0) {
        inputValidationErrors.error = true;
        inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
    }
    return inputValidationErrors;
}

/**
 * validation to check for emoji characters, non latin characters and regex pattern
 * @param {Object} object - data object
 * @param {Object} addressFieldsToVerify - array of fields to validate
 * @param {string} countryCode - country code
 * @returns {Object} errors
 */
function checkEmptyEmojiNonLatinChars(object, addressFieldsToVerify, countryCode) {
    var errors = {};
    try {
        var regexToCheckEmojiNonLatinChars = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/gm;
        var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
        var patterns = {
            firstName: /^.{1,50}$/,
            lastName: /^.{1,50}$/,
            address1: /^([^_]){1,50}$/,
            address2: /^([^_]){0,50}$/,
            suburb: /^([^_]){0,30}$/,
            city: /^.{1,50}$/,
            countryCode: /^[A-Z]{2}$/,
            postalCode: {
                NZ: /^([0-9]){4}?$/,
                AU: /^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$/,
                SG: /(^\d{6}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                MY: /(^\d{4,5}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                PH: /(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                ID: /(^\d{5}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/
            },
            phone: /^[0-9]*$/,
            customerEmail: /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/,
            giftMessage: /^.{0,140}$/
        };
        var field = '';
        var value = '';
        var regex = '';
        var requiredFields = ['lastName', 'address1', 'postalCode', 'countryCode'];
        if (session.custom.currentCountry === 'AU') {
            requiredFields.push('suburb');
        } else if (session.custom.currentCountry !== 'AU' && session.custom.currentCountry !== 'HK' && session.custom.currentCountry !== 'KR') {
            requiredFields.push('city');
        }

        if (session.custom.currentCountry !== 'KR') {
            requiredFields.push('firstName');
        }

        for (var i = 0; i < addressFieldsToVerify.length; i++) {
            field = addressFieldsToVerify[i];
            value = object[field];
            regex = patterns[field];

            if (field === 'postalCode') {
                regex = patterns[field][countryCode];
            } else if (field === 'countryCode') {
                value = object[field].value;
            } else if (field === 'suburb') {
                value = object.custom[field];
            }

            // checking required fields from validateInputFields function
            if (empty(value) && requiredFields.indexOf(field) > -1) {
                errors[field] = field + ' is empty';
            }
            if ((!empty(value) && regexToCheckEmojiNonLatinChars.test(value)) || (!empty(value) && !empty(regex) && !regex.test(value)) || (!empty(value) && emoRegex.test(value))) {
                errors[field] = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
            }
        }
    } catch (e) {
        // TODO:
    }
    return errors;
}

/**
 * validate major input fields against emoji characters, non latin characters and regex pattern
 * @param {dw.order.Basket} lineItemCtnr - Basket object
 * @returns {Object} an error object
 */
function validateInputFields(lineItemCtnr) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var addressFieldsToVerify = getAddressFields();
    var giftMessageFieldsToVerify = ['giftMessage'];
    var customerEmailField = ['customerEmail'];
    var phoneField = ['phone'];
    var inputValidationErrors = {
        error: false,
        shippingAddressErrors: {},
        billingAddressErrors: {},
        giftMessageErrors: {},
        contactInfoErrors: {},
        genericErrorMessage: ''
    };
    var countryCode = '';
    var shippingAddress = lineItemCtnr.defaultShipment.shippingAddress;
    // Validate shipping address
    if (shippingAddress) {
        countryCode = shippingAddress.countryCode.value;
        inputValidationErrors.shippingAddressErrors = checkEmptyEmojiNonLatinChars(shippingAddress, addressFieldsToVerify, countryCode);
        if (Object.keys(inputValidationErrors.shippingAddressErrors).length === 0) {
            inputValidationErrors.shippingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(shippingAddress, addressFieldsToVerify);
        }
    }
    // Validate billing address
    var billingAddress = lineItemCtnr.billingAddress;
    if (billingAddress) {
        countryCode = billingAddress.countryCode.value;
        inputValidationErrors.billingAddressErrors = checkEmptyEmojiNonLatinChars(billingAddress, addressFieldsToVerify, countryCode);
        if (Object.keys(inputValidationErrors.billingAddressErrors).length === 0) {
            inputValidationErrors.billingAddressErrors = checkCrossSiteScript.crossSiteScriptPatterns(billingAddress, addressFieldsToVerify);
        }
    }
    // Validate gift message Field
    if (lineItemCtnr.defaultShipment && lineItemCtnr.defaultShipment.giftMessage) {
        inputValidationErrors.giftMessageErrors = checkEmptyEmojiNonLatinChars(lineItemCtnr.defaultShipment, giftMessageFieldsToVerify);
        if (Object.keys(inputValidationErrors.giftMessageErrors).length === 0) {
            inputValidationErrors.giftMessageErrors = checkCrossSiteScript.crossSiteScriptPatterns(lineItemCtnr.defaultShipment, giftMessageFieldsToVerify);
        }
    }
    // Validate contact info Details
    if (lineItemCtnr.customerEmail) {
        var customerEmailValidation = checkEmptyEmojiNonLatinChars(lineItemCtnr, customerEmailField);
        if (Object.keys(customerEmailValidation).length > 0) {
            inputValidationErrors.contactInfoErrors.customerEmail = customerEmailValidation.customerEmail;
        } else if (Object.keys(customerEmailValidation).length === 0) {
            customerEmailValidation = checkCrossSiteScript.crossSiteScriptPatterns(lineItemCtnr, customerEmailField);
            if (Object.keys(customerEmailValidation).length > 0) {
                inputValidationErrors.contactInfoErrors.customerEmail = customerEmailValidation.customerEmail;
            }
        }
        if (billingAddress && billingAddress.phone) {
            var phoneValidation = checkEmptyEmojiNonLatinChars(billingAddress, phoneField, countryCode);
            if (Object.keys(phoneValidation).length > 0) {
                inputValidationErrors.contactInfoErrors.phone = phoneValidation.phone;
            } else if (Object.keys(phoneValidation).length === 0) {
                phoneValidation = checkCrossSiteScript.crossSiteScriptPatterns(billingAddress, phoneField);
                if (Object.keys(phoneValidation).length > 0) {
                    inputValidationErrors.contactInfoErrors.phone = phoneValidation.phone;
                }
            }
        }
    }
    if (Object.keys(inputValidationErrors.shippingAddressErrors).length > 0 || Object.keys(inputValidationErrors.billingAddressErrors).length > 0 || Object.keys(inputValidationErrors.giftMessageErrors).length > 0 || Object.keys(inputValidationErrors.contactInfoErrors).length > 0) {
        inputValidationErrors.error = true;
        inputValidationErrors.genericErrorMessage = Resource.msg('checkout.nonlatincharacters.error', 'checkout', null);
    }
    return inputValidationErrors;
}

/**
 * Copies information from the shipping form to the associated shipping address
 * @param {Object} shippingData - the shipping data
 * @param {dw.order.Shipment} [shipmentOrNull] - the target Shipment
 * @param {string} type - origin of the request
 */
function copyShippingAddressToShipment(shippingData, shipmentOrNull, type) {
    baseCheckoutHelper.copyShippingAddressToShipment(shippingData, shipmentOrNull, type);
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;
    var currentBasket = BasketMgr.getCurrentBasket();
    var shipment = shipmentOrNull || currentBasket.defaultShipment;
    var form = require('server').forms.getForm('shipping');
    var shippingAddress = shipment.shippingAddress;

    Transaction.wrap(function () {
        if ((!empty(form.shippingAddress.addressFields.suburb) && !empty(form.shippingAddress.addressFields.suburb.value))) {
            shippingAddress.custom.suburb = form.shippingAddress.addressFields.suburb.value;
        }
        if ((!empty(form.shippingAddress.addressFields.businessName) && !empty(form.shippingAddress.addressFields.businessName.value))) {
            shippingAddress.custom.businessName = form.shippingAddress.addressFields.businessName.value;
        }
        if ((!empty(form.shippingAddress.addressFields.district) && !empty(form.shippingAddress.addressFields.district.value))) {
            shippingAddress.custom.district = form.shippingAddress.addressFields.district.value;
        }
        if (form.shippingAddress.addressFields && form.shippingAddress.addressFields.state) {
            shippingAddress.setStateCode(form.shippingAddress.addressFields.state.value);
        }
        if (showSplitPhoneMobileField) {
            if ((!empty(form.shippingAddress.addressFields.phone1) && !empty(form.shippingAddress.addressFields.phone1.value))) {
                shippingAddress.custom.phone1 = form.shippingAddress.addressFields.phone1.value;
            }
            if ((!empty(form.shippingAddress.addressFields.phone2) && !empty(form.shippingAddress.addressFields.phone2.value))) {
                shippingAddress.custom.phone2 = form.shippingAddress.addressFields.phone2.value;
            }
            if ((!empty(form.shippingAddress.addressFields.phone3) && !empty(form.shippingAddress.addressFields.phone3.value))) {
                shippingAddress.custom.phone3 = form.shippingAddress.addressFields.phone3.value;
            }
        }
    });
}

/**
 * Copies a raw address object to the baasket billing address
 * @param {Object} address - an address-similar Object (firstName, ...)
 * @param {Object} currentBasket - the current shopping basket
 */
function copyBillingAddressToBasket(address, currentBasket) {
    var isKRCustomCheckoutEnabled = require('*/cartridge/config/preferences').isKRCustomCheckoutEnabled;
    baseCheckoutHelper.copyBillingAddressToBasket(address, currentBasket);
    var billingAddress = currentBasket.billingAddress;
    Transaction.wrap(function () {
        if (!empty(address.custom.suburb)) {
            billingAddress.custom.suburb = address.custom.suburb;
        }
        if (!empty(address.custom.businessName)) {
            billingAddress.custom.businessName = address.custom.businessName;
        }
        if (!empty(address.custom.district)) {
            billingAddress.custom.district = address.custom.district;
        }

        if (isKRCustomCheckoutEnabled) {
            billingAddress.lastName = '';
            billingAddress.firstName = '';
            billingAddress.phone = '';
        }
    });
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;
    var showSplitPhoneMobileField = require('*/cartridge/config/preferences').isShowSplitPhoneMobileField;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        baseCheckoutHelper.copyCustomerAddressToShipment(address, shipmentOrNull);
        var currentBasket = BasketMgr.getCurrentBasket();
        var shipment = currentBasket.defaultShipment;
        var shippingAddress = shipment.shippingAddress;
        Transaction.wrap(function () {
            if (!empty(address.custom) && 'suburb' in address.custom && !empty(address.custom.suburb)) {
                shippingAddress.custom.suburb = address.custom.suburb;
            }
            if (!empty(address.custom) && 'businessName' in address.custom && !empty(address.custom.businessName)) {
                shippingAddress.custom.businessName = address.custom.businessName;
            }
            if (!empty(address.custom) && 'district' in address.custom && !empty(address.custom.district)) {
                shippingAddress.custom.district = address.custom.district;
            }
            if (showSplitPhoneMobileField) {
                if (!empty(address.custom) && 'phone1' in address.custom && !empty(address.custom.phone1)) {
                    shippingAddress.custom.phone1 = address.custom.phone1;
                }
                if (!empty(address.custom) && 'phone2' in address.custom && !empty(address.custom.phone2)) {
                    shippingAddress.custom.phone2 = address.custom.phone2;
                }
                if (!empty(address.custom) && 'phone3' in address.custom && !empty(address.custom.phone3)) {
                    shippingAddress.custom.phone3 = address.custom.phone3;
                }
                if (shippingAddress.custom.phone1 && shippingAddress.custom.phone2 && shippingAddress.custom.phone3) {
                    var phone = shippingAddress.custom.phone1 + '-' + shippingAddress.custom.phone2 + '-' + shippingAddress.custom.phone3;
                    shippingAddress.setPhone(phone);
                }
            }
        });
    }
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country;

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode) {
        baseCheckoutHelper.copyCustomerAddressToBilling(address);
        var currentBasket = BasketMgr.getCurrentBasket();
        var billingAddress = currentBasket.billingAddress;
        Transaction.wrap(function () {
            if (!empty(address.custom) && 'suburb' in address.custom && !empty(address.custom.suburb)) {
                billingAddress.custom.suburb = address.custom.suburb;
            }
            if (!empty(address.custom) && 'businessName' in address.custom && !empty(address.custom.businessName)) {
                billingAddress.custom.businessName = address.custom.businessName;
            }
            if (!empty(address.custom) && 'district' in address.custom && !empty(address.custom.district)) {
                billingAddress.custom.district = address.custom.district;
            }
        });
    }
}
/**
 * To copy customer address to Billing & Shipping
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} currentCustomer current customer
 */
function copyCustomerAddressToBasket(currentBasket, currentCustomer) {
    var shipments = currentBasket.shipments;
    var billingAddress = currentBasket.billingAddress;
    var preferredAddress = null;
    var Locale = require('dw/util/Locale');
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    var containsLocaleAddress = null;
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.addresses.length > 0) {
        containsLocaleAddress = baseCheckoutHelper.getLocaleAddress(countryCode, currentCustomer.addressBook.addresses);
    }
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.preferredAddress && currentCustomer.addressBook.preferredAddress.countryCode === countryCode) {
        preferredAddress = currentCustomer.addressBook.preferredAddress;
    } else if (containsLocaleAddress) {
        preferredAddress = containsLocaleAddress;
    }
    // only true if customer is registered
    if (preferredAddress) {
        collections.forEach(shipments, function (shipment) {
            if (!shipment.shippingAddress && preferredAddress.countryCode.value === countryCode) {
                copyCustomerAddressToShipment(preferredAddress, shipment);
            }
        });

        if (!billingAddress) {
            var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
            if (isInternationalBillingAddress || (preferredAddress && preferredAddress.countryCode && preferredAddress.countryCode.value === countryCode)) {
                copyCustomerAddressToBilling(preferredAddress);
            }
        }
    }
}

/**
 * To save email fields in billing form
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {Object} billingForm current billingForm
 * @returns {Object} billingForm billingForm
 */
function setEmailFiledsInBillingForm(currentBasket, billingForm) {
    var newBillingForm = billingForm;
    var showSplitEmailField = require('*/cartridge/config/preferences').isShowSplitEmailField;
    if (showSplitEmailField) {
        newBillingForm.emailaddressName.value = currentBasket.custom.emailaddressName;
        newBillingForm.emailaddressDomainSelect.value = currentBasket.custom.emailaddressDomainSelect;
        newBillingForm.emailaddressDomain.value = currentBasket.custom.emailaddressDomain;
    } else {
        newBillingForm.billEmail.value = currentBasket.getCustomerEmail();
    }
    return newBillingForm;
}

/**
 * To spilt email address
 * @param {string} email - email address
 * @param {Object} billingForm current billingForm
 * @returns {Object} email obj
 */
function splitEmail(email, billingForm) {
    var emailObj = {};
    var customerEmail = email.split('@');
    var emailSelectOptions = 'emailaddressDomainSelect' in billingForm && !empty(billingForm.emailaddressDomainSelect.options) ? billingForm.emailaddressDomainSelect.options : null;
    var emailDomainValue = !empty(emailSelectOptions) ? emailSelectOptions.some(x => x.value === customerEmail[1]) : false;

    emailObj.emailaddressName = customerEmail[0];
    emailObj.emailaddressDomain = customerEmail[1];
    emailObj.emailaddressDomainSelect = (emailDomainValue) ? customerEmail[1] : '';

    return emailObj;
}

/**
 * SMS OptIn enabled true / false
 * @param {SitePreferences} smsOptInSitesConfig - JSON data with siteIDs
 * @returns {boolean} SMS OptIn
 */
function smsOptInEnabled() {
    var countryID = session.custom.currentCountry ? session.custom.currentCountry : require('dw/util/Locale').getLocale(request.getLocale()).country; // eslint-disable-line
    var smsOptInSitesConfig = 'smsOptInSitesConfig' in Site.current.preferences.custom && JSON.parse(Site.current.getCustomPreferenceValue('smsOptInSitesConfig'));
    if (!empty(smsOptInSitesConfig) && smsOptInSitesConfig && countryID && smsOptInSitesConfig[countryID]) {
        return smsOptInSitesConfig[countryID];
    } else if (!empty(smsOptInSitesConfig) && !smsOptInSitesConfig[countryID] && smsOptInSitesConfig['default']) { // eslint-disable-line
        return smsOptInSitesConfig['default']; // eslint-disable-line
    }
    return false;
}

/**
 * To Validate Phone Area Code
 * @param {string} phoneNumber - phoneNumber
 * @param {string} countryDialingCode countryDialingCode
 * @returns {boolean} is Valid Area Code
 */
function validatePhoneAreaCode(phoneNumber, countryDialingCode) {
    var countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON'));
    var isValidAreaCode = true;
    var countryDCode;
    var country;
    for (var countryItr in countries) {
        countryDCode = countries[countryItr].countryDialingCode;
        if (countryDialingCode === countryDCode) {
            country = countries[countryItr];
        }
    }
    if (!empty(country)) {
        var areaCodes = country.areaCode;
        var areaCodeDigits = country.areaCodeDigitCount;
        if (!empty(areaCodes)) {
            var areaCodeFromPhone = phoneNumber ? phoneNumber.substring(0, new Number(areaCodeDigits)) : ''; // eslint-disable-line no-new-wrappers
            if (areaCodes.indexOf(areaCodeFromPhone) === -1) {
                isValidAreaCode = false;
            }
        }
    }
    return isValidAreaCode;
}

/**
 * To Validate Phone Number for SEA countries
 * @param {string} phoneNumber - phoneNumber
 * @param {string} countryDialingCode countryDialingCode
 * @returns {boolean} is Valid Area Code
 */
function validatephoneNumber(phoneNumber, countryDialingCode) {
    var isValidPhoneNumber = true;
    var generalRegexp = /^[0-9- )(+]{10,20}$/;
    if (session.custom.currentCountry === 'KR') {
        generalRegexp = /^[0-9- )(+]{8,20}$/;
    }
    var countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON'));
    var countryDCode;
    var country;
    for (var countryItr in countries) {
        countryDCode = countries[countryItr].countryDialingCode;
        if (countryDialingCode === countryDCode) {
            country = countries[countryItr];
            break;
        }
    }
    var countryCode = country ? country.countryCode : '';
    var regexp = country ? country.regexp : '';
    if (countryCode && regexp) {
        regexp = new RegExp(regexp);
        if (!(regexp.test(phoneNumber))) {
            isValidPhoneNumber = false;
        }
    } else if (!empty(phoneNumber)) {
        if ((session.custom.currentCountry === 'AU' || session.custom.currentCountry === 'NZ')) {
            for (var countryItrration in countries) {
                if (session.custom.currentCountry === countries[countryItrration].countryCode) {
                    regexp = countries[countryItrration].regexp;
                    regexp = new RegExp(regexp);
                    break;
                }
            }
            if (!empty(regexp) && !regexp.test(phoneNumber)) {
                isValidPhoneNumber = false;
            }
        } else if (!generalRegexp.test(phoneNumber)) {
            isValidPhoneNumber = false;
        }
    }
    return isValidPhoneNumber;
}

/**
 * To get CountryDialingCode Based On Current Country
 * @returns {string} country Dialing Code
 */
function getCountryDialingCodeBasedOnCurrentCountry() {
    var countries = JSON.parse(Site.getCurrent().getCustomPreferenceValue('countriesJSON'));
    var currentCountry = session.custom.currentCountry;
    var countryDCode = '';
    for (var countryItr in countries) {
        var countryCode = countries[countryItr].countryCode;
        if (countryCode === currentCountry) {
            countryDCode = countries[countryItr].countryDialingCode;
            break;
        }
    }
    var countryDialingCode = countryDCode;
    return countryDialingCode;
}

/**
* This ,ethod checks whether the basket has after payment method and also whether it is exceeding the limit or not
* @param {dw.order.Basket} currentBasket - Basket object
* @returns {boolean} Basket has exceeded limit or not
*/
function isAfterPayBasket(currentBasket) {
    var paymentInstruments = currentBasket ? currentBasket.getPaymentInstruments('AdyenComponent') : null;
    if (paymentInstruments && paymentInstruments.size() > 0) {
        var paymentInstrumentsIt = paymentInstruments.iterator();
        while (paymentInstrumentsIt.hasNext()) {
            var paymentInstrument = paymentInstrumentsIt.next();
            if (paymentInstrument && 'adyenPaymentMethod' in paymentInstrument.custom && paymentInstrument.custom.adyenPaymentMethod === 'Afterpay') {
                return true;
            }
        }
    }
    return false;
}


/**
* This ,ethod checks whether the basket has after payment method and also whether it is exceeding the limit or not
* @param {dw.order.Basket} currentBasket - Basket object
* @returns {boolean} Basket has exceeded limit or not
*/
function isBasketExceedingAfterPayLimit(currentBasket) {
    if (currentBasket) {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var afterPayMinAmount = PreferencesUtil.getValue('afterPayMin');
        var afterPayMaxAmount = PreferencesUtil.getValue('afterPayMax');
        if (currentBasket.totalGrossPrice.value < afterPayMinAmount || currentBasket.totalGrossPrice.value > afterPayMaxAmount) {
            return true;
        }
    }
    return false;
}

/**
* This Method checks whether the basket Has Products Not Available For current Locale
* @returns {boolean} Basket has  Products Not Available For current Locale
*/
function checkBasketHasProductsNotAvailableForLocale() {
    var currentBasket = BasketMgr.getCurrentBasket();
    var count = 0;
    var result = {
        basketHasInvalidProducts: false,
        ProductNames: ''
    };
    try {
        if (currentBasket) {
            var productLineItems = currentBasket.productLineItems;
            for (var i = 0; i < productLineItems.length; i++) {
                var lineItem = productLineItems[i];
                if (lineItem.product.custom.availableForLocale.value === 'No') {
                    count += 1;
                    result.ProductNames += count + '-' + lineItem.product.name + ',';
                    result.basketHasInvalidProducts = true;
                }
            }
            result.ProductNames = result.ProductNames.substring(0, result.ProductNames.length - 1);
        }
    } catch (e) {
        Logger.error('checkoutHelpers.js function error: checkBasketHasProductsNotAvailableForLocale {0}', e);
    }
    return result;
}

/**
* This Method verify the office address available for current Country
* @param {SitePreferences} officeAddresses - employee office address available in custom preference
* @param {string} currentCountry - session or locale
* @returns {boolean} availableForCountry  true or false
*/
function isEmployeeOfficeAddressAvailableForCurrentCountry(officeAddresses, currentCountry) {
    if (!empty(officeAddresses) && officeAddresses.length > 0) {
        for (let i = 0; i < officeAddresses.length; i++) {
            if (officeAddresses[i].countryCode === currentCountry) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Update Export status as not exported if payment gateway is adyen and notification call didnt happened
 * @param {Obejct} order DW order object
 */
function setAdyenOrderStatusToNotExported(order) {
    if (order && order.paymentInstruments) {
        var adyenPaymentInstrument = collections.find(order.paymentInstruments, (paymentInstrument) => {
            return paymentInstrument.paymentMethod === 'AdyenComponent'
                && (empty(order.custom.Adyen_paymentMethod) || empty(order.custom.Adyen_pspReference)
                    || empty(order.custom.Adyen_eventCode) || empty(order.custom.Adyen_value));
        });
        // Added transaction in calling function
        if (adyenPaymentInstrument) {
            var Order = require('dw/order/Order');
            order.setExportStatus(Order.EXPORT_STATUS_NOTEXPORTED);
            order.setPaymentStatus(Order.PAYMENT_STATUS_NOTPAID);
        }
    }
}

/**
 * To create profile form object to make IDM call to update phone number from checkout contact information
 * @param {Obejct} customer - Current Customer
 * @param {string} phone - Phone Number
 * @return {Object} Profile form Object
 */
function prepProfileObjFromContactInfo(customer, phone) {
    var profileObj = {};
    var profileCustomer = {};
    var profileLogin = {};
    var newpasswords = {};
    var preferences = {};

    profileCustomer.lastname = customer.profile.lastName;
    profileCustomer.gender = customer.profile.gender.value;

    var birthYear = null;

    // to check if birthday there in profile
    if (!empty(customer.profile.birthday)) {
        profileCustomer.birthDay = customer.profile.birthday.getDate();
        profileCustomer.birthMonth = customer.profile.birthday.getMonth();
        birthYear = customer.profile.birthday.getFullYear();
    } else {
        profileCustomer.birthDay = null;
        profileCustomer.birthMonth = null;
    }

    profileCustomer.preferences = preferences;
    profileCustomer.phone = phone;

    if (birthYear > 1900) {
        profileCustomer.birthYear = birthYear;
    }

    profileLogin.creatPassword = null;
    profileLogin.currentpassword = null;
    profileLogin.password = null;
    profileLogin.passwordconfirm = null;
    newpasswords.newpassword = null;
    newpasswords.newpasswordconfirm = null;
    profileLogin.newpasswords = newpasswords;

    profileObj.customer = profileCustomer;
    profileObj.login = profileLogin;

    return profileObj;
}

// Asigning all the attributes of the base object to the exports object
Object.assign(module.exports, baseCheckoutHelper);
module.exports.copyBillingAddressToBasket = copyBillingAddressToBasket;
module.exports.validateInputFieldsForShippingMethod = validateInputFieldsForShippingMethod;
module.exports.copyShippingAddressToShipment = copyShippingAddressToShipment;
module.exports.checkEmptyEmojiNonLatinChars = checkEmptyEmojiNonLatinChars;
module.exports.validateInputFields = validateInputFields;
module.exports.checkOrderLimit = checkOrderLimit;
module.exports.copyCustomerAddressToShipment = copyCustomerAddressToShipment;
module.exports.copyCustomerAddressToBilling = copyCustomerAddressToBilling;
module.exports.copyCustomerAddressToBasket = copyCustomerAddressToBasket;
module.exports.smsOptInEnabled = smsOptInEnabled;
module.exports.validatePhoneAreaCode = validatePhoneAreaCode;
module.exports.isBasketExceedingAfterPayLimit = isBasketExceedingAfterPayLimit;
module.exports.isAfterPayBasket = isAfterPayBasket;
module.exports.validatephoneNumber = validatephoneNumber;
module.exports.getCountryDialingCodeBasedOnCurrentCountry = getCountryDialingCodeBasedOnCurrentCountry;
module.exports.checkBasketHasProductsNotAvailableForLocale = checkBasketHasProductsNotAvailableForLocale;
module.exports.isEmployeeOfficeAddressAvailableForCurrentCountry = isEmployeeOfficeAddressAvailableForCurrentCountry;
module.exports.setAdyenOrderStatusToNotExported = setAdyenOrderStatusToNotExported;
module.exports.setEmailFiledsInBillingForm = setEmailFiledsInBillingForm;
module.exports.prepProfileObjFromContactInfo = prepProfileObjFromContactInfo;
module.exports.splitEmail = splitEmail;
