'use strict';

var collections = require('*/cartridge/scripts/util/collections');
var ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
var StoreMgr = require('dw/catalog/StoreMgr');
var base = require('app_storefront_base/cartridge/scripts/helpers/basketValidationHelpers');
// eslint-disable-next-line spellcheck/spell-checker
var Site = require('dw/system/Site');
const isMAOEnabled = Site.current.getCustomPreferenceValue('MAOEnabled');
var Availability = isMAOEnabled ? require('int_mao/cartridge/scripts/availability/MAOAvailability') : {};

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.catalog.Product} product - DW product object
 * @param {boolean} checkInventoryInStockLevel - flag to check the product level inventory
 * @param {boolean} maoAvailability - MAO availability
 * @param {string} storeId - storeId
 * @returns {number} lineItemQtyLimit - an error object
 */
function getLineItemInventory(product, checkInventoryInStockLevel, maoAvailability, storeId) {
    var Logger = require('dw/system/Logger');
    var Resource = require('dw/web/Resource');
    var Transaction = require('dw/system/Transaction');

    var CustomerUtils = require('*/cartridge/scripts/util/CustomerUtils');
    var customerUtils = new CustomerUtils();

    // eslint-disable-next-line spellcheck/spell-checker
    var defaultMaxQty = parseInt(Resource.msg('lineitem.max.qty', 'checkout', 1000), 10);
    if (empty(product) || product.isMaster()) {
        if (empty(product)) {
            Logger.error('basketValidationHelpers.js getLineItemInventory function error: no product provided'); // if product is null or undefined calling this logger.
        }
        return defaultMaxQty;
    }

    var MAOData = null;
    var storeID = storeId;
    if (maoAvailability && !empty(maoAvailability[product.custom.sku])) {
        MAOData = JSON.parse(maoAvailability[product.custom.sku]);
        if (!storeID) {
            storeID = MAOData.LocationId;
        }
    }
    var ProductInventoryRecord = null;
    if (storeID) {
        const store = StoreMgr.getStore(storeID);
        var inventoryListID = store ? store.inventoryListID : null;
        var inventoryList = ProductInventoryMgr.getInventoryList(inventoryListID);
        ProductInventoryRecord = inventoryList ? inventoryList.getRecord(product) : null;
    } else {
        var availabilityModel = product.availabilityModel;
        ProductInventoryRecord = availabilityModel ? availabilityModel.inventoryRecord : null;
    }

    // Line item limitation
    // eslint-disable-next-line no-undef
    var customerCountry = request.getLocale().slice(-2).toUpperCase();
    var isEmployeeCustomer = typeof customer !== 'undefined' && customer !== null && !empty(customer.profile) && 'isEmployee' in customer.profile.custom && customer.profile.custom.isEmployee;
    var qtyLimitType = typeof customer !== 'undefined' && customer !== null && customer.isAuthenticated() && isEmployeeCustomer ? 'employeeLineItemQtyLimit' : 'customerLineItemQtyLimit';
    var lineItemQtyLimit = (qtyLimitType in product.custom) && !empty(product.custom[qtyLimitType]) ? product.custom[qtyLimitType] : 0;
    // customer group limitation
    if (lineItemQtyLimit === 0) {
        var customerGroupQtyLimit = customerUtils.getCustomerGroupLineItemQtyLimit(customerCountry);
        if (customerGroupQtyLimit !== 0) {
            lineItemQtyLimit = customerGroupQtyLimit;
        }
    }

    // custom preferences limitation
    if (lineItemQtyLimit === 0) {
        var lineItemQtyLimitJSON = Site.getCurrent().getCustomPreferenceValue(qtyLimitType);
        var lineItemQtyLimitData = {};
        if (!empty(lineItemQtyLimitJSON)) {
            try {
                lineItemQtyLimitData = JSON.parse(lineItemQtyLimitJSON);
            } catch (e) {
                Logger.error("availabilityHelper.js getLineItemInventory function error: JSON parse failed. Can not parse site custom preference'{1}'. Error: {0}", e, qtyLimitType);
                return defaultMaxQty;
            }

            if (!empty(lineItemQtyLimitData[customerCountry])) {
                var qtyLocaleLimit = parseInt(lineItemQtyLimitData[customerCountry], 10);
                lineItemQtyLimit = !isNaN(qtyLocaleLimit) ? qtyLocaleLimit : lineItemQtyLimit;
            }
        }
    }
    lineItemQtyLimit = (lineItemQtyLimit !== 0) && (lineItemQtyLimit < defaultMaxQty) ? lineItemQtyLimit : defaultMaxQty;
    if (empty(ProductInventoryRecord) && !storeID) {
        return 0;
    }
    var perpetual = ProductInventoryRecord && ProductInventoryRecord.perpetual;
    // Any item which is marked as perpetual in BM will consider as always in-stock and no further inventory checked required for that item
    if (perpetual) {
        return lineItemQtyLimit;
    }

    // check Inventory in stock level value
    try {
        if (checkInventoryInStockLevel) {
            var inventoryRecord = ProductInventoryRecord;
            if (maoAvailability && MAOData) {
                var MAOStockLevel = MAOData.TotalQuantity;
                var MAOOnHandQuantity = MAOData.OnHandQuantity;
                if (MAOData.LocationId) {
                    MAOStockLevel = MAOData.Quantity;
                }
                if (!MAOData.LocationId) {
                    if (!empty(inventoryRecord) && inventoryRecord.getATS().getValue() !== MAOStockLevel) {
                        Transaction.wrap(function () {
                            MAOStockLevel = typeof MAOOnHandQuantity !== undefined && !empty(MAOOnHandQuantity) && !isNaN(MAOOnHandQuantity) ? MAOOnHandQuantity : MAOStockLevel;
                            inventoryRecord.setAllocation(MAOStockLevel);
                            if (typeof MAOData.FutureQuantity !== undefined && !empty(MAOData.FutureQuantity) && !isNaN(MAOData.FutureQuantity)) {
                                if (MAOData.NextAvailabilityDate && !empty(MAOData.NextAvailabilityDate)) {
                                    var inStockDate = new Date(MAOData.NextAvailabilityDate);
                                    if (inStockDate.toString() !== 'Invalid Date') {
                                        if (inStockDate > inventoryRecord.getInStockDate()) {
                                            inventoryRecord.setInStockDate(inStockDate);
                                        }

                                        var setOfPreOrderProducts = Site.current.getCustomPreferenceValue('preOrderStyles');
                                        if (((setOfPreOrderProducts.indexOf(product.ID) > -1) || (setOfPreOrderProducts.indexOf(product.masterProduct ? product.masterProduct.ID : product.ID) > -1)) && product.custom && product.custom.isPreOrder && inventoryRecord.getInStockDate() > new Date()) {
                                            inventoryRecord.setPreorderable(true);
                                        }
                                    }
                                }
                                inventoryRecord.setPreorderBackorderAllocation(MAOData.FutureQuantity);
                            }
                        });
                    }
                }
                lineItemQtyLimit = MAOStockLevel > lineItemQtyLimit ? lineItemQtyLimit : MAOStockLevel;
            } else if (!empty(inventoryRecord) && inventoryRecord.ATS.available) {
                var stockLevel = inventoryRecord.ATS.value;
                lineItemQtyLimit = stockLevel > lineItemQtyLimit ? lineItemQtyLimit : stockLevel;
            }
        }
    } catch (e) {
        Logger.error('Error while setting the inventory record :: ', e.message);
        return 0;
    }
    // customer style limitation
    if (product.custom.masterQtyLimit) {
        lineItemQtyLimit = lineItemQtyLimit > product.custom.masterQtyLimit ? product.custom.masterQtyLimit : lineItemQtyLimit;
    }
    return lineItemQtyLimit;
}
/**
 * validates that the BOPIS product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {string} checkPoint - checkpoint to validate inventory
 * @returns {Object} an error object
 */
