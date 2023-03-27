'use strict';
/* eslint-disable  spellcheck/spell-checker */
/* eslint-disable  prefer-const */
/*
 * API Includes
 */
const Logger = require('dw/system/Logger');
const OrderMgr = require('dw/order/OrderMgr');
const StringUtils = require('dw/util/StringUtils');
const Calendar = require("dw/util/Calendar");
const OrderExportUtils = require('int_mao/cartridge/scripts/OrderExportUtils');
const IO = require('dw/io');
const Site = require('dw/system/Site');

function execute(params) {
    
    let siteId = Site.getCurrent().getID(),
        filePath = IO.File.IMPEX + IO.File.SEPARATOR + params.exportDirectory,
        fileDir = IO.File(filePath).mkdirs(),
        timeFrameCal = new Calendar(),
        fileTimestamp = StringUtils.formatCalendar(timeFrameCal, "YYYYMMddHHmm"),
        feedFile = IO.File(filePath + IO.File.SEPARATOR + params.fileName + '_' + siteId + '_' + fileTimestamp + ".txt");

    if(feedFile.exists()) {
        feedFile.remove();
        feedFile = IO.File(filePath + IO.File.SEPARATOR + params.fileName + '_' + siteId + '_' + fileTimestamp + ".txt");;
    }
    
    let feedFileWriter = IO.FileWriter(feedFile, "UTF-8");
    
    let orderList = params.orderList.split(',');
    
    for each(let orderID in orderList) {
        try{
            let order = OrderMgr.getOrder(orderID);
            let orderRequest = getRequest(order, params.orderUpdate);
            feedFileWriter.writeLine(orderRequest);
            feedFileWriter.writeLine("\n");
            feedFileWriter.flush();    
        }
        catch(e){
            Logger.error('Error generating order ' + orderID + ': ' + e.message);
        }
        
    }
    feedFileWriter.flush();
    feedFileWriter.close();    

};

function getRequest(order, update){
    if (update){
        let orderStatus = order.status.value;
        if (orderStatus === order.ORDER_STATUS_FAILED) {
            // Cancel request to MAO if order status is failed
            return OrderExportUtils.getOrderCancelRequestJSON(order);
        } else if ((orderStatus === order.ORDER_STATUS_NEW || orderStatus === order.ORDER_STATUS_OPEN) && !empty(order.custom.updates) && order.custom.updates.indexOf('paymentDetailsUpdate') !== -1) {
            // Updated payment details request if order status is placed and "Updates" custom attribute contains "paymentDetails"
            return OrderExportUtils.getUpdatePaymentRequestJSON(order);
        } else if ((orderStatus === order.ORDER_STATUS_NEW || orderStatus === order.ORDER_STATUS_OPEN) && !empty(order.custom.updates) && order.custom.updates.indexOf('fraudCheck') !== -1 && !order.custom.onHold) {
            // confirm order request if order status is placed and "Updates" custom attribute contains "fraudCheck" and "onHold" custom attribute is not "TRUE"
            return OrderExportUtils.getConfirmOrderRequestJSON(order);
        }
    }
    else{
        return OrderExportUtils.getOrderJSON(order);
    }
}

module.exports.execute = execute;

