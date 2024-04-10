'use strict';

const Status = require('dw/system/Status');
var ProductMgr = require('dw/catalog/ProductMgr');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var StringUtils = require('dw/util/StringUtils');
var Calendar = require('dw/util/Calendar');


const Logger = require('dw/system/Logger');

var products;
var file;
var productAvailableToDelete = false;
var fileWriter;
var productsToDelete = 0;


/**
 * QUery all products assgned to the site and create a catalog file to import in delete mode.
 * @param {*} params - step parameters
 *  Create the catalog xml file to get the products to delete.
 * @returns {void} - Returns void
 */
exports.beforeStep = function (params) { // eslint-disable-line consistent-return
    try {
        // Query all the site products to process
        products = ProductMgr.queryAllSiteProducts();
        var isDeleteProduct = params.deleteProduct;
        var timestamp = StringUtils.formatCalendar(new Calendar(new Date()), 'yyyy-MM-dd_HH:mm:ss');

        // Set the WebDav path to generate the catalog file.
        if (isDeleteProduct) {
            file = new File(File.IMPEX + '/src/feeds/masterProductCleanup/');
        } else {
            file = new File(File.IMPEX + '/src/archive/masterProductCleanup/');
        }
        if (!file.isDirectory()) {
            file.mkdirs();
        }
        if (isDeleteProduct) {
            file = new File(File.IMPEX + '/src/feeds/masterProductCleanup/catalog_masterProductCleanup' + timestamp + '.xml');
            Logger.info('File created at src/feeds/masterProductCleanup/ : {0}', file.getName());
        } else {
            file = new File(File.IMPEX + '/src/archive/masterProductCleanup/catalog_masterProductCleanup' + timestamp + '.xml');
            Logger.info('File created at /src/archive/masterProductCleanup/ : {0}', file.getName());
        }
        if (file.exists()) {
            file.remove();
        }

        var catalogID = params.MasterCatalogId;
        fileWriter = new FileWriter(file, 'UTF-8');
        fileWriter.write('<catalog xmlns="http://www.demandware.com/xml/impex/catalog/2006-10-31" catalog-id="' + StringUtils.stringToXml(catalogID) + '">\n');
        fileWriter.write('<header>\n');
        fileWriter.write('</header>\n');
    } catch (e) {
        Logger.error('Error occurred in masterProductCleanup.js: {0}' + e.message);
        if (fileWriter) {
            fileWriter.close();
        }
    }
};

exports.getTotalCount = function () {
    return products.getCount();
};

/**
 * Loop through the product list
 * @returns {dw.catalog.Product|null} product
 */
exports.read = function () {
    while (!empty(products) && products.hasNext()) {
        return products.next();
    }
    return null;
};

/**
 * Process master product with no variants assigned and write it to the xml file.
 * @param {dw.catalog.Product} product to be processed
 * @return {void} - Returns void
 */
exports.process = function (product) { // eslint-disable-line consistent-return
   // write the master product with no variants assgned to the catalog file.
    if (product.master && product.variants.empty) {
        productAvailableToDelete = true;
        productsToDelete++;
        fileWriter.write('<product product-id="' + StringUtils.stringToXml(product.ID) + '">\n');
        fileWriter.write('</product>\n');
        Logger.info('Master product to delete added to the file:{0}', product.ID);
    }
};

exports.write = function () {
    return;
};

/**
 * Executes after processing all the chunks
 * close the fileReader objects
 * @returns {Object} OK
 */
exports.afterStep = function () {
    fileWriter.write('</catalog>');
    // remove the file if no products found to delete
    if (!productAvailableToDelete) {
        file.remove();
        Logger.info('Zero products found to delete. Removing the generated file {0}', file.getName());
    }
    Logger.info('Total {0} products added to the catalog file for deletion', productsToDelete);
    fileWriter.flush();
    fileWriter.close();
    return new Status(Status.OK, 'OK', 'Finished');
};
