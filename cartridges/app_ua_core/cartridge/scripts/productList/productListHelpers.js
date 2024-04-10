'use strict';

var ProductList = require('dw/customer/ProductList');
var base = require('lib_productlist/cartridge/scripts/productList/productListHelpers');

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being created
 */
/**
 * Retrieve the list of the customer
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {dw.customer.ProductList} list - target productList
 */
function getListNew(customer, config) {
    var productListMgr = require('dw/customer/ProductListMgr');
    var type = config.type;
    var list = null;
    if (config.type === ProductList.TYPE_WISH_LIST) {
        var productLists = productListMgr.getProductLists(customer, type);
        list = productLists && productLists.length > 0
            ? productLists[0]
            : null;
    } else if (config.type === ProductList.TYPE_GIFT_REGISTRY) {
        list = productListMgr.getProductList(config.id);
    }

    return list;
}

/**
 * Retrieve the list of the customer
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {string} pids - Wishlist Product IDs
 */
function getProductIds(customer, config) {
    var list = getListNew(customer, config);
    var pids = '';
    var collections = require('*/cartridge/scripts/util/collections');
    if (list && !list.items.empty) {
        collections.forEach(list.items, function (item) {
            pids += (pids === '') ? item.productID : ('|' + item.productID);
        });
    }
    return pids;
}

/**
 * Retrieve the list of the customer array
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} config - configuration object
 * @return {Array} result ids - Wishlist Product IDs
 */
function getProductIdsArray(customer, config) {
    var result = [];
    var list = getListNew(customer, config);
    var collections = require('*/cartridge/scripts/util/collections');
    if (list && !list.items.empty) {
        collections.forEach(list.items, function (item) {
            result.push(item.productID);
        });
    }
    return result;
}

/**
 * @typedef config
 * @type Object
 * @property {number} type - a number for what type of product list is being created
 */
/**
 * Update the privacy cache with latest wishlist
 * @param {dw.customer.Customer} customer - current customer
 * @param {Object} req - local request object
 * @param {Object} config - configuration object
 */
function updateWishlistPrivacyCache(customer, req, config) {
    var collections = require('*/cartridge/scripts/util/collections');
    var list = base.getCurrentOrNewList(customer, { type: config.type });
    if (list && list.items.length <= 10) {
        var listOfIds = collections.map(list.items, function (item) {
            return item.productID;
        });
        req.session.privacyCache.set('wishlist', listOfIds.toString());
    }
}
/**
 * @typedef config
 * @type Object
 */
/**
 * Add an Item to the current customers wishlist
 * @param {dw.customer.ProductList} list - target productList
 * @param {string} pid - The product's variation model
 * @param {Object} config - configuration object
 * @return {boolean} - boolean based on if the product was added to the wishlist
 */
base.addItem = function (list, pid, config) {
    var Transaction = require('dw/system/Transaction');

    if (!list) { return false; }

    var itemExist = base.itemExists(list, pid, config);

    if (!itemExist) {
        var ProductMgr = require('dw/catalog/ProductMgr');
        var apiProduct = ProductMgr.getProduct(pid);
        if (apiProduct.variationGroup) { return false; }

        if (apiProduct && list && config.qty) {
            try {
                Transaction.wrap(function () {
                    var productlistItem = list.createProductItem(apiProduct);

                    if (apiProduct.optionProduct) {
                        var optionModel = apiProduct.getOptionModel();
                        var option = optionModel.getOption(config.optionId);
                        var optionValue = optionModel.getOptionValue(option, config.optionValue);

                        optionModel.setSelectedOptionValue(option, optionValue);
                        productlistItem.setProductOptionModel(optionModel);
                    }

                    if (apiProduct.master) {
                        productlistItem.setPublic(false);
                    }

                    productlistItem.setQuantityValue(config.qty);
                });
            } catch (e) {
                return false;
            }
        }

        if (config.type === ProductList.TYPE_WISH_LIST) {
            updateWishlistPrivacyCache(config.req.currentCustomer.raw, config.req, config);
        }

        return true;
    } else if (itemExist && config.type === ProductList.TYPE_GIFT_REGISTRY) {
        Transaction.wrap(function () {
            itemExist.setQuantityValue(itemExist.quantityValue + config.qty);
        });

        return true;
    }

    return false;
};
/**
 * @typedef config
 * @type Object
 */
/**
 * remove an Item from the current customers productList
 * @param {dw.customer.Customer} customer - current customer
 * @param {string} pid - The product's variation model
 * @param {Object} config - configuration object
 * @return {Object} result - result object with {dw.customer.ProductList} as one of the properties or result{} with error msg
 */
base.removeItem = function (customer, pid, config) {
    var Resource = require('dw/web/Resource');
    var list = base.getCurrentOrNewList(customer, config);
    var item = base.itemExists(list, pid, config);
    var result = {};
    if (item) {
        var Transaction = require('dw/system/Transaction');
        try {
            Transaction.wrap(function () {
                list.removeItem(item);
            });
        } catch (e) {
            result.error = true;
            result.msg = Resource.msg('remove.item.failure.msg', 'productlist', null);
            result.prodList = null;
            return result;
        }
        result.error = false;
        result.prodList = list;

        if (config.type === 10) {
            updateWishlistPrivacyCache(customer, config.req, config);
        }
    }
    return result;
};
module.exports = {
    getListNew: getListNew,
    getList: base.getList,
    getProductIds: getProductIds,
    getProductIdsArray: getProductIdsArray,
    updateWishlistPrivacyCache: updateWishlistPrivacyCache,
    addItem: base.addItem,
    removeItem: base.removeItem,
    createList: base.createList,
    removeList: base.removeList,
    itemExists: base.itemExists,
    mergelists: base.mergelists,
    getItemFromList: base.getItemFromList,
    toggleStatus: base.toggleStatus,
    getCurrentOrNewList: base.getCurrentOrNewList
};
