/* eslint-disable no-unused-vars */
'use strict';

const COM = require('dw/object/CustomObjectMgr');
const Transaction = require('dw/system/Transaction');
const customObjectName = 'ConstructorIO';
const logger = require('dw/system/Logger').getLogger('constructor', 'constructor');

/**
 * ES5 version of Object.fromEntries()
 * @param {Map} obj - transforms a list of key-value pairs into an object
 * @returns {Object} - Stringifyed version of map
 */
function fromEntries(obj) {
    const o = {};

    obj.forEach((v, k) => {
        o[k] = v;
    });

    return o;
}

/**
 * ES5 version of Object.entries()
 * @param {Object} obj - JS Object
 * @returns {Array} - Array output
 */
function entries(obj) {
    var entrys = [];
    for (var key of Object.keys(obj)) {
        entrys.push([key, obj[key]]);
    }

    return entrys;
}

/**
 * Get the total length of the object a JSON string
 * @param {map} inventory - Map object to stringify
 * @returns {string} - Stringifyed version of map
 */
function mapToString(inventory) {
    return JSON.stringify(fromEntries(inventory));
}

/**
 * Determine the char count of the Map as a stringified object
 * @param {map} inventory - Source map object
 * @param {number} maxLen - Max length of custom object is 200,000
 * @returns {string} - null | good | warning | exceded | undefined
 */
function checkLength(inventory, maxLen) {
    var len = mapToString(inventory).length;

    if (!maxLen) {
        return null;
    }

    if (len < maxLen) {
        return 'good';
    }

    if (len >= maxLen) {
        return 'exceeded';
    }

    return undefined;
}

/**
 * Return the total number of items in the inventory map
 * @param {map} inventory - Source map object
 * @returns {number} - Return the total number of items
 */
function numberOfObjects(inventory) {
    return Array.from(inventory).reduce((acc, [, value]) => {
        return acc + 1 + Object.keys(value).length;
    }, 0);
}

/**
 * Creates a map from the incoming Custom Object Text
 * @param {JSON} products - custom Object ID
 * @returns {map} - Map() of Maps
 */
function createMapFromString(products) {
    return products
        ? new Map(
            entries(
                typeof products === 'object' ? products : JSON.parse(products)
            )
        )
        : new Map();
}

/**
 * Merges incoming Deltas with the existing Map
 * @param {map} inventory - Source map object
 * @param {Object} deltas - Incoming deltas
 * @return {map} - Returns JSON as an Object Map
 */
function mergeDeltasFromJSONObj(inventory, deltas) {
    // ES6 Method
    // return new Map([
    //     ...inventory,
    //     ...new Map(Object.entries(deltas)),
    // ]);


    // ES5 Method
    var keys = Object.keys(deltas);

    for (var key of keys) {
        var delta = deltas[key];

        if (!inventory.has(key)) {
            // Store new product
            inventory.set(key, delta);
        } else {
            // Product exists. Update Variations
            var vkeys = Object.keys(delta);
            var product = inventory.get(key);

            for (var vkey of vkeys) {
                product[vkey] = deltas[key][vkey];
            }
        }
    }

    return inventory;
}

/**
 * Helper - Return the payload on the Mapped Custom Object as a JSON Object formmated for Constructor.IO
 * @param {map} inventory - Mapped Object of the Custom Object from BM
 * @returns {Object} - Formatted Payload Data
 */
function cioExport(inventory) {
    var variations = {
        variations: Array.from(inventory).map(([, variants]) => {
            return entries(variants).map((variation) => {
                var sku = variation[0];
                var count = variation[1];

                return {
                    id: sku,
                    data: {
                        facets: {
                            currentHealth: [count]
                        },
                        currentHealth: count
                    }
                };
            });
        })
    };
    return [].concat.apply([], variations.variations);
}

/**
 * Helper - Get Custom Object from Business Manager
 * @param {void} - No input required
 * @returns {*} - Copy of Custom Object From BM
 */
