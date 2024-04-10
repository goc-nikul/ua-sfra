'use strict';

const Logger = require('dw/system/Logger');
const ProductMgr = require('dw/catalog/ProductMgr');
const Site = require('dw/system/Site');
const BasketMgr = require('dw/order/BasketMgr');

const gaEnabled = Site.current.getCustomPreferenceValue('GAEnable') || false;
const gaId = Site.current.getCustomPreferenceValue('GAID') || '';

/**
 * @param {Object} res - Global request object
 * @returns {string} a string containing the action name.
 */
function getAction(res) {
    try {
        if ('action' in res) {
            return res.action;
        } else if ('pdict' in res && 'action' in res.pdict) {
            return res.pdict.action;
        }
    } catch (e) {
        Logger.error('gaHelpers - getAction() - {0}', e.message);
    }

    return '';
}

/**
 * @param {Object} currentBasket - Current basket
 * @returns {Array} An array containing product line items
 */
function getProductArrayFromList(currentBasket) {
    let result = [];

    if (currentBasket) {
        let productList = currentBasket.getProductLineItems().iterator();

        while (productList.hasNext()) {
            let pli = productList.next();
            let obj = {
                item_id: pli.productID,
                item_name: pli.productName
            };

            result.push(obj);
        }
    }

    return result;
}

/**
 * @param {dw.system.Request} res - SFCC request
 * @returns {Object} the datalayer object containing confirmation data.
 */
function getConfirmationDl(res) {
    const OrderMgr = require('dw/order/OrderMgr');
    let order = null;
    try {
        if ('token' in res.CurrentHttpParameterMap) {
            order = OrderMgr.getOrder(res.order ? res.order.orderNumber : res.CurrentHttpParameterMap.orderID.value, res.CurrentHttpParameterMap.token.value);
        }

        if (order) {
            let obj = {
                event: 'purchase',
                transaction_id: order.orderNo,
                value: order.getTotalGrossPrice().value.toFixed(2),
                currency: order.getCurrencyCode(),
                items: getProductArrayFromList(order)
            };

            return obj;
        }
    } catch (e) {
        Logger.error('gaHelpers - cannot retrieve order: ' + e.message);
    }

    return false;
}

/**
 * @param {dw.system.Request} res - SFCC request
 * @returns {Object} the shipping datalayer data if user is on shipping page.
 */
function getShippingDl(res) {
    try {
        const shippingStage = 'shipping';

        if ('currentStage' in res && res.currentStage === shippingStage) {
            let obj = {
                event: 'begin_checkout'
            };

            var currentBasket = BasketMgr.getCurrentBasket();
            if (currentBasket != null) {
                obj.items = getProductArrayFromList(currentBasket);
                obj.currency = currentBasket.currencyCode;
                obj.value = currentBasket.getTotalGrossPrice().value.toFixed(2);
            }
            return obj;
        }
    } catch (e) {
        Logger.error('gaHelpers:getShippingDl() - {0}', e.message);
    }

    return false;
}

/**
 * @param {Object} product - dw.Catalog.Product
 * @returns {Object} - Product object used for data layer
 */
function getProductObj(product) {
    var obj = {};
    obj.item_id = product.ID;
    var master = product.variationModel.master;
    if (product.variant) {
        obj.item_id = master.ID;
        obj.item_variant = product.ID;
    }

    obj.item_name = product.name;

    if (product.primaryCategory != null) {
        obj.item_category = product.primaryCategory.displayName;
    } else if (master && master.primaryCategory != null) {
        obj.item_category = master.primaryCategory.displayName;
    }

    if (product.priceModel.maxPrice.valueOrNull != null) {
        obj.price = product.priceModel.maxPrice.value.toFixed(2);
        obj.currencyCode = product.priceModel.maxPrice.currencyCode;
    } else if (product.priceModel.price.valueOrNull != null) {
        obj.price = product.priceModel.price.value.toFixed(2);
        obj.currencyCode = product.priceModel.price.currencyCode;
    }

    return obj;
}

/**
 * @param {Object} res - current route response object
 * @returns {Object} Object containing product datalayer
 */
function getDLPdpData(res) {
    let productId;

    try {
        if ('product' in res) productId = res.product.id;
        else if ('pdict' in res && 'product' in res.pdict) productId = res.pdict.product.id;

        if (productId) {
            var product = ProductMgr.getProduct(productId);
            let productObj = getProductObj(product);

            return {
                event: 'view_item',
                currency: productObj.currencyCode ? productObj.currencyCode : session.currency.currencyCode,
                value: productObj.price,
                items: [productObj]
            };
        }
    } catch (e) {
        Logger.error('gaHelpers:getDLPdpData() - {0}', e.message);
    }

    return {};
}
/**
 * @param {Object} product - dw.Catalog.Product
 * @returns {Object} - returns dw.order.ProductLineItem
 */
function getLineItemByProduct(product) {
    var currentBasket = BasketMgr.getCurrentBasket();

    if (currentBasket) {
        var productList = currentBasket.getProductLineItems().iterator();

        while (productList.hasNext()) {
            let pli = productList.next();

            if (pli.productID === product.ID) {
                return pli;
            }
        }
    }

    return {};
}

/**
 * @param {Object} res - current route response object
 * @returns {Object} Object containing full datalayer
 */
function getAddCartDl(res) {
    try {
        let product = res && 'ProductDetails' in res && res.ProductDetails ? res.ProductDetails : null;
        if (product) {
            let pli = getLineItemByProduct(product);
            let obj = {
                event: 'add_to_cart',
                currency: session.currency.currencyCode,
                value: pli ? pli.basePrice.value.toFixed(2) : '',
                items: [{
                    item_id: 'ID' in product ? product.ID : '',
                    item_name: 'name' in product ? product.name : ''
                }]
            };

            return obj;
        }
    } catch (e) {
        Logger.error('gaHelpers:getAddCartDl() - {0}', e.message);
    }

    return false;
}

/**
 * Main function to retrieve data layer object
 * @param {Object} res - current route response object
 * @returns {Object} Object containing full datalayer
 */
function getDataLayer(res) {
    var action = getAction(res);

    switch (action) {
        case 'Product-Show':
            return getDLPdpData(res);
        case 'Cart-cartAddedConfirmationModal':
            return getAddCartDl(res);
        case 'Checkout-Begin':
            return getShippingDl(res);
        case 'Order-Confirm':
            return getConfirmationDl(res);
        default:
            return false;
    }
}

module.exports = {
    isEnabled: gaEnabled,
    gaId: gaId,
    getDataLayer: getDataLayer,
    getAction: getAction,
    getConfirmationDl: getConfirmationDl,
    getProductArrayFromList: getProductArrayFromList,
    getLineItemByProduct: getLineItemByProduct
};
