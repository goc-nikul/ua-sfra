'use strict';

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
        returnDetails.returnArray = returnDetails.returnArray.concat(tempReturnDetails);
    }
    return returnDetails;
}

/**
 * Order Return Reason that represents the current order
 * @return {Object} Return orders Reason model
 */
function orderReturnReasonModel() {
    var Resource = require('dw/web/Resource');
    return {
        SIZE_TOO_BIG: Resource.msg('option.return.reason.toobig', 'account', null),
        SIZE_TOO_SMALL: Resource.msg('option.return.reason.toosmall', 'account', null),
        DURABILITY_OVER_TIME: Resource.msg('option.return.reason.durability', 'account', null),
        QUALITY: Resource.msg('option.return.reason.quality', 'account', null),
        FUNCTIONALITY: Resource.msg('option.return.reason.functionality', 'account', null),
        NOT_AS_PICTURED: Resource.msg('option.return.reason.notaspictured', 'account', null),
        DO_NOT_LIKE_OR_CHANGED_MIND: Resource.msg('option.return.reason.donotlike', 'account', null),
        SHIPPING_ISSUE_DAMAGED: Resource.msg('option.return.reason.shippingissue', 'account', null),
        SHIPPING_ISSUE_LATE: Resource.msg('option.return.reason.shippingissuelate', 'account', null),
        WRONG_ITEM_SHIPPED: Resource.msg('option.return.reason.wrongitemshipped', 'account', null),
        OTHER: Resource.msg('option.return.reason.other', 'account', null)
    };
}

/**
 * Function that prepares JSON object for AuthForm
 * @param {dw.order.ReturnCase} returnCase - return case object
 * @return {Object} Return params
 */
function getReturnItemsData(returnCase) {
    var returnItemsData = [];
    for (var i = 0; i < returnCase.items.length; i++) {
        var returnItem = returnCase.items[i];
        var product = {
            copy: {},
            color: {}
        };

        product.copy.name = returnItem.lineItem.productName;
        product.sku = returnItem.lineItem.custom.sku;
        product.color.colorway = returnItem.lineItem.product ? returnItem.lineItem.product.custom.colorway : '';
        var productItem = {
            product: product,
            quantity: returnItem.authorizedQuantity.value.toString()
        };
        var orderItem = {
            productItem: productItem
        };
        var returnItemData = {
            orderItem: orderItem,
            returnReason: returnItem.reasonCode
        };
        returnItemsData.push(returnItemData);
    }
    return returnItemsData;
}

/**
 * Function that prepares JSON object for AuthForm
 * @param {dw.order.ReturnCase} returnCase - return case object
 * @return {Object} Return params
 */
function createAuthFormObj(returnCase) {
    var Site = require('dw/system/Site');
    var ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
    var order = returnCase.getOrder();
    var returnShipment = returnCase.items[0].lineItem.shipment;
    var paazlDeliveryInfo = JSON.parse(returnShipment.custom.paazlDeliveryInfo);
    var returnAddress = paazlDeliveryInfo && paazlDeliveryInfo.deliveryType && paazlDeliveryInfo.deliveryType === 'HOME' ? returnShipment.getShippingAddress() : order.getBillingAddress();
    var shippingJSON = JSON.parse(order.custom.shippingJson);
    var deliveryNumber = shippingJSON.length > 0 ? shippingJSON[0].deliveryNumber : '';
    var customerInfo = {
        email: order.getCustomerEmail(),
        phone: order.getBillingAddress().getPhone()
    };
    var returnService = '';
    if ('returnService' in Site.getCurrent().getPreferences().getCustom() && !empty(Site.getCurrent().getCustomPreferenceValue('returnService').value)) {
        returnService = Site.getCurrent().getCustomPreferenceValue('returnService').value;
    } else {
        var returnsUtil = new ReturnsUtils();
        var returnServiceValue = returnsUtil.getPreferenceValue('returnService', order.custom.customerLocale);
        if (returnServiceValue && !empty(returnServiceValue)) {
            returnService = returnServiceValue;
        }
    }
    var params = {
        deliveryNumber: deliveryNumber,
        fullName: returnAddress && returnAddress.fullName ? returnAddress.fullName : (returnAddress && returnAddress.firstName ? returnAddress.firstName : '') + (returnAddress && returnAddress.lastName ? ' ' + returnAddress.lastName : ''),
        firstName: returnAddress && returnAddress.firstName ? returnAddress.firstName : '',
        lastName: returnAddress && returnAddress.lastName ? returnAddress.lastName : '',
        address1: returnAddress && returnAddress.address1 ? returnAddress.address1 : '',
        city: returnAddress && returnAddress.city ? returnAddress.city : '',
        province: returnAddress && typeof returnAddress.stateCode !== undefined && returnAddress.stateCode !== 'undefined' && returnAddress.stateCode ? returnAddress.stateCode : '',
        postalCode: returnAddress && returnAddress.postalCode ? returnAddress.postalCode : '',
        phone: customerInfo.phone,
        email: customerInfo && customerInfo.email ? customerInfo.email : 'N/A',
        transactionNumber: order.orderNo,
        trackingNumber: returnCase.custom && 'trackingNumber' in returnCase.custom ? returnCase.custom.trackingNumber : '',
        carrierName: returnService,
        country: returnAddress.countryCode,
        suburb: returnAddress && 'suburb' in returnAddress.custom && returnAddress.custom.suburb ? returnAddress.custom.suburb : ''
    };

    params.returnItemsData = getReturnItemsData(returnCase);
    params.returnReasonModel = orderReturnReasonModel();
    return params;
}

