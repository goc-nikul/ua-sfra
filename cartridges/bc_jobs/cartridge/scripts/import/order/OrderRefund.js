'use strict';

let importOrderUtils = require('bc_jobs/cartridge/scripts/import/Utils'),
    Transaction = require('dw/system/Transaction'),
    Logger = require('dw/system/Logger'),
    File = require('dw/io/File'),
    OrderMgr = require('dw/order/OrderMgr'),
    Order = require('dw/order/Order'),
    ProductMgr = require('dw/catalog/ProductMgr'),
    Status = require('dw/system/Status'),
    ArrayList = require('dw/util/ArrayList'),
    Calendar = require('dw/util/Calendar'),
    Site = require('dw/system/Site'),
    Resource = require('dw/web/Resource'),
    Return = require('dw/order/Return'),
    Money = require('dw/value/Money'),
    Template = require('dw/util/Template'),
    Mail = require('dw/net/Mail'),
    HashMap = require('dw/util/HashMap'),
    HookMgr = require('dw/system/HookMgr'),
    StringUtils = require('dw/util/StringUtils'),
    ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils'),
    returnsUtils = new ReturnsUtils(),
    helpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');

    var collections = require('*/cartridge/scripts/util/collections');
    const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var emailHelper = require('*/cartridge/scripts/helpers/SFMCEmailHelper');

function execute(params) {
    if (empty(params.workingFolder)) {
        Logger.error('OrderRefund.js: Paramenter \'workingFolder\' is empty');
        return new Status(Status.ERROR, 'MISSING_CONFIG','Paramenter \'workingFolder\' is empty.');
    }

    let workingFolder = importOrderUtils.getWorkingFolder(params.workingFolder),
        filesParam = {
        Directory: workingFolder,
        SortDirection: params.sortDirection,
        FilePattern: params.filePattern,
        OnlyFiles: true,
        RecursiveSearch: false,
        offlineRefund: params.offlineRefund
    };

    let fileList = importOrderUtils.getFilesFromDirectory(filesParam);

    if (empty(fileList)) {
        Logger.debug('OrderRefund.js: Empty file list');
        return new Status(Status.OK, 'NO_FILES','No files for import.');
    }
    Logger.info('Number of files received= {0}',fileList.length);

    const processedFiles = new ArrayList ();
    let errorFileList = [];

    collections.forEach(fileList, function(fileForImport) {
        let importStatus = null;
        try {
        	Transaction.begin();
            let importResult = importOrderUtils.processImportFile(fileForImport, orderElementFilter, orderElementHandler, filesParam.offlineRefund);
            if (importResult.Status != 'success') {
                if(fileForImport.name.indexOf('INVALID') === -1) {
                    //rename file to mark it 'INVALID'
                    var invalidFile = new File([File.IMPEX, params.workingFolder, 'INVALID_' + fileForImport.name].join(File.SEPARATOR));
                    fileForImport.renameTo(invalidFile);
                }
                errorFileList.push(fileForImport.getFullPath());
                Logger.error('OrderRefund.js: Import of {0} failed', fileForImport.getFullPath());
                Transaction.rollback();
            } else {
                //if success, remove file mark 'INVALID'
                if(fileForImport.name.indexOf('INVALID') !== -1) {
                    var validFile = new File([File.IMPEX, params.workingFolder, fileForImport.name.replace('INVALID_', '')].join(File.SEPARATOR));
                    fileForImport.renameTo(validFile);
                }
                Transaction.commit();
                importStatus = 'success';
                processedFiles.add(fileForImport);
            }
        } catch (er) {
            var ex = er;
        	Logger.error('OrderRefund.js transactional Error: {0}', er);
        }

        if (importStatus != 'success') {
            Logger.error('OrderRefund.js: Import of {0} failed', fileForImport.getFullPath());
        } else {
            Logger.debug('OrderRefund.js: Import of {0} successfully completed', fileForImport.getFullPath());
        }
    });

    if (params.zipFiles) {
        require('bc_jobs/cartridge/scripts/import/ZipFiles.js').execute({
            fileList: processedFiles,
            sourceFolder: params.workingFolder,
            targetFolder: params.targetFolder,
            deleteFile: params.deleteFile,
            singleFile: params.singleFile
        });
    }
    if(errorFileList.length) {
        return new Status(Status.ERROR, 'IMPORT_ERROR', 'Some files are invalid, import failed');
    }
    return new Status(Status.OK);
}