function validateBOPISProductsInventory(basket, checkPoint) {
    var result = {
        error: false,
        availabilityError: false,
        hasInventory: true,
        moveItemsToShipping: [],
        partiallyAvailableBopisItems: [],
        lineItemQtyList: {},
        invalidItemsSku: []
    };
    try {
        if (basket) {
            const isBOPISEnabled = 'isBOPISEnabled' in Site.current.preferences.custom && Site.current.getCustomPreferenceValue('isBOPISEnabled');
            var maoBOPISAvailability = null;
            if (isMAOEnabled && Availability) {
                // eslint-disable-next-line spellcheck/spell-checker
                const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
                var storeHelpers = require('*/cartridge/scripts/helpers/storeHelpers');
                var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
                var isBopisCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled(checkPoint);
                if (realTimeInventoryCallEnabled && isBOPISEnabled && isBopisCheckPointEnabled) {
                    let itemsBOPIS = storeHelpers.getBopisData(basket);
                    if (!empty(itemsBOPIS && itemsBOPIS.items && itemsBOPIS.locations) && itemsBOPIS.items.length > 0) {
                        maoBOPISAvailability = Availability.getMaoAvailability(itemsBOPIS.items, itemsBOPIS.locations);
                    }
                }
            }
            var productLineItems = basket.productLineItems;
            collections.forEach(productLineItems, function (item) {
                var itemToModify = {};
                if (item.product === null || !item.product.online) {
                    result.error = true;
                    return;
                }
                if (Object.hasOwnProperty.call(item.custom, 'fromStoreId') && item.custom.fromStoreId && isBOPISEnabled) {
                    var store = StoreMgr.getStore(item.custom.fromStoreId);
                    var storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);
                    let lineItemQtyLimit = getLineItemInventory(item.product, true, maoBOPISAvailability, store.ID);

                    result.lineItemQtyList[item.UUID] = JSON.stringify({
                        lineItemQtyLimit: lineItemQtyLimit,
                        quantity: item.quantityValue
                    });

                    result.hasInventory = result.hasInventory && !empty(storeInventory) &&
                        (storeInventory.getRecord(item.productID) &&
                            storeInventory.getRecord(item.productID).ATS.value >= item.quantityValue);
                    itemToModify.lineItem = item;
                    itemToModify.quantity = lineItemQtyLimit;
                    itemToModify.id = item.product.ID;
                    itemToModify.fromStoreId = item.shipment.custom.fromStoreId;

                    // Remove the item completely
                    if (lineItemQtyLimit < 1) {
                        result.moveItemsToShipping.push(itemToModify);
                        result.availabilityError = true;
                    } else if (lineItemQtyLimit < item.quantityValue) { // Update product lineItems quantity
                        result.partiallyAvailableBopisItems.push(itemToModify);
                        result.availabilityError = true;
                    }
                    if (lineItemQtyLimit < 1 || lineItemQtyLimit < item.quantityValue) {
                        result.invalidItemsSku.push(item.product.custom.sku);
                    }
                }
            });
        }
    } catch (e) {
        var Logger = require('dw/system/Logger');
        Logger.error('basketValidationHelper.js - Error while executing validateBOPISProductsInventory: ' + e.message);
    }
    return result;
}
/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @param {string} checkPoint - checkpoint to validate inventory
 * @returns {Object} an error object
 */
