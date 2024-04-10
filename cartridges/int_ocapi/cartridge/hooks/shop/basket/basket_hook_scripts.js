/**
 * ©2013-2017 salesforce.com, inc. All rights reserved.
 *
 * basket_hook_scripts.js
 *
 * Handles OCAPI hooks for basket calls
 */

var Status = require('dw/system/Status');
var Resource = require('dw/web/Resource');
var Site = require('dw/system/Site');
var CurrentSite = Site.getCurrent();
var basketHelper = require('*/cartridge/scripts/basketHelper');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var dummyProductID = CurrentSite.getCustomPreferenceValue('replaceableProductID');
var bopisEnabled = CurrentSite.getCustomPreferenceValue('isBOPISEnabled');

/**
 * This method updates basket custom attribute
 *
 * @param {dw.order.Basket} basket - currentBasket
 */
function updateBasketAurus(basket) {
    var isAurusEnabled = require('*/cartridge/scripts/helpers/sitePreferencesHelper').isAurusEnabled();
    if (isAurusEnabled) {
        var aurusPayHelper = require('*/cartridge/scripts/util/aurusPayHelper');
        aurusPayHelper.setTerminalIDSession(basket);
    }
}

/**
 * This method initiates a PayPal checkout if requested and adds the token to the response
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @param {Object} res - basket response to ocapi call
 */
function handlePayPalCheckout(basket) {
    // eslint-disable-next-line no-undef
    var params = request.getHttpParameters();
    var paypalParams = params.get('paypal');
    var paypal = paypalParams && paypalParams[0];

    if (!paypal) {
        return;
    }

    if (!basket || basket.totalGrossPrice.value === 0) {
        throw new Error('empty_cart');
    }

    var paypalProcessor = require('*/cartridge/scripts/paypal/processor');

    if (paypal === 'start') {
        var paypalRes = paypalProcessor.handle(basket, true, false, true);// basket, isFromCart, inpIsUseBillingAgreement, isOcapi

        if (paypalRes.error) {
            throw new Error(paypalRes.paypalErrorMessage);
        }
        // Here we will set the token expiration time to the paypal payment instrument
        basketHelper.updatePaypalTokenExpirationTime(basket);
    }
}

/**
 * This method updates the basket.custom.isCommercialPickup attribute
 * @param {dw.order.Basket} basket - currentBasket
 */
function handleCommercialPickupBasket(basket) {
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
    var isHALEnabledForShopApp = COHelpers.isHALEnabledForShopApp();
    if (basket && 'isCommercialPickup' in basket.custom && basket.custom.isCommercialPickup && !isHALEnabledForShopApp) {
        basket.custom.isCommercialPickup = false; // eslint-disable-line
        // clear shipping address fields
        COHelpers.setEmptyShippingAddressFields(basket);
    }
}
/**
 * This method updates the necessary updates to basket after Post Put and Delete calls
 *
 * @param {dw.order.Basket} basket - currentBasket
 */
function updateBasketAfterPostPutDeleteCalls(basket) {
    var collections = require('*/cartridge/scripts/util/collections');
    // Remove the dummy productLineItem used while handling the eGift-card items
    // and remove products from basket that have been deleted
    collections.forEach(basket.getProductLineItems(), function (lineItem) {
        if (lineItem.productID === dummyProductID || empty(lineItem.product)) {
            basket.removeProductLineItem(lineItem);
        }
    });
    var paymentHelper = require('~/cartridge/scripts/paymentHelper');
    var maoAvailability = basketHelper.getRealTimeInventory(basket);
    basketHelper.setInventoryRecord(basket, maoAvailability);
    const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
    giftcardHelper.updateGiftCardShipments(basket);
    require('dw/system/HookMgr').callHook('dw.order.calculate', 'calculate', basket);
    paymentHelper.autoAdjustBasketPaymentInstruments(basket);
    // klarna session management call
    basketHelper.manageKlarnaSession(basket);
}

/**
 * This method gets the estimated Loyalty points for Loyalty users
 *
 * @param {dw.order.Basket} basket - currentBasket
 */
