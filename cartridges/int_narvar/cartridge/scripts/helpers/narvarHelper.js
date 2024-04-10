'use strict';

var ImageModel = require('*/cartridge/models/product/productImages');
let URLUtils = require('dw/web/URLUtils');

/**
 * @param {orderObj} orderObj model.
 * @returns {orderObj} orderObj model.
 */
function getRequestObj(orderObj) {
    var lineItem = orderObj.productLineItems;
    var productItems = [];
    for (var i = 0; i < lineItem.length; i++) {
        var item = lineItem[i];
        var itemImage = new ImageModel(item.product, { types: ['cartFullDesktop'], quantity: 'single' });
        var image = !empty(itemImage.cartFullDesktop[0]) && !empty(itemImage.cartFullDesktop[0].url) ? itemImage.cartFullDesktop[0].url : '';
        var productLineItem = {
            item_id: item.productID || '',
            sku: item.productID || '',
            name: item.productName || '',
            description: item.product.longDescription || '',
            quantity: item.quantity.value || '',
            unit_price: item.basePrice.valueOrNull || '',
            categories: item.categoryID || [],
            item_image: image || '',
            item_url: URLUtils.https('Product-Show', 'pid', item.productID).toString() || '',
            is_final_sale: false,
            fulfillment_status: item.shipment.shippingStatus.displayValue === 'NOTSHIPPED' ? 'NOT_SHIPPED' : item.shipment.shippingStatus.displayValue || '',
            is_gift: item.gift || '',
            attributes: {
                color: item.product.custom.colorgroup,
                size: item.product.custom.size
            },
            events: [
                {
                    event: 'PRESHIPMENT',
                    quantity: item.quantity.value || '',
                    sequence: item.position || ''
                }
            ]
        };
        productItems.push(productLineItem);
    }
    return !empty(orderObj) ? {
        order_info: {
            order_number: orderObj.orderNo || '',
            order_date: orderObj.creationDate || '',
            checkout_locale: orderObj.customerLocaleID || '',
            order_items: productItems,
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
                    street_2: orderObj.billingAddress.address2 || '',
                    city: orderObj.billingAddress.city || '',
                    state: orderObj.billingAddress.stateCode || '',
                    zip: orderObj.billingAddress.postalCode || '',
                    country: orderObj.billingAddress.countryCode.value || ''
                },
                customer_id: orderObj.customer.ID || ''
            },
            currency_code: orderObj.currencyCode || ''
        }
    } : {};
}


module.exports = {
    getRequestObj: getRequestObj
};
