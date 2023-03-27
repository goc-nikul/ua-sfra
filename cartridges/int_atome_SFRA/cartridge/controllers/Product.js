/* eslint-disable no-nested-ternary */
'use strict';

var server = require('server');
server.extend(module.superModule);

/**
 * Set Atome installment Price through Ajax wth currency
 */
server.append('Variation', function (req, res, next) {
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var atomeHelper = require('~/cartridge/scripts/atome/helpers/atomeHelpers');
    var params = req.querystring;
    var product = ProductFactory.get(params);
    var viewData = res.getViewData();
    var currencySymbol = req.session.currency.symbol;
    var installmentPrice;
    if (product.price && product.price.sales) {
    	installmentPrice = product.price.sales.value;
    } else if (product.price && product.price.min.sales.value) {
    	installmentPrice = product.price.min.sales.value;
    } else if (product.price) {
    	installmentPrice = product.price.value;
    }
    viewData.installmentPrice = installmentPrice && (currencySymbol + atomeHelper.toFixed(installmentPrice / 3, 2));
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
