'use strict';
var collections = require('*/cartridge/scripts/util/collections');

/* global options:true */

/**
* @constructor
* @classdesc Maps shipping line item data to Aurus Pay format
* @param {dw.util.Collection<dw.order.ProductLineItem>} item - a shipping line item from the basket
*/
function ShippingDetails(item) {
    this.L3DepartmentID = 'did';
    this.L3TarriffAmount = '';
    this.L3ProductDiscount = '';
    this.L3ProductDescription = item.ID ? item.ID : '';
    this.L3ProductUnitPrice = item.adjustedGrossPrice.value === 0 ? Number(0) : item.basePrice.value;
    this.L3ProductTaxRate = '';
    this.L3ProductQuantity = '1';
    this.L3ClassID = 'cid';
    this.L3ProductName = item.lineItemText;
    this.L3GiftWrapAmount = '';
    this.L3ProductTotalAmount = item.adjustedGrossPrice.value;
    this.L3OrderRefNumber = '';
    this.L3ProductSeqNo = '';
    this.L3ProductCode = item.ID ? item.ID : '';
    this.L3MonogramAmount = '';
    this.L3ProductTax = item.tax.value;
    this.L3UnitOfMeasure = '';
    this.L3OtherAmount = '';
    this.L3FreightAmount = '';
}

/**
* @classdesc Maps product line item data to Aurus Pay format
* @param {dw.util.Collection<dw.order.ProductLineItem>} item - a product line item from the basket
* @param {dw.util.Collection<dw.order.ProductLineItem>} unitPrice - unit price
*/
function ProductDetails(item, unitPrice) {
    this.L3DepartmentID = 'did';
    this.L3TarriffAmount = '';
    this.L3ProductDiscount = '';
    this.L3ProductDescription = item.product.longDescription !== null && item.product.longDescription !== '' ? item.product.longDescription.markup : '';
    this.L3ProductUnitPrice = unitPrice;
    this.L3ProductTaxRate = item.taxRate;
    this.L3ProductQuantity = item.quantity.value;
    this.L3ClassID = 'cid';
    this.L3ProductName = item.productName;
    this.L3GiftWrapAmount = '';
    this.L3ProductTotalAmount = item.proratedPrice.value + item.tax.value;
    this.L3OrderRefNumber = '';
    this.L3ProductSeqNo = '';
    this.L3ProductCode = item.productID;
    this.L3MonogramAmount = '';
    this.L3ProductTax = item.tax.value;
    this.L3UnitOfMeasure = '';
    this.L3OtherAmount = '';
    this.L3FreightAmount = '';
}

/**
* @classdesc Creates an array of product line items, product data for Aurus Pay
* @param {dw.util.Collection<dw.order.ProductLineItem>} allLineItems - All product
* line items of the basket
* @param {string} isPayPal - the value of isPayPal
* @returns {Array} an array of product line items. in basket
*/
function createProductLineItemsObject(allLineItems, isPayPal) {
    var lineItems = [];

    collections.forEach(allLineItems, function (item) {
        // when item's category is unassigned, return a lineItem with limited attributes
        if (!item.product) {
            lineItems.push({
                id: item.productID,
                quantity: item.quantity.value,
                productName: item.productName,
                UUID: item.UUID,
                noProduct: true
            });
            return;
        }

     // Have to do some special handling for paypal for items with discounts
        if (isPayPal) {
            var unitPrice = item.getProratedPrice().divide(item.quantity.value);
            var newLineItem;
            var qty;
            if (!item.getProratedPrice().equals(unitPrice.multiply(item.quantity.value))) {
                qty = 1;
                unitPrice = item.getProratedPrice().subtract(unitPrice.multiply(item.quantity.value - 1));
                /* eslint-disable block-scoped-var */
                newLineItem = new ProductDetails(item, unitPrice.value, qty);
                lineItems.push(newLineItem);
                /* eslint-enable block-scoped-var */
            } else {
                qty = item.quantity.value;
                unitPrice = item.getProratedPrice().divide(item.quantity.value);
                /* eslint-disable block-scoped-var */
                newLineItem = new ProductDetails(item, unitPrice.value, qty);
                lineItems.push(newLineItem);
                /* eslint-enable block-scoped-var */
            }
        } else {
            /* eslint-disable block-scoped-var */
            newLineItem = new ProductDetails(item, item.basePrice.value, item.quantity.value);

            if (newLineItem.bonusProductLineItemUUID === 'bonus' || !newLineItem.bonusProductLineItemUUID) {
                lineItems.push(newLineItem);
                /* eslint-enable block-scoped-var */
            }
            /* eslint-enable block-scoped-var */
        }
    });
    return lineItems;
}

