'use strict';

var server = require('server');

server.extend(module.superModule);

server.prepend(
    'UpdateShippingMethodsList',
    function (req, res, next) {
        var shoprunnerShippingMethodSelection = require('~/cartridge/scripts/ShoprunnerShippingMethodSelection').ShoprunnerShippingMethodSelection;
        var selectedShipMethod = server.forms.getForm('shipping').shippingAddress.shippingMethodID.htmlValue;
        if (selectedShipMethod != null && selectedShipMethod === 'shoprunner') {
            shoprunnerShippingMethodSelection();
        }
        return next();
    }
);

server.prepend(
    'SubmitShipping',
    function (req, res, next) {
        var shoprunnerShippingMethodSelection = require('~/cartridge/scripts/ShoprunnerShippingMethodSelection').ShoprunnerShippingMethodSelection;
        shoprunnerShippingMethodSelection();

        return next();
    }
);

module.exports = server.exports();
