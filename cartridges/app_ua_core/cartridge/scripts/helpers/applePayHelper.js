/* eslint-disable spellcheck/spell-checker */
'use strict';
var collections = require('*/cartridge/scripts/util/collections');
var Resource = require('dw/web/Resource');
var Logger = require('dw/system/Logger');
var ApplePayLogger = Logger.getLogger('ApplePay', 'Applepay');
var Money = require('dw/value/Money');
var ShippingMgr = require('dw/order/ShippingMgr');
var billingAddressFirstName = '';

/**
 * This function returns the shipping cost of the particular shipping method
 *
 * @param {dw.catalog.LineItemCtnr} basket - Basket instance returned from the API
 * @param {dw.order.ShippingMethod} shippingMethod - Shipping method passed to calculate its shipping cost
 * @returns {dw.value.Money} shippingPrice - Shipping cost
 *
 */
function getShippingMethodCost(basket, shippingMethod) {
    var Site = require('dw/system/Site');
    var shippingModel = ShippingMgr.getShipmentShippingModel(basket.defaultShipment);
    var shippingPrice = shippingModel.getShippingCost(shippingMethod).getAmount();
    var currencyCode = Site.getCurrent().getDefaultCurrency();

    try {
        //	iterate over all products in the basket and calculate their shipping cost and shipping discounts
        var productIter = basket.allProductLineItems.iterator();
        var surchargeTotal = new Money(0.0, currencyCode);
        while (productIter.hasNext()) {
            var pli = productIter.next();
            var product = pli.product;
            if (product != null) {
                var psc = ShippingMgr.getProductShippingModel(product).getShippingCost(shippingMethod);
                if (psc != null && psc.getAmount() != null && psc.isSurcharge()) {
                    surchargeTotal = surchargeTotal.add(new Money(pli.quantity.value * psc.getAmount().value, currencyCode));
                }
            }
        }
        if (surchargeTotal.value > 0) {
            shippingPrice = shippingPrice.add(surchargeTotal);
        }
    } catch (e) {
        ApplePayLogger.error('Error in ApplePayHelperModel.ds while executing function getShippingMethodCost:{0}.', e.message);
    }
    return shippingPrice;
}

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
    orderEstimated = orderEstimated.add(totalTax);
    orderEstimated = orderEstimated.subtract(totalDiscounts);

    responseObject.orderTotal = orderEstimated;

    responseObject.lineItems = [
        {
            type: 'final',
            label: 'Subtotal',
            amount: orderSubtotal.value
        },
        {
            type: 'final',
            label: basket.defaultShipment.shippingMethod ? basket.defaultShipment.shippingMethod.displayName : '',
            amount: shippingTotalPrice.value
        },
        {
            type: 'final',
            label: 'Estimated Tax',
            amount: totalTax.value
        }
    ];

    if (totalDiscounts.value !== 0) {
        var discounts = {
            type: 'final',
            label: 'Discounts',
            amount: '-' + totalDiscounts.value
        };
        responseObject.lineItems.push(discounts);
    }

    //	prepare order total response object
    responseObject.total = {
        label: 'Under Armour',
        amount: orderEstimated.value
    };
    return responseObject;
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
    collections.forEach(applePayShippingMethods, function (shippingMethod) {
        var shippingPrice;
        var description;
        if (!shippingMethod.custom.storePickupEnabled && !isHALshipping && !shippingMethod.custom.isHALshippingMethod) {
            // Created a variable to display the arrival date or time in apple pay sheet
            shippingPrice = getShippingMethodCost(basket, shippingMethod);
            description = '';
            applicableShippingMethods += '{';
            applicableShippingMethods += '"label" : "' + shippingMethod.displayName + '"';
            applicableShippingMethods += ', "identifier" : "' + shippingMethod.ID + '"';
            applicableShippingMethods += ', "amount" : "' + shippingPrice.value + '"';
            applicableShippingMethods += ', "detail" : "' + description + '"';
            applicableShippingMethods += '},';
        } else if (shippingMethod.custom.isHALshippingMethod && isHALshipping) {
            shippingPrice = getShippingMethodCost(basket, shippingMethod);
            description = '';
            applicableShippingMethods += '{';
            applicableShippingMethods += '"label" : "' + shippingMethod.displayName + '"';
            applicableShippingMethods += ', "identifier" : "' + shippingMethod.ID + '"';
            applicableShippingMethods += ', "amount" : "' + shippingPrice.value + '"';
            applicableShippingMethods += ', "detail" : "' + description + '"';
            applicableShippingMethods += '},';
        }
    });
    applicableShippingMethods = applicableShippingMethods.substr(0, applicableShippingMethods.length - 1);
    applicableShippingMethods += ']';
    applicableShippingMethods = JSON.parse(applicableShippingMethods);

    return {
        applicableShippingMethodsObject: applicableShippingMethods,
        shippingMethods: shippingMethods,
        applePayShippingMethods: applePayShippingMethods
    };
}


