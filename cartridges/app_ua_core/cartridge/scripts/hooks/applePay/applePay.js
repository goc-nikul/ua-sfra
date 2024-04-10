/* eslint-disable no-param-reassign */

var Status = require('dw/system/Status');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var ApplePayHookResult = require('dw/extensions/applepay/ApplePayHookResult');
var Transaction = require('dw/system/Transaction');
var ApplePayHelper = require('*/cartridge/scripts/helpers/applePayHelper');
var Logger = require('dw/system/Logger');
var ApplePayLogger = Logger.getLogger('ApplePay', 'ApplePay');
var Resource = require('dw/web/Resource');

var errorCodes = {
    invalidNameField: 'NAME_FIELDS_VALIDATION_FAILED',
    emojiValidationFailed: 'EMOJI_VALIDATION_FAILED',
    postalCodeValidationFailed: 'POSTALCODE_VALIDATION_FAILED',
    invalidCity: 'CITY_FIELD_VALIDATION_FAILED',
    invalidCountryCode: 'COUNTRY_CODE_VALIDATION_FAILED',
    emojiNonLatinValidationFailed: 'EMOJI_NON_LATIN_VALIDATION_FAILED'
};

// eslint-disable-next-line consistent-return
exports.authorizeOrderPayment = function (order, event) {
    try {
        var collections = require('*/cartridge/scripts/util/collections');
        var billingAddress = order.getBillingAddress();
        var shippingAddress = order.getDefaultShipment().getShippingAddress();
        var countryCode = shippingAddress.countryCode.value;
        var error;
        var fieldsToCheckAddress = ['address1', 'address2', 'firstName', 'lastName', 'city', 'postalCode'];
        var fieldsToCheckOrder = ['customerName'];
        var HookMgr = require('dw/system/HookMgr');
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');

        if (isAurusEnabled) {
            var aurusAuthorizeApplepay = require('*/cartridge/scripts/util/aurusAuthorizeApplepay').aurusAuthorizeApplepay;
            var result = aurusAuthorizeApplepay(order, event);
            if (result.error) {
                Logger.error('ERROR: Error in Auruspay applepay Pre-Auth request');
                return new Status(Status.ERROR);
            }
        }
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
                    order.custom.paymentMethodID = paymentMethods;
                });
            }
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
        if (countryCode !== 'AU' && (ApplePayHelper.isEmptyFieldPassed(billingAddress, ['city']) ||
            ApplePayHelper.isEmptyFieldPassed(shippingAddress, ['city']))) {
            error = new Status(Status.ERROR, errorCodes.invalidCity);
            error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
            ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured because city field is empty in shipping or billing address');
            return error;
        }
        // check whether 'city' field is empty in shipping or billing address.
        if (countryCode === 'AU' && (ApplePayHelper.isEmptyFieldPassed(billingAddress, ['suburb']) ||
            ApplePayHelper.isEmptyFieldPassed(shippingAddress, ['suburb']))) {
            error = new Status(Status.ERROR, errorCodes.invalidCity);
            error.addDetail(ApplePayHookResult.STATUS_REASON_DETAIL_KEY, ApplePayHookResult.REASON_FAILURE);
            ApplePayLogger.error('Error while processing authorizeOrderPayment method :: Error occured because city field is empty in shipping or billing address');
            return error;
        }

        // We are removing the city field set by applepay console. City is not mandatory field for AU
        if (countryCode === 'AU') {
            shippingAddress.city = '';
            billingAddress.city = '';
            billingAddress.custom.businessName = '';
            billingAddress.custom.suburb = event.payment.billingContact.locality;
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
            //	set original phone number if formatting failed
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
        order.getBillingAddress().setCountryCode(event.payment.billingContact.countryCode.toUpperCase());
        order.getDefaultShipment().getShippingAddress().setCountryCode(event.payment.shippingContact.countryCode.toUpperCase());
        order.getBillingAddress().address2 = (event.payment.billingContact.addressLines && event.payment.billingContact.addressLines.length > 1) ? event.payment.billingContact.addressLines[1] : '';

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

        if (PreferencesUtil.getValue('sr_enabled')) {
            Transaction.wrap(function () {
                require('int_shoprunner/cartridge/scripts/checkout/SaveShopRunnerOrderToken').saveToken(session, order);
            });
        }

        if (isAurusEnabled) {
            return new Status(Status.OK);
        }
    } catch (e) {
        ApplePayLogger.error('error while executing the authorizeOrderPayment hook ' + e.message);
        return new ApplePayHookResult(new Status(Status.ERROR, e.message), null);
    }
};

