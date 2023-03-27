'use strict';

const MAOPreferences = require('~/cartridge/scripts/MaoPreferences');
var MAOLogger = require('dw/system/Logger').getLogger('mao_availability');

/**
 * Return the sku's in array format from the basket
 * @param {Object} basket - Basket object
 * @returns {Array} Items - Array of items
 */
function getSKUS(basket) {
    const collections = require('*/cartridge/scripts/util/collections');
    const items = [];
    if (basket) {
        collections.forEach(basket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.product && (!('giftCard' in lineItem.product.custom) || !(lineItem.product.custom.giftCard.value === 'EGIFT_CARD')) && !lineItem.shipment.custom.fromStoreId) {
                if (Object.prototype.hasOwnProperty.call(lineItem.custom, 'sku') && lineItem.custom.sku) {
                    items.push(lineItem.custom.sku);
                } else {
                    MAOLogger.info('MAOEmptySKU (MAOAvailabilityHelper.js) : Product {0} has empty sku', lineItem.productID);
                }
            }
        });
    }
    return items;
}

/**
 * Return the sku's in array format from the basket
 * @param {dw.util.Collection} productSearchHits - productSearchHits object
 * @returns {Array} Items - Array of items
 */
function getGiftBoxSKUS(productSearchHits) {
    const collections = require('*/cartridge/scripts/util/collections');
    const items = [];
    if (productSearchHits) {
        collections.forEach(productSearchHits, function (productSearchHit) {
            var product = productSearchHit.getProduct();
            var variantProduct = product.isMaster() ? product.getVariationModel().getDefaultVariant() : product;
            if (Object.prototype.hasOwnProperty.call(variantProduct.custom, 'sku') && variantProduct.custom.sku) {
                items.push(variantProduct.custom.sku);
            } else {
                MAOLogger.info('MAOEmptySKU (MAOAvailabilityHelper.js) : Product {0} has empty sku', variantProduct.ID);
            }
        });
    }
    return items;
}

/**
 * Return the sku's & stores in array format from the basket
 * @param {Object} basket - Basket object
 * @returns {Object} Items & stores - Object with Array of items & stores
 */
function getInstorePickUpSKUS(basket) {
    const collections = require('*/cartridge/scripts/util/collections');
    var bopisData = {};
    bopisData.items = [];
    bopisData.locations = [];
    if (basket) {
        collections.forEach(basket.getAllProductLineItems(), function (lineItem) {
            if (lineItem.custom.fromStoreId) {
                if (Object.prototype.hasOwnProperty.call(lineItem.custom, 'sku') && lineItem.custom.sku) {
                    bopisData.items.push(lineItem.custom.sku);
                    bopisData.locations.push(lineItem.custom.fromStoreId);
                } else {
                    MAOLogger.info('MAOEmptySKU (MAOAvailabilityHelper) : Product {0} has empty sku', lineItem.productID);
                }
            }
        });
    }
    return bopisData;
}
/**
 * Prepare the request object for availability service
 * @param {Array} items - Items array
 * @param {Array} locations - locations array
 * @returns {Object} availabilityRequest
 */
function getAvailabilityRequest(items, locations) { //eslint-disable-next-line
    var customerCountry = session.custom.customerCountry || request.getLocale().slice(-2).toUpperCase();
    var availabilityRequest = {};
    if (locations) {
        availabilityRequest = JSON.parse(MAOPreferences.MaoBOPISViewDefinition);
        availabilityRequest.Items = items;
        availabilityRequest.Locations = locations;
        availabilityRequest.OrderAttributes = {
            CountryCode: customerCountry
        };
    } else {
        availabilityRequest = JSON.parse(MAOPreferences.MaoViewDefinition);
        availabilityRequest.Items = items;
    }
    return availabilityRequest;
}


/**
 *
 *
 * @param {Object} response - response object from MAO
 * @returns {Object} availabilityMap
 */
function parseResponse(response) {
    var availabilityData;
    var availabilityMap = {};
    if (response && response.statusCode === 200) {
        var responseText = JSON.parse(response.text);
        if (!empty(responseText.data)) {
            availabilityData = {};
            var quantity = [];
            var storeId = [];
            responseText.data.forEach(function (element) {
                availabilityData.Status = element.Status;
                if (element.LocationId) {
                    availabilityData.Quantity = element.Quantity;
                    availabilityData.LocationId = element.LocationId;
                    quantity.push(element.Quantity);
                    storeId.push(element.LocationId);
                } else {
                    availabilityData.TotalQuantity = element.TotalQuantity;
                    if (typeof element.OnHandQuantity !== undefined && !isNaN(element.OnHandQuantity)) {
                        availabilityData.OnHandQuantity = element.OnHandQuantity;
                    }
                    if (typeof element.FutureQuantity !== undefined && !isNaN(element.FutureQuantity)) {
                        availabilityData.FutureQuantity = element.FutureQuantity;
                    }
                    if (element.NextAvailabilityDate) {
                        availabilityData.NextAvailabilityDate = element.NextAvailabilityDate;
                    }
                }
                availabilityData.quantity = quantity;
                availabilityData.storeId = storeId;
                availabilityMap[element.ItemId] = JSON.stringify(availabilityData);
            });
        }
    }
    return availabilityMap;
}

