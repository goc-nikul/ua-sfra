'use strict';

/* eslint-disable no-unused-vars */

/* API Includes */
var Status = require('dw/system/Status');
var hooksHelper = require('*/cartridge/scripts/helpers/hooks');
var basketCalculationHelpers = require('*/cartridge/scripts/helpers/basketCalculationHelpers');
var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
var Resource = require('dw/web/Resource');
var validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');


/**
 * This method Remove Invalid Loyalty Coupon Code from Basket for Loyalty users
 *
 * @param {dw.order.Basket} basket - basket
 */
function removeInvalidLoyaltyCouponsBeforePlaceOrder(basket) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        try {
            loyaltyHelper.removeInvalidLoyaltyCoupons(basket);
        } catch (e) {
            errorLogHelper.handleOcapiHookErrorStatus(e);
        }
    }
}
/**
 * Log basket info to investigate the root cause if any error occurs on address validation at the place order step.
 * @param {dw.order.Basket} basket  - Current basket
 */
function logBasketInfo(basket) {
    var Logger = require('dw/system/Logger').getLogger('OCAPI', 'OCAPI');
    try {
        const basketHelper = require('~/cartridge/scripts/basketHelper');
        let basketJSON = basketHelper.getBasketInfoForLog(basket);
        Logger.error(JSON.stringify(basketJSON));
    } catch (e) {
        Logger.error('Error while logging basket info: {0} {1}', e.message, e.stack);
    }
}
/**
 * validates order before creating
 * @param {dw.order.Basket} basket  - Current basket
 * @returns {Object} Status
 */
function validateOrder(basket) {
    try {
        // Remove empty shipments
        var giftCardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
        giftCardHelper.removeEmptyShipments(basket);
        // validate for real time inventory
        var validatedProducts = validationHelpers.validateProductsInventory(basket, 'PlaceOrder');
        if (validatedProducts.availabilityError) {
            var error = new Error(Resource.msg('label.not.available.items', 'common', null));
            error.name = 'QtyLimitExceededException';
            throw error;
        }
        // validates address type
        var validAddressType = COHelpers.ensureValidAddressType(basket);
        if (!validAddressType) {
            logBasketInfo(basket);
            throw new Error(Resource.msg('address.invalid.type', 'address', null));
        }
        // validates order
        basketCalculationHelpers.calculateTotals(basket);
        var validationOrderStatus = hooksHelper('app.validate.order', 'validateOrder', basket, require('*/cartridge/scripts/hooks/validateOrder').validateOrder);
        if (validationOrderStatus.error) {
            throw new Error(validationOrderStatus.message);
        }
        // klarna session management call
        var basketHelper = require('~/cartridge/scripts/basketHelper');
        basketHelper.manageKlarnaSession(basket);
        // validates payment
        var validPayment = COHelpers.validatePaymentCards(basket, request.geolocation.countryCode, customer); // eslint-disable-line
        if (validPayment.error) {
            logBasketInfo(basket);
            throw new Error(Resource.msg('error.payment.not.valid', 'checkout', null));
        }
        // Re-calculate the payments.
        var calculatedPaymentTransactionTotal = COHelpers.calculatePaymentTransaction(basket);
        if (calculatedPaymentTransactionTotal.error) {
            logBasketInfo(basket);
            throw new Error(Resource.msg('error.payment.not.valid', 'checkout', null));
        }
        // validates payment instrument
        var isPaymentAmountMatches = COHelpers.isPaymentAmountMatches(basket);
        if (!isPaymentAmountMatches) {
            logBasketInfo(basket);
            throw new Error(Resource.msg('error.card.invalid.amount', 'cart', null));
        }

        // Validate billing address country code
        if (empty(basket.getBillingAddress().getCountryCode().value)) {
            throw new Error(Resource.msgf('empty.country.code', 'checkout', null, 'billing address'));
        }

        // Validate shipping address country code
        if (basket.getDefaultShipment().shippingMethodID !== 'eGift_Card' && empty(basket.getDefaultShipment().getShippingAddress().getCountryCode().value)) {
            throw new Error(Resource.msgf('empty.country.code', 'checkout', null, 'shipping address'));
        }
        // Update billing state code from ApplePay & PayPal if data is inappropriate
        COHelpers.updateStateCode(basket); // eslint-disable-line

        // Update CA postal code if data is inappropriate
        COHelpers.updatePostalCode(basket); // eslint-disable-line

        // auto-correct phone number if invalid
        COHelpers.autoCorrectPhonenumber(basket);

        // Server side validation for shipping, billing, giftMessage and contact info
        var inputFieldsValidation = COHelpers.validateInputFields(basket);
        if (inputFieldsValidation.error) {
            throw new Error(inputFieldsValidation.genericErrorMessage);
        }
        // validate commercialPickupBasket basket
        var isHALEnabledForShopApp = COHelpers.isHALEnabledForShopApp();
        if (basket && basket.custom.isCommercialPickup && !isHALEnabledForShopApp) {
            return new Status(Status.ERROR, 'HALBasketError', Resource.msg('error.ocapi.commercial.pickup.disabled', 'checkout', null));
        }
    } catch (e) {
        if (e.name === 'QtyLimitExceededException') {
            return errorLogHelper.handleOcapiHookErrorStatus(e, e.name, e.message);
        }
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'BasketValidationError', e.message);
    }

    try {
        removeInvalidLoyaltyCouponsBeforePlaceOrder(basket);
    } catch (e) {
        const Logger = require('dw/system/Logger').getLogger('loyalty', 'Loyalty');
        Logger.error('Error removing not applied coupon from the basket {0}', e.message);
    }

    return new Status(Status.OK);
}

/**
 * validates order before creating
 * @param {dw.order.Basket} basket  - Current basket
 * @returns {Status} - Status
 */
exports.beforePOST = function (basket) {
    return validateOrder(basket);
};