exports.getRequest = function (basket, request) {
    session.custom.applepaysession = 'yes';// eslint-disable-line
    try {
        var shippingAddress = basket.defaultShipment.shippingAddress;
        if (shippingAddress != null && shippingAddress.getAddress1() != null) {
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
            if (shippingAddress.stateCode != null) {
                request.shippingContact.administrativeArea = shippingAddress.stateCode ? shippingAddress.stateCode.toUpperCase() : null;
            }
            if (shippingAddress.postalCode != null) {
                request.shippingContact.postalCode = shippingAddress.postalCode;
            }

            var countryCode = '';
            if (!empty(shippingAddress.countryCode.displayValue) && shippingAddress.countryCode.displayValue.equalsIgnoreCase('UNITED STATES')) {
                var usCode = 'us';
                request.shippingContact.country = usCode;
                request.shippingContact.countryCode = usCode.toUpperCase();
                countryCode = usCode.toUpperCase();
            } else {
                request.shippingContact.country = shippingAddress.countryCode.displayValue;
                request.shippingContact.countryCode = shippingAddress.countryCode.displayValue.toUpperCase();
                countryCode = shippingAddress.countryCode.value.toUpperCase();
            }
            if (countryCode !== 'AU' && shippingAddress.city != null) {
                request.shippingContact.locality = shippingAddress.city;
            }
            if ('suburb' in shippingAddress.custom && shippingAddress.custom.suburb) {
                request.shippingContact.locality = shippingAddress.custom.suburb;
            }
            request.countryCode = countryCode;
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
};

// eslint-disable-next-line no-unused-vars
exports.cancel = function (basket) {
    return new ApplePayHookResult(new Status(Status.ERROR, Resource.msg('applepay.payment.cancel', 'checkout', null)), dw.web.URLUtils.https('Checkout-Begin', 'stage', 'payment', 'applePayRedirect', 'true'));
};

// eslint-disable-next-line no-unused-vars
exports.prepareBasket = function (basket, parameters) {
    // Calculate the basket
    Transaction.wrap(function () {
        basketCalculationHelpers.calculateTotals(basket);
    });
    return new ApplePayHookResult(new Status(Status.OK), null);
};

exports.failOrder = function (order, status) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    require('dw/order/OrderMgr').failOrder(order, true);

    if (status.getCode() === errorCodes.emojiValidationFailed) {
        session.privacy.applepayerror_emoji = true;
    }

    if (status.getCode() === errorCodes.invalidNameField) {
        session.privacy.applepayerror_emptyNameField = true;
    }

    if (status.getCode() === errorCodes.postalCodeValidationFailed) {
        session.privacy.applepayerror_postalCode = true;
    }

    if (status.getCode() === errorCodes.invalidCity) {
        session.privacy.applepayerror_emptyCityField = true;
    }

    if (status.getCode() === errorCodes.invalidCountryCode) {
        session.privacy.applepayerror_emptyCountryCode = true;
    }

    ApplePayLogger.error(Resource.msgf('applepay.order.failed', 'checkout', null, order.orderNo, status.getCode()));
    // log the order details for dataDog.
    var Site = require('dw/system/Site');
    var orderInfoLogger = Logger.getLogger('orderInfo', 'orderInfo');
    if (Site.current.getCustomPreferenceValue('enableOrderDetailsCustomLog') && order) {
        var paymentErorMessage = Resource.msgf('applepay.order.failed', 'checkout', null, order.orderNo, status.getCode());
        orderInfoLogger.info(COHelpers.getOrderDataForDatadog(order, true, paymentErorMessage, status.getCode()));
    }
    return new ApplePayHookResult(status, null);
};