/**
 * @description Removes emoji's character from object attributes based on the array contains the attribute ID to consider for the emoji validation.
 * @param {Object} object - attributes to be checked from object
 * @param {Array} fieldsToCheck - An array which contains the attribute ID's to check
 * @return {boolean} if emoji's got removed then return true else return false
 */
function removeEmojis(object, fieldsToCheck) {
    for (var i = 0; i < fieldsToCheck.length; i++) {
        var field = fieldsToCheck[i];
        var value = object[field];
        if (!empty(value)) {
            var regexString = Resource.msg('emoji.regex', 'checkout', null);
            var updatedValue = value.replace(new RegExp(regexString, 'g'), '');
            if (empty(updatedValue.trim())) {
                ApplePayLogger.error('Not able to removing the emoji\'s from the field :: ' + field + ' :: value is : ' + value);
                return false;
            }
            if (updatedValue !== value) {
                object[fieldsToCheck[i]] = updatedValue; // eslint-disable-line no-param-reassign
            }
        }
    }
    return true;
}

/**
 * @description Format Phone numbers
 * @param {string} phoneNumber to be formated
 * @return {boolean} if updated field empty return false
 */
function formatPhoneNumber(phoneNumber) {
    if (!empty(phoneNumber) && /\d/.test(phoneNumber)) {
        return phoneNumber.match(/\d+/g).join('');
    }
    return false;
}

/**
 * @description Validate empty fields
 * @param {Object} object to be checked
 * @param {Array} fieldsToCheck to check
 * @return {boolean} if field empty return true
 */
function isEmptyFieldPassed(object, fieldsToCheck) {
    return fieldsToCheck.some(function (field) {
        if (field === 'suburb') {
            return empty(object.custom[field]);
        }
        return empty(object[field]);
    });
}

/**
 * checks postal codes
 * @param {string} postalCode - postal code to be checked
 * @param {string} country - country code in lower case
 * @return {boolean} true or false
 */
function validatePostal(postalCode, country) {
    // get regexp for current country
    var regexpRule = Resource.msg('postalcode.regexp', 'checkout', null);

    if ((country || '').toUpperCase() === 'CA') {
        regexpRule = Resource.msg('capostalcode.regexp', 'checkout', null);
    }

    var regex = new RegExp(regexpRule);
    return !regex.test(postalCode.trim());
}

/**
 * This method authorizes apple pay with Adyen
 * @param {Object} order - order object
 * @return {void}
 */
function authorize(order) {
    var Site = require('dw/system/Site');
    const LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var StringUtils = require('dw/util/StringUtils');
    var result = {
        error: true,
        errorMessage: Resource.msg('firstData.service.response.code.default.2', 'firstData', 'Something went wrong!')
    };
    try {
        var applePayService = LocalServiceRegistry.createService('applepay.authorize', {
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
            var authorizeAmount = applePayPaymentInstrument.paymentTransaction.amount.value * 100;
            var paymentData = applePayPaymentInstrument.custom.paymentData;
            var paymentToken = StringUtils.encodeBase64(paymentData);
            var request = {
                amount: {
                    currency: order.currencyCode,
                    value: authorizeAmount
                },
                reference: order.orderNo,
                paymentMethod: {
                    type: 'applepay',
                    'applepay.token': paymentToken
                },
                returnUrl: '',
                merchantAccount: Site.current.getCustomPreferenceValue('applePayMerchantID')
            };
            // Used to for mock response to return the response;
            billingAddressFirstName = order.billingAddress.firstName || '';
            var serviceResponse = applePayService.call(request);
            return serviceResponse;
        }
    } catch (e) {
        Logger.error('Error while Apple pay authorization. :: {0}', e.message);
        return result;
    }
    return result;
}

module.exports.getShippingMethodCost = getShippingMethodCost;
module.exports.getResponseObject = getResponseObject;
module.exports.formatPhoneNumber = formatPhoneNumber;
module.exports.isEmptyFieldPassed = isEmptyFieldPassed;
module.exports.removeEmojis = removeEmojis;
module.exports.validatePostal = validatePostal;
module.exports.getApplicableShippingMethods = getApplicableShippingMethods;
module.exports.authorize = authorize;
