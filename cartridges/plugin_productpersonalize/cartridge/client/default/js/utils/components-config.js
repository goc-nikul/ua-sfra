'use strict';

var base = require('org/utils/components-config');

var references = base.references;
references.productDetail = require('../components/product/ProductDetail').default;
references.cartTile = require('../components/product/CartTile').default;
references.editBasketProduct = require('../components/common/EditBasketProduct').default;

module.exports = {
    configuration: base.configuration,
    references: references
};
