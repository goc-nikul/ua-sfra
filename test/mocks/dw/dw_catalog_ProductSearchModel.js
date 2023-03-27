'use strict';

/* eslint-disable */

class ProductSearchModel {
    constructor() {
        this.searchPhrase = '';
        this.categoryID = '';
        this.productID = '';
        this.priceMin = '';
        this.priceMax = '';
        this.sortingRule = '';
        this.recursiveCategorySearch = false;
        this.count = 0;
    }

    setSearchPhrase(searchPhrase) {
        this.searchPhrase = searchPhrase;
    }

    setCategoryID(categoryID) {
        this.categoryID = categoryID;
    }

    setProductID(productID) {
        this.productID = productID;
    }

    setPriceMin(priceMin) {
        this.priceMin = priceMin;
    }

    setPriceMax(priceMax) {
        this.priceMax = priceMax;
    }

    setSortingRule(sortingRule) {
        this.sortingRule = sortingRule;
    }

    setRecursiveCategorySearch(recursiveCategorySearch) {
        this.recursiveCategorySearch = recursiveCategorySearch;
    }

    search() {
        this.count = 1;
        return;
    }

    getProductSearchHit(product) {
        return {
            ID: 'testProduct'
        };
    }

    getSearchRedirect (queryString) {
        return {
            getLocation: function () {
                return 'some value';
            }
        };
    }

    getProductSearchHits() {
        return {
            asList: function () {
                var searchHit = []
                var productData = {};
                productData.getProduct = function () {
                    var Product = require('./dw_catalog_Product');
                    return new Product();
                }
                searchHit.push(productData);
                return searchHit;
            }
        };
    }
}

module.exports = ProductSearchModel;
