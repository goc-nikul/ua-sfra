'use strict';

const UACAPIDataService = require('~/cartridge/scripts/UACAPI/services/UACAPIDataService');
const UACAPIAuthTokenHelper = require('~/cartridge/scripts/UACAPI/helpers/util/UACAPIAuthTokenHelper');
var UACAPIHelper = require('../util/UACAPIHelper');
var Site = require('dw/system/Site');
var Locale = require('dw/util/Locale');

/**
 * Main function of the script to start order export process.
 * @param {string} requestType - mention about the type of request to be process
 * @param {Object} params - respective order rma info
 * @return {Object} Return orders list
 */
function createRmaMutation(requestType, params) {
    var tokenHelper = new UACAPIAuthTokenHelper();
    const accessToken = tokenHelper && tokenHelper.getValidToken() ? tokenHelper.getValidToken().accessToken : null;

    if (accessToken) {
        var graphQLPayload = UACAPIHelper.prepareGraphQLRequest(requestType, params);
        var graphQLService = UACAPIDataService.getGraphQL(requestType);

        var count = 0;
        var response = null;

        // try calling service -three times maximum- to get a response
        while (count < 3) {
            var graphQLResponse = graphQLService.call({
                payload: graphQLPayload,
                token: 'Bearer ' + accessToken
            });
            if (graphQLResponse && graphQLResponse.ok && graphQLResponse.object) {
                response = graphQLResponse.object;
                break;
            }
            count += 1;
        }

        if (response) {
            return response;
        }
        return { error: true };
    }
    return { error: true };
}

/**
 * Function that prepares JSON object for RMA service
 * @param {Object} order - Current Order
 * @param {Object} returnItems - respective return items array
 * @return {Object} Return params
 */
function getRMARequestBody(order, returnItems) {
    var params = {};
    params.input = {};
    params.input.orderNumber = order.orderNo;
    params.input.rmaInfo = {};
    params.input.rmaInfo.email = order.customerInfo && order.customerInfo.email ? order.customerInfo.email : '';
    params.input.rmaInfo.currency = order.currency;
    params.input.rmaInfo.purchaseLocation = 'UA_WEBSITE';
    params.input.returnItems = returnItems.returnArray;
    params.input.labelEmailRecipient = order.customerInfo && order.customerInfo.email ? order.customerInfo.email : '';

    return JSON.stringify(params);
}

/**
 * Function that prepares JSON object for RMA service
 * @param {Object} order - Current Order
 * @param {Object} returnItems - respective return items array
 * @return {Object} Return params
 */
function getGuestRMARequestBody(order, returnItems) {
    var params = {};
    params.input = {};
    params.input.orderNumber = order.orderNo;
    params.input.rmaInfo = {};
    params.input.rmaInfo.email = order.customerInfo && order.customerInfo.email ? order.customerInfo.email : '';
    params.input.rmaInfo.currency = order.currency;
    params.input.rmaInfo.purchaseLocation = 'UA_WEBSITE';
    params.input.returnItems = returnItems.returnArray;
    params.input.labelEmailRecipient = order.customerInfo && order.customerInfo.email ? order.customerInfo.email : '';

    return JSON.stringify(params);
}

/**
 * Function that prepares JSON object for rmas history call
 * @param {Object} customerNo - Current customer number
 * @param {string} pageCursor - represents the page cursor
 * @return {Object} Return params
 */
function getRMAHistoryRequestBody(customerNo, pageCursor) {
    var siteId = Site.getCurrent().getID();
    var params = {};
    params.first = 10;
    params.after = pageCursor || '';
    params.input = {};
    params.input.siteId = siteId || '';
    params.input.customerNo = customerNo || '';

    return params;
}

/**
 * Function that prepares JSON object to check if order is cancellable or not
 * @param {string} orderID - Order Id of the Order
 * @param {string} email - email address with which the order was placed
 * @return {Object} Return params
 */
function getIsOrderCancellableRequestBody(orderID, email) {
    var siteId = Site.getCurrent().getID();
    var params = {};
    params.input = {};
    params.input.siteId = siteId || '';
    params.input.orderNumber = orderID || '';
    params.input.email = email || '';

    return params;
}

/**
 * Function that prepares JSON object to cancel order
 * @param {string} orderID - Order Id of the Order
 * @param {string} cancelReason - Reason for cancelling order
 * @param {string} cancelComment - Additional comment by the customer
 * @return {Object} Return params
 */
function getCancelOrderRequestBody(orderID, cancelReason, cancelComment) {
    var params = {};
    params.input = {};
    params.input.orderNumber = orderID || '';
    params.input.cancelReason = cancelReason || '';
    params.input.cancelComment = cancelComment || '';

    return params;
}

/**
 * Function that prepares JSON object for rmas history call
 * @param {Object} customerNo - Current customer number
 * @param {Object} rmaNumber - represents the rmaNumber
 * @return {Object} Return params
 */
