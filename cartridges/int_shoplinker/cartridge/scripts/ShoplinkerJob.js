/* API imports */
var Logger = require('dw/system/Logger').getLogger('shoplinker', 'shoplinker');
var ArrayList = require('dw/util/ArrayList');
var Status = require('dw/system/Status');

/* Module imports */
var shopLinkerCalls = require('~/cartridge/scripts/Shoplinker');
var CatalogMgr = require('dw/catalog/CatalogMgr');

/**
 * Function to send shoplinkerdata
 * @param {Object} shopLinkerData - object of shoplinker data
 */
function sendShopLinkerData(shopLinkerData) {
    // for each ( var materialData in shopLinkerData ) {
    Object.keys(shopLinkerData).forEach(function (md) {
        var materialData = shopLinkerData[md];
        Logger.debug('Processing ' + materialData.material);
        if (materialData.sent === 0) {
            // No variants for this color are in shoplinker, send each one
            var materialDataVariants = materialData.variants.notSent.iterator();
            // for each ( var pid in materialData.variants.notSent ) {
            while (materialDataVariants.hasNext()) {
                let pid = materialDataVariants.next();
                Logger.debug('G2 call for ' + pid);
                shopLinkerCalls.callG2(pid);
                // Mark product as sent
            }
            // Send all variants bound to the material. Material is created based on variants data
            Logger.debug('G3 call for ' + materialData.material);
            shopLinkerCalls.callG3(materialData.variants.notSent);
            // G6 not required for update, only initial creation
            Logger.debug('G6 call for ' + materialData.material);
            shopLinkerCalls.callG6(materialData.material);
        }
        // Update Data, Images, and Advanced Data for the current material
        Logger.debug('G4 call for ' + materialData.material);
        shopLinkerCalls.callG4(materialData.material);
        Logger.debug('G5 call for ' + materialData.material);
        shopLinkerCalls.callG5(materialData.material);
    });
}

/**
 * Function to get shoplinker data
 * @param {Object} product - object of product
 * @returns {Object} - returns shoplinker data to send
 */
function getShopLinkerData(product) {
    var variants = product.getVariants();
    var materials = {};
    var variantsItr = variants.iterator();
    // for each ( var variant in variants ) {
    while (variantsItr.hasNext()) {
        let variant = variantsItr.next();
        if (variant.custom.color == null) continue; // eslint-disable-line no-continue
        let material = variant.custom.style + '-' + variant.custom.color;
        // Build JSON for each material/color if one does not already exist
        if (!Object.prototype.hasOwnProperty.call(materials, material)) {
            materials[material] = {
                material: material,
                sent: 0,
                variants: {
                    notSent: new ArrayList()
                }
            };
        }
        // Check if product is exist in shoplinker
        // call product_list API
        Logger.debug('G7 call for ' + variant.ID);
        var isProductSentToShopLinker = shopLinkerCalls.callG7(variant.ID);
        if (isProductSentToShopLinker) {
            materials[material].sent++;
        } else {
            materials[material].variants.notSent.add(variant.ID);
        }
    }
    return materials;
}

/**
 * function to get data from variants
 * @param {collection} variantCollection - collection of variants
 * @returns {Object} - return the shoplinkerdata for variants
 */
function getShopLinkerDataFromCategoryVariants(variantCollection) {
    var materials = {};
    while (variantCollection.hasNext()) {
        let shopLinkerVariant = variantCollection.next();
        if (shopLinkerVariant.custom.color == null) continue; // eslint-disable-line no-continue
        let variants = shopLinkerVariant.getVariationModel().getMaster().getVariants();
        var material = shopLinkerVariant.custom.style + '-' + shopLinkerVariant.custom.color;
        // Build JSON for each material/color if one does not already exist
        if (!Object.prototype.hasOwnProperty.call(materials, material)) {
            materials[material] = {
                material: material,
                sent: 0,
                variants: {
                    notSent: new ArrayList()
                }
            };
        }
        // Sent count is greater than 0, G2/G3 calls will not be sent, no need to iterate through variants
        if (materials[material].sent > 0) continue; // eslint-disable-line no-continue
        materials[material].variants.notSent.add(shopLinkerVariant.ID);

        // variants.forEach(function(variant) {
        variants = variants.iterator();
        while (variants.hasNext()) {
            var variant = variants.next();
            // Build JSON for each material/color if one does not already exist
            if (shopLinkerVariant.custom.color === variant.custom.color) {
                // Check if product is exist in shoplinker
                // call product_list API
                Logger.debug('G7 call for ' + variant.ID);
                var isProductSentToShopLinker = shopLinkerCalls.callG7(variant.ID);
                if (isProductSentToShopLinker) {
                    materials[material].sent++;
                    // Sent count is greater than 0, G2/G3 calls will not be sent, no need to continue iteration
                    break;
                }
            }
        }
    }
    return materials;
}


exports.execute = function execute() {
    try {
        // Pull all products from shoplinker category and iterate to pull required data
        var products = CatalogMgr.getCategory('shoplinker').getProducts().iterator();
        var variantCollection = new ArrayList();
        var shopLinkerData;
        while (products.hasNext()) {
            var product = products.next();
            shopLinkerData = {};
            if (product.isMaster()) {
                Logger.debug('Collected information from SFCC product: ');
                Logger.debug(JSON.stringify(shopLinkerData));
                shopLinkerData = getShopLinkerData(product);
                sendShopLinkerData(shopLinkerData);
            } else if (product.isVariant()) variantCollection.add(product);
        }
        // Take all variants in category and convert to shopLinkerObject, then make appropriate calls
        shopLinkerData = getShopLinkerDataFromCategoryVariants(variantCollection.iterator());
        Logger.debug('Collected information from SFCC product: ');
        Logger.debug(JSON.stringify(shopLinkerData));
        sendShopLinkerData(shopLinkerData);
    } catch (e) {
        Logger.error('Shoplinker - Could not send productData to shoplinker ' + e.message);
        return new Status(Status.ERROR);
    }

    return new Status(Status.OK);
};