var orderElementFilter = function(xmlReader) {
    return xmlReader.getLocalName() === 'order';
}

var orderElementHandler = function(element, offlineRefund, file) {
    let orderNo = element.attribute('order-no'),
        handlerTypeElement = element.elements('modification');
    var amount = '';
    var currency = '';
    var ordersToEmail = [];
    if (handlerTypeElement.length() === 1) {
    	amount = handlerTypeElement.elements('amount'),
        currency = handlerTypeElement.elements('currency');
    }
    if (orderNo.length() === 1) {
        let order = OrderMgr.getOrder(orderNo.toString());

        if (order !== null) {
            var processor = order.paymentInstruments.length > 0 ? order.paymentInstruments[0].paymentTransaction.paymentProcessor : null;
            if (processor && HookMgr.hasHook('app.payment.refund.' + processor.ID.toLowerCase())) offlineRefund = HookMgr.callHook('app.payment.refund.' + processor.ID.toLowerCase(), 'offlineRefund');
            // Refund
        	//check if order with following refund is not failed and not cancelled
        	if (order.getStatus().getValue() === Order.ORDER_STATUS_FAILED || order.getStatus().getValue() === Order.ORDER_STATUS_CANCELLED) {
        		Logger.info('OrderRefund.js: Refund skipped for order ' + order.getOrderNo() + ' since order has status ' + order.getStatus().getDisplayValue());
        		//skip refund if failed or cancelled
        		return;
        	}
            if (handlerTypeElement.length() === 1) {
                var refundDate = element.elements('order-date');
                var result = processRefund(order, handlerTypeElement, refundDate, offlineRefund, file);

                var date = new Date();
                var currentDate = 'Date:' + (date.getDate()+1) + ' Month:' + (date.getMonth()+1) + ' Year:' + date.getFullYear();
    	        order.addNote('Order Refund File ', 'File Name ' + file.name + ' Received On : ' + currentDate);

                if (result && result.status.statusCode === 200) {
                    ordersToEmail.push({
                        orderNo: orderNo.toString(),
                        newReturn: result.newReturn
                    });
                }

                //send emails
                if (ordersToEmail.length) {
                    let hookID = 'app.communication.oms.orderRefund',
                        customObjectdefinition = helpers.getCustomObject('MarketingCloudTriggers', hookID, false),
                        fromEmail = Resource.msg('email.from.defaultname', 'email', '');

                    ordersToEmail.forEach(function(orderObj) {
                        let orderToEmail = OrderMgr.getOrder(orderObj.orderNo);
                        request.setLocale(orderToEmail.custom.customerLocale);

                        let newReturn = orderObj.newReturn,
                            countryEnabled = !empty(customObjectdefinition) && customObjectdefinition.enabled && !empty(customObjectdefinition.countriesEnabled)
                                                ? customObjectdefinition.countriesEnabled.indexOf(orderToEmail.custom.customerCountry) !== -1 : false;

                        if (preferencesUtil.isCountryEnabled('SFMCEnabled') && countryEnabled && HookMgr.hasHook(hookID)) {
                            let params = {
                                Order: orderToEmail,
                                tax: newReturn ? newReturn.grandTotal.tax.value : '',
                                subTotal: newReturn ? newReturn.grandTotal.grossPrice.value : ''
                            }
                            let toJson = returnsUtils.parseJsonSafely(orderToEmail.custom.refundsJson) || [];
                            let orderRefundNumber = !empty(toJson) ? toJson.length : 0;
                            // Send shipment confirmation email
                            emailHelper.sendRefundConfirmationEmail(orderToEmail, params);
                            returnsUtils.toggleRefundsJson(orderToEmail, offlineRefund, orderRefundNumber);
                        }
                    });
                }

                if (result && result.status.statusCode !== 200) {
                    throw new Error('Refund is not successful, throwing error to rollback transaction');
                }
            }
        } else {
        	if (amount !== '' && currency !== '' && amount.length() === 1 && currency.length() === 1) {
        		sendRefundNotifyMail(order, amount.toString(), currency.toString(), '', file, 'REFUND_EMPTY_ORDER');
        	} else {
        		sendRefundNotifyMail(order, '', '', '', file, 'REFUND_EMPTY_ORDER');
        	}
            Logger.warn('OrderRefund.js: Order number is empty: {0}', orderNo.toString());
        }
    }
}