/**
 * Loops through all of the product line items and adds the quantities together.
 * @param {dw.util.Collection<dw.order.ProductLineItem>} items - All product
 * line items of the basket
 * @returns {number} a number representing all product line items in the lineItem container.
 */
function getTotalQuantity(items) {
    var totalQuantity = 0;
    collections.forEach(items, function (lineItem) {
        totalQuantity += lineItem.quantity.value;
    });

    return totalQuantity;
}

/**
 * forEach method for dw.util.Collection subclass instances
 * @param {dw.util.Collection} collection - Collection subclass instance to map over
 * @param {Function} callback - Callback function for each item
 * @param {Object} [scope] - Optional execution scope to pass to callback
 * @returns {void}
 */
function forEach(collection, callback, scope) {
    var iterator = collection.iterator();
    var index = 0;
    var item = null;
    while (iterator.hasNext()) {
        item = iterator.next();
        if (scope) {
            callback.call(scope, item, index, collection);
        } else {
            callback(item, index, collection);
        }
        index++;
    }
}

/**
* @constructor
* @classdesc Creates an Object of shipping line items, product data for Aurus Pay
* @param {dw.util.Collection<dw.order.Order>} order - the entire order object
* @returns {Object} an Object with the count of shipping line items and the shipping line item in Aurus Pay format
*/
function createShippingLineItemObject(order) {
    // There should really only be one Shipping Line Item
    var newLineItem;
    var shippingLineItems = 0;

    // <dw.util.Collection>
    var shippingLineItemCollection = order.getDefaultShipment().getShippingLineItems();

    forEach(shippingLineItemCollection, function (item) {
        newLineItem = new ShippingDetails(item);
        shippingLineItems++;
    });

    return {
        newLineItem: newLineItem,
        shippingLineItems: shippingLineItems
    };
}

/**
* @constructor
* @classdesc class that represents a collection of line items and total quantity of
* items in current basket or per shipment
* @param {dw.order.Order} order - The order object that has been created
*/
function Level3ProductsData(order) {
    // Boolean - Is Paypal the payment method
    var isPayPal;

    if (order.paymentInstruments.length > 0 && order.paymentInstruments[0].paymentMethod === 'PayPal') {
        isPayPal = true;
    }

    if (!isPayPal) {
        this.Level3Products = { Level3Product: createProductLineItemsObject(order.allProductLineItems) };
        this.Level3ProductCount = getTotalQuantity(order.allProductLineItems);
    } else if (isPayPal) { // i.e PayPal Payment Method
        this.Level3Products = { Level3Product: createProductLineItemsObject(order.allProductLineItems, isPayPal) };
        // Add Shipping Line Item to Level3Products
        var shippingLineItemObj = createShippingLineItemObject(order);
        this.Level3Products.Level3Product.push(shippingLineItemObj.newLineItem);
        // Get the length of the ProductLineItemObject
        this.Level3ProductCount = createProductLineItemsObject(order.allProductLineItems, isPayPal).length + shippingLineItemObj.shippingLineItems;
    } else {
        this.items = [];
        this.totalQuantity = 0;
    }
}

module.exports = Level3ProductsData;
