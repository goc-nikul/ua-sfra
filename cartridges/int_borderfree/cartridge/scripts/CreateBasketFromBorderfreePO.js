'use strict';

/**
 * Pipelet for fetching unacknowledged orders from border free.
 * 
 * @input poOrder : Object mandatory, PO Order to be processed.
 * @input Basket : dw.order.Basket
 */


const Logger = require('dw/system/Logger');
const Util = require('~/cartridge/scripts/utils/Util');

/**
 * 
 * @param args
 * @returns
 */
function execute(args) {
    try {
        // NOTE args.Basket works on controllers -- but not on pipelines
        var poOrder = JSON.parse(args.poOrder);
        buildBasket(args.Basket, poOrder);	

        if ('object' in args.Basket) {
            normalizeBasket(args.Basket.object);
        } else {
	        normalizeBasket(args.Basket);
	    }
    } catch(e) {
        var errormsg = e;
        Logger.error(e);
        Logger.info('CreateBasketFromBorderfreePO execute function ends with error', + e.message);
        return PIPELET_ERROR;
    }

    return PIPELET_NEXT;
}

function buildBasket(basket, poOrder) {
    var shipment = basket.getDefaultShipment();
    var customAttributes;
    for (var i=0; i < poOrder.basketDetails.basketItems.length; i++) {
        // Log the Product ID coming in response from Borderfree
        // Fetch product ID from custom attribute which is being passed to Borderfree from cartProductCard.isml
        customAttributes = JSON.parse(poOrder.basketDetails.basketItems[i].custom);
        Logger.info('productId in Borderfree response - {0}', customAttributes.productId);
        var productToAdd = dw.catalog.ProductMgr.getProduct(customAttributes.productId);
        if(!empty(productToAdd)) {
            var lineItem = basket.createProductLineItem(customAttributes.productId, shipment);
            lineItem.setPriceValue(poOrder.basketDetails.basketItems[i].productListPrice * poOrder.basketDetails.basketItems[i].productQuantity);
            lineItem.setQuantityValue(poOrder.basketDetails.basketItems[i].productQuantity);
        }
    }
    Logger.info('LineItem created successfully');
}

function normalizeBasket(basket) {
    Logger.info('normalizeBasket execution starts');
    var lineItems = basket.allProductLineItems;
    for (var i=0; i < lineItems.length; i++) {
        if (!lineItems[i].priceValue) {
            lineItems[i].setPriceValue(0);
        }
    }
    Logger.info('normalizeBasket execution ends');
}

module.exports = {
    execute: execute
};