function processRefund(order, modification, refundDate, offlineRefund, file) {
    var processor = order.paymentInstruments.length > 0 ? order.paymentInstruments[0].paymentTransaction.paymentProcessor : null,
        amount = modification.elements('amount'),
        currency = modification.elements('currency'),
        transactionReference = modification.elements('transaction-reference'),
        reason = modification.elements('reason'),
        lineItems = modification.elements('line-items');
    var isRefundItemSkuEmpty = false,  isRefundQtyEmpty = false, isRefundItemAmountEmpty = false;

    if (lineItems.length() === 1) {
        let toJson = returnsUtils.parseJsonSafely(order.custom.refundsJson) || [],
            refDate = refundDate.toString();

        try {
            let calendar = new Calendar();
            calendar.parseByFormat(refDate, 'yyyy-MM-dd\'T\'HH:mm:ss.SSS');
            refDate = calendar.getTime().toISOString();
        } catch (e) {
            Logger.error('OrderRefund.js Error: {0}', e);
        }

        let refund = {
            emailSent: false,
            refundDate: refDate,
            refundAmount: amount.toString(),
            refundCurrency: currency.toString(),
            refundReason: reason.toString(),
            items: {},
            itemAmounts: {}
        };

        for each (let item in lineItems.elements('item')) {
            var itemSku = item.elements('sku').toString();
            var itemQty = item.elements('qty').toString();
            var itemAmount = item.elements('refund-amount').toString();
            //SEA (SINGPOST) passes product id as the sku value, adding
            //check if site is configured to use productIDs in this XML
            //and adjusting accordingly
            if (!returnsUtils.isIgnoredSKU(itemSku) && Site.getCurrent().getCustomPreferenceValue('orderStatusIDs').toString() == 'true') {
                let productId = StringUtils.trim(item.elements('sku').toString());

                if (ProductMgr.getProduct(productId) !== null) {
                    itemSku = ProductMgr.getProduct(productId).custom.sku;
                } else {
                    //No product found, saving xml value to JSON
                    Logger.error('OrderRefund.js Error: Shipping/Refund mapping error - Can\'t find item with ID: \'' + item.elements('sku').toString() + '\'' );
                }
            }
			if (typeof itemSku === 'undefined' || itemSku === null || itemSku === '') {
            	isRefundItemSkuEmpty = true;
            } else if(typeof itemQty === 'undefined' || itemQty === null || itemQty === '') {
            	isRefundQtyEmpty = true;
            } else if(typeof itemAmount === 'undefined' || itemAmount === null || itemAmount === '') {
            	isRefundItemAmountEmpty = true;
            }
            //if sku lineitem is not in order then process next sku
			if (!returnsUtils.getPLIBySKU(order, itemSku)) {//if sku lineitem is not in order then process next sku
				if (returnsUtils.isIgnoredSKU(itemSku)) {
					Logger.info('OrderRefund.js: Processing refund for ignored SKU ' + itemSku + ' in order #' + order.getOrderNo()+ '. Ignored SKU...');
				} else {
					Logger.error('OrderRefund.js: Cannot find item with SKU ' + itemSku + ' in order #' + order.getOrderNo() + '. Skipping SKU...');
				}
                continue;
            }

            refund.items[itemSku] = itemQty;
            refund.itemAmounts[itemSku] = itemAmount;
        }

        //create new Return based on XML
        let parsedLineItems = returnsUtils.getRefundLineItems(refund);
        let parsedLineItemsString = getPLIString(parsedLineItems);
        if (typeof transactionReference === 'undefined' || transactionReference === null || transactionReference === '' || transactionReference === '') { // If transactionReference is empty then send refund skipped mail
            Logger.error('OrderRefund.js: Error: Refund - Empty transactionReference: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_EMPTY_TRANSACTION_REFERENCE');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_EMPTY_TRANSACTION_REFERENCE');
            }
        } else if (typeof amount === 'undefined' || amount === null || amount === '' || amount === '') { // If order amount is empty then send refund skipped mail
            Logger.error('OrderRefund.js: Error: Refund - Empty order amount: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_EMPTY_ORDER_AMOUNT');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_EMPTY_ORDER_AMOUNT');
            }
        } else if (isRefundItemSkuEmpty) { // If sku is empty then send refund skipped mail
        	Logger.error('OrderRefund.js: Error: Refund - Empty SKU: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
            	sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_EMPTY_SKU');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_EMPTY_SKU');
            }
        } else if (isRefundQtyEmpty) { // If refundQty is empty then send refund skipped mail
        	Logger.error('OrderRefund.js: Error: Refund - Empty Qty: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_EMPTY_QTY');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_EMPTY_QTY');
            }
        } else if (isRefundItemAmountEmpty) { // If refundAmount is empty then send refund skipped mail
            Logger.error('OrderRefund.js: Error: Refund - Empty refund amount: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_EMPTY_REFUNDAMOUNT');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_EMPTY_REFUNDAMOUNT');
            }
        } else if (typeof transactionReference !== 'undefined' && transactionReference.length() === 1 && transactionReference.toString().length < 16 && isAdyenPayment(order)) {
            Logger.error('OrderRefund.js: Error: Refund - Invalid transactionReference length: ' +transactionReference.toString().length+':::'+ order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'REFUND_INVALID_TRANSACTION_REFERENCE');
            } else {
            	sendRefundNotifyMail(order, '', '', parsedLineItemsString,file,'REFUND_INVALID_TRANSACTION_REFERENCE');
            }
        } else if(order.getReturnCases().size() < 20) { //ReturnCases length is less than 20 then only create new return
        	var newReturn = returnsUtils.createReturnAccordingRefundLineItems(order, parsedLineItems);

	        //if return not created, skip processing
	        if (!returnsUtils.isIgnoredSKU(itemSku) && empty(newReturn)) {
	            Logger.error('OrderRefund.js: Error: Refund - Can\'t create return for order: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
	            if (order.getNotes().size() < 99) {
	                order.addNote('Error: Order Refund', 'Empty master product in item with SKU:' + itemSku + '. Please check variation, it could be unassigned from master. Refund not processed.');
	            }
	            returnsUtils.SetRefundsCountInfo(true, false, order);
	            if (amount.length() === 1 && currency.length() === 1) {
	                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'');
	            }
	        // added extra condition to avoid the refund Adyen call in case the failReturn function is triggered
	        } else if (!offlineRefund && !empty(newReturn) && newReturn.status == Return.STATUS_COMPLETED) {
	            Logger.error('OrderRefund.ds : (failReturn function is triggered) Can not create ReturnCase for order : {0}', order.orderNo );
	        } else {
	            toJson.push(refund);
	            order.custom.refundsJson = JSON.stringify(toJson);

	            if (amount.length() === 1 && currency.length() === 1 && transactionReference.length() === 1) {
	                let orderRefundNumber = !empty(toJson) ? toJson.length : 0,
	                    returnReference = (orderRefundNumber > 0) ? (order.orderNo + '-' + orderRefundNumber) : order.orderNo;
	                var result;

                    if (!offlineRefund) {
                        // catch block exists in Utils.js line number 284, to handle below exception
                        if (!HookMgr.hasHook('app.payment.provider.' + processor.ID.toLowerCase())) throw new Error('No Payment hooks declared');
                        result = HookMgr.callHook('app.payment.provider.' + processor.ID.toLowerCase(), 'Refund', transactionReference.toString(), amount.toString(), currency.toString(), returnReference, order, reason, newReturn);
	                    if (!empty(newReturn) && result.statusCode === 200) {
			 				try {
	                            toJson[toJson.length - 1].returnNumber = newReturn.getReturnNumber();
	                            order.custom.refundsJson = JSON.stringify(toJson);
	                        } catch (e) {
	                            Logger.error('OrderRefund.js error: Can not update refund with returnReference. OrderNo: {0}, returnNo: {1}, refundNo: {2}. Error: {3}', order.orderNo, returnToBeRefunded.getReturnNumber(), orderRefundNumber-1, e);
	                        }
						 }
	                } else {
	                    //Populate result variable if offline refund is selected
	                    result = {statusCode: 200};
	                }

	                if (offlineRefund && result.statusCode == 200) {
	                    //This refund is being handled 'offline', meaning DW is not responsible for communicating the refund to the payment processor
	                    //OR the refund email is being managed from the process job, not an order notify job

	                    //confirm return and create invoice with refund amount
	                    if (!empty(newReturn) && newReturn.status != Return.STATUS_COMPLETED) {
	                        var totalRefundAmount = new Money(parseFloat(amount.toString()), currency.toString());
	                        returnsUtils.processReturnToBeRefunded(order, newReturn, true, totalRefundAmount);
	                        //set returnNumber in refund
	                        try {
                                toJson[toJson.length - 1].returnNumber = newReturn.getReturnNumber();
                                toJson[toJson.length - 1].refunded = false;
                                if (processor && HookMgr.hasHook('app.payment.refund.' + processor.ID.toLowerCase())) HookMgr.callHook('app.payment.refund.' + processor.ID.toLowerCase(), 'updateorder', order);
	                            order.custom.refundsJson = JSON.stringify(toJson);
	                        } catch (e) {
	                            Logger.error('OrderRefund.js error. Can not update refund with returnNumber. OrderNo: {0}, returnNo: {1}, refundNo: {2}. Error: {3}', order.orderNo, returnToBeRefunded.getReturnNumber(), orderRefundNumber-1, e);
	                        }
                        }
                        if (isAdyenPayment(order)) {
                            //set up Adyen attributes for correct displaying 'Refund' order status on order history page
	                        order.custom.Adyen_refundStatus = result.statusCode == 200 ? 'Success' : 'Failed';
	                        //to ensure we have this data at time of refund email for offline integrations (KGInicis)
	                        order.custom.Adyen_refundAmount = amount.toString();
	                        order.custom.Adyen_refundCurrency = currency.toString();
                        }
	                }

	                if (result.statusCode != 200) {
	                    sendRefundNotifyMail(order, amount.toString(), currency.toString(), getPLIString(parsedLineItems),file,'');
	                    Logger.error('OrderRefund.js: Error: Modification/Refund failure for order: {0}, result: {1}', order.orderNo, result);
	                }

	                return {
	                    status: result,
	                    newReturn: newReturn
	                };
	            }
	        }
       } else {
            Logger.error('OrderRefund.js: Error: Refund - More than 20 return cases: ' + order.getOrderNo() + ' with items: ' + parsedLineItemsString);
            returnsUtils.SetRefundsCountInfo(true, false, order);
            if (amount.length() === 1 && currency.length() === 1) {
                sendRefundNotifyMail(order, amount.toString(), currency.toString(), parsedLineItemsString,file,'');
            }
       }
    }
}

