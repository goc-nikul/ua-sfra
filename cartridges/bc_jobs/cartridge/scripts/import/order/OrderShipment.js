'use strict';

let importOrderUtils = require('bc_jobs/cartridge/scripts/import/Utils'),
    Transaction = require('dw/system/Transaction'),
    Logger = require('dw/system/Logger'),
    File = require('dw/io/File'),
    Order = require('dw/order/Order'),
    OrderMgr = require('dw/order/OrderMgr'),
    ProductMgr = require('dw/catalog/ProductMgr'),
    Status = require('dw/system/Status'),
    ArrayList = require('dw/util/ArrayList'),
    Shipment = require('dw/order/Shipment'),
    Calendar = require('dw/util/Calendar'),
    Site = require('dw/system/Site'),
    Template = require('dw/util/Template'),
    Resource = require('dw/web/Resource'),
    HashMap = require('dw/util/HashMap'),
    HookMgr = require('dw/system/HookMgr'),
    StringUtils = require('dw/util/StringUtils'),
    ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils'),
    returnsUtils = new ReturnsUtils(),
    ordersToEmail = new ArrayList();
var collections = require('*/cartridge/scripts/util/collections');
const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
var emailHelper = require('*/cartridge/scripts/helpers/SFMCEmailHelper');

function execute(params) {
    if (empty(params.workingFolder)) {
        Logger.error('OrderShipment.js: Paramenter workingFolder is empty');
        return new Status(Status.ERROR, 'MISSING_CONFIG','Paramenter workingFolder is empty.');
    }

    let workingFolder = importOrderUtils.getWorkingFolder(params.workingFolder),
        filesParam = {
        Directory: workingFolder,
        SortDirection: params.sortDirection,
        FilePattern: params.filePattern,
        OnlyFiles: true,
        RecursiveSearch: false
    };
    let fileList = importOrderUtils.getFilesFromDirectory(filesParam);

    if (empty(fileList)) {
        Logger.debug('OrderShipment.js: Empty file list');
        return new Status(Status.OK, 'NO_FILES','No files for import.');
    }

    let hookID = 'app.communication.oms.shipment';
    let helpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');
    let customObjectdefinition = helpers.getCustomObject('MarketingCloudTriggers', hookID, false);

    Logger.getLogger('shipment','ordershipment').info('Number of files received= {0}',fileList.length);
    var fileProcessed = 0;
    const processedFiles = new ArrayList ();
    const erroredFiles = [];
    collections.forEach(fileList, function(fileForImport) {
        try {
            let importStatus = null;
            Transaction.begin();
            Logger.info('Processing file: ', fileForImport.getFullPath());

            let importResult = importOrderUtils.processImportFile(fileForImport, orderElementFilter, orderElementHandler);
            if (importResult.Status != 'success') {
                Logger.error('OrderShipment.js: Import of {0} failed', fileForImport.getFullPath());
                erroredFiles.push(fileForImport.name);             
                Transaction.rollback();                    
                return new Status(Status.ERROR, 'IMPORT_ERROR', 'Import failed');
            } else {
                Transaction.commit();
                importStatus = 'success';                                      
                processedFiles.add(fileForImport);                  
            }

            if (importStatus != 'success') {
                Logger.error('OrderShipment.js: Import of {0} failed', fileForImport.getFullPath());
            } else {
                Logger.debug('OrderShipment.js: Import of {0} successfully completed', fileForImport.getFullPath());          
                //send emails
                if (ordersToEmail.length) {
                    for (let i = 0; i < ordersToEmail.length; i++) {
                        let orderToEmail = OrderMgr.getOrder(ordersToEmail[i]);

                        request.setLocale(orderToEmail.custom.customerLocale);
                        var dateFormatInvalid = false;
                        if (!empty(orderToEmail.custom.shippingJson)) { 
                             dateFormatInvalid = returnsUtils.getShippingDate(orderToEmail); 
                        }
                        let args = new HashMap(),
                            countryEnabled = !empty(customObjectdefinition) && customObjectdefinition.enabled && !empty(customObjectdefinition.countriesEnabled)
                                                ? customObjectdefinition.countriesEnabled.indexOf(orderToEmail.custom.customerCountry) !== -1 : false;
                        args.put('Order', orderToEmail);

                        if (preferencesUtil.isCountryEnabled('SFMCEnabled') && countryEnabled && HookMgr.hasHook(hookID) && dateFormatInvalid == false) {
                            let trackingLink = returnsUtils.getShippingTrackingLink(orderToEmail);
                            let trackingCode = returnsUtils.getShippingTrackingCode(orderToEmail);

                            let params = {
                                Order: orderToEmail,
                                trackingLink: trackingLink,
                                trackingCode: !empty(trackingCode) ? trackingCode: ''
                            }
                            // Send shipment confirmation email
                            var apiResponse = emailHelper.sendShipmentConfirmationEmail(orderToEmail, params);
                            var shippingJson = orderToEmail.custom.shippingJson  && JSON.parse(orderToEmail.custom.shippingJson) || '';
                            if (shippingJson && apiResponse.status === 'OK') {
                                Transaction.wrap(function () {
                                    orderToEmail.custom.shippingJson = updateEmailFlag(shippingJson);
                                });
                            }
                        }
                    }

                    ordersToEmail = new ArrayList();
                }
            }

            fileProcessed ++;
        } catch (ex) {
            Logger.error('OrderShipment.js file processing failedError: {0} ; lineNumber: {1} ; stack: {2}', '' + ex, ex.lineNumber, ex.stack);
        }
    });

    Logger.getLogger('shipment','ordershipment').info('Number of files Processed= {0}', fileProcessed);
    Logger.getLogger('shipment','ordershipment').info('Success: {0}', processedFiles.join("|"));
    Logger.getLogger('shipment','ordershipment').info('Errored: {0}', erroredFiles.join("|"));

    if (params.zipFiles) {
        require('bc_jobs/cartridge/scripts/import/ZipFiles.js').execute({
           // filePattern: params.filePattern,
            sourceFolder: params.workingFolder,
            targetFolder: params.targetFolder,
            fileList: processedFiles,
            deleteFile: params.deleteFile,
            singleFile: params.singleFile
        });
    }
    return new Status(Status.OK);
}

