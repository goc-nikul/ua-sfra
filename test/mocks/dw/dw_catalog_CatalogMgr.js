'use strict';

let Product = require('./dw_catalog_Product');
let Collection = require('./dw_util_Collection');

class CatalogMgr {
    static getCategory(categoryID) {
        this.ID = categoryID;
        this.getProducts = function () {
            var productCollection = new Collection(new Product());
            return productCollection;
        };
        this.hasOnlineSubCategories = function () {
            return false;
        };
        this.getOnlineProducts = function () {
            return [new Product()];
        };
        this.hasOnlineProducts = function () {
            return false;
        };
        return this;
    }
}

module.exports = CatalogMgr;