function getCustomObject() {
    var customObject = COM.getCustomObject(customObjectName, 'products');

    if (empty(customObject)) {
        Transaction.wrap(function () {
            customObject = COM.createCustomObject(customObjectName, 'products');
        });
    }

    return customObject;
}

/**
 * Helper - Save to Custom Object to Business Manager
 * @param {*} customObject - BM Custom Object
 * @param {Map} inventory - Map of Inventory Deltas
 */
function saveDeltas(customObject, inventory) {
    logger.info('BEGIN saveDeltas');
    var x = mapToString(inventory);
    logger.info('inventory after conversion: ' + x);
    try {
        Transaction.wrap(function () {
            // eslint-disable-next-line no-param-reassign
            customObject.custom.products = mapToString(inventory);
        });
    } catch (e) {
        logger.error('Error writing inventory to custom object: {0}', e.message);
    }
    logger.info('END saveDeltas');
}

/**
 * Helper = ES5 version of ES6 Object.assign()
 * @param {Object} target - Source Object to be cloned
 * @returns {Object} - Clone of Target
*/
function objAssign(target) {
    var to = Object(target);

    for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource !== null && nextSource !== undefined) {
            // eslint-disable-next-line no-restricted-syntax
            for (var nextKey in nextSource) {
                // Avoid bugs when hasOwnProperty is shadowed
                if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
                    to[nextKey] = nextSource[nextKey];
                }
            }
        }
    }
    return to;
}

/**
 * Helper - Adds variant to Map without creating any dupicates
 * @param {number|string} styleId - Products main item ID
 * @param {number|string} itemId - Either Varient ID or SKU
 * @param {number} available - Number of items available
 */
function addMAODeltas(styleId, itemId, available) {
    logger.info('BEGIN addMAODeltas');
    logger.info('styleId: ' + styleId);
    logger.info('itemId: ' + itemId);
    logger.info('available: ' + available);
    var deltas = new Map().set(styleId, fromEntries(new Map().set(itemId, available)));
    var customObject = getCustomObject();

    // Load up the inventory delta from Custom Object
    var inventoryJSON = (customObject && customObject.custom && customObject.custom.products) ? customObject.custom.products : undefined;
    var inventory = createMapFromString(inventoryJSON);

    // Merge in the new Deltas
    var deltaObj = JSON.parse(JSON.stringify(fromEntries(deltas)));
    logger.info('deltaObj: ' + deltaObj);
    inventory = mergeDeltasFromJSONObj(inventory, deltaObj);

    // check size of custom object after merging in the new deltas
    var requestLength = checkLength(inventory, 200000);

    // if custom object exceeds api.object.stringAttributeLength quota, create new object
    if (typeof requestLength === 'undefined') {
        throw new Error('Incorrect data passed. Verify the params in the checkLength function in cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js are present and correct.');
    } else if (requestLength === null) {
        throw new Error('The value for the api.object.stringAttributeLength quota must be passed to check the custom object size for Constructor.io inventory updates. Check the 2nd param in the checkLength function in cartridges/app_ua_core/cartridge/scripts/constructorio/inventoryStateManager.js.');
    } else if (requestLength === 'exceeded') {
        Transaction.wrap(function () {
            customObject = COM.createCustomObject(customObjectName, 'products');
        });

        // Merge in the new Deltas
        inventory = undefined;
        deltaObj = JSON.parse(JSON.stringify(fromEntries(deltas)));
        inventory = mergeDeltasFromJSONObj(inventory, deltaObj);
    }

    logger.info('inventory: ' + inventory);
    // Save to Custom Object
    saveDeltas(customObject, inventory);

    logger.info('END addMAODeltas');
}

module.exports.createMapFromString = createMapFromString;
module.exports.mergeDeltasFromJSONObj = mergeDeltasFromJSONObj;
module.exports.mapToString = mapToString;
module.exports.numberOfObjects = numberOfObjects;
module.exports.checkLength = checkLength;
module.exports.cioExport = cioExport;
module.exports.getCustomObject = getCustomObject;
module.exports.addMAODeltas = addMAODeltas;
module.exports.fromEntries = fromEntries;
module.exports.entries = entries;
module.exports.objAssign = objAssign;
