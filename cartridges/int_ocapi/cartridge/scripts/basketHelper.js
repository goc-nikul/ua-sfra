var Site = require('dw/system/Site');
var collections = require('*/cartridge/scripts/util/collections');
var errorLogHelper = require('*/cartridge/scripts/errorLogHelper');
var Transaction = require('dw/system/Transaction');
var Resource = require('dw/web/Resource');
const Logger = require('dw/system/Logger').getLogger('basketHelper');

var CurrentSite = Site.getCurrent();
var bopisEnabled = CurrentSite.getCustomPreferenceValue('isBOPISEnabled');

const CCPaymentMethodIds = {
    AURUS: 'AURUS_CREDIT_CARD',
    PAYMETRIC: 'Paymetric'
};

/**
 * Retrieve the basket information JSON string format.
 * @param {dw.order.Basket} basket - current basket
 * @returns {string | null} basketInfo JSON string
 */
function getBasketInfoForLog(basket) {
    try {
        var basketJSON = {
            cust_no: basket.getCustomerNo() || customer.getID(),
            basket_id: basket.getUUID(),
            shipments: [],
            paymentInstruments: []
        };
        collections.forEach(basket.getShipments(), function (shipment) {
            var productIds = [];
            collections.forEach(shipment.getProductLineItems(), function (pli) {
                productIds.push(pli.getProductID());
            });
            basketJSON.shipments.push({
                shipment_id: shipment.getID(),
                products: productIds
            });
        });

        // Payment instrucments
        collections.forEach(basket.paymentInstruments, function (paymentInstrument) {
            basketJSON.paymentInstruments.push({
                paymentMethod: paymentInstrument.paymentMethod,
                amount: paymentInstrument.paymentTransaction.amount.available ? paymentInstrument.paymentTransaction.amount.value : 0
            });
        });

        // Order amount
        basketJSON.order_amount = basket.totalGrossPrice.available ? basket.totalGrossPrice.value : 0;

        return JSON.stringify(basketJSON);
    } catch (e) {
        Logger.error('Unable to retrieve basket info for logging: {0} {1}', e.message, e.stack);
    }

    return JSON.stringify({
        errorMsg: 'Unable to retrieve basket info for logging'
    });
}

/**
 * This helper gets the real-time inventory records
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {Object} maoAvailability - MAO availability object
 */
function getRealTimeInventory(basket) {
    var maoAvailability;
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    if (isMAOEnabled && basket.getProductLineItems()) {
        var Availability = require('int_mao/cartridge/scripts/availability/MAOAvailability');
        var AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
        var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
        var items = AvailabilityHelper.getSKUS(basket);
        if (realTimeInventoryCallEnabled && !empty(items)) {
            maoAvailability = Availability.getMaoAvailability(items);
        }
    }
    return maoAvailability;
}

/**
 * This helper gets the real-time inventory records
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @param {Object} maoAvailability - MAO availability object
 */
function setInventoryRecord(basket, maoAvailability) {
    const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
    if (isMAOEnabled && basket.getProductLineItems()) {
        var lineItems = basket.getProductLineItems().iterator();
        while (lineItems.hasNext()) {
            var productLineItem = lineItems.next();
            var product = productLineItem.product;
            if (maoAvailability && product && !empty(maoAvailability[product.custom.sku])) {
                var MAOStockLevel = JSON.parse(maoAvailability[product.custom.sku]).TotalQuantity;
                var availabilityModel = product.availabilityModel;
                var inventoryRecord = !empty(availabilityModel) ? availabilityModel.inventoryRecord : null;
                if (!empty(inventoryRecord) && inventoryRecord.getAllocation().getValue() !== MAOStockLevel) {
                    try {
                        Transaction.begin();
                        inventoryRecord.setAllocation(MAOStockLevel, new Date());
                        Transaction.commit();
                    } catch (e) {
                        Transaction.rollback();
                        Logger.warn('Unable to setInventoryRecord with MAO value for logging: {0} {1}', e.message, e.stack);
                    }
                }
            }
        }
    }
}

/**
 * This method updates shipping address to the eGiftcard shipment
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @param {Object} shippingAddressEntered - shipping address entered
 */