function getPLIString(parsedLineItems) {
    let parsedLineItemsString = '';
    for (let i = 0; i < parsedLineItems.length; i++) {
        parsedLineItemsString += 'sku - ' + parsedLineItems[i].sku + ', qty - ' + parsedLineItems[i].qty + '; ';
    }
    return parsedLineItemsString;
}

function sendRefundNotifyMail(order, amount, currency, items,file,errorType) {
    let adyenNotifyEmail = preferencesUtil.getValue('AdyenNotifyEmail');
    if (empty(adyenNotifyEmail)) {
        return new Status(Status.ERROR, '\'adyenNofifyEmail\' site preference was not set');
    }

    let template = new Template('mail/adyennotification.isml'),
        mail = new Mail(),
        args = new HashMap();

    args.put('Order', order);
    args.put('Amount', amount);
    args.put('Currency', currency);
    args.put('Items', items);
    if (file !== null && file !== '' && file !== 'undefined' && file !== undefined) {
    	args.put('FileName',file.name);
    }
    if (errorType !== null && errorType !== '' && errorType !== 'undefined' && errorType !== undefined) {
    	args.put('NotificationType', errorType);
    } else if (order.getReturnCases().size() < 20) {
    	args.put('NotificationType', 'REFUND_SKIPPED');
    } else {
    	args.put('NotificationType', 'RETURNCASE_ERROR');
    }

    mail.setSubject(Resource.msgf('adyen.notification.refund.subject','adyen', null, order!=null?order.orderNo : ''));

    let content = template.render(args);

    mail.addTo(adyenNotifyEmail);
    mail.setFrom('system-notification@underarmour.com');
    mail.setContent(content);

    return mail.send(); //returns either Status.ERROR or Status.OK,  mail might not be sent yet, when this method returns
}

function isAdyenPayment(order) {
	var isAdyenPayment = false;
	try {
		var paymentInstruments = order.getPaymentInstruments(),
        PILength = paymentInstruments.length;

        for (var i = 0; i < PILength; i++) {
            if (paymentInstruments[i].getPaymentMethod() === 'AdyenComponent' || paymentInstruments[i].getPaymentMethod() === 'AdyenComponent') {
                isAdyenPayment = true;
            }
        }
	} catch (error) {
        Logger.error('OrderRefund.js: importOrderStatus: Error while checking isAdyenPayment {0}', '' + error);
    }
	return isAdyenPayment;
}

module.exports.execute = execute;