// eslint-disable-next-line spellcheck/spell-checker
/**
 * checking wether the checkpoint is enabled or not for realtime inventory call
 * @param {string} checkPoint - checkopoint to make realtime inventory call
 * @returns {boolean} - returns checkPoint enabled or not
 */
function isCheckPointEnabled(checkPoint) {
    if (!checkPoint) {
        return false;
    }
    const ArrayList = require('dw/util/ArrayList');
    var realTimeInventoryCheckPoints = (new ArrayList(MAOPreferences.RealTimeInventoryCheckPoints)).toArray();
    var result = realTimeInventoryCheckPoints.filter(function (element) {
        return element.value.equals(checkPoint);
    });
    return !empty(result);
}

/**
 * Returns all the stores that are having stock for the products in basket
 *
 * @param {Object} basketResponse - basket response to ocapi call
 * @returns {Object} result - Store stocks per PLI
 */
function getBOPISStoresBySKUOCAPI(basketResponse) {
    const SystemObjectMgr = require('dw/object/SystemObjectMgr');
    const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    const collections = require('*/cartridge/scripts/util/collections');
    const storesIterator = SystemObjectMgr.getAllSystemObjects('Store');
    const storesArray = storesIterator.asList().toArray();
    const lineItemObj = {};
    const productItems = basketResponse.product_items;
    collections.forEach(productItems, function (productItem) {
        const productUUID = productItem.item_id;
        const productID = productItem.product_id;
        lineItemObj[productUUID] = [];
        storesArray.forEach(store => {
            const storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);

            const hasInventory = !empty(storeInventory) &&
                (storeInventory.getRecord(productID) &&
                    storeInventory.getRecord(productID).ATS.value >= productItem.quantity);

            if (hasInventory) {
                const storeJSON = {};
                storeJSON[store.ID] = storeInventory.getRecord(productID).ATS.value;
                lineItemObj[productUUID].push(storeJSON);
            }
        });
    });

    return lineItemObj;
}

/**
 * Returns all the stores that are having stock for the products in basket
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {Object} result - Store stocks per PLI
 */
function getBOPISStoresBySKU(basket) {
    const SystemObjectMgr = require('dw/object/SystemObjectMgr');
    const ProductInventoryMgr = require('dw/catalog/ProductInventoryMgr');
    const storesIterator = SystemObjectMgr.getAllSystemObjects('Store');
    const storesArray = storesIterator.asList().toArray();
    const lineItemObj = {};
    basket.getAllProductLineItems().toArray().forEach(lineItem => {
        const productUUID = lineItem.UUID;
        const productID = lineItem.productID;
        lineItemObj[productUUID] = [];
        storesArray.forEach(store => {
            const storeInventory = ProductInventoryMgr.getInventoryList(store.custom.inventoryListId);

            const hasInventory = !empty(storeInventory) &&
                (storeInventory.getRecord(productID) &&
                    storeInventory.getRecord(productID).ATS.value >= lineItem.quantityValue);

            if (hasInventory) {
                const storeJSON = {};
                storeJSON[store.ID] = storeInventory.getRecord(productID).ATS.value;
                lineItemObj[productUUID].push(storeJSON);
            }
        });
    });

    return lineItemObj;
}

/**
 * Returns all the stores that are having stock for the products in basket
 *
 * @param {dw.order.Basket} basket - currentBasket
 * @returns {Object} result - Store stocks per PLI
 */
function getBOPISDetails(basket) {
    const lineItemObj = {};
    basket.getAllProductLineItems().toArray().forEach(lineItem => {
        const productUUID = lineItem.UUID;
        const productID = lineItem.productID;
        if (lineItem.custom.fromStoreId) {
            lineItemObj[productUUID] = {
                quantity: lineItem.quantityValue,
                productID: productID,
                productUUID: productUUID,
                storeID: lineItem.custom.fromStoreId
            };
        }
    });

    return lineItemObj;
}

module.exports = {
    getAvailabilityRequest: getAvailabilityRequest,
    parseResponse: parseResponse,
    isCheckPointEnabled: isCheckPointEnabled,
    getGiftBoxSKUS: getGiftBoxSKUS,
    getSKUS: getSKUS,
    getInstorePickUpSKUS: getInstorePickUpSKUS,
    getBOPISStoresBySKU: getBOPISStoresBySKU,
    getBOPISDetails: getBOPISDetails,
    getBOPISStoresBySKUOCAPI: getBOPISStoresBySKUOCAPI
};