function getRMADetailsRequestBody(customerNo, rmaNumber) {
    var siteId = Site.getCurrent().getID();
    var params = {};
    params.input = {};
    params.input.siteId = siteId || '';
    params.input.rmaNumber = rmaNumber || '';
    params.input.customerNo = customerNo || '';

    return params;
}
/**
 * Function that prepares JSON object for RMA service
 * @param {Object} guestData - respective return items array
 * @return {Object} Return params
 */
function getGuestOrderRMARequestBody(guestData) {
    var currencyCode = Site.getCurrent().getDefaultCurrency();
    var defaultCode = Site.getCurrent().getDefaultLocale();
    var countryCode = Locale.getLocale(defaultCode) ? Locale.getLocale(defaultCode).country : 'US';
    var purchaseLocation = 'UA_STORE';
    var params = {};
    params.input = {};
    var rmaInfo = {};
    rmaInfo.email = guestData.returnemail;
    rmaInfo.currency = currencyCode;
    rmaInfo.purchaseLocation = purchaseLocation;

    var address = {};
    address.salutation = null;
    address.firstName = guestData.returnfirstName;
    address.lastName = guestData.returnLastName;
    address.suffix = null;
    address.title = null;
    address.companyName = null;
    address.postBox = null;
    address.address1 = guestData.streetAddress;
    address.address2 = guestData.apartment ? guestData.apartment : null;
    address.suite = null;
    address.city = guestData.city;
    address.stateCode = guestData.returnstate;
    address.postalCode = guestData.returnzip;
    address.countryCode = countryCode;
    address.phone = guestData.returnphone;
    rmaInfo.address = address;

    params.input.rmaInfo = rmaInfo;
    params.input.reason = guestData.returnreasons;
    params.input.quantity = Number(guestData.returnquantity);
    params.input.transactionNumber = guestData.transactionno;
    return JSON.stringify(params);
}
/**
 * Function that prepares JSON object for canadapost service
 * @param {Object} guestData - respective return items array
 * @return {Object} Return params
 */
function canadaPostRequestBody(guestData) {
    var siteId = Site.getCurrent().getID();
    var params = {
        fullName: guestData.returnfirstName + ' ' + guestData.returnLastName,
        address1: guestData.streetAddress,
        address2: guestData.apartment ? guestData.apartment : '',
        city: guestData.city,
        postalCode: guestData.returnzip,
        stateCode: guestData.returnstate,
        countryCode: siteId,
        phone: guestData.returnphone
    };
    return params;
}

/**
 * Function that prepares JSON object for AuthForm
 * @param {Object} rmaObject - respective return items array
 * @param {Object} guestData - respective return items array
 * @return {Object} Return params
 */
function createAuthFormObj(rmaObject, guestData) {
    var returnObject = rmaObject && rmaObject.rma ? rmaObject.rma : null;
    returnObject = empty(returnObject) && rmaObject.rmaDetails ? rmaObject.rmaDetails : returnObject;
    var returnAddress = returnObject && returnObject.returnAddress ? returnObject.returnAddress : null;
    var returnShipment = returnObject && returnObject.returnShipment[0] ? returnObject.returnShipment[0] : null;
    var customerInfo = returnObject && returnObject.customerInfo ? returnObject.customerInfo : null;
    var isCommercialPickup = returnObject && returnObject.returnOrder && !empty(returnObject.returnOrder.isCommercialPickup) ? returnObject.returnOrder.isCommercialPickup : false;
    if (isCommercialPickup) {
        returnAddress = returnObject.returnOrder.billingAddress;
    }
    var params = {
        rmaNumber: returnObject && returnObject.rmaNumber ? returnObject.rmaNumber : '',
        fullName: returnAddress && returnAddress.fullName ? returnAddress.fullName : (returnAddress && returnAddress.firstName ? returnAddress.firstName : '') + (returnAddress && returnAddress.lastName ? ' ' + returnAddress.lastName : ''),
        firstName: returnAddress && returnAddress.firstName ? returnAddress.firstName : '',
        lastName: returnAddress && returnAddress.lastName ? returnAddress.lastName : '',
        address1: returnAddress && returnAddress.address1 ? returnAddress.address1 : '',
        city: returnAddress && returnAddress.city ? returnAddress.city : '',
        province: returnAddress && returnAddress.stateCode ? returnAddress.stateCode : '',
        postalCode: returnAddress && returnAddress.postalCode ? returnAddress.postalCode : '',
        phone: returnAddress && returnAddress.phone ? returnAddress.phone : '',
        email: customerInfo && customerInfo.email ? customerInfo.email : 'N/A',
        purchaseLocation: returnObject && returnObject.purchaseLocation ? returnObject.purchaseLocation : '',
        transactionNumber: returnObject && returnObject.transactionNumber ? returnObject.transactionNumber : returnObject && returnObject.returnOrder && returnObject.returnOrder.orderNo ? returnObject.returnOrder.orderNo : '-',
        trackingNumber: returnShipment && returnShipment.trackingNumber ? returnShipment.trackingNumber : '',
        carrierName: returnShipment && returnShipment.carrier ? returnShipment.carrier.name : '',
        returnQuantity: guestData && guestData.returnquantity ? guestData.returnquantity : '',
        country: Site.getCurrent().getID()
    };
    params.returnItemsData = returnObject.returnItems;
    params.returnReasonModel = require('*/cartridge/scripts/UACAPI/helpers/util/utilHelper').orderReturnReasonModel();
    return params;
}

