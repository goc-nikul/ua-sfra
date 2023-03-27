'use strict';

var Resource = require('dw/web/Resource');

/* Script modules */
var coreCheckoutHelper = require('app_ua_core/cartridge/scripts/checkout/checkoutHelpers');

var baseCheckoutHelper = require('app_storefront_base/cartridge/scripts/checkout/checkoutHelpers');

/**
 * Sends a confirmation to the current user
 * @param {dw.order.Order} order - The current user's order
 * @param {string} locale - the current request's locale id
 * @returns {void}
 */
function sendConfirmationEmail(order) {
    if (!order.custom.confirmationEmailSent) {
        var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
        var orderObject = {
            order: order
        };
        var emailData = {
            to: order.customerEmail,
            subject: Resource.msg('subject.order.confirmation.email', 'order', null),
            from: '',
            type: emailHelpers.emailTypes.orderConfirmation
        };
        var emailObj = {
            templateData: orderObject,
            emailData: emailData
        };
        require('*/cartridge/modules/providers').get('Email', emailObj).send();
        var Transaction = require('dw/system/Transaction');
        var ordObj = order;
        Transaction.wrap(function () {
            ordObj.custom.confirmationEmailSent = true;
        });
    }
}

/**
 * validate major input fields against xss valnability, non latin characters and regex pattern
 * @param {Object} addressObject - addressObject
 * @returns {Object} an error object
 */
