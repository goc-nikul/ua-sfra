'use strict';

const Status = require('dw/system/Status');
var ProductListMgr = require('dw/customer/ProductListMgr');
var ProductList = require('dw/customer/ProductList');
var Transaction = require('dw/system/Transaction');
var collections = require('*/cartridge/scripts/util/collections');

const Logger = require('dw/system/Logger').getLogger('processWishlists', 'processWishlists');

var chunks = 0;
var wishlists;
var wishlistsModifiedCount = 0;
var wishlistsDeletedCount = 0;
var exceptionProducts;
var stockDateDaysLimit;

/**
 * Get all wishlists as iterator
 * @param {*} parameters - step parameters
 *  exceptionProducts - list of product IDs that should be skipped
 *  stockDateDaysLimit - hol long to keep products with stock 0 in the wishlist
 * @returns {void} - Returns void
 */
exports.beforeStep = function (parameters) { // eslint-disable-line consistent-return
    wishlists = ProductListMgr.queryProductLists('type = {0}', null, ProductList.TYPE_WISH_LIST);
    exceptionProducts = parameters.exceptionProducts ? parameters.exceptionProducts.split(',').map(item => item.trim()) : [];
    stockDateDaysLimit = parameters.stockDateDaysLimit || 365;
};

exports.getTotalCount = function () {
    Logger.info('Total wishlist count {0}', wishlists.count);
    return wishlists.count;
};

/**
 * Reads single wishlist
 * @returns {dw.customer.ProductList|null} wishlist
 */
exports.read = function () {
    while (!empty(wishlists) && wishlists.hasNext()) {
        return wishlists.next();
    }
    return null;
};

/**
 * Process products inside single wishlist
 * @param {dw.customer.ProductList} wishlist single wishlists
 * @return {void} - Returns void
 */
exports.process = function (wishlist) { // eslint-disable-line consistent-return
    var productListItemCollection = wishlist.getProductItems();
    var isWishlistModified = false;
    var isWishlistEmpty = productListItemCollection.size() === 0;

    collections.forEach(productListItemCollection, function (productListItem) { // eslint-disable-line consistent-return
        var isException = exceptionProducts.indexOf(productListItem.productID) > -1;
        var product = productListItem.product;

        // Product is null when product is not in catalog any more. Remove these products unless those are listed as exception
        var isForRemoval = !product && !isException;

        if (product) {
            // Check if product is online (including master product)
            var masterProduct = product.isVariant() ? product.getMasterProduct() : product;
            var isOnline = masterProduct && masterProduct.isOnline();
            isException = exceptionProducts.indexOf(product.ID) > -1 || exceptionProducts.indexOf(masterProduct.ID) > -1;

            // Remove products that are offline unless those are listed as exception
            isForRemoval = !isOnline && !isException;
            if (isOnline) {
                var isGiftCard = product.custom.giftCard && product.custom.giftCard.value && (product.custom.giftCard.value.equals('GIFT_CARD') || product.custom.giftCard.value.equals('EGIFT_CARD'));

                if (!isException && !isGiftCard) {
                    // Check stock (stock = 0 and date > 365d)
                    var avm = product.getAvailabilityModel();
                    var isInStock = avm.isInStock();

                    // Stock is 0, inspect the date
                    if (!isInStock) {
                        var invRec = avm.getInventoryRecord();
                        if (!invRec) {
                            // Inventory record is not defined, check master product
                            avm = masterProduct.getAvailabilityModel();
                            isInStock = avm.isInStock();
                            if (!isInStock) {
                                isForRemoval = true;
                                Logger.debug('Removal Reason: Product {0} does not have inventory record defined. Wishlist {1}', productListItem.productID, wishlist.ID);
                            }
                        } else {
                            // Inventory record is defined, check the date
                            var stockDate = invRec ? invRec.lastModified : null;
                            if (stockDate) {
                                var now = new Date();
                                var stockDateDaysLimitMs = stockDateDaysLimit * 24 * 60 * 60 * 1000;
                                var isStockDateTooOld = (now.getTime() - stockDate.getTime()) > stockDateDaysLimitMs;
                                isForRemoval = isStockDateTooOld && !isInStock; // (stock = 0 and date > 365)
                                if (isForRemoval) {
                                    Logger.debug('Removal Reason: Product {0} is out of stock and last update was {1} days ago. Wishlist {2}', productListItem.productID, stockDateDaysLimit, wishlist.ID);
                                }
                            }
                        }
                    }
                } else {
                    Logger.debug('Keep Product {0} because it is listed as exception. Product is gift card: {1}. Wishlist {2}', productListItem.productID, isGiftCard, wishlist.ID);
                }
            } else {
                Logger.debug('Removal Reason: Product {0} in offline or its master product is offline. Wishlist {1}', productListItem.productID, wishlist.ID);
            }
        } else if (isException) {
            Logger.debug('Keep Product {0} because it is listed as exception, even though it is not in catalog any more. Wishlist {1}', productListItem.productID, wishlist.ID);
        } else {
            Logger.debug('Removal Reason: Product {0} is not in catalog any more. Wishlist {1}', productListItem.productID, wishlist.ID);
        }

        // Remove product from the wishlist
        if (isForRemoval) {
            try {
                Transaction.wrap(function () {
                    wishlist.removeItem(productListItem);
                });
                isWishlistModified = true;
            } catch (e) {
                Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', 'ERROR: Exception occurred while deleting product', e.name, e.message, e.fileName, e.lineNumber, e.stack);
                return false;
            }
        }
    });

    // Remove empty wishlists
    if (isWishlistModified || isWishlistEmpty) {
        // Remove empty wishlists
        if (wishlist.items.empty) {
            try {
                Transaction.wrap(function () {
                    ProductListMgr.removeProductList(wishlist);
                });
                wishlistsDeletedCount++;
            } catch (e) {
                Logger.error('{0}:{1}: {2} ({3}:{4}) \n{5}', 'ERROR: Exception occurred while deleting wishlist', e.name, e.message, e.fileName, e.lineNumber, e.stack);
                return false;
            }
        }
        if (isWishlistModified) {
            wishlistsModifiedCount++;
        }
    }
};

exports.write = function () {
    return;
};

/**
 * Executes after processing of every chunk
 */
exports.afterChunk = function () { // eslint-disable-line consistent-return
    chunks++;
    Logger.info('Chunk {0} processed successfully', chunks);
};

/**
 * Executes after processing all the chunk and returns the status
 * @returns {Object} OK
 */
exports.afterStep = function () {
    Logger.info('Wishlists modified: {0}', wishlistsModifiedCount);
    Logger.info('Wishlists deleted: {0}', wishlistsDeletedCount);
    return new Status(Status.OK, 'OK', 'Finished');
};
