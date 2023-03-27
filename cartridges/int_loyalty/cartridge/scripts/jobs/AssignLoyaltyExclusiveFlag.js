'use strict';

const File = require('dw/io/File');
const Status = require('dw/system/Status');
const Logger = require('dw/system/Logger');
const Catalog = require('dw/catalog');
const FileWriter = require('dw/io/FileWriter');
const XMLStreamWriter = require('dw/io/XMLStreamWriter');

// Counters for logging and Product Array to ensure that we aren't writing needless duplicate product attributes.
let availableCounter = 0;

/**
* Checked if isLoyaltyExclusive empty
* @param {dw.catalog.Product} product - product to be checked if isLoyaltyExclusive empty
* @returns {boolean} - is product master and isLoyaltyExclusive is empty
*/
function isLoyaltyExclusiveEmpty(product) {
    return product.master && (!('isLoyaltyExclusive' in product.custom) || empty(product.custom.isLoyaltyExclusive));
}

/**
* Writes product dafault loyalty value xml
* @param {string} catalog - catalog id
* @param {dw.io.XMLStreamWriter} xsw - xml stream writer
*/
function writeProductsForCatalog(catalog, xsw) {
    const PM = Catalog.ProductMgr;
    const CM = Catalog.CatalogMgr;
    const products = PM.queryProductsInCatalog(CM.getCatalog(catalog));

    while (products.hasNext()) {
        let product = products.next();

        if (isLoyaltyExclusiveEmpty(product)) {
            xsw.writeStartElement('product');
            xsw.writeAttribute('product-id', product.getID());
            xsw.writeStartElement('custom-attributes');
            availableCounter++;
            xsw.writeStartElement('custom-attribute');
            xsw.writeAttribute('attribute-id', 'isLoyaltyExclusive');
            xsw.writeCharacters(false);
            xsw.writeEndElement();

            xsw.writeEndElement();// </custom-attributes>
            xsw.writeEndElement();// </product>
        }
    }

    products.close();
}

/**
 * Assigns false to product.custom.isLoyaltyExclusive if the value was None
 * @returns {dw.system.Status} - job status
 * @param {Object} params Wrapper for all params
 * @param {string} params.CatalogsList The list of catalogs to check.
 */
function execute(params) {
    const catalogs = params.CatalogsList.split(',');

    if (catalogs.length === 0) {
        return new Status(Status.ERROR, 'ERROR', 'AssignLoyaltyExclusiveFlag.js: No catalogs provided to update');
    }

    let fw;
    let xsw;

    try {
        const dir = new File(File.IMPEX + '/src/feeds/loyaltyData/');
        const file = new File(File.IMPEX + '/src/feeds/loyaltyData/catalog_loyalty_flag.xml');

        // Generate IMPEX file location and xml file
        dir.mkdirs();
        file.createNewFile();
        fw = new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);

        // Write XML header to newly created file
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', 'NACatalog');
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', 'AssignLoyaltyExclusiveFlag.js: Could not create xml file ' + e);
    }

    for (let i = 0; i < catalogs.length; i++) {
        writeProductsForCatalog(catalogs[i], xsw);
    }

    Logger.info('AssignLoyaltyExclusiveFlag.js: Found ' + availableCounter + ' products without `isLoyaltyExclusive` attribute');

    try {
        xsw.writeEndDocument();
    } catch (e) {
        return new Status(Status.ERROR, 'ERROR', 'AssignLoyaltyExclusiveFlag.js: Could not close xml file ' + e);
    }

    xsw.flush();
    xsw.close();

    return new Status(Status.OK);
}

module.exports.execute = execute;
