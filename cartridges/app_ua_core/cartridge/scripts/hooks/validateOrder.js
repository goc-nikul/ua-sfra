'use strict';

var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');


/**
 * Used to log information if a basket fails validation. Currently only logs shipment, address, and product data.
 * @param {dw.order.Basket} basket - basket with order being place
 */
function logFailedValidation(basket) {
    // Putting a try-catch so that placing orders does not fail on something like a null ref error
    try {
        var collections = require('*/cartridge/scripts/util/collections');
        let returnString = 'Failed order validation: \n';
        returnString += 'Shipments: \n';
        collections.every(basket.shipments, function (shipment) {
            if (shipment) {
                returnString += '-- ShipmentID: ' + shipment.ID + '\n';
                let shippingMethod = shipment.shippingMethod;
                if (shippingMethod && shippingMethod.custom) {
                    returnString += '-- StorePickupEnabled: ' + shippingMethod.custom.storePickupEnabled + '\n';
                }

                let shipmentCustom = shipment.custom;
                if (shipmentCustom) {
                    returnString += '-- HasStoreID: ' + (shipmentCustom && shipmentCustom.fromStoreId) + '\n';
                }

                let address = shipment.shippingAddress;
                if (address) {
                    returnString += '-- Address1: ' + address.address1 + '\n';
                } else {
                    returnString += '-- Address empty\n';
                }
            }
        });

        returnString += 'Products:\n';
        collections.every(basket.productLineItems, function (item) {
            if (item && item.product) {
                returnString += '-- ProductID: ' + item.product.ID + '\n';
            }
        });

        Logger.info(returnString);
    } catch (error) {
        Logger.error('Error creating log validation message in logFailedValidation(basket): ${0}', error);
    }
}


/**
 * validates the current users basket
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {boolean} validateTax - boolean that determines whether or not to validate taxes
 * @returns {Object} an error object
 */
function validateOrder(basket, validateTax) {
    var result = { error: false, message: null };

    if (!basket) {
        result.error = true;
        result.message = Resource.msg('error.cart.expired', 'cart', null);
    } else {
        // var productExistence = validationHelpers.validateProducts(basket);   PHX-177: Calling this method CheckoutServices-PlaceOrder route
        var validCoupons = validationHelpers.validateCoupons(basket);
        var validShipments = validationHelpers.validateShipments(basket);
        var totalTax = true;

        if (validateTax) {
            totalTax = basket.totalTax.available;
        }

        // PHX-177: This below Code snippet will be used to verify the inventory check that is been handled in CheckoutServices-PlaceOrder route,
        // hence the below code commented
        /* if (productExistence.error || !productExistence.hasInventory) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } */

        if (validCoupons.error) {
            result.error = true;
            result.message = Resource.msg('error.invalid.coupon', 'cart', null);
        } else if (basket.productLineItems.getLength() === 0) {
            result.error = true;
            result.message = Resource.msg('error.card.invalid.productlineitem', 'cart', null);
        } else if (!basket.merchandizeTotalPrice.available) {
            result.error = true;
            result.message = Resource.msg('error.cart.or.checkout.error', 'cart', null);
        } else if (!totalTax) {
            result.error = true;
            result.message = Resource.msg('error.invalid.tax', 'cart', null);
        } else if (!validShipments) {
            result.error = true;
            result.message = Resource.msg('error.card.invalid.shipments', 'cart', null);
        }
        if (result.error) {
            logFailedValidation(basket);
        }
    }

    return result;
}

exports.validateOrder = validateOrder;
