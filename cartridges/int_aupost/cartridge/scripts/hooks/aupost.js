'use strict';

var Site = require('dw/system/Site');
/**
 * Fetches Return label and tracking number
 * @param {Object} order dw order
 * @returns {Object} returns shippingLabel and tracking number
 */
function getShippingLabelAndTrackingNumber(order) {
    var returnHelpers = require('*/cartridge/scripts/order/returnHelpers');
    var returnObj = returnHelpers.getReturnDetails();
    var returnItemsInfo = returnObj.returnArray;
    var aupostConfigrations = JSON.parse(Site.getCurrent().getCustomPreferenceValue('aupostConfigurations'));
    var authToken = aupostConfigrations.authToken;
    var auPostAccountID = Site.getCurrent().getCustomPreferenceValue('auPostAccountID');
    var Service = require('*/cartridge/scripts/svc/auPostService');
    var auPostRequest = require('*/cartridge/scripts/auPostRequest.js');
    var orderAndShipmentRequest = auPostRequest.getOrderIncludingShipmentRequest(order, returnItemsInfo);
    var svc = Service.createOrderAndShipmentRequest();
    var params = {};
    params.orderAndShipmentRequest = orderAndShipmentRequest;
    params.authToken = authToken;
    params.auPostAccountID = auPostAccountID;
    var result = svc.call(params);
    var PDFLink;
    var trackingID;
    var shipmentID;
    var shipLabel = '';
    var errorRes = false;
    var successfullConversion = true;
    var isReturnCase = false;
    if (result.ok) {
        try {
            var res = JSON.parse(result.object.text);
            shipmentID = res.order.shipments[0].shipment_id;
            trackingID = res.order.shipments[0].items[0].tracking_details.article_id;
            var createLabelReq = auPostRequest.createLabelRequest(shipmentID);
            var createLabelSvc = Service.createLabelRequest();
            params = {};
            params.createLabelReq = createLabelReq;
            params.authToken = authToken;
            params.auPostAccountID = auPostAccountID;
            var createLabelRequestResult = createLabelSvc.call(params);
            if (createLabelRequestResult.ok === true) {
                var jsonRes = JSON.parse(createLabelRequestResult.object.text);
                if (jsonRes.labels && jsonRes.labels[0].url && !empty(jsonRes.labels[0].url)) {
                    PDFLink = jsonRes.labels[0].url;
                }
                if (PDFLink) {
                    var service = Service.getPdf('aupost.pdf', PDFLink);
                    var getPdfRes = service.call();
                    if (getPdfRes.ok) {
                        var encoding = require('dw/crypto/Encoding');
                        shipLabel = encoding.toBase64(getPdfRes.object.bytes);
                        if (!empty(trackingID) && !empty(shipLabel)) {
                            isReturnCase = true;
                        }
                        return {
                            ConsignmentID: shipmentID,
                            trackingNumber: trackingID,
                            shipLabel: shipLabel,
                            isReturnCase: isReturnCase,
                            exportStatus: true,
                            isError: false
                        };
                    }
                    successfullConversion = false;
                } else {
                    errorRes = true;
                }
            } else {
                errorRes = true;
            }
        } catch (error) {
            errorRes = true;
        }
    } else {
        errorRes = true;
    }
    if (errorRes) {
        return {
            errorRes: errorRes,
            isReturnCase: false
        };
    }
    if (!empty(trackingID) && !empty(PDFLink)) {
        isReturnCase = true;
    }
    return {
        errorRes: errorRes,
        successfullConversion: successfullConversion,
        PDFLink: PDFLink,
        ConsignmentID: shipmentID,
        trackingNumber: trackingID,
        shipLabel: shipLabel,
        isReturnCase: isReturnCase,
        exportStatus: false,
        isError: true
    };
}
module.exports = {
    shippingLabelAndTrackingNumber: getShippingLabelAndTrackingNumber
};
