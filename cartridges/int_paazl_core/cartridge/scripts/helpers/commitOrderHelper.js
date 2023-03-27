var Logger = require('dw/system/Logger');

/**
 * Return customer's full name
 * @param {dw.order.Order} order SFCC order
 * @returns{string} full name
 */
function getName(order) {
    var name = '';
    if (order.customerName && order.customerName.trim() !== '') {
        return order.customerName;
    } else if (order.defaultShipment.shippingAddress) {
        return order.defaultShipment.shippingAddress.fullName;
    } else if (order.billingAddress) {
        return order.billingAddress.fullName;
    }
    return name;
}

/**
 * Return customer's address
 * @param {dw.order.OrderAddress} orderAddress SFCC order Address
 * @returns{Object} full address object
 */
function getAddress(orderAddress) {
    var address = {};
    address.city = orderAddress.city;
    address.country = orderAddress.countryCode.value;
    address.postalCode = orderAddress.postalCode;
    address.province = orderAddress.stateCode !== 'undefined' && !empty(orderAddress.stateCode) ? orderAddress.stateCode : '';
    address.street = orderAddress.address1;
    // StreetLines currently not used
        // var streetLines = [];
        // var streetLine = orderAddress.address1;
        // streetLines.push(streetLine);
        // address.streetLines = streetLines;

    // 123 A -> ['123', 'A'] or 5-980 -> ['5', '980']
    var houseNumberAndExt = orderAddress.address2 || '';
    var regex = new RegExp('^([0-9]+)[\\s-]?([A-Z0-9]+)?');
    var parts = regex.exec(houseNumberAndExt);
    var houseNr = parts && parts.length > 0 ? parts[1] : houseNumberAndExt;
    if (empty(houseNr) || isNaN(houseNr)) {
        houseNr = '0';
    }
    address.houseNumber = houseNr;
    address.houseNumberExtension = parts && parts.length > 1 ? parts[2] : '';

    return address;
}

/**
 * Return all products present in order
 * @param {dw.order.Order} order SFCC order
 * @returns{Object} all productLineItems
 */
function getProducts(order) {
    var productLineItems = order.productLineItems;
    var currencyCode = order.currencyCode;
    var productObj = productLineItems.toArray().map(function (pli) {
        var pliObj = {};
        pliObj.unitPrice = {};
        pliObj.unitPrice.value = pli.basePrice.value;
        pliObj.unitPrice.currency = currencyCode;
        pliObj.quantity = pli.quantityValue;
        pliObj.description = pli.product ? pli.product.name : pli.productName;

        return pliObj;
    });
    return productObj;
}

/**
 * Return sender's address
 * @returns{Object} senders address
 */
function getSenderAddress() {
    var Site = require('dw/system/Site');
    var defaultSenderAddress = Site.getCurrent().getCustomPreferenceValue('paazlDefaultSenderAddress');
    if (defaultSenderAddress) {
        try {
            return JSON.parse(defaultSenderAddress);
        } catch (error) {
            Logger.error('Error parsing paazlDefaultSenderAddress sitepreference');
        }
    }
    return null;
}

/**
 * Create paazl commit order request payload object
 * @param {dw.order.Order} order SFCC order
 * @returns{Object} request payload
 */
function getCommitRequestPayload(order) {
    var commitRequest = {};
    commitRequest.additionalInstruction = '';

    var defaultShipment = order.defaultShipment;
    var shippingAddress = defaultShipment.shippingAddress;
    var billingAddress = order.billingAddress;
    var currencyCode = order.currencyCode;
    var paazlDeliveryInfo = JSON.parse(defaultShipment.custom.paazlDeliveryInfo);
    var isPickUpLocation = paazlDeliveryInfo && paazlDeliveryInfo.deliveryType === 'PICKUP_LOCATION';

    var customerEmail = order.customerEmail;
    commitRequest.consignee = {};
    commitRequest.consignee.companyName = shippingAddress.companyName || '';
    commitRequest.consignee.email = customerEmail;
    commitRequest.consignee.name = getName(order) || '';
    commitRequest.consignee.phone = shippingAddress.phone || billingAddress.phone || '';
    commitRequest.consignee.locale = order.customerLocaleID;
    commitRequest.consignee.address = isPickUpLocation ? getAddress(billingAddress) : getAddress(shippingAddress);

    commitRequest.description = '';

    // The total monetary value of an order for customs purposes
    commitRequest.customsValue = {};
    commitRequest.customsValue.value = order.totalGrossPrice.value;
    commitRequest.customsValue.currency = currencyCode;

    commitRequest.products = getProducts(order);
    commitRequest.reference = order.orderNo;

    var senderAddress = getSenderAddress();
    commitRequest.sender = senderAddress || '';


    if (paazlDeliveryInfo.preferredDeliveryDate) {
        commitRequest.requestedDeliveryDate = paazlDeliveryInfo.preferredDeliveryDate;
    }
    commitRequest.shipping = {};
    commitRequest.shipping.option = paazlDeliveryInfo.identifier || '';

    if (isPickUpLocation) {
        commitRequest.shipping.pickupLocation = {};
        commitRequest.shipping.pickupLocation.accountNumber = (paazlDeliveryInfo.pickupLocation && paazlDeliveryInfo.pickupLocation.accountNumber) || '';
        commitRequest.shipping.pickupLocation.code = (paazlDeliveryInfo.pickupLocation && paazlDeliveryInfo.pickupLocation.code) || '';
    }

    // dummy value replace with actual logic
    commitRequest.shipping.packageCount = 1;
    commitRequest.shipping.multiPackageShipment = false;

    // dummy value replace with actual logic by using product custom attribute
    commitRequest.weight = 10;

    return commitRequest;
}

module.exports.getCommitRequestPayload = getCommitRequestPayload;
