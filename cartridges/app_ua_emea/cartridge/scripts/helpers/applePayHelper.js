'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var Money = require('dw/value/Money');
var baseHelper = require('app_ua_core/cartridge/scripts/helpers/applePayHelper');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var ShippingMgr = require('dw/order/ShippingMgr');

var ApplePayLogger = Logger.getLogger('ApplePay', 'Applepay');
var billingAddressFirstName = '';

/**
 * This function prepares response object which will be passed back to apple pay.
 * @param {dw.catalog.LineItemCtnr} basket - Basket instance returned from the API
 * @param {dw.order.ShippingMethod} shippingMethod - Shipping method passed to calculate its shipping cost
 * @returns {Object} responseObject - Response object to pass it to apple pay
 *
 */
function getResponseObject(basket) {
    var responseObject = {};
    var currencyCode = session.currency.currencyCode;
    //	get order subtotal
    var orderSubtotal = new Money(0, currencyCode);
    if (!empty(basket) && !empty(basket.getAllProductLineItems()) && basket.getAllProductLineItems().length > 0) {
        collections.forEach(basket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.getAdjustedPrice().valueOrNull != null) {
                orderSubtotal = orderSubtotal.add(lineItem.getAdjustedPrice());
            }
        });
    }

    //	calculate shipping discounts
    var zeroValue = new Money(0, currencyCode);
    var shippingExclDiscounts = basket.shippingTotalPrice.valueOrNull != null ? basket.shippingTotalPrice : zeroValue;
    var shippingInclDiscounts = basket.getAdjustedShippingTotalPrice().valueOrNull != null ? basket.getAdjustedShippingTotalPrice() : zeroValue;
    var shippingDiscount = shippingExclDiscounts.subtract(shippingInclDiscounts);

    //	calculate order level discounts
    var merchTotalExclOrderDiscounts = basket.getAdjustedMerchandizeTotalPrice(false);
    var merchTotalInclOrderDiscounts = basket.getAdjustedMerchandizeTotalPrice(true);
    var orderDiscount = merchTotalExclOrderDiscounts.subtract(merchTotalInclOrderDiscounts);

    //	get total discount
    var totalDiscounts = new Money(0, currencyCode);
    totalDiscounts = shippingDiscount.add(orderDiscount);

    // get total tax
    var totalTax = new Money(0, currencyCode);
    if (basket.totalTax.available) {
        totalTax = basket.totalTax;
    }

    //	get shipping price
    var shippingTotalPrice = new Money(0, currencyCode);
    if (basket.shippingTotalPrice.available) {
        shippingTotalPrice = basket.shippingTotalPrice;
    }

    //	get order total
    var orderEstimated = new Money(0, currencyCode);
    orderEstimated = orderEstimated.add(orderSubtotal);
    orderEstimated = orderEstimated.add(shippingTotalPrice);
    orderEstimated = orderEstimated.subtract(totalDiscounts);

    var shippingMethodLabel = basket.defaultShipment.shippingMethod ? basket.defaultShipment.shippingMethod.displayName : '';
    // From Paazl cartridge
    var shipment = basket.defaultShipment;
    if (shipment && shipment.custom && typeof shipment.custom.paazlDeliveryInfo !== undefined && shipment.custom.paazlDeliveryInfo) {
        var paazlHelper = require('*/cartridge/scripts/helpers/paazlHelper');
        var paazlStatus = paazlHelper.getPaazlStatus(shipment);
        if (paazlStatus.active) {
            try {
                var paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
                shippingMethodLabel = paazlDeliveryInfo.name ? paazlDeliveryInfo.name : shippingMethodLabel;
            } catch (error) {
                ApplePayLogger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
            }
        }
    }

    responseObject.orderTotal = orderEstimated;

    responseObject.lineItems = [
        {
            type: 'final',
            label: 'Subtotal',
            amount: orderSubtotal.value
        },
        {
            type: 'final',
            label: shippingMethodLabel,
            amount: shippingTotalPrice.value - shippingDiscount.value
        },
        {
            type: 'final',
            label: Resource.msg('label.estimated.sales.tax', 'cart', null),
            amount: totalTax.value
        }
    ];


    //	prepare line item if no order level discount response object
    if (orderDiscount.value !== 0) {
        var orderLevelDiscount = {
            type: 'final',
            label: 'Discounts',
            amount: '-' + orderDiscount.value
        };
        responseObject.lineItems.push(orderLevelDiscount);
    }

    //	prepare order total response object
    responseObject.total = {
        label: 'Under Armour',
        amount: orderEstimated.value
    };
    return responseObject;
}

