'use strict';


var Status = require('dw/system/Status');
var io = require('dw/io');
var File = require('dw/io/File');
var Site = require('dw/system/Site');
var ProductMgr = require('dw/catalog/ProductMgr');
var Transaction = require('dw/system/Transaction');
var Logger = require('dw/system/Logger');
var Calendar = require('dw/util/Calendar');
var StringUtils = require('dw/util/StringUtils');
var Resource = require('dw/web/Resource');
var jobLogger = Logger.getLogger('updatePreorderInventory', 'updatePreorderInventory');

/**
 * Creates the empty file. If folders in path don't exist, it will create folders as well
 * @param {string} directoryPath directory path
 * @param {string} fileName file name
 * @returns {File} inventoryOutFile
 **/
function getFile(directoryPath, fileName) {
    var directory = new File(File.IMPEX + File.SEPARATOR + directoryPath);
    if (!directory.exists()) {
        directory.mkdirs();
    }
    var inventoryOutFile = new File(File.IMPEX + File.SEPARATOR + directoryPath + File.SEPARATOR + fileName);
    return inventoryOutFile;
}

/**
 * Write reduced inventory header for provided inventory ID. Use US as default
 * @param {io.XMLIndentingStreamWriter} xmlWriter xml writer
 * @param {*} params job params
 */
function writeInventoryHeader(xmlWriter, params) {
    var inventoryListId = !empty(params.inventoryListId) ? params.inventoryListId : 'US_Ecomm_Inventory';
    var inventoryListDefaultInStockFlag = params.inventoryListDefaultInStockFlag;

    xmlWriter.writeStartDocument();
    xmlWriter.writeStartElement('inventory');
    xmlWriter.writeAttribute('xmlns', 'http://www.demandware.com/xml/impex/inventory/2007-05-31');
    xmlWriter.writeStartElement('inventory-list');

    // Start the Header Element
    xmlWriter.writeStartElement('header');
    xmlWriter.writeAttribute('list-id', inventoryListId);

    xmlWriter.writeStartElement('default-instock'); xmlWriter.writeCharacters(inventoryListDefaultInStockFlag); xmlWriter.writeEndElement();

    // End the Header Element
    xmlWriter.writeEndElement();

    // Start the records Element
    xmlWriter.writeStartElement('records');
}

/**
 * Write closing xml tags for inventory file
 * @param {io.XMLIndentingStreamWriter} xmlWriter xml writer
 */
function endXml(xmlWriter) {
    xmlWriter.writeEndElement(); // End records element
    xmlWriter.writeEndElement(); // End inventory-list element
    xmlWriter.writeEndElement(); // End inventory element
}

/**
 * Write xml inventory record element
 * @param {io.XMLIndentingStreamWriter} xmlWriter xml writer
 * @param {string} productId product id for the inventory record
 * @param {boolean} isPreOrder controls preorder-backorder-handling value (preorder/none)
 * @param {dw.catalog.ProductInventoryRecord|null} productInventoryRecord productInventoryRecord
 */
function populateInventoryRecord(xmlWriter, productId, isPreOrder, productInventoryRecord) {
    xmlWriter.writeStartElement('record');
    xmlWriter.writeAttribute('product-id', productId);
    if (empty(productInventoryRecord)) {
        xmlWriter.writeStartElement('allocation');
        xmlWriter.writeCharacters(0);
        xmlWriter.writeEndElement();
    }
    xmlWriter.writeStartElement('preorder-backorder-handling');
    if (isPreOrder) {
        xmlWriter.writeCharacters('preorder');
    } else {
        xmlWriter.writeCharacters('none');
    }
    xmlWriter.writeEndElement(); // End record element
    xmlWriter.writeEndElement(); // End preorder-backorder-handling element
}

/**
 * Returns formatted date text eg. 04/31 when inventory record is pre-order and MAO in stock date is provided
 * The date is equal to MAO inventory date + Number of days from site preference preOrderShipByDateDiff
 * When record is not preorder it returns empty string, regardless of the provided date
 *
 * @param {Date|null} inStockDate Pre-order date
 * @param {boolean} isPreOrder preorder/none
 * @returns {string} formatted date text eg. 04/31
 */
function formatPreOrderDate(inStockDate, isPreOrder) {
    var preOrderDateFormatted = '';
    if (isPreOrder && !empty(inStockDate)) {
        var preOrderDateDiff = Site.current.getCustomPreferenceValue('preOrderShipByDateDiff') || 0;
        var inStockCalendar = new Calendar(inStockDate);
        inStockCalendar.add(Calendar.DATE, preOrderDateDiff);
        preOrderDateFormatted = StringUtils.formatCalendar(inStockCalendar, 'MM/dd');
    }
    return preOrderDateFormatted;
}

/**
 * Updates product custom attributes isPreOrder, preOrderPDPMessage, preOrderProductTileMessage.
 * preOrderPDPMessage and preOrderProductTileMessage are updated with ShipBy date (MAO inventory date + Number of days from site preference preOrderShipByDateDiff)
 * @param {dw.catalog.Product} product product to be updated
 * @param {boolean} isPreOrder controls isPreOrder custom attribute
 * @param {dw.catalog.ProductInventoryRecord|null} productInventoryRecord productInventoryRecord
 */
