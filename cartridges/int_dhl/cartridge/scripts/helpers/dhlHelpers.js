'use strict';

/**
 * Replace spaces from postal code
 * @param {string} postalCode postal code
 * @returns {string} replaced postal code
 */
function replaceSpacePostalCode(postalCode) {
    return postalCode ? postalCode.replace(' ', '') : '';
}

/**
 * Generate UUID as for Return Label
 * @returns {string} uuid - generated uuid
 */
function generateUUID() {
    var d = new Date().getTime();
    var d2 = ((typeof performance !== 'undefined') && performance.now && (performance.now() * 1000)) || 0;
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        // Random number between 0 and 16
        var r = Math.random() * 16;
        if (d > 0) {
            // Use timestamp until depleted
            r = (d + r) % 16 | 0;
            d = Math.floor(d / 16);
        } else {
            // Use microseconds since page-load if supported
            r = (d2 + r) % 16 | 0;
            d2 = Math.floor(d2 / 16);
        }
        // eslint-disable-next-line no-mixed-operators
        return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
}

/**
 * Utilizes Order to JSON Object for REST API call
 * @param {dw.order.Order} order - Order to generate return label.
 * @returns {Object} - JSON Object to generate label
 */
function utilizeOrder(order) {
    const ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');
    const requestBody = {
        parcelTypeKey: 'SMALL',
        returnLabel: true,
        quantity: 1
    };
    const returnsUtil = new ReturnsUtils();
    const shipperAddressObj = JSON.parse(returnsUtil.getPreferenceValue('returnFromAddress', order.custom.customerLocale));
    const warehouseAddress = JSON.parse(returnsUtil.getPreferenceValue('returnAddress', order.custom.customerLocale));
    requestBody.shipper = {
        name: {
            companyName: shipperAddressObj.attentionName || shipperAddressObj.name
        },
        address: {
            city: shipperAddressObj.city,
            postalCode: shipperAddressObj.postalCode ? replaceSpacePostalCode(shipperAddressObj.postalCode) : '',
            countryCode: shipperAddressObj.countryCode,
            street: shipperAddressObj.address + (!empty(shipperAddressObj.address2) ? (' ' + shipperAddressObj.address2) : '')
        }
    };
    requestBody.receiver = {
        name: {
            companyName: warehouseAddress.attentionName || warehouseAddress.name
        },
        address: {
            city: warehouseAddress.city,
            postalCode: replaceSpacePostalCode(warehouseAddress.postalCode),
            countryCode: warehouseAddress.countryCode,
            street: warehouseAddress.address + (!empty(warehouseAddress.address2) ? (' ' + warehouseAddress.address2) : '')
        },
        phoneNumber: warehouseAddress.phone
    };
    requestBody.accountId = warehouseAddress.accountNumber;
    requestBody.labelId = generateUUID();
    requestBody.orderReference = order.currentOrderNo;
    requestBody.options = [
        {
            key: 'REFERENCE',
            input: order.currentOrderNo
        }
    ];

    return requestBody;
}

/**
 * Call DHL Parcel services and fetches shipping label and tracking number
 * @param {Object} order DW Order
 * @returns {Object} returns tracking number and shipping label from UPS
 */
function fetchDHLParcelShippingAndTrackingNumber(order) {
    const dhlParcelServiceHelpers = require('*/cartridge/scripts/service/dhlParcelServiceHelpers');
    const Logger = require('dw/system/Logger');
    try {
        const requestBody = utilizeOrder(order);
        const labelResponse = dhlParcelServiceHelpers.call(requestBody);
        if (!empty(labelResponse)) {
            return {
                shipLabel: labelResponse.pdf,
                trackingNumber: labelResponse.trackerCode,
                ConsignmentID: labelResponse.routingCode
            };
        }
        return labelResponse;
    } catch (e) {
        Logger.error('DHL Parcel Service Calls error: ' + e.message + e.stack);
    }
    return null;
}

/**
 * DHL Express Return Label
 * @returns {null} - null
 */
function fetchDHLExpressShippingAndTrackingNumber() {
    // TODO: Integrate DHL Express
    return null;
}

module.exports = {
    fetchDHLParcelShippingAndTrackingNumber: fetchDHLParcelShippingAndTrackingNumber,
    fetchDHLExpressShippingAndTrackingNumber: fetchDHLExpressShippingAndTrackingNumber
};