/**
 * checks postal codes
 * @param {string} postalCode - postal code to be checked
 * @param {string} countryCode - country code in lower case
 * @return {boolean} true or false
 */
function validatePostal(postalCode, countryCode) {
    // get regexp for current country
    var postalCodeRegex = {
        US: /^\d{5}$|^\d{5}-\d{4}$/,
        CA: /^[ABCEGHJKLMNPRSTVXY]\d[ABCEGHJKLMNPRSTVWXYZ]( ){1}\d[ABCEGHJKLMNPRSTVWXYZ]\d$/i,
        AT: /(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
        BE: /(^\d{4}?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
        DK: /([0-9]{4})$/,
        FR: /(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
        DE: /(^\d{5}(-\d{4})?$)|(^[abceghjklmnprstvxyABCEGHJKLMNPRSTVXY]{1}\d{1}[A-Za-z]{1} *\d{1}[A-Za-z]{1}\d{1}$)/,
        GB: /^ ?(([BEGLMNSWbeglmnsw][0-9][0-9]?)|(([A-PR-UWYZa-pr-uwyz][A-HK-Ya-hk-y][0-9][0-9]?)|(([ENWenw][0-9][A-HJKSTUWa-hjkstuw])|([ENSWenw][A-HK-Ya-hk-y][0-9][ABEHMNPRVWXYabehmnprvwxy])))) ?[0-9][ABD-HJLNP-UW-Zabd-hjlnp-uw-z]{2}$/i,
        IE: /^[0-9a-zA-Z]{3}[ ][0-9a-zA-Z]{4}$/i,
        IT: /([0-9]{5})$/,
        NL: /^[1-9][0-9]{3} ?(?!sa|sd|ss)[a-zA-Z]{2}$/i,
        ES: /([0-9]{5})$/,
        SE: /[0-9]{3} ?(?!sa|sd|ss)[0-9]{2}$/,
        CH: /([0-9]{4})$/,
        LI: /([0-9]{4})$/,
        NO: /([0-9]{4})$/,
        PL: /(([0-9]{5})|([0-9]{2}-[0-9]{3}))$/,
        PT: /(([0-9]{7})|([0-9]{4}-[0-9]{3}))$/,
        AU: /^(0[289][0-9]{2})|([1345689][0-9]{3})|(2[0-8][0-9]{2})|(290[0-9])|(291[0-4])|(7[0-4][0-9]{2})|(7[8-9][0-9]{2})$/
    };
    var regexpRule = countryCode && postalCodeRegex[countryCode] ? postalCodeRegex[countryCode] : Resource.msg('postalcode.regexp', 'cart', null);
    var regex = new RegExp(regexpRule);
    var postalCodeValue = postalCode ? postalCode.trim() : '';
    return !regex.test(postalCodeValue.trim());
}

/**
 * Returns Apple Pay payment option Adyen Merchant ID
 * @param {string} currencyCode - Order Currency Code
 * @return {string} Merchant ID
 */
function getMerchantID(currencyCode) {
    var Site = require('dw/system/Site');
    var merchantID = '';
    if (currencyCode && Site.getCurrent().getCustomPreferenceValue('allowMultipleMerchantIDs')) {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var MerchantIDsJSON = PreferencesUtil.getJsonValue('applePayMultipleMerchantIDs');
        if (typeof MerchantIDsJSON === 'object' && MerchantIDsJSON[currencyCode]) {
            merchantID = MerchantIDsJSON[currencyCode];
        }
    } else {
        merchantID = Site.getCurrent().getCustomPreferenceValue('applePayMerchantID');
    }
    return merchantID;
}

/**
 * This method authorizes apple pay with Adyen
 * @param {Object} order - order object
 * @return {void}
 */
function authorize(order) {
    const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var result = {
        error: true,
        errorMessage: Resource.msg('adyen.applepay.error', 'adyen', null)
    };
    try {
        var authService = LocalServiceRegistry.createService('applepay.authorize', {
            createRequest: function (svc, params) {
                svc.setRequestMethod('POST');
                // svc.setAuthentication('NONE');
                svc.addHeader('Content-Type', 'application/json');
                // svc.setURL(params.graphQLApiUrl);
                var request = JSON.stringify(params);
                return request;
            },
            parseResponse: function (svc, response) {
                return response;
            },
            // eslint-disable-next-line no-unused-vars
            mockCall: function (svc, params) {
                var responseObj = {};
                if (billingAddressFirstName === 'Accept') {
                    responseObj = {
                        additionalData: {
                            alias: 'B340242916829178',
                            aliasType: 'Default'
                        },
                        pspReference: '883603134047754F',
                        resultCode: 'Authorised',
                        amount: {
                            currency: 'USD',
                            value: 3499
                        },
                        merchantReference: 'DEV08-EU03-US-00090000'
                    };
                } else if (billingAddressFirstName === 'Decline' || billingAddressFirstName === '') {
                    responseObj = {
                        pspReference: '851563882585825A',
                        refusalReason: 'Expired Card',
                        resultCode: 'Refused',
                        refusalReasonCode: '6'
                    };
                }
                return {
                    statusCode: 200,
                    statusMessage: 'Success',
                    text: JSON.stringify(responseObj)
                };
            }
        });
        var applePayPaymentInstrument = order.getPaymentInstruments('DW_APPLE_PAY').get(0);
        if (applePayPaymentInstrument) {
            var applePayPaymentTransaction = applePayPaymentInstrument.paymentTransaction;
            var authorizeAmount = applePayPaymentTransaction.amount.value * 100;
            var paymentData = applePayPaymentInstrument.custom.paymentData;
            var currencyCode = applePayPaymentTransaction.amount.currencyCode;
            var merchantAccountID = getMerchantID(currencyCode);
            var shippingAddress = order.defaultShipment.shippingAddress;
            var billingAddress = order.billingAddress;

            var authData = {
                _v: '1',
                merchant_account_id: merchantAccountID,
                session_id: session.sessionID,
                order_no: order.orderNo,
                payment: {
                    payment_id: applePayPaymentInstrument.paymentTransaction.UUID,
                    type: 'ApplePay',
                    amount: Math.round(authorizeAmount),
                    currency: currencyCode,
                    token: paymentData
                },
                client: {
                    ip_address: request.httpRemoteAddress, // eslint-disable-line
                    user_agent: request.httpUserAgent, // eslint-disable-line
                    accept_header: request.httpHeaders.accept // eslint-disable-line
                },
                customer_info: {
                    customer_no: order.customerNo,
                    email: order.customerEmail,
                    customer_name: order.customerName
                },
                shipping_address: {
                    first_name: shippingAddress.firstName,
                    last_name: shippingAddress.lastName,
                    address1: shippingAddress.address1,
                    city: shippingAddress.city,
                    state_code: shippingAddress.stateCode,
                    postal_code: shippingAddress.postalCode,
                    country_code: shippingAddress.countryCode.value
                },
                billing_address: {
                    first_name: billingAddress.firstName,
                    last_name: billingAddress.lastName,
                    address1: billingAddress.address1,
                    city: billingAddress.city,
                    state_code: billingAddress.stateCode,
                    postal_code: billingAddress.postalCode,
                    country_code: billingAddress.countryCode.value
                }
            };

            // Used to for mock response to return the response;
            billingAddressFirstName = order.billingAddress.firstName || '';
            var serviceResponse = authService.call(authData);
            return serviceResponse;
        }
    } catch (e) {
        ApplePayLogger.error('Error while Apple pay authorization. :: {0}', e.message);
        return result;
    }
    return result;
}

/**
 * This function returns all the applicable shipping method based on the country selected in shipping address section.
 * @param {dw.catalog.LineItemCtnr} basket - Basket instance returned from the API
 * @returns {Object} - Shipping method objects
 */
function getApplicableShippingMethods(basket) {
    // Get available shipping methods.
    var shipment = require('dw/order/Shipment');
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var isHALshipping = (!empty(currentBasket) && 'isCommercialPickup' in currentBasket.custom && currentBasket.custom.isCommercialPickup) ? currentBasket.custom.isCommercialPickup : false;
    shipment = basket.defaultShipment;
    var address = {};
    var shippingAddress = basket.defaultShipment.shippingAddress;
    if (empty(shippingAddress)) {
        return {};
    }

    address.countryCode = shippingAddress.countryCode.value;
    address.stateCode = shippingAddress.stateCode;
    address.postalCode = shippingAddress.postalCode;
    address.city = shippingAddress.city;
    address.address1 = shippingAddress.address1;
    address.address2 = shippingAddress.address2;

    var shipmentShippingModel = ShippingMgr.getShipmentShippingModel(shipment);
    var shippingMethods;

    if (address) {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods(address);
    } else {
        shippingMethods = shipmentShippingModel.getApplicableShippingMethods();
    }

    var hasPreOrderProductsInBasket = false;
    if (basket) {
        collections.forEach(basket.productLineItems, function (productLineItem) {
            if (productLineItem && productLineItem.product && productLineItem.product.custom && productLineItem.product.custom.isPreOrder) {
                if (!hasPreOrderProductsInBasket) {
                    hasPreOrderProductsInBasket = true;
                }
            }
        });
    }

    var ArrayList = require('dw/util/ArrayList');
    var applePayShippingMethods = new ArrayList();

    collections.forEach(shippingMethods, function (method) {
        if (basket.defaultShipment.shippingMethod.ID === method.ID) {
            if (method.ID === 'standard-pre-order-AK-HI') {
                if (hasPreOrderProductsInBasket) {
                    applePayShippingMethods.add(method);
                }
            } else {
                applePayShippingMethods.add(method);
            }
        }
    });

    collections.forEach(shippingMethods, function (method) {
        if (basket.defaultShipment.shippingMethod.ID !== method.ID && method.ID !== 'eGift_Card') {
            if (method.ID === 'standard-pre-order-AK-HI') {
                if (hasPreOrderProductsInBasket) {
                    applePayShippingMethods.add(method);
                }
            } else {
                applePayShippingMethods.add(method);
            }
        }
    });

    // Getting all the available shipping methods for selected country & state code and filtering the shipping methods
    var applicableShippingMethods = '[';
    // From Paazl cartridge
    if (shipment && shipment.custom && typeof shipment.custom.paazlDeliveryInfo !== undefined && shipment.custom.paazlDeliveryInfo) {
        try {
            var paazlDeliveryInfo = JSON.parse(shipment.custom.paazlDeliveryInfo);
            applicableShippingMethods += '{';
            applicableShippingMethods += '"label" : "' + paazlDeliveryInfo.name + '"';
            applicableShippingMethods += ', "identifier" : "' + paazlDeliveryInfo.ID + '"';
            applicableShippingMethods += ', "amount" : "' + paazlDeliveryInfo.cost + '"';
            applicableShippingMethods += ', "detail" : "' + paazlDeliveryInfo.carrierDescription + '"';
            applicableShippingMethods += '},';
        } catch (error) {
            ApplePayLogger.error('Error parsing custom attribute paazlDeliveryInfo from shipment. Error: {0}.', error);
        }
    } else {
        collections.forEach(applePayShippingMethods, function (shippingMethod) {
            var shippingPrice;
            var description;
            if (!shippingMethod.custom.storePickupEnabled && !isHALshipping && !shippingMethod.custom.isHALshippingMethod) {
                // Created a variable to display the arrival date or time in apple pay sheet
                shippingPrice = baseHelper.getShippingMethodCost(basket, shippingMethod);
                description = '';
                applicableShippingMethods += '{';
                applicableShippingMethods += '"label" : "' + shippingMethod.displayName + '"';
                applicableShippingMethods += ', "identifier" : "' + shippingMethod.ID + '"';
                applicableShippingMethods += ', "amount" : "' + shippingPrice.value + '"';
                applicableShippingMethods += ', "detail" : "' + description + '"';
                applicableShippingMethods += '},';
            } else if (shippingMethod.custom.isHALshippingMethod && isHALshipping) {
                shippingPrice = baseHelper.getShippingMethodCost(basket, shippingMethod);
                description = '';
                applicableShippingMethods += '{';
                applicableShippingMethods += '"label" : "' + shippingMethod.displayName + '"';
                applicableShippingMethods += ', "identifier" : "' + shippingMethod.ID + '"';
                applicableShippingMethods += ', "amount" : "' + shippingPrice.value + '"';
                applicableShippingMethods += ', "detail" : "' + description + '"';
                applicableShippingMethods += '},';
            }
        });
    }

    applicableShippingMethods = applicableShippingMethods.substr(0, applicableShippingMethods.length - 1);
    applicableShippingMethods += ']';
    applicableShippingMethods = JSON.parse(applicableShippingMethods);

    return {
        applicableShippingMethodsObject: applicableShippingMethods,
        shippingMethods: shippingMethods,
        applePayShippingMethods: applePayShippingMethods
    };
}

baseHelper.getApplicableShippingMethods = getApplicableShippingMethods;
baseHelper.getResponseObject = getResponseObject;
baseHelper.validatePostal = validatePostal;
baseHelper.authorize = authorize;
module.exports = baseHelper;
