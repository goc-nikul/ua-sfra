'use strict';

var Logger = require('dw/system/Logger').getLogger('Narvar');

let URLUtils = require('dw/web/URLUtils');
var ImageModel = require('*/cartridge/models/product/productImages');

/**
 *
 * @param {string} jsonString - JSON string to be parsed
 * @returns {Object} - parsed json object
 */
function parseJsonSafely(jsonString) {
    var jsonObject = {};
    try {
        jsonObject = JSON.parse(jsonString);
    } catch (e) {
        Logger.error('narvarShippingHelper.js JSON parse error:' + e.message);
    }

    return jsonObject;
}

/**
 * @param {orderObj} orderObj model.
 * @param {Object} carrierMapping carrierMapping.
 * @returns {orderObj} orderObj model.
 */
function getShippedOrderObj(orderObj, carrierMapping) {
    var lineItem = orderObj.productLineItems;
    var productItems = [];
    var shipItems = [];
    var shipments = [];
    var returnObj = {
        success: false,
        orderObject: null,
        errorMessage: 'Order or Paazl information not found'
    };

    for (var i = 0; i < lineItem.length; i++) {
        var item = lineItem[i];
        var shipjson = orderObj.custom.shippingJson;
        var pos = shipjson.search(item.product.custom.sku);
        if (pos > 0) {
            var itemImage = new ImageModel(item.product, { types: ['cartFullDesktop'], quantity: 'single' });
            var image = !empty(itemImage.cartFullDesktop[0]) && !empty(itemImage.cartFullDesktop[0].url) ? itemImage.cartFullDesktop[0].url : '';
            var productLineItem = {
                item_id: item.productID || '',
                sku: item.product.custom.sku || '',
                name: item.productName || '',
                description: item.product.longDescription || '',
                quantity: item.quantity.value || '',
                unit_price: item.basePrice.valueOrNull || '',
                categories: item.categoryID || [],
                item_image: image || '',
                item_url: URLUtils.https('Product-Show', 'pid', item.productID).toString() || '',
                is_final_sale: false,
                fulfillment_status: item.shipment.shippingStatus.displayValue || '',
                is_gift: item.gift || '',
                attributes: {
                    color: item.product.custom.colorgroup,
                    size: item.product.custom.size
                },
                events: null
            };
            productItems.push(productLineItem);
        }
    }

    var shippingJson = orderObj.custom.shippingJson ? parseJsonSafely(orderObj.custom.shippingJson) : {};

    for (var j = 0; j < shippingJson.length; j++) {
        var shipmentItemJSON = shippingJson[j];
        var paazlInfoJson = orderObj.defaultShipment.custom.paazlDeliveryInfo ? parseJsonSafely(orderObj.defaultShipment.custom.paazlDeliveryInfo) : {};
        if (!paazlInfoJson || Object.keys(paazlInfoJson).length < 1) {
            returnObj.success = false;
            returnObj.errorMessage = 'NarvarShippingHelper.js - orderObj.defaultShipment.custom.paazlDeliveryInfo is null or empty, orderID: ' + orderObj.orderNo;
            break;
        }
        returnObj.success = true;
        returnObj.errorMessage = '';
        var itemKeys = Object.keys(shipmentItemJSON.items);
        var identifier = carrierMapping && carrierMapping.narvar && (typeof carrierMapping.narvar === 'object') ? carrierMapping.narvar[paazlInfoJson.identifier] : '';
        var carrier = identifier || paazlInfoJson.identifier || '';

        for (let k = 0; k < itemKeys.length; k++) {
            var itemKey = itemKeys[k];
            var shipItem = {
                sku: itemKey || '',
                quantity: shipmentItemJSON.items[itemKey] || ''
            };
            shipItems.push(shipItem);
        }
        var shipmentItem = {
            ship_source: orderObj.shipments[0].shippingMethod.custom.narvarShipSourceCode.displayValue || '',
            items_info: shipItems,
            carrier: carrier,
            shipped_to: {
                first_name: orderObj.shipments[0].shippingAddress.firstName || '',
                last_name: orderObj.shipments[0].shippingAddress.lastName || '',
                phone: orderObj.shipments[0].shippingAddress.phone || '',
                email: orderObj.customerEmail || '',
                address: {
                    street_1: orderObj.shipments[0].shippingAddress.address1 || '',
                    street_2: orderObj.shipments[0].shippingAddress.address2 || '',
                    city: orderObj.shipments[0].shippingAddress.city || '',
                    state: orderObj.shipments[0].shippingAddress.stateCode || '',
                    zip: orderObj.shipments[0].shippingAddress.postalCode || '',
                    country: orderObj.shipments[0].shippingAddress.countryCode.value || ''
                }
            },
            ship_discount: 0,
            ship_total: orderObj.totalNetPrice.value || '',
            ship_tax: orderObj.totalTax.value || '',
            ship_date: shipmentItemJSON.date || '',
            tracking_number: shipmentItemJSON.trackingCode || ''
        };

        shipments.push(shipmentItem);
    }

    if (!empty(orderObj) && returnObj.success) {
        returnObj.orderObject = {
            order_info: {
                order_number: orderObj.orderNo || '',
                order_date: orderObj.creationDate || '',
                checkout_locale: orderObj.customerLocaleID || '',
                order_items: productItems,
                shipments: shipments,
                billing: {
                    billed_to: {
                        first_name: orderObj.billingAddress.firstName || '',
                        last_name: orderObj.billingAddress.lastName || '',
                        phone: orderObj.billingAddress.phone || '',
                        email: orderObj.customerEmail || '',
                        address: {
                            street_1: orderObj.billingAddress.address1 || '',
                            street_2: orderObj.billingAddress.address2 || '',
                            city: orderObj.billingAddress.city || '',
                            state: orderObj.billingAddress.stateCode || '',
                            zip: orderObj.billingAddress.postalCode || '',
                            country: orderObj.billingAddress.countryCode.value || ''
                        }
                    }
                },
                customer: {
                    first_name: orderObj.billingAddress.firstName || '',
                    last_name: orderObj.billingAddress.lastName || '',
                    phone: orderObj.billingAddress.phone || '',
                    email: orderObj.customerEmail || '',
                    address: {
                        street_1: orderObj.billingAddress.address1 || '',
                        street_2: orderObj.billingAddress.address2 || ' ',
                        city: orderObj.billingAddress.city || '',
                        state: orderObj.billingAddress.stateCode || '',
                        zip: orderObj.billingAddress.postalCode || '',
                        country: orderObj.billingAddress.countryCode.value || ''
                    },
                    customer_id: orderObj.customer.ID || ''
                },
                currency_code: orderObj.currencyCode || ''
            }
        };
    }

    return returnObj;
}

module.exports = {
    getShippedOrderObj: getShippedOrderObj
};
