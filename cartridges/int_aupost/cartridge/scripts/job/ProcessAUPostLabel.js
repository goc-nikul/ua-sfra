'use strict';
module.exports.processLabel = function () {
    var Logger = require('dw/system/Logger');
    var Status = require('dw/system/Status');
    var CustomObjectMgr = require('dw/object/CustomObjectMgr');
    var OrderMgr = require('dw/order/OrderMgr');
    var Transaction = require('dw/system/Transaction');
    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
    var Encoding = require('dw/crypto/Encoding');
    var Bytes = require('dw/util/Bytes');
    try {
        var returns = CustomObjectMgr.queryCustomObjects('ReturnXML', 'custom.readyToExport = {0} AND custom.currencyCode = {1}', null, false, 'AUD');
        while (returns.hasNext()) {
            var ret = returns.next();
            var returnCaseNumber = ret.custom.returnID;
            if (!empty(returnCaseNumber)) {
                var order = OrderMgr.getOrder(ret.custom.dwOrderNo);
                if (!empty(order)) {
                    var returnCase = order.getReturnCase(returnCaseNumber);
                    if (!empty(returnCase) && !empty(returnCase.custom.manifest)) {
                        var pdfLink = returnCase.custom.manifest;
                        var Service = require('*/cartridge/scripts/svc/downloadAUPostlabelService');
                        var service = Service.downloadAUPostlabel('aupost.pdf', pdfLink, returnCaseNumber);
                        var getPdfRes = service.call();
                        var shipLabel;
                        if (getPdfRes.ok) {
                            shipLabel = Encoding.toBase64(new Bytes(getPdfRes.object));
                            if (!empty(shipLabel)) {
                                // eslint-disable-next-line no-loop-func
                                Transaction.wrap(function () {
                                    returnCase.custom.shipmentLabel = shipLabel;
                                    ret.custom.readyToExport = true;
                                });
                                returnHelpers.sendReturnCreatedConfirmationEmail(order, returnCase);
                            }
                        } else {
                            Logger.error('Error in ProcessAUPostLabel.js :: {0}', 'service failed for return case#' + returnCaseNumber);
                        }
                    } else {
                        Logger.error('Error in ProcessAUPostLabel.js :: {0}', 'No Return case found or pdk link not exist for  return case#' + returnCaseNumber);
                    }
                } else {
                    Logger.error('Error in ProcessAUPostLabel.js :: {0}', 'No order Found related to case number' + returnCaseNumber);
                }
            } else {
                Logger.error('Error in ProcessAUPostLabel.js :: {0}', 'empty return case number');
            }
        }
    } catch (e) {
        Logger.error('Error in ProcessAUPostLabel.js :: {0}', e.message);
        return new Status(Status.ERROR);
    }
    return new Status(Status.OK);
};
