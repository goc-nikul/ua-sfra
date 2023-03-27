'use strict';

/* eslint-disable no-param-reassign */

var Status = require('dw/system/Status');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var StringUtils = require('dw/util/StringUtils');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var Site = require('dw/system/Site');
var siteID = Site.current.ID;
var localeID = request.locale; // eslint-disable-line

var ApplePayHelper = require('*/cartridge/scripts/helpers/applePayHelper');
var ApplePayCore = require('app_ua_core/cartridge/scripts/hooks/applePay/applePay');

var ApplePayLogger = Logger.getLogger('ApplePay', 'ApplePay');
var errorCodes = {
    invalidNameField: 'NAME_FIELDS_VALIDATION_FAILED',
    emojiValidationFailed: 'EMOJI_VALIDATION_FAILED',
    postalCodeValidationFailed: 'POSTALCODE_VALIDATION_FAILED',
    invalidCity: 'CITY_FIELD_VALIDATION_FAILED',
    invalidCountryCode: 'COUNTRY_CODE_VALIDATION_FAILED',
    emojiNonLatinValidationFailed: 'EMOJI_NON_LATIN_VALIDATION_FAILED',
    adyenAuthorizationFailed: 'ADYEN_AUTHORIZATION_FAILED'
};

exports.authorizeOrderPayment = function (order, event) {
    if (siteID === 'EU' || siteID === 'UKIE') {
        try {
            var collections = require('*/cartridge/scripts/util/collections');
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            var billingAddress = order.getBillingAddress();
            var shippingAddress = order.getDefaultShipment().getShippingAddress();
            var error;
            var fieldsToCheckAddress = ['address1', 'address2', 'firstName', 'lastName', 'city', 'postalCode'];
            var fieldsToCheckOrder = ['customerName'];
            var HookMgr = require('dw/system/HookMgr');
            var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers'); // eslint-disable-line

            if (order) {
                var orderPaymentInstruments = order.getPaymentInstruments();
                var paymentMethods = '';
                if (!empty(orderPaymentInstruments)) {
                    collections.forEach(orderPaymentInstruments, function (paymentInstr) {
                        paymentMethods += empty(paymentMethods) ? paymentInstr.getPaymentMethod() : '&' + paymentInstr.getPaymentMethod();
                    });
                }

                // Set the order payment method to the order custom attribute
                if (!empty(paymentMethods)) {
                    Transaction.wrap(function () {
                        order.custom.paymentMethodID = paymentMethods; // eslint-disable-line
                    });
                }

                // SKU Mapping Logic
                var itemsMapping = [];
                var plis = order.allProductLineItems.iterator();

                while (plis.hasNext()) {
                    var pli = plis.next();
                    if (!empty(pli) && !empty(pli.custom) && !empty(pli.price)) {
                        var itemMapping = [
                            pli.productID,
                            pli.custom.sku,
                            pli.productName,
                            pli.price.value + ' ' + pli.price.currencyCode,
                            pli.quantityValue
                        ].join('|');
                        itemsMapping.push(itemMapping);
                    }
                }
                Transaction.wrap(function () {
                    order.custom.itemsMapping = itemsMapping.join('\n');
                });
            }

            // Set the estimated delivery dates
            Transaction.wrap(function () {
                if (HookMgr.hasHook('dw.order.setDeliveryEstimateDate')) {
                    HookMgr.callHook('dw.order.setDeliveryEstimateDate', 'setDeliveryEstimateDate', order);
                }
            });

            // Set the customerName if not set already
            require('*/cartridge/scripts/util/SetOrderStatus').setCustomerName(order);

            /**    Removing the Emoji's from the shipping, billing address fields, customer email field.
                If the emoji's are any special character text cannot be removed then we will return with Error status**/
            if (!ApplePayHelper.removeEmojis(billingAddress, fieldsToCheckAddress) ||
                !ApplePayHelper.removeEmojis(shippingAddress, fieldsToCheckAddress) ||
                !ApplePayHelper.removeEmojis(order, fieldsToCheckOrder)) {
                error = new Status(Status.ERROR, errorCodes.emojiValidationFailed);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured while removing the emoji\'s from the Address fields');
                return error;
            }

            // check whether 'firstName' or 'lastName' fields are empty
            if (ApplePayHelper.isEmptyFieldPassed(billingAddress, ['firstName', 'lastName']) ||
                ApplePayHelper.isEmptyFieldPassed(shippingAddress, ['firstName', 'lastName'])) {
                error = new Status(Status.ERROR, errorCodes.invalidNameField);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured while authorizing order {0} because firstName or lastName fields are empty', order.orderNo);
                return error;
            }

            // check whether 'city' field is empty in shipping or billing address.
            if (ApplePayHelper.isEmptyFieldPassed(billingAddress, ['city']) ||
                ApplePayHelper.isEmptyFieldPassed(shippingAddress, ['city'])) {
                error = new Status(Status.ERROR, errorCodes.invalidCity);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured because city field is empty in shipping or billing address');
                return error;
            }

            if (ApplePayHelper.validatePostal(shippingAddress.postalCode, shippingAddress.countryCode.value) ||
                ApplePayHelper.validatePostal(billingAddress.postalCode, billingAddress.countryCode.value)) {
                error = new Status(Status.ERROR, errorCodes.postalCodeValidationFailed);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured due to postal code validation failure');
                return error;
            }

            // Format the phone number
            var phoneNumber = ApplePayHelper.formatPhoneNumber(event.payment.shippingContact.phoneNumber);
            if (phoneNumber) {
                order.getBillingAddress().setPhone(phoneNumber);
                order.getDefaultShipment().getShippingAddress().setPhone(phoneNumber);
            } else {
                // set original phone number if formatting failed
                order.getBillingAddress().setPhone(event.payment.shippingContact.phoneNumber);
                order.getDefaultShipment().getShippingAddress().setPhone(event.payment.shippingContact.phoneNumber);
            }
            // Update billing state code from ApplePay & PayPal if data is inappropriate
            COHelpers.updateStateCode(order); // eslint-disable-line

            // Update CA postal code if data is inappropriate
            COHelpers.updatePostalCode(order); // eslint-disable-line

            // auto-correct phone number if invalid
            COHelpers.autoCorrectPhonenumber(order);

            // Server side validation for shipping, billing, giftMessage and contact info
            var inputFieldsValidation = COHelpers.validateInputFields(order);
            if (inputFieldsValidation.error) {
                error = new Status(Status.ERROR, errorCodes.emojiNonLatinValidationFailed);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured due to emoji and non latin characters validation failure');
                return error;
            }

            // Set the gift flag for each product line item of the shipment: PHX-2514
            if (order && order.shipments.size() > 0) {
                var shippmets = order.shipments;
                collections.forEach(shippmets, function (shipment) {
                    if (shipment && shipment.gift) {
                        var productLineItems = shipment.getProductLineItems();
                        for (var j = 0; j < productLineItems.length; j++) {
                            var productLineItem = productLineItems[j];
                            productLineItem.gift = shipment.gift;
                            if (shipment.giftMessage) {
                                productLineItem.giftMessage = shipment.giftMessage;
                            }
                        }
                    }
                });
            }

            // Fedex AddressType update PHX-1305
            require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();

            order.setCustomerEmail(event.payment.shippingContact.emailAddress);
            if (empty(event.payment.billingContact.administrativeArea)) {
                order.getBillingAddress().setStateCode(null);
            }
            order.getBillingAddress().setCountryCode(event.payment.billingContact.countryCode.toUpperCase());
            order.getDefaultShipment().getShippingAddress().setCountryCode(event.payment.shippingContact.countryCode.toUpperCase());
            order.getBillingAddress().address2 = (event.payment.billingContact.addressLines && event.payment.billingContact.addressLines.length > 1) ? event.payment.billingContact.addressLines[1] : ''; // eslint-disable-line

            if (empty(order.getBillingAddress().getCountryCode().value)) {
                error = new Status(Status.ERROR, errorCodes.invalidCountryCode);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured while authorizing order {0} because countryCode is empty for biling address', order.orderNo);
                return error;
            }

            if (empty(order.getDefaultShipment().getShippingAddress().getCountryCode().value)) {
                error = new Status(Status.ERROR, errorCodes.invalidCountryCode);
                error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured while authorizing order {0} because countryCode is empty for shipping address', order.orderNo);
                return error;
            }
            var applePayPaymentInstrument = order.getPaymentInstruments('DW_APPLE_PAY').get(0);
            if (applePayPaymentInstrument) {
                Transaction.wrap(function () {
                    applePayPaymentInstrument.custom.paymentData = StringUtils.encodeBase64(JSON.stringify(event.payment.token));
                });
                var result = HookMgr.callHook('app.payment.processor.adyen', 'Authorize', order.orderNo, applePayPaymentInstrument);
                if (result.error) {
                    error = new Status(Status.ERROR, errorCodes.adyenAuthorizationFailed);
                    error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
                    ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured while authorizing order {0} because adyen authorization failed : {1}', order.orderNo, result.errorMessage);
                    return error;
                }
            }
        } catch (e) {
            ApplePayLogger.error('error while executing the authorizeOrderPayment hook ' + e.message);
            return new ApplePayHookResult(new Status(Status.ERROR, e.message), null);
        }
        return new Status(Status.OK);
    }
    return ApplePayCore.authorizeOrderPayment(order, event);
};

