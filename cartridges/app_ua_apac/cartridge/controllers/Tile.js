'use strict';

var server = require('server');
server.extend(module.superModule);

server.append('Show', function (req, res, next) {
    let viewData = res.getViewData();
    var product = viewData.product;
    if (
        product.productType === 'master' &&
        product.memberPricing.hasMemberPrice &&
        product.memberPricing.memberPriceVariants.length
    ) {
        viewData.variantProductModel = product.memberPricing.memberPriceVariants[0];
    }

    res.setViewData(viewData);
    next();
});
/* eslint-enable prefer-const */
module.exports = server.exports();
