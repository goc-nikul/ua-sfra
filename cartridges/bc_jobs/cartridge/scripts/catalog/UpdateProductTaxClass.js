'use strict';

var psm;
var FileWriter;
var xsw;
var products;
var Logger = require('dw/system/Logger');
var File = require('dw/io/File');
var Status = require('dw/system/Status');
var attDataObj;
// eslint-disable-next-line consistent-return
exports.beforeStep = function () {
    FileWriter = require('dw/io/FileWriter');
    var XMLStreamWriter = require('dw/io/XMLStreamWriter');

    var PreferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    attDataObj = PreferencesUtil.getJsonValue('taxClassCombinations');
    if (!attDataObj) {
        Logger.error('UpdateProductTaxClass.js: SiteData Custom Object with key TaxClassCombinations not found: ');
        return new Status(Status.ERROR, 'ERROR: SiteData Custom Object with key TaxClassCombinations not found: ');
    }

    // Create xml file that will be used to update the catalog products
    var date = new Date();
    var filename = 'youthCatalogTaxes_' + date.getFullYear() + (date.getMonth() + 1) + (date.getDate() + 1) + (date.getHours() + 1) + (date.getMinutes() + 1) + (date.getMilliseconds()) + '.xml';
    var file = new File(File.IMPEX + '/src/feeds/taxclass/' + filename);
    file.createNewFile();

    try {
        // Setup file writer variables
        var fw = new FileWriter(file, 'UTF-8');
        xsw = new XMLStreamWriter(fw);

        // Begin The XML document
        xsw.writeStartDocument('UTF-8', '1.0');
        xsw.writeCharacters('\n');
        xsw.writeStartElement('catalog');
        xsw.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/catalog/2006-10-31');
        xsw.writeAttribute('catalog-id', 'EMEACatalog');
        xsw.writeCharacters('\n');
    } catch (e) {
        Logger.error('UpdateProductTaxClass.js: Could not create and start xml file: ' + e);
        return new Status(Status.ERROR, 'ERROR: Could not create and start xml file: ' + e);
    }

    // Setup Product Search Model
    try {
        var ProductMgr = require('dw/catalog/ProductMgr');
        products = ProductMgr.queryAllSiteProducts();;
    } catch (e) {
        Logger.error('UpdateProductTaxClass.js: Error while processing search model: ' + e);
        return new Status(Status.ERROR, 'ERROR: Error while processing search model: ' + e);
    }
};

exports.getTotalCount = function () {
    return products.count;
};

exports.read = function (parameters) {
    if (!products.hasNext()) return null;
    var product = products.next();
    return (!parameters.runDeltaFeed || (product && (!product.taxClassID || product.taxClassID === 'standard'))) ? product : {};
};

function getTaxObject(product) {
    var taxClassObj = null;

    if(!product.master) {
        Object.keys(attDataObj).forEach(function (item) {
            if (attDataObj[item].gender.indexOf(product.custom.gender) !== -1 &&
                attDataObj[item].division.indexOf(product.custom.division) !== -1 &&
                attDataObj[item].enduse.indexOf(product.custom.enduse) !== -1 &&
                attDataObj[item].silhouette.indexOf(product.custom.silhouette) !== -1 &&
                attDataObj[item].subsilhouette.indexOf(product.custom.subsilhouette) !== -1 &&
                attDataObj[item].subsubsilhouette.indexOf(product.custom.subsubsilhouette) !== -1 &&
                attDataObj[item].ageGroup.indexOf(product.custom.agegroup) !== -1 &&
                product.getTaxClassID() !== attDataObj[item].taxClass) {
                var taxClass = ('taxClass' in attDataObj[item] && attDataObj[item].taxClass) ? attDataObj[item].taxClass : 'standard';
                taxClassObj = {
                    productID: product.getID(),
                    taxClass: taxClass
                };
                // Update the isTaxProcessed custom attribute
                product.custom.isTaxProcessed = true;
                // process next product
                return;
            }
        });
    }

    if (!taxClassObj) {
        taxClassObj = {
            productID: product.getID(),
            taxClass: 'standard'
        };
    }
    return taxClassObj;
}

exports.process = function (product) {
    var taxClassArray;
    if (product && product.master) {
        taxClassArray = [];
        // Add master product
        taxClassArray.push(getTaxObject(product));
        var representedProducts = product.variants;
        // loop through variants
        for (var i = 0; i < representedProducts.length; i++) {
            taxClassArray.push(getTaxObject(representedProducts[i]));
        }
    } else if (product && (product.variant || product.product)) {
        taxClassArray = [];
        taxClassArray.push(getTaxObject(product));
    }
    return taxClassArray;
};

// eslint-disable-next-line consistent-return
exports.write = function (lines) {
    for (var i = 0; i < lines.size(); i++) {
        var taxClassArray = lines.get(i);
        try {
            if (!empty(taxClassArray)) {
                for (var j = 0; j < taxClassArray.length; j++) {
                    var taxClassObj = taxClassArray[j];
                    if (!empty(taxClassObj)) {
                        xsw.writeStartElement('product');
                        xsw.writeAttribute('product-id', taxClassObj.productID);
                        xsw.writeCharacters('\n');
                        xsw.writeStartElement('tax-class-id');
                        xsw.writeCharacters(taxClassObj.taxClass);
                        xsw.writeEndElement(); // </tax-class-id
                        xsw.writeEndElement();  // </product>
                        Logger.debug('UpdateProductTaxClass.js: Updating Product: ' + taxClassObj.productID);
                    }
                }
            }
        } catch (e) {
            Logger.error('UpdateProductTaxClass.js: Could write variant: ' + e);
            return new Status(Status.ERROR, 'ERROR: Could write variant: ' + e);
        }
    }
};

// eslint-disable-next-line consistent-return
exports.afterStep = function (success) {
    if (success) {
        try {
            // Write the closing Feed element, then flush & close the stream
            xsw.writeEndDocument();
            xsw.flush();
            xsw.close();
        } catch (e) {
            Logger.error('UpdateProductTaxClass.js: Could not close file:: ' + e);
            return new Status(Status.ERROR, 'ERROR: Could not close file:: ' + e);
        }
    }
};