function validateProductsInventory(basket, checkPoint) {
    var result = {
        error: false,
        availabilityError: false,
        hasInventory: true,
        fullyRemoved: [],
        partiallyRemoved: [],
        lineItemQtyList: {}
    };
    if (basket) {
        if (isMAOEnabled && Availability) {
            // eslint-disable-next-line spellcheck/spell-checker
            const AvailabilityHelper = require('int_mao/cartridge/scripts/availability/MAOAvailabilityHelper');
            var realTimeInventoryCallEnabled = Site.getCurrent().getCustomPreferenceValue('realTimeInventoryCallEnabled');
            var maoAvailability = null;
            var isCheckPointEnabled = AvailabilityHelper.isCheckPointEnabled(checkPoint);
            var items = AvailabilityHelper.getSKUS(basket);
            if (realTimeInventoryCallEnabled && isCheckPointEnabled) {
                if (!empty(items)) {
                    maoAvailability = Availability.getMaoAvailability(items);
                }
            }
        }
        var productLineItems = basket.productLineItems;
        collections.forEach(productLineItems, function (item) {
            var itemToModify = {};
            if (item.product === null || !item.product.online) {
                result.error = true;
                return;
            }
            if (!Object.hasOwnProperty.call(item.custom, 'fromStoreId')) {
                let lineItemQtyLimit = getLineItemInventory(item.product, true, maoAvailability, ''); // eslint-disable-line
                if (item.product.custom.exclusive.value === 'out-of-stock') {
                    lineItemQtyLimit = 0;
                }
                result.lineItemQtyList[item.UUID] = JSON.stringify({
                    lineItemQtyLimit: lineItemQtyLimit,
                    quantity: item.quantityValue
                });
                var availabilityLevels = item.product.availabilityModel
                    .getAvailabilityLevels(item.quantityValue);
                result.hasInventory = result.hasInventory &&
                    (availabilityLevels.notAvailable.value === 0);
                itemToModify.lineItem = item;
                itemToModify.quantity = lineItemQtyLimit;
                itemToModify.id = item.product.ID;
                // Remove the item completely
                if (lineItemQtyLimit < 1) {
                    result.fullyRemoved.push(itemToModify);
                    result.availabilityError = true;
                } else if (lineItemQtyLimit < item.quantityValue) { // Update product lineItems quantity
                    result.partiallyRemoved.push(itemToModify);
                    result.availabilityError = true;
                }
            }
        });
    }
    return result;
}