function validateInputFieldsForShippingMethod(addressObject) {
    var checkCrossSiteScript = require('*/cartridge/scripts/utils/checkCrossSiteScript');
    var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'countryCode'];
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
        var regexToCheckEmojiNonLatinChars = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff]|[\u0250-\ue007])/;
        var emoRegex = /([#0-9]\u20E3)|[\xA9\xAE\u203C\u2047-\u2049\u2122\u2139\u3030\u303D\u3297\u3299][\uFE00-\uFEFF]?|[\u2190-\u21FF][\uFE00-\uFEFF]?|[\u2300-\u23FF][\uFE00-\uFEFF]?|[\u2460-\u24FF][\uFE00-\uFEFF]?|[\u25A0-\u25FF][\uFE00-\uFEFF]?|[\u2600-\u27BF][\uFE00-\uFEFF]?|[\u2900-\u297F][\uFE00-\uFEFF]?|[\u2B00-\u2BF0][\uFE00-\uFEFF]?|(?:\uD83C[\uDC00-\uDFFF]|\uD83D[\uDC00-\uDEFF])[\uFE00-\uFEFF]?/g;
        var patterns = {
            firstName: /^.{1,50}$/,
            lastName: /^.{1,50}$/,
            address1: /^([^_]){1,50}$/,
            address2: /^([^_]){0,50}$/,
            city: {
                US: /^([^0-9]){1,100}$/,
                CA: /^.{1,100}$/,
                AT: /^.{1,50}$/,
                BE: /^.{1,50}$/,
                DK: /^.{1,50}$/,
                FR: /^.{1,50}$/,
                DE: /^.{1,50}$/,
                GB: /^.{1,50}$/,
                IE: /^.{1,50}$/,
                IT: /^.{1,50}$/,
                NL: /^.{1,50}$/,
                ES: /^.{1,50}$/,
                SE: /^.{1,50}$/,
                PL: /^.{1,50}$/,
                PT: /^.{1,50}$/
            },
            countryCode: /^[A-Z]{2}$/,
            postalCode: {
                US: /^\d{5}$|^\d{5}-\d{4}$/,
                CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( ){1}\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
                AT: /(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                BE: /(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                DK: /([0-9]{4})$/,
                FR: /(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                DE: /(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
                GB: /^ ?(([BEGLMNSWbeglmnsw][0-9][0-9]?)|(([A-PR-UWYZa-pr-uwyz][A-HK-Ya-hk-y][0-9][0-9]?)|(([ENWenw][0-9][A-HJKSTUWa-hjkstuw])|([ENSWenw][A-HK-Ya-hk-y][0-9][ABEHMNPRVWXYabehmnprvwxy])))) ?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}$/i,
                IE: /^([A-Za-z0-9]{0,8})$/i,
                IT: /([0-9]{5})$/,
                NL: /^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-zA-Z]{2}$/i,
                ES: /([0-9]{5})$/,
                SE: /[0-9]{3} ?(?!sa|sd|ss)[0-9]{2}$/,
                CH: /^\d{4}?$/,
                LI: /^\d{4}?$/,
                NO: /([0-9]{4})$/,
                PL: /(([0-9]{5})|([0-9]{2}-[0-9]{3}))$/,
                PT: /(([0-9]{7})|([0-9]{4}-[0-9]{3}))$/
            },
            phone: /^[0-9]*$/,
            customerEmail: /^[\w.%+-]+@[\w.-]+\.[\w]{2,6}$/,
            giftMessage: /^.{0,140}$/
        };
        var field = '';
        var value = '';
        var regex = '';
        var requiredFields = ['firstName', 'lastName', 'address1', 'city', 'postalCode', 'countryCode'];
        for (var i = 0; i < addressFieldsToVerify.length; i++) {
            field = addressFieldsToVerify[i];
            value = object[field];
            regex = patterns[field];

            if (session.custom.currentCountry === 'IE' && (field === 'postalCode' && empty(object[field].value))) {
                continue; // eslint-disable-line no-continue
            }

            if (field === 'postalCode' || field === 'city') {
                regex = patterns[field][countryCode];
            } else if (field === 'countryCode') {
                value = object[field].value;
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
    var addressFieldsToVerify = ['firstName', 'lastName', 'address1', 'address2', 'city', 'postalCode', 'countryCode'];
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
        if (Object.keys(inputValidationErrors.billingAddressErrors).length === 0) {
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
 * Loop through all shipments and make sure all not null
 * @param {dw.order.LineItemCtnr} lineItemContainer - Current users's basket
 * @returns {boolean} - allValid
 */
function ensureValidShipments(lineItemContainer) {
    var collections = require('*/cartridge/scripts/util/collections');
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    const giftCardShipmentID = 'EGiftCardShipment';
    var shipments = lineItemContainer.shipments;
    var allValid;
    if (giftcardHelper.basketHasOnlyEGiftCards(lineItemContainer)) {
        allValid = true;
    } else {
        allValid = collections.every(shipments, function (shipment) {
            var paazlPickUpPoint = false;
            if (shipment && shipment.custom && shipment.custom.paazlDeliveryInfo) {
                try {
                    var paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
                    if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION') {
                        paazlPickUpPoint = true;
                    }
                } catch (e) {
                    paazlPickUpPoint = false;
                }
            }
            if (shipment.ID !== giftCardShipmentID && !paazlPickUpPoint) {
                var address = shipment.shippingAddress;
                return address && address.address1;
            }
            return true;
        });
    }
    return allValid;
}

/**
 * Attempts to place the order
 * @param {dw.order.Order} order - The order object to be placed
 * @param {Object} fraudDetectionStatus - an Object returned by the fraud detection hook
 * @param {string} currencyFromAdyenJob - value assigned from Adyen Notification Job
 * @returns {Object} an error object
 */
function placeOrder(order, fraudDetectionStatus, currencyFromAdyenJob) {
    var Transaction = require('dw/system/Transaction');
    var OrderMgr = require('dw/order/OrderMgr');
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var result = {
        error: false
    };

    try {
        Transaction.wrap(function () {
            var placeOrderStatus = OrderMgr.placeOrder(order);
            Logger.error('Error in Place Order : ' + JSON.stringify(placeOrderStatus));
            if (placeOrderStatus === Status.ERROR) {
                throw new Error();
            }
        });
    } catch (e) {
        Logger.error('Error in Place Order : ' + e.message);
        Transaction.wrap(function () {
            OrderMgr.failOrder(order, true);
        });
        result.error = true;
    }

    // Paazl update to custom attributes
    try {
        var Site = require('dw/system/Site');
        var isPaazlEnabled = Site.current.getCustomPreferenceValue('paazlEnabled');
        if (!result.error && isPaazlEnabled) {
            var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
            var paazlStatus = paazlHelper.getPaazlStatus(order.defaultShipment, currencyFromAdyenJob);
            // Check if Paazl is enable or not
            if (paazlStatus.active) {
                // If Paazl is active update the order shipping address with paazl shiiping address - only in case of pickup point delivery
                paazlHelper.updateShipment(order);

                // Set Order custom attribute 'notSavedInPaazl' to true, so the order will process by a job to be committed into Paazl
                Transaction.wrap(function () {
                    order.custom.notSavedInPaazl = true; // eslint-disable-line no-param-reassign
                    order.custom.failedAttempts = 0; // eslint-disable-line no-param-reassign
                    if (empty(order.getCustomerName())) {
                        var customerName = order.billingAddress.firstName + ' ' + order.billingAddress.lastName;
                        order.setCustomerName(customerName.trim());
                    }
                });
            }
        }
    } catch (e) {
        Logger.error('Error in Place Order : ' + e.message);
        result.error = true;
    }
    return result;
}

/**
 * Attempts to create an order from the current basket
 * @param {dw.order.Basket} currentBasket - The current basket
 * @param {string} orderNo - Order number
 * @returns {dw.order.Order} The order object created from the current basket
 */
function createOrder(currentBasket, orderNo) {
    var order;
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');

    try {
        order = Transaction.wrap(function () {
            if (orderNo) {
                return OrderMgr.createOrder(currentBasket, orderNo);
            }
            return OrderMgr.createOrder(currentBasket);
        });
    } catch (error) {
        return null;
    }
    return order;
}

/**
 * replace PostalCode for CA
 * @param {string} postalCode - postal code
 * @param {string} countryCode - country code
 * @returns {string} postalCode
 */
function replacePostalCode(postalCode, countryCode) {
    var regEx = {
        NL: {
            validationRegEx: /[1-9][0-9]{3} (?!sa|sd|ss)[a-zA-Z]{2}/,
            replaceRegEx: /(\d{4})(\w{2})$/,
            replaceText: '$1 $2'
        },
        SE: {
            validationRegEx: /[0-9]{3} (?!sa|sd|ss)[0-9]{2}/,
            replaceRegEx: /(\d{3})(\d{2})$/,
            replaceText: '$1 $2'
        },
        PL: {
            validationRegEx: /([0-9]{2}-[0-9]{3})$/,
            replaceRegEx: /(\d{2})(\d{3})$/,
            replaceText: '$1-$2'
        },
        PT: {
            validationRegEx: /([0-9]{4}-[0-9]{3})$/,
            replaceRegEx: /(\d{4})(\d{3})$/,
            replaceText: '$1-$2'
        },
        GB: {
            validationRegEx: /^ ?(([BEGLMNSWbeglmnsw][0-9][0-9]?)|(([A-PR-UWYZa-pr-uwyz][A-HK-Ya-hk-y][0-9][0-9]?)|(([ENWenw][0-9][A-HJKSTUWa-hjkstuw])|([ENSWenw][A-HK-Ya-hk-y][0-9][ABEHMNPRVWXYabehmnprvwxy])))) [0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}$/,
            replaceRegEx: {
                7: /(\w{4})(\w{3})$/,
                6: /(\w{3})(\w{3})$/,
                5: /(\w{2})(\w{3})$/
            },
            replaceText: '$1 $2'
        }
    };

    if (countryCode && regEx[countryCode] && postalCode) {
        var isvalid = regEx[countryCode].validationRegEx.test(postalCode);
        if (!isvalid) {
            if (countryCode === 'GB') {
                // eslint-disable-next-line no-param-reassign
                postalCode = regEx[countryCode].replaceRegEx[postalCode.length] ? postalCode.replace(regEx[countryCode].replaceRegEx[postalCode.length], regEx[countryCode].replaceText) : postalCode;
            } else {
                // eslint-disable-next-line no-param-reassign
                postalCode = postalCode.replace(regEx[countryCode].replaceRegEx, regEx[countryCode].replaceText);
            }
        }
    }
    return postalCode;
}

/**
 * update postal code for NL and SE
 * @param {dw.order.Basket} currentBasket - the Basket object
 */
function updatePostalCode(currentBasket) {
    var Transaction = require('dw/system/Transaction');
    var Logger = require('dw/system/Logger');
    try {
        if (currentBasket) {
            var shipments = currentBasket.shipments;
            var collections = require('*/cartridge/scripts/util/collections');
            collections.forEach(shipments, function (shipment) {
                var shippingAddress = shipment.shippingAddress;
                var shippingCountry = shippingAddress.countryCode ? shipment.shippingAddress.countryCode.value : '';
                var postalCode = shippingAddress ? shippingAddress.postalCode : '';
                var result = replacePostalCode(postalCode, shippingCountry);
                Transaction.wrap(function () {
                    shippingAddress.postalCode = result;
                });
            });

            var billingpostalCode = currentBasket.billingAddress ? currentBasket.billingAddress.postalCode : '';
            var billingCountry = currentBasket.billingAddress && currentBasket.billingAddress.countryCode ? currentBasket.billingAddress.countryCode.value : '';
            var resultPostal = replacePostalCode(billingpostalCode, billingCountry);
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                currentBasket.billingAddress.postalCode = resultPostal;
            });
        }
    } catch (e) {
        Logger.error('Error while executing updatePostalCode : ' + e);
    }
}

/**
 * Function used to return international shipping eligible list of countries
 * @param {string} countryCode - Country Code
 * @returns {Array} internationalShippingCountriesList
 */
function getInternationalShippingCountriesList(countryCode) {
    var Site = require('dw/system/Site');
    var internationalShippingCountriesList = null;
    if (countryCode && 'internationalShippingCountriesList' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('internationalShippingCountriesList')) {
        try {
            if (JSON.parse(Site.current.getCustomPreferenceValue('internationalShippingCountriesList'))[countryCode]) {
                internationalShippingCountriesList = JSON.parse(Site.current.getCustomPreferenceValue('internationalShippingCountriesList'))[countryCode];
            }
        } catch (e) {
            var Logger = require('dw/system/Logger');
            Logger.error('Error in internationalShippingCountriesList custom preference JSON : ', e.message);
        }
    }
    return internationalShippingCountriesList;
}

/**
 * Copies a CustomerAddress to a Shipment as its Shipping Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 * @param {dw.order.Shipment} [shipmentOrNull] - The target shipment
 */
function copyCustomerAddressToShipment(address, shipmentOrNull) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country
    var internationalShippingCountriesList = getInternationalShippingCountriesList(siteCountryCode);

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode || (internationalShippingCountriesList && internationalShippingCountriesList.length > 0 && (internationalShippingCountriesList.indexOf(address.countryCode) !== -1 || internationalShippingCountriesList.indexOf(address.countryCode.value) !== -1))) {
        baseCheckoutHelper.copyCustomerAddressToShipment(address, shipmentOrNull);
    }
}

/**
 * Copies a CustomerAddress to a Basket as its Billing Address
 * @param {dw.customer.CustomerAddress} address - The customer address
 */
function copyCustomerAddressToBilling(address) {
    var Locale = require('dw/util/Locale'); // eslint-disable-next-line
    var siteCountryCode = Locale.getLocale(request.locale).country
    var internationalShippingCountriesList = getInternationalShippingCountriesList(siteCountryCode);

    if (address.countryCode === siteCountryCode || address.countryCode.value === siteCountryCode || (internationalShippingCountriesList && internationalShippingCountriesList.length > 0 && (internationalShippingCountriesList.indexOf(address.countryCode) !== -1 || internationalShippingCountriesList.indexOf(address.countryCode.value) !== -1))) {
        baseCheckoutHelper.copyCustomerAddressToBilling(address);
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
    var Site = require('dw/system/Site');
    var countryCode = Locale.getLocale(request.locale).country; // eslint-disable-line
    var internationalShippingCountriesList = getInternationalShippingCountriesList(countryCode);
    var hasInternationalShippingCountriesList = internationalShippingCountriesList && internationalShippingCountriesList.length > 0;
    var containsLocaleAddress = null;
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.addresses.length > 0) {
        containsLocaleAddress = coreCheckoutHelper.getLocaleAddress(countryCode, currentCustomer.addressBook.addresses);
        if (containsLocaleAddress === null && hasInternationalShippingCountriesList) {
            for (var i = 0; i < internationalShippingCountriesList.length; i++) {
                containsLocaleAddress = coreCheckoutHelper.getLocaleAddress(internationalShippingCountriesList[i], currentCustomer.addressBook.addresses);
                if (containsLocaleAddress) {
                    break;
                }
            }
        }
    }
    if (currentCustomer && currentCustomer.addressBook && currentCustomer.addressBook.preferredAddress && (currentCustomer.addressBook.preferredAddress.countryCode === countryCode || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(currentCustomer.addressBook.preferredAddress.countryCode) !== -1))) {
        preferredAddress = currentCustomer.addressBook.preferredAddress;
    } else if (containsLocaleAddress) {
        preferredAddress = containsLocaleAddress;
    }
    // only true if customer is registered
    if (preferredAddress) {
        var collections = require('*/cartridge/scripts/util/collections');
        collections.forEach(shipments, function (shipment) {
            if (!shipment.shippingAddress && (preferredAddress.countryCode.value === countryCode || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(preferredAddress.countryCode.value) !== -1))) {
                copyCustomerAddressToShipment(preferredAddress, shipment);
            }
        });

        if (!billingAddress) {
            var isInternationalBillingAddress = 'isInternationalBillingAddressEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isInternationalBillingAddressEnabled');
            if (isInternationalBillingAddress || ((preferredAddress && preferredAddress.countryCode && preferredAddress.countryCode.value === countryCode) || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(preferredAddress.countryCode.value) !== -1))) {
                copyCustomerAddressToBilling(preferredAddress);
            }
        }
    }
}

