'use strict';

/** API INCLUDES */
const Status = require('dw/system/Status');
const ProductMgr = require('dw/catalog/ProductMgr');
const StringUtils = require('dw/util/StringUtils');
const Logger = require('dw/system/Logger');

/** File Includes */
const CatalogXml = require('~/cartridge/scripts/utils/CatalogXmlWriter');

// Global variables
const CustomObjectID = 'CombineProduct';
let customObjects,
    catalogXml;

function execute(params) {
    try {

        if (!params.MasterCatalogId || require('dw/catalog/CatalogMgr').getCatalog(params.MasterCatalogId) == null) {
            return new Status(Status.ERROR, 'Catalog not found.');
        }

        const catalogID = params.MasterCatalogId;
        const directory = 'directory' in params && params.directory ? params.directory : null;
        const fileName = 'fileName' in params && params.fileName ? params.fileName : null;

        if (!fileName || !directory) return new Status(Status.ERROR, 'Directory or filename not specified');

        customObjects = require('dw/object/CustomObjectMgr').getAllCustomObjects(CustomObjectID);
        Logger.info('Total custom objects: {0}', customObjects.count);

        if (customObjects.count <= 0) return new Status(Status.OK, 'No items to process.');

        catalogXml = new CatalogXml(catalogID);
        var file = catalogXml.createFile(directory, fileName);
        catalogXml.startHeaders();

        read(customObjects);

        catalogXml.endHeaders();
        customObjects.close();
    } catch (e) {
        return new Status(Status.ERROR, e.message);
    }
}

/**
 * Process custom object and create a product within the catalog.
 * @param {dw.catalog.Product} product to be processed
 * @return {void} - Returns void
 */
function process(customObject) {

    try {
        let isValidProduct = customObject && customObject.custom.masterProductID && require('dw/catalog/ProductMgr').getProduct(customObject.custom.masterProductID) != null;

        if (!isValidProduct) {
            Logger.error('Invalid product {0}. Skipping product...', customObject.custom.masterProductID);
            return;
        }
        const colorVariationAttributes = transformCoToArray('color', customObject.custom.colorVariationAttribute);
        const variantIds = 'variantProductIDs' in customObject.custom && customObject.custom.variantProductIDs ? customObject.custom.variantProductIDs.split(',') : [];
        const sizeVariationAttribute = 'sizeVariationAttribute' in customObject.custom && customObject.custom.sizeVariationAttribute ? 
            JSON.parse(customObject.custom.sizeVariationAttribute) : {};
        catalogXml.writeProduct(customObject.custom.masterProductID, variantIds, colorVariationAttributes, sizeVariationAttribute);
    } catch (error) {
        Logger.error(error.message)
    }
};

/**
 * Loop through the product list
 * @returns {object} product
 */
function read(customObjects) {
    while (!empty(customObjects) && customObjects.hasNext()) {
        process(customObjects.next());
    }
    return null;
};

/**
 * 
 * @param {string} inputString - in key value paired format: 103=White,102=Black
 * @returns 
 */
function transformCoToArray(variationAttrId, inputString) {
    const keyValuePairs = inputString.split(',');
    let resultArray = [{
        variationId: variationAttrId,
        items: [],
    }];

    for (let i = 0; i < keyValuePairs.length; i++) {
        let [value, name] = keyValuePairs[i].split('=');
        resultArray[0].items.push({
            name: name,
            value: value,
        });
    }

    return resultArray;
}


module.exports = {
    execute: execute,
    transformCoToArray: transformCoToArray
};