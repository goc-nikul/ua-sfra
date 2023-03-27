'use strict';

var ProductListItemModel = require('*/cartridge/models/productListItem');
var productHelper = require('*/cartridge/scripts/helpers/ProductHelper');

/**
 * @typedef config
 * @type Object
 */
/**
 * creates a plain object that represents a productList
 * @param {dw.customer.ProductList} productListObject - User's productList object
 * @param {Object} config - configuration object
 * @returns {Object} an object that contains information about the users productList
 */
function createProductListObject(productListObject, config) {
    var enableAvailablePerLocale = productHelper.enableAvailablePerLocale();
    var PAGE_SIZE = 15;
    var pageSize = config.pageSize || PAGE_SIZE;
    var pageNumber = config.pageNumber || 1;
    var totalNumber = 0;
    var result;
    var publicView = config.publicView;
    var sortRule = config.sortRule;
    var pageType = config.pageType;
    if (productListObject) {
        result = {
            owner: {
                exists: !!productListObject.owner,
                firstName: productListObject.owner ? productListObject.owner.profile.firstName : false,
                lastName: productListObject.owner ? productListObject.owner.profile.lastName : false
            },
            publicList: productListObject.public,
            UUID: productListObject.UUID,
            publicView: publicView,
            pageNumber: pageNumber,
            items: [],
            type: productListObject.type
        };

        var productListItem;
        var count = productListObject.items.getLength();
        var listProducts = productListObject.items;
        var PropertyComparator = require('dw/util/PropertyComparator');

        if (sortRule) {
            var ArrayList = require('dw/util/ArrayList');
            listProducts = new ArrayList(productListObject.items);
            var comparatorRule = new PropertyComparator('creationDate', false);
            if (sortRule === 'OldestAdded') {
                comparatorRule = new PropertyComparator('creationDate', true);
            }
            listProducts.sort(comparatorRule);
        }
        // prioritize saved-items over wishlisted-items`in cart page
        if (pageType && pageType === 'cart') {
            var sortComparatorRule = new PropertyComparator('custom.wishlistedFromCart', true);
            listProducts.sort(sortComparatorRule);
        }

        listProducts.toArray().forEach(function (item) {
            productListItem = new ProductListItemModel(item).productListItem;
            if (productListItem && item.product) {
                if (config.publicView && item.product.master) {
                    count--;
                } else if (totalNumber < (pageSize * pageNumber)) {
                    if ((enableAvailablePerLocale && item.product.custom.availableForLocale.value !== 'No') || !enableAvailablePerLocale) {
                        result.items.push(productListItem);
                        totalNumber++;
                    } else {
                        count--;
                    }
                } else {
                    totalNumber++;
                }
            }
        });

        result.length = count;
        result.showMore = !(totalNumber <= pageSize * pageNumber);
        result.pageNumber = pageNumber;
    } else {
        result = null;
    }
    return result;
}

/**
 * @typedef config
 * @type Object
 */
/**
 * List class that represents a productList
 * @param {dw.customer.ProductList} productListObject - User's productlist
 * @param {Object} config - configuration object
 * @constructor
 */
function productList(productListObject, config) {
    this.productList = createProductListObject(productListObject, config);
}

module.exports = productList;
