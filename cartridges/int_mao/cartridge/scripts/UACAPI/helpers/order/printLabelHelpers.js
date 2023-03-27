'use strict';

var Site = require('dw/system/Site');
var Logger = require('dw/system/Logger');
var Resource = require('dw/web/Resource');
var renderTemplateHelper = require('*/cartridge/scripts/renderTemplateHelper');
var returnHelpers = require('*/cartridge/scripts/UACAPI/helpers/order/returnHelpers');

/**
 * Function to get return label PDF URL from Amazon s3 location
 *
 * @param {string} returnLabelId - Return Label ID
 * @returns {string} Return Label URL
 */
function getS3LocationURL(returnLabelId) {
    var returnLabelURL = '';
    try {
        var System = require('dw/system/System');
        var instance = System.getInstanceType() === System.PRODUCTION_SYSTEM ? 'production' : 'staging';
        var bucketName = instance + '/' + Site.current.ID.toLowerCase();
        var fileName = returnLabelId ? (encodeURIComponent(returnLabelId) + '.pdf') : '';

        var S3TransferClient = require('int_s3/cartridge/scripts/lib/S3TransferClient.js');
        var orgPreferences = require('dw/system/System').getPreferences();
        var orgCustomPreferences = orgPreferences.getCustom();

        var transferClient = new S3TransferClient(
            orgCustomPreferences.s3bucketName,
            orgCustomPreferences.s3accessKey,
            orgCustomPreferences.s3secretAccessKey,
            orgCustomPreferences.s3region,
            '', // contentType is optional
            1000,
            null
        );
        returnLabelURL = transferClient.getPreSignedUrl(
            fileName,
            orgCustomPreferences.s3preSignedUrlExpiry.toString(),
            'ua-return-labels.s3.amazonaws.com',
            bucketName
        );
    } catch (e) {
        Logger.error('Error in printLabelHelpers.js -> getS3LocationURL()' + e.message);
    }

    return returnLabelURL;
}

/**
 * Function to get PDF Service Definition.
 *
 * @returns {dw.svc.Service} PDF Service Definition
 */
function getPDFService() {
    var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
    var service = LocalServiceRegistry.createService('UACAPI.http.s3.getPDF', {
        createRequest: function (svc, params) {
            svc.setURL(params.url);
            svc.setRequestMethod('GET');
            return svc;
        },
        parseResponse: function (svc, response) {
            return response;
        }
    });

    return service;
}


/**
 * Returns Instruction Text Based On Return Label Service And Site/Locale
 *
 * @param {Object} order - order data received from UACAPI
 * @returns {Object} returnInstructionText - Returns Instruction Text
 */
function getReturnInstructionText(order) {
    var returnInstructionText = '';
    try {
        var returnService = Site.getCurrent().getCustomPreferenceValue('returnService') || ''; // FedEx OR CanadaPost
        if (!empty(returnService) && !empty(returnService.value)) {
            returnService = returnService.value;
        }
        var serviceType = '';
        var resourceKey = 'order.return.instruction';
        if (!empty(returnService) && returnService.equalsIgnoreCase('FedEx')) {
            var smartPostEligibleStateCodes = Site.getCurrent().getCustomPreferenceValue('smartPostEligibleStateCodes');
            var stateCode = (order && !empty(order.shippingAddress) && !empty(order.shippingAddress.stateCode)) ? order.shippingAddress.stateCode : null;
            if (!empty(smartPostEligibleStateCodes) && !empty(stateCode) && smartPostEligibleStateCodes.indexOf(stateCode) > -1) {
                serviceType = 'SmartPost';
            }
        }
        if (!empty(returnService)) {
            resourceKey += '.' + returnService; // order.return.instruction.FedEx OR order.return.instruction.CanadaPost
        }
        if (!empty(serviceType)) {
            resourceKey += '.' + serviceType; // order.return.instruction.FedEx.SmartPost
        }
        returnInstructionText = Resource.msg(resourceKey, 'account', null);
    } catch (e) {
        Logger.error('Error in printLabelHelpers.js -> getReturnInstructionText()', e.message);
    }
    return returnInstructionText;
}