/**
 * Helper function to set default billing address.
 * @param {dw.customer.Customer} customer - Customer SFCC API Object
 * @param {boolean} isInternationalBillingAddress - Boolean value with International Billing Address Enabled / Disabled
 */
function setDefaultBillingAddress(customer, isInternationalBillingAddress) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket && customer.authenticated && customer.addressBook) {
        var billingAddress = currentBasket.billingAddress;
        var preferredAddress = customer.addressBook.preferredAddress;
        var defaultBillingAddressID = !empty(customer) && customer.getProfile() && 'defaultBillingAddressID' in customer.getProfile().custom ? customer.getProfile().custom.defaultBillingAddressID : null;
        var Locale = require('dw/util/Locale');
        var countryCode = Locale.getLocale(request.locale).country;
        var internationalShippingCountriesList = getInternationalShippingCountriesList(countryCode);
        var hasInternationalShippingCountriesList = internationalShippingCountriesList && internationalShippingCountriesList.length > 0;

        if (!empty(defaultBillingAddressID)) {
            var defaultBillingAddress = customer.getProfile().getAddressBook().getAddress(defaultBillingAddressID);

            if (!empty(defaultBillingAddress) && (isInternationalBillingAddress || countryCode === defaultBillingAddress.countryCode.value || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(defaultBillingAddress.countryCode.value) !== -1))) {
                copyCustomerAddressToBilling(defaultBillingAddress);
            }
        } else if (!billingAddress && (isInternationalBillingAddress || countryCode === preferredAddress.countryCode || (hasInternationalShippingCountriesList && internationalShippingCountriesList.indexOf(preferredAddress.countryCode) !== -1))) {
            copyCustomerAddressToBilling(preferredAddress);
        }
    }
}