function estimateLoyaltyPoints(basket) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        if (customer.isAuthenticated()) {
            if (customer.isMemberOfCustomerGroup('Loyalty')) {
                loyaltyHelper.estimate(basket);
            }
        } else if ('referenceCustomerNo' in basket.custom && !empty(basket.custom.referenceCustomerNo)) {
            loyaltyHelper.estimate(basket, basket.custom.referenceCustomerNo);
        }
    }
}

/**
 * This method adds the basket's ShopRunner token to the session
 *
 * @param {dw.order.Basket} basket - currentBasket
 */
function handleShopRunner(basket) {
    var token = basket.custom.sr_token;
    if (token) {
        var result = require('int_shoprunner/cartridge/scripts/ShopRunnerAuth').validate(token, basket);
        if (!result.signin) {
            var Transaction = require('dw/system/Transaction');
            Transaction.wrap(function () {
                // eslint-disable-next-line no-param-reassign
                basket.custom.sr_token = '';
                session.custom.srtoken = '';
                basket.getDefaultShipment().shippingMethod = null; // eslint-disable-line
            });
        }
        session.custom.srtoken = basket.custom.sr_token;
    }
}

/**
 * This method updates basket values for BOPIS afterPOST as there won't be basketResponse
 *
 * @param {dw.order.Basket} basket - currentBasket
 */
