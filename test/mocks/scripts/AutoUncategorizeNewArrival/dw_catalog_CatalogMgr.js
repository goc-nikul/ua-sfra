'use strict';

let Product = require('./dw_catalog_Product');
let Collection = require('../../dw/dw_util_Collection');

class CatalogMgr {
    static getCategory(categoryID) {
        this.ID = categoryID;
        this.getID = function () {
            return this.ID;
        };
        this.getDisplayName = function () {
            return 'Category name';
        };
        this.getProducts = function () {
            var productCollection = new Collection(new Product());
            productCollection.add(new Product('123234', true));

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
        this.getParent = function () {
            return this.getCategory('parentcategoryid');
        };
        return this;
    }

    static getSiteCatalog() {
        return {
            getID: function () {
                return 'CatalogID';
            }
        };
    }
}

module.exports = CatalogMgr;