function executeWithoutEmail(params) {
    if (empty(params.workingFolder)) {
        Logger.error('OrderShipment.js executeWithoutEmail: Paramenter workingFolder is empty');
        return new Status(Status.ERROR, 'MISSING_CONFIG','Paramenter workingFolder is empty.');
    }

    let workingFolder = importOrderUtils.getWorkingFolder(params.workingFolder),
        filesParam = {
        Directory: workingFolder,
        SortDirection: params.sortDirection,
        FilePattern: params.filePattern,
        OnlyFiles: true,
        RecursiveSearch: false
    };
    let fileList = importOrderUtils.getFilesFromDirectory(filesParam);

    if (empty(fileList)) {
        Logger.debug('OrderShipment.js executeWithoutEmail: Empty file list');
        return new Status(Status.OK, 'NO_FILES','No files for import.');
    }
    collections.forEach(fileList, function() {
        let importStatus = null;

        Transaction.begin();

        let importResult = importOrderUtils.processImportFile(fileForImport, orderElementFilter, orderElementHandler);

        if (importResult.Status != 'success') {
            Logger.error('OrderShipment.js executeWithoutEmail: Import of {0} failed', fileForImport.getFullPath());
            Transaction.rollback();
            return new Status(Status.ERROR, 'IMPORT_ERROR', 'Import failed');
        } else {
            Transaction.commit();
            importStatus = 'success';
        }

        if (importStatus != 'success') {
            Logger.debug('OrderShipment.js executeWithoutEmail: Import of {0} failed', fileForImport.getFullPath());
        } else {
            Logger.debug('OrderShipment.js executeWithoutEmail: Import of {0} successfully completed', fileForImport.getFullPath());   
        }
    });
    return new Status(Status.OK);
}

var orderElementFilter = function(xmlReader) {
    return xmlReader.getLocalName() === 'order';
}