/**
 * Send Created Return Return Confirmation Email
 * @param {dw.order.Order} order - Order object
 * @param {dw.order.ReturnCase} returnCase - Return Case
 */
function sendReturnCreatedConfirmationEmail(order, returnCase) {
    var HookMgr = require('dw/system/HookMgr');
    var URLUtils = require('dw/web/URLUtils');

    const preferencesUtil = require('*/cartridge/scripts/utils/PreferencesUtil');
    var emailHelper = require('*/cartridge/scripts/helpers/SFMCEmailHelper');
    let helpers = require('int_marketing_cloud/cartridge/scripts/util/helpers');

    let hookID = 'app.communication.oms.returnOrderCreated';
    let customObjectdefinition = helpers.getCustomObject('MarketingCloudTriggers', hookID, false);
    let countryEnabled = !empty(customObjectdefinition) && customObjectdefinition.enabled && !empty(customObjectdefinition.countriesEnabled)
        ? customObjectdefinition.countriesEnabled.indexOf(order.custom.customerCountry) !== -1 : false;

    if (preferencesUtil.isCountryEnabled('SFMCEnabled') && countryEnabled && HookMgr.hasHook(hookID)) {
        var returnInfoLink = null;
        if (request.locale !== order.customerLocaleID) {// eslint-disable-line
            returnInfoLink = require('int_customfeeds/cartridge/scripts/util/URLUtilsHelper.ds').prepareURLForLocale(URLUtils.https('Order-PrintEmailLabel', 'orderNumber', order.orderNo, 'returnNumber', returnCase.returnCaseNumber, 'orderEmail', order.customerEmail).toString(), order.customerLocaleID);
        }
        let params = {
            Order: order,
            returnInfoLink: returnInfoLink || URLUtils.abs('Order-PrintEmailLabel', 'orderNumber', order.orderNo, 'returnNumber', returnCase.returnCaseNumber, 'orderEmail', order.customerEmail).toString(),
            returnCase: returnCase,
            trackingNumber: returnCase.custom && 'trackingNumber' in returnCase.custom ? returnCase.custom.trackingNumber : ''
        };
        emailHelper.sendReturnConfirmationEmail(order, params);
    }
}
/**
 * Generate the RMA number
 * @param {number} length - max limit to generate EMA
 * @return {Object} Return RMA number
 */
function generateRmaNumber(length) {
    var SecureRandom = require('dw/crypto/SecureRandom');
    var random = new SecureRandom();
    var allowedChar = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    var rmaNumber = '';
    for (var i = length; i > 0; i--) {
        rmaNumber += allowedChar[Math.floor(random.nextNumber() * allowedChar.length)];
    }
    return rmaNumber;
}

module.exports = {
    setReturnDetails: setReturnDetails,
    getReturnDetails: getReturnDetails,
    createAuthFormObj: createAuthFormObj,
    sendReturnCreatedConfirmationEmail: sendReturnCreatedConfirmationEmail,
    orderReturnReasonModel: orderReturnReasonModel,
    generateRmaNumber: generateRmaNumber
};
