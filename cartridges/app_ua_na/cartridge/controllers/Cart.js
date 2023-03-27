'use strict';

var server = require('server');

server.extend(module.superModule);

server.append('EditProductLineItem', function (req, res, next) {
    var viewData = res.getViewData();
    var arrayHelper = require('*/cartridge/scripts/util/array');
    var ProductFactory = require('*/cartridge/scripts/factories/product');
    var params = req.form;
    var uuid = req.form.uuid ? req.form.uuid : '';
    if (!empty(uuid)) {
        var prod = ProductFactory.get(params);
        var productQuantities = prod ? prod.quantities : null;
        if (productQuantities !== null) {
            var cartModel = viewData.cartModel;
            if (cartModel) {
                var cartItem = arrayHelper.find(cartModel.items, function (item) {
                    return item.UUID === uuid;
                });
                cartItem.quantities = productQuantities;
            }
        }
    }
    res.setViewData(viewData);
    next();
});

module.exports = server.exports();