exports.getRequest = function (basket, request) {
    if (siteID === 'EU' || siteID === 'UKIE') {
        session.custom.applepaysession = 'yes';// eslint-disable-line
        var defaultShipment = basket.defaultShipment;
        var paazlDeliveryInfo = null;
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        if (defaultShipment && defaultShipment.custom && defaultShipment.custom.paazlDeliveryInfo) {
            try {
                paazlDeliveryInfo = paazlHelper.getSavedPaazlShippingOption(basket);
            } catch (e) {
                Logger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', e);
            }
        }

        try {
            var shippingAddress = defaultShipment.shippingAddress;
            if (paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION') {
                shippingAddress = {};
                var paazlShippingModel = paazlHelper.getPaazlShippingModel(basket);
                var pickupPointAddress = paazlShippingModel.shippingAddress;

                var fullNameSplit = pickupPointAddress.lastName.replace(' ', '***').split('***');
                shippingAddress.firstName = fullNameSplit[0];
                if (fullNameSplit.length > 1) shippingAddress.lastName = fullNameSplit[1];
                shippingAddress.address1 = pickupPointAddress.lastName;
                shippingAddress.address2 = (pickupPointAddress.address1).concat(' ' + pickupPointAddress.address2).concat(' ' + pickupPointAddress.streetNumberSuffix);
                shippingAddress.city = pickupPointAddress.city;
                shippingAddress.postalCode = pickupPointAddress.postalCode;
                if (pickupPointAddress.state) {
                    shippingAddress.stateCode = pickupPointAddress.state;
                } else {
                    shippingAddress.stateCode = '';
                }
                shippingAddress.countryCode = pickupPointAddress.countryCode;
                shippingAddress.phone = '';
            }

            if (shippingAddress != null && shippingAddress.address1 != null) {
                request.shippingContact = {};

                // present the user entered shipping address in the Apple Pay sheet
                if (shippingAddress.firstName != null) {
                    request.shippingContact.givenName = shippingAddress.firstName;
                }
                if (shippingAddress.lastName != null) {
                    request.shippingContact.familyName = shippingAddress.lastName;
                }
                if (shippingAddress.phone && shippingAddress.phone != null) {
                    request.shippingContact.phoneNumber = shippingAddress.phone;
                }
                if (basket.customer.authenticated) {
                    request.shippingContact.emailAddress = basket.customer.getProfile().getEmail();
                } else if (basket.customerEmail) {
                    request.shippingContact.emailAddress = basket.customerEmail;
                }

                request.shippingContact.addressLines = [];
                request.shippingContact.addressLines[0] = shippingAddress.address1;
                if (shippingAddress.address2 != null) {
                    request.shippingContact.addressLines[1] = shippingAddress.address2;
                }
                if (shippingAddress.city != null) {
                    request.shippingContact.locality = shippingAddress.city;
                }
                if (shippingAddress.stateCode && shippingAddress.stateCode != null) {
                    request.shippingContact.administrativeArea = shippingAddress.stateCode ? shippingAddress.stateCode.toUpperCase() : null;
                }
                if (shippingAddress.postalCode != null) {
                    request.shippingContact.postalCode = shippingAddress.postalCode;
                }

                var shippingCountryCode = paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION' ? shippingAddress.countryCode : shippingAddress.countryCode.value.toUpperCase();
                var Resource = require('dw/web/Resource');
                var shippingCountry = paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION' ? Resource.msg('global.country.' + shippingCountryCode, 'locale', null) : shippingAddress.countryCode.displayValue.toUpperCase();
                request.shippingContact.country = shippingCountry;
                request.shippingContact.countryCode = shippingCountryCode;
                request.countryCode = shippingCountryCode;
            } else {
                var Locale = require('dw/util/Locale');
                var currentLocale = Locale.getLocale(localeID);
                request.countryCode = currentLocale.country;
            }

            // Customized to set supported cards to Apple Pay
            var supportedNetworksPreference = Site.current.getCustomPreferenceValue('applePaySupportedNetworks');
            if (supportedNetworksPreference) {
                var JSONUtils = require('*/cartridge/scripts/util/JSONUtils');
                var supportedNetworksJSON = JSONUtils.parse(supportedNetworksPreference);
                if (supportedNetworksJSON && supportedNetworksJSON[request.countryCode]) {
                    request.supportedNetworks = supportedNetworksJSON[request.countryCode];
                }
            }

            // Displaying the user selected shipping methods in apple pay sheet under shipping methods.
            var result = ApplePayHelper.getApplicableShippingMethods(basket);
            if (!empty(result.applicableShippingMethodsObject) && result.applicableShippingMethodsObject != null) {
                request.shippingMethods = result.applicableShippingMethodsObject;
            }

            // repare and send line items objects and order total object to the apple pay sheet
            var responseObject = ApplePayHelper.getResponseObject(basket);
            if (!empty(responseObject) && responseObject != null) {
                request.lineItems = responseObject.lineItems;
                request.total = responseObject.total;
            }
        } catch (e) {
            ApplePayLogger.error('error while executing the getrequest hook ' + e);
            return new ApplePayHookResult(new Status(Status.ERROR, e.message), null);
        }
        return new ApplePayHookResult(new Status(Status.OK), null);
    }
    return ApplePayCore.getRequest(basket, request);
};