var orderElementHandler = function(element, offlineRefund, file) {
    let orderNo = element.attribute('order-no'),
        handlerTypeElement = element.elements('shipping');

    if (orderNo.length() === 1) {
        let order = OrderMgr.getOrder(orderNo.toString());

        if (order != null) {
            // Shipped
            if (handlerTypeElement.length() === 1) {
                if (order.custom.shippingJson) {
                    let toJson = returnsUtils.parseJsonSafely(order.custom.shippingJson),
                        trackingCode = handlerTypeElement.elements('tracking-code').toString();
                    for (let i = 0; i < toJson.length; i++) {
                        if (toJson[i].trackingCode.toString() == trackingCode) {
                            return false;
                        }
                    }
                }

                let shippingDate = element.elements('order-date');
                updateShippingData(order, handlerTypeElement, shippingDate, file);

                ordersToEmail.push(orderNo.toString());
            }
        } else {
            Logger.error('OrderShipment.js: Order not found: {0}', orderNo.toString());
        }
    }
}

function updateShippingData(order, shipping, shippingDate, file) {
    let iter = order.getShipments().iterator(),
        shipment = null,
        toJson = returnsUtils.parseJsonSafely(order.custom.shippingJson) || [],
        shipDate = shippingDate.toString();

    order.custom.shippingDate = new Date(); //NOW
    // Update order to shipped status and each shipment on the order
    order.setShippingStatus(Order.SHIPPING_STATUS_SHIPPED);
    
    var date = new Date();
    var currentDate = 'Date:' + (date.getDate()+1) + ' Month:' + (date.getMonth()+1) + ' Year:' + date.getFullYear();
	order.addNote('Order Shipment File ', 'File Name ' + file.name + ' Received On : ' + currentDate);
    
    while (iter != null && iter.hasNext()) {
        shipment = iter.next();
        shipment.setShippingStatus(Shipment.SHIPPING_STATUS_SHIPPED);
    }

    try {
        let calendar = new Calendar();
        calendar.parseByFormat(shipDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS');
        shipDate = calendar.getTime().toISOString();
    } catch (e) {
        Logger.error('OrderShipment.js Error: {0}', e);
    }

    let shipmentObj = {
        emailSent: false,
        date: shipDate,
        carrier: shipping.elements('carrier').toString(),
        deliveryNumber: shipping.elements('delivery-number').toString(),
        trackingCode: shipping.elements('tracking-code').toString(),
        trackingLink: shipping.elements('tracking-link').toString(),
        items: {}
    };

    for each (var item in shipping.elements("line-items").elements('item')) {
        //SEA (SINGPOST) passes product id as the sku value, adding
        //check if site is configured to use productIDs in this XML
        //and adjusting accordingly
        let itemSku;
        if (Site.getCurrent().getCustomPreferenceValue('orderStatusIDs') && Site.getCurrent().getCustomPreferenceValue('orderStatusIDs').toString() == 'true') {
            let productId = StringUtils.trim(item.elements('sku').toString());
            if (ProductMgr.getProduct(productId) != null) {
                itemSku = ProductMgr.getProduct(productId).custom.sku;
            } else {
                //No product found, saving xml value to JSON
                itemSku = item.elements('sku').toString();
                Logger.error('OrderShipment.js Error: Shipping/Refund failure - Can\'t find item with ID: ' + item.elements('sku').toString());
            }
        } else {
            //ProductIDs not used
            itemSku = item.elements('sku').toString();
        }
        let itemQty = item.elements('qty').toString();
        
        if(itemSku in shipmentObj.items){
            itemQty = parseInt(shipmentObj.items[itemSku]) + parseInt(itemQty);
            itemQty = itemQty.toString();
        }
        shipmentObj.items[itemSku] = itemQty;
    }

    toJson.push(shipmentObj);
    order.custom.isTrackedToPaazl = false;
    order.custom.shippingJson = JSON.stringify(toJson);
}

function updateEmailFlag (shippingJson) {
    /* Update Shipping JSON to reflect that order shipped */
    for (let i = 0, len = shippingJson.length; i < len; i++) {
        let object = shippingJson[i];
        
        if(object.emailSent != true && object.hasOwnProperty('items'))
            object.emailSent = true;
    }
    
    return JSON.stringify(shippingJson);
}

module.exports.execute = execute;
module.exports.executeWithoutEmail = executeWithoutEmail;