/**
 * validates that the product line items exist, are online, and have available inventory.
 * @param {dw.order.Basket} basket - The current user's basket
 * @returns {Object} an error object
 */
function validateProducts(basket) {
    var result = {
        error: false,
        hasInventory: true,
        hasEGC: false,
        isEGCValid: true
    };
    if (basket) {
        var productLineItems = basket.productLineItems;

        collections.forEach(productLineItems, function (item) {
            if (item.product === null || !item.product.online) {
                result.error = true;
                return;
            }

            if (Object.hasOwnProperty.call(item.custom, 'fromStoreId') &&
                !item.custom.fromStoreId) {
                var store = StoreMgr.getStore(item.custom.fromStoreId);
                var storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);

                result.hasInventory = result.hasInventory && !empty(storeInventory) &&
                    (storeInventory.getRecord(item.productID) &&
                        storeInventory.getRecord(item.productID).ATS.value >= item.quantityValue);
            } else if (!Object.hasOwnProperty.call(item.custom, 'fromStoreId')) {
                var availabilityLevels = item.product.availabilityModel
                    .getAvailabilityLevels(item.quantityValue);
                result.hasInventory = result.hasInventory &&
                    (availabilityLevels.notAvailable.value === 0);
            }
            if (Object.hasOwnProperty.call(item.custom, 'giftCard') && item.custom.giftCard.value === 'EGIFT_CARD') {
                const giftcardHelper = require('*/cartridge/scripts/giftcard/giftcardHelper');
                const TimezoneHelper = require('*/cartridge/scripts/util/TimezoneHelper');
                var timezoneHelper = new TimezoneHelper();
                var gcDeliveryDateUtcTime = timezoneHelper.convertSiteTimeToUTC(item.custom.gcDeliveryDate);
                var isValidDate = giftcardHelper.eGiftCardDateValidatation(gcDeliveryDateUtcTime);
                result.error = !isValidDate;
                result.hasEGC = true;
                result.isEGCValid = isValidDate;
            }
        });
    }

    return result;
}

module.exports = base;
module.exports.validateProducts = validateProducts;
module.exports.getLineItemInventory = getLineItemInventory;
module.exports.validateProductsInventory = validateProductsInventory;
module.exports.validateBOPISProductsInventory = validateBOPISProductsInventory;