/**
 * Determines whether a Locale has atleast one corresponding address or not
 * @param {string} currentCountry - current locale
 * @param {Object} customerAddress - dw.customer.CustomerAddress
 * @returns {boolean} containsLocaleAddress
 */
function containsAtleastOneLocaleAddress(currentCountry, customerAddress) {
    var containsLocaleAddress = false;
    var internationalShippingCountriesList = getInternationalShippingCountriesList(currentCountry);
    for (var i = 0; i < customerAddress.length; i++) {
        var addressCountry = customerAddress[i].countryCode.value;
        if (addressCountry === currentCountry || (internationalShippingCountriesList && internationalShippingCountriesList.length > 0 && internationalShippingCountriesList.indexOf(addressCountry) !== -1)) {
            containsLocaleAddress = true;
            break;
        } else {
            containsLocaleAddress = false;
        }
    }

    return containsLocaleAddress;
}

coreCheckoutHelper.getInternationalShippingCountriesList = getInternationalShippingCountriesList;
coreCheckoutHelper.copyCustomerAddressToShipment = copyCustomerAddressToShipment;
coreCheckoutHelper.copyCustomerAddressToBilling = copyCustomerAddressToBilling;
coreCheckoutHelper.copyCustomerAddressToBasket = copyCustomerAddressToBasket;
coreCheckoutHelper.replacePostalCode = replacePostalCode;
coreCheckoutHelper.createOrder = createOrder;
coreCheckoutHelper.placeOrder = placeOrder;
coreCheckoutHelper.ensureValidShipments = ensureValidShipments;
coreCheckoutHelper.validateInputFieldsForShippingMethod = validateInputFieldsForShippingMethod;
coreCheckoutHelper.checkEmptyEmojiNonLatinChars = checkEmptyEmojiNonLatinChars;
coreCheckoutHelper.validateInputFields = validateInputFields;
coreCheckoutHelper.sendConfirmationEmail = sendConfirmationEmail;
coreCheckoutHelper.updatePostalCode = updatePostalCode;
coreCheckoutHelper.setDefaultBillingAddress = setDefaultBillingAddress;
coreCheckoutHelper.containsAtleastOneLocaleAddress = containsAtleastOneLocaleAddress;
module.exports = coreCheckoutHelper;