function updateShippingAddressToGiftCardShipment(basket, shippingAddressEntered) {
    var giftCardShipment = basket.getShipment('EGiftCardShipment');
    if (giftCardShipment) {
        var shippingAddress = giftCardShipment.shippingAddress;
        if (shippingAddress === null) {
            shippingAddress = giftCardShipment.createShippingAddress();
        }
        shippingAddress.setFirstName(shippingAddressEntered.firstName);
        shippingAddress.setLastName(shippingAddressEntered.lastName);
        shippingAddress.setAddress1(shippingAddressEntered.address1);
        shippingAddress.setAddress2(shippingAddressEntered.address2);
        shippingAddress.setCity(shippingAddressEntered.city);
        shippingAddress.setPostalCode(shippingAddressEntered.postalCode);
        shippingAddress.setStateCode(shippingAddressEntered.stateCode);
        shippingAddress.setCountryCode(shippingAddressEntered.countryCode);
        shippingAddress.setPhone(shippingAddressEntered.phone);
    }
}

/**
 * This method updates the necessary custom attributes to the shipping methods of ocapi call
 * @param {Object} shippingMethodResult - shippingMethodResult response to ocapi call
 */
function updateShippingEstimatedDeliveryDate(shippingMethodResult) {
    var ShippingMgr = require('dw/order/ShippingMgr');
    var StringUtils = require('dw/util/StringUtils');
    var shippingMethods = ShippingMgr.getAllShippingMethods().iterator();
    if (shippingMethods) {
        while (shippingMethods.hasNext()) {
            var shippingMethod = shippingMethods.next();
            var getShippingDeliveryDates = require('*/cartridge/scripts/util/DeliveryHelper').getShippingDeliveryDates(shippingMethod, true);
            if (!empty(getShippingDeliveryDates)) {
                var shippingMethodResultObj = shippingMethodResult.applicable_shipping_methods;
                if (!empty(shippingMethodResultObj)) {
                    for (var i = 0; i < shippingMethodResultObj.length; i++) {
                        if (shippingMethod.ID === shippingMethodResultObj[i].id) {
                            shippingMethodResultObj[i].c_deliveryDateMin = StringUtils.formatCalendar(getShippingDeliveryDates[0], 'yyyy-MM-dd');
                            shippingMethodResultObj[i].c_deliveryDateMax = StringUtils.formatCalendar(getShippingDeliveryDates[1], 'yyyy-MM-dd');
                        }
                    }
                }
            }
        }
    }
}

/**
 * This method replaces the dummyLineItems with actual eGiftCard items
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @param {Object} eGiftItems - eGiftItems items
 */
function replaceDummyGiftLineItem(basket, eGiftItems) {
    var ProductMgr = require('dw/catalog/ProductMgr');
    var dummyProductID = Site.getCurrent().getCustomPreferenceValue('replaceableProductID');
    var shipment = basket.getShipment('EGiftCardShipment') || basket.getDefaultShipment();
    var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
    var timezoneHelper = new TimezoneHelper();

    var eGiftCardProductID = Site.getCurrent().getCustomPreferenceValue('eGiftCardProductID');
    eGiftItems.forEach(function (item) {
        var productLineItem = basket.createProductLineItem(dummyProductID, shipment);
        var productToReplace = ProductMgr.getProduct(eGiftCardProductID);
        productLineItem.replaceProduct(productToReplace);
        productLineItem.setQuantityValue(item.quantity);
        productLineItem.setPriceValue(parseFloat(item.c_gcAmount_i || 0, 10));
        var dateElements = item.c_gcDeliveryDate_s.split('-');
        var deliveryDate = timezoneHelper.getCurrentSiteTime();
        deliveryDate.setFullYear(dateElements[0]);
        deliveryDate.setMonth(dateElements[1] - 1, dateElements[2]);
        productLineItem.custom.gcDeliveryDate = deliveryDate;
        productLineItem.custom.gcFrom = item.c_gcFrom_s;
        productLineItem.custom.gcMessage = item.c_gcMessage_s;
        productLineItem.custom.gcRecipientEmail = item.c_gcRecipientEmail_s;
        productLineItem.custom.gcRecipientName = item.c_gcRecipientName_s;
        productLineItem.custom.gcAmount = Number(item.c_gcAmount_i);
    });
}

/**
 * Update address type from service
 * @param {Object} shippingAddress dw shipping address
 */
function updateAddressType(shippingAddress) {
    require('*/cartridge/modules/providers').get('AddressType', shippingAddress).addressType();
}