function updateBasketAfterPOST(basket) {
    if (!basket) return;
    if (!bopisEnabled) {
        return;
    }
    try {
        const collections = require('*/cartridge/scripts/util/collections');
        const cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
        const itemsBOPIS = AvailabilityHelper.getBOPISDetails(basket);
        if (itemsBOPIS && Object.keys(itemsBOPIS).length > 0) {
            const StoreMgr = require('dw/catalog/StoreMgr');
            const ShippingMgr = require('dw/order/ShippingMgr');
            const Transaction = require('dw/system/Transaction');
            const UUIDUtils = require('dw/util/UUIDUtils');
            const COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
            Object.keys(itemsBOPIS).forEach(productUUID => {
                const bopisDetails = itemsBOPIS[productUUID];
                if (!empty(bopisDetails.productID) && !empty(bopisDetails.storeID)) {
                    const store = StoreMgr.getStore(bopisDetails.storeID);
                    const storeAddress = {
                        address: {
                            firstName: store.name,
                            lastName: store.name,
                            address1: store.address1,
                            address2: store.address2,
                            city: store.city,
                            stateCode: store.stateCode,
                            postalCode: store.postalCode,
                            countryCode: store.countryCode.value,
                            phone: store.phone
                        }
                    };
                    const shippingMethods = ShippingMgr.getShipmentShippingModel(basket.defaultShipment).getApplicableShippingMethods();
                    const storePickUpShippingMethod = collections.find(shippingMethods, function (method) {
                        return method.custom.storePickupEnabled;
                    });
                    if (!storePickUpShippingMethod) {
                        storePickUpShippingMethod = basket.defaultShipment.shippingMethod;
                    }
                    let shipment = collections.find(basket.shipments, function (item) {
                        return item.custom.fromStoreId;
                    });
                    const productPLI = collections.find(basket.productLineItems, function (item) {
                        return item.productID === bopisDetails.productID && item.UUID === bopisDetails.productUUID;
                    });
                    Transaction.wrap(function () {
                        if (shipment) {
                            productPLI.setShipment(shipment);
                        } else {
                            const newUUID = UUIDUtils.createUUID();
                            shipment = basket.createShipment(newUUID);
                            shipment.setShippingMethod(storePickUpShippingMethod);
                            productPLI.setShipment(shipment);
                        }
                    });
                    if (shipment.productLineItems.length > 0) {
                        Transaction.wrap(function () {
                            shipment.custom.fromStoreId = bopisDetails.storeID;
                            shipment.custom.shipmentType = 'in-store';
                            COHelpers.copyShippingAddressToShipment(storeAddress, shipment);
                        });
                    }
                    cartHelper.ensureShippingAddressforStore(basket);
                    cartHelper.ensureBOPISShipment(basket);
                    cartHelper.defaultShipToAddressIfAny(basket);
                    cartHelper.mergeLineItems(basket);
                    cartHelper.bopisLineItemInventory(basket, false, bopisDetails.productID, bopisDetails.productUUID);
                }
            });
        } else {
            // make sure there are no bopis shipments
            if (cartHelper.basketHasBOPISShipmet(basket)) {
                cartHelper.bopisLineItemInventory(basket, false, null, null);
            }
            cartHelper.resetBasketToHomeDelivery(basket);
        }
        collections.forEach(basket.shipments, function (shipmentToRemove) {
            if (shipmentToRemove.productLineItems.empty && !shipmentToRemove.default) {
                basket.removeShipment(shipmentToRemove);
            }
        });
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketAfterPOST', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
}

// eslint-disable-next-line no-unused-vars
exports.modifyPOSTResponse = function (basket, basketResponse, productItems) {
    return basketHelper.updateResponse(basketResponse);
};

// eslint-disable-next-line no-unused-vars
exports.modifyPATCHResponse = function (basket, basketResponse, productItemId) {
    return basketHelper.updateResponse(basketResponse);
};

exports.modifyPUTResponse = function (basket, basketResponse) {
    return basketHelper.updateResponse(basketResponse);
};

exports.modifyDELETEResponse = function (basket, basketResponse) {
    return basketHelper.updateResponse(basketResponse);
};

exports.afterPUT = function (basket, shipment, shippingAddress) {
    try {
        basketHelper.updateShippingAddressToGiftCardShipment(basket, shippingAddress);
        basketHelper.updateAddressType(shipment.shippingAddress);
        // DO NOT remove this as it creates issues with fraud
        let Transaction = require('dw/system/Transaction');
        let paymentInstruments = basket.paymentInstruments;
        for (let paymentInstrument = 0; paymentInstrument < paymentInstruments.length; paymentInstrument++) {
            if (paymentInstruments[paymentInstrument] && paymentInstruments[paymentInstrument].paymentMethod === 'PayPal') {
                Transaction.wrap(function () { // eslint-disable-line no-loop-func
                    basket.removePaymentInstrument(paymentInstruments[paymentInstrument]);
                });
                break;
            }
        }
        require('dw/system/HookMgr').callHook('dw.order.calculate', 'calculate', basket);
        // klarna session management call
        basketHelper.manageKlarnaSession(basket);
        updateBasketAfterPOST(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.shipping.address', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};

exports.beforePOST = function (basket, items) {
    try {
        var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        var isLoyaltyRewardsReconciliationEnabled = PreferencesUtil.getValue('isLoyaltyRewardsReconciliationEnabled'); // eslint-disable-line spellcheck/spell-checker
        if (isLoyaltyRewardsReconciliationEnabled) {
            /*
            Run this only for newly created baskets.
            As this hook does not work as designed, it gets call after the basket has already been created.
            Therefore, we do a time diff to see if we have a new-ish basket.
            */
            var date = new Date();
            if (date.getTime() - basket.creationDate.getTime() < 1000) { // 1 second
                const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
                loyaltyHelper.checkCustomerReconcile(basket);
            }
        }
    } catch (e) {
        var Logger = require('dw/system/Logger').getLogger('OCAPI', 'OCAPI');
        Logger.error('Error for checkCustomerReconcile: {0} {1}', e.message, e.stack);
    }

    try {
        if (items) {
            var maoAvailability = basketHelper.getRealTimeInventory(basket);
            basketHelper.setInventoryRecord(basket, maoAvailability);
            // Before adding the lineItems handling the eGiftCard items
            var eGiftItems = [];
            items.forEach(function (item) {
                var parsedItem = JSON.parse(item.toString());
                if (parsedItem.product_item.product_id === dummyProductID) {
                    eGiftItems.push(parsedItem.product_item);
                }
            });
            if (eGiftItems) {
                basketHelper.replaceDummyGiftLineItem(basket, eGiftItems);
            }
        }
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }

    try {
        // Applying MAO Price Adjustments
        var AmountDiscount = require('dw/campaign/AmountDiscount');
        var Transaction = require('dw/system/Transaction');
        var lineItemPriceAdjustmentsMAO = basket.custom && basket.custom.lineItemPriceAdjustments ? basket.custom.lineItemPriceAdjustments : [];

        for (var i = 0; i < lineItemPriceAdjustmentsMAO.length; i++) { // eslint-disable-next-line quotes
            var lineItemPriceAdjustmentMAO = JSON.parse(lineItemPriceAdjustmentsMAO[i].replace(/{/g, "{\"").replace(/}/g, "\"}").replace(/, /g, "\", \"").replace(/=/g, "\": \""));
            var productLineItems = basket.getProductLineItems(lineItemPriceAdjustmentMAO.product_id);
            for (var j = 0; j < productLineItems.length; j++) {
                var productLineItem = productLineItems[j];
                var adjustment = parseInt(lineItemPriceAdjustmentMAO.adjustment, 10) * -1 * productLineItem.quantityValue; // eslint-disable-next-line no-loop-func
                Transaction.wrap(function () {
                    var priceAdjustmentMAO = productLineItem.getPriceAdjustmentByPromotionID(lineItemPriceAdjustmentMAO.text);
                    if (priceAdjustmentMAO) {
                        productLineItem.removePriceAdjustment(priceAdjustmentMAO);
                    }
                    productLineItem.createPriceAdjustment(lineItemPriceAdjustmentMAO.text, new AmountDiscount(adjustment));
                });
            }
        }
        dw.system.HookMgr.callHook('dw.order.calculate', 'calculate', basket);
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateMAOPriceAdjustmentError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};

exports.afterPOST = function (basket) {
    try {
        updateBasketAfterPOST(basket);
        var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
        cartHelper.ensureAllShipmentsHaveMethods(basket);
        updateBasketAfterPostPutDeleteCalls(basket);
        estimateLoyaltyPoints(basket);
        updateBasketAurus(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};

exports.afterPATCH = function (basket) {
    try {
        handleShopRunner(basket);
        updateBasketAfterPOST(basket);
        updateBasketAfterPostPutDeleteCalls(basket);
        handlePayPalCheckout(basket);
        handleCommercialPickupBasket(basket);
        estimateLoyaltyPoints(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};

exports.afterDELETE = function (basket) {
    try {
        updateBasketAfterPOST(basket);
        updateBasketAfterPostPutDeleteCalls(basket);
        estimateLoyaltyPoints(basket);
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    return new Status(Status.OK);
};


exports.modifyGETResponse_v2 = function (shipment, shippingMethodResult) {
    var shippingHelpers = require('*/cartridge/scripts/checkout/shippingHelpers');
    var PromotionMgr = require('dw/campaign/PromotionMgr');
    var collections = require('*/cartridge/scripts/util/collections');

    // Restore IDME session data from basket attribute
    basketHelper.reapplyIDMeToSessionForCurrentCustomer();

    var applicableShippingMethods = shippingHelpers.getApplicableShippingMethods(shipment);
    var ids = [];
    applicableShippingMethods.forEach(function (shippingMethod) {
        if (shippingMethod.ID) {
            ids.push(shippingMethod.ID);
        }
    });

    // get the promotions that are valid for the current customer
    var customerPromotions = PromotionMgr.getActiveCustomerPromotions();
    var shippingPromotions = [];
    if (customerPromotions && customerPromotions.shippingPromotions) {
        shippingPromotions = collections.map(customerPromotions.shippingPromotions, function (promo) {
            return { ID: promo.ID, isFreeShipping: 'isFreeShipping' in promo.custom ? promo.custom.isFreeShipping : false };
        });
    }

    // loop through and find the applicable methods, setting the price to 0 there is a qualifying promotion for free shipping
    var shippingMethods = [];
    collections.forEach(shippingMethodResult.applicable_shipping_methods, function (method) {
        var shippingMethod = method;
        if (ids.includes(shippingMethod.id)) {
            if (shippingMethod.shipping_promotions) {
                collections.forEach(shippingMethod.shipping_promotions, function (shippingPromotion) {
                    if (shippingMethod.c_showFreeOnShippingButton) {
                        var matchingPromotion = shippingPromotions.find(promo => promo.ID === shippingPromotion.promotionId);
                        if (matchingPromotion && matchingPromotion.isFreeShipping) {
                            shippingMethod.price = 0.00;
                        }
                    }
                });
            }
            shippingMethods.push(shippingMethod);
        }
        return false;
    });
    // eslint-disable-next-line no-param-reassign
    shippingMethodResult.applicable_shipping_methods = shippingMethods;
    basketHelper.updateShippingEstimatedDeliveryDate(shippingMethodResult);
    return new Status(Status.OK);
};

exports.modifyGETResponse = function (basket, basketResponse) {
    return basketHelper.updateResponse(basketResponse);
};

exports.beforePUT = function (basket, shipment, shippingAddress) {
    if (basketHelper.isShippingAddressValid(shippingAddress.c_isOfficeAddress, shippingAddress.c_sapCarrierCode)) {
        return new Status(Status.OK);
    }
    // eslint-disable-next-line spellcheck/spell-checker
    return new Status(Status.ERROR, 400, Resource.msg('error.sapcarrier.not.valid', 'checkout', null));
};

/**
 * This method removes an ID.me discount from a basket if requested
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @param {dw.order.Basket} basketInput - request
 */
function removeIdmeDiscount(basket, basketInput) {
    // Basket does not have the discount
    if (!basket.custom.verifiedIdmeScope) {
        return;
    }

    // Request is not trying to change the `c_verifiedIdmeScope` value
    if (empty(basketInput.c_verifiedIdmeScope)) {
        return;
    }

    // Only empty string is supported on the input; prevent other changes
    if (basketInput.c_verifiedIdmeScope !== '') {
        // eslint-disable-next-line no-param-reassign
        basketInput.c_verifiedIdmeScope = null;

        return;
    }

    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    // eslint-disable-next-line spellcheck/spell-checker
    var customerGroup = PreferencesUtil.getJsonValue('IDMEresponseToCustomerGroupMappingJSON');

    customerGroup[basket.custom.verifiedIdmeScope] = null;
    session.custom.idmeVerified = null;
    // eslint-disable-next-line no-param-reassign
    basket.custom.verifiedIdmeScope = null;
}

exports.beforePATCH = function (basket, basketInput) {
    try {
        removeIdmeDiscount(basket, basketInput);

        var parameters = request.getHttpParameters(); // eslint-disable-line no-undef
        if (!empty(parameters)) {
            // access the IDME parameters from request
            var idmeScope = !empty(parameters.get('idmeScope')) ? parameters.get('idmeScope')[0] : null;
            var idmeToken = !empty(parameters.get('idmeToken')) ? parameters.get('idmeToken')[0] : null;
            if (!empty(idmeScope) && !empty(idmeToken)) {
                var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
                var apiValidationStatusEndpointURI = PreferencesUtil.getValue('IDMEapiValidationStatusEndpointURI'); // eslint-disable-line spellcheck/spell-checker
                var IDMEServiceHelper = require('int_IDME/cartridge/scripts/util/IDMEServiceHelper.js');
                // verify IDME token
                var validationStatus = IDMEServiceHelper.requestValidationStatus(idmeToken, apiValidationStatusEndpointURI);
                if (!empty(validationStatus)) {
                    // set required session variables for discount
                    var responseToCustomerGroupMapping = PreferencesUtil.getJsonValue('IDMEresponseToCustomerGroupMappingJSON'); // eslint-disable-line spellcheck/spell-checker
                    var customerGroupMarker = responseToCustomerGroupMapping[idmeScope];
                    session.custom[customerGroupMarker] = validationStatus;
                    session.custom.idmeVerified = customerGroupMarker;
                    basket.custom.verifiedIdmeScope = idmeScope; // eslint-disable-line
                }
            }
        }
    } catch (e) {
        return errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketResponseError', Resource.msg('error.ocapi.verify.idme.token', 'cart', null));
    }
    return new Status(Status.OK);
};

exports.beforeDELETE = function (basket, productItemId) {
    let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    if (PreferencesUtil.getValue('isLoyaltyEnable') && customer.isMemberOfCustomerGroup('Loyalty')) {
        const loyaltyHelper = require('*/cartridge/scripts/helpers/loyaltyHelper');
        loyaltyHelper.onRemoveProductLineItem(basket, productItemId);
    }
    return new Status(Status.OK);
};
