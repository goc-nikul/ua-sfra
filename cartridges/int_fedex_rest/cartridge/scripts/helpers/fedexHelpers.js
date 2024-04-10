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
 * Utilizes Order to JSON Object for REST API call
 * @param {dw.order.Order} order - Order to generate return label.
 * @returns {Object} - JSON Object to generate label
 */
function utilizeOrder(order) {
    const Locale = require('dw/util/Locale');
    const ReturnsUtils = require('*/cartridge/scripts/orders/ReturnsUtils');

    const orderCustomerLocale = order.custom.customerLocale;
    const currentLocale = Locale.getLocale(request.locale);
    const countryCode = !empty(orderCustomerLocale) ? orderCustomerLocale.split('_')[1] : !empty(currentLocale) ? currentLocale.getCountry() : null;

    const requestBody = {
        requestedShipment: {
            shipper: {
                address: {
                    streetLines: [],
                    city: '',
                    postalCode: '',
                    countryCode: ''
                },
                contact: {
                    phoneNumber: '+31207155100',
                    companyName: 'Under Armour'
                }
            },
            recipients: [
                {
                    address: {
                        streetLines: [],
                        city: '',
                        postalCode: '',
                        countryCode: ''
                    },
                    contact: {
                        phoneNumber: '+31207155100',
                        companyName: 'Under Armour Returns'
                    }
                }
            ],
            shippingChargesPayment: {
                paymentType: 'SENDER',
                payor: {
                    responsibleParty: {
                        address: {
                            streetLines: [],
                            city: '',
                            postalCode: '',
                            countryCode: ''
                        },
                        contact: {
                            phoneNumber: '+31207155100',
                            companyName: 'Under Armour Returns'
                        },
                        accountNumber: {
                            value: ''
                        }
                    }
                }
            },
            customsClearanceDetail: {
                dutiesPayment: {
                    paymentType: 'SENDER'
                },
                isDocumentOnly: false,
                commodities: [
                    {
                        description: 'Commodity description',
                        countryOfManufacture: 'NL',
                        quantity: 1,
                        quantityUnits: 'PCS',
                        unitPrice: {
                            amount: 1,
                            currency: 'EUR'
                        },
                        customsValue: {
                            amount: 1,
                            currency: 'EUR'
                        },
                        weight: {
                            units: 'KG',
                            value: 1
                        }
                    }
                ]
            },
            serviceType: 'INTERNATIONAL_ECONOMY',
            packagingType: 'YOUR_PACKAGING',
            pickupType: 'DROPOFF_AT_FEDEX_LOCATION',
            labelSpecification: {
                labelStockType: 'PAPER_4X6',
                imageType: 'PDF'
            },
            requestedPackageLineItems: [
                {
                    weight: {
                        units: 'KG',
                        value: 1
                    }
                }
            ]
        },
        labelResponseOptions: 'LABEL',
        accountNumber: {
            value: ''
        }
    };

    const returnsUtil = new ReturnsUtils();
    const shipperAddressObj = JSON.parse(returnsUtil.getPreferenceValue('returnFromAddress', orderCustomerLocale));
    const warehouseAddress = JSON.parse(returnsUtil.getPreferenceValue('returnAddress', orderCustomerLocale));

    // Sender details
    const shipperAddress = requestBody.requestedShipment.shipper.address;
    shipperAddress.streetLines = [shipperAddressObj.address + (!empty(shipperAddressObj.address2) ? (' ' + shipperAddressObj.address2) : '')];
    shipperAddress.city = shipperAddressObj.city || shipperAddress.city;
    shipperAddress.postalCode = shipperAddressObj.postalCode ? replaceSpacePostalCode(shipperAddressObj.postalCode) : '' || shipperAddress.postalCode;
    shipperAddress.countryCode = shipperAddressObj.countryCode || shipperAddress.countryCode;

    const shipperContact = requestBody.requestedShipment.shipper.contact;
    shipperContact.phoneNumber = warehouseAddress.phone || shipperContact.phoneNumber;
    shipperContact.companyName = shipperAddressObj.attentionName || shipperAddressObj.name || shipperContact.companyName;


    // Recipient details
    const recipientAddress = requestBody.requestedShipment.recipients[0].address;
    recipientAddress.streetLines = [warehouseAddress.address + (!empty(warehouseAddress.address2) ? (' ' + warehouseAddress.address2) : '')];
    recipientAddress.city = warehouseAddress.city || recipientAddress.city;
    recipientAddress.postalCode = replaceSpacePostalCode(warehouseAddress.postalCode) || recipientAddress.postalCode;
    recipientAddress.countryCode = warehouseAddress.countryCode || recipientAddress.countryCode;

    const recipientContact = requestBody.requestedShipment.recipients[0].contact;
    recipientContact.phoneNumber = warehouseAddress.phone || recipientContact.phoneNumber;
    recipientContact.companyName = warehouseAddress.attentionName || warehouseAddress.name || recipientContact.companyName;

    // ShippingChargesPayment
    const shippingChargesPayment = requestBody.requestedShipment.shippingChargesPayment;
    shippingChargesPayment.payor.responsibleParty.address = shipperAddress;
    shippingChargesPayment.payor.responsibleParty.contact = shipperContact;
    shippingChargesPayment.payor.responsibleParty.accountNumber.value = warehouseAddress.accountNumber;

    if (countryCode === 'GB') {
        requestBody.requestedShipment.serviceType = 'FEDEX_NEXT_DAY_END_OF_DAY';
    }

    requestBody.accountNumber.value = warehouseAddress.accountNumber;

    return requestBody;
}

/**
 * Call Fedex services and fetches shipping label and tracking number
 * @param {Object} order DW Order
 * @returns {Object} returns tracking number and shipping label from UPS
 */
function fetchFedexShipmentShippingAndTrackingNumber(order) {
    const fedexServiceHelpers = require('*/cartridge/scripts/service/fedexServiceHelpers');
    const Logger = require('dw/system/Logger');
    try {
        const requestBody = utilizeOrder(order);
        const labelResponse = fedexServiceHelpers.call(requestBody);
        const pieceResponse = !empty(labelResponse) && labelResponse.output && labelResponse.output.transactionShipments ? labelResponse.output.transactionShipments[0].pieceResponses[0] : null;
        if (!empty(pieceResponse)) {
            return {
                shipLabel: pieceResponse.packageDocuments[0].encodedLabel,
                trackingNumber: pieceResponse.trackingNumber,
                ConsignmentID: pieceResponse.trackingNumber
            };
        }
        return labelResponse;
    } catch (e) {
        Logger.error('Fedex Service Calls error: ' + e.message + e.stack);
    }
    return null;
}

module.exports = {
    fetchFedexShipmentShippingAndTrackingNumber: fetchFedexShipmentShippingAndTrackingNumber
};