/**
 * Function to call s3 service and get Return Label PDF Data
 *
 * @param {Object} order - Order data received from UACAPI
 * @param {string} returnLabelID - Return Label ID
 * @param {boolean} isEmailLabel - is Email Label
 * @returns {Object} PDF Object
 */
function getPDF(order, returnLabelID, isEmailLabel) {
    var result = {
        errorInResponse: true,
        errorMessage: Resource.msg('label.print.return.errormessage', 'account', null),
        pdfObject: null
    };

    if (returnLabelID && !empty(returnLabelID)) {
        var pdfService = getPDFService();
        var s3LocationURL = getS3LocationURL(returnLabelID);

        var pdfServiceResponse = pdfService.call({
            url: s3LocationURL
        });

        if (pdfServiceResponse && pdfServiceResponse.ok && pdfServiceResponse.object) {
            var encoding = require('dw/crypto/Encoding');
            var imageObj = pdfServiceResponse.object.bytes ? ('data:application/pdf;base64,' + encoding.toBase64(pdfServiceResponse.object.bytes)) : null;
            if (isEmailLabel) {
                result.imageObj = imageObj;
            } else {
                var returnInstructionText = getReturnInstructionText(order);
                result.renderedTemplate = renderTemplateHelper.getRenderedHtml({
                    returnInstructionText: returnInstructionText,
                    imageObj: imageObj,
                    isEmailLabel: isEmailLabel,
                    UACAPI: true
                }, '/refund/printlabel');
            }
            result.errorInResponse = false;
            result.errorMessage = '';
        }
    }
    return result;
}

/**
 * Function to submit the return request
 * @param {string} requestType - mention about the type of request to be process
 * @param {Object} order - retrieve respective order info
 * @param {Object} returnObj - return items info
 * @param {Object} guestData - form data for store returns
 * @returns {Object} Return order response info
 */
function submitReturn(requestType, order, returnObj, guestData) {
    var result = {
        errorInResponse: true,
        errorMessage: Resource.msg('label.print.return.error', 'account', null),
        renderedTemplate: ''
    };

    var isRegisteredUser = false;
    var requestParams = null;
    var response = null;
    try {
        if (requestType === 'createGuestItemizedRma') {
            requestParams = returnHelpers.getGuestRMARequestBody(
                order,
                returnObj
            );
        } else if (requestType === 'createItemizedRma') {
            requestParams = returnHelpers.getRMARequestBody(order, returnObj);
            isRegisteredUser = true;
        } else if (requestType === 'createGuestStoreRma') {
            requestParams = returnHelpers.getGuestOrderRMARequestBody(
                guestData
            );
        }

        if (requestParams) {
            response = returnHelpers.createRmaMutation(
                requestType,
                requestParams
            );
        }
    } catch (e) {
        Logger.error('Order.js: Error with rma creation:{0}', e.message);
    }

    if (response && !response.error && response.rma && response.rma.returnLabelId) {
        result.returnLabelID = response.rma.returnLabelId;
        result.errorInResponse = false;
        result.errorMessage = '';
    } else if (response && response.error) {
        Logger.error('Order.js:' + response.errorMessage);
        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({
            orderNo: order.orderNo,
            isRegisteredUser: isRegisteredUser
        }, '/refund/errorRefundPopup');
    } else {
        Logger.error('Order.js:' + response);
        result.renderedTemplate = renderTemplateHelper.getRenderedHtml({
            orderNo: order.orderNo,
            isRegisteredUser: isRegisteredUser
        }, '/refund/errorRefundPopup');
    }

    return result;
}

module.exports = {
    getPDF: getPDF,
    getReturnInstructionText: getReturnInstructionText,
    submitReturn: submitReturn
};
