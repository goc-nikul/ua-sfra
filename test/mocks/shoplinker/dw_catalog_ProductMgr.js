var Product = require('./dw_catalog_Product');

class ProductMgr {
    static getProduct(productID) {
        this.product = new Product(productID);
        return this.product;
    }
    static setProduct(product) {
        this.product = product;
    }
}

module.exports = ProductMgr;