/**
 * Function to send return label email
 * @param {Object} returnObj - return label details
 */
function sendReturnLabel(returnObj) {
    var Resource = require('dw/web/Resource');
    var emailHelpers = require('*/cartridge/scripts/helpers/emailHelpers');
    var returnLabelData = {
        returnObj: returnObj
    };

    var emailData = {
        to: returnLabelData.CustomerEmail,
        subject: Resource.msg('subject.order.confirmation.email', 'order', null),
        from: Site.current.getCustomPreferenceValue('customerServiceEmail') || 'noreply@underarmour.com',
        type: emailHelpers.emailTypes.returnLabel
    };

    var emailObj = {
        templateData: returnLabelData,
        emailData: emailData
    };

    require('*/cartridge/modules/providers').get('Email', emailObj).send();
}

/**
 * Function that prepares collection of exchange and original order
 * @param {Object} order - Order object from exchange model
 * @return {Object} Return exchangeOriginalOrder
 */
function getExchangeOriginalOrderCollection(order) {
    var exchangeOriginalOrder = [];
    order.orderItems.forEach(function (exchangeOrderItem) {
        order.originalOrderItems.forEach(function (originalOrderItem) {
            if (exchangeOrderItem.ID === originalOrderItem.ID) {
                exchangeOriginalOrder.push(exchangeOrderItem);
                exchangeOriginalOrder.push(originalOrderItem);
            }
        });
    });
    return exchangeOriginalOrder;
}

/**
 * Function that sets return/exchange order details to the session
 * @param {Object} returnDetails - JSON string
 */
function setReturnDetails(returnDetails) {
    // api.session.maxStringLength
    // Default Limit: 2,000 (warning at 1,200)
    // one return item is around 330-350 symbols with full comment (200 symbols)
    // {"returnArray":[{"returnSku":"1309545-299-30/30","returnReason":"SIZE_TOO_SMALL","replacementSku":"","returnQuantity":1,"returnDescription":"asdasdasd"}]}

    var details = JSON.parse(returnDetails);
    var returnArray = details.returnArray;
    var tempArray = [];
    var counter = 0;
    for (var i = 1; i <= returnArray.length; i++) {
        tempArray.push(returnArray[i - 1]);
        if (i % 3 === 0 && i > 1) {
            session.privacy['returnDetails' + (i / 3)] = JSON.stringify(tempArray);
            session.privacy.returnDetailsCounter = (i / 3);
            tempArray = [];
            counter = (i / 3);
        }
    }
    if (tempArray.length > 0) {
        session.privacy['returnDetails' + (counter + 1)] = JSON.stringify(tempArray);
        session.privacy.returnDetailsCounter = (counter + 1);
    }
}

/**
 * Function that gets return/exchange order details from the session
 * @return {Object} returnDetails - JSON object
 */
function getReturnDetails() {
    var counter = session.privacy.returnDetailsCounter;
    var returnDetails = {
        returnArray: []
    };
    var tempReturnDetails = null;
    for (var i = 1; i <= counter; i++) {
        tempReturnDetails = JSON.parse(session.privacy['returnDetails' + i]);
        let returnItemsDetails = [];
        for (var j = 0; j < tempReturnDetails.length; j++) {
            returnItemsDetails.push({
                reason: tempReturnDetails[j].returnReason,
                sku: tempReturnDetails[j].returnSku,
                quantity: tempReturnDetails[j].returnQuantity,
                replacementSku: tempReturnDetails[j].replacementSku,
                description: tempReturnDetails[j].returnDescription
            });
        }
        returnDetails.returnArray = returnDetails.returnArray.concat(returnItemsDetails);
    }
    return returnDetails;
}

module.exports = {
    createRmaMutation: createRmaMutation,
    getRMARequestBody: getRMARequestBody,
    getGuestRMARequestBody: getGuestRMARequestBody,
    getRMAHistoryRequestBody: getRMAHistoryRequestBody,
    getIsOrderCancellableRequestBody: getIsOrderCancellableRequestBody,
    getCancelOrderRequestBody: getCancelOrderRequestBody,
    getRMADetailsRequestBody: getRMADetailsRequestBody,
    getGuestOrderRMARequestBody: getGuestOrderRMARequestBody,
    canadaPostRequestBody: canadaPostRequestBody,
    createAuthFormObj: createAuthFormObj,
    sendReturnLabel: sendReturnLabel,
    getExchangeOriginalOrderCollection: getExchangeOriginalOrderCollection,
    setReturnDetails: setReturnDetails,
    getReturnDetails: getReturnDetails
};