/**
 * Validates shipping address
 * If employee customer, then sapCarrierCode is mandatory if not we are not expecting isOffice and sapCarrier Code
 * @param {boolean} officeAddress isOffice address in request
 * @param {string} sapCarrierCode sapcarrier code in request
 * @returns {boolean} validates provided shipping address
 */
function isShippingAddressValid(officeAddress, sapCarrierCode) {
    var isEmployee = !empty(customer.profile) && 'isEmployee' in customer.profile.custom && customer.profile.custom.isEmployee;
    if (isEmployee) {
        return officeAddress ? !!sapCarrierCode : !sapCarrierCode;
    }
    return !sapCarrierCode && !officeAddress;
}
/**
 * This method convert string into JSON object
 * @param {string} lineItemPriceAdjustmentString - lineItemPriceAdjustmentString
 * @returns {Object} return Json array object
 */
function convertIntoJSONObj(lineItemPriceAdjustmentString) {
    var StringUtils = require('dw/util/StringUtils');
    var lineItemPriceAdjustmentObj = {};
    var convertedAdjustment = lineItemPriceAdjustmentString.replace(/{|}/g, '');
    var keyValueArray = convertedAdjustment.split(',');
    keyValueArray.forEach(function (property) {
        var element = property.split('=');
        var elementKey = element[0] ? StringUtils.trim(element[0]) : null;
        var elementValue = element[1] ? StringUtils.trim(element[1]) : '';
        if (elementKey) {
            lineItemPriceAdjustmentObj[elementKey] = elementValue;
        }
    });
    return lineItemPriceAdjustmentObj;
}

/**
 * validates that the BOPIS product line items exist, are online, and have available inventory.
 * @param {Object} basketResponse - basket response to ocapi call
 * @param {string} checkPoint - checkpoint to validate inventory
 * @returns {Object} an error object
 */
function validateBOPISProductsInventoryOCAPI(basketResponse, checkPoint) {
    const result = {
        error: false,
        availabilityError: false,
        hasInventory: true,
        moveItemsToShipping: [],
        partiallyAvailableBopisItems: [],
        lineItemQtyList: {},
        invalidItemsSku: []
    };
    try {
        if (basketResponse) {
            const ProductMgr = require('dw/catalog/ProductMgr');
            const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
            const StoreMgr = require('dw/catalog/StoreMgr');
            const validationHelpers = require('*/cartridge/scripts/helpers/basketValidationHelpers');
            const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
            const Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};
            const isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
            var maoBOPISAvailability = null;
            if (isMAOEnabled && Availability) {
                // eslint-disable-next-line spellcheck/spell-checker
                const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
                const storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                const realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
                const isBopisCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled(checkPoint);
                if (realTimeInventoryCallEnabled && isBOPISEnabled && isBopisCheckPointEnabled) {
                    const itemsBOPIS = storeHelpers.getBopisDataOCAPI(basketResponse);
                    if (!empty(itemsBOPIS && itemsBOPIS.items && itemsBOPIS.locations) && itemsBOPIS.items.length > 0) {
                        maoBOPISAvailability = Availability.getMaoAvailability(itemsBOPIS.items, itemsBOPIS.locations, false);
                    }
                }
            }
            const productItems = basketResponse.product_items;
            collections.forEach(productItems, function (productItem) {
                const productQty = productItem.quantity;
                const product = ProductMgr.getProduct(productItem.product_id);
                const productUUID = productItem.item_id;
                const productID = productItem.product_id;
                const itemToModify = {};
                if (product === null || !product.online) {
                    result.error = true;
                    return;
                }
                if (Object.hasOwnProperty.call(productItem, 'c_fromStoreId') && productItem.c_fromStoreId && isBOPISEnabled) {
                    const store = StoreMgr.getStore(productItem.c_fromStoreId);
                    const storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
                    let lineItemQtyLimit = validationHelpers.getLineItemInventory(product, true, maoBOPISAvailability, store.ID);

                    result.lineItemQtyList[productUUID] = JSON.stringify({
                        lineItemQtyLimit: lineItemQtyLimit,
                        quantity: productQty
                    });

                    result.hasInventory = result.hasInventory && !empty(storeInventory) &&
                        (storeInventory.getRecord(productID) &&
                            storeInventory.getRecord(productID).ATS.value >= productQty);
                    itemToModify.lineItem = productItem;
                    itemToModify.quantity = lineItemQtyLimit;
                    itemToModify.id = product.ID;
                    itemToModify.fromStoreId = productItem.c_fromStoreId;

                    // Remove the item completely
                    if (lineItemQtyLimit < 1) {
                        result.moveItemsToShipping.push(itemToModify);
                        result.availabilityError = true;
                    } else if (lineItemQtyLimit < productQty) { // Update product lineItems quantity
                        result.partiallyAvailableBopisItems.push(itemToModify);
                        result.availabilityError = true;
                    }
                    if (lineItemQtyLimit < 1 || lineItemQtyLimit < productQty) {
                        result.invalidItemsSku.push(product.custom.sku);
                    }
                }
            });
        }
    } catch (e) {
        Logger.error('basketValidationHelper.js - Error while executing validateBOPISProductsInventoryOCAPI: ' + e.message);
    }
    return result;
}