function updateProduct(product, isPreOrder, productInventoryRecord) {
    if (!empty(product)) {
        var inStockDate = !empty(productInventoryRecord) ? productInventoryRecord.getInStockDate() : null;
        var preOrderDateFormatted = formatPreOrderDate(inStockDate, isPreOrder);

        /* eslint-disable */
        Transaction.wrap(function () {
            product.custom.isPreOrder = isPreOrder;
            product.custom.preOrderPDPMessage = !empty(preOrderDateFormatted) ? Resource.msgf('preorder.pdp.message', 'product', null, preOrderDateFormatted) : '';
            product.custom.preOrderProductTileMessage = !empty(preOrderDateFormatted) ? Resource.msgf('preorder.producttile.message', 'product', null, preOrderDateFormatted) : '';
        });
        /* eslint-enable */
    }
}
/**
 * Write xml inventory record element in the xml file and updates the product attributes
 * When master product is provided, all variants under the master are updated.
 * @param {io.XMLIndentingStreamWriter} xmlWriter xml writer
 * @param {string[]} productIDsList list of product ids
 * @param {boolean} isPreOrder controls preorder-backorder-handling value (preorder/none)
 */
function writeInventoryRecordForProductList(xmlWriter, productIDsList, isPreOrder) {
    var collections = require('*/cartridge/scripts/util/collections');

    for (let i = 0; i < productIDsList.length; i++) {
        var productID = productIDsList[i].trim();
        var product = !empty(productID) ? ProductMgr.getProduct(productID) : null;
        if (product) {
            // Inspect if product is master. Use all variants instead of master
            if (product.isMaster()) {
                var allVariants = product.getVariants();
                collections.forEach(allVariants, function (variantProduct) {
                    var variantID = variantProduct.getID();
                    var productAvailabilityModel = variantProduct.getAvailabilityModel();
                    var productInventoryRecord = !empty(productAvailabilityModel) ? productAvailabilityModel.getInventoryRecord() : null;
                    updateProduct(variantProduct, isPreOrder, productInventoryRecord);
                    populateInventoryRecord(xmlWriter, variantID, isPreOrder, productInventoryRecord);
                });
            } else {
                var productAvailabilityModel = product.getAvailabilityModel();
                var productInventoryRecord = !empty(productAvailabilityModel) ? productAvailabilityModel.getInventoryRecord() : null;
                updateProduct(product, isPreOrder, productInventoryRecord);
                populateInventoryRecord(xmlWriter, productID, isPreOrder, productInventoryRecord);
            }
        } else {
            jobLogger.error('Product {0} from {1} is not found in the catalog', productID, isPreOrder ? 'preOrderProductList' : 'inStockProductList');
        }
    }
}

/**
 * Accepts a CSV list of products from site preference preOrderProductList and sets inventory preorder-backorder-handling flag to 'preorder' on the inventory record.
 * Accepts a CSV list of products from site preference inStockProductList and sets inventory preorder-backorder-handling flag to 'none' on the inventory record.
 * When master product is provided, all variants under the master are updated.
 * Updates product custom attributes isPreOrder, preOrderPDPMessage, preOrderProductTileMessage with ShipBy date (MAO inventory date + Number of days from site preference preOrderShipByDateDiff)
 */

module.exports.execute = function (params) {
    // Get CSV product list
    var preOrderProductListCSV = Site.current.getCustomPreferenceValue('preOrderProductList');
    var inStockProductListCSV = Site.current.getCustomPreferenceValue('inStockProductList');
    if (empty(preOrderProductListCSV) && empty(inStockProductListCSV)) {
        return new Status(Status.OK, 'OK', 'List of products is not provided in site custom preference preOrderProductList and inStockProductList. Inventory is not updated');
    }
    var preOrderProductList = !empty(preOrderProductListCSV) ? preOrderProductListCSV.split(',') : [];
    var inStockProductList = !empty(inStockProductListCSV) ? inStockProductListCSV.split(',') : [];

    try {
        // Create inventory import file
        var timestamp = StringUtils.formatCalendar(new Calendar(new Date()), 'yyyy-MM-dd_HH:mm:ss');
        var fileName = params.fileNamePrefix + '_' + timestamp + '.xml';
        var inventoryOutFile = getFile(params.targetDirectoryPath, fileName);
        var writer = new io.FileWriter(inventoryOutFile);
        var xmlWriter = new io.XMLIndentingStreamWriter(writer);

        writeInventoryHeader(xmlWriter, params);

        // Populate file and update products
        writeInventoryRecordForProductList(xmlWriter, preOrderProductList, true);
        writeInventoryRecordForProductList(xmlWriter, inStockProductList, false);

        endXml(xmlWriter);
        xmlWriter.flush();
        xmlWriter.close();
        writer.flush();
        writer.close();
    } catch (e) {
        jobLogger.error('File Creation error: {0} {1} ', e.message, e.stack);
        return new Status(Status.ERROR, 'ERROR', e);
    }
    return new Status(Status.OK, 'OK', ' File Created successfully');
};
