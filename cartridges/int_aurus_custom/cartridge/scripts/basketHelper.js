'use strict';

var base = module.superModule;

var collections = require('*/cartridge/scripts/util/collections');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');

/**
 * This method convert string into JSON object
 * @param {string} lineItemPriceAdjustmentString - lineItemPriceAdjustmentString
 * @returns {Object} return Json array object
 */
function convertIntoJSONObj(lineItemPriceAdjustmentString) {
    var lineItemPriceAdjustmentObj = {};
    var convertedAdjustment = lineItemPriceAdjustmentString.replace(/{|}/g, '');
    var keyValueArray = convertedAdjustment.split(',');
    keyValueArray.forEach(function (property) {
        var element = property.split('=');
        lineItemPriceAdjustmentObj[element[0]] = element[1];
    });
    return lineItemPriceAdjustmentObj;
}

/**
 * This method updates the necessary custom attributes to the basket response
 *
 * @param {Object} basketResponse - basket response to ocapi call
 * @returns{dw.system.Status} status response
 */
function updateResponse(basketResponse) {
    var Status = require('dw/system/Status');
    var ProductMgr = require('dw/catalog/ProductMgr');
    var ShippingHelper = require('*/cartridge/scripts/checkout/shippingHelpers');
    var DeliveryHelper = require('app_ua_core/cartridge/scripts/util/DeliveryHelper');
    var StringUtils = require('dw/util/StringUtils');
    var basketValidationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
    var Resource = require('dw/web/Resource');
    base.updateBasket(basketResponse);
    try {
        var productItems = basketResponse.product_items;
        var arrayOfLimits = [];
        /* Assign response arg to local variable to prevent eslint no-param-reassign
         * errors.  Object args are passed by reference, so changes will still apply.
         */
        var response = basketResponse;
        var priceAdjustmentsArrayObj = [];
        var lineItemPriceAdjustmentsArray = response.c_lineItemPriceAdjustments;
        if (!empty(lineItemPriceAdjustmentsArray) && lineItemPriceAdjustmentsArray.length > 0) {
            for (var i = 0; i < lineItemPriceAdjustmentsArray.length; i++) {
                if (!empty(lineItemPriceAdjustmentsArray[i])) {
                    var lineItemPriceAdjustmentObj = convertIntoJSONObj(lineItemPriceAdjustmentsArray[i]);
                    priceAdjustmentsArrayObj.push(lineItemPriceAdjustmentObj);
                }
            }
        }
        collections.forEach(productItems, function (productItem) {
            var qty = productItem.quantity;
            var product = ProductMgr.getProduct(productItem.product_id);
            var lineItemQtyLimit = basketValidationHelpers.getLineItemInventory(product, true, false);
            productItem.c_isPreOrder = product.custom.isPreOrder; // eslint-disable-line no-param-reassign
            if (qty > lineItemQtyLimit) {
                arrayOfLimits.push({
                    itemID: productItem.item_id,
                    productID: productItem.product_id,
                    c_LimitedExceeded: (qty - lineItemQtyLimit),
                    c_correctQuantity: lineItemQtyLimit
                });
            }
            var AdjusmentPriceArray = [];
            productItem.c_masterSizePreferJSON = product.variant ? product.variationModel.master.custom.masterSizePrefJSON : ''; // eslint-disable-line no-param-reassign
            productItem.c_variationSizePrefJSON = product.variant ? product.custom.variationSizePrefJSON : '';  // eslint-disable-line no-param-reassign
            for (var j = 0; j < priceAdjustmentsArrayObj.length; j++) {
                if (priceAdjustmentsArrayObj[j].product_id === productItem.productId) {
                    AdjusmentPriceArray.push(priceAdjustmentsArrayObj[j]);
                }
            }
            productItem.c_lineItemPriceAdjustments = AdjusmentPriceArray; // eslint-disable-line no-param-reassign
        });

        response.c_LimitedExceeded = false;
        if (!empty(arrayOfLimits)) {
            response.c_LimitedExceeded = true;
            response.c_LimitedExceededItems = arrayOfLimits;
        }

        // Add un adjusted (before discounts) merchandise total amount to response document
        var merchandiseTotalPrice = parseFloat(basketResponse.productSubTotal);
        response.c_merchandise_total_price = merchandiseTotalPrice;

        // add the flash error message if the basket has paypal payment instrument and the token got expired.
        if (response.payment_instruments && response.payment_instruments.length > 0) {
            collections.forEach(response.payment_instruments, function (paymentInstrument) {
                if (paymentInstrument.payment_method_id === 'PayPal') {
                    var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
                    var Calendar = require('dw/util/Calendar');
                    var timezoneHelper = new TimezoneHelper();
                    var currentDate = new Calendar(timezoneHelper.getCurrentSiteTime());
                    var tokenExpirationDate = new Calendar(new Date(paymentInstrument.c_paypalTokenExpiryTime));
                    if (currentDate.after(tokenExpirationDate)) {
                        response.addFlash({
                            type: 'PaymentMethodTokenExpired',
                            message: Resource.msg('error.paypal.invalid.token', 'cart', null),
                            path: '$.payment_instruments[0].payment_method_id'
                        });
                    }
                }
            });
        }
        response.c_lineItemPriceAdjustments = [];
        // update the estimated arrival date on the selected shipping method for each shipment
        if (response.shipments && response.shipments.length > 0) {
            collections.forEach(response.shipments, function (shipment) {
                if (shipment.shippingMethod && !empty(shipment.shippingMethod.id)) {
                    var shippingMethodId = shipment.shippingMethod.id;
                    var shippingMethod = ShippingHelper.getShippingMethodByID(shippingMethodId);
                    if (!empty(shippingMethod)) {
                        var shippingDeliveryDates = DeliveryHelper.getShippingDeliveryDates(shippingMethod, true);
                        if (shippingDeliveryDates) {
                            // eslint-disable-next-line no-param-reassign
                            shipment.shippingMethod.c_deliveryDateMin = StringUtils.formatCalendar(shippingDeliveryDates[0], 'yyyy-MM-dd');
                            // eslint-disable-next-line no-param-reassign
                            shipment.shippingMethod.c_deliveryDateMax = StringUtils.formatCalendar(shippingDeliveryDates[1], 'yyyy-MM-dd');
                        }
                    }
                }
            });
        }
        // update shipping items with the custom attribute merchandise_total_price
        if (response.shippingItems && response.shippingItems.length > 0) {
            var shippingLineItems = response.shippingItems;
            collections.forEach(shippingLineItems, function (shippingItem) {
                shippingItem.c_maoExtendedPrice = parseFloat(shippingItem.price); // eslint-disable-line no-param-reassign
            });
        }
        // updated customer ID value to MAO attribute
        response.c_sfccCustomerId = customer.authenticated && customer.profile ? customer.profile.customerNo : customer.ID;
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }

    try {
        // Updating MAO Price Adjustment Object
        collections.forEach(response.product_items, function (productItem) { // eslint-disable-line
            collections.forEach(productItem.price_adjustments, function (priceAdjustment) {
                let priceAdjustmentJSON = [];
                let priceAdjustmentObject = {};
                priceAdjustmentObject.applied_discount = {
                    type: 'AMOUNT'
                };
                priceAdjustmentObject.coupon_code = '';
                priceAdjustmentObject.creation_date = priceAdjustment.creation_date.toString();
                priceAdjustmentObject.custom = priceAdjustment.custom;
                priceAdjustmentObject.item_text = priceAdjustment.item_text;
                priceAdjustmentObject.last_modified = '';
                priceAdjustmentObject.manual = priceAdjustment.manual;
                priceAdjustmentObject.price = parseInt(priceAdjustment.price.toString(), 10).toFixed(2);
                priceAdjustmentObject.price_adjustment_id = priceAdjustment.price_adjustment_id;
                priceAdjustmentObject.promotion_id = priceAdjustment.promotion_id;
                priceAdjustmentObject.campaign_id = '';
                priceAdjustmentObject.c_unitDiscount = (parseInt(priceAdjustment.price.toString(), 10) / productItem.quantity).toFixed(2);
                priceAdjustmentJSON.push(priceAdjustmentObject);
                priceAdjustment.c_priceAdjustmentJSON = priceAdjustmentJSON; // eslint-disable-line
            });
        });
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateMAOPriceAdjustmentJSONError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }

    return new Status(Status.OK);
}

/**
 * This returns the payment id from request
 * @returns {string} - payment method name
 */
function getPaymentRequest() {
    var params = request.getHttpParameters(); // eslint-disable-line

    var paypalParams = params.get('paypal');
    var paypal = paypalParams && paypalParams[0];
    if (paypal) {
        return 'paypal';
    }

    var klarnaParams = params.get('klarna');
    var klarna = klarnaParams && klarnaParams[0];
    if (klarna) {
        return 'klarna';
    }

    return '';
}

/**
 * This returns the Session id from request
 * @returns {string} - session id
 */
function getSessionIDRequest() {
    var params = request.getHttpParameters(); // eslint-disable-line

    var sessionidParams = params.get('sessionid');
    if (sessionidParams && sessionidParams.length) {
        return sessionidParams[0];
    }

    return '';
}

base.updateResponse = updateResponse;
base.getPaymentRequest = getPaymentRequest;
base.getSessionIDRequest = getSessionIDRequest;

module.exports = base;
