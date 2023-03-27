'use strict';

var server = require('server');

server.extend(module.superModule);

server.prepend(
    'Begin',
    function (req, res, next) {
        var shoprunnerShippingMethodSelection = require('~/cartridge/scripts/ShoprunnerShippingMethodSelection').ShoprunnerShippingMethodSelection;
        var selectedShipMethod = server.forms.getForm('shipping').shippingAddress.shippingMethodID.htmlValue;
        var viewdata = res.getViewData();
        if ((empty(selectedShipMethod) || selectedShipMethod === 'shoprunner') && viewdata.queryString !== 'stage=payment') {
            shoprunnerShippingMethodSelection();
        }
        return next();
    }
);

module.exports = server.exports();