/**
 * This method updates basket values for BOPIS
 *
 * @param {dw.order.Basket} basketResponse - ocapi Basket object
 */
function updateBasket(basketResponse) {
    if (!bopisEnabled) {
        return;
    }
    try {
        if (basketResponse && basketResponse.productItems) {
            basketResponse.productItems.toArray().forEach(lineItem => {
                // eslint-disable-next-line no-param-reassign
                delete lineItem.c_storeInventory;
                // eslint-disable-next-line no-param-reassign
                delete lineItem.c_stocksPerStore;
            });
        }
        const validatedBopisProducts = validateBOPISProductsInventoryOCAPI(basketResponse, 'BOPIS');
        if (validatedBopisProducts && validatedBopisProducts.lineItemQtyList && Object.keys(validatedBopisProducts.lineItemQtyList).length) {
            Object.keys(validatedBopisProducts.lineItemQtyList).forEach(pliUUID => {
                const pliObject = JSON.parse(validatedBopisProducts.lineItemQtyList[pliUUID]);
                if (basketResponse && basketResponse.productItems) {
                    basketResponse.productItems.toArray().forEach(lineItem => {
                        if (lineItem.item_id === pliUUID) {
                            // eslint-disable-next-line no-param-reassign
                            lineItem.c_storeInventory = pliObject.lineItemQtyLimit;
                        }
                    });
                }
            });
        }
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    try {
        const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
        if (isMAOEnabled) {
            const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
            const itemsBOPIS = AvailabilityHelper.getBOPISStoresBySKUOCAPI(basketResponse);
            if (itemsBOPIS && Object.keys(itemsBOPIS).length > 0 && basketResponse && basketResponse.productItems) {
                basketResponse.productItems.toArray().forEach(lineItem => {
                    const product = itemsBOPIS[lineItem.item_id];
                    // eslint-disable-next-line no-param-reassign
                    lineItem.c_stocksPerStore = JSON.stringify(product);
                });
            }
        }
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateBasketError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
}

/**
 * This method gets customer groups for a price adjustment
 * @param {Object} priceAdjustment - dw.order.PriceAdjustment
 * @returns {Array} of customer groups
 */
function getCustomerGroups(priceAdjustment) {
    return priceAdjustment.promotion && priceAdjustment.promotion.basedOnCustomerGroups && priceAdjustment.promotion.customerGroups ? collections.map(priceAdjustment.promotion.customerGroups || [], function (cg) { return { id: cg.ID, UUID: cg.UUID }; }) : [];
}

/**
 * This method finds a price adjustmemnt by id from an array of price adjustments.
 * @param {Array} priceAdjustments - dw.order.PriceAdjustment
 * @param {string} priceAdjustmentId - Price adjustment id to search for
 * @returns {PriceAdjustment | null} found PriceAdjustment
 */
function findPriceAdjustment(priceAdjustments, priceAdjustmentId) {
    return collections.find(priceAdjustments, function (p) { return p.price_adjustment_id === priceAdjustmentId; });
}

/**
 * This method applies customer groups to price adjustments in the basket
 * @param {Object} basketResponse - basket response
 */
function applyCustomerGroupsAndProratedPriceAdjustments(basketResponse) {
    var BasketMgr = require('dw/order/BasketMgr');
    var currentBasket = BasketMgr.getCurrentBasket();
    var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');

    collections.forEach(basketResponse.order_price_adjustments, function (priceAdjustment) { // eslint-disable-line
        const basketPriceAdjustment = currentBasket.getPriceAdjustmentByPromotionID(priceAdjustment.promotion_id);
        if (basketPriceAdjustment) {
            // eslint-disable-next-line no-param-reassign
            priceAdjustment.c_customerGroups = getCustomerGroups(basketPriceAdjustment);
        }
    });

    collections.forEach(basketResponse.product_items, function (productItem) { // eslint-disable-line
        collections.forEach(productItem.price_adjustments, function (priceAdjustment) {
            const basketPriceAdjustment = currentBasket.getPriceAdjustmentByPromotionID(priceAdjustment.promotion_id);
            if (basketPriceAdjustment) {
                // eslint-disable-next-line no-param-reassign
                priceAdjustment.c_customerGroups = getCustomerGroups(basketPriceAdjustment);
            }
        });

        const productLineItem = COHelpers.getProductLineItem(currentBasket, productItem.item_id);
        const priceAdjustmentsValues = productLineItem.proratedPriceAdjustmentPrices.entrySet().toArray();

        const proratedPriceAdjustments = [];
        for (let i = 0; i < priceAdjustmentsValues.length; i++) {
            let priceAdjustment = findPriceAdjustment(productItem.price_adjustments, priceAdjustmentsValues[i].key.UUID)
                || findPriceAdjustment(basketResponse.order_price_adjustments, priceAdjustmentsValues[i].key.UUID);
            if (priceAdjustment) {
                proratedPriceAdjustments.push({
                    price_adjustment: priceAdjustment,
                    price: priceAdjustmentsValues[i].value.value
                });
            }
        }
        // eslint-disable-next-line no-param-reassign
        productItem.c_proratedPriceAdjustments = proratedPriceAdjustments;
    });
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
    updateBasket(basketResponse);
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
            if (qty > lineItemQtyLimit) {
                arrayOfLimits.push({
                    itemID: productItem.item_id,
                    productID: productItem.product_id,
                    c_LimitedExceeded: (qty - lineItemQtyLimit),
                    c_correctQuantity: lineItemQtyLimit
                });
            }
            var AdjustmentPriceArray = [];
            for (var j = 0; j < priceAdjustmentsArrayObj.length; j++) {
                if (priceAdjustmentsArrayObj[j].product_id === productItem.productId) {
                    AdjustmentPriceArray.push(priceAdjustmentsArrayObj[j]);
                }
            }
            productItem.c_lineItemPriceAdjustments = AdjustmentPriceArray; // eslint-disable-line no-param-reassign
            if (!empty(product)) {
                productItem.c_isPreOrder = product.custom.isPreOrder; // eslint-disable-line no-param-reassign
                productItem.c_masterSizePreferJSON = product.variant ? product.variationModel.master.custom.masterSizePrefJSON : ''; // eslint-disable-line no-param-reassign
                productItem.c_variationSizePrefJSON = product.variant ? product.custom.variationSizePrefJSON : '';  // eslint-disable-line no-param-reassign
            }
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
        applyCustomerGroupsAndProratedPriceAdjustments(basketResponse);
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'applyCustomerGroupsAndProratedPriceAdjustmentsError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }

    try {
        // Updating MAO Price Adjustment Object
        var BasketMgr = require('dw/order/BasketMgr');
        var currentBasket = BasketMgr.getCurrentBasket();
        var COHelpers = require('*/cartridge/scripts/checkout/checkoutHelpers');
        // Ensure shipments have shipping method
        if (currentBasket != null || currentBasket !== undefined) {
            var cartHelper = require('*/cartridge/scripts/cart/cartHelpers');
            cartHelper.ensureAllShipmentsHaveMethods(currentBasket);
        }
        collections.forEach(response.product_items, function (productItem) { // eslint-disable-line
            let productLineItem = COHelpers.getProductLineItem(currentBasket, productItem.item_id);
            collections.forEach(productItem.price_adjustments, function (priceAdjustment) {
                let lineItemPriceAdjustment = productLineItem.getPriceAdjustmentByPromotionID(priceAdjustment.promotion_id);
                let priceAdjustmentJSON = [];
                let priceAdjustmentObject = {};
                priceAdjustmentObject.applied_discount = {
                    type: 'AMOUNT'
                };
                priceAdjustmentObject.coupon_code = lineItemPriceAdjustment && lineItemPriceAdjustment.basedOnCoupon && lineItemPriceAdjustment.couponLineItem ? lineItemPriceAdjustment.couponLineItem.couponCode : '';
                priceAdjustmentObject.creation_date = priceAdjustment.creation_date.toString();
                priceAdjustmentObject.custom = priceAdjustment.custom;
                priceAdjustmentObject.item_text = priceAdjustment.item_text;
                priceAdjustmentObject.last_modified = '';
                priceAdjustmentObject.manual = priceAdjustment.manual;
                priceAdjustmentObject.price = parseFloat(priceAdjustment.price.toString(), 10).toFixed(2);
                priceAdjustmentObject.price_adjustment_id = priceAdjustment.price_adjustment_id;
                priceAdjustmentObject.promotion_id = priceAdjustment.promotion_id;
                priceAdjustmentObject.campaign_id = lineItemPriceAdjustment && lineItemPriceAdjustment.campaignID ? lineItemPriceAdjustment.campaignID : '';
                priceAdjustmentObject.c_unitDiscount = (parseFloat(priceAdjustment.price.toString(), 10) / productItem.quantity).toFixed(2);
                priceAdjustmentJSON.push(priceAdjustmentObject);
                priceAdjustment.c_priceAdjustmentJSON = priceAdjustmentJSON; // eslint-disable-line
            });
            let orderPriceAdjustmentJSON = [];
            collections.forEach(basketResponse.order_price_adjustments, function (priceAdjustment) {
                let basketPriceAdjustment = currentBasket.getPriceAdjustmentByPromotionID(priceAdjustment.promotion_id);
                let proratedPrices = basketPriceAdjustment && basketPriceAdjustment.proratedPrices ? basketPriceAdjustment.proratedPrices : null;
                let proratedPrice = proratedPrices && proratedPrices.length > 0 && proratedPrices.get(productLineItem) ? proratedPrices.get(productLineItem) : null;
                if (proratedPrice) {
                    let priceAdjustmentObject = {};
                    priceAdjustmentObject.price = proratedPrice.valueOrNull;
                    priceAdjustmentObject.promotion_id = priceAdjustment.promotion_id;
                    priceAdjustmentObject.campaign_id = basketPriceAdjustment && basketPriceAdjustment.campaignID ? basketPriceAdjustment.campaignID : '';
                    priceAdjustmentObject.item_text = priceAdjustment.item_text;
                    priceAdjustmentObject.coupon_code = basketPriceAdjustment && basketPriceAdjustment.basedOnCoupon && basketPriceAdjustment.couponLineItem ? basketPriceAdjustment.couponLineItem.couponCode : '';
                    priceAdjustmentObject.price_adjustment_id = priceAdjustment.price_adjustment_id;
                    priceAdjustmentObject.custom = priceAdjustment.custom;
                    orderPriceAdjustmentJSON.push(JSON.stringify(priceAdjustmentObject));
                }
            });
            productItem.c_priceAdjustmentJSON = orderPriceAdjustmentJSON; // eslint-disable-line
        });
    } catch (e) {
        errorLogHelper.handleOcapiHookErrorStatus(e, 'updateMAOPriceAdjustmentJSONError', Resource.msgf('error.ocapi.update.basket', 'cart', null, e.message));
    }
    return new Status(Status.OK);
}

/**
 * This method updates the paypal token expiration time to PaymentInstrument
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {void}
 */
function updatePaypalTokenExpirationTime(basket) {
    if (basket && basket.getPaymentInstruments('PayPal').length > 0) {
        const payPalPaymentInstruments = basket.getPaymentInstruments('PayPal');
        var Calendar = require('dw/util/Calendar');
        var TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
        var timezoneHelper = new TimezoneHelper();
        var paypalTokenExpiryTime = new Calendar(timezoneHelper.getCurrentSiteTime());
        paypalTokenExpiryTime.add(paypalTokenExpiryTime.HOUR, Site.current.getCustomPreferenceValue('paypalTokenExpirationTime'));
        payPalPaymentInstruments[0].custom.paypalTokenExpiryTime = paypalTokenExpiryTime.getTime();
    }
}
/**
 * This method creates/updates klarna session and deletes session attributes for non-klarna payment
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {void}
 */
function manageKlarnaSession(basket) {
    var KlarnaSessionManager = require('*/cartridge/scripts/common/klarnaSessionManager');
    var klarnaSessionManager = new KlarnaSessionManager();
    klarnaSessionManager.createOrUpdateSessionOCAPI(basket);
}

/**
 * Deteremine if paymentInstrumentRequest is a credit card request.
 * @param {Object} paymentInstrumentRequest - Payment instrument requesnode build_tools/build --test ./test/unit/scripts/UACAPI/helpers/order/basketHelper.jst
 * @returns {boolean} is OCAPI paymentInstrumentRequest a CC payment method
 */
function isCCPaymentInstrumentRequest(paymentInstrumentRequest) {
    return (paymentInstrumentRequest && 'paymentMethodId' in paymentInstrumentRequest &&
        (paymentInstrumentRequest.paymentMethodId === CCPaymentMethodIds.AURUS ||
            paymentInstrumentRequest.paymentMethodId === CCPaymentMethodIds.PAYMETRIC)) || false;
}

/**
 * Determine if basket contains any credit card payment instruments. Checks by Aurus and Paymetric CC payment method ids.
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {void} ccPaymentInstrument
 */
function removeCCPaymentInstruments(basket) {
    if (basket) {
        var paymentInstruments = basket.getPaymentInstruments();

        if (!empty(paymentInstruments)) {
            collections.forEach(paymentInstruments, function (pi) {
                if (pi.paymentMethod === CCPaymentMethodIds.AURUS ||
                    pi.paymentMethod === CCPaymentMethodIds.PAYMETRIC) {
                    Transaction.wrap(function () {
                        basket.removePaymentInstrument(pi);
                    });
                }
            });
        }
    }
}

/**
 * Session does not carry over between OCAPI requests. IDME functionality needs this data to be set.
 */
function reapplyIDMeToSessionForCurrentCustomer() {
    var BasketMgr = require('dw/order/BasketMgr');
    var basket = BasketMgr.getCurrentBasket();
    if (basket && 'verifiedIdmeScope' in basket.custom && !empty(basket.custom.verifiedIdmeScope)) {
        let PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
        let customerGroup = PreferencesUtil.getJsonValue('IDMEUnifiedCustomerGroupMappingJSON'); // eslint-disable-line
        customerGroup = customerGroup[basket.custom.verifiedIdmeScope]; // IDmeVerifiedMilitary or IDmeVerifiedResponder
        if (session.custom[customerGroup] !== 'Verified') {
            session.custom[customerGroup] = 'Verified';
            session.custom.idmeVerified = customerGroup;
        }
    }
}

/**
 * Remove all Apple Pay Payment Instruments from the basket
 * @param {dw.order.Basket} basket - current basket
 * @returns {void}
 */
function removeApplePayPI(basket) {
    if (basket) {
        var paymentInstruments = basket.getPaymentInstruments();
        const apPaymentMethodId = require('~/cartridge/scripts/constants').PAYMENT_METHODS.APPLE_PAY;

        if (!empty(paymentInstruments)) {
            collections.forEach(paymentInstruments, function (pi) {
                if (pi.paymentMethod.toLowerCase() === apPaymentMethodId.toLowerCase()) {
                    Transaction.wrap(function () {
                        basket.removePaymentInstrument(pi);
                    });
                }
            });
        }
    }
}

exports.getRealTimeInventory = getRealTimeInventory;
exports.setInventoryRecord = setInventoryRecord;
exports.updateShippingAddressToGiftCardShipment = updateShippingAddressToGiftCardShipment;
exports.updateShippingEstimatedDeliveryDate = updateShippingEstimatedDeliveryDate;
exports.replaceDummyGiftLineItem = replaceDummyGiftLineItem;
exports.updateAddressType = updateAddressType;
exports.isShippingAddressValid = isShippingAddressValid;
exports.updateResponse = updateResponse;
exports.updatePaypalTokenExpirationTime = updatePaypalTokenExpirationTime;
exports.manageKlarnaSession = manageKlarnaSession;
exports.isCCPaymentInstrumentRequest = isCCPaymentInstrumentRequest;
exports.removeCCPaymentInstruments = removeCCPaymentInstruments;
exports.updateBasket = updateBasket;
exports.applyCustomerGroupsAndProratedPriceAdjustments = applyCustomerGroupsAndProratedPriceAdjustments;
exports.validateBOPISProductsInventoryOCAPI = validateBOPISProductsInventoryOCAPI;
exports.reapplyIDMeToSessionForCurrentCustomer = reapplyIDMeToSessionForCurrentCustomer;
exports.removeApplePayPI = removeApplePayPI;
exports.getBasketInfoForLog = getBasketInfoForLog;
