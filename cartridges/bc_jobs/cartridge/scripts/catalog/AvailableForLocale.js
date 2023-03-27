'use strict';

var Catalog = require('dw/catalog');
var Status = require('dw/system/Status');
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var XMLStreamWriter = require('dw/io/XMLStreamWriter');
var Product = require('dw/catalog/Product');
/**
 * AvailableForLocale.js
 * Look up for products where not set custom attribute availableForLocale and prepare xml file with update
 */


//Counters for logging and Product Array to ensure that we aren't writing needless duplicate product attributes.
var availableCounter = 0;
var usCounter = 0;

/**
 *
 * @param {Object} params Wrapper for all params
 * @param {String} params.CatalogsList The list of catalogs to check.
 */
function execute(params) {
    var catalogList =  params.CatalogsList;
    var catalogs = catalogList.split(',');

    if (catalogs.length == 0) {
        return new Status(Status.ERROR, 'ERROR', 'LocaleAvailability.js: No catalogs provided to update');
    }

    try {
        var dir = new File(File.IMPEX + '/' + params.exportDirectory);
        var file = new File(File.IMPEX + '/' + params.exportDirectory +'/catalog_product_availability.xml');
        var fw = new FileWriter(file, 'UTF-8');
        var xsw = new XMLStreamWriter(fw);

        //Generate IMPEX file location and xml file
        dir.mkdirs();
        file.createNewFile();

        //Write XML header to newly created file
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', params.masterCatalogID);
    } catch(e) {
        return new Status(Status.ERROR, 'ERROR', 'LocaleAvailability.js: Could not create xml file ' +  e);
    }

    for (var i = 0; i < catalogs.length; i++) {
        writeProductsForCatalog(catalogs[i], xsw);
    }

    Logger.error('LocaleAvailability.js: Found ' + availableCounter + ' products without `availableForLocale` attribute');
    try {
        xsw.writeEndDocument();
    } catch(e) {
        return new Status(Status.ERROR, 'ERROR', 'LocaleAvailability.js: Could not close xml file ' + e);
    }

    xsw.flush();
    xsw.close();
}

function writeProductsForCatalog(catalog, xsw) {
    var PM = Catalog.ProductMgr;
    var CM = Catalog.CatalogMgr;
    var products = PM.queryProductsInCatalog(CM.getCatalog(catalog));

    var productCount = 1;
	var arrayCount = 0;
	var productExist = 0;
    var productsToModify = [];
    while (products.hasNext()) {
        var product = Product(products.next());

        productExist = 0;
        for each(var productlist in productsToModify) {
            if(productlist.indexOf(product.ID) != -1) {
                productExist = 1;
                break;
            }
        }

        if (product.master && productExist == 0) {
            if (!('availableForLocale' in product.custom) || (product.custom.availableForLocale == 'None')) {
                if (productsToModify[arrayCount] == null) {
                    productsToModify[arrayCount] = [];
                }

            	productsToModify[arrayCount].push(product.ID);

            	productCount=productCount+1;
                if(Number.isInteger(productCount/20000)){
                 	arrayCount = arrayCount+1;
                }

                xsw.writeStartElement('product');
                xsw.writeAttribute('product-id', product.getID());
                xsw.writeStartElement('custom-attributes');
                availableCounter++;
                xsw.writeStartElement('custom-attribute');
                xsw.writeAttribute('attribute-id', 'availableForLocale');
                xsw.writeAttribute('xml:lang', 'x-default');
                xsw.writeCharacters('Yes');
                xsw.writeEndElement();

                xsw.writeEndElement();//</custom-attributes>
                xsw.writeEndElement();//</product>
            }
        }
    }

    products.close();
}

module.exports.execute = execute;
