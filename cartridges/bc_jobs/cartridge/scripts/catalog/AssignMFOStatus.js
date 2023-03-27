'use strict';

/**
 * LocaleAvailability.js
 * Look up for products where not set custom attribute availableForLocale and prepare xml file with update
 */
const Catalog = require('dw/catalog'),
      Status = require('dw/system/Status'),
      Logger = require('dw/system/Logger'),
      File = require('dw/io/File'),
      FileWriter = require('dw/io/FileWriter'),
      XMLStreamWriter = require('dw/io/XMLStreamWriter'),
      Product = require('dw/catalog/Product');


//Counters for logging and Product Array to ensure that we aren't writing needless duplicate product attributes.
let availableCounter = 0,
    usCounter = 0,
    productsToModify = [];

/**
 * 
 * @param {Object} params Wrapper for all params
 * @param {String} params.CatalogsList The list of catalogs to check.
 */
function execute(params) {
    const catalogList =  params.CatalogsList,
          catalogs = catalogList.split(',');
    
    if (catalogs.length == 0) {
        return new Status(Status.ERROR, 'ERROR', 'AssignMFOStatus.js: No catalogs provided to update');
    }

    try {
        const dir = new File(File.IMPEX + '/src/feeds/mfoData/'),
              file = new File(File.IMPEX + '/src/feeds/mfoData/catalog_mfo_flag.xml');
              
        
        //Generate IMPEX file location and xml file
        dir.mkdirs();
        file.createNewFile();
        var fw = new FileWriter(file, 'UTF-8'),
        	xsw = new XMLStreamWriter(fw);

        //Write XML header to newly created file
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id',  'NACatalog');
    } catch(e) {
        return new Status(Status.ERROR, 'ERROR', 'AssignMFOStatus.js: Could not create xml file ' +  e);
    }

    for (var i = 0; i < catalogs.length; i++) {
        writeProductsForCatalog(catalogs[i], xsw);
    }

    Logger.info('AssignMFOStatus.js: Found ' + availableCounter + ' products without `isMFOItem` attribute');

    try {
        xsw.writeEndDocument();
    } catch(e) {
        return new Status(Status.ERROR, 'ERROR', 'AssignMFOStatus.js: Could not close xml file ' + e);
    }

    xsw.flush();
    xsw.close();
}

function writeProductsForCatalog(catalog, xsw) {
    const PM = Catalog.ProductMgr,
          CM = Catalog.CatalogMgr,
          products = PM.queryProductsInCatalog(CM.getCatalog(catalog));
    while (products.hasNext()) {
        let product = Product(products.next());

        if (product.master && productsToModify.indexOf(product.ID) == -1) {
            if (!('isMFOItem' in product.custom) || (product.custom.isMFOItem == 'None') ) {
                productsToModify.push(product.ID);

                xsw.writeStartElement('product');
                xsw.writeAttribute('product-id', product.getID());
                xsw.writeStartElement('custom-attributes');
                availableCounter++;
                xsw.writeStartElement('custom-attribute');
                xsw.writeAttribute('attribute-id', 'isMFOItem');
                xsw.writeCharacters(false);
                xsw.writeEndElement();
                
                xsw.writeEndElement();//</custom-attributes>
                xsw.writeEndElement();//</product>
            }
        }
    }

    products.close();
}

module.exports.execute = execute;