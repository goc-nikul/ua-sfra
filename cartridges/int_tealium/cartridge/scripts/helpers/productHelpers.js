'use strict'; /* eslint-disable prefer-const */

/**
 * Fetch the inventory of the default Variant selected on PDP page load
 *
 * @param {String} productID - product ID  
 * @return {object} - return variantProduct object and inventory value
 */
function getSelectedVariant(productId) {
    let Logger = require('dw/system/Logger');
    var ProductMgr = require('dw/catalog/ProductMgr');
        
    try {
        var product = ProductMgr.getProduct(productId);
        
        if (product) {
            var productInventoryRecord = product.isVariant() && product.availabilityModel && product.availabilityModel.inventoryRecord ? product.availabilityModel.inventoryRecord.ATS.value : null;
            if (productInventoryRecord) {
                return {
                    error : false,
                    variantProduct: product,
                    inventoryATSValue : productInventoryRecord
                }
            }
        }
        return {
            error : true,
            variantProduct: null,
            inventoryATSValue: 0
        }
    } catch (e) {
        Logger.error('int_tealium/cartridge/scripts/helpers/productHelpers.js::getSelectedVariant() ' + e.message);
        return {
            error : true,
            variantProduct: null,
            inventoryATSValue: 0
        };
    }
}


module.exports.getSelectedVariant = getSelectedVariant